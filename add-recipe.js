// Add Recipe Page JavaScript
let ingredientCount = 1;
let stepCount = 1;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setupFormValidation();
});

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('recipeForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Add new ingredient row
function addIngredient() {
    ingredientCount++;
    const container = document.getElementById('ingredientsContainer');
    const ingredientRow = document.createElement('div');
    ingredientRow.className = 'ingredient-row';
    ingredientRow.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <input type="text" name="ingredientName" placeholder="اسم المكون" required>
            </div>
            <div class="form-group">
                <input type="text" name="ingredientQuantity" placeholder="الكمية">
            </div>
            <div class="form-group">
                <input type="text" name="ingredientUnit" placeholder="الوحدة">
            </div>
            <div class="form-group">
                <button type="button" class="btn-remove" onclick="removeIngredient(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(ingredientRow);
}

// Remove ingredient row
function removeIngredient(button) {
    const container = document.getElementById('ingredientsContainer');
    if (container.children.length > 1) {
        button.closest('.ingredient-row').remove();
        updateStepNumbers();
    }
}

// Add new step row
function addStep() {
    stepCount++;
    const container = document.getElementById('stepsContainer');
    const stepRow = document.createElement('div');
    stepRow.className = 'step-row';
    stepRow.innerHTML = `
        <div class="step-number">${stepCount}</div>
        <div class="form-group">
            <textarea name="stepContent" rows="2" placeholder="اشرح هذه الخطوة بالتفصيل" required></textarea>
        </div>
        <button type="button" class="btn-remove" onclick="removeStep(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(stepRow);
}

// Remove step row
function removeStep(button) {
    const container = document.getElementById('stepsContainer');
    if (container.children.length > 1) {
        button.closest('.step-row').remove();
        updateStepNumbers();
    }
}

// Update step numbers
function updateStepNumbers() {
    const steps = document.querySelectorAll('.step-row');
    steps.forEach((step, index) => {
        const stepNumber = step.querySelector('.step-number');
        stepNumber.textContent = index + 1;
    });
    stepCount = steps.length;
}

// Handle form submission
function handleFormSubmit(e) {
    // عند إضافة وصفة جديدة، سيتم حفظها في myRecipes (وصفاتي)

    e.preventDefault();
    
    const formData = new FormData(e.target);
    const recipe = {
        id: Date.now().toString(),
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        difficulty: parseInt(formData.get('difficulty')),
        prepTime: parseInt(formData.get('prepTime')) || 0,
        cookTime: parseInt(formData.get('cookTime')) || 0,
        servings: parseInt(formData.get('servings')) || 0,
        youtubeUrl: formData.get('youtubeUrl') || '',
        ingredients: [],
        steps: []
    };

    // Collect ingredients
    const ingredientNames = formData.getAll('ingredientName');
    const ingredientQuantities = formData.getAll('ingredientQuantity');
    const ingredientUnits = formData.getAll('ingredientUnit');

    for (let i = 0; i < ingredientNames.length; i++) {
        if (ingredientNames[i].trim()) {
            recipe.ingredients.push({
                name: ingredientNames[i],
                quantity: ingredientQuantities[i] || '',
                unit: ingredientUnits[i] || ''
            });
        }
    }

    // Collect steps
    const stepContents = formData.getAll('stepContent');
    for (let i = 0; i < stepContents.length; i++) {
        if (stepContents[i].trim()) {
            recipe.steps.push(stepContents[i]);
        }
    }

    // Save to localStorage
    saveRecipe(recipe);
    
    // Show success modal
    showSuccessModal();
}

// Save recipe to localStorage
function saveRecipe(recipe) {
    // حفظ في userRecipes فقط (تم توحيد التخزين)
    let recipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
    recipes.push(recipe);
    localStorage.setItem('userRecipes', JSON.stringify(recipes));
    
    // Show success message
    showNotification('تمت إضافة الوصفة بنجاح!', 'success');
    
    // Redirect to my-recipes page after 2 seconds
    setTimeout(() => {
        window.location.href = 'my-recipes.html';
    }, 2000);
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
}