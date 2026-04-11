import { db, ref, push, onValue, remove } from '../config/firebase.js';
import { toggleModal } from '../ui/modals.js';
import { showView } from '../ui/navigation.js';

export function initRevenuesService() {
    // Watch for click on 'Revenues' navigation
    const navRevenuesBtn = document.getElementById('nav-revenues');
    if (navRevenuesBtn) {
        navRevenuesBtn.addEventListener('click', () => {
            showView('revenuesSection');
            loadRevenues();
        });
    }

    // Form submit listener
    const revenueForm = document.getElementById('revenueForm');
    if (revenueForm) {
        revenueForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const revTypeInput = document.getElementById('revType');
            const type = revTypeInput ? revTypeInput.value : 'inkind';

            try {
                if (type === 'inkind') {
                    const record = {
                        name: document.getElementById('inkindName').value,
                        entity: document.getElementById('inkindEntity').value,
                        item: document.getElementById('inkindItem').value,
                        quantity: document.getElementById('inkindQuantity').value,
                        date: document.getElementById('inkindDate').value,
                        notes: document.getElementById('inkindNotes').value
                    };
                    await push(ref(db, 'revenues_inkind'), record);

                } else if (type === 'cash') {
                    const record = {
                        name: document.getElementById('cashName').value,
                        entity: document.getElementById('cashEntity').value,
                        item: document.getElementById('cashItem').value,
                        amount: document.getElementById('cashAmount').value,
                        date: document.getElementById('cashDate').value
                    };
                    await push(ref(db, 'revenues_cash'), record);

                } else if (type === 'expense') {
                    const record = {
                        amount: document.getElementById('expAmount').value,
                        date: document.getElementById('expDate').value,
                        item: document.getElementById('expItem').value,
                        decision: document.getElementById('expDecision').value,
                        spender: document.getElementById('expSpender').value
                    };
                    await push(ref(db, 'expenses'), record);
                }
                
                toggleModal('revenueModal');
                revenueForm.reset();
                // We emit an event or call a function to reset the modal tab back to default
                const btnRevInkind = document.getElementById('btnRevInkind');
                if (btnRevInkind) btnRevInkind.click();

            } catch (err) {
                console.error("Save revenue/expense error", err);
                alert("حدث خطأ أثناء الحفظ.");
            }
        });
    }
}

function loadRevenues() {
    onValue(ref(db, 'revenues_inkind'), (snapshot) => {
        const data = snapshot.val();
        let records = [];
        for (let id in data) records.push({ id, ...data[id] });
        renderInkindTable(records);
    });

    onValue(ref(db, 'revenues_cash'), (snapshot) => {
        const data = snapshot.val();
        let records = [];
        for (let id in data) records.push({ id, ...data[id] });
        renderCashTable(records);
    });

    onValue(ref(db, 'expenses'), (snapshot) => {
        const data = snapshot.val();
        let records = [];
        for (let id in data) records.push({ id, ...data[id] });
        renderExpensesTable(records);
    });
}

function attachDeleteListeners(tbody, path) {
    if (!tbody) return;
    tbody.querySelectorAll('[data-delete-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-delete-id');
            if (confirm('هل أنت متأكد من الحذف؟')) {
                remove(ref(db, path + '/' + id));
            }
        });
    });
}

function renderInkindTable(records) {
    const tbody = document.getElementById('inkindTableBody');
    if (!tbody) return;

    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-10 text-center text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((r, i) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${i + 1}</td>
            <td class="p-4 font-bold">${r.name || '-'}</td>
            <td class="p-4">${r.item || '-'}</td>
            <td class="p-4">${r.quantity || '-'}</td>
            <td class="p-4">${r.entity || '-'}</td>
            <td class="p-4 text-xs">${r.notes || '-'}</td>
            <td class="p-4">${r.date || '-'}</td>
            <td class="p-4"><button data-delete-id="${r.id}" class="text-red-500 text-sm">حذف</button></td>
        </tr>
    `).join('');

    attachDeleteListeners(tbody, 'revenues_inkind');
}

function renderCashTable(records) {
    const tbody = document.getElementById('cashTableBody');
    if (!tbody) return;

    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-10 text-center text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((r, i) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${i + 1}</td>
            <td class="p-4 font-bold">${r.name || '-'}</td>
            <td class="p-4">${r.entity || '-'}</td>
            <td class="p-4 font-bold text-emerald-600">${r.amount || '-'}</td>
            <td class="p-4">${r.item || '-'}</td>
            <td class="p-4 text-xs">${r.date || '-'}</td>
            <td class="p-4"><button data-delete-id="${r.id}" class="text-red-500 text-sm">حذف</button></td>
        </tr>
    `).join('');

    attachDeleteListeners(tbody, 'revenues_cash');
}

function renderExpensesTable(records) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;

    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((r, i) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${i + 1}</td>
            <td class="p-4">${r.item || '-'}</td>
            <td class="p-4">${r.decision || '-'}</td>
            <td class="p-4">${r.spender || '-'}</td>
            <td class="p-4">${r.date || '-'}</td>
            <td class="p-4"><button data-delete-id="${r.id}" class="text-red-500 text-sm">حذف</button></td>
        </tr>
    `).join('');

    attachDeleteListeners(tbody, 'expenses');
}
