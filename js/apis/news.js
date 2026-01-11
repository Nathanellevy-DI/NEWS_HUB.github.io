// News API Configuration
// IMPORTANT: For production, move this to environment variables or backend
const NEWS_API_KEY = '79377d568bcf41a09bd598b6fa41fcfb';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Current state
let currentCategory = 'general';
let currentCountry = 'us';
let newsData = [];

// List of known domains that block iframe embedding
const IFRAME_BLOCKED_DOMAINS = [
    'bbc.com',
    'bbc.co.uk',
    'nytimes.com',
    'wsj.com',
    'washingtonpost.com',
    'theguardian.com',
    'cnn.com',
    'foxnews.com',
    'reuters.com',
    'bloomberg.com',
    'forbes.com',
    'espn.com',
    'techcrunch.com',
    'wired.com',
    'theverge.com'
];

// Initialize news feature
document.addEventListener('DOMContentLoaded', () => {
    initializeNewsFilters();
    fetchNews(currentCategory);
    fetchFeaturedStory();
});

// Set up category filter buttons
function initializeNewsFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn:not(.add-category-btn):not(.custom-category-btn)');

    filterButtons.forEach(button => {
        // Skip if already has listener (custom categories)
        if (button.dataset.hasListener) return;

        button.addEventListener('click', () => {
            // Deactivate all filters
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.dataset.category;
            if (category) {
                currentCategory = category;

                // Update section title
                const sectionTitle = document.getElementById('section-title-text');
                if (sectionTitle) {
                    const categoryName = button.textContent.trim();
                    sectionTitle.textContent = categoryName === 'All News' ? 'Latest Headlines' : `${categoryName} News`;
                }

                // Clear search
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';

                // Show featured story
                const featuredSection = document.getElementById('featured-story-section');
                if (featuredSection) {
                    featuredSection.style.display = category === 'general' ? 'block' : 'none';
                }

                fetchNews(category);
            }
        });

        button.dataset.hasListener = 'true';
    });
}

// Check if a URL's domain blocks iframe embedding
function isIframeBlocked(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Check against known blocked domains
        return IFRAME_BLOCKED_DOMAINS.some(domain =>
            hostname.includes(domain)
        );
    } catch (e) {
        return false;
    }
}

// Fetch featured/top story
async function fetchFeaturedStory() {
    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const endpoint = `${NEWS_API_BASE_URL}/top-headlines`;
        const params = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            country: currentCountry,
            pageSize: 1
        });

        const apiUrl = `${endpoint}?${params}`;
        const proxiedUrl = `${corsProxy}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxiedUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            displayFeaturedStory(data.articles[0]);
        }
    } catch (error) {
        console.error('Error fetching featured story:', error);
        // Hide featured section on error
        const featuredSection = document.getElementById('featured-story-section');
        if (featuredSection) featuredSection.style.display = 'none';
    }
}

// Display featured story
function displayFeaturedStory(article) {
    const featuredStory = document.getElementById('featured-story');
    const featuredSection = document.getElementById('featured-story-section');

    if (!featuredStory || !article) return;

    const imageHTML = article.urlToImage
        ? `<img src="${article.urlToImage}" alt="${article.title}" class="featured-image">`
        : '<div class="featured-image-placeholder">📰</div>';

    // Add iframe availability indicator
    const canEmbed = !isIframeBlocked(article.url);
    const embedBadge = canEmbed
        ? '<span class="embed-badge embed-available">📖 Read in NewsHub</span>'
        : '<span class="embed-badge embed-blocked">🔗 External Only</span>';

    featuredStory.innerHTML = `
        <div class="featured-card" onclick='openArticleModal(${JSON.stringify(article).replace(/'/g, "&apos;")})'>
            ${imageHTML}
            <div class="featured-content">
                <div class="featured-source">
                    <span class="source-badge">${article.source.name}</span>
                    <span class="featured-date">${formatDate(article.publishedAt)}</span>
                </div>
                <h3 class="featured-title">${article.title}</h3>
                <p class="featured-description">${article.description || ''}</p>
                ${embedBadge}
                <button class="featured-read-btn">
                    Read Full Story ⚡
                </button>
            </div>
        </div>
    `;

    if (featuredSection) {
        featuredSection.style.display = 'block';
    }
}

// Fetch news from NewsAPI with CORS proxy
async function fetchNews(category = 'general') {
    setLoadingState('news', true);

    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const endpoint = `${NEWS_API_BASE_URL}/top-headlines`;
        const params = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            country: currentCountry,
            category: category,
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
        } else {
            throw new Error('Invalid response from News API');
        }

    } catch (error) {
        console.error('Error fetching news:', error);
        showError('news', 'Unable to load news. Please check your connection or try again later.');
    } finally {
        setLoadingState('news', false);
    }
}

// Display news articles in the grid
function displayNews(articles) {
    const newsGrid = document.getElementById('news-grid');

    if (!newsGrid) return;

    const validArticles = articles.filter(article =>
        article.title &&
        article.title !== '[Removed]' &&
        article.description &&
        article.description !== '[Removed]'
    );

    if (validArticles.length === 0) {
        newsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p style="font-size: 1.2rem; font-weight: 600;">⚡ No news articles found for this category.</p>
                <p style="margin-top: 1rem;">Try selecting a different category.</p>
            </div>
        `;
        return;
    }

    newsGrid.innerHTML = validArticles.map((article, index) => createNewsCard(article, index)).join('');
}

// Create a single news card
function createNewsCard(article, index) {
    const {
        title,
        description,
        url,
        urlToImage,
        source,
        publishedAt
    } = article;

    const imageHTML = urlToImage
        ? `<img src="${urlToImage}" alt="${title}" class="news-image" onerror="this.parentElement.innerHTML='<div class=\\'news-image-placeholder\\'>📰</div>'">`
        : `<div class="news-image-placeholder">📰</div>`;

    // Add lightning bolt to first 3 articles (trending)
    const trendingBadge = index < 3 ? '<span class="trending-badge">⚡ TRENDING</span>' : '';

    // Check if article can be embedded
    const canEmbed = !isIframeBlocked(url);
    const embedIndicator = canEmbed
        ? '<span class="embed-indicator" title="Can be read in NewsHub">📖</span>'
        : '<span class="embed-indicator blocked" title="Opens in new tab">🔗</span>';

    // Escape quotes for JSON
    const articleJSON = JSON.stringify(article).replace(/'/g, "&apos;");

    return `
        <article class="news-card" onclick='openArticleModal(${articleJSON})'>
            ${trendingBadge}
            ${imageHTML}
            <div class="news-content">
                <div class="news-source">
                    <span class="source-name">${source.name || 'Unknown Source'}</span>
                    <span class="news-date">${formatDate(publishedAt)}</span>
                </div>
                <h3 class="news-title">${title}</h3>
                <p class="news-description">${description || 'No description available.'}</p>
                <div class="news-footer">
                    <span class="read-more">
                        Read Article ⚡
                    </span>
                    ${embedIndicator}
                </div>
            </div>
        </article>
    `;
}

// Optional: Refresh functionality
function refreshNews() {
    fetchNews(currentCategory);
}

// Export for use in article-reader.js
window.isIframeBlocked = isIframeBlocked;
