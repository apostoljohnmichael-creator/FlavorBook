import os

from datetime import datetime, timezone
from dotenv import load_dotenv
from firebase_config import get_db


# ======================================================
# FLAVORBOOK SAMPLE DATA
# Firebase Cloud Firestore
# ======================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))


# ======================================================
# SAMPLE CATEGORIES
# ======================================================

CATEGORIES = {

    "CAT001": {
        "category_name": "Main Dishes",
        "description": "Delicious meals for lunch and dinner."
    },

    "CAT002": {
        "category_name": "Soups",
        "description": "Warm and comforting soup recipes."
    },

    "CAT003": {
        "category_name": "Desserts",
        "description": "Sweet treats for every occasion."
    },

    "CAT004": {
        "category_name": "Breakfast",
        "description": "Easy and satisfying morning meals."
    },

    "CAT005": {
        "category_name": "Appetizers",
        "description": "Tasty starters and light snacks."
    }

}


# ======================================================
# SAMPLE RECIPES
# ======================================================

RECIPES = {

    "REC001": {
        "recipe_name": "Chicken Adobo",
        "category_id": "CAT001",
        "description": "A classic Filipino chicken dish with a savory and tangy sauce.",
        "preparation_time": 15,
        "cooking_time": 40,
        "servings": 4,
        "difficulty": "Easy",
        "instructions": (
            "1. Combine chicken, soy sauce, vinegar, and garlic.\n"
            "2. Marinate for 15 minutes.\n"
            "3. Transfer everything into a cooking pot.\n"
            "4. Simmer until the chicken is fully cooked.\n"
            "5. Serve with steamed rice."
        ),
        "image_url": ""
    },

    "REC002": {
        "recipe_name": "Pork Sinigang",
        "category_id": "CAT002",
        "description": "Traditional Filipino sour soup with pork and vegetables.",
        "preparation_time": 20,
        "cooking_time": 60,
        "servings": 5,
        "difficulty": "Medium",
        "instructions": (
            "1. Boil pork in water until tender.\n"
            "2. Add tomatoes and tamarind seasoning.\n"
            "3. Add vegetables.\n"
            "4. Simmer until the vegetables are cooked.\n"
            "5. Serve hot."
        ),
        "image_url": ""
    },

    "REC003": {
        "recipe_name": "Mango Float",
        "category_id": "CAT003",
        "description": "A creamy no-bake Filipino mango dessert.",
        "preparation_time": 20,
        "cooking_time": 0,
        "servings": 6,
        "difficulty": "Easy",
        "instructions": (
            "1. Slice the ripe mangoes.\n"
            "2. Mix all-purpose cream and condensed milk.\n"
            "3. Arrange graham crackers in a container.\n"
            "4. Add layers of cream and mango slices.\n"
            "5. Repeat the layers.\n"
            "6. Refrigerate for at least four hours."
        ),
        "image_url": ""
    },

    "REC004": {
        "recipe_name": "Garlic Fried Rice",
        "category_id": "CAT004",
        "description": "Classic Filipino garlic fried rice, perfect for breakfast.",
        "preparation_time": 5,
        "cooking_time": 15,
        "servings": 3,
        "difficulty": "Easy",
        "instructions": (
            "1. Heat cooking oil in a pan.\n"
            "2. Saute garlic until golden brown.\n"
            "3. Add cooked rice.\n"
            "4. Season with salt.\n"
            "5. Stir-fry and serve warm."
        ),
        "image_url": ""
    },

    "REC005": {
        "recipe_name": "Lumpiang Shanghai",
        "category_id": "CAT005",
        "description": "Crispy Filipino spring rolls filled with ground pork.",
        "preparation_time": 30,
        "cooking_time": 25,
        "servings": 6,
        "difficulty": "Medium",
        "instructions": (
            "1. Combine ground pork, carrots, and onion.\n"
            "2. Place the filling inside each wrapper.\n"
            "3. Roll tightly and seal the edges.\n"
            "4. Deep-fry until golden brown and fully cooked.\n"
            "5. Serve with your preferred dipping sauce."
        ),
        "image_url": ""
    },

    "REC006": {
        "recipe_name": "Pancit Canton",
        "category_id": "CAT001",
        "description": "Filipino stir-fried noodles with chicken and vegetables.",
        "preparation_time": 15,
        "cooking_time": 30,
        "servings": 4,
        "difficulty": "Easy",
        "instructions": (
            "1. Saute chicken until cooked.\n"
            "2. Add carrots and soy sauce.\n"
            "3. Add enough water or broth to cook the noodles.\n"
            "4. Add canton noodles.\n"
            "5. Cook until tender and serve warm."
        ),
        "image_url": ""
    }

}


# ======================================================
# SAMPLE INGREDIENTS
# ======================================================

