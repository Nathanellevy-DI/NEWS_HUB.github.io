// News API Configuration
const NEWS_API_KEY = '79377d568bcf41a09bd598b6fa41fcfb';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Current state
let currentCategory = 'general';
let currentCountry = 'us';
let newsData = [];

// Initialize news feature
document.addEventListener('DOMContentLoaded', () => {
    initializeNewsFilters();
    fetchNews(currentCategory);
});

// Set up category filter buttons
function initializeNewsFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.dataset.category;
            currentCategory = category;
            fetchNews(category);
        });
    });
}

// Fetch news from NewsAPI with CORS proxy
async function fetchNews(category = 'general') {
    setLoadingState('news', true);

    try {
        // CORS proxy to bypass browser restrictions
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
            updateStats(data.articles);
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

    return `
        <article class="news-card" onclick="window.open('${url}', '_blank')">
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
                    <a href="${url}" target="_blank" class="read-more" onclick="event.stopPropagation()">
                        Read Article ⚡
                    </a>
                </div>
            </div>
        </article>
    `;
}

// Update statistics display
function updateStats(articles) {
    const statsContainer = document.getElementById('news-stats');
    if (!statsContainer) return;

    const totalArticles = articles.length;
    const sources = new Set(articles.map(a => a.source.name)).size;
    const recentArticles = articles.filter(a => {
        const publishedDate = new Date(a.publishedAt);
        const now = new Date();
        const hoursDiff = (now - publishedDate) / (1000 * 60 * 60);
        return hoursDiff < 24;
    }).length;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📰</div>
            <div class="stat-value">${totalArticles}</div>
            <div class="stat-label">Articles</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📡</div>
            <div class="stat-value">${sources}</div>
            <div class="stat-label">Sources</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-value">${recentArticles}</div>
            <div class="stat-label">Last 24h</div>
        </div>
    `;
}

// Optional: Refresh functionality
function refreshNews() {
    fetchNews(currentCategory);
}
