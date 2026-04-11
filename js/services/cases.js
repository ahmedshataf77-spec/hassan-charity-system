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

let allCases = [];
let currentTab = 'permanent';
let editingCaseId = null; // Track which record is being edited

export function initCasesService() {
    // Navigate to cases section
    const navCasesBtn = document.getElementById('nav-cases');
    if (navCasesBtn) {
        navCasesBtn.addEventListener('click', () => {
            showView('casesSection');
            loadCases();
        });
    }

    // Tabs switching
    document.querySelectorAll('[data-case-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-case-tab]').forEach(b => {
                b.className = "flex-1 min-w-[120px] bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300";
            });
            e.currentTarget.className = "flex-1 min-w-[120px] bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm";
            currentTab = e.currentTarget.getAttribute('data-case-tab');
            applySearch();
        });
    });

    // Search input
    const searchInput = document.getElementById('casesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', applySearch);
    }

    // Category change listener to toggle fields
    const caseCategorySelect = document.getElementById('caseCategory');
    if (caseCategorySelect) {
        caseCategorySelect.addEventListener('change', (e) => {
            const isOrphans = e.target.value === 'orphans';
            const motherInput = document.getElementById('caseMotherName');
            const generalFields = document.getElementById('generalCaseFields');
            if (motherInput) motherInput.classList.toggle('hidden', !isOrphans);
            if (generalFields) generalFields.classList.toggle('hidden', !!isOrphans);
        });
    }

    // Form submit listener
    const caseForm = document.getElementById('caseForm');
    if (caseForm) {
        caseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('saveCaseBtn');
            const statusText = document.getElementById('caseUploadStatus');
            const nameInput = document.getElementById('caseName').value.trim();
            const nIdInput = document.getElementById('caseNationalId').value.trim();

            // Uniqueness Validation (skip check if editing same record)
            const isDuplicate = allCases.some(record =>
                record.id !== editingCaseId &&
                ((record.nationalId && record.nationalId === nIdInput) ||
                (record.name && record.name === nameInput))
            );

            if (isDuplicate) {
                alert("❌ خطأ: الاسم أو الرقم القومي مسجل من قبل في الجمعية. يرجى تجنب التكرار.");
                return;
            }

            if (btn) { btn.innerText = 'جاري الحفظ...'; btn.disabled = true; }

            let documentUrls = [];
            const fileInput = document.getElementById('caseDoc');

            if (fileInput && fileInput.files.length > 0) {
                if (statusText) statusText.innerText = '⏳ جاري رفع الصور...';
                try {
                    const promises = Array.from(fileInput.files).map(file => uploadImageToImgBB(file));
                    documentUrls = await Promise.all(promises);
                    if (statusText) statusText.innerText = '✅ تم رفع الصور بنجاح!';
                } catch (err) {
                    console.error("ImgBB upload error", err);
                    if (statusText) statusText.innerText = '⚠️ تعذّر رفع بعض الصور - سيتم الحفظ بدون المفقود.';
                }
            }

            const record = {
                category: document.getElementById('caseCategory').value,
                name: nameInput,
                nationalId: nIdInput,
                phone: document.getElementById('casePhone').value,
                address: document.getElementById('caseAddress').value,
                notes: document.getElementById('caseNotes').value,
                motherName: document.getElementById('caseMotherName').value,
                familyCount: document.getElementById('caseFamilyCount').value,
                details: document.getElementById('caseDetails').value,
            };

            // Keep old images if no new file uploaded
            if (documentUrls.length > 0) {
                record.documentUrls = documentUrls;
            } else if (editingCaseId) {
                const existing = allCases.find(r => r.id === editingCaseId);
                record.documentUrls = existing ? (existing.documentUrls || (existing.documentUrl ? [existing.documentUrl] : [])) : [];
            } else {
                record.documentUrls = [];
            }

            try {
                if (editingCaseId) {
                    // UPDATE mode
                    await update(ref(db, 'cases/' + editingCaseId), record);
                    editingCaseId = null;
                } else {
                    // ADD mode
                    await push(ref(db, 'cases'), record);
                }
                toggleModal('caseModal');
                caseForm.reset();
                document.getElementById('caseModalTitle').innerText = 'إضافة حالة جديدة';
                document.getElementById('saveCaseBtn').innerText = 'حفظ وتأكيد';
            } catch (error) {
                console.error("Error saving case", error);
                alert("حدث خطأ أثناء الحفظ");
            } finally {
                if (statusText) statusText.innerText = '';
                if (btn) { btn.innerText = 'حفظ وتأكيد'; btn.disabled = false; }
            }
        });
    }

    // Reset edit mode when modal closes or opens fresh
    document.querySelectorAll('[data-toggle-modal="caseModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            editingCaseId = null;
            document.getElementById('caseForm').reset();
            document.getElementById('caseModalTitle').innerText = 'إضافة حالة جديدة';
            document.getElementById('saveCaseBtn').innerText = 'حفظ وتأكيد';
            // Force UI toggle reset
            document.getElementById('caseCategory')?.dispatchEvent(new Event('change'));
        });
    });

    // Export Button
    const exportBtn = document.getElementById('exportCasesBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
}

