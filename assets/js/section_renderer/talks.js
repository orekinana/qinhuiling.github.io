const talksRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
        const typeColor = item.type === 'keynote' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        item.type === 'workshop' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        itemContainer.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">${item.title}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${item.event}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500">${item.location} • ${item.date}</p>
                </div>
                <span class="px-2 py-1 ${typeColor} rounded text-xs font-medium">${item.type}</span>
            </div>
        `;
        container.appendChild(itemContainer);
    });
    return container;
};

