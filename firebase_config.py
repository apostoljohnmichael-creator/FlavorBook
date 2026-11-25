import os
import json
import threading

import firebase_admin

from firebase_admin import credentials, firestore
from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))

_db = None
_lock = threading.Lock()


def get_db():

    global _db

    if _db is not None:
        return _db

    with _lock:

        if _db is not None:
            return _db

        try:

            firebase_app = firebase_admin.get_app()

        except ValueError:

            # ======================================
            # VERCEL FIREBASE CONNECTION
            # ======================================

            service_account = os.getenv(
                "FIREBASE_SERVICE_ACCOUNT"
            )

            if service_account:

                credential_data = json.loads(
                    service_account
                )

                cred = credentials.Certificate(
                    credential_data
                )

                print("[Firebase] Using Vercel credentials.")

            else:

                # ==================================
                # LOCAL PYCHARM CONNECTION
                # ==================================

                credential_path = os.getenv(
                    "GOOGLE_APPLICATION_CREDENTIALS",
                    "ServiceAccountkey.json"
                )

                if not os.path.isabs(credential_path):

                    credential_path = os.path.join(
                        BASE_DIR,
                        credential_path
                    )

                if not os.path.isfile(credential_path):

                    raise FileNotFoundError(
                        f"Firebase credentials not found: {credential_path}"
                    )

                cred = credentials.Certificate(
                    credential_path
                )

                print("[Firebase] Using local credentials.")

            firebase_app = firebase_admin.initialize_app(
                cred
            )

        _db = firestore.client(app=firebase_app)

        print("[Firebase] Firestore client initialized.")
        print("[Firebase] Project:", _db.project)

        return _db
