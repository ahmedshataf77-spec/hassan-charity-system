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

let allCases = [];
let currentTab = 'permanent';

export function initCasesService() {
    // Watch for click on 'Cases' navigation to setup listeners
    const navCasesBtn = document.getElementById('nav-cases');
    if (navCasesBtn) {
        navCasesBtn.addEventListener('click', () => {
            showView('casesSection');
            loadCases();
        });
    }

    // Set up tabs switching
    document.querySelectorAll('[data-case-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-case-tab]').forEach(b => {
                b.className = "flex-1 min-w-[120px] bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300";
            });
            e.currentTarget.className = "flex-1 min-w-[120px] bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm";
            currentTab = e.currentTarget.getAttribute('data-case-tab');
            renderCasesTable(allCases);
        });
    });

    // Form submit listener
    const caseForm = document.getElementById('caseForm');
    if (caseForm) {
        caseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('saveCaseBtn');
            const statusText = document.getElementById('caseUploadStatus');

            const nameInput = document.getElementById('caseName').value.trim();
            const nIdInput = document.getElementById('caseNationalId').value.trim();

            // Uniqueness Validation (General Prevention)
            const isDuplicate = allCases.some(record => 
                (record.nationalId && record.nationalId === nIdInput) || 
                (record.name && record.name === nameInput)
            );

            if (isDuplicate) {
                alert("خطأ: الاسم أو الرقم القومي مسجل من قبل في الجمعية. يرجى تجنب التكرار.");
                return; // Stop form submission
            }

            if (btn) {
                btn.innerText = 'جاري الحفظ...';
                btn.disabled = true;
            }

            let documentUrl = '';
            const fileInput = document.getElementById('caseDoc');

            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (statusText) statusText.innerText = '⏳ جاري رفع الصورة...';
                try {
                    documentUrl = await uploadImageToImgBB(file);
                    if (statusText) statusText.innerText = '✅ تم رفع الصورة بنجاح!';
                } catch (err) {
                    console.error("ImgBB upload error", err);
                    if (statusText) statusText.innerText = '⚠️ تعذّر رفع الصورة - سيتم الحفظ بدون صورة.';
                    documentUrl = '';
                }
            }


            const record = {
                category: document.getElementById('caseCategory').value,
                name: nameInput,
                nationalId: nIdInput,
                phone: document.getElementById('casePhone').value,
                familyCount: document.getElementById('caseFamilyCount').value,
                address: document.getElementById('caseAddress').value,
                details: document.getElementById('caseDetails').value,
                notes: document.getElementById('caseNotes').value,
                documentUrl: documentUrl || ""
            };
            
            try {
                await push(ref(db, 'cases'), record);
                toggleModal('caseModal');
                caseForm.reset();
            } catch (error) {
                console.error("Error saving case", error);
                alert("حدث خطأ أثناء الحفظ");
            } finally {
                if (statusText) statusText.innerText = '';
                if (btn) {
                    btn.innerText = 'حفظ وتأكيد';
                    btn.disabled = false;
                }
            }
        });
    }

    // Export Button
    const exportBtn = document.getElementById('exportCasesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
}

function loadCases() {
    onValue(ref(db, 'cases'), (snapshot) => {
        const data = snapshot.val();
        allCases = [];
        for (let id in data) {
            allCases.push({ id, ...data[id] });
        }
        renderCasesTable(allCases);
    });
}

function renderCasesTable(records) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;

    // Filter by current Tab
    const filteredRecords = records.filter(r => (r.category || 'permanent') === currentTab);

    if (!filteredRecords.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="p-10 text-center text-gray-400">لا توجد بيانات في هذا القسم</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRecords.map((r, i) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${i + 1}</td>
            <td class="p-4 font-bold">${r.name || '-'}</td>
            <td class="p-4">${r.nationalId || '-'}</td>
            <td class="p-4">${r.phone || '-'}</td>
            <td class="p-4 text-sm">${r.address || '-'}</td>
            <td class="p-4 text-center">${r.familyCount || '-'}</td>
            <td class="p-4 text-sm">${r.details || '-'}</td>
            <td class="p-4">${r.documentUrl ? `<a href="${r.documentUrl}" target="_blank" class="text-blue-500 underline">عرض</a>` : 'لا يوجد'}</td>
            <td class="p-4 text-xs text-gray-500 w-32">${r.notes || '-'}</td>
            <td class="p-4"><button data-delete-case="${r.id}" class="text-red-500 text-sm">حذف</button></td>
        </tr>
    `).join('');

    // Attach delete listeners
    tbody.querySelectorAll('[data-delete-case]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-delete-case');
            if (confirm('هل أنت متأكد من الحذف؟ سيتم الحذف نهائياً.')) {
                remove(ref(db, 'cases/' + id));
            }
        });
    });
}

function exportToExcel() {
    if (!window.XLSX) {
        alert("المكتبة غير جاهزة بعد، يرجى الانتظار لمحاولة أخرى.");
        return;
    }

    // Export the cases currently viewed in the active tab
    const filteredRecords = allCases.filter(r => (r.category || 'permanent') === currentTab);
    
    if (filteredRecords.length === 0) {
        alert("لا توجد بيانات لتصديرها.");
        return;
    }

    const exportData = filteredRecords.map((r, index) => ({
        "م": index + 1,
        "الاسم": r.name || "",
        "الرقم القومي": r.nationalId || "",
        "الهاتف": r.phone || "",
        "العنوان": r.address || "",
        "عدد أفراد الأسرة": r.familyCount || "",
        "الحالة": r.details || "",
        "الملاحظات": r.notes || "",
        "رابط المستند": r.documentUrl || "لا يوجد"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الحالات");
    
    // File name localized map
    const categoriesLabels = {
        'permanent': 'حالات_دائم',
        'temporary': 'حالات_مؤقتة',
        'orphans': 'أيتام',
        'support': 'تجهيز_ودعم'
    };
    
    const fileName = `${categoriesLabels[currentTab]}_export.xlsx`;

    XLSX.writeFile(workbook, fileName);
}
