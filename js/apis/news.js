// News API Configuration
// IMPORTANT: For production, move this to environment variables or backend
const NEWS_API_KEY = '79377d568bcf41a09bd598b6fa41fcfb';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Current state
let currentCategory = 'general';
let currentCountry = 'us';
let newsData = [];

// Article cache system for background preloading
const articleCache = {
    data: {},
    timestamps: {},
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds

    set(category, articles) {
        this.data[category] = articles;
        this.timestamps[category] = Date.now();
    },

    get(category) {
        const timestamp = this.timestamps[category];
        if (!timestamp) return null;

        // Check if cache is expired
        if (Date.now() - timestamp > this.CACHE_DURATION) {
            delete this.data[category];
            delete this.timestamps[category];
            return null;
        }

        return this.data[category];
    },

    has(category) {
        return this.get(category) !== null;
    }
};
// Initialize news feature
document.addEventListener('DOMContentLoaded', () => {
    initializeNewsFilters();
    fetchNews(currentCategory);
    fetchFeaturedStory();

    // Background preload other categories after initial load
    setTimeout(() => {
        preloadCategories();
    }, 2000); // Wait 2 seconds after initial load
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

        // Prefetch on hover for instant loading
        button.addEventListener('mouseenter', () => {
            const category = button.dataset.category;
            if (category && !articleCache.has(category)) {
                prefetchCategory(category);
            }
        });

        button.dataset.hasListener = 'true';
    });
}

// Fetch featured/top story
async function fetchFeaturedStory() {
    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const endpoint = `${NEWS_API_BASE_URL}/top-headlines`;
        const params = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            country: currentCountry,
            pageSize: 5 // Fetch more to ensure we get one with an image
        });

        const apiUrl = `${endpoint}?${params}`;
        const proxiedUrl = `${corsProxy}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxiedUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            // Find first article with an image
            const articleWithImage = data.articles.find(article =>
                article.urlToImage && article.urlToImage.trim() !== ''
            );

            if (articleWithImage) {
                displayFeaturedStory(articleWithImage);
            } else {
                // Hide featured section if no articles with images
                const featuredSection = document.getElementById('featured-story-section');
                if (featuredSection) featuredSection.style.display = 'none';
            }
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
                <button class="featured-read-btn">
                    Read Full Story →
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
    // Check cache first
    const cachedArticles = articleCache.get(category);
    if (cachedArticles) {
        console.log(`Loading ${category} from cache`);
        newsData = cachedArticles;
        displayNews(cachedArticles);
        return;
    }

    setLoadingState('news', true);

    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const endpoint = `${NEWS_API_BASE_URL}/top-headlines`;
        const params = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            country: currentCountry,
            category: category,
            pageSize: 50 // Fetch more to ensure we have enough with images
        });

        const apiUrl = `${endpoint}?${params}`;
        const proxiedUrl = `${corsProxy}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxiedUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'ok' && data.articles) {
            // Filter articles to only include those with images
            const articlesWithImages = data.articles.filter(article =>
                article.title &&
                article.title !== '[Removed]' &&
                article.description &&
                article.description !== '[Removed]' &&
                article.urlToImage &&
                article.urlToImage.trim() !== ''
            ).slice(0, 20); // Take first 20 articles with images

            newsData = articlesWithImages;

            // Store in cache
            articleCache.set(category, articlesWithImages);

            displayNews(articlesWithImages);
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
                        Read Article 🔗
                    </span>
                </div>
            </div>
        </article>
    `;
}

// Optional: Refresh functionality
function refreshNews() {
    fetchNews(currentCategory);
}

// Background preload all categories
async function preloadCategories() {
    const categories = ['technology', 'business', 'sports', 'entertainment', 'science', 'health'];

    console.log('Starting background preload of categories...');

    // Preload categories that aren't already cached
    const preloadPromises = categories
        .filter(cat => !articleCache.has(cat))
        .map(cat => prefetchCategory(cat));

    await Promise.all(preloadPromises);
    console.log('Background preload complete!');
}

// Prefetch a single category (used for hover and background preload)
async function prefetchCategory(category) {
    // Don't prefetch if already cached
    if (articleCache.has(category)) {
        return;
    }

    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const endpoint = `${NEWS_API_BASE_URL}/top-headlines`;
        const params = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            country: currentCountry,
            category: category,
            pageSize: 50
        });

        const apiUrl = `${endpoint}?${params}`;
        const proxiedUrl = `${corsProxy}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxiedUrl);

        if (!response.ok) {
            console.warn(`Failed to prefetch ${category}`);
            return;
        }

        const data = await response.json();

        if (data.status === 'ok' && data.articles) {
            // Filter articles with images
            const articlesWithImages = data.articles.filter(article =>
                article.title &&
                article.title !== '[Removed]' &&
                article.description &&
                article.description !== '[Removed]' &&
                article.urlToImage &&
                article.urlToImage.trim() !== ''
            ).slice(0, 20);

            // Store in cache
            articleCache.set(category, articlesWithImages);
            console.log(`Prefetched ${category}: ${articlesWithImages.length} articles`);
        }
    } catch (error) {
        console.warn(`Error prefetching ${category}:`, error);
    }
}


