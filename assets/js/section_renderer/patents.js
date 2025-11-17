const patentsRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
        itemContainer.innerHTML = `
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">${item.title}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${item.inventors}</p>
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <span><i class="fas fa-calendar mr-1"></i>${item.date}</span>
                <span><i class="fas fa-hashtag mr-1"></i>${item.number}</span>
                <span><i class="fas fa-flag mr-1"></i>${item.country}</span>
            </div>
        `;
        container.appendChild(itemContainer);
    });
    return container;
};

