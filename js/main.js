import { initAuth } from './services/auth.js';
import { initNavigation } from './ui/navigation.js';
import { initModals } from './ui/modals.js';
import { initCasesService } from './services/cases.js';
import { initMembersService } from './services/members.js';
import { initRevenuesService } from './services/revenues.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Auth first — app only loads after login
    initAuth(() => {
        // Called once user is authenticated
        initNavigation();
        initModals();
        initCasesService();
        initMembersService();
        initRevenuesService();
    });
});
