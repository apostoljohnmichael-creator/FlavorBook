
"use strict";

/* =====================================================
   FLAVORBOOK - AMBER & THYME
   COMPLETE FIRESTORE CONNECTED FRONTEND
===================================================== */

const API = "/api";

const $ = id => document.getElementById(id);

const COLLECTIONS = [
    "categories",
    "recipes",
    "ingredients"
];

const LABELS = {

    categories: "Category",
    recipes: "Recipe",
    ingredients: "Ingredient"

};

const NAME_FIELDS = {

    categories: "category_name",
    recipes: "recipe_name",
    ingredients: "ingredient_name"

};


/* =====================================================
   APPLICATION STATE
===================================================== */

let categories = [];
let recipes = [];
let ingredients = [];

let currentPage = "dashboard";
let currentView = "cards";

let editingCollection = null;
let editingId = null;

let deleteTarget = null;

let saving = false;
let deleting = false;

let loadingCount = 0;

let searchTimers = {};

let searchVersions = {

    recipes: 0,
    categories: 0,
    ingredients: 0

};

let filteredRecords = {

    recipes: null,
    categories: null,
    ingredients: null

};

const counterAnimations = new Map();


/* =====================================================
   GENERAL HELPERS
===================================================== */

function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        })[char]
    );

}


function safeImageURL(value) {

    if (!value) return "";

    try {

        const url = new URL(value);

        if (
            url.protocol === "http:" ||
            url.protocol === "https:"
        ) {

            return url.href;

        }

    } catch (error) {

        return "";

    }

    return "";

}


function getCollection(name) {

    switch (name) {

        case "categories":
            return categories;

        case "recipes":
            return recipes;

        case "ingredients":
            return ingredients;

        default:
            return [];

    }

}


function getCategoryName(id) {

    const category = categories.find(
        item => item.id === id
    );

    return category
        ? category.category_name
        : "Unknown Category";

}


function getRecipeName(id) {

    const recipe = recipes.find(
        item => item.id === id
    );

    return recipe
        ? recipe.recipe_name
        : "Unknown Recipe";

}


function getRecordName(collection, record) {

    return record[NAME_FIELDS[collection]]
        || "Unnamed Record";

}


function getTotalTime(recipe) {

    return Number(recipe.preparation_time || 0)
        + Number(recipe.cooking_time || 0);

}


function svgIcon(id, className = "") {

    return `

        <svg class="${escapeHTML(className)}"
             aria-hidden="true">

            <use href="#${escapeHTML(id)}"></use>

        </svg>

    `;

}


/* =====================================================
   API REQUESTS
===================================================== */

async function apiRequest(path, options = {}) {

    const config = {

        method: options.method || "GET",

        headers: {

            "Accept": "application/json"

        },

        cache: "no-store"

    };

    if (options.body !== undefined) {

        config.headers["Content-Type"] =
            "application/json";

        config.body = JSON.stringify(options.body);

    }

    let response;

    try {

        response = await fetch(
            `${API}${path}`,
            config
        );

    } catch (error) {

        throw new Error(
            "Unable to reach the Flask server. " +
            "Please check that app.py is running."
        );

    }

    let result;

    try {

        result = await response.json();

    } catch (error) {

        throw new Error(
            `Invalid server response (${response.status}).`
        );

    }

    if (!response.ok || result.success !== true) {

        throw new Error(
            result.message || "The operation failed."
        );

    }

    return result;

}


/* =====================================================
   LOADING OVERLAY
===================================================== */

function showLoading(message = "Loading your collection...") {

    loadingCount++;

    $("loadingText").textContent = message;

    $("loadingOverlay").hidden = false;

}


function hideLoading() {

    loadingCount = Math.max(0, loadingCount - 1);

    if (loadingCount === 0) {

        $("loadingOverlay").hidden = true;

    }

}


/* =====================================================
   TOAST NOTIFICATIONS
===================================================== */

function showToast(message, type = "success") {

    const icons = {

        success: "fa-circle-check",
        error: "fa-circle-exclamation",
        info: "fa-circle-info"

    };

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML = `

        <i class="fa-solid
                  ${icons[type] || icons.info}
                  toast-icon"></i>

        <span class="toast-message">
            ${escapeHTML(message)}
        </span>

        <button class="toast-close"
                aria-label="Dismiss notification">

            &times;

        </button>

    `;

    $("toastContainer").appendChild(toast);

    let removed = false;

    function removeToast() {

        if (removed) return;

        removed = true;

        toast.classList.add("leaving");

        setTimeout(() => toast.remove(), 300);

    }

    toast.querySelector(".toast-close")
        .addEventListener("click", removeToast);

    setTimeout(removeToast, 4500);

}


/* =====================================================
   FIRESTORE CONNECTION STATUS
===================================================== */

async function checkConnection() {

    const status = $("connectionStatus");

    status.classList.remove(
        "connected",
        "disconnected"
    );

    $("connectionText").textContent =
        "Connecting...";

    try {

        await apiRequest("/health");

        status.classList.add("connected");

        $("connectionText").textContent =
            "Firestore Connected";

        return true;

    } catch (error) {

        status.classList.add("disconnected");

        $("connectionText").textContent =
            "Firestore Offline";

        return false;

    }

}


/* =====================================================
   THEME SWITCHING
===================================================== */

function initializeTheme() {

    let savedTheme = "dark";

    try {

        savedTheme =
            localStorage.getItem("flavorbook-theme")
            || "dark";

    } catch (error) {

        // Theme still works without localStorage.

    }

    applyTheme(
        savedTheme === "light" ? "light" : "dark"
    );

}


function applyTheme(theme) {

    document.body.dataset.theme = theme;

    const isDark = theme === "dark";

    $("themeToggle").innerHTML = isDark

        ? '<i class="fa-solid fa-sun"></i>'

        : '<i class="fa-solid fa-moon"></i>';

    $("themeToggle").title = isDark

        ? "Switch to Golden Morning"

        : "Switch to Amber Evening";

    $("themeToggle").setAttribute(

        "aria-label",

        isDark
            ? "Switch to light mode"
            : "Switch to dark mode"

    );

    try {

        localStorage.setItem(
            "flavorbook-theme",
            theme
        );

    } catch (error) {

        // Storage is optional.

    }

}


