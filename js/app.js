/**
 * Главный контроллер приложения NeuroMail
 * Координирует работу всех компонентов
 */
class MailSlurpApp {
    constructor() {
        this.api = new MailSlurpApi();
        this.ui = new MailSlurpUI(this);
        this.generator = new DataGenerator();
        this.i18n = new I18nManager();
        this.performanceOptimizer = new PerformanceOptimizer();
        
        // Данные приложения
        this.inboxes = [];
        this.emails = [];
        this.currentInboxId = null;
        this.isInitialized = false;
        
        // Кэш для писем
        this.emailCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 минут
        
        // Настройки
        this.settings = {
            autoDeleteInboxes: true,
            enableNotifications: true,
            emailCheckInterval: 5000,
            inboxLifetime: 5 * 60 * 1000 // 5 минут
        };
        
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            console.log('🚀 Инициализация NeuroMail...');
            
            // Загрузить настройки
            this.loadSettings();
            
            // Проверить подключение к API (не критично для инициализации)
            try {
                await this.checkApiConnection();
            } catch (apiError) {
                console.warn('⚠️ API недоступен, но приложение продолжает работу:', apiError);
                this.ui.updateConnectionStatus(false);
            }
            
            // Загрузить данные (если API доступен)
            try {
                await this.loadInboxes();
            } catch (loadError) {
                console.warn('⚠️ Не удалось загрузить ящики:', loadError);
            }
            
            // Настроить автоматические задачи
            this.setupAutoTasks();
            
            // Обновить UI
            this.ui.updatePageLanguage();
            
            this.isInitialized = true;
            console.log('✅ NeuroMail инициализирован успешно');
            
            // Показать уведомление о готовности
            this.ui.showToast(this.i18n.t('app_name') + ' готов к работе!', 'success');
            
        } catch (error) {
            console.error('❌ Критическая ошибка инициализации:', error);
            // Не показываем ошибку пользователю, приложение может работать в ограниченном режиме
            this.isInitialized = true;
        }
    }

    /**
     * Загрузить настройки из localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('neuroMail_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }

    /**
     * Сохранить настройки в localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('neuroMail_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
        }
    }

    /**
     * Проверить подключение к API
     */
    async checkApiConnection() {
        try {
            const status = await this.api.checkConnection();
            this.ui.updateConnectionStatus(status.connected);
            
            if (status.connected) {
                console.log('✅ API подключен:', status.userInfo);
            } else {
                console.warn('⚠️ API недоступен:', status.error);
                this.ui.showToast('Проблемы с подключением к API', 'warning');
            }
            
            return status.connected;
        } catch (error) {
            console.error('Ошибка проверки API:', error);
            this.ui.updateConnectionStatus(false);
            return false;
        }
    }

    /**
     * Создать новый почтовый ящик
     */
    async createInbox() {
        try {
            this.ui.showModal('create-inbox-modal');
            
            const inbox = await this.api.createInbox({
                name: `NeuroMail-${Date.now()}`,
                description: 'Временный почтовый ящик',
                expiresAt: new Date(Date.now() + this.settings.inboxLifetime).toISOString()
            });
            
            this.inboxes.unshift(inbox);
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            this.ui.hideModal('create-inbox-modal');
            this.ui.showToast(this.i18n.t('inbox_created_success'), 'success');
            
            // Настроить автоудаление если включено
            if (this.settings.autoDeleteInboxes) {
                this.scheduleInboxDeletion(inbox.id);
            }
            
            return inbox;
        } catch (error) {
            console.error('Ошибка создания ящика:', error);
            this.ui.hideModal('create-inbox-modal');
            this.ui.showToast(this.i18n.t('error_creating_inbox'), 'error');
            throw error;
        }
    }

    /**
     * Загрузить список почтовых ящиков
     */
    async loadInboxes() {
        try {
            this.ui.showLoading('inboxes-section');
            
            const inboxes = await this.api.getInboxes({ size: 50 });
            this.inboxes = inboxes || [];
            
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            this.ui.hideLoading('inboxes-section');
            
            return this.inboxes;
        } catch (error) {
            console.error('Ошибка загрузки ящиков:', error);
            this.ui.hideLoading('inboxes-section');
            this.ui.showToast('Ошибка загрузки ящиков', 'error');
            return [];
        }
    }

    /**
     * Удалить почтовый ящик
     * @param {string} inboxId - ID ящика
     */
    async deleteInbox(inboxId) {
        try {
            if (!confirm(this.i18n.t('confirm_delete_inbox'))) {
                return;
            }
            
            await this.api.deleteInbox(inboxId);
            
            this.inboxes = this.inboxes.filter(inbox => inbox.id !== inboxId);
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            // Очистить письма если это текущий ящик
            if (this.currentInboxId === inboxId) {
                this.emails = [];
                this.ui.updateEmailsList(this.emails);
                this.currentInboxId = null;
            }
            
            this.ui.showToast(this.i18n.t('inbox_deleted_success'), 'success');
        } catch (error) {
            console.error('Ошибка удаления ящика:', error);
            this.ui.showToast(this.i18n.t('error_deleting_inbox'), 'error');
        }
    }

    /**
     * Загрузить письма для ящика
     * @param {string} inboxId - ID ящика
     * @param {boolean} forceRefresh - Принудительное обновление
     */
    async loadEmailsForInbox(inboxId, forceRefresh = false) {
        try {
            this.currentInboxId = inboxId;
            this.ui.showLoading('emails-section');
            
            // Проверяем кэш, если не принудительное обновление
            if (!forceRefresh) {
                const cachedEmails = this.getCachedEmails(inboxId);
                if (cachedEmails) {
                    this.emails = cachedEmails;
                    this.ui.updateEmailsList(this.emails);
                    this.ui.hideLoading('emails-section');
                    return this.emails;
                }
            }
            
            const emails = await this.api.getEmails(inboxId, { size: 50 });
            const newEmails = emails || [];
            
            // 去重逻辑 - 合并新邮件 с существующими, избегая дубликатов
            this.emails = this.deduplicateEmails([...this.emails, ...newEmails]);
            
            // Сохраняем в кэш
            this.setCachedEmails(inboxId, this.emails);
            
            this.ui.updateEmailsList(this.emails);
            this.ui.hideLoading('emails-section');
            
            return this.emails;
        } catch (error) {
            console.error('Ошибка загрузки писем:', error);
            this.ui.hideLoading('emails-section');
            this.ui.showToast(this.i18n.t('error_loading_emails'), 'error');
            return [];
        }
    }

    /**
     * Загрузить все письма
     */
    async loadEmails() {
        if (this.currentInboxId) {
            return await this.loadEmailsForInbox(this.currentInboxId);
        }
        return [];
    }

    /**
     * Обновить письма
     */
    async refreshEmails() {
        if (this.currentInboxId) {
            // Очищаем кэш для текущего ящика и принудительно обновляем
            this.clearEmailCache(this.currentInboxId);
            await this.loadEmailsForInbox(this.currentInboxId, true);
        }
    }

    /**
     * Удалить дубликаты писем
     * @param {Array} emails - Массив писем
     * @returns {Array} Массив без дубликатов
     */
    deduplicateEmails(emails) {
        const seen = new Set();
        const uniqueEmails = [];
        let duplicateCount = 0;

        for (const email of emails) {
            // Создаем уникальный ключ на основе ID письма и содержимого
            const emailKey = this.createEmailKey(email);
            
            if (!seen.has(emailKey)) {
                seen.add(emailKey);
                uniqueEmails.push(email);
            } else {
                duplicateCount++;
                console.log('Обнаружен дубликат письма:', email.subject || '(Без темы)');
            }
        }

        if (duplicateCount > 0) {
            this.ui.showToast(`Удалено ${duplicateCount} дубликатов писем`, 'info');
        }

        // Сортируем по дате создания (новые сверху)
        return uniqueEmails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Создать уникальный ключ для письма
     * @param {Object} email - Письмо
     * @returns {string} Уникальный ключ
     */
    createEmailKey(email) {
        // Используем ID письма как основной ключ
        if (email.id) {
            return `id:${email.id}`;
        }
        
        // Если ID нет, создаем ключ на основе содержимого
        const content = `${email.from || ''}-${email.subject || ''}-${email.body || ''}-${email.createdAt || ''}`;
        return `content:${this.hashString(content)}`;
    }

    /**
     * Создать хеш строки
     * @param {string} str - Строка
     * @returns {string} Хеш
     */
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * Получить кэшированные письма
     * @param {string} inboxId - ID ящика
     * @returns {Array|null} Кэшированные письма или null
     */
    getCachedEmails(inboxId) {
        const cacheKey = `emails_${inboxId}`;
        const cached = this.emailCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            console.log('Используем кэшированные письма для ящика:', inboxId);
            return cached.emails;
        }
        
        return null;
    }

    /**
     * Сохранить письма в кэш
     * @param {string} inboxId - ID ящика
     * @param {Array} emails - Письма
     */
    setCachedEmails(inboxId, emails) {
        const cacheKey = `emails_${inboxId}`;
        this.emailCache.set(cacheKey, {
            emails: [...emails],
            timestamp: Date.now()
        });
        console.log('Письма сохранены в кэш для ящика:', inboxId);
    }

    /**
     * Очистить кэш писем
     * @param {string} inboxId - ID ящика (опционально)
     */
    clearEmailCache(inboxId = null) {
        if (inboxId) {
            const cacheKey = `emails_${inboxId}`;
            this.emailCache.delete(cacheKey);
            console.log('Кэш очищен для ящика:', inboxId);
        } else {
            this.emailCache.clear();
            console.log('Весь кэш писем очищен');
        }
    }

    /**
     * Очистить устаревший кэш
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.emailCache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.emailCache.delete(key);
                console.log('Удален устаревший кэш:', key);
            }
        }
    }

    /**
     * Просмотреть письмо
     * @param {string} emailId - ID письма
     */
    async viewEmail(emailId) {
        try {
            const email = await this.api.getEmail(emailId);
            this.ui.showEmailViewer(email);
        } catch (error) {
            console.error('Ошибка загрузки письма:', error);
            this.ui.showToast('Ошибка загрузки письма', 'error');
        }
    }

    /**
     * Удалить письмо
     * @param {string} emailId - ID письма
     */
    async deleteEmail(emailId) {
        try {
            if (!confirm(this.i18n.t('confirm_delete_email'))) {
                return;
            }
            
            await this.api.deleteEmail(emailId);
            
            this.emails = this.emails.filter(email => email.id !== emailId);
            this.ui.updateEmailsList(this.emails);
            
            this.ui.showToast(this.i18n.t('email_deleted_success'), 'success');
        } catch (error) {
            console.error('Ошибка удаления письма:', error);
            this.ui.showToast(this.i18n.t('error_deleting_email'), 'error');
        }
    }

    /**
     * Отправить письмо
     * @param {Object} emailData - Данные письма
     */
    async sendEmail(emailData) {
        try {
            if (!this.currentInboxId) {
                this.ui.showToast('Выберите ящик для отправки', 'warning');
                return;
            }
            
            await this.api.sendEmail(this.currentInboxId, emailData);
            this.ui.showToast(this.i18n.t('email_sent_success'), 'success');
        } catch (error) {
            console.error('Ошибка отправки письма:', error);
            this.ui.showToast(this.i18n.t('error_sending_email'), 'error');
        }
    }

    /**
     * Отправить письмо из ящика
     * @param {string} inboxId - ID ящика
     */
    sendEmailFromInbox(inboxId) {
        this.currentInboxId = inboxId;
        this.ui.showModal('send-email-modal');
    }

    /**
     * Сгенерировать данные пользователя
     */
    async generateUserData() {
        try {
            const countrySelector = document.getElementById('country-selector');
            const stateSelector = document.getElementById('state-selector');
            const dataContainer = document.getElementById('generated-data');
            
            if (!countrySelector || !stateSelector || !dataContainer) {
                throw new Error('Элементы генератора не найдены');
            }

            const country = countrySelector.value;
            const state = stateSelector.value;

            if (!country || !state) {
                this.ui.showToast('Пожалуйста, выберите страну и штат/регион', 'warning');
                return;
            }

            // Показываем индикатор загрузки
            dataContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Генерация данных через AI...</p>
                </div>
            `;

            // Генерируем данные с адресом через Gemini API
            const userData = await this.generator.generateUserDataWithAddress(country, state);
            const formattedData = this.generator.formatDataForDisplay(userData);
            
            // Отображаем данные на странице
            dataContainer.innerHTML = formattedData;
            this.ui.showToast('Данные успешно сгенерированы!', 'success');
            
            return userData;
        } catch (error) {
            console.error('Ошибка генерации данных:', error);
            this.ui.showToast('Ошибка генерации данных', 'error');
            
            // Показываем пустое состояние при ошибке
            const dataContainer = document.getElementById('generated-data');
            if (dataContainer) {
                dataContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Ошибка генерации</h3>
                        <p>Попробуйте еще раз или выберите другую страну/штат</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Переключить режим API
     * @param {string} mode - Режим API
     */
    switchApiMode(mode) {
        this.api.switchApiMode(mode);
        this.api.keyManager.setApiMode(mode);
        this.ui.showToast(`Режим API изменен на: ${mode}`, 'info');
    }

    /**
     * Обновить персональный API ключ
     * @param {string} key - API ключ
     */
    updatePersonalApiKey(key) {
        this.api.keyManager.setPersonalApiKey(key);
        this.api.personalApiKey = key;
        this.ui.showToast(this.i18n.t('api_key_updated_success'), 'success');
    }

    /**
     * Запланировать автоудаление ящика
     * @param {string} inboxId - ID ящика
     */
    scheduleInboxDeletion(inboxId) {
        setTimeout(async () => {
            try {
                await this.api.deleteInbox(inboxId);
                this.inboxes = this.inboxes.filter(inbox => inbox.id !== inboxId);
                this.ui.updateInboxesList(this.inboxes);
                this.ui.updateInboxSelector(this.inboxes);
                console.log(`Ящик ${inboxId} автоматически удален`);
            } catch (error) {
                console.error('Ошибка автоудаления ящика:', error);
            }
        }, this.settings.inboxLifetime);
    }

    /**
     * Настроить автоматические задачи
     */
    setupAutoTasks() {
        // Проверка новых писем каждые 30 секунд
        setInterval(async () => {
            if (this.currentInboxId && this.settings.enableNotifications) {
                try {
                    const newEmail = await this.api.waitForLatestEmail(this.currentInboxId, 1);
                    if (newEmail) {
                        // Проверяем, не является ли письмо дубликатом
                        const emailKey = this.createEmailKey(newEmail);
                        const isDuplicate = this.emails.some(email => this.createEmailKey(email) === emailKey);
                        
                        if (!isDuplicate) {
                            this.emails.unshift(newEmail);
                            this.ui.updateEmailsList(this.emails);
                            this.ui.showToast('Получено новое письмо!', 'info');
                        } else {
                            console.log('Получено дубликат письма, игнорируем:', newEmail.subject || '(Без темы)');
                        }
                    }
                } catch (error) {
                    // Игнорируем ошибки таймаута
                }
            }
        }, 30000);
        
        // Проверка подключения каждые 5 минут
        setInterval(() => {
            this.checkApiConnection();
        }, 5 * 60 * 1000);
        
        // Очистка устаревшего кэша каждые 10 минут
        setInterval(() => {
            this.clearExpiredCache();
        }, 10 * 60 * 1000);
    }

    /**
     * Скачать вложение
     * @param {string} attachmentId - ID вложения
     * @param {string} filename - Имя файла
     */
    async downloadAttachment(attachmentId, filename = 'attachment') {
        try {
            // Показываем прогресс
            this.ui.showToast('Начинаем скачивание вложения...', 'info');
            
            // Обновляем UI кнопки скачивания
            this.updateDownloadButton(attachmentId, 'loading');
            
            // Получаем информацию о вложении
            const attachmentInfo = await this.getAttachmentInfo(attachmentId);
            
            if (attachmentInfo) {
                this.ui.showToast(`Скачиваем ${attachmentInfo.filename || filename} (${this.formatFileSize(attachmentInfo.size || 0)})...`, 'info');
            }
            
            await this.api.downloadAttachment(attachmentId, filename);
            
            // Восстанавливаем кнопку
            this.updateDownloadButton(attachmentId, 'success');
            this.ui.showToast('Вложение успешно скачано!', 'success');
            
        } catch (error) {
            console.error('Ошибка скачивания вложения:', error);
            
            // Восстанавливаем кнопку
            this.updateDownloadButton(attachmentId, 'error');
            
            // Показываем детальную ошибку
            let errorMessage = 'Ошибка скачивания вложения';
            if (error.message.includes('404')) {
                errorMessage = 'Вложение не найдено';
            } else if (error.message.includes('403')) {
                errorMessage = 'Нет доступа к вложению';
            } else if (error.message.includes('401')) {
                errorMessage = 'Ошибка авторизации';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Превышено время ожидания';
            } else {
                errorMessage = `Ошибка: ${error.message}`;
            }
            
            this.ui.showToast(errorMessage, 'error');
        }
    }

    /**
     * Получить информацию о вложении
     * @param {string} attachmentId - ID вложения
     * @returns {Promise<Object|null>} Информация о вложении
     */
    async getAttachmentInfo(attachmentId) {
        try {
            // Попробуем получить информацию из письма
            for (const email of this.emails) {
                if (email.attachments) {
                    const attachment = email.attachments.find(att => att.id === attachmentId);
                    if (attachment) {
                        return attachment;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Ошибка получения информации о вложении:', error);
            return null;
        }
    }

    /**
     * Обновить кнопку скачивания
     * @param {string} attachmentId - ID вложения
     * @param {string} state - Состояние (loading, success, error, normal)
     */
    updateDownloadButton(attachmentId, state) {
        const attachmentItem = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
        if (!attachmentItem) return;

        const button = attachmentItem.querySelector('.download-btn');
        if (!button) return;

        const icon = button.querySelector('i');
        
        switch (state) {
            case 'loading':
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Скачивание...';
                button.classList.add('loading');
                break;
            case 'success':
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-check"></i> Скачано';
                button.classList.remove('loading');
                button.classList.add('success');
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-download"></i>';
                    button.classList.remove('success');
                }, 2000);
                break;
            case 'error':
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Ошибка';
                button.classList.remove('loading');
                button.classList.add('error');
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-download"></i>';
                    button.classList.remove('error');
                }, 3000);
                break;
            default:
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-download"></i>';
                button.classList.remove('loading', 'success', 'error');
        }
    }

    /**
     * Форматировать размер файла
     * @param {number} bytes - Размер в байтах
     * @returns {string} Отформатированный размер
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Получить статистику приложения
     */
    getAppStats() {
        return {
            inboxes: this.inboxes.length,
            emails: this.emails.length,
            apiStatus: this.api.getPublicKeyPoolStatus(),
            settings: this.settings,
            currentLanguage: this.i18n.getCurrentLanguage()
        };
    }

    /**
     * Сбросить все данные
     */
    resetAllData() {
        if (confirm('Вы уверены, что хотите сбросить все данные?')) {
            localStorage.clear();
            this.inboxes = [];
            this.emails = [];
            this.currentInboxId = null;
            
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateEmailsList(this.emails);
            this.ui.updateInboxSelector(this.inboxes);
            
            this.ui.showToast('Все данные сброшены', 'info');
        }
    }

    /**
     * Экспортировать данные
     */
    exportData() {
        const data = {
            inboxes: this.inboxes,
            emails: this.emails,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `neuroMail-export-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.ui.showToast('Данные экспортированы', 'success');
    }

    /**
     * Импортировать данные
     * @param {File} file - Файл для импорта
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.inboxes) this.inboxes = data.inboxes;
            if (data.emails) this.emails = data.emails;
            if (data.settings) this.settings = { ...this.settings, ...data.settings };
            
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateEmailsList(this.emails);
            this.ui.updateInboxSelector(this.inboxes);
            
            this.saveSettings();
            this.ui.showToast('Данные импортированы', 'success');
        } catch (error) {
            console.error('Ошибка импорта данных:', error);
            this.ui.showToast('Ошибка импорта данных', 'error');
        }
    }

    /**
     * Копировать email адрес в буфер обмена
     * @param {string} email - Email адрес
     */
    async copyEmailToClipboard(email) {
        try {
            await navigator.clipboard.writeText(email);
            this.ui.showToast(`Email скопирован: ${email}`, 'success');
        } catch (error) {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = email;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.ui.showToast(`Email скопирован: ${email}`, 'success');
        }
    }
}

// Глобальные функции для копирования
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        if (window.mailSlurpApp) {
            window.mailSlurpApp.ui.showToast('Скопировано в буфер обмена', 'success');
        }
    } catch (error) {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        if (window.mailSlurpApp) {
            window.mailSlurpApp.ui.showToast('Скопировано в буфер обмена', 'success');
        }
    }
};

window.togglePassword = function(button) {
    const passwordText = button.parentElement.querySelector('.password-text');
    const icon = button.querySelector('i');
    
    if (passwordText.style.filter === 'blur(5px)') {
        passwordText.style.filter = 'none';
        icon.className = 'fas fa-eye-slash';
        button.title = 'Скрыть пароль';
    } else {
        passwordText.style.filter = 'blur(5px)';
        icon.className = 'fas fa-eye';
        button.title = 'Показать пароль';
    }
};

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.mailSlurpApp = new MailSlurpApp();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MailSlurpApp;
}
