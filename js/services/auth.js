import { auth, signInWithEmailAndPassword, signOut, updatePassword, onAuthStateChanged } from '../config/firebase.js';

export function initAuth(onLoginSuccess) {
    // Watch authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showApp();
            if (onLoginSuccess) onLoginSuccess();
        } else {
            showLogin();
        }
    });

    // Handle Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorMsg = document.getElementById('loginError');
            const btn = document.getElementById('loginBtn');

            btn.innerText = 'جاري الدخول...';
            btn.disabled = true;
            if (errorMsg) errorMsg.innerText = '';

            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                if (errorMsg) errorMsg.innerText = '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة.';
                btn.innerText = 'تسجيل الدخول';
                btn.disabled = false;
            }
        });
    }

    // Handle Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('هل تريد تسجيل الخروج؟')) {
                await signOut(auth);
            }
        });
    }

    // Handle Change Password Modal
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            const modal = document.getElementById('changePasswordModal');
            if (modal) modal.classList.remove('hidden');
        });
    }

    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;
            const msgEl = document.getElementById('changePassMsg');

            if (newPass !== confirmPass) {
                if (msgEl) msgEl.innerHTML = '<span class="text-red-500">❌ كلمتا المرور غير متطابقتين.</span>';
                return;
            }
            if (newPass.length < 6) {
                if (msgEl) msgEl.innerHTML = '<span class="text-red-500">❌ يجب أن تكون كلمة المرور 6 أحرف على الأقل.</span>';
                return;
            }

            try {
                await updatePassword(auth.currentUser, newPass);
                if (msgEl) msgEl.innerHTML = '<span class="text-green-600">✅ تم تغيير كلمة المرور بنجاح!</span>';
                changePasswordForm.reset();
                setTimeout(() => {
                    document.getElementById('changePasswordModal').classList.add('hidden');
                    if (msgEl) msgEl.innerText = '';
                }, 2000);
            } catch (err) {
                if (msgEl) msgEl.innerHTML = '<span class="text-red-500">❌ حدث خطأ، ربما تحتاج إعادة تسجيل الدخول.</span>';
            }
        });
    }

    // Close change password modal
    const cancelChangePass = document.getElementById('cancelChangePass');
    if (cancelChangePass) {
        cancelChangePass.addEventListener('click', () => {
            document.getElementById('changePasswordModal').classList.add('hidden');
        });
    }
}

function showLogin() {
    ['loginScreen', 'forgotPasswordMsg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });
    const appContainer = document.getElementById('appContainer');
    if (appContainer) appContainer.classList.add('hidden');
}

function showApp() {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.classList.add('hidden');
    const appContainer = document.getElementById('appContainer');
    if (appContainer) appContainer.classList.remove('hidden');
}
