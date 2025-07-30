// Recipes Page JavaScript
let allRecipes = [];
let filteredRecipes = [];
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'newest';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check for category parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
        currentCategory = decodeURIComponent(categoryParam);
        document.getElementById('categoryFilter').value = currentCategory;
    }
    
    loadRecipes();
    setupEventListeners();
});

// Load all recipes
async function loadRecipes() {
    try {
        // Load from local file
        const response = await fetch('https://mohamed14200.github.io/todolist/recipes.json');
        const defaultRecipes = await response.json();
        
        // Load user recipes from localStorage
        const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
        
        // Combine all recipes
        allRecipes = [...defaultRecipes, ...userRecipes];
        filteredRecipes = [...allRecipes];
        
        displayRecipes();
        displayUserRecipes();
        updateResultsCount();
    } catch (error) {
        console.error('Error loading recipes from GitHub:', error);
        displayError();
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const categoryButtons = document.querySelectorAll('.category-btn');

    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.toLowerCase();
        filterAndSortRecipes();
    });

    categoryFilter.addEventListener('change', function(e) {
        currentCategory = e.target.value;
        filterAndSortRecipes();
        updateCategoryButtons();
    });

    sortBy.addEventListener('change', function(e) {
        currentSort = e.target.value;
        filterAndSortRecipes();
    });

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            currentCategory = category;
            document.getElementById('categoryFilter').value = category;
            filterAndSortRecipes();
            updateCategoryButtons();
        });
    });
}

// Filter and sort recipes
function filterAndSortRecipes() {
    // Filter by category
    if (currentCategory !== 'all') {
        filteredRecipes = allRecipes.filter(recipe => recipe.category === currentCategory);
    } else {
        filteredRecipes = [...allRecipes];
    }

    // Filter by search query
    if (searchQuery) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(searchQuery) ||
            recipe.description.toLowerCase().includes(searchQuery)
        );
    }

    // Sort recipes
    switch (currentSort) {
        case 'newest':
            filteredRecipes.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            break;
        case 'oldest':
            filteredRecipes.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            break;
        case 'easiest':
            filteredRecipes.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
            break;
        case 'hardest':
            filteredRecipes.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
            break;
    }

    displayRecipes();
    updateResultsCount();
}

// Update category buttons active state
function updateCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        const category = button.getAttribute('data-category');
        if (category === currentCategory) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Update results count
function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    let countText = `تم العثور على ${filteredRecipes.length} وصفة`;
    
    if (currentCategory !== 'all') {
        countText += ` في قسم "${currentCategory}"`;
    }
    
    if (searchQuery) {
        countText += ` تطابق بحث "${searchQuery}"`;
    }
    
    resultsCount.textContent = countText;
}

// Display recipes
function displayRecipes() {
    const recipesGrid = document.getElementById('recipesGrid');
    
    if (filteredRecipes.length === 0) {
        recipesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد وصفات</h3>
                <p>حاول تغيير معايير البحث أو التصفية</p>
                <a href="add-recipe.html" class="btn">أضف وصفة جديدة</a>
            </div>
        `;
        return;
    }

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
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
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.indexOf(recipeId);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(recipeId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayRecipes(); // Refresh display
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

// Go to recipe detail page
function goToRecipeDetail(recipeId) {
    window.location.href = `recipe-detail.html?id=${recipeId}`;
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
    
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
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