// Advanced table filter UI for AI Data Table Viewer
(function() {
    function createFilterModal(columns, filters, onApply) {
        // Remove any existing modal
        const old = document.getElementById('tableFilterModal');
        if (old) old.remove();
        // Modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'tableFilterModal';
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-slide-in" style="min-width:320px;">
                <h2 class="text-xl font-bold mb-4 text-blue-900">Filter Columns</h2>
                <form id="filterForm" class="space-y-3">
                    ${columns.map(col => `
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="filterCheck_${col}" class="form-checkbox h-5 w-5 text-blue-600" ${filters[col] ? 'checked' : ''} />
                            <label for="filterCheck_${col}" class="flex-1 text-gray-800 font-medium">${col}</label>
                            <input type="text" id="filterInput_${col}" value="${filters[col] || ''}" placeholder="Filter value" class="flex-1 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400 text-gray-900 bg-gray-50" ${filters[col] ? '' : 'disabled'} />
                        </div>
                    `).join('')}
                </form>
                <div class="flex justify-end gap-2 mt-6">
                    <button id="filterCancelBtn" class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold">Cancel</button>
                    <button id="filterApplyBtn" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Apply</button>
                </div>
                <button id="filterCloseBtn" class="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-700">&times;</button>
            </div>
        `;
        document.body.appendChild(overlay);
        // Enable/disable input on checkbox
        columns.forEach(col => {
            const check = document.getElementById('filterCheck_' + col);
            const input = document.getElementById('filterInput_' + col);
            if (check && input) {
                check.addEventListener('change', () => {
                    input.disabled = !check.checked;
                    if (!check.checked) input.value = '';
                });
            }
        });
        // Cancel/close
        function closeModal() { overlay.remove(); }
        document.getElementById('filterCancelBtn').onclick = closeModal;
        document.getElementById('filterCloseBtn').onclick = closeModal;
        // Apply
        document.getElementById('filterApplyBtn').onclick = function(e) {
            e.preventDefault();
            let newFilters = {};
            columns.forEach(col => {
                const check = document.getElementById('filterCheck_' + col);
                const input = document.getElementById('filterInput_' + col);
                if (check && input && check.checked && input.value.trim() !== '') {
                    newFilters[col] = input.value.trim();
                }
            });
            closeModal();
            onApply(newFilters);
        };
    }
    document.addEventListener('DOMContentLoaded', function() {
        var filterTableBtn = document.getElementById('filterTableBtn');
        if (!filterTableBtn) return;
        filterTableBtn.addEventListener('click', function() {
            if (!window.currentData || !window.currentData.length) return;
            const columns = [...new Set(window.currentData.flatMap(Object.keys))];
            createFilterModal(columns, window.filters || {}, function(newFilters) {
                window.filters = newFilters;
                window.currentPage = 1;
                if (typeof window.renderTable === 'function') window.renderTable();
            });
        });
    });
})();
