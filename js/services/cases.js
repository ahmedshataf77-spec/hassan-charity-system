import { db, ref, push, onValue, remove } from '../config/firebase.js';
import { toggleModal } from '../ui/modals.js';
import { showView } from '../ui/navigation.js';

export function initCasesService() {
    // Watch for click on 'Cases' navigation to setup listeners
    const navCasesBtn = document.getElementById('nav-cases');
    if (navCasesBtn) {
        navCasesBtn.addEventListener('click', () => {
            showView('casesSection');
            loadCases();
        });
    }

    // Form submit listener
    const caseForm = document.getElementById('caseForm');
    if (caseForm) {
        caseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const record = {
                name: document.getElementById('caseName').value,
                amount: document.getElementById('caseAmount').value,
                nationalId: document.getElementById('caseNationalId').value,
                phone: document.getElementById('casePhone').value,
                address: document.getElementById('caseAddress').value
            };
            
            try {
                await push(ref(db, 'cases'), record);
                toggleModal('caseModal');
                caseForm.reset();
            } catch (error) {
                console.error("Error saving case", error);
                alert("حدث خطأ أثناء الحفظ");
            }
        });
    }
}

function loadCases() {
    onValue(ref(db, 'cases'), (snapshot) => {
        const data = snapshot.val();
        let records = [];
        for (let id in data) records.push({ id, ...data[id] });
        renderCasesTable(records);
    });
}

function renderCasesTable(records) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;

    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((r, i) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${i + 1}</td>
            <td class="p-4 font-bold">${r.name || '-'}</td>
            <td class="p-4">${r.amount || '-'}</td>
            <td class="p-4">${r.nationalId || '-'}</td>
            <td class="p-4">${r.phone || '-'}</td>
            <td class="p-4">${r.address || '-'}</td>
            <td class="p-4"><button data-delete-case="${r.id}" class="text-red-500 text-sm">حذف</button></td>
        </tr>
    `).join('');

    // Attach delete listeners
    tbody.querySelectorAll('[data-delete-case]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-delete-case');
            if (confirm('هل أنت متأكد من الحذف؟')) {
                remove(ref(db, 'cases/' + id));
            }
        });
    });
}
