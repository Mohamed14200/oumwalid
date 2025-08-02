// my-recipes.js - عرض وصفات المستخدم المحفوظة

document.addEventListener('DOMContentLoaded', function() {
    displayMyRecipes();
});

// عرض وصفاتي المحفوظة
function displayMyRecipes() {
    const recipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
    const container = document.getElementById('myRecipesList');
    const noRecipesMsg = document.getElementById('noMyRecipesMsg');
    
    if (!container || !noRecipesMsg) return;
    
    if (recipes.length === 0) {
        noRecipesMsg.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    noRecipesMsg.style.display = 'none';
    container.style.display = 'grid';
    
    container.innerHTML = recipes.map((recipe, index) => `
        <div class="recipe-card" data-id="${recipe.id}">
            <div class="recipe-image">
                <img src="${recipe.image || `https://picsum.photos/seed/${recipe.id}/300/200.jpg`}" 
                     alt="${recipe.title}">
                <div class="user-recipe-badge">
                    <i class="fas fa-user"></i>
                </div>
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <span class="recipe-category">${recipe.category || 'بدون تصنيف'}</span>
                    <div class="recipe-difficulty">
                        ${generateDifficultyStars(recipe.difficulty || 3)}
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
                </div>` : ''}
            </div>
        </div>
    `).join('');
    
    // إضافة مستمعات الأحداث للبطاقات
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            window.location.href = `recipe-detail.html?id=${recipeId}`;
        });
    });
}

// دالة إنشاء نجوم الصعوبة
function generateDifficultyStars(difficulty) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(`<i class="fas fa-utensil-spoon ${i <= difficulty ? 'active' : ''}"></i>`);
    }
    return stars.join('');
}
