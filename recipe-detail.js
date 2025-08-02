// Recipe Detail Page JavaScript
let currentRecipe = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Recipe detail page loaded');
    
    // Check if we can find the recipe detail element
    const recipeDetail = document.getElementById('recipeDetail');
    console.log('Recipe detail element found:', recipeDetail);
    
    if (recipeDetail) {
        recipeDetail.innerHTML = '<p>جاري تحميل الوصفة...</p>';
    }
    
    loadRecipeDetail();
});

// Load recipe details from URL parameter
async function loadRecipeDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    
    if (!recipeId) {
        displayError('لم يتم تحديد وصفة');
        return;
    }
    
    try {
        // Load recipes from local file
        const response = await fetch('https://mohamed14200.github.io/todolist/recipes.json');
        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }
        const recipes = await response.json();
        
        // Find the recipe by ID (convert both to string for comparison)
        currentRecipe = recipes.find(recipe => String(recipe.id) === String(recipeId));
        
        if (!currentRecipe) {
            // Check user recipes
            const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
            currentRecipe = userRecipes.find(recipe => String(recipe.id) === String(recipeId));
        }
        
        if (currentRecipe) {
            console.log('Recipe found:', currentRecipe);
            displayRecipeDetail();
        } else {
            console.log('Recipe not found for ID:', recipeId);
            displayError('الوصفة غير موجودة');
        }
    } catch (error) {
        console.error('Error loading recipe:', error);
        displayError('حدث خطأ في تحميل الوصفة');
    }
}

// Display recipe details
function displayRecipeDetail() {
    const recipeDetail = document.getElementById('recipeDetail');
    
    // Check if element exists
    if (!recipeDetail) {
        console.error('Recipe detail element not found');
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorite = favorites.includes(currentRecipe.id);
    
    recipeDetail.innerHTML = `
        <div class="recipe-detail-header">
            <div class="recipe-detail-image">
                <img src="${currentRecipe.image || `https://picsum.photos/seed/${currentRecipe.id}/600/400.jpg`}" 
                     alt="${currentRecipe.title}">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        onclick="toggleFavorite('${currentRecipe.id}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="recipe-detail-info">
                <div class="recipe-detail-meta">
                    <span class="recipe-category">${currentRecipe.category}</span>
                    <div class="recipe-difficulty">
                        ${generateDifficultyStars(currentRecipe.difficulty)}
                    </div>
                </div>
                <h1 class="recipe-detail-title">${currentRecipe.title}</h1>
                <p class="recipe-detail-description">${currentRecipe.description}</p>
                <div class="recipe-detail-stats">
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>${(currentRecipe.prepTime || 0) + (currentRecipe.cookTime || 0)} دقيقة</strong>
                            <span>الوقت الكلي</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <strong>${currentRecipe.servings || 0}</strong>
                            <span>عدد الأشخاص</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-signal"></i>
                        <div>
                            <strong>${currentRecipe.difficulty || 1}/5</strong>
                            <span>الصعوبة</span>
                        </div>
                    </div>
                </div>
                ${currentRecipe.youtubeUrl ? (() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let youtubeLink = currentRecipe.youtubeUrl;
    if (isMobile && youtubeLink.includes('watch?v=')) {
        const videoId = youtubeLink.split('v=')[1].split('&')[0];
        youtubeLink = `vnd.youtube://${videoId}`;
    }
    return `
        <div class="recipe-youtube-section">
            <a href="${youtubeLink}" target="_blank" rel="noopener noreferrer" class="youtube-button">
                <i class="fab fa-youtube"></i>
                مشاهدة طريقة التحضير على اليوتيوب
            </a>
        </div>
    `;
})() : ''}
            </div>
        </div>
        
        <div class="recipe-detail-content">
            <div class="ingredients-section">
                <h2><i class="fas fa-list"></i> المقادير</h2>
                <div class="ingredients-list">
                    ${currentRecipe.ingredients.map(ingredient => `
                        <div class="ingredient-item">
                            <span class="ingredient-name">${ingredient.name}</span>
                            <span class="ingredient-quantity">
                                ${ingredient.quantity} ${ingredient.unit}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="steps-section">
                <h2><i class="fas fa-tasks"></i> خطوات التحضير</h2>
                <div class="steps-list">
                    ${currentRecipe.steps.map((step, index) => `
                        <div class="step-item">
                            <div class="step-number">${index + 1}</div>
                            <div class="step-content">${step}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="recipe-detail-actions">
            <a href="recipes.html" class="btn-outline">
                <i class="fas fa-arrow-right"></i>
                العودة للوصفات
            </a>
            <button class="btn" onclick="printRecipe()">
                <i class="fas fa-print"></i>
                طباعة الوصفة
            </button>
        </div>
    `;
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
    
    // Update the button appearance
    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.classList.toggle('active');
    }
}

// Display error message
function displayError(message) {
    const recipeDetail = document.getElementById('recipeDetail');
    
    // Check if element exists
    if (!recipeDetail) {
        console.error('Recipe detail element not found for error display');
        return;
    }
    
    recipeDetail.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>حدث خطأ</h2>
            <p>${message}</p>
            <a href="recipes.html" class="btn">العودة للوصفات</a>
        </div>
    `;
}

// Print recipe
function printRecipe() {
    window.print();
}