function toggleTheme() {

    const nextTheme =

        document.body.dataset.theme === "dark"

            ? "light"

            : "dark";

    applyTheme(nextTheme);

    showToast(

        nextTheme === "light"

            ? "Welcome to Golden Morning."

            : "Welcome to Amber Evening.",

        "info"

    );

}


/* =====================================================
   NAVIGATION
===================================================== */

function navigateTo(page) {

    const allowedPages = [

        "dashboard",
        "recipes",
        "categories",
        "ingredients"

    ];

    if (!allowedPages.includes(page)) return;

    currentPage = page;

    document.querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove("active");

        });

    $(`${page}Page`).classList.add("active");

    document.querySelectorAll(".nav-link")
        .forEach(button => {

            const active =
                button.dataset.page === page;

            button.classList.toggle(
                "active",
                active
            );

            if (active) {

                button.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                button.removeAttribute(
                    "aria-current"
                );

            }

        });

    $("mainNavigation").classList.remove("open");

    $("mobileMenu").setAttribute(
        "aria-expanded",
        "false"
    );

    renderCurrentPage();

    window.scrollTo({

        top: 0,

        behavior: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches ? "instant" : "smooth"

    });

}


/* =====================================================
   ANIMATED STATISTICS
===================================================== */

function animateCounter(id, target) {

    const element = $(id);

    if (!element) return;

    if (counterAnimations.has(id)) {

        cancelAnimationFrame(
            counterAnimations.get(id)
        );

    }

    const end = Number(target) || 0;

    if (window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches) {

        element.textContent = end;

        return;

    }

    const start = Number(element.textContent) || 0;

    const duration = 850;

    const startTime = performance.now();

    function update(now) {

        const progress = Math.min(
            (now - startTime) / duration,
            1
        );

        const easing = 1 - Math.pow(
            1 - progress,
            3
        );

        element.textContent = Math.round(

            start + (end - start) * easing

        );

        if (progress < 1) {

            counterAnimations.set(

                id,

                requestAnimationFrame(update)

            );

        } else {

            counterAnimations.delete(id);

        }

    }

    counterAnimations.set(

        id,

        requestAnimationFrame(update)

    );

}


/* =====================================================
   LOAD DASHBOARD SUMMARY
===================================================== */

async function loadDashboard() {

    try {

        const result = await apiRequest("/summary");

        animateCounter(
            "totalRecipes",
            result.data.recipes
        );

        animateCounter(
            "totalCategories",
            result.data.categories
        );

        animateCounter(
            "totalIngredients",
            result.data.ingredients
        );

    } catch (error) {

        $("totalRecipes").textContent = "—";
        $("totalCategories").textContent = "—";
        $("totalIngredients").textContent = "—";

        showToast(error.message, "error");

    }

}


/* =====================================================
   LOAD ALL FIRESTORE COLLECTIONS
===================================================== */

async function loadAllData() {

    const results = await Promise.all([

        apiRequest("/categories"),
        apiRequest("/recipes"),
        apiRequest("/ingredients")

    ]);

    if (results.some(
        result => !Array.isArray(result.data)
    )) {

        throw new Error(
            "The server returned an invalid record list."
        );

    }

    categories = results[0].data;
    recipes = results[1].data;
    ingredients = results[2].data;

    COLLECTIONS.forEach(collection => {

        searchVersions[collection]++;

        filteredRecords[collection] = null;

    });

    updateFilterOptions();

}


/* =====================================================
   REFRESH WEBSITE DATA
===================================================== */

async function refreshAll(showOverlay = true) {

    if (showOverlay) {

        showLoading(
            "Fetching fresh records from Firestore..."
        );

    }

    try {

        await loadAllData();

        await Promise.all([

            loadDashboard(),

            ...COLLECTIONS.map(collection =>
                runSearch(collection, false)
            )

        ]);

        renderAllPages();

        return true;

    } catch (error) {

        showToast(error.message, "error");

        renderLoadError(error.message);

        return false;

    } finally {

        if (showOverlay) {

            hideLoading();

        }

    }

}


/* =====================================================
   FILTER OPTIONS
===================================================== */

function fillSelect(element, records, field, placeholder) {

    const previousValue = element.value;

    element.innerHTML = `

        <option value="">
            ${escapeHTML(placeholder)}
        </option>

        ${records.map(record => `

            <option value="${escapeHTML(record.id)}">

                ${escapeHTML(record[field])}

            </option>

        `).join("")}

    `;

    if (records.some(
        record => record.id === previousValue
    )) {

        element.value = previousValue;

    }

}


function updateFilterOptions() {

    fillSelect(

        $("categoryFilter"),

        categories,

        "category_name",

        "All Categories"

    );

    fillSelect(

        $("recipeFilter"),

        recipes,

        "recipe_name",

        "All Recipes"

    );

    renderCategoryTabs();

}


function renderCategoryTabs() {

    const active = $("categoryFilter").value;

    $("categoryTabs").innerHTML = `

        <button class="category-tab
                       ${active === "" ? "active" : ""}"
                data-category-filter="">

            All Recipes

        </button>

        ${categories.map(category => `

            <button class="category-tab
                           ${active === category.id
                               ? "active"
                               : ""}"

                    data-category-filter="${escapeHTML(category.id)}">

                ${escapeHTML(category.category_name)}

            </button>

        `).join("")}

    `;

}


/* =====================================================
   SERVER-SIDE SEARCH
===================================================== */

function getSearchInput(collection) {

    const inputs = {

        recipes: "recipeSearch",
        categories: "categorySearch",
        ingredients: "ingredientSearch"

    };

    return $(inputs[collection]);

}


