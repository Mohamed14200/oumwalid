// my-recipes.js
// Script to display user's own recipes saved in LocalStorage

document.addEventListener('DOMContentLoaded', function() {
    const myRecipesList = document.getElementById('myRecipesList');
    const noMyRecipesMsg = document.getElementById('noMyRecipesMsg');

    // Retrieve user's recipes from LocalStorage
    let myRecipes = [];
    try {
        myRecipes = JSON.parse(localStorage.getItem('myRecipes')) || [];
    } catch (e) {
        myRecipes = [];
    }

    if (myRecipes.length === 0) {
        noMyRecipesMsg.style.display = 'block';
        myRecipesList.style.display = 'none';
    } else {
        noMyRecipesMsg.style.display = 'none';
        myRecipesList.style.display = 'grid';
        myRecipesList.innerHTML = myRecipes.map(recipe => `
    <div class="recipe-card">
        <div class="recipe-image">
            <img src="${recipe.image || `https://picsum.photos/seed/${recipe.id}/300/200.jpg`}" alt="${recipe.title}">
        </div>
        <div class="recipe-content">
            <div class="recipe-header">
                <span class="recipe-category">${recipe.category}</span>
                <div class="recipe-difficulty">
                    ${generateDifficultyStars(recipe.difficulty)}
                </div>
            </div>
            <h3 class="recipe-title">${recipe.title}</h3>
            <p class="recipe-description">${recipe.description || ''}</p>
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

// نفس دالة النجوم كما في recipes.js
function generateDifficultyStars(difficulty) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fa${i <= difficulty ? 's' : 'r'} fa-star"></i>`;
    }
    return stars;
}
    }
});
