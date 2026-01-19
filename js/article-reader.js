// Enhanced Article Reader with in-platform viewing
// Attempts to fetch and display article content within the app

const articleModal = document.getElementById('article-reader-modal');
const closeArticleBtn = document.getElementById('close-article-modal');
const articleLoading = document.getElementById('article-loading');
const articleContent = document.getElementById('article-content');
const articleError = document.getElementById('article-error');
const externalLink = document.getElementById('article-external-link');
const fallbackLink = document.getElementById('article-fallback-link');

// Close modal handlers
closeArticleBtn?.addEventListener('click', closeArticleModal);
articleModal?.addEventListener('click', (e) => {
    if (e.target === articleModal) {
        closeArticleModal();
    }
});

// ESC key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && articleModal?.classList.contains('active')) {
        closeArticleModal();
    }
});

function closeArticleModal() {
    articleModal?.classList.remove('active');
    document.body.style.overflow = '';
}

// Open article in modal
async function openArticleModal(article) {
    if (!article || !article.url) return;

    // Show modal
    articleModal?.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset states
    articleLoading.style.display = 'flex';
    articleContent.style.display = 'none';
    articleError.style.display = 'none';

    // Set external links
    externalLink.href = article.url;
    fallbackLink.href = article.url;

    try {
        // Display article metadata immediately
        document.getElementById('article-source').textContent = article.source?.name || 'Unknown Source';
        document.getElementById('article-date').textContent = formatDate(article.publishedAt);
        document.getElementById('article-title').textContent = article.title || 'Untitled';

        // Set author if available
        const authorEl = document.getElementById('article-author');
        if (article.author) {
            authorEl.textContent = `By ${article.author}`;
            authorEl.style.display = 'block';
        } else {
            authorEl.style.display = 'none';
        }

        // Set image if available
        const imageEl = document.getElementById('article-image');
        if (article.urlToImage) {
            imageEl.src = article.urlToImage;
            imageEl.style.display = 'block';
        } else {
            imageEl.style.display = 'none';
        }

        // Create article body from description and content
        const bodyEl = document.getElementById('article-body');
        let bodyHTML = '';

        if (article.description) {
            bodyHTML += `<p><strong>${article.description}</strong></p>`;
        }

        if (article.content) {
            // Clean up the content (NewsAPI often truncates with [+xxx chars])
            let content = article.content.replace(/\[\+\d+ chars\]$/, '');

            // Split into paragraphs
            const paragraphs = content.split('\n').filter(p => p.trim());
            paragraphs.forEach(para => {
                if (para.trim()) {
                    bodyHTML += `<p>${para}</p>`;
                }
            });
        }

        // If we have content, show it
        if (bodyHTML) {
            bodyEl.innerHTML = bodyHTML;
            articleLoading.style.display = 'none';
            articleContent.style.display = 'block';
        } else {
            // No content available, show error
            throw new Error('No content available');
        }

    } catch (error) {
        console.error('Error loading article:', error);
        articleLoading.style.display = 'none';
        articleError.style.display = 'block';
    }
}

// Export for use in news.js
window.openArticleModal = openArticleModal;
window.closeArticleModal = closeArticleModal;
