// Sidebar Navigation and Page Management

// Initialize sidebar navigation
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    initializeSavedArticles();
});

// Sidebar navigation state
let currentPage = 'home';

function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item, .bottom-nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    // Update active nav item in both sidebar and bottom nav
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll(`[data-page="${page}"]`).forEach(item => {
        item.classList.add('active');
    });

    // Update current page
    currentPage = page;

    // Show appropriate content
    switch (page) {
        case 'home':
            showHomePage();
            break;
        case 'categories':
            showCategoriesPage();
            break;
        case 'saved':
            showSavedPage();
            break;
        case 'settings':
            showSettingsPage();
            break;
    }
}

function showHomePage() {
    // Show main news section
    document.getElementById('news-section').style.display = 'block';
    document.getElementById('featured-story-section').style.display = 'none';

    // Hide other pages
    hideCustomPages();

    // Update section title
    document.getElementById('section-title-text').textContent = 'Latest Headlines';
}

function showCategoriesPage() {
    // Hide news section
    document.getElementById('news-section').style.display = 'none';
    document.getElementById('featured-story-section').style.display = 'none';

    // Show categories page
    let categoriesPage = document.getElementById('categories-page');
    if (!categoriesPage) {
        categoriesPage = createCategoriesPage();
    }
    categoriesPage.style.display = 'block';
}

function showSavedPage() {
    // Hide news section
    document.getElementById('news-section').style.display = 'none';
    document.getElementById('featured-story-section').style.display = 'none';

    // Show saved page
    let savedPage = document.getElementById('saved-page');
    if (!savedPage) {
        savedPage = createSavedPage();
    }
    savedPage.style.display = 'block';
    renderSavedArticles();
}

function showSettingsPage() {
    // Hide news section
    document.getElementById('news-section').style.display = 'none';
    document.getElementById('featured-story-section').style.display = 'none';

    // Show settings page
    let settingsPage = document.getElementById('settings-page');
    if (!settingsPage) {
        settingsPage = createSettingsPage();
    }
    settingsPage.style.display = 'block';
}

function hideCustomPages() {
    ['categories-page', 'saved-page', 'settings-page'].forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.style.display = 'none';
    });
}

// Create Categories Page
function createCategoriesPage() {
    const container = document.querySelector('.container');
    const page = document.createElement('section');
    page.id = 'categories-page';
    page.className = 'feature-section';
    page.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">
                <span class="icon">📂</span>
                Manage Categories
            </h2>
        </div>
        <div class="categories-grid">
            <div class="category-card" data-category="general">
                <div class="category-icon">📰</div>
                <h3>General News</h3>
                <p>All the latest news from around the world</p>
            </div>
            <div class="category-card" data-category="technology">
                <div class="category-icon">💻</div>
                <h3>Technology</h3>
                <p>Tech news, gadgets, and innovations</p>
            </div>
            <div class="category-card" data-category="business">
                <div class="category-icon">💼</div>
                <h3>Business</h3>
                <p>Markets, finance, and business news</p>
            </div>
            <div class="category-card" data-category="sports">
                <div class="category-icon">⚽</div>
                <h3>Sports</h3>
                <p>Sports news, scores, and highlights</p>
            </div>
            <div class="category-card" data-category="entertainment">
                <div class="category-icon">🎬</div>
                <h3>Entertainment</h3>
                <p>Movies, music, and celebrity news</p>
            </div>
            <div class="category-card" data-category="science">
                <div class="category-icon">🔬</div>
                <h3>Science</h3>
                <p>Scientific discoveries and research</p>
            </div>
            <div class="category-card" data-category="health">
                <div class="category-icon">🏥</div>
                <h3>Health</h3>
                <p>Health, wellness, and medical news</p>
            </div>
            <div class="category-card add-custom" id="add-custom-category">
                <div class="category-icon">➕</div>
                <h3>Add Custom</h3>
                <p>Create your own category</p>
            </div>
        </div>
    `;

    container.appendChild(page);

    // Add click handlers
    page.querySelectorAll('.category-card:not(.add-custom)').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            navigateToPage('home');
            // Trigger category filter
            setTimeout(() => {
                document.querySelector(`[data-category="${category}"]`)?.click();
            }, 100);
        });
    });

    page.querySelector('#add-custom-category')?.addEventListener('click', () => {
        document.getElementById('add-category-btn')?.click();
    });

    return page;
}

// Create Saved Page
function createSavedPage() {
    const container = document.querySelector('.container');
    const page = document.createElement('section');
    page.id = 'saved-page';
    page.className = 'feature-section';
    page.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">
                <span class="icon">🔖</span>
                Saved Articles
            </h2>
            <button id="clear-saved-btn" class="filter-btn">Clear All</button>
        </div>
        <div id="saved-articles-grid" class="news-grid"></div>
        <div id="saved-empty" class="empty-state" style="display: none;">
            <span class="empty-icon">📭</span>
            <h3>No Saved Articles</h3>
            <p>Articles you save will appear here</p>
        </div>
    `;

    container.appendChild(page);

    // Add clear all handler
    page.querySelector('#clear-saved-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved articles?')) {
            localStorage.removeItem('savedArticles');
            renderSavedArticles();
            showNotification('All saved articles cleared', 'info');
        }
    });

    return page;
}

