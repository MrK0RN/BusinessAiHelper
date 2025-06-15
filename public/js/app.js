// Main application controller
class App {
    constructor() {
        this.currentPage = 'landing';
        this.isInitialized = false;
    }

    // Initialize the application
    async init() {
        if (this.isInitialized) return;
        
        // Initialize auth state
        await auth.init();
        
        // Setup auth state listener
        auth.addListener((user, isLoading) => {
            this.updateUserInterface(user, isLoading);
        });

        // Setup navigation event listeners
        this.setupNavigation();
        
        // Setup form event listeners
        this.setupForms();
        
        // Initial page routing
        this.route();
        
        this.isInitialized = true;
    }

    // Update UI based on auth state
    updateUserInterface(user, isLoading) {
        if (isLoading) {
            showLoading(true);
            return;
        }
        
        showLoading(false);
        
        if (user) {
            // User is authenticated
            this.updateUserDisplay(user);
            
            if (this.currentPage !== 'dashboard') {
                this.showPage('dashboard');
            }
        } else {
            // User is not authenticated
            if (this.currentPage === 'dashboard') {
                this.showPage('landing');
            }
        }
    }

    // Update user display in header
    updateUserDisplay(user) {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) {
            const displayName = user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.email || 'Пользователь';
            userNameEl.textContent = displayName;
        }
        
        if (userAvatarEl) {
            const initial = user.first_name?.[0] || user.email?.[0] || 'U';
            userAvatarEl.textContent = initial.toUpperCase();
        }
    }

    // Setup navigation event listeners
    setupNavigation() {
        // Demo and Contact navigation
        document.getElementById('demoBtn')?.addEventListener('click', () => {
            this.showDemo();
        });
        
        document.getElementById('contactBtn')?.addEventListener('click', () => {
            this.showContact();
        });
        
        document.getElementById('heroContact')?.addEventListener('click', () => {
            this.showContact();
        });
        
        document.getElementById('heroDemo')?.addEventListener('click', () => {
            this.showDemo();
        });
        
        document.getElementById('ctaContact')?.addEventListener('click', () => {
            this.showContact();
        });

        // Auth page navigation
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('register');
        });
        
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('login');
        });
        
        document.getElementById('backToHome')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('landing');
        });
        
        document.getElementById('backToHomeFromRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('landing');
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
        });
    }

    // Setup form event listeners
    setupForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });
        }

        // Clear errors on input
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('input', () => {
                clearFormError(input.id);
            });
        });
    }

    // Handle login form submission
    async handleLogin(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (!validateLoginForm(data)) {
            return;
        }

        try {
            await auth.login(data);
        } catch (error) {
            // Error handling is done in auth.login
        }
    }

    // Handle register form submission
    async handleRegister(form) {
        const formData = new FormData(form);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (!validateRegisterForm(data)) {
            return;
        }

        // Remove confirmPassword before sending to API
        const { confirmPassword, ...registerData } = data;

        try {
            await auth.register(registerData);
        } catch (error) {
            // Error handling is done in auth.register
        }
    }

    // Show specific page
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;

            // Initialize dashboard if showing dashboard page
            if (pageName === 'dashboard' && auth.isAuthenticated()) {
                dashboard.init();
            }
        }
    }

    // Show demo section
    showDemo() {
        const featuresSection = document.querySelector('.features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
        showToast('Демо', 'Просмотрите возможности платформы в секции ниже', 'info');
    }

    // Show contact information
    showContact() {
        showToast('Связаться с нами', 'Email: support@aiassistant.ru | Телефон: +7 (495) 123-45-67', 'info');
    }

    // Route based on auth state
    route() {
        if (auth.isAuthenticated()) {
            this.showPage('dashboard');
        } else {
            this.showPage('landing');
        }
    }
}

// Utility functions

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }
}

// Show toast notification
function showToast(title, description, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);

    // Remove on click
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Global app instance
window.app = new App();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});