// Article reader - Simplified to open articles directly in new tabs
// Since virtually all news sites block iframe embedding, we skip the modal entirely

// Open article directly in new tab
function openArticleModal(article) {
    if (article && article.url) {
        window.open(article.url, '_blank');
    }
}

// Export for use in news.js
window.openArticleModal = openArticleModal;