async function runSearch(collection, render = true) {

    const version = ++searchVersions[collection];

    const query = getSearchInput(collection)
        .value.trim();

    if (!query) {

        filteredRecords[collection] = null;

        if (render) {

            renderCollection(collection);

        }

        return;

    }

    try {

        const result = await apiRequest(

            `/${collection}?q=${encodeURIComponent(query)}`

        );

        if (version !== searchVersions[collection]) {

            return;

        }

        if (!Array.isArray(result.data)) {

            throw new Error(
                "Invalid search response."
            );

        }

        filteredRecords[collection] = result.data;

        if (render) {

            renderCollection(collection);

        }

    } catch (error) {

        if (version !== searchVersions[collection]) {

            return;

        }

        showToast(error.message, "error");

        const containers = {

            recipes: "recipeRecords",
            categories: "categoryRecords",
            ingredients: "ingredientRecords"

        };

        $(containers[collection]).innerHTML =
            errorState(error.message);

    }

}


function debounceSearch(collection) {

    clearTimeout(searchTimers[collection]);

    searchVersions[collection]++;

    searchTimers[collection] = setTimeout(

        () => runSearch(collection),

        350

    );

}


/* =====================================================
   EMPTY AND ERROR STATE HTML
===================================================== */

function emptyState(collection, filtered = false) {

    return `

        <div class="empty-state">

            ${svgIcon("emptyPlate")}

            <h3>

                ${filtered

                    ? "No matching flavors found."

                    : "An empty table awaits."

                }

            </h3>

            <p>

                ${filtered

                    ? "Try a different search or filter."

                    : "Start building your culinary collection."

                }

            </p>

            ${filtered

                ? `

                    <button class="btn btn-outline"
                            data-clear="${collection}">

                        Clear Filters

                    </button>

                `

                : `

                    <button class="btn btn-gold"
                            data-add="${collection}">

                        <i class="fa-solid fa-plus"></i>

                        Add ${LABELS[collection]}

                    </button>

                `

            }

        </div>

    `;

}


function errorState(message) {

    return `

        <div class="error-state">

            <i class="fa-solid fa-circle-exclamation"></i>

            <p>${escapeHTML(message)}</p>

            <button class="btn btn-outline"
                    data-retry="true">

                <i class="fa-solid fa-rotate"></i>

                Try Again

            </button>

        </div>

    `;

}


function renderLoadError(message) {

    [

        "featuredRecipes",
        "recipeRecords",
        "categoryRecords",
        "ingredientRecords"

    ].forEach(id => {

        $(id).innerHTML = errorState(message);

    });

    $("recipeCount").textContent =
        "Unable to load recipes";

    $("categoryCount").textContent =
        "Unable to load categories";

    $("ingredientCount").textContent =
        "Unable to load ingredients";

}


/* =====================================================
   CRUD ACTION BUTTONS
===================================================== */

function actionButtons(collection, id) {

    const safeId = escapeHTML(id);

    return `

        <div class="record-actions">

            <button class="action-btn btn-view"

                    data-action="view"
                    data-collection="${collection}"
                    data-id="${safeId}">

                <i class="fa-solid fa-eye"></i>

                View

            </button>

            <button class="action-btn btn-edit"

                    data-action="edit"
                    data-collection="${collection}"
                    data-id="${safeId}">

                <i class="fa-solid fa-pen"></i>

                Edit

            </button>

            <button class="action-btn btn-danger"

                    data-action="delete"
                    data-collection="${collection}"
                    data-id="${safeId}">

                <i class="fa-solid fa-trash"></i>

                Delete

            </button>

        </div>

    `;

}


/* =====================================================
   RECIPE IMAGE
===================================================== */

function recipeImage(recipe) {

    const url = safeImageURL(recipe.image_url);

    if (url) {

        return `

            <img src="${escapeHTML(url)}"

                 alt="${escapeHTML(recipe.recipe_name)}"

                 loading="lazy"

                 data-recipe-image="true">

        `;

    }

    return svgIcon("culinaryPlate");

}


function difficultyBadge(value) {

    const difficulty = [

        "Easy",
        "Medium",
        "Hard"

    ].includes(value) ? value : "Unknown";

    return `

        <span class="difficulty-badge
                     difficulty-${difficulty.toLowerCase()}">

            ${escapeHTML(difficulty)}

        </span>

    `;

}


/* =====================================================
   RECIPE CARD
===================================================== */

function recipeCard(recipe, index = 0) {

    return `

        <article class="recipe-card"

                 style="animation-delay:
                        ${Math.min(index * 45, 350)}ms">

            <button class="recipe-image"

                    data-action="view"
                    data-collection="recipes"
                    data-id="${escapeHTML(recipe.id)}"

                    aria-label="View ${escapeHTML(recipe.recipe_name)}">

                ${recipeImage(recipe)}

                <span class="image-shade"></span>

                ${difficultyBadge(recipe.difficulty)}

            </button>

            <div class="recipe-body">

                <div class="recipe-category">

                    ${escapeHTML(
                        getCategoryName(recipe.category_id)
                    )}

                </div>

                <h3>

                    ${escapeHTML(recipe.recipe_name)}

                </h3>

                <p class="recipe-description">

                    ${escapeHTML(recipe.description)}

                </p>

                <div class="recipe-meta">

                    <span>

                        <i class="fa-regular fa-clock"></i>

                        ${getTotalTime(recipe)} min

                    </span>

                    <span>

                        <i class="fa-solid fa-utensils"></i>

                        ${escapeHTML(recipe.servings)}
                        servings

                    </span>

                </div>

                ${actionButtons("recipes", recipe.id)}

            </div>

        </article>

    `;

}


/* =====================================================
   FEATURED RECIPES
===================================================== */

function renderFeaturedRecipes() {

    const featured = [...recipes]

        .sort((a, b) => {

            const dateA =
                Date.parse(a.created_at || "") || 0;

            const dateB =
                Date.parse(b.created_at || "") || 0;

            return dateB - dateA;

        })

        .slice(0, 3);

    $("featuredRecipes").innerHTML = featured.length

        ? featured.map(recipeCard).join("")

        : emptyState("recipes");

}


/* =====================================================
   RECIPES PAGE
===================================================== */

