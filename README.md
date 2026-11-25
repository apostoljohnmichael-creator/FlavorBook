# FlavorBook – Recipe Organizer System

## Project Overview

FlavorBook is a web-based Recipe Organizer System designed to help users organize and manage recipes, food categories, and ingredients in a centralized platform. It provides an interactive and responsive interface with Firebase Cloud Firestore as its database.

## Live Website

Access the FlavorBook website through the following link:

[FlavorBook – Live Website](https://flavorbook-iota.vercel.app/)

## Technologies Used

- HTML5 – Website structure
- CSS3 – Styling, animations, and responsive design
- JavaScript – Interactive features and API integration
- Python Flask – Backend development
- Firebase Cloud Firestore – NoSQL cloud database
- GitHub – Source code repository
- Vercel – Website deployment
- PyCharm – Development environment

## System Features

- Interactive dashboard
- Recipe management
- Food category management
- Ingredient management
- Create, Read, Update, and Delete (CRUD) operations
- Search and filtering
- Data validation
- Delete confirmation
- Connected Firestore collections
- Responsive and user-friendly interface

## Database Structure

The system uses three interconnected Firebase Cloud Firestore collections.

### 1. Categories

- Category ID
- Category Name
- Description
- Created At
- Updated At

### 2. Recipes

- Recipe ID
- Recipe Name
- Category ID
- Description
- Preparation Time
- Cooking Time
- Servings
- Difficulty
- Instructions
- Image URL (Optional)
- Created At
- Updated At

### 3. Ingredients

- Ingredient ID
- Recipe ID
- Ingredient Name
- Quantity
- Unit
- Created At
- Updated At

Document IDs establish relationships between categories, recipes, and ingredients.

## Local Installation and Setup

### Step 1: Open the Project

Open the FlavorBook project folder in PyCharm. Use Python 3.10 or higher.

### Step 2: Configure Firebase

1. Create a Firebase project.
2. Enable Cloud Firestore.
3. Publish the included firestore.rules.
4. Open Project Settings.
5. Select Service Accounts.
6. Generate a new private key.
7. Save the file as ServiceAccountKey.json inside the project folder.

### Step 3: Install Dependencies

Run the following commands in the PyCharm terminal:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

### Step 4: Configure Environment Variables

Create or update the .env file:

```env
GOOGLE_APPLICATION_CREDENTIALS=ServiceAccountKey.json
FLASK_DEBUG=false
PORT=5000
```

### Step 5: Run the Application

```powershell
.\.venv\Scripts\python.exe app.py
```

Local website:

http://127.0.0.1:5000/

Firestore connection test:

http://127.0.0.1:5000/api/health

## Vercel Deployment

FlavorBook uses Vercel for online deployment.

Configure the following environment variables in the Vercel project settings:

| Environment Variable | Value |
|---|---|
| FIREBASE_SERVICE
