// Article reader modal functionality

let currentArticle = null;

// Initialize article reader
document.addEventListener('DOMContentLoaded', () => {
    initializeArticleReader();
});

function initializeArticleReader() {
    const closeModalBtn = document.getElementById('close-article-modal');
    const openInAppBtn = document.getElementById('open-in-app-btn');
    const openExternalBtn = document.getElementById('open-external-btn');
    const fallbackExternalBtn = document.getElementById('fallback-external-btn');
    const articleModal = document.getElementById('article-modal');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeArticleModal);
    }

    if (openInAppBtn) {
        openInAppBtn.addEventListener('click', openArticleInApp);
    }

    if (openExternalBtn) {
        openExternalBtn.addEventListener('click', openArticleExternal);
    }

    if (fallbackExternalBtn) {
        fallbackExternalBtn.addEventListener('click', openArticleExternal);
    }

    // Close modal on outside click
    if (articleModal) {
        articleModal.addEventListener('click', (e) => {
            if (e.target === articleModal) {
                closeArticleModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && articleModal && articleModal.classList.contains('active')) {
            closeArticleModal();
        }
    });
}

function openArticleModal(article) {
    currentArticle = article;

    // Check if article can be embedded - if not, open directly in new tab
    const canEmbed = window.isIframeBlocked && !window.isIframeBlocked(article.url);

    if (!canEmbed) {
        // Article is blocked - open directly in new tab instead of showing modal
        window.open(article.url, '_blank');
        return;
    }

    // Article can be embedded - show modal
    const modal = document.getElementById('article-modal');
    if (!modal) return;

    // Populate preview
    const previewImage = document.getElementById('article-preview-image');
    const previewSource = document.querySelector('.article-preview-source');
    const previewTitle = document.querySelector('.article-preview-title');
    const previewDescription = document.querySelector('.article-preview-description');

    if (previewImage) {
        if (article.urlToImage) {
            previewImage.src = article.urlToImage;
            previewImage.style.display = 'block';
        } else {
            previewImage.style.display = 'none';
        }
    }

    if (previewSource) {
        previewSource.textContent = article.source.name || 'Unknown Source';
    }

    if (previewTitle) {
        previewTitle.textContent = article.title;
    }

    if (previewDescription) {
        previewDescription.textContent = article.description || 'No description available.';
    }

    // Reset iframe state
    const iframeContainer = document.getElementById('article-iframe-container');
    const articleActions = document.querySelector('.article-actions');
    const articlePreview = document.getElementById('article-preview');

    if (iframeContainer) iframeContainer.style.display = 'none';
    if (articleActions) articleActions.style.display = 'flex';
    if (articlePreview) articlePreview.style.display = 'block';

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeArticleModal() {
    const modal = document.getElementById('article-modal');
    const iframe = document.getElementById('article-iframe');

    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Clear iframe
    if (iframe) {
        iframe.src = 'about:blank';
    }

    currentArticle = null;
}

function openArticleInApp() {
    if (!currentArticle) return;

    const iframeContainer = document.getElementById('article-iframe-container');
    const iframe = document.getElementById('article-iframe');
    const articleActions = document.querySelector('.article-actions');
    const articlePreview = document.getElementById('article-preview');
    const iframeError = document.getElementById('iframe-error');

    // Hide preview and actions
    if (articlePreview) articlePreview.style.display = 'none';
    if (articleActions) articleActions.style.display = 'none';

    // Show iframe container
    if (iframeContainer) iframeContainer.style.display = 'block';
    if (iframeError) iframeError.style.display = 'none';

    // Load article in iframe
    if (iframe) {
        iframe.src = currentArticle.url;

        // Handle iframe load errors
        iframe.onerror = () => {
            showIframeError();
        };

        // Check if iframe loaded successfully after 3 seconds
        setTimeout(() => {
            try {
                // Try to access iframe content (will fail if blocked)
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDoc || iframeDoc.location.href === 'about:blank') {
                    showIframeError();
                }
            } catch (e) {
                // CORS error or X-Frame-Options blocking
                // This is expected for many sites, but iframe might still work
                console.log('Iframe may be blocked by CORS or X-Frame-Options');
            }
        }, 3000);
    }
}

function showIframeError() {
    const iframeError = document.getElementById('iframe-error');
    const iframe = document.getElementById('article-iframe');

    if (iframe) iframe.style.display = 'none';
    if (iframeError) iframeError.style.display = 'flex';
}

function openArticleExternal() {
    if (!currentArticle) return;

    window.open(currentArticle.url, '_blank');
    closeArticleModal();
}

// Export for use in news.js
window.openArticleModal = openArticleModal;
