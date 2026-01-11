// Custom category management for NewsHub

let customCategories = JSON.parse(localStorage.getItem('newsHubCustomCategories')) || [];

// Initialize custom categories
document.addEventListener('DOMContentLoaded', () => {
    initializeCustomCategories();
    loadCustomCategories();
});

function initializeCustomCategories() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const closeCategoryModal = document.getElementById('close-category-modal');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const categoryColor = document.getElementById('category-color');

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', openCategoryModal);
    }

    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', closeCategoryModalHandler);
    }

    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCategoryModalHandler);
    }

    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', saveCustomCategory);
    }

    if (categoryColor) {
        categoryColor.addEventListener('input', updateColorPreview);
    }

    // Close modal on outside click
    const categoryModal = document.getElementById('category-modal');
    if (categoryModal) {
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                closeCategoryModalHandler();
            }
        });
    }
}

function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reset form
        document.getElementById('category-name').value = '';
        document.getElementById('category-keywords').value = '';
        document.getElementById('category-color').value = '#c41e3a';
        updateColorPreview();
    }
}

function closeCategoryModalHandler() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function updateColorPreview() {
    const colorInput = document.getElementById('category-color');
    const colorPreview = document.getElementById('color-preview');

    if (colorInput && colorPreview) {
        colorPreview.style.backgroundColor = colorInput.value;
    }
}

function saveCustomCategory() {
    const nameInput = document.getElementById('category-name');
    const keywordsInput = document.getElementById('category-keywords');
    const colorInput = document.getElementById('category-color');

    const name = nameInput.value.trim();
    const keywords = keywordsInput.value.trim();
    const color = colorInput.value;

    // Validation
    if (!name) {
        showNotification('Please enter a category name', 'error');
        return;
    }

    if (!keywords) {
        showNotification('Please enter at least one keyword', 'error');
        return;
    }

    // Create category object
    const category = {
        id: `custom-${Date.now()}`,
        name: name,
        keywords: keywords,
        color: color,
        isCustom: true
    };

    // Add to array
    customCategories.push(category);

    // Save to localStorage
    localStorage.setItem('newsHubCustomCategories', JSON.stringify(customCategories));

    // Add to UI
    addCategoryButton(category);

    // Close modal
    closeCategoryModalHandler();

    // Show success message
    showNotification(`Category "${name}" created successfully!`, 'success');
}

function loadCustomCategories() {
    customCategories.forEach(category => {
        addCategoryButton(category);
    });
}

function addCategoryButton(category) {
    const categoryFilters = document.querySelector('.category-filters');
    const addBtn = document.getElementById('add-category-btn');

    if (!categoryFilters || !addBtn) return;

    // Create button
    const button = document.createElement('button');
    button.className = 'filter-btn custom-category-btn';
    button.dataset.categoryId = category.id;
    button.style.setProperty('--custom-color', category.color);
    button.innerHTML = `
        ${category.name}
        <span class="delete-category">✕</span>
    `;

    // Add click handler for category selection
    button.addEventListener('click', (e) => {
        // Check if delete button was clicked
        if (e.target.classList.contains('delete-category')) {
            e.stopPropagation();
            e.preventDefault();
            deleteCategory(category.id);
        } else {
            handleCustomCategoryClick(category);
        }
    });

    // Insert before "Add Category" button
    categoryFilters.insertBefore(button, addBtn);
}

async function handleCustomCategoryClick(category) {
    // Deactivate all filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activate this button
    const button = document.querySelector(`[data-category-id="${category.id}"]`);
    if (button) {
        button.classList.add('active');
    }

    // Update section title
    const sectionTitle = document.getElementById('section-title-text');
    if (sectionTitle) {
        sectionTitle.textContent = `${category.name} News`;
    }

    // Search using keywords
    const keywords = category.keywords.split(',').map(k => k.trim()).join(' OR ');
    await window.searchNews(keywords);
}

function deleteCategory(categoryId) {
    const category = customCategories.find(c => c.id === categoryId);
    if (!category) return;

    if (confirm(`Delete category "${category.name}"?`)) {
        // Remove from array
        customCategories = customCategories.filter(c => c.id !== categoryId);

        // Update localStorage
        localStorage.setItem('newsHubCustomCategories', JSON.stringify(customCategories));

        // Remove button from UI
        const button = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (button) {
            button.remove();
        }

        // If this category was active, switch to "All News"
        if (button && button.classList.contains('active')) {
            window.clearSearch();
        }

        showNotification(`Category "${category.name}" deleted`, 'success');
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Add icon based on type
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
