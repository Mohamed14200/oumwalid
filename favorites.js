// Favorites Page JavaScript
let allRecipes = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllRecipes();
    displayFavorites();
});

// Load all recipes (both default and user recipes)
async function loadAllRecipes() {
    try {
        // Load default recipes from local file
        const response = await fetch('https://mohamed14200.github.io/todolist/recipes.json');
        const defaultRecipes = await response.json();
        
        // Load user recipes from localStorage
        const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
        
        // Combine all recipes
        allRecipes = [...defaultRecipes, ...userRecipes];
    } catch (error) {
        console.error('Error loading recipes:', error);
        allRecipes = [];
    }
}

// Display favorite recipes
function displayFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoritesGrid = document.getElementById('favoritesGrid');
    const favoritesCount = document.getElementById('favoritesCount');
    
    favoritesCount.textContent = `${favorites.length} وصفة في قائمة المفضلة الخاصة بك`;
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-heart"></i>
                <h3>لا توجد وصفات مفضلة</h3>
                <p>ابدأ بإضافة الوصفات التي تعجبك إلى قائمة المفضلة</p>
                <a href="index.html" class="btn">استكشف الوصفات</a>
            </div>
        `;
        return;
    }

    // Find favorite recipes
    const favoriteRecipes = allRecipes.filter(recipe => favorites.includes(recipe.id));
    
    favoritesGrid.innerHTML = favoriteRecipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.image || `https://picsum.photos/seed/${recipe.id}/300/200.jpg`}" 
                     alt="${recipe.title}">
                <button class="favorite-btn active" onclick="removeFavorite('${recipe.id}')">
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

// Remove from favorites
function removeFavorite(recipeId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(id => id !== recipeId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
}

// Clear all favorites
function clearAllFavorites() {
    if (confirm('هل أنت متأكد من أنك تريد مسح جميع الوصفات المفضلة؟')) {
        localStorage.removeItem('favorites');
        displayFavorites();
    }
}

// Share favorites
function shareFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.length === 0) {
        alert('لا توجد وصفات للمشاركة');
        return;
    }

    const favoriteRecipes = allRecipes.filter(recipe => favorites.includes(recipe.id));
    const shareText = favoriteRecipes.map(recipe => `• ${recipe.title}`).join('\n');
    const fullText = `وصفاتي المفضلة من وصفات أم وليد الجزائرية:\n\n${shareText}\n\nاكتشف المزيد من الوصفات على موقعنا!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'وصفاتي المفضلة',
            text: fullText
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(fullText).then(() => {
            alert('تم نسخ الوصفات المفضلة إلى الحافظة!');
        });
    }
}

// Generate difficulty stars
function generateDifficultyStars(difficulty) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(`<i class="fas fa-star ${i <= difficulty ? 'active' : ''}"></i>`);
    }
    return stars.join('');
}

// Go to recipe detail page
function goToRecipeDetail(recipeId) {
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}