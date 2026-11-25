# FlavorBook Recipe Organizer
Flask + HTML/CSS/JS + Firebase Cloud Firestore. Local single-user classroom demonstration; do not expose the unauthenticated Flask server publicly.

## Setup in PyCharm (Windows PowerShell)
1. Open this folder in PyCharm and select a Python 3.10+ interpreter (3.11 recommended).
2. Create a Firebase project and enable Cloud Firestore in production mode. Publish the included firestore.rules in the Rules tab. The server Admin SDK uses IAM and bypasses client rules.
3. Project settings > Service accounts > Generate new private key. Save it as ServiceAccountKey.json in this folder. Never commit this file.
4. In the terminal run:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe app.py
```
Open http://127.0.0.1:5000 and check http://127.0.0.1:5000/api/health for database connectivity.

## Usage and verification
Create a category first, then a recipe selecting that category, then an ingredient selecting the recipe. Collections are created on first save. View, search, edit and delete records from each module. Delete ingredients before their recipe and recipes before their category. Check the Firestore console after each operation. The API supports GET/POST /api/{collection} and GET/PUT/DELETE /api/{collection}/{id}; search uses ?q=.

Collections: categories (name, description), recipes (name, category ID, description, prep/cook minutes, servings, difficulty, instructions, optional image URL), ingredients (recipe ID, name, quantity, unit). All include creation and update timestamps. Document IDs link the collections.

## Submission
Create a private GitHub repository, invite kidlat14, push source and README without credentials or .env. Submit by December 6, 2026 for full timeliness points. Live Firebase testing requires your own credentials.