// Create Settings Page
function createSettingsPage() {
    const container = document.querySelector('.container');
    const page = document.createElement('section');
    page.id = 'settings-page';
    page.className = 'feature-section';
    page.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">
                <span class="icon">⚙️</span>
                Settings
            </h2>
        </div>
        <div class="settings-container">
            <div class="settings-section">
                <h3>Display Preferences</h3>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="show-images" checked>
                        <span>Show article images</span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="compact-view">
                        <span>Compact view</span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Reading Preferences</h3>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="open-in-app" checked>
                        <span>Open articles in-app (when available)</span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="auto-save">
                        <span>Auto-save read articles</span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Data Management</h3>
                <button id="export-saved-btn" class="settings-btn">Export Saved Articles</button>
                <button id="clear-cache-btn" class="settings-btn">Clear Cache</button>
            </div>
            
            <div class="settings-section">
                <h3>About</h3>
                <p class="about-text">NewsHub - Your gateway to 150,000+ news sources worldwide</p>
                <p class="about-text">Version 2.0.0</p>
            </div>
        </div>
    `;

    container.appendChild(page);

    // Load settings
    loadSettings();

    // Add settings handlers
    page.querySelector('#show-images')?.addEventListener('change', (e) => {
        saveSetting('showImages', e.target.checked);
    });

    page.querySelector('#compact-view')?.addEventListener('change', (e) => {
        saveSetting('compactView', e.target.checked);
        document.body.classList.toggle('compact-view', e.target.checked);
    });

    page.querySelector('#open-in-app')?.addEventListener('change', (e) => {
        saveSetting('openInApp', e.target.checked);
    });

    page.querySelector('#auto-save')?.addEventListener('change', (e) => {
        saveSetting('autoSave', e.target.checked);
    });

    page.querySelector('#export-saved-btn')?.addEventListener('click', exportSavedArticles);
    page.querySelector('#clear-cache-btn')?.addEventListener('click', clearCache);

    return page;
}

// Saved Articles Management
function initializeSavedArticles() {
    // Add save buttons to articles (will be called when articles are rendered)
    window.addSaveButton = function (articleElement, article) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-article-btn';
        saveBtn.innerHTML = isSaved(article) ? '🔖' : '🔗';
        saveBtn.title = isSaved(article) ? 'Unsave article' : 'Save article';

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSaveArticle(article);
            saveBtn.innerHTML = isSaved(article) ? '🔖' : '🔗';
            saveBtn.title = isSaved(article) ? 'Unsave article' : 'Save article';
        });

        const footer = articleElement.querySelector('.news-footer');
        if (footer) {
            footer.appendChild(saveBtn);
        }
    };
}

function isSaved(article) {
    const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    return saved.some(a => a.url === article.url);
}

function toggleSaveArticle(article) {
    let saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    const index = saved.findIndex(a => a.url === article.url);

    if (index > -1) {
        saved.splice(index, 1);
        showNotification('Article removed from saved', 'info');
    } else {
        saved.unshift(article);
        showNotification('Article saved', 'success');
    }

    localStorage.setItem('savedArticles', JSON.stringify(saved));
}

function renderSavedArticles() {
    const grid = document.getElementById('saved-articles-grid');
    const empty = document.getElementById('saved-empty');
    const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');

    if (saved.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = saved.map(article => createNewsCard(article)).join('');

    // Add click handlers
    grid.querySelectorAll('.news-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            openArticleModal(saved[index]);
        });
    });
}

// Settings Management
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('newsHubSettings') || '{}');

    document.getElementById('show-images').checked = settings.showImages !== false;
    document.getElementById('compact-view').checked = settings.compactView === true;
    document.getElementById('open-in-app').checked = settings.openInApp !== false;
    document.getElementById('auto-save').checked = settings.autoSave === true;

    if (settings.compactView) {
        document.body.classList.add('compact-view');
    }
}

function saveSetting(key, value) {
    const settings = JSON.parse(localStorage.getItem('newsHubSettings') || '{}');
    settings[key] = value;
    localStorage.setItem('newsHubSettings', JSON.stringify(settings));
}

function exportSavedArticles() {
    const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    const dataStr = JSON.stringify(saved, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newshub-saved-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('Saved articles exported', 'success');
}

function clearCache() {
    if (confirm('This will clear all cached data. Continue?')) {
        localStorage.removeItem('newsCache');
        showNotification('Cache cleared', 'success');
    }
}

// Helper function to create news card HTML (reused from news.js)
function createNewsCard(article) {
    return `
        <article class="news-card">
            ${article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}" class="news-image">` : '<div class="news-image-placeholder">📰</div>'}
            <div class="news-content">
                <div class="news-source">
                    <span class="source-name">${article.source?.name || 'Unknown'}</span>
                    <span class="news-date">${formatDate(article.publishedAt)}</span>
                </div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || ''}</p>
                <div class="news-footer">
                    <a href="#" class="read-more">Read Article →</a>
                </div>
            </div>
        </article>
    `;
}

// Notification helper
function showNotification(message, type = 'info') {
    // Use existing notification system from custom-categories.js
    if (window.showNotification) {
        window.showNotification(message, type);
    }
}

// Export functions
window.navigateToPage = navigateToPage;
window.toggleSaveArticle = toggleSaveArticle;
window.isSaved = isSaved;
