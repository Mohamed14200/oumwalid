// Global variables
let recipes = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentCategory = 'all';
let searchQuery = '';

// Category icons mapping
const categoryIcons = {
    'أطباق رئيسية': 'fa-drumstick-bite',
    'حساء وشوربة': 'fa-bowl-food',
    'سلطات': 'fa-leaf',
    'حلويات': 'fa-ice-cream',
    'مشروبات': 'fa-mug-hot',
    'مقبلات': 'fa-cheese'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    loadCategories();
    setupEventListeners();
});

// Load recipes from GitHub
async function loadRecipes() {
    try {
        // Load from GitHub
        const response = await fetch('https://mohamed14200.github.io/todolist/recipes.json');
        if (!response.ok) {
            throw new Error('Failed to fetch recipes from GitHub');
        }
        recipes = await response.json();
        displayRecipes();
        displayUserRecipes();
    } catch (error) {
        console.error('Error loading recipes from GitHub:', error);
        displayError();
    }
}

// Load categories
function loadCategories() {
    const categories = [
        { name: 'أطباق رئيسية', count: 24 },
        { name: 'حساء وشوربة', count: 12 },
        { name: 'سلطات', count: 8 },
        { name: 'حلويات', count: 16 },
        { name: 'مشروبات', count: 6 },
        { name: 'مقبلات', count: 10 }
    ];

    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card ${currentCategory === category.name ? 'active' : ''}" 
             onclick="filterByCategory('${category.name}')">
            <i class="fas ${categoryIcons[category.name] || 'fa-utensils'}"></i>
            <h4>${category.name}</h4>
            <p>${category.count} وصفة</p>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.toLowerCase();
        displayRecipes();
    });

    categoryFilter.addEventListener('change', function(e) {
        currentCategory = e.target.value;
        displayRecipes();
        updateCategoryCards();
    });
}

// Filter by category and navigate to recipes page
function filterByCategory(category) {
    // Navigate to recipes page with category filter
    window.location.href = `recipes.html?category=${encodeURIComponent(category)}`;
}

// Update category cards active state
function updateCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        const categoryName = card.querySelector('h4').textContent;
        if (currentCategory === categoryName) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// Display recipes
function displayRecipes() {
    const recipesGrid = document.getElementById('recipesGrid');
    let filteredRecipes = recipes;

    // Filter by category
    if (currentCategory !== 'all') {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.category === currentCategory);
    }

    // Filter by search query
    if (searchQuery) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(searchQuery) ||
            recipe.description.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredRecipes.length === 0) {
        recipesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد وصفات</h3>
                <p>حاول تغيير معايير البحث أو التصفية</p>
            </div>
        `;
        return;
    }

    recipesGrid.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.image || `https://picsum.photos/seed/${recipe.id}/300/200.jpg`}" 
                     alt="${recipe.title}">
                <button class="favorite-btn ${favorites.includes(recipe.id) ? 'active' : ''}" 
                        onclick="toggleFavorite('${recipe.id}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <span class="recipe-category">${recipe.category}</span>
                    <div class="recipe-difficulty">
                        ${generateDifficultyStars(recipe.difficulty)}
                    </div>
                </div>
                <h3 class="recipe-title" onclick="goToRecipeDetail('${recipe.id}')" style="cursor: pointer;">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-info">
                    <span>
                        <i class="fas fa-clock"></i>
                        ${(recipe.prepTime || 0) + (recipe.cookTime || 0)} دقيقة
                    </span>
                    <span>
                        <i class="fas fa-users"></i>
                        ${recipe.servings || 0} أشخاص
                    </span>
                </div>
                ${recipe.youtubeUrl ? `
                <div class="recipe-youtube">
                    <a href="${recipe.youtubeUrl}" target="_blank" class="youtube-link">
                        <i class="fab fa-youtube"></i>
                        شاهد الفيديو
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Display user recipes
function displayUserRecipes() {
    const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
    const userRecipesSection = document.getElementById('userRecipesSection');
    const userRecipesGrid = document.getElementById('userRecipesGrid');
    
    if (userRecipes.length === 0) {
        userRecipesSection.style.display = 'none';
        return;
    }
    
    userRecipesSection.style.display = 'block';
    
    userRecipesGrid.innerHTML = userRecipes.map(recipe => `
        <div class="recipe-card user-recipe">
            <div class="recipe-image">
                <img src="${recipe.image || `https://picsum.photos/seed/${recipe.id}/300/200.jpg`}" 
                     alt="${recipe.title}">
                <button class="favorite-btn ${favorites.includes(recipe.id) ? 'active' : ''}" 
                        onclick="toggleFavorite('${recipe.id}')">
                    <i class="fas fa-heart"></i>
                </button>
                <div class="user-recipe-badge">
                    <i class="fas fa-user"></i>
                </div>
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <span class="recipe-category">${recipe.category}</span>
                    <div class="recipe-difficulty">
                        ${generateDifficultyStars(recipe.difficulty)}
                    </div>
                </div>
                <h3 class="recipe-title" onclick="goToRecipeDetail('${recipe.id}')" style="cursor: pointer;">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-info">
                    <span>
                        <i class="fas fa-clock"></i>
                        ${(recipe.prepTime || 0) + (recipe.cookTime || 0)} دقيقة
                    </span>
                    <span>
                        <i class="fas fa-users"></i>
                        ${recipe.servings || 0} أشخاص
                    </span>
                </div>
                ${recipe.youtubeUrl ? `
                <div class="recipe-youtube">
                    <a href="${recipe.youtubeUrl}" target="_blank" class="youtube-link">
                        <i class="fab fa-youtube"></i>
                        شاهد الفيديو
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Generate difficulty stars
function generateDifficultyStars(difficulty) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(`<i class="fas fa-star ${i <= difficulty ? 'active' : ''}"></i>`);
    }
    return stars.join('');
}

// Toggle favorite
function toggleFavorite(recipeId) {
    const index = favorites.indexOf(recipeId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(recipeId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayRecipes();
    displayUserRecipes(); // Refresh user recipes display
}

// Display error message
function displayError() {
    const recipesGrid = document.getElementById('recipesGrid');
    recipesGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>حدث خطأ</h3>
            <p>لا يمكن تحميل الوصفات حالياً</p>
        </div>
    `;
}

// Utility functions
function goToRecipeDetail(recipeId) {
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}

function formatTime(minutes) {
    if (!minutes) return '0 دقيقة';
    return `${minutes} دقيقة`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}