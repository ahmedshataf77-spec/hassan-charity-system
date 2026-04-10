import { db, ref, push, onValue, remove, update } from '../config/firebase.js';
import { toggleModal } from '../ui/modals.js';
import { showView } from '../ui/navigation.js';

const IMGBB_API_KEY = 'e98b65a72fd65751b8aeab8a952c7059';

async function uploadImageToImgBB(file) {
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    const formData = new FormData();
    formData.append('image', base64);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST', body: formData
    });
    const json = await res.json();
    if (json.success) return json.data.url;
    throw new Error('ImgBB upload failed');
}

let allMembers = [];
let editingMemberId = null;

export function initMembersService() {
    const navMembersBtn = document.getElementById('nav-members');
    if (navMembersBtn) {
        navMembersBtn.addEventListener('click', () => {
            showView('membersSection');
            loadMembers();
        });
    }

    // Search
    const searchInput = document.getElementById('membersSearch');
    if (searchInput) {
        searchInput.addEventListener('input', applyMembersSearch);
    }

    // Form submit
    const memberForm = document.getElementById('memberForm');
    if (memberForm) {
        memberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('saveMemberBtn');
            const statusText = document.getElementById('uploadStatus');

            if (btn) { btn.innerText = 'جاري الحفظ...'; btn.disabled = true; }

            let fileUrl = '';
            const fileInput = document.getElementById('memDoc');

            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (statusText) statusText.innerText = '⏳ جاري رفع الصورة...';
                try {
                    fileUrl = await uploadImageToImgBB(file);
                    if (statusText) statusText.innerText = '✅ تم رفع الصورة بنجاح!';
                } catch (err) {
                    console.error("ImgBB upload error", err);
                    if (statusText) statusText.innerText = '⚠️ تعذّر رفع الصورة - سيتم الحفظ بدون صورة.';
                    fileUrl = '';
                }
            }

            const record = {
                name: document.getElementById('memName').value,
                nationalId: document.getElementById('memNationalId').value,
                phone: document.getElementById('memPhone').value,
                address: document.getElementById('memAddress').value,
                job: document.getElementById('memJob').value,
                notes: document.getElementById('memNotes').value,
            };

            // Keep old image if no new one uploaded
            if (fileUrl) {
                record.documentUrl = fileUrl;
            } else if (editingMemberId) {
                const existing = allMembers.find(r => r.id === editingMemberId);
                record.documentUrl = existing ? (existing.documentUrl || '') : '';
            } else {
                record.documentUrl = '';
            }

            try {
                if (editingMemberId) {
                    await update(ref(db, 'members/' + editingMemberId), record);
                    editingMemberId = null;
                } else {
                    await push(ref(db, 'members'), record);
                }
                toggleModal('memberModal');
                memberForm.reset();
                document.getElementById('memberModalTitle').innerText = 'إضافة عضو جديد';
                document.getElementById('saveMemberBtn').innerText = 'حفظ';
            } catch (err) {
                console.error("Save member error", err);
                alert("حدث خطأ أثناء الحفظ.");
            } finally {
                if (statusText) statusText.innerText = '';
                if (btn) { btn.innerText = 'حفظ'; btn.disabled = false; }
            }
        });
    }

    // Reset on modal close
    document.querySelectorAll('[data-toggle-modal="memberModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (editingMemberId) {
                editingMemberId = null;
                document.getElementById('memberForm').reset();
                document.getElementById('memberModalTitle').innerText = 'إضافة عضو جديد';
                document.getElementById('saveMemberBtn').innerText = 'حفظ';
            }
        });
    });
}

function applyMembersSearch() {
    const query = (document.getElementById('membersSearch')?.value || '').toLowerCase();
    if (!query) return renderMembersTable(allMembers);
    const filtered = allMembers.filter(r =>
        (r.name || '').toLowerCase().includes(query) ||
        (r.nationalId || '').includes(query) ||
        (r.phone || '').includes(query)
    );
    renderMembersTable(filtered);
}

function loadMembers() {
    onValue(ref(db, 'members'), (snapshot) => {
        const data = snapshot.val();
        allMembers = [];
        for (let id in data) allMembers.push({ id, ...data[id] });
        applyMembersSearch();
    });
}

function renderMembersTable(records) {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-10 text-center text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((r, i) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 text-center">${i + 1}</td>
            <td class="p-3 font-bold">${r.name || '-'}</td>
            <td class="p-3">${r.nationalId || '-'}</td>
            <td class="p-3">${r.phone || '-'}</td>
            <td class="p-3">${r.address || '-'}</td>
            <td class="p-3">${r.job || '-'}</td>
            <td class="p-3">${r.documentUrl ? `<a href="${r.documentUrl}" target="_blank" class="text-blue-500 underline text-sm">عرض المستند</a>` : 'لا يوجد'}</td>
            <td class="p-3 text-xs">${r.notes || '-'}</td>
            <td class="p-3">
                <div class="flex gap-2 justify-center">
                    <button data-edit-member="${r.id}" class="text-blue-500 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50">تعديل</button>
                    <button data-delete-member="${r.id}" class="text-red-500 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Edit listeners
    tbody.querySelectorAll('[data-edit-member]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-edit-member');
            const record = allMembers.find(r => r.id === id);
            if (!record) return;
            editingMemberId = id;

            document.getElementById('memName').value = record.name || '';
            document.getElementById('memNationalId').value = record.nationalId || '';
            document.getElementById('memPhone').value = record.phone || '';
            document.getElementById('memAddress').value = record.address || '';
            document.getElementById('memJob').value = record.job || '';
            document.getElementById('memNotes').value = record.notes || '';

            document.getElementById('memberModalTitle').innerText = 'تعديل بيانات العضو ✏️';
            document.getElementById('saveMemberBtn').innerText = 'حفظ التعديلات';
            toggleModal('memberModal');
        });
    });

    // Delete listeners
    tbody.querySelectorAll('[data-delete-member]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-delete-member');
            if (confirm('هل أنت متأكد من الحذف؟')) {
                remove(ref(db, 'members/' + id));
            }
        });
    });
}
