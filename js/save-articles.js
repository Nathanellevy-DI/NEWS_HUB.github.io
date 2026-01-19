// Save article functionality with folder support

// Check if article is saved
function checkIfArticleSaved(article) {
    const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    return saved.some(item => item.article.url === article.url);
}

// Toggle save article with folder selection
function toggleSaveArticle(article) {
    let saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    const existingIndex = saved.findIndex(item => item.article.url === article.url);

    if (existingIndex > -1) {
        // Unsave
        saved.splice(existingIndex, 1);
        localStorage.setItem('savedArticles', JSON.stringify(saved));
        showNotification('Article removed from saved', 'info');
    } else {
        // Show folder selection modal
        showFolderSelectionModal(article);
    }
}

// Show folder selection modal
function showFolderSelectionModal(article) {
    const folders = JSON.parse(localStorage.getItem('savedFolders') || '["Default", "Read Later", "Important"]');

    const modal = document.createElement('div');
    modal.className = 'folder-modal';
    modal.innerHTML = `
        <div class="folder-modal-content">
            <div class="folder-modal-header">
                <h3>Save to Folder</h3>
                <button class="close-folder-modal">×</button>
            </div>
            <div class="folder-modal-body">
                <div class="folder-list">
                    ${folders.map(folder => `
                        <button class="folder-option" data-folder="${folder}">
                            📁 ${folder}
                        </button>
                    `).join('')}
                </div>
                <div class="new-folder-section">
                    <input type="text" id="new-folder-name" placeholder="Create new folder..." maxlength="30">
                    <button id="create-folder-btn">Create & Save</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    // Close modal
    modal.querySelector('.close-folder-modal').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });

    // Select existing folder
    modal.querySelectorAll('.folder-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const folder = btn.dataset.folder;
            saveArticleToFolder(article, folder);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    });

    // Create new folder
    modal.querySelector('#create-folder-btn').addEventListener('click', () => {
        const folderName = modal.querySelector('#new-folder-name').value.trim();
        if (folderName) {
            if (!folders.includes(folderName)) {
                folders.push(folderName);
                localStorage.setItem('savedFolders', JSON.stringify(folders));
            }
            saveArticleToFolder(article, folderName);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });

    // Enter key to create folder
    modal.querySelector('#new-folder-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#create-folder-btn').click();
        }
    });
}

// Save article to specific folder
function saveArticleToFolder(article, folder) {
    let saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    saved.unshift({
        article: article,
        folder: folder,
        savedAt: new Date().toISOString()
    });
    localStorage.setItem('savedArticles', JSON.stringify(saved));
    showNotification(`Article saved to "${folder}"`, 'success');
}

// Export functions
window.checkIfArticleSaved = checkIfArticleSaved;
window.toggleSaveArticle = toggleSaveArticle;
window.saveArticleToFolder = saveArticleToFolder;
