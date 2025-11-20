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
        
        // Уникальный идентификатор устройства (для синхронизации между устройствами)
        this.deviceId = this.getOrCreateDeviceId();
        
        // Данные приложения
        this.inboxes = [];
        this.emails = [];
        this.currentInboxId = null;
        this.isInitialized = false;
        
        // Отслеживание времени создания писем для автоудаления
        this.emailTimestamps = new Map(); // emailId -> createdAt timestamp
        this.emailDeletionTimers = new Map(); // emailId -> timer ID
        
        // Настройки
        this.settings = {
            autoDeleteInboxes: true,
            enableNotifications: true,
            emailCheckInterval: 5000,
            inboxLifetime: 10 * 60 * 1000, // 10 минут
            emailLifetime: 10 * 60 * 1000 // 10 минут для писем
        };
        
        this.init();
    }

    /**
     * Получить или создать уникальный идентификатор устройства
     * @returns {string} Уникальный ID устройства
     */
    getOrCreateDeviceId() {
        // Используем sessionStorage для уникального идентификатора каждого устройства/браузера
        // Это гарантирует, что каждое устройство будет иметь свой отдельный ящик
        let deviceId = sessionStorage.getItem('neuroMail_deviceId');
        
        if (!deviceId) {
            // Создаем уникальный ID на основе временной метки и случайного числа
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('neuroMail_deviceId', deviceId);
        }
        
        return deviceId;
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
     * Создать новый почтовый ящик для текущего устройства
     */
    async createInbox() {
        try {
            this.ui.showModal('create-inbox-modal');
            
            // Удалить только ящик текущего устройства перед созданием нового
            if (this.inboxes.length > 0) {
                const currentInbox = this.inboxes[0];
                try {
                    await this.api.deleteInbox(currentInbox.id);
                } catch (error) {
                    console.warn(`Не удалось удалить старый ящик:`, error);
                }
            }
            
            // Обновить UI после удаления
            this.ui.updateInboxesList([]);
            this.ui.updateInboxSelector([]);
            
            // Небольшая задержка для завершения удаления на сервере
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Создать новый ящик с идентификатором устройства
            const inbox = await this.api.createInbox({
                name: `NeuroMail-${this.deviceId}-${Date.now()}`,
                description: `Ящик устройства ${this.deviceId}`,
                expiresAt: new Date(Date.now() + this.settings.inboxLifetime).toISOString()
            });
            
            // Очистить массив ящиков и добавить только новый
            this.inboxes = [inbox];
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            // Очистить письма при создании нового ящика
            this.emails = [];
            this.emailTimestamps.clear();
            this.clearAllEmailTimers();
            this.ui.updateEmailsList(this.emails);
            this.currentInboxId = null;
            
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
     * Теперь каждый девайс видит только свой ящик
     */
    async loadInboxes() {
        try {
            this.ui.showLoading('inboxes-section');
            
            const inboxes = await this.api.getInboxes({ size: 100 });
            const allInboxes = inboxes || [];
            
            // Найти ящик, принадлежащий этому устройству (по имени или описанию)
            // Имя ящика содержит deviceId
            let deviceInbox = null;
            
            for (const inbox of allInboxes) {
                // Проверяем, принадлежит ли ящик этому устройству
                // Имя ящика может содержать deviceId или описание может содержать deviceId
                if (inbox.name && inbox.name.includes(this.deviceId)) {
                    deviceInbox = inbox;
                    break;
                }
                // Также проверяем описание (на случай если имя не содержит deviceId)
                if (inbox.description && inbox.description.includes(this.deviceId)) {
                    deviceInbox = inbox;
                    break;
                }
            }
            
            // Если ящик для этого устройства не найден, создать новый
            if (!deviceInbox) {
                console.log(`Ящик для устройства ${this.deviceId} не найден, создаем новый`);
                deviceInbox = await this.api.createInbox({
                    name: `NeuroMail-${this.deviceId}-${Date.now()}`,
                    description: `Ящик устройства ${this.deviceId}`,
                    expiresAt: new Date(Date.now() + this.settings.inboxLifetime).toISOString()
                });
                
                // Настроить автоудаление если включено
                if (this.settings.autoDeleteInboxes) {
                    this.scheduleInboxDeletion(deviceInbox.id);
                }
            } else {
                // Проверить, не истек ли срок действия ящика
                const createdAt = new Date(deviceInbox.createdAt).getTime();
                const age = Date.now() - createdAt;
                
                if (age > this.settings.inboxLifetime) {
                    // Ящик истек, создаем новый
                    console.log(`Ящик устройства ${this.deviceId} истек, создаем новый`);
                    try {
                        await this.api.deleteInbox(deviceInbox.id);
                    } catch (error) {
                        console.warn(`Не удалось удалить истекший ящик:`, error);
                    }
                    
                    deviceInbox = await this.api.createInbox({
                        name: `NeuroMail-${this.deviceId}-${Date.now()}`,
                        description: `Ящик устройства ${this.deviceId}`,
                        expiresAt: new Date(Date.now() + this.settings.inboxLifetime).toISOString()
                    });
                    
                    // Настроить автоудаление если включено
                    if (this.settings.autoDeleteInboxes) {
                        this.scheduleInboxDeletion(deviceInbox.id);
                    }
                }
            }
            
            // Установить только ящик этого устройства
            this.inboxes = [deviceInbox];
            
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
                // Очистить все таймеры писем этого ящика
                for (const email of this.emails) {
                    this.emailTimestamps.delete(email.id);
                    this.clearEmailTimer(email.id);
                }
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
            // Переключиться на вкладку с письмами
            this.ui.showSection('emails-section');
            
            this.currentInboxId = inboxId;
            
            // Обновить селектор ящиков на вкладке писем
            const inboxSelector = document.getElementById('inbox-selector');
            if (inboxSelector) {
                inboxSelector.value = inboxId;
            }
            
            this.ui.showLoading('emails-section');
            
            const emails = await this.api.getEmails(inboxId, { size: 50 });
            
            // Убрать дубликаты по ID писем
            const uniqueEmails = [];
            const emailIds = new Set();
            
            if (emails && emails.length > 0) {
                for (const email of emails) {
                    if (!emailIds.has(email.id)) {
                        emailIds.add(email.id);
                        uniqueEmails.push(email);
                        
                        // Если это новое письмо, запланировать его удаление
                        if (!this.emailTimestamps.has(email.id)) {
                            const createdAt = new Date(email.createdAt).getTime();
                            this.emailTimestamps.set(email.id, createdAt);
                            this.scheduleEmailDeletion(email.id, createdAt);
                        }
                    }
                }
            }
            
            // Удалить старые письма (старше 10 минут)
            await this.cleanupOldEmails();
            
            // Обновить список писем, оставив только те, которые есть в API и не удалены
            const updatedEmails = [];
            
            // Добавить все письма из API (они уже без дубликатов)
            for (const email of uniqueEmails) {
                updatedEmails.push(email);
            }
            
            // Добавить существующие письма, которых нет в API, но они еще не старые
            for (const email of this.emails) {
                if (!emailIds.has(email.id)) {
                    // Проверить, не старое ли это письмо
                    const createdAt = this.emailTimestamps.get(email.id) || new Date(email.createdAt).getTime();
                    const age = Date.now() - createdAt;
                    if (age < this.settings.emailLifetime) {
                        updatedEmails.push(email);
                    } else {
                        // Удалить старое письмо из локального хранилища
                        this.emailTimestamps.delete(email.id);
                        this.clearEmailTimer(email.id);
                    }
                }
            }
            
            this.emails = updatedEmails;
            
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
            this.emailTimestamps.delete(emailId);
            this.clearEmailTimer(emailId);
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
     * Удалить все почтовые ящики текущего устройства
     */
    async deleteAllInboxes() {
        try {
            // Сначала загрузить все ящики с сервера
            const allInboxes = await this.api.getInboxes({ size: 100 });
            
            // Фильтруем только ящики текущего устройства
            const inboxesToDelete = (allInboxes || []).filter(inbox => {
                return (inbox.name && inbox.name.includes(this.deviceId)) ||
                       (inbox.description && inbox.description.includes(this.deviceId));
            });
            
            console.log(`Найдено ящиков устройства ${this.deviceId} для удаления: ${inboxesToDelete.length}`);
            
            // Удалить только ящики текущего устройства
            const deletePromises = inboxesToDelete.map(async (inbox) => {
                try {
                    await this.api.deleteInbox(inbox.id);
                    console.log(`Ящик устройства ${this.deviceId} (${inbox.id}) удален с сервера`);
                    return true;
                } catch (error) {
                    console.warn(`Не удалось удалить ящик ${inbox.id}:`, error);
                    return false;
                }
            });
            
            // Дождаться удаления всех ящиков устройства
            await Promise.all(deletePromises);
            
            // Очистить локальные данные
            this.inboxes = [];
            this.emails = [];
            this.emailTimestamps.clear();
            this.clearAllEmailTimers();
            this.currentInboxId = null;
            
            // Обновить UI
            this.ui.updateInboxesList([]);
            this.ui.updateInboxSelector([]);
            
            console.log(`Все ящики устройства ${this.deviceId} удалены (${inboxesToDelete.length} шт.)`);
        } catch (error) {
            console.error('Ошибка удаления ящиков устройства:', error);
            // Все равно очистить локальные данные
            this.inboxes = [];
            this.emails = [];
            this.emailTimestamps.clear();
            this.clearAllEmailTimers();
            this.currentInboxId = null;
            // Обновить UI
            this.ui.updateInboxesList([]);
            this.ui.updateInboxSelector([]);
        }
    }

    /**
     * Удалить старые ящики (старше 10 минут) только для текущего устройства
     */
    async cleanupOldInboxes() {
        try {
            const now = Date.now();
            const inboxesToDelete = [];
            
            // Проверяем только ящики текущего устройства
            for (const inbox of this.inboxes) {
                // Проверяем, что это ящик текущего устройства
                const isDeviceInbox = (inbox.name && inbox.name.includes(this.deviceId)) ||
                                     (inbox.description && inbox.description.includes(this.deviceId));
                
                if (!isDeviceInbox) {
                    continue; // Пропускаем ящики других устройств
                }
                
                const createdAt = new Date(inbox.createdAt).getTime();
                const age = now - createdAt;
                
                if (age > this.settings.inboxLifetime) {
                    inboxesToDelete.push(inbox);
                }
            }
            
            for (const inbox of inboxesToDelete) {
                try {
                    await this.api.deleteInbox(inbox.id);
                    this.inboxes = this.inboxes.filter(i => i.id !== inbox.id);
                    
                    // Очистить письма если это текущий ящик
                    if (this.currentInboxId === inbox.id) {
                        this.emails = [];
                        this.emailTimestamps.clear();
                        this.clearAllEmailTimers();
                        this.currentInboxId = null;
                    }
                    
                    console.log(`Старый ящик устройства ${this.deviceId} удален (возраст: ${Math.round(age / 1000 / 60)} минут)`);
                } catch (error) {
                    console.warn(`Не удалось удалить старый ящик ${inbox.id}:`, error);
                }
            }
            
            if (inboxesToDelete.length > 0) {
                this.ui.updateInboxesList(this.inboxes);
                this.ui.updateInboxSelector(this.inboxes);
            }
        } catch (error) {
            console.error('Ошибка очистки старых ящиков:', error);
        }
    }

    /**
     * Удалить старые письма (старше 10 минут)
     */
    async cleanupOldEmails() {
        try {
            const now = Date.now();
            const emailsToDelete = [];
            
            for (const email of this.emails) {
                const createdAt = this.emailTimestamps.get(email.id) || new Date(email.createdAt).getTime();
                const age = now - createdAt;
                
                if (age > this.settings.emailLifetime) {
                    emailsToDelete.push(email);
                }
            }
            
            for (const email of emailsToDelete) {
                try {
                    await this.api.deleteEmail(email.id);
                    this.emails = this.emails.filter(e => e.id !== email.id);
                    this.emailTimestamps.delete(email.id);
                    this.clearEmailTimer(email.id);
                    console.log(`Старое письмо ${email.id} удалено (возраст: ${Math.round(age / 1000 / 60)} минут)`);
                } catch (error) {
                    console.warn(`Не удалось удалить старое письмо ${email.id}:`, error);
                    // Удалить из локального списка даже если API запрос не удался
                    this.emails = this.emails.filter(e => e.id !== email.id);
                    this.emailTimestamps.delete(email.id);
                    this.clearEmailTimer(email.id);
                }
            }
            
            if (emailsToDelete.length > 0) {
                this.ui.updateEmailsList(this.emails);
            }
        } catch (error) {
            console.error('Ошибка очистки старых писем:', error);
        }
    }

    /**
     * Запланировать автоудаление письма через 10 минут
     * @param {string} emailId - ID письма
     * @param {number} createdAt - Время создания письма в миллисекундах
     */
    scheduleEmailDeletion(emailId, createdAt) {
        // Очистить существующий таймер если есть
        this.clearEmailTimer(emailId);
        
        const now = Date.now();
        const age = now - createdAt;
        const remainingTime = Math.max(0, this.settings.emailLifetime - age);
        
        const timerId = setTimeout(async () => {
            try {
                await this.api.deleteEmail(emailId);
                this.emails = this.emails.filter(e => e.id !== emailId);
                this.emailTimestamps.delete(emailId);
                this.emailDeletionTimers.delete(emailId);
                this.ui.updateEmailsList(this.emails);
                console.log(`Письмо ${emailId} автоматически удалено через 10 минут`);
            } catch (error) {
                console.error(`Ошибка автоудаления письма ${emailId}:`, error);
                // Удалить из локального списка даже если API запрос не удался
                this.emails = this.emails.filter(e => e.id !== emailId);
                this.emailTimestamps.delete(emailId);
                this.emailDeletionTimers.delete(emailId);
                this.ui.updateEmailsList(this.emails);
            }
        }, remainingTime);
        
        this.emailDeletionTimers.set(emailId, timerId);
    }

    /**
     * Очистить таймер удаления письма
     * @param {string} emailId - ID письма
     */
    clearEmailTimer(emailId) {
        const timerId = this.emailDeletionTimers.get(emailId);
        if (timerId) {
            clearTimeout(timerId);
            this.emailDeletionTimers.delete(emailId);
        }
    }

    /**
     * Очистить все таймеры удаления писем
     */
    clearAllEmailTimers() {
        for (const timerId of this.emailDeletionTimers.values()) {
            clearTimeout(timerId);
        }
        this.emailDeletionTimers.clear();
    }

    /**
     * Запланировать автоудаление ящика
     * @param {string} inboxId - ID ящика
     */
    scheduleInboxDeletion(inboxId) {
        setTimeout(async () => {
            try {
                // Попытаться удалить все письма ящика перед удалением самого ящика
                // Примечание: При удалении ящика через MailSlurp API все письма удаляются автоматически,
                // но мы все равно пытаемся удалить их вручную для гарантии
                try {
                    const emails = await this.api.getEmails(inboxId, { size: 100 });
                    if (emails && emails.length > 0) {
                        for (const email of emails) {
                            try {
                                await this.api.deleteEmail(email.id);
                                // Очистить таймеры и метаданные письма
                                this.emailTimestamps.delete(email.id);
                                this.clearEmailTimer(email.id);
                            } catch (emailError) {
                                // Игнорируем ошибки удаления отдельных писем
                                // они удалятся автоматически при удалении ящика
                                // Но все равно очищаем локальные данные
                                this.emailTimestamps.delete(email.id);
                                this.clearEmailTimer(email.id);
                            }
                        }
                    }
                } catch (emailsError) {
                    // Игнорируем ошибки при получении списка писем
                    // ящик все равно будет удален
                }
                
                await this.api.deleteInbox(inboxId);
                this.inboxes = this.inboxes.filter(inbox => inbox.id !== inboxId);
                this.ui.updateInboxesList(this.inboxes);
                this.ui.updateInboxSelector(this.inboxes);
                
                // Очистить письма если это текущий ящик
                if (this.currentInboxId === inboxId) {
                    // Очистить все таймеры писем этого ящика
                    for (const email of this.emails) {
                        this.emailTimestamps.delete(email.id);
                        this.clearEmailTimer(email.id);
                    }
                    this.emails = [];
                    this.ui.updateEmailsList(this.emails);
                    this.currentInboxId = null;
                }
                
                console.log(`Ящик ${inboxId} и его письма автоматически удалены`);
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
                        // Проверяем, нет ли уже этого письма в списке
                        const emailExists = this.emails.some(email => email.id === newEmail.id);
                        if (!emailExists) {
                            this.emails.unshift(newEmail);
                            
                            // Запланировать автоудаление письма через 10 минут
                            const createdAt = new Date(newEmail.createdAt).getTime();
                            this.emailTimestamps.set(newEmail.id, createdAt);
                            this.scheduleEmailDeletion(newEmail.id, createdAt);
                            
                            this.ui.updateEmailsList(this.emails);
                            this.ui.showToast('Получено новое письмо!', 'info');
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
        
        // Проверка и удаление старых писем каждую минуту
        setInterval(() => {
            this.cleanupOldEmails();
        }, 60 * 1000);
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
