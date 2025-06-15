// API utility functions
class API {
    constructor() {
        this.baseURL = '/api';
    }

    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('auth_token');
    }

    // Set auth token in localStorage
    setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    // Remove auth token
    removeToken() {
        localStorage.removeItem('auth_token');
    }

    // Make authenticated request
    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Auth endpoints
    async register(userData) {
        return this.request('POST', '/api/register', userData);
    }

    async login(credentials) {
        return this.request('POST', '/api/login', credentials);
    }

    async getUser() {
        return this.request('GET', '/api/user');
    }

    // Bot endpoints
    async getBots() {
        return this.request('GET', '/api/bots');
    }

    async createBot(botData) {
        return this.request('POST', '/api/bots', botData);
    }

    async updateBot(id, botData) {
        return this.request('PUT', `/api/bots/${id}`, botData);
    }

    async deleteBot(id) {
        return this.request('DELETE', `/api/bots/${id}`);
    }

    // Knowledge base endpoints
    async getKnowledgeFiles() {
        return this.request('GET', '/api/knowledge-files');
    }

    async uploadKnowledgeFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseURL}/api/knowledge-files`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    async deleteKnowledgeFile(id) {
        return this.request('DELETE', `/knowledge-files/${id}`);
    }

    // Stats endpoints
    async getStats() {
        return this.request('GET', '/stats');
    }

    async getRecentActivity() {
        return this.request('GET', '/recent-activity');
    }
}

// Global API instance
window.api = new API();