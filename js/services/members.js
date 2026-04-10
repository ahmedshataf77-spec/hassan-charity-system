import { db, ref, push, onValue, remove } from '../config/firebase.js';
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
        method: 'POST',
        body: formData
    });

    const json = await res.json();
    if (json.success) return json.data.url;
    throw new Error('ImgBB upload failed');
}

export function initMembersService() {
    // Watch for click on 'Members' navigation
    const navMembersBtn = document.getElementById('nav-members');
    if (navMembersBtn) {
        navMembersBtn.addEventListener('click', () => {
            showView('membersSection');
            loadMembers();
        });
    }

    // Form submit listener
    const memberForm = document.getElementById('memberForm');
    if (memberForm) {
        memberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('saveMemberBtn');
            const statusText = document.getElementById('uploadStatus');

            if (btn) {
                btn.innerText = 'جاري الحفظ...';
                btn.disabled = true;
            }

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
                documentUrl: fileUrl
            };

            try {
                await push(ref(db, 'members'), record);
                toggleModal('memberModal');
                memberForm.reset();
            } catch (err) {
                console.error("Save member error", err);
                alert("حدث خطأ أثناء الحفظ.");
            } finally {
                if (statusText) statusText.innerText = '';
                if (btn) {
                    btn.innerText = 'حفظ';
                    btn.disabled = false;
                }
            }
        });
    }
}

function loadMembers() {
    onValue(ref(db, 'members'), (snapshot) => {
        const data = snapshot.val();
        let records = [];
        for (let id in data) records.push({ id, ...data[id] });
        renderMembersTable(records);
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
            <td class="p-4">${i + 1}</td>
            <td class="p-4 font-bold">${r.name || '-'}</td>
            <td class="p-4">${r.nationalId || '-'}</td>
            <td class="p-4">${r.phone || '-'}</td>
            <td class="p-4">${r.address || '-'}</td>
            <td class="p-4">${r.job || '-'}</td>
            <td class="p-4">${r.documentUrl ? `<a href="${r.documentUrl}" target="_blank" class="text-blue-500 underline">عرض المستند</a>` : 'لا يوجد'}</td>
            <td class="p-4 text-xs">${r.notes || '-'}</td>
            <td class="p-4"><button data-delete-member="${r.id}" class="text-red-500 text-sm">حذف</button></td>
        </tr>
    `).join('');

    // Attach delete listeners
    tbody.querySelectorAll('[data-delete-member]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-delete-member');
            if (confirm('هل أنت متأكد من الحذف؟')) {
                remove(ref(db, 'members/' + id));
            }
        });
    });
}