function renderRecipes() {

    let records =

        filteredRecords.recipes ?? recipes;

    const category = $("categoryFilter").value;

    const difficulty = $("difficultyFilter").value;

    if (category) {

        records = records.filter(

            recipe => recipe.category_id === category

        );

    }

    if (difficulty) {

        records = records.filter(

            recipe => recipe.difficulty === difficulty

        );

    }

    $("recipeCount").textContent =

        `${records.length} of ${recipes.length} recipes`;

    const hasFilter = Boolean(

        category ||
        difficulty ||
        $("recipeSearch").value.trim()

    );

    if (!records.length) {

        $("recipeRecords").innerHTML =

            emptyState("recipes", hasFilter);

        return;

    }

    if (currentView === "cards") {

        $("recipeRecords").innerHTML = `

            <div class="recipe-grid">

                ${records.map(recipeCard).join("")}

            </div>

        `;

    } else {

        renderRecipeTable(records);

    }

}


/* =====================================================
   RECIPE TABLE
===================================================== */

function renderRecipeTable(records) {

    $("recipeRecords").innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Recipe Name</th>
                        <th>Category</th>
                        <th>Preparation</th>
                        <th>Cooking</th>
                        <th>Servings</th>
                        <th>Difficulty</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    ${records.map(recipe => `

                        <tr>

                            <td>

                                <div class="table-name">

                                    <span class="table-icon">

                                        <i class="fa-solid fa-utensils"></i>

                                    </span>

                                    <strong>

                                        ${escapeHTML(recipe.recipe_name)}

                                    </strong>

                                </div>

                            </td>

                            <td>

                                ${escapeHTML(
                                    getCategoryName(recipe.category_id)
                                )}

                            </td>

                            <td>

                                ${escapeHTML(recipe.preparation_time)}
                                min

                            </td>

                            <td>

                                ${escapeHTML(recipe.cooking_time)}
                                min

                            </td>

                            <td>

                                ${escapeHTML(recipe.servings)}

                            </td>

                            <td>

                                ${difficultyBadge(recipe.difficulty)}

                            </td>

                            <td>

                                ${actionButtons("recipes", recipe.id)}

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    `;

}


/* =====================================================
   CATEGORY ICONS
===================================================== */

function getCategoryIcon(name) {

    const text = String(name).toLowerCase();

    if (text.includes("dessert")) {

        return "fa-cake-candles";

    }

    if (text.includes("soup")) {

        return "fa-bowl-food";

    }

    if (text.includes("breakfast")) {

        return "fa-mug-hot";

    }

    if (text.includes("drink")) {

        return "fa-glass-water";

    }

    if (text.includes("salad")) {

        return "fa-leaf";

    }

    if (text.includes("appetizer")) {

        return "fa-cheese";

    }

    return "fa-utensils";

}


/* =====================================================
   CATEGORIES PAGE
===================================================== */

function renderCategories() {

    const records =

        filteredRecords.categories ?? categories;

    $("categoryCount").textContent =

        `${records.length} of ${categories.length} categories`;

    if (!records.length) {

        $("categoryRecords").innerHTML = emptyState(

            "categories",

            Boolean($("categorySearch").value.trim())

        );

        return;

    }

    $("categoryRecords").innerHTML = records.map(

        (category, index) => {

            const total = recipes.filter(

                recipe => recipe.category_id === category.id

            ).length;

            return `

                <article class="category-card"

                         style="animation-delay:
                                ${Math.min(index * 45, 350)}ms">

                    ${svgIcon(
                        "thymeBranch",
                        "category-decoration"
                    )}

                    <div class="category-icon">

                        <i class="fa-solid
                            ${getCategoryIcon(category.category_name)}">

                        </i>

                    </div>

                    <span class="eyebrow">

                        CULINARY CATEGORY

                    </span>

                    <h3>

                        ${escapeHTML(category.category_name)}

                    </h3>

                    <p>

                        ${escapeHTML(category.description)}

                    </p>

                    <div class="category-total">

                        <i class="fa-solid fa-book-open"></i>

                        ${total} ${total === 1 ? "recipe" : "recipes"}

                    </div>

                    ${actionButtons("categories", category.id)}

                </article>

            `;

        }

    ).join("");

}


/* =====================================================
   INGREDIENTS PAGE
===================================================== */

function renderIngredients() {

    let records =

        filteredRecords.ingredients ?? ingredients;

    const recipeId = $("recipeFilter").value;

    if (recipeId) {

        records = records.filter(

            ingredient => ingredient.recipe_id === recipeId

        );

    }

    $("ingredientCount").textContent =

        `${records.length} of ${ingredients.length} ingredients`;

    if (!records.length) {

        $("ingredientRecords").innerHTML = emptyState(

            "ingredients",

            Boolean(
                recipeId ||
                $("ingredientSearch").value.trim()
            )

        );

        return;

    }

    $("ingredientRecords").innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Ingredient</th>
                        <th>Recipe</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    ${records.map(ingredient => `

                        <tr>

                            <td>

                                <div class="table-name">

                                    <span class="table-icon">

                                        <i class="fa-solid fa-leaf"></i>

                                    </span>

                                    <strong>

                                        ${escapeHTML(
                                            ingredient.ingredient_name
                                        )}

                                    </strong>

                                </div>

                            </td>

                            <td>

                                ${escapeHTML(
                                    getRecipeName(ingredient.recipe_id)
                                )}

                            </td>

                            <td>

                                ${escapeHTML(ingredient.quantity)}

                            </td>

                            <td>

                                ${escapeHTML(ingredient.unit)}

                            </td>

                            <td>

                                ${actionButtons(
                                    "ingredients",
                                    ingredient.id
                                )}

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    `;

}


/* =====================================================
   RENDER HELPERS
===================================================== */

function renderCollection(collection) {

    switch (collection) {

        case "recipes":

            renderRecipes();

            break;

        case "categories":

            renderCategories();

            break;

        case "ingredients":

            renderIngredients();

            break;

    }

}


function renderCurrentPage() {

    if (currentPage === "dashboard") {

        renderFeaturedRecipes();

    } else {

        renderCollection(currentPage);

    }

}


function renderAllPages() {

    renderFeaturedRecipes();

    renderRecipes();

    renderCategories();

    renderIngredients();

}


/* =====================================================
   FORM FIELD GENERATORS
===================================================== */

function inputField({

    name,
    label,
    value = "",
    type = "text",
    placeholder = "",
    required = true,
    full = false,
    min = null,
    step = null,
    help = ""

}) {

    return `

        <div class="form-group
                    ${full ? "full-width" : ""}">

            <label for="field-${name}">

                ${escapeHTML(label)}

                ${required

                    ? '<span class="required-mark">*</span>'

                    : ""

                }

            </label>

            <input id="field-${name}"

                   name="${name}"

                   type="${type}"

                   value="${escapeHTML(value)}"

                   placeholder="${escapeHTML(placeholder)}"

                   ${required ? "required" : ""}

                   ${min !== null ? `min="${min}"` : ""}

                   ${step !== null ? `step="${step}"` : ""}

                   ${type === "text" ? 'maxlength="20000"' : ""}>

            ${help

                ? `<small>${escapeHTML(help)}</small>`

                : ""

            }

        </div>

    `;

}


function textareaField({

    name,
    label,
    value = "",
    placeholder = "",
    rows = 4

}) {

    return `

        <div class="form-group full-width">

            <label for="field-${name}">

                ${escapeHTML(label)}

                <span class="required-mark">*</span>

            </label>

            <textarea id="field-${name}"

                      name="${name}"

                      rows="${rows}"

                      maxlength="20000"

                      placeholder="${escapeHTML(placeholder)}"

                      required>${escapeHTML(value)}</textarea>

        </div>

    `;

}


function selectField({

    name,
    label,
    options,
    value = "",
    placeholder = "Select an option",
    full = false

}) {

    return `

        <div class="form-group
                    ${full ? "full-width" : ""}">

            <label for="field-${name}">

                ${escapeHTML(label)}

                <span class="required-mark">*</span>

            </label>

            <select id="field-${name}"

                    name="${name}"

                    required>

                <option value="">

                    ${escapeHTML(placeholder)}

                </option>

                ${options.map(option => `

                    <option value="${escapeHTML(option.value)}"

                        ${String(option.value) === String(value)

                            ? "selected"

                            : ""

                        }>

                        ${escapeHTML(option.label)}

                    </option>

                `).join("")}

            </select>

        </div>

    `;

}


/* =====================================================
   CATEGORY FORM
===================================================== */

function categoryForm(record = {}) {

    return [

        inputField({

            name: "category_name",

            label: "Category Name",

            value: record.category_name,

            placeholder: "e.g. Filipino Cuisine",

            full: true

        }),

        textareaField({

            name: "description",

            label: "Description",

            value: record.description,

            placeholder:
                "Describe this culinary category..."

        })

    ].join("");

}


/* =====================================================
   RECIPE FORM
===================================================== */

function recipeForm(record = {}) {

    return [

        inputField({

            name: "recipe_name",

            label: "Recipe Name",

            value: record.recipe_name,

            placeholder: "e.g. Chicken Adobo",

            full: true

        }),

        selectField({

            name: "category_id",

            label: "Food Category",

            value: record.category_id,

            placeholder: "Select a category",

            full: true,

            options: categories.map(category => ({

                value: category.id,

                label: category.category_name

            }))

        }),

        textareaField({

            name: "description",

            label: "Recipe Description",

            value: record.description,

            placeholder:
                "Describe the flavor and character of this dish..."

        }),

        inputField({

            name: "preparation_time",

            label: "Preparation Time (minutes)",

            type: "number",

            value: record.preparation_time ?? "",

            min: 0,

            step: 1,

            placeholder: "15"

        }),

        inputField({

            name: "cooking_time",

            label: "Cooking Time (minutes)",

            type: "number",

            value: record.cooking_time ?? "",

            min: 0,

            step: 1,

            placeholder: "40"

        }),

        inputField({

            name: "servings",

            label: "Number of Servings",

            type: "number",

            value: record.servings ?? "",

            min: 1,

            step: 1,

            placeholder: "4"

        }),

        selectField({

            name: "difficulty",

            label: "Difficulty",

            value: record.difficulty,

            options: [

                { value: "Easy", label: "Easy" },

                { value: "Medium", label: "Medium" },

                { value: "Hard", label: "Hard" }

            ]

        }),

        textareaField({

            name: "instructions",

            label: "Cooking Instructions",

            value: record.instructions,

            rows: 6,

            placeholder:

                "1. Prepare the ingredients.\n" +

                "2. Follow the cooking procedure.\n" +

                "3. Serve and enjoy."

        }),

        inputField({

            name: "image_url",

            label: "Recipe Image URL (Optional)",

            type: "url",

            value: record.image_url,

            required: false,

            full: true,

            placeholder: "https://example.com/recipe.jpg",

            help:

                "Enter a direct HTTP or HTTPS image URL. " +

                "An illustrated plate appears when no image is provided."

        })

    ].join("");

}


/* =====================================================
   INGREDIENT FORM
===================================================== */

function ingredientForm(record = {}) {

    return [

        selectField({

            name: "recipe_id",

            label: "Select Recipe",

            value: record.recipe_id,

            placeholder: "Choose a recipe",

            full: true,

            options: recipes.map(recipe => ({

                value: recipe.id,

                label: recipe.recipe_name

            }))

        }),

        inputField({

            name: "ingredient_name",

            label: "Ingredient Name",

            value: record.ingredient_name,

            placeholder: "e.g. Garlic",

            full: true

        }),

        inputField({

            name: "quantity",

            label: "Quantity",

            type: "number",

            value: record.quantity ?? "",

            min: 0,

            step: "any",

            placeholder: "5"

        }),

        inputField({

            name: "unit",

            label: "Unit",

            value: record.unit,

            placeholder: "e.g. cloves"

        })

    ].join("");

}


/* =====================================================
   OPEN ADD / EDIT MODAL
===================================================== */

async function openForm(collection, id = null) {

    if (!COLLECTIONS.includes(collection)) return;

    if ($("recordModal").open) return;

    if (collection === "recipes" && !categories.length) {

        showToast(

            "Please create a food category first.",

            "info"

        );

        navigateTo("categories");

        return;

    }

    if (collection === "ingredients" && !recipes.length) {

        showToast(

            "Please create a recipe first.",

            "info"

        );

        navigateTo("recipes");

        return;

    }

    let record = {};

    if (id) {

        showLoading("Opening your record...");

        try {

            const result = await apiRequest(

                `/${collection}/${encodeURIComponent(id)}`

            );

            record = result.data;

        } catch (error) {

            showToast(error.message, "error");

            return;

        } finally {

            hideLoading();

        }

    }

    editingCollection = collection;

    editingId = id;

    $("modalTitle").textContent =

        `${id ? "Edit" : "Add"} ${LABELS[collection]}`;

    $("formError").hidden = true;

    $("formError").textContent = "";

    const generators = {

        categories: categoryForm,

        recipes: recipeForm,

        ingredients: ingredientForm

    };

    $("formFields").innerHTML =

        generators[collection](record);

    $("saveButton").innerHTML = `

        <i class="fa-solid fa-check"></i>

        ${id ? "Update" : "Save"} ${LABELS[collection]}

    `;

    $("recordModal").showModal();

}


/* =====================================================
   CLIENT-SIDE VALIDATION
===================================================== */

function validateForm(collection, data) {

    const requiredFields = {

        categories: [

            "category_name",
            "description"

        ],

        recipes: [

            "recipe_name",
            "category_id",
            "description",
            "preparation_time",
            "cooking_time",
            "servings",
            "difficulty",
            "instructions"

        ],

        ingredients: [

            "recipe_id",
            "ingredient_name",
            "quantity",
            "unit"

        ]

    };

    for (const field of requiredFields[collection]) {

        if (
            data[field] === undefined ||
            String(data[field]).trim() === ""
        ) {

            throw new Error(

                `${field.replaceAll("_", " ")} is required.`

            );

        }

    }

    Object.keys(data).forEach(field => {

        if (typeof data[field] === "string") {

            data[field] = data[field].trim();

            if (data[field].length > 20000) {

                throw new Error(

                    `${field.replaceAll("_", " ")} is too long.`

                );

            }

        }

    });

    if (collection === "recipes") {

        [

            "preparation_time",
            "cooking_time",
            "servings"

        ].forEach(field => {

            const number = Number(data[field]);

            if (
                !Number.isSafeInteger(number) ||
                number < 0
            ) {

                throw new Error(

                    `${field.replaceAll("_", " ")} ` +

                    "must be a valid whole number."

                );

            }

            data[field] = number;

        });

        if (data.servings <= 0) {

            throw new Error(

                "Servings must be greater than zero."

            );

        }

        if (!categories.some(

            category => category.id === data.category_id

        )) {

            throw new Error(

                "Please select a valid category."

            );

        }

        if (![

            "Easy",
            "Medium",
            "Hard"

        ].includes(data.difficulty)) {

            throw new Error(

                "Select Easy, Medium, or Hard."

            );

        }

        if (

            data.image_url &&

            !safeImageURL(data.image_url)

        ) {

            throw new Error(

                "Enter a valid HTTP or HTTPS image URL."

            );

        }

        data.image_url = data.image_url || "";

    }

    if (collection === "ingredients") {

        const quantity = Number(data.quantity);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            throw new Error(

                "Quantity must be greater than zero."

            );

        }

        data.quantity = quantity;

        if (!recipes.some(

            recipe => recipe.id === data.recipe_id

        )) {

            throw new Error(

                "Please select a valid recipe."

            );

        }

    }

    return data;

}


/* =====================================================
   SAVE RECORD - CREATE AND UPDATE
===================================================== */

async function saveRecord(event) {

    event.preventDefault();

    if (saving || !editingCollection) return;

    const collection = editingCollection;

    const id = editingId;

    const button = $("saveButton");

    const originalButton = button.innerHTML;

    const errorBox = $("formError");

    errorBox.hidden = true;

    try {

        let data = Object.fromEntries(

            new FormData($("recordForm"))

        );

        data = validateForm(collection, data);

        saving = true;

        button.disabled = true;

        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Saving...

        `;

        const path = id

            ? `/${collection}/${encodeURIComponent(id)}`

            : `/${collection}`;

        const result = await apiRequest(path, {

            method: id ? "PUT" : "POST",

            body: data

        });

        $("recordModal").close();

        showToast(

            result.message ||

            `${LABELS[collection]} saved successfully.`

        );

        const refreshed = await refreshAll(false);

        if (!refreshed) {

            showToast(

                "The record was saved, but the display " +

                "could not refresh. Please try refreshing.",

                "info"

            );

        }

    } catch (error) {

        errorBox.textContent = error.message;

        errorBox.hidden = false;

        showToast(error.message, "error");

    } finally {

        saving = false;

        button.disabled = false;

        button.innerHTML = originalButton;

    }

}


/* =====================================================
   DETAIL FACT
===================================================== */

function detailFact(label, value) {

    return `

        <div class="detail-fact">

            <span>${escapeHTML(label)}</span>

            <strong>${escapeHTML(value)}</strong>

        </div>

    `;

}


/* =====================================================
   VIEW RECIPE DETAILS
===================================================== */

function recipeDetails(recipe, linkedIngredients) {

    return `

        <div class="detail-cover">

            ${recipeImage(recipe)}

        </div>

        <p class="detail-description">

            ${escapeHTML(recipe.description)}

        </p>

        <div class="detail-facts">

            ${detailFact(

                "Category",

                getCategoryName(recipe.category_id)

            )}

            ${detailFact(

                "Difficulty",

                recipe.difficulty

            )}

            ${detailFact(

                "Preparation Time",

                `${recipe.preparation_time} minutes`

            )}

            ${detailFact(

                "Cooking Time",

                `${recipe.cooking_time} minutes`

            )}

            ${detailFact(

                "Total Time",

                `${getTotalTime(recipe)} minutes`

            )}

            ${detailFact(

                "Servings",

                recipe.servings

            )}

        </div>

        <div class="detail-section">

            <h3>Ingredients</h3>

            ${linkedIngredients.length

                ? `

                    <ul class="ingredient-detail-list">

                        ${linkedIngredients.map(ingredient => `

                            <li>

                                <span>

                                    <i class="fa-solid fa-leaf"></i>

                                    ${escapeHTML(
                                        ingredient.ingredient_name
                                    )}

                                </span>

                                <strong>

                                    ${escapeHTML(ingredient.quantity)}

                                    ${escapeHTML(ingredient.unit)}

                                </strong>

                            </li>

                        `).join("")}

                    </ul>

                `

                : `

                    <p class="detail-description">

                        No ingredients have been added to this recipe.

                    </p>

                `

            }

        </div>

        <div class="detail-section">

            <h3>Cooking Instructions</h3>

            <div class="instructions-text">${escapeHTML(
                recipe.instructions
            )}</div>

        </div>

    `;

}


/* =====================================================
   VIEW CATEGORY DETAILS
===================================================== */

function categoryDetails(category, linkedRecipes) {

    return `

        <p class="detail-description">

            ${escapeHTML(category.description)}

        </p>

        <div class="detail-facts">

            ${detailFact(

                "Category Name",

                category.category_name

            )}

            ${detailFact(

                "Total Recipes",

                linkedRecipes.length

            )}

        </div>

        <div class="detail-section">

            <h3>Recipes in this Category</h3>

            ${linkedRecipes.length

                ? `

                    <ul class="ingredient-detail-list">

                        ${linkedRecipes.map(recipe => `

                            <li>

                                <span>

                                    <i class="fa-solid fa-utensils"></i>

                                    ${escapeHTML(recipe.recipe_name)}

                                </span>

                                <strong>

                                    ${getTotalTime(recipe)} min

                                </strong>

                            </li>

                        `).join("")}

                    </ul>

                `

                : `

                    <p class="detail-description">

                        No recipes belong to this category yet.

                    </p>

                `

            }

        </div>

    `;

}


/* =====================================================
   VIEW INGREDIENT DETAILS
===================================================== */

function ingredientDetails(ingredient) {

    return `

        <div class="detail-facts">

            ${detailFact(

                "Ingredient Name",

                ingredient.ingredient_name

            )}

            ${detailFact(

                "Recipe",

                getRecipeName(ingredient.recipe_id)

            )}

            ${detailFact(

                "Quantity",

                ingredient.quantity

            )}

            ${detailFact(

                "Unit",

                ingredient.unit

            )}

        </div>

    `;

}


/* =====================================================
   OPEN VIEW MODAL
===================================================== */

async function viewRecord(collection, id) {

    if (!COLLECTIONS.includes(collection)) return;

    if ($("detailModal").open) return;

    showLoading("Opening your culinary journal...");

    try {

        const result = await apiRequest(

            `/${collection}/${encodeURIComponent(id)}`

        );

        const record = result.data;

        $("detailTitle").textContent =

            getRecordName(collection, record);

        let content = "";

        if (collection === "recipes") {

            const ingredientResult = await apiRequest(

                "/ingredients"

            );

            const linked = ingredientResult.data.filter(

                ingredient => ingredient.recipe_id === id

            );

            content = recipeDetails(record, linked);

        } else if (collection === "categories") {

            const recipeResult = await apiRequest(

                "/recipes"

            );

            const linked = recipeResult.data.filter(

                recipe => recipe.category_id === id

            );

            content = categoryDetails(record, linked);

        } else {

            content = ingredientDetails(record);

        }

        $("detailContent").innerHTML = content;

        $("detailModal").showModal();

    } catch (error) {

        showToast(error.message, "error");

    } finally {

        hideLoading();

    }

}


/* =====================================================
   DELETE CONFIRMATION
===================================================== */

function openDelete(collection, id) {

    if (!COLLECTIONS.includes(collection)) return;

    const record = getCollection(collection).find(

        item => item.id === id

    );

    if (!record) {

        showToast("Record not found.", "error");

        return;

    }

    deleteTarget = {

        collection,

        id

    };

    $("deleteError").hidden = true;

    $("deleteError").textContent = "";

    let message =

        `Are you sure you want to delete ` +

        `"${getRecordName(collection, record)}"? ` +

        "This action cannot be undone.";

    if (collection === "categories") {

        message +=

            " Linked recipes must be removed first.";

    }

    if (collection === "recipes") {

        message +=

            " Linked ingredients must be removed first.";

    }

    $("confirmMessage").textContent = message;

    $("confirmModal").showModal();

}


/* =====================================================
   DELETE RECORD
===================================================== */

async function deleteRecord() {

    if (deleting || !deleteTarget) return;

    const { collection, id } = deleteTarget;

    const button = $("confirmDelete");

    const originalButton = button.innerHTML;

    deleting = true;

    button.disabled = true;

    $("deleteError").hidden = true;

    button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Deleting...

    `;

    try {

        const result = await apiRequest(

            `/${collection}/${encodeURIComponent(id)}`,

            {

                method: "DELETE"

            }

        );

        $("confirmModal").close();

        deleteTarget = null;

        showToast(

            result.message || "Record deleted successfully."

        );

        const refreshed = await refreshAll(false);

        if (!refreshed) {

            showToast(

                "The record was deleted, but the display " +

                "could not refresh.",

                "info"

            );

        }

    } catch (error) {

        $("deleteError").textContent = error.message;

        $("deleteError").hidden = false;

        showToast(error.message, "error");

    } finally {

        deleting = false;

        button.disabled = false;

        button.innerHTML = originalButton;

    }

}


/* =====================================================
   CLOSE MODALS
===================================================== */

function closeModal(id) {

    if (id === "recordModal" && saving) return;

    if (id === "confirmModal" && deleting) return;

    const modal = $(id);

    if (modal && modal.open) {

        modal.close();

    }

}


/* =====================================================
   CLEAR FILTERS
===================================================== */

function clearFilters(collection) {

    getSearchInput(collection).value = "";

    clearTimeout(searchTimers[collection]);

    searchVersions[collection]++;

    filteredRecords[collection] = null;

    if (collection === "recipes") {

        $("categoryFilter").value = "";

        $("difficultyFilter").value = "";

        renderCategoryTabs();

    }

    if (collection === "ingredients") {

        $("recipeFilter").value = "";

    }

    renderCollection(collection);

}


/* =====================================================
   CARD AND TABLE VIEW
===================================================== */

function changeView(view) {

    if (!["cards", "table"].includes(view)) return;

    currentView = view;

    document.querySelectorAll("[data-view]")
        .forEach(button => {

            const active =

                button.dataset.view === view;

            button.classList.toggle(

                "active",

                active

            );

            button.setAttribute(

                "aria-pressed",

                String(active)

            );

        });

    renderRecipes();

}


/* =====================================================
   RIPPLE EFFECT
===================================================== */

function createRipple(event, button) {

    if (!button.matches(".btn, .action-btn")) return;

    const ripple = document.createElement("span");

    ripple.className = "ripple-effect";

    const rect = button.getBoundingClientRect();

    ripple.style.left =

        `${event.detail === 0

            ? rect.width / 2

            : event.clientX - rect.left

        }px`;

    ripple.style.top =

        `${event.detail === 0

            ? rect.height / 2

            : event.clientY - rect.top

        }px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 650);

}


/* =====================================================
   EVENT DELEGATION
===================================================== */

function initializeEvents() {

    document.addEventListener("click", event => {

        const button = event.target.closest("button");

        if (!button || button.disabled) return;

        createRipple(event, button);

        const data = button.dataset;

        if (data.page) {

            navigateTo(data.page);

            return;

        }

        if (data.add) {

            openForm(data.add);

            return;

        }

        if (data.close) {

            closeModal(data.close);

            return;

        }

        if (data.view) {

            changeView(data.view);

            return;

        }

        if (data.categoryFilter !== undefined) {

            $("categoryFilter").value =

                data.categoryFilter;

            renderCategoryTabs();

            renderRecipes();

            return;

        }

        if (data.clear) {

            clearFilters(data.clear);

            return;

        }

        if (data.retry) {

            refreshAll();

            checkConnection();

            return;

        }

        if (data.action && data.collection && data.id) {

            if (data.action === "view") {

                viewRecord(data.collection, data.id);

            }

            if (data.action === "edit") {

                openForm(data.collection, data.id);

            }

            if (data.action === "delete") {

                openDelete(data.collection, data.id);

            }

        }

    });


    /* THEME */

    $("themeToggle").addEventListener(

        "click",

        toggleTheme

    );


    /* MOBILE MENU */

    $("mobileMenu").addEventListener("click", () => {

        const open = $("mainNavigation")

            .classList.toggle("open");

        $("mobileMenu").setAttribute(

            "aria-expanded",

            String(open)

        );

    });


    /* REFRESH DASHBOARD */

    $("refreshDashboard").addEventListener(

        "click",

        async () => {

            const success = await refreshAll();

            await checkConnection();

            if (success) {

                showToast(

                    "Your culinary collection is up to date."

                );

            }

        }

    );


    /* SEARCH INPUTS */

    COLLECTIONS.forEach(collection => {

        getSearchInput(collection).addEventListener(

            "input",

            () => debounceSearch(collection)

        );

    });


    /* RECIPE FILTERS */

    $("categoryFilter").addEventListener(

        "change",

        () => {

            renderCategoryTabs();

            renderRecipes();

        }

    );

    $("difficultyFilter").addEventListener(

        "change",

        renderRecipes

    );


    /* INGREDIENT FILTER */

    $("recipeFilter").addEventListener(

        "change",

        renderIngredients

    );


    /* SAVE RECORD */

    $("recordForm").addEventListener(

        "submit",

        saveRecord

    );


    /* DELETE RECORD */

    $("confirmDelete").addEventListener(

        "click",

        deleteRecord

    );


    /* MODAL BACKDROP AND ESCAPE KEY */

    document.querySelectorAll("dialog")

        .forEach(modal => {

            modal.addEventListener("click", event => {

                if (event.target !== modal) return;

                const rect = modal.getBoundingClientRect();

                const outside =

                    event.clientX < rect.left ||

                    event.clientX > rect.right ||

                    event.clientY < rect.top ||

                    event.clientY > rect.bottom;

                if (outside) {

                    closeModal(modal.id);

                }

            });

            modal.addEventListener("cancel", event => {

                if (

                    (modal.id === "recordModal" && saving) ||

                    (modal.id === "confirmModal" && deleting)

                ) {

                    event.preventDefault();

                }

            });

        });


    /* RESET MODAL STATE */

    $("recordModal").addEventListener("close", () => {

        editingCollection = null;

        editingId = null;

        $("recordForm").reset();

    });

    $("confirmModal").addEventListener("close", () => {

        deleteTarget = null;

    });


    /* IMAGE ERROR FALLBACK */

    document.addEventListener(

        "error",

        event => {

            const image = event.target;

            if (

                image instanceof HTMLImageElement &&

                image.dataset.recipeImage

            ) {

                const template = document.createElement(

                    "template"

                );

                template.innerHTML =

                    svgIcon("culinaryPlate").trim();

                image.replaceWith(

                    template.content.firstElementChild

                );

            }

        },

        true

    );

}


/* =====================================================
   APPLICATION INITIALIZATION
===================================================== */

async function initializeApp() {

    initializeTheme();

    initializeEvents();

    changeView("cards");

    showLoading("Preparing your culinary collection...");

    try {

        const connected = await checkConnection();

        if (!connected) {

            throw new Error(

                "Firestore connection failed. " +

                "Check your Firebase configuration and credentials."

            );

        }

        await refreshAll(false);

    } catch (error) {

        renderLoadError(error.message);

        showToast(error.message, "error");

    } finally {

        hideLoading();

    }

}


document.addEventListener(

    "DOMContentLoaded",

    initializeApp

);
