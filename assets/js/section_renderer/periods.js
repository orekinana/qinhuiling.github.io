const periodsRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'relative pl-8 pb-4 border-l-2 border-gray-300 dark:border-gray-700 last:border-l-0';
        itemContainer.innerHTML = `
            <div class="absolute left-[-9px] top-0 w-4 h-4 bg-purple-600 rounded-full"></div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div class="text-sm font-mono text-gray-500 dark:text-gray-400 mb-1">${item.period}</div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">${item.degree || item.position}</h3>
                <p class="text-gray-600 dark:text-gray-400">${item.institution || item.organization}</p>
                ${item.description ? `<p class="text-sm text-gray-500 dark:text-gray-500 mt-2">${item.description}</p>` : ''}
            </div>
        `;
        container.appendChild(itemContainer);
    });
    return container;
};