function applySearch() {
    const query = (document.getElementById('casesSearch')?.value || '').toLowerCase();
    const filtered = allCases.filter(r => {
        const matchesTab = (r.category || 'permanent') === currentTab;
        if (!query) return matchesTab;
        const matchesSearch = (r.name || '').toLowerCase().includes(query) ||
            (r.nationalId || '').includes(query) ||
            (r.phone || '').includes(query) ||
            (r.address || '').toLowerCase().includes(query);
        return matchesTab && matchesSearch;
    });
    renderCasesTable(filtered);
}

function loadCases() {
    onValue(ref(db, 'cases'), (snapshot) => {
        const data = snapshot.val();
        allCases = [];
        for (let id in data) allCases.push({ id, ...data[id] });
        applySearch();
    });
}

function getDocsHtml(r) {
    let urls = r.documentUrls || [];
    if (!urls.length && r.documentUrl) urls = [r.documentUrl];
    if (!urls.length) return 'لا يوجد';
    return urls.map((u, idx) => `<a href="${u}" target="_blank" class="text-blue-500 underline text-sm block whitespace-nowrap">صورة ${idx + 1}</a>`).join('');
}

function renderCasesTable(records) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;

    const head = document.getElementById('casesTableHeader');
    if (head) {
        if (currentTab === 'orphans') {
            head.innerHTML = `<tr><th class="p-3 text-center">م</th><th class="p-3">اسم اليتيم</th><th class="p-3">اسم الأم</th><th class="p-3">الرقم القومي</th><th class="p-3">الهاتف</th><th class="p-3">العنوان</th><th class="p-3">المستندات</th><th class="p-3">الملاحظات</th><th class="p-3 text-center">إجراء</th></tr>`;
        } else {
            head.innerHTML = `<tr><th class="p-3 text-center">م</th><th class="p-3">الاسم</th><th class="p-3">الرقم القومي</th><th class="p-3">الهاتف</th><th class="p-3">العنوان</th><th class="p-3 text-center">الأسرة</th><th class="p-3">الحالة</th><th class="p-3">المستندات</th><th class="p-3">الملاحظات</th><th class="p-3 text-center">إجراء</th></tr>`;
        }
    }

    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="p-10 text-center text-gray-400">لا توجد بيانات في هذا القسم أو لا توجد نتائج بحث</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((r, i) => {
        if (currentTab === 'orphans') {
            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 text-center">${i + 1}</td>
                <td class="p-3 font-bold">${r.name || '-'}</td>
                <td class="p-3">${r.motherName || '-'}</td>
                <td class="p-3">${r.nationalId || '-'}</td>
                <td class="p-3">${r.phone || '-'}</td>
                <td class="p-3 text-sm">${r.address || '-'}</td>
                <td class="p-3">${getDocsHtml(r)}</td>
                <td class="p-3 text-xs text-gray-500">${r.notes || '-'}</td>
                <td class="p-3">
                    <div class="flex gap-2 justify-center">
                        <button data-edit-case="${r.id}" class="text-blue-500 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50">تعديل</button>
                        <button data-delete-case="${r.id}" class="text-red-500 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50">حذف</button>
                    </div>
                </td>
            </tr>`;
        } else {
            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 text-center">${i + 1}</td>
                <td class="p-3 font-bold">${r.name || '-'}</td>
                <td class="p-3">${r.nationalId || '-'}</td>
                <td class="p-3">${r.phone || '-'}</td>
                <td class="p-3 text-sm">${r.address || '-'}</td>
                <td class="p-3 text-center">${r.familyCount || '-'}</td>
                <td class="p-3 text-sm">${r.details || '-'}</td>
                <td class="p-3">${getDocsHtml(r)}</td>
                <td class="p-3 text-xs text-gray-500">${r.notes || '-'}</td>
                <td class="p-3">
                    <div class="flex gap-2 justify-center">
                        <button data-edit-case="${r.id}" class="text-blue-500 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50">تعديل</button>
                        <button data-delete-case="${r.id}" class="text-red-500 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50">حذف</button>
                    </div>
                </td>
            </tr>`;
        }
    }).join('');

    // Attach edit listeners
    tbody.querySelectorAll('[data-edit-case]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-edit-case');
            const record = allCases.find(r => r.id === id);
            if (!record) return;
            editingCaseId = id;

            // Populate form
            document.getElementById('caseCategory').value = record.category || 'permanent';
            document.getElementById('caseName').value = record.name || '';
            document.getElementById('caseNationalId').value = record.nationalId || '';
            document.getElementById('casePhone').value = record.phone || '';
            document.getElementById('caseAddress').value = record.address || '';
            document.getElementById('caseNotes').value = record.notes || '';
            document.getElementById('caseMotherName').value = record.motherName || '';
            document.getElementById('caseFamilyCount').value = record.familyCount || '';
            document.getElementById('caseDetails').value = record.details || '';

            // Toggle logic directly
            const isOrphans = (record.category === 'orphans');
            const motherInput = document.getElementById('caseMotherName');
            const generalFields = document.getElementById('generalCaseFields');
            if (motherInput) motherInput.classList.toggle('hidden', !isOrphans);
            if (generalFields) generalFields.classList.toggle('hidden', !!isOrphans);

            document.getElementById('caseModalTitle').innerText = 'تعديل بيانات الحالة ✏️';
            document.getElementById('saveCaseBtn').innerText = 'حفظ التعديلات';
            toggleModal('caseModal');
        });
    });

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
    if (!window.XLSX) { alert("مكتبة Excel غير جاهزة بعد."); return; }
    const filteredRecords = allCases.filter(r => (r.category || 'permanent') === currentTab);
    if (!filteredRecords.length) { alert("لا توجد بيانات لتصديرها."); return; }

    let exportData;
    if (currentTab === 'orphans') {
        exportData = filteredRecords.map((r, index) => ({
            "م": index + 1,
            "اسم اليتيم": r.name || "",
            "اسم الأم": r.motherName || "",
            "الرقم القومي": r.nationalId || "",
            "الهاتف": r.phone || "",
            "العنوان": r.address || "",
            "الملاحظات": r.notes || "",
            "رابط المستند": (r.documentUrls || (r.documentUrl ? [r.documentUrl] : [])).join(" , ") || "لا يوجد"
        }));
    } else {
        exportData = filteredRecords.map((r, index) => ({
            "م": index + 1,
            "الاسم": r.name || "",
            "الرقم القومي": r.nationalId || "",
            "الهاتف": r.phone || "",
            "العنوان": r.address || "",
            "عدد أفراد الأسرة": r.familyCount || "",
            "الحالة": r.details || "",
            "الملاحظات": r.notes || "",
            "رابط المستند": (r.documentUrls || (r.documentUrl ? [r.documentUrl] : [])).join(" , ") || "لا يوجد"
        }));
    }

    const labels = { permanent: 'حالات_دائم', temporary: 'حالات_مؤقتة', orphans: 'أيتام', support: 'تجهيز_ودعم' };
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الحالات");
    XLSX.writeFile(wb, `${labels[currentTab]}_export.xlsx`);
}
