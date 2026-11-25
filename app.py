import os
import math

from datetime import datetime, timezone
from urllib.parse import urlparse

from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from google.cloud.firestore_v1.base_query import FieldFilter

from firebase_config import get_db


# =====================================================
# FLASK CONFIGURATION
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024


# =====================================================
# FIRESTORE COLLECTION SCHEMA
# =====================================================

SCHEMA = {
    "categories": {
        "category_name": "text",
        "description": "text"
    },

    "recipes": {
        "recipe_name": "text",
        "category_id": "categories",
        "description": "text",
        "preparation_time": "int",
        "cooking_time": "int",
        "servings": "positive",
        "difficulty": "difficulty",
        "instructions": "text",
        "image_url": "optional"
    },

    "ingredients": {
        "recipe_id": "recipes",
        "ingredient_name": "text",
        "quantity": "number",
        "unit": "text"
    }
}

NAME_FIELDS = {
    "categories": "category_name",
    "recipes": "recipe_name",
    "ingredients": "ingredient_name"
}

ALLOWED_DIFFICULTIES = [
    "Easy",
    "Medium",
    "Hard"
]


# =====================================================
# GENERAL HELPER FUNCTIONS
# =====================================================

def fail(message, status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status


def success(data=None, message="Success", status=200):
    response = {
        "success": True,
        "message": message
    }

    if data is not None:
        response["data"] = data

    return jsonify(response), status


def record(doc):
    data = doc.to_dict() or {}

    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()

    data["id"] = doc.id

    return data


def current_time():
    return datetime.now(timezone.utc)


def valid_document_id(value):
    return (
        isinstance(value, str)
        and bool(value.strip())
        and "/" not in value
        and value not in (".", "..")
        and len(value.encode("utf-8")) <= 1500
    )


# =====================================================
# SERVER-SIDE VALIDATION
# =====================================================

def validate_data(db, name, raw):

    if not isinstance(raw, dict):
        raise ValueError("Invalid request data.")

    data = {}

    for field, kind in SCHEMA[name].items():

        value = raw.get(field, "")
        label = field.replace("_", " ").capitalize()

        # Numeric validation
        if kind in ("int", "positive", "number"):

            if isinstance(value, bool):
                raise ValueError(
                    f"{label} must be numeric."
                )

            try:
                number = float(value)

            except (ValueError, TypeError, OverflowError):
                raise ValueError(
                    f"{label} must be numeric."
                )

            if not math.isfinite(number):
                raise ValueError(
                    f"Invalid {label.lower()}."
                )

            if number < 0:
                raise ValueError(
                    f"{label} cannot be negative."
                )

            if kind in ("positive", "number") and number <= 0:
                raise ValueError(
                    f"{label} must be greater than zero."
                )

            if kind != "number" and not number.is_integer():
                raise ValueError(
                    f"{label} must be a whole number."
                )

            if kind != "number" and number >= 2**63:
                raise ValueError(
                    f"{label} is too large."
                )

            data[field] = (
                number if kind == "number"
                else int(number)
            )

        # Text validation
        else:

            if not isinstance(value, str):
                raise ValueError(
                    f"{label} must be text."
                )

            value = value.strip()

            if not value and kind != "optional":
                raise ValueError(
                    f"{label} is required."
                )

            if len(value) > 20000:
                raise ValueError(
                    f"{label} is too long."
                )

            # Validate linked Firestore documents
            if kind in SCHEMA:

                if not valid_document_id(value):
                    raise ValueError(
                        f"Select a valid {label.lower()}."
                    )

                linked_doc = (
                    db.collection(kind)
                    .document(value)
                    .get()
                )

                if not linked_doc.exists:
                    raise ValueError(
                        f"Selected {label.lower()} does not exist."
                    )

            # Difficulty validation
            if kind == "difficulty":

                if value not in ALLOWED_DIFFICULTIES:
                    raise ValueError(
                        "Select Easy, Medium, or Hard."
                    )

            # Image URL validation
            if field == "image_url" and value:

                parsed = urlparse(value)

                if (
                    parsed.scheme not in ("http", "https")
                    or not parsed.netloc
                ):
                    raise ValueError(
                        "Enter a valid HTTP or HTTPS image URL."
                    )

            data[field] = value

    return data


# =====================================================
# DUPLICATE RECORD VALIDATION
# =====================================================

def check_duplicate(db, name, data, rid=None):

    field = NAME_FIELDS[name]

    for doc in db.collection(name).stream():

        if doc.id == rid:
            continue

        existing = doc.to_dict() or {}

        existing_name = str(
            existing.get(field, "")
        ).strip().casefold()

        new_name = data[field].strip().casefold()

        if existing_name != new_name:
            continue

        if name == "ingredients":

            if existing.get("recipe_id") != data["recipe_id"]:
                continue

        if name == "recipes":

            if existing.get("category_id") != data["category_id"]:
                continue

        return True

    return False


# =====================================================
# HOME PAGE
# =====================================================

@app.get("/")
def home():
    return render_template("index.html")


# =====================================================
# FIRESTORE CONNECTION TEST
# =====================================================

@app.get("/api/health")
def health():

    try:

        db = get_db()

        list(
            db.collection("recipes")
            .limit(1)
            .stream()
        )

        return success(
            message="Firebase Firestore connected successfully."
        )

    except Exception:

        app.logger.exception(
            "Firestore connection failed."
        )

        return fail(
            "Firestore connection failed. Check your Firebase credentials.",
            503
        )


# =====================================================
# DASHBOARD SUMMARY
# =====================================================

@app.get("/api/summary")
def summary():

    try:

        db = get_db()

        categories = list(
            db.collection("categories").stream()
        )

        recipes = list(
            db.collection("recipes").stream()
        )

        ingredients = list(
            db.collection("ingredients").stream()
        )

        return success({
            "categories": len(categories),
            "recipes": len(recipes),
            "ingredients": len(ingredients)
        })

    except Exception:

        app.logger.exception(
            "Unable to load dashboard."
        )

        return fail(
            "Unable to load dashboard statistics.",
            500
        )


# =====================================================
# CRUD OPERATIONS
# =====================================================

@app.route(
    "/api/<name>",
    methods=["GET", "POST"]
)

@app.route(
    "/api/<name>/<rid>",
    methods=["GET", "PUT", "DELETE"]
)

def crud(name, rid=None):

    if name not in SCHEMA:
        return fail("Unknown collection.", 404)

    if rid is not None and not valid_document_id(rid):
        return fail("Invalid document ID.", 400)

    try:

        db = get_db()
        collection = db.collection(name)

        ref = (
            collection.document(rid)
            if rid else None
        )

        snapshot = ref.get() if ref is not None else None

        if snapshot is not None and not snapshot.exists:
            return fail("Record not found.", 404)

        # =============================================
        # READ OPERATIONS
        # =============================================

        if request.method == "GET":

            # Read individual record
            if snapshot is not None:

                return success(
                    data=record(snapshot)
                )

            # Read all records
            search = request.args.get(
                "q", ""
            ).strip().casefold()

            rows = [
                record(doc)
                for doc in collection.stream()
            ]

            # Include linked names in searchable values
            linked_names = {}

            if search:

                if name == "recipes":

                    linked_names = {
                        doc.id: (doc.to_dict() or {}).get(
                            "category_name", ""
                        )
                        for doc in db.collection(
                            "categories"
                        ).stream()
                    }

                elif name == "ingredients":

                    linked_names = {
                        doc.id: (doc.to_dict() or {}).get(
                            "recipe_name", ""
                        )
                        for doc in db.collection(
                            "recipes"
                        ).stream()
                    }

                link_field = {
                    "recipes": "category_id",
                    "ingredients": "recipe_id"
                }.get(name)

                filtered = []

                for row in rows:

                    values = list(row.values())

                    if link_field:
                        values.append(
                            linked_names.get(
                                row.get(link_field), ""
                            )
                        )

                    if any(
                        search in str(value).casefold()
                        for value in values
                    ):
                        filtered.append(row)

                rows = filtered

            # Sort records alphabetically
            rows.sort(
                key=lambda row: str(
                    row.get(NAME_FIELDS[name], "")
                ).casefold()
            )

            return success(data=rows)

        # =============================================
        # DELETE OPERATION
        # =============================================

        if request.method == "DELETE":

            linked_collections = {
                "categories": (
                    "recipes",
                    "category_id"
                ),

                "recipes": (
                    "ingredients",
                    "recipe_id"
                )
            }

            # Prevent deletion of linked records
            if name in linked_collections:

                child_collection, field = (
                    linked_collections[name]
                )

                linked_records = (
                    db.collection(child_collection)
                    .where(
                        filter=FieldFilter(
                            field, "==", rid
                        )
                    )
                    .limit(1)
                    .stream()
                )

                if next(iter(linked_records), None):

                    return fail(
                        f"Cannot delete this record. "
                        f"Remove its linked {child_collection} first.",
                        409
                    )

            ref.delete()

            return success(
                message="Record deleted successfully."
            )

        # =============================================
        # CREATE AND UPDATE VALIDATION
        # =============================================

        raw = request.get_json(silent=True)

        data = validate_data(
            db,
            name,
            raw
        )

        if check_duplicate(db, name, data, rid):

            return fail(
                "A record with this name already exists.",
                409
            )

        data["updated_at"] = current_time()

        # =============================================
        # CREATE OPERATION
        # =============================================

        if request.method == "POST":

            data["created_at"] = current_time()

            ref = collection.document()

            ref.set(data)

            return success(
                data=record(ref.get()),
                message="Record added successfully.",
                status=201
            )

        # =============================================
        # UPDATE OPERATION
        # =============================================

        if request.method == "PUT":

            ref.update(data)

            return success(
                data=record(ref.get()),
                message="Record updated successfully."
            )

        return fail("Method not allowed.", 405)

    except ValueError as error:

        return fail(str(error), 400)

    except Exception:

        app.logger.exception(
            "Firestore database operation failed."
        )

        return fail(
            "Database operation failed. "
            "Check your Firestore connection.",
            500
        )


# =====================================================
# ERROR HANDLERS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return fail("Page or endpoint not found.", 404)


@app.errorhandler(405)
def method_not_allowed(error):
    return fail("Method not allowed.", 405)


@app.errorhandler(413)
def request_too_large(error):
    return fail("Request is too large.", 413)


@app.errorhandler(500)
def internal_error(error):
    return fail("Internal server error.", 500)


# =====================================================
# RUN FLASK APPLICATION
# =====================================================

if __name__ == "__main__":

    port = int(os.getenv("PORT", "5000"))

    print("=" * 50)
    print("FlavorBook Recipe Organizer System")
    print(f"Website: http://127.0.0.1:{port}")
    print(f"Firestore: http://127.0.0.1:{port}/api/health")
    print("=" * 50)

    app.run(
        host="127.0.0.1",
        port=port,
        debug=False
    )