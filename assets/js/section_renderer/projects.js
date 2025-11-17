const projectsRenderer = (section) => {
    const container = document.createElement('div');
    if (!section || !section.items) {
        return container;
    }
    container.className = 'space-y-4';
    section.items.forEach(item => {
        const itemContainer = renderProjectItem(item);
        container.appendChild(itemContainer);
    });
    return container;
};

const renderProjectItem = (item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
    const statusBadge = item.status === 'ongoing' ?
        '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs">' + displayKeys.projStatus[currentLang] + '</span>' : '';
    itemDiv.innerHTML = `
        <div class="mb-2">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">${item.title}</h3>
            <div class="flex items-center gap-2 mt-1">
                <span class="text-sm text-gray-600 dark:text-gray-400">${item.type}</span>
                ${statusBadge}
            </div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            ${item.code ? `<p><span class="font-medium">${displayKeys.projCode[currentLang]}:</span> ${item.code}</p>` : ''}
            ${item.period ? `<p><span class="font-medium">${displayKeys.projPeriod[currentLang]}:</span> ${item.period}</p>` : ''}
        </div>
    `;
    return itemDiv;
}