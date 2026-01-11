// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Everything API Hub initialized');

    // Add smooth scroll behavior for any future navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Show/hide loading state
function setLoadingState(sectionId, isLoading) {
    const loadingEl = document.getElementById(`${sectionId}-loading`);
    const errorEl = document.getElementById(`${sectionId}-error`);
    const contentEl = document.getElementById(`${sectionId}-grid`);

    if (loadingEl) loadingEl.style.display = isLoading ? 'flex' : 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (contentEl && !isLoading) contentEl.style.display = 'grid';
}

// Show error state
function showError(sectionId, message = null) {
    const loadingEl = document.getElementById(`${sectionId}-loading`);
    const errorEl = document.getElementById(`${sectionId}-error`);
    const contentEl = document.getElementById(`${sectionId}-grid`);

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
        errorEl.style.display = 'block';
        if (message) {
            const errorText = errorEl.querySelector('p');
            if (errorText) errorText.textContent = message;
        }
    }
    if (contentEl) contentEl.style.display = 'none';
}
