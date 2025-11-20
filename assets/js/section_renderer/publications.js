const publicationsRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = renderPublicationItem(item);
        container.appendChild(itemContainer);
    });
    return container;
};

const renderPublicationItem = (item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg card-hover';
    let linksHtml = '';
    if (item.links) {
        linksHtml = '<div class="flex flex-wrap gap-2 mt-3">';
        Object.entries(item.links).forEach(([key, url]) => {
            const icon = key === 'paper' ? 'fa-file-pdf' :
                        key === 'code' ? 'fa-code' :
                        key === 'project' ? 'fa-globe' :
                        key === 'video' ? 'fa-video' :
                        key === 'bibtex' ? 'fa-quote-right' : 'fa-link';

            if (key === 'bibtex') {
                // Special handling for bibtex - clickable button that copies to clipboard
                const labelText = 'BibTeX';
                const copyText = displayKeys.bibtexCopyText[currentLang];
                const copiedText = displayKeys.bibtexCopiedText[currentLang];
                linksHtml += `
                    <button
                        class="publication-link-btn inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-[#2c4f7c] dark:hover:text-blue-400 transition-all duration-200 ease-in-out shadow-sm"
                        data-bibtex="${encodeURIComponent(url)}"
                        data-copy-text="${copyText}"
                        data-copied-text="${copiedText}"
                        data-original-text="${labelText}"
                        onmouseover="this.querySelector('.btn-text').textContent = this.dataset.copyText"
                        onmouseout="this.querySelector('.btn-text').textContent = this.dataset.originalText"
                        onclick="copyBibtexToClipboard(this)"
                    >
                        <i class="fas ${icon} mr-1.5"></i>
                        <span class="btn-text">${labelText}</span>
                    </button>
                `;
            } else {
                // Regular link button
                const displayKey = key === 'paper' ? 'PDF' :
                                  key === 'code' ? displayKeys.pubLinkCode[currentLang] :
                                  key === 'project' ? displayKeys.pubLinkProject[currentLang] :
                                  key === 'video' ? displayKeys.pubLinkVideo[currentLang] : key;
                linksHtml += `
                    <a href="${url}" target="_blank"
                       class="publication-link-btn inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-[#2c4f7c] dark:hover:text-blue-400 transition-all duration-200 ease-in-out shadow-sm">
                        <i class="fas ${icon} mr-1.5"></i>
                        ${displayKey}
                    </a>
                `;
            }
        });
        linksHtml += '</div>';
    }

    // Process authors: bold site author, add envelope for corresponding authors
    const authorsHtml = formatAuthors(item.authors, item.correspondingAuthors || []);

    itemDiv.innerHTML = `
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">${item.title}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">${authorsHtml}</p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
            <span class="font-medium">${item.venue}</span>
            ${item.award ? `<span class="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs">${item.award}</span>` : ''}
        </p>
        ${linksHtml}
    `;
    return itemDiv;
}

// Helper function to format authors with corresponding marks and bold for site author
const formatAuthors = (authorsString, correspondingAuthors) => {
    if (!authorsString) return '';

    // Get site author names from content constants
    const siteAuthorNames = contentConsts.siteAuthorNames || [];

    // Split authors by comma
    const authors = authorsString.split(',').map(a => a.trim());

    // Format each author
    const formattedAuthors = authors.map(author => {
        let formattedAuthor = author;

        // Check if this is the site author (bold)
        const isSiteAuthor = siteAuthorNames.some(name => author === name);
        if (isSiteAuthor) {
            formattedAuthor = `<strong>${formattedAuthor}</strong>`;
        }

        // Check if this is a corresponding author (add envelope icon)
        const isCorresponding = correspondingAuthors.some(ca => author === ca);
        if (isCorresponding) {
            formattedAuthor += `<svg class="inline-block w-3.5 h-3.5 text-[#2c4f7c] dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.15em; margin-right: 0.25em; vertical-align: -0.15em;"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7.5l10 6.5 10-6.5"/></svg>`;
        }

        return formattedAuthor;
    });

    return formattedAuthors.join(', ');
}

// Copy BibTeX to clipboard function
function copyBibtexToClipboard(button) {
    const bibtexContent = decodeURIComponent(button.dataset.bibtex);
    const btnText = button.querySelector('.btn-text');
    const copiedText = button.dataset.copiedText;
    const originalText = button.dataset.originalText;

    // Function to show success feedback
    function showSuccessFeedback() {
        btnText.textContent = copiedText;
        button.classList.add('bg-green-50', 'dark:bg-green-900/20', 'border-green-300', 'dark:border-green-600', 'text-green-600', 'dark:text-green-400');
        button.classList.remove('hover:bg-gray-50', 'dark:hover:bg-gray-700');

        // Reset after 3 seconds
        setTimeout(() => {
            btnText.textContent = originalText;
            button.classList.remove('bg-green-50', 'dark:bg-green-900/20', 'border-green-300', 'dark:border-green-600', 'text-green-600', 'dark:text-green-400');
            button.classList.add('hover:bg-gray-50', 'dark:hover:bg-gray-700');
        }, 3000);
    }

    // Function to show error feedback
    function showErrorFeedback() {
        const errorText = displayKeys.bibtexCopyError[currentLang];
        btnText.textContent = errorText;
        button.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-300', 'dark:border-red-600', 'text-red-600', 'dark:text-red-400');
        setTimeout(() => {
            btnText.textContent = originalText;
            button.classList.remove('bg-red-50', 'dark:bg-red-900/20', 'border-red-300', 'dark:border-red-600', 'text-red-600', 'dark:text-red-400');
        }, 3000);
    }

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(bibtexContent).then(() => {
            showSuccessFeedback();
        }).catch(err => {
            console.warn('Clipboard API failed, trying fallback method:', err);
            // If modern API fails, try fallback
            fallbackCopyTextToClipboard(bibtexContent);
        });
    } else {
        // Use fallback method directly if clipboard API is not available
        fallbackCopyTextToClipboard(bibtexContent);
    }

    // Fallback method using document.execCommand
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showSuccessFeedback();
            } else {
                showErrorFeedback();
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showErrorFeedback();
        } finally {
            document.body.removeChild(textArea);
        }
    }
}