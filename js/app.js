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
     */
    async loadEmailsForInbox(inboxId) {
        try {
            this.currentInboxId = inboxId;
            this.ui.showLoading('emails-section');
            
            const emails = await this.api.getEmails(inboxId, { size: 50 });
            this.emails = emails || [];
            
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
            await this.loadEmailsForInbox(this.currentInboxId);
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
                        this.emails.unshift(newEmail);
                        this.ui.updateEmailsList(this.emails);
                        this.ui.showToast('Получено новое письмо!', 'info');
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
    }

    /**
     * Скачать вложение
     * @param {string} attachmentId - ID вложения
     */
    async downloadAttachment(attachmentId) {
        try {
            const attachment = await this.api.getAttachment(attachmentId);
            
            // Создать ссылку для скачивания
            const link = document.createElement('a');
            link.href = attachment.downloadUrl;
            link.download = attachment.filename || 'attachment';
            link.click();
            
            this.ui.showToast('Вложение скачивается...', 'info');
        } catch (error) {
            console.error('Ошибка скачивания вложения:', error);
            this.ui.showToast('Ошибка скачивания вложения', 'error');
        }
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
