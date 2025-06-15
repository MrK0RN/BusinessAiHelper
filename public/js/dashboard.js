// Dashboard functionality
class Dashboard {
    constructor() {
        this.data = {
            stats: null,
            bots: [],
            knowledgeFiles: [],
            recentActivity: []
        };
        this.activeSection = 'overview';
    }

    // Initialize dashboard
    async init() {
        await this.loadDashboardData();
        this.setupSidebarNavigation();
        this.setupEventListeners();
        this.renderCurrentSection();
    }

    // Load all dashboard data
    async loadDashboardData() {
        try {
            showLoading(true);
            
            // Load data in parallel
            const [stats, bots, knowledgeFiles, recentActivity] = await Promise.allSettled([
                api.getStats().catch(() => ({ totalMessages: 0, activeBots: 0, avgResponseTime: 0 })),
                api.getBots().catch(() => []),
                api.getKnowledgeFiles().catch(() => []),
                api.getRecentActivity().catch(() => [])
            ]);

            this.data.stats = stats.status === 'fulfilled' ? stats.value : { totalMessages: 0, activeBots: 0, avgResponseTime: 0 };
            this.data.bots = bots.status === 'fulfilled' ? bots.value : [];
            this.data.knowledgeFiles = knowledgeFiles.status === 'fulfilled' ? knowledgeFiles.value : [];
            this.data.recentActivity = recentActivity.status === 'fulfilled' ? recentActivity.value : [];
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            showLoading(false);
        }
    }

    // Setup sidebar navigation
    setupSidebarNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Add bot button
        const addBotBtn = document.getElementById('addBotBtn');
        const createFirstBot = document.getElementById('createFirstBot');
        if (addBotBtn) addBotBtn.addEventListener('click', () => this.showCreateBotModal());
        if (createFirstBot) createFirstBot.addEventListener('click', () => this.showCreateBotModal());

        // Upload file buttons
        const uploadFileBtn = document.getElementById('uploadFileBtn');
        const uploadFirstFile = document.getElementById('uploadFirstFile');
        if (uploadFileBtn) uploadFileBtn.addEventListener('click', () => this.showUploadFileModal());
        if (uploadFirstFile) uploadFirstFile.addEventListener('click', () => this.showUploadFileModal());
    }

    // Switch dashboard section
    switchSection(section) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update active section
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}Section`).classList.add('active');

        this.activeSection = section;
        this.renderCurrentSection();
    }

    // Render current section
    renderCurrentSection() {
        switch (this.activeSection) {
            case 'overview':
                this.renderOverview();
                break;
            case 'bots':
                this.renderBots();
                break;
            case 'knowledge':
                this.renderKnowledgeBase();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    // Render overview section
    renderOverview() {
        // Update stats
        if (this.data.stats) {
            document.getElementById('totalMessages').textContent = this.data.stats.totalMessages || 0;
            document.getElementById('activeBots').textContent = this.data.stats.activeBots || 0;
            document.getElementById('avgResponseTime').textContent = `${this.data.stats.avgResponseTime || 0}мс`;
        }

        // Render recent activity
        this.renderRecentActivity();
    }

    // Render recent activity
    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (!this.data.recentActivity || this.data.recentActivity.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Нет данных для отображения</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    // Render bots section
    renderBots() {
        const container = document.getElementById('botsList');
        if (!container) return;

        if (!this.data.bots || this.data.bots.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>У вас пока нет ботов. Создайте первого бота для начала работы.</p>
                    <button class="btn btn-primary" onclick="dashboard.showCreateBotModal()">Создать бота</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.bots.map(bot => `
            <div class="bot-card">
                <div class="bot-header">
                    <h3>${bot.name}</h3>
                    <span class="bot-status ${bot.is_active ? 'active' : 'inactive'}">
                        ${bot.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                </div>
                <div class="bot-platform">${this.getPlatformName(bot.platform)}</div>
                <div class="bot-actions">
                    <button class="btn btn-ghost btn-sm" onclick="dashboard.editBot(${bot.id})">Редактировать</button>
                    <button class="btn btn-ghost btn-sm" onclick="dashboard.deleteBot(${bot.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    // Render knowledge base section
    renderKnowledgeBase() {
        const container = document.getElementById('knowledgeFiles');
        if (!container) return;

        if (!this.data.knowledgeFiles || this.data.knowledgeFiles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>База знаний пуста. Загрузите документы для обучения ассистента.</p>
                    <button class="btn btn-primary" onclick="dashboard.showUploadFileModal()">Загрузить файл</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.knowledgeFiles.map(file => `
            <div class="file-card">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                </div>
                <div class="file-content">
                    <h4>${file.original_name}</h4>
                    <p>${this.formatFileSize(file.file_size)} • ${file.mime_type}</p>
                    <p class="file-status ${file.is_processed ? 'processed' : 'processing'}">
                        ${file.is_processed ? 'Обработан' : 'Обрабатывается...'}
                    </p>
                </div>
                <div class="file-actions">
                    <button class="btn btn-ghost btn-sm" onclick="dashboard.deleteFile(${file.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    // Render analytics section
    renderAnalytics() {
        // Analytics will be implemented when we have data
    }

    // Get platform display name
    getPlatformName(platform) {
        const names = {
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            instagram: 'Instagram'
        };
        return names[platform] || platform;
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show create bot modal
    showCreateBotModal() {
        showToast('Создание бота', 'Функция создания ботов будет доступна в следующей версии', 'info');
    }

    // Show upload file modal
    showUploadFileModal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.docx,.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.uploadFile(file);
            }
        };
        input.click();
    }

    // Upload file
    async uploadFile(file) {
        try {
            showLoading(true);
            await api.uploadKnowledgeFile(file);
            await this.loadDashboardData();
            this.renderCurrentSection();
            showToast('Файл загружен', 'Документ успешно добавлен в базу знаний', 'success');
        } catch (error) {
            showToast('Ошибка загрузки', error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Edit bot
    editBot(id) {
        showToast('Редактирование', 'Функция редактирования ботов будет доступна в следующей версии', 'info');
    }

    // Delete bot
    async deleteBot(id) {
        if (!confirm('Вы уверены, что хотите удалить этого бота?')) return;
        
        try {
            showLoading(true);
            await api.deleteBot(id);
            await this.loadDashboardData();
            this.renderCurrentSection();
            showToast('Бот удален', 'Бот успешно удален', 'success');
        } catch (error) {
            showToast('Ошибка удаления', error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Delete file
    async deleteFile(id) {
        if (!confirm('Вы уверены, что хотите удалить этот файл?')) return;
        
        try {
            showLoading(true);
            await api.deleteKnowledgeFile(id);
            await this.loadDashboardData();
            this.renderCurrentSection();
            showToast('Файл удален', 'Файл успешно удален из базы знаний', 'success');
        } catch (error) {
            showToast('Ошибка удаления', error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Global dashboard instance
window.dashboard = new Dashboard();