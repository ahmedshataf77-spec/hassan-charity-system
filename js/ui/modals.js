export function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

export function initModals() {
    // Add event listeners to modal toggle buttons
    document.querySelectorAll('[data-toggle-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-toggle-modal');
            toggleModal(target);
        });
    });

    // Handle Revenue tab switching logic inside the modal
    const revTypeInput = document.getElementById('revType');
    const btnRevInkind = document.getElementById('btnRevInkind');
    const btnRevCash = document.getElementById('btnRevCash');
    const btnRevExpense = document.getElementById('btnRevExpense');

    const inkindFields = document.getElementById('inkindFields');
    const cashFields = document.getElementById('cashFields');
    const expenseFields = document.getElementById('expenseFields');

    function setRevType(type) {
        if (revTypeInput) revTypeInput.value = type;

        // Reset fields
        if (inkindFields) inkindFields.classList.add('hidden');
        if (cashFields) cashFields.classList.add('hidden');
        if (expenseFields) expenseFields.classList.add('hidden');

        // Reset buttons base styles
        if (btnRevInkind) btnRevInkind.className = "flex-1 py-2 rounded-lg bg-gray-200 text-black";
        if (btnRevCash) btnRevCash.className = "flex-1 py-2 rounded-lg bg-gray-200 text-black";
        if (btnRevExpense) btnRevExpense.className = "flex-1 py-2 rounded-lg bg-gray-200 text-black";

        // Apply active styles
        if (type === 'inkind') {
            if (btnRevInkind) btnRevInkind.className = "flex-1 py-2 rounded-lg bg-emerald-600 text-white";
            if (inkindFields) inkindFields.classList.remove('hidden');
        } else if (type === 'cash') {
            if (btnRevCash) btnRevCash.className = "flex-1 py-2 rounded-lg bg-emerald-600 text-white";
            if (cashFields) cashFields.classList.remove('hidden');
        } else if (type === 'expense') {
            if (btnRevExpense) btnRevExpense.className = "flex-1 py-2 rounded-lg bg-red-600 text-white";
            if (expenseFields) expenseFields.classList.remove('hidden');
        }
    }

    if (btnRevInkind) btnRevInkind.addEventListener('click', () => setRevType('inkind'));
    if (btnRevCash) btnRevCash.addEventListener('click', () => setRevType('cash'));
    if (btnRevExpense) btnRevExpense.addEventListener('click', () => setRevType('expense'));
}
