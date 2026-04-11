// Handle View Switching
export function showView(viewId) {
    const views = ['mainDashboard', 'casesSection', 'managementDashboard', 'membersSection', 'revenuesSection'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
}

export function initNavigation() {
    // Basic navigation back buttons
    document.querySelectorAll('[data-nav-back]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-nav-back');
            showView(target);
        });
    });

    // Main dashboard cards
    const btnManagement = document.getElementById('nav-management');
    if (btnManagement) {
        btnManagement.addEventListener('click', () => {
            const pwd = prompt('الرجاء إدخال كلمة المرور الخاصة بقسم الإدارة:');
            if (pwd === 'Awd01227022115') {
                showView('managementDashboard');
            } else if (pwd !== null) {
                alert('كلمة المرور غير صحيحة ❌');
            }
        });
    }
}
