const honorsRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors';
        itemContainer.innerHTML = `
            <span class="text-[#2c4f7c] dark:text-blue-400 font-bold">${item.year}</span>
            <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">${item.title}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${item.organization}</p>
            </div>
        `;
        container.appendChild(itemContainer);
    });
    return container;
};

