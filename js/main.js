import { initNavigation } from './ui/navigation.js';
import { initModals } from './ui/modals.js';
import { initCasesService } from './services/cases.js';
import { initMembersService } from './services/members.js';
import { initRevenuesService } from './services/revenues.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI
    initNavigation();
    initModals();

    // Initialize Services
    initCasesService();
    initMembersService();
    initRevenuesService();
});
