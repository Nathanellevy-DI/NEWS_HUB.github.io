// Search functionality for NewsHub

let searchHistory = JSON.parse(localStorage.getItem('newsHubSearchHistory')) || [];
let currentSearchQuery = '';

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
});

function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (!searchInput || !searchBtn) return;

    // Search button click
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

    // Enter key to search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        clearSearch();
    });

    // Show/hide clear button
    searchInput.addEventListener('input', (e) => {
        clearSearchBtn.style.display = e.target.value ? 'flex' : 'none';
    });

    // Search suggestions (optional - show recent searches)
    searchInput.addEventListener('focus', () => {
        showSearchSuggestions();
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSearchSuggestions();
        }
    });
}

async function performSearch(query) {
    currentSearchQuery = query;

    // Update section title
    const sectionTitle = document.getElementById('section-title-text');
    if (sectionTitle) {
        sectionTitle.textContent = `Search Results for "${query}"`;
    }

    // Hide featured story during search
    const featuredSection = document.getElementById('featured-story-section');
    if (featuredSection) {
        featuredSection.style.display = 'none';
    }

    // Deactivate category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add to search history
    addToSearchHistory(query);

    // Perform search
    await searchNews(query);
}

async function searchNews(query) {
    setLoadingState('news', true);

    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const endpoint = `${NEWS_API_BASE_URL}/everything`;
        const params = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            q: query,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 20
        });

        const apiUrl = `${endpoint}?${params}`;
        const proxiedUrl = `${corsProxy}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxiedUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'ok' && data.articles) {
            newsData = data.articles;
            displayNews(data.articles);

            if (data.articles.length === 0) {
                showNoResults(query);
            }
        } else {
            throw new Error('Invalid response from News API');
        }

    } catch (error) {
        console.error('Error searching news:', error);
        showError('news', `Unable to search for "${query}". Please try again later.`);
    } finally {
        setLoadingState('news', false);
    }
}

function showNoResults(query) {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    newsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--text-primary);">
                No results found for "${query}"
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                Try different keywords or check your spelling
            </p>
            <button onclick="clearSearch()" class="btn-primary">
                Clear Search
            </button>
        </div>
    `;
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const sectionTitle = document.getElementById('section-title-text');

    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (sectionTitle) sectionTitle.textContent = 'Latest Headlines';

    currentSearchQuery = '';

    // Show featured story again
    const featuredSection = document.getElementById('featured-story-section');
    if (featuredSection) {
        featuredSection.style.display = 'block';
    }

    // Reactivate "All News" category
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-category="general"]')?.classList.add('active');

    // Reload general news
    fetchNews('general');
}

function addToSearchHistory(query) {
    // Remove duplicates
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());

    // Add to beginning
    searchHistory.unshift(query);

    // Keep only last 10 searches
    searchHistory = searchHistory.slice(0, 10);

    // Save to localStorage
    localStorage.setItem('newsHubSearchHistory', JSON.stringify(searchHistory));
}

function showSearchSuggestions() {
    if (searchHistory.length === 0) return;

    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = searchHistory.map(query => `
        <div class="search-suggestion-item" onclick="performSearch('${query}')">
            <span class="suggestion-icon">🕐</span>
            ${query}
        </div>
    `).join('');

    suggestionsContainer.style.display = 'block';
}

function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// Export for use in other modules
window.searchNews = searchNews;
window.clearSearch = clearSearch;
window.performSearch = performSearch;
