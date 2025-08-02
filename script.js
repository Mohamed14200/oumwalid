// Global variables
let recipes = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentCategory = 'all';
let searchQuery = '';

// Category icons mapping
const categoryIcons = {
    'أطباق رئيسية': 'fa-drumstick-bite',
    'حساء وشوربة': 'fa-utensils',
    'سلطات': 'fa-leaf',
    'حلويات': 'fa-ice-cream',
    'مشروبات': 'fa-mug-hot',
    'مقبلات': 'fa-cheese'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    await loadRecipes();
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
        return recipes; // Return the loaded recipes
    } catch (error) {
        console.error('Error loading recipes from GitHub:', error);
        displayError();
        return []; // Return empty array in case of error
    }
}

// Load categories
function loadCategories() {
    // Count recipes in each category
    const categoryCounts = recipes.reduce((acc, recipe) => {
        acc[recipe.category] = (acc[recipe.category] || 0) + 1;
        return acc;
    }, {});
    
    // Get user recipes from localStorage
    const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
    
    // Count user recipes in each category
    userRecipes.forEach(recipe => {
        if (recipe.category) {
            categoryCounts[recipe.category] = (categoryCounts[recipe.category] || 0) + 1;
        }
    });
    
    // Define all possible categories with their counts
    const allCategories = [
        'أطباق رئيسية',
        'حساء وشوربة',
        'سلطات',
        'حلويات',
        'مشروبات',
        'مقبلات'
    ];
    
    // Create categories array with actual counts
    const categories = allCategories.map(category => ({
        name: category,
        count: categoryCounts[category] || 0
    }));

    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card ${currentCategory === category.name ? 'active' : ''}" 
             onclick="filterByCategory('${category.name}')">
            <div class="category-icon" style="font-size:48px;margin-bottom:10px;">
                <i class="fas ${categoryIcons[category.name] || 'fa-utensils'}"></i>
            </div>
            <h4>${category.name}</h4>
            <p>${category.count} وصفة</p>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const applySearchBtn = document.getElementById('applySearch');

    // Handle search input
    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.toLowerCase();
    });

    // Apply search from modal
    if (applySearchBtn) {
        applySearchBtn.addEventListener('click', function() {
            searchQuery = searchInput.value.toLowerCase();
            currentCategory = categoryFilter.value;
            displayRecipes();
            document.getElementById('searchModal').style.display = 'none';
            
            // Clear filters after search
            searchInput.value = '';
            categoryFilter.value = 'all';
        });
    }

    // Handle category filter
    categoryFilter.addEventListener('change', function(e) {
        currentCategory = e.target.value;
        displayRecipes();
        updateCategoryCards();
    });
}

// Filter by category on the home page
function filterByCategory(category) {
    currentCategory = category === currentCategory ? 'all' : category;
    updateCategoryCards();
    displayRecipes();
    
    // Scroll to recipes section
    const recipesSection = document.querySelector('.recipes');
    if (recipesSection) {
        recipesSection.scrollIntoView({ behavior: 'smooth' });
    }
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
    if (!recipesGrid) return;

    // Combine both default and user recipes
    const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
    let allRecipes = [...recipes, ...userRecipes];
    
    // Filter by search query
    let filteredRecipes = searchQuery ? allRecipes.filter(recipe => 
        recipe.title.toLowerCase().includes(searchQuery) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchQuery)) ||
        (recipe.ingredients && recipe.ingredients.some(ing => 
            ing.name && ing.name.toLowerCase().includes(searchQuery)
        ))
    ) : [...allRecipes];

    // Filter by category
    if (currentCategory !== 'all') {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.category === currentCategory
        );
    }

    // Display filtered recipes
    if (filteredRecipes.length > 0) {
        recipesGrid.innerHTML = filteredRecipes.slice(0, 6).map(recipe => `
            <div class="recipe-card" onclick="goToRecipeDetail('${recipe.id}')">
                <div class="recipe-image">
                    <img src="${recipe.image || 'https://via.placeholder.com/300x200'}" alt="${recipe.title}">
                    ${recipe.userAdded ? '<div class="user-recipe-badge" title="وصفة مضافة من المستخدم"><i class="fas fa-user"></i></div>' : ''}
                </div>
                <div class="recipe-content">
                    <div class="recipe-header">
                        <span class="recipe-category">${recipe.category || 'عام'}</span>
                        <div class="recipe-difficulty">
                            ${generateDifficultyStars(recipe.difficulty || 'medium')}
                        </div>
                    </div>
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-description">${recipe.description || ''}</p>
                    <div class="recipe-info">
                        <span><i class="far fa-clock"></i> ${formatTime((recipe.prepTime || 0) + (recipe.cookTime || 0))}</span>
                        <span><i class="fas fa-utensils"></i> ${recipe.servings || 4} أشخاص</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        recipesGrid.innerHTML = `
            <div class="no-recipes">
                <i class="fas fa-search"></i>
                <h3>لا توجد وصفات متطابقة مع بحثك</h3>
                <p>حاول البحث بكلمات أخرى أو تصفح الفئات المختلفة</p>
            </div>
        `;
    }
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

// Scroll functionality for recipe sections
function scrollRecipes(button, direction) {
    const container = button.parentElement.querySelector('.recipes-grid');
    const scrollAmount = 300; // Adjust scroll amount as needed
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
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