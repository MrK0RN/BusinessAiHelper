// Authentication management
class Auth {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        this.listeners = [];
    }

    // Add listener for auth state changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    // Notify all listeners of auth state change
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentUser, this.isLoading));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser && !!api.getToken();
    }

    // Initialize auth state
    async init() {
        const token = api.getToken();
        if (token) {
            await this.loadUser();
        }
        this.notifyListeners();
    }

    // Load current user data
    async loadUser() {
        try {
            this.isLoading = true;
            this.notifyListeners();
            
            this.currentUser = await api.getUser();
        } catch (error) {
            console.error('Failed to load user:', error);
            this.logout();
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    // Register new user
    async register(userData) {
        try {
            this.isLoading = true;
            this.notifyListeners();

            const response = await api.register(userData);
            api.setToken(response.access_token);
            this.currentUser = response.user;
            
            showToast('Регистрация успешна', 'Добро пожаловать в панель управления!', 'success');
            return response;
        } catch (error) {
            showToast('Ошибка регистрации', error.message, 'error');
            throw error;
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    // Login user
    async login(credentials) {
        try {
            this.isLoading = true;
            this.notifyListeners();

            const response = await api.login(credentials);
            api.setToken(response.access_token);
            this.currentUser = response.user;
            
            showToast('Успешный вход', 'Добро пожаловать в панель управления!', 'success');
            return response;
        } catch (error) {
            showToast('Ошибка входа', error.message, 'error');
            throw error;
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    // Logout user
    logout() {
        api.removeToken();
        this.currentUser = null;
        showToast('Выход выполнен', 'До свидания!', 'success');
        this.notifyListeners();
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Get loading state
    getLoadingState() {
        return this.isLoading;
    }
}

// Form validation utilities
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateName(name) {
    return name.length >= 2;
}

// Show form error
function showFormError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

// Clear form error
function clearFormError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = '';
    }
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

// Clear all form errors
function clearAllFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorElements = form.querySelectorAll('.form-error');
    const inputElements = form.querySelectorAll('.form-input');
    
    errorElements.forEach(el => el.textContent = '');
    inputElements.forEach(el => el.classList.remove('error'));
}

// Validate login form
function validateLoginForm(formData) {
    let isValid = true;
    
    clearAllFormErrors('loginForm');
    
    if (!formData.email) {
        showFormError('loginEmail', 'Введите email адрес');
        isValid = false;
    } else if (!validateEmail(formData.email)) {
        showFormError('loginEmail', 'Введите корректный email адрес');
        isValid = false;
    }
    
    if (!formData.password) {
        showFormError('loginPassword', 'Введите пароль');
        isValid = false;
    }
    
    return isValid;
}

// Validate registration form
function validateRegisterForm(formData) {
    let isValid = true;
    
    clearAllFormErrors('registerForm');
    
    if (!formData.firstName) {
        showFormError('registerFirstName', 'Введите имя');
        isValid = false;
    } else if (!validateName(formData.firstName)) {
        showFormError('registerFirstName', 'Имя должно содержать минимум 2 символа');
        isValid = false;
    }
    
    if (!formData.lastName) {
        showFormError('registerLastName', 'Введите фамилию');
        isValid = false;
    } else if (!validateName(formData.lastName)) {
        showFormError('registerLastName', 'Фамилия должна содержать минимум 2 символа');
        isValid = false;
    }
    
    if (!formData.email) {
        showFormError('registerEmail', 'Введите email адрес');
        isValid = false;
    } else if (!validateEmail(formData.email)) {
        showFormError('registerEmail', 'Введите корректный email адрес');
        isValid = false;
    }
    
    if (!formData.password) {
        showFormError('registerPassword', 'Введите пароль');
        isValid = false;
    } else if (!validatePassword(formData.password)) {
        showFormError('registerPassword', 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    }
    
    if (!formData.confirmPassword) {
        showFormError('registerConfirmPassword', 'Подтвердите пароль');
        isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
        showFormError('registerConfirmPassword', 'Пароли не совпадают');
        isValid = false;
    }
    
    return isValid;
}

// Global auth instance
window.auth = new Auth();