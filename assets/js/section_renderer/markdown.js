const markdownRenderer = (section) => {
    const element = document.createElement('div');
    element.className = 'prose prose-gray dark:prose-invert max-w-none';
    // Process markdown-like formatting
    let formattedContent = section.content;
    // Convert **text** to bold
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert paragraphs
    element.innerHTML = formattedContent.split('\n\n').map(p =>
        `<p class="mb-4 text-gray-600 dark:text-gray-400 leading-relaxed">${p.trim()}</p>`
    ).join('');
    return element;
};
