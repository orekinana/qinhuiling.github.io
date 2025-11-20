const newsRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = `p-4 rounded-lg ${item.highlight ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-[#2c4f7c]' : 'bg-gray-50 dark:bg-gray-700/50'} slide-in`;
        itemContainer.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-sm font-mono text-gray-500 dark:text-gray-400">${item.date}</span>
                <p class="text-gray-700 dark:text-gray-300 flex-1">${item.content}</p>
            </div>
        `;
        container.appendChild(itemContainer);
    });
    return container;
};