INGREDIENTS = {

    # Chicken Adobo

    "ING001": {
        "recipe_id": "REC001",
        "ingredient_name": "Chicken",
        "quantity": 500,
        "unit": "grams"
    },

    "ING002": {
        "recipe_id": "REC001",
        "ingredient_name": "Soy Sauce",
        "quantity": 4,
        "unit": "tablespoons"
    },

    "ING003": {
        "recipe_id": "REC001",
        "ingredient_name": "Vinegar",
        "quantity": 3,
        "unit": "tablespoons"
    },

    "ING004": {
        "recipe_id": "REC001",
        "ingredient_name": "Garlic",
        "quantity": 5,
        "unit": "cloves"
    },


    # Pork Sinigang

    "ING005": {
        "recipe_id": "REC002",
        "ingredient_name": "Pork",
        "quantity": 500,
        "unit": "grams"
    },

    "ING006": {
        "recipe_id": "REC002",
        "ingredient_name": "Tomato",
        "quantity": 2,
        "unit": "pieces"
    },

    "ING007": {
        "recipe_id": "REC002",
        "ingredient_name": "Tamarind Mix",
        "quantity": 1,
        "unit": "pack"
    },

    "ING008": {
        "recipe_id": "REC002",
        "ingredient_name": "Kangkong",
        "quantity": 1,
        "unit": "bunch"
    },


    # Mango Float

    "ING009": {
        "recipe_id": "REC003",
        "ingredient_name": "Ripe Mango",
        "quantity": 3,
        "unit": "pieces"
    },

    "ING010": {
        "recipe_id": "REC003",
        "ingredient_name": "Graham Crackers",
        "quantity": 2,
        "unit": "packs"
    },

    "ING011": {
        "recipe_id": "REC003",
        "ingredient_name": "All-Purpose Cream",
        "quantity": 250,
        "unit": "ml"
    },

    "ING012": {
        "recipe_id": "REC003",
        "ingredient_name": "Condensed Milk",
        "quantity": 200,
        "unit": "ml"
    },


    # Garlic Fried Rice

    "ING013": {
        "recipe_id": "REC004",
        "ingredient_name": "Cooked Rice",
        "quantity": 3,
        "unit": "cups"
    },

    "ING014": {
        "recipe_id": "REC004",
        "ingredient_name": "Garlic",
        "quantity": 5,
        "unit": "cloves"
    },

    "ING015": {
        "recipe_id": "REC004",
        "ingredient_name": "Cooking Oil",
        "quantity": 2,
        "unit": "tablespoons"
    },

    "ING016": {
        "recipe_id": "REC004",
        "ingredient_name": "Salt",
        "quantity": 0.5,
        "unit": "teaspoon"
    },


    # Lumpiang Shanghai

    "ING017": {
        "recipe_id": "REC005",
        "ingredient_name": "Ground Pork",
        "quantity": 500,
        "unit": "grams"
    },

    "ING018": {
        "recipe_id": "REC005",
        "ingredient_name": "Carrots",
        "quantity": 2,
        "unit": "pieces"
    },

    "ING019": {
        "recipe_id": "REC005",
        "ingredient_name": "Onion",
        "quantity": 1,
        "unit": "piece"
    },

    "ING020": {
        "recipe_id": "REC005",
        "ingredient_name": "Lumpia Wrapper",
        "quantity": 20,
        "unit": "pieces"
    },


    # Pancit Canton

    "ING021": {
        "recipe_id": "REC006",
        "ingredient_name": "Canton Noodles",
        "quantity": 250,
        "unit": "grams"
    },

    "ING022": {
        "recipe_id": "REC006",
        "ingredient_name": "Chicken Breast",
        "quantity": 200,
        "unit": "grams"
    },

    "ING023": {
        "recipe_id": "REC006",
        "ingredient_name": "Carrots",
        "quantity": 1,
        "unit": "piece"
    },

    "ING024": {
        "recipe_id": "REC006",
        "ingredient_name": "Soy Sauce",
        "quantity": 3,
        "unit": "tablespoons"
    }

}


# ======================================================
# INSERT SAMPLE DATA
# ======================================================

def seed_database():

    print("=" * 55)
    print("FLAVORBOOK SAMPLE DATABASE")
    print("=" * 55)

    try:

        db = get_db()

        print("Firebase project:", db.project)

        collections = {

            "categories": CATEGORIES,
            "recipes": RECIPES,
            "ingredients": INGREDIENTS

        }

        batch = db.batch()

        created = 0
        skipped = 0

        now = datetime.now(timezone.utc)

        for collection_name, records in collections.items():

            print(f"\nChecking {collection_name}...")

            for document_id, record_data in records.items():

                ref = db.collection(
                    collection_name
                ).document(document_id)

                snapshot = ref.get(
                    timeout=10,
                    retry=None
                )

                # Preserve existing records.
                if snapshot.exists:

                    print(f"SKIPPED: {document_id}")

                    skipped += 1

                    continue

                data = {

                    **record_data,

                    "created_at": now,

                    "updated_at": now

                }

                batch.create(ref, data)

                created += 1

                print(f"READY: {document_id}")

        if created > 0:

            print("\nSaving sample records to Firestore...")

            batch.commit(
                timeout=30,
                retry=None
            )

        print("\n" + "=" * 55)

        print("SAMPLE DATABASE INITIALIZED")

        print("New records:", created)

        print("Existing records skipped:", skipped)

        print("=" * 55)

    except Exception as error:

        print("\nDATABASE ERROR:")

        print(str(error))

        raise SystemExit(1)


# ======================================================
# RUN SEED SCRIPT
# ======================================================

if __name__ == "__main__":

    seed_database()