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
        
        // Отслеживание загруженных писем для предотвращения дубликатов
        this.loadedEmailIds = new Set(); // Set всех загруженных ID писем
        
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
            
            // Загрузить данные из localStorage перед загрузкой с сервера
            const savedInboxes = this.loadInboxesFromLocalStorage();
            if (savedInboxes && savedInboxes.inboxes && savedInboxes.inboxes.length > 0) {
                console.log('Восстановление ящиков из localStorage...');
                this.inboxes = savedInboxes.inboxes;
                this.currentInboxId = savedInboxes.currentInboxId;
                this.ui.updateInboxesList(this.inboxes);
                this.ui.updateInboxSelector(this.inboxes);

                // Восстановить письма
                const savedEmails = this.loadEmailsFromLocalStorage();
                if (savedEmails && savedEmails.length > 0) {
                    console.log('Восстановление писем из localStorage...');
                    this.emails = savedEmails;
                    this.ui.updateEmailsList(this.emails);

                    // Восстановить таймеры автоудаления для писем
                    const now = Date.now();
                    for (const email of this.emails) {
                        const timestamp = this.emailTimestamps.get(email.id);
                        if (timestamp) {
                            this.scheduleEmailDeletion(email.id, timestamp);
                        }
                    }
                }

                // Восстановить таймеры автоудаления для ящиков
                for (const inbox of this.inboxes) {
                    if (this.settings.autoDeleteInboxes) {
                        const createdAt = new Date(inbox.createdAt).getTime();
                        const now = Date.now();
                        const age = now - createdAt;
                        const remainingTime = Math.max(0, this.settings.inboxLifetime - age);
                        
                        if (remainingTime > 0) {
                            setTimeout(async () => {
                                await this.deleteInboxAndCleanup(inbox.id);
                            }, remainingTime);
                        } else {
                            // Ящик уже истек, удалить его
                            await this.deleteInboxAndCleanup(inbox.id);
                        }
                    }
                }
            }
            
            // Проверить подключение к API (не критично для инициализации)
            try {
                await this.checkApiConnection();
            } catch (apiError) {
                console.warn('⚠️ API недоступен, но приложение продолжает работу:', apiError);
                this.ui.updateConnectionStatus(false);
            }
            
            // Загрузить данные с сервера (если API доступен) для синхронизации
            try {
                await this.loadInboxes();
            } catch (loadError) {
                console.warn('⚠️ Не удалось загрузить ящики с сервера:', loadError);
            }
            
            // Настроить автоматические задачи
            this.setupAutoTasks();
            
            // Обновить UI
            this.i18n.updatePageLanguage();
            
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
     * Сохранить ящики в localStorage
     */
    saveInboxesToLocalStorage() {
        try {
            const data = {
                inboxes: this.inboxes,
                currentInboxId: this.currentInboxId,
                savedAt: Date.now()
            };
            localStorage.setItem('neuroMail_inboxes', JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка сохранения ящиков в localStorage:', error);
        }
    }

    /**
     * Загрузить ящики из localStorage
     */
    loadInboxesFromLocalStorage() {
        try {
            const saved = localStorage.getItem('neuroMail_inboxes');
            if (!saved) return null;

            const data = JSON.parse(saved);
            const now = Date.now();
            const savedAt = data.savedAt || now;

            // Проверить, не истекли ли ящики (10 минут)
            const age = now - savedAt;
            if (age > this.settings.inboxLifetime) {
                console.log('Сохраненные ящики истекли, удаляем из localStorage');
                localStorage.removeItem('neuroMail_inboxes');
                localStorage.removeItem('neuroMail_emails');
                return null;
            }

            return data;
        } catch (error) {
            console.error('Ошибка загрузки ящиков из localStorage:', error);
            return null;
        }
    }

    /**
     * Сохранить письма в localStorage
     */
    saveEmailsToLocalStorage() {
        try {
            const data = {
                emails: this.emails,
                emailTimestamps: Array.from(this.emailTimestamps.entries()),
                savedAt: Date.now()
            };
            localStorage.setItem('neuroMail_emails', JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка сохранения писем в localStorage:', error);
        }
    }

    /**
     * Загрузить письма из localStorage
     */
    loadEmailsFromLocalStorage() {
        try {
            const saved = localStorage.getItem('neuroMail_emails');
            if (!saved) return null;

            const data = JSON.parse(saved);
            const now = Date.now();
            const savedAt = data.savedAt || now;

            // Проверить, не истекли ли письма (10 минут)
            const age = now - savedAt;
            if (age > this.settings.emailLifetime) {
                console.log('Сохраненные письма истекли, удаляем из localStorage');
                localStorage.removeItem('neuroMail_emails');
                return null;
            }

            // Восстановить emailTimestamps
            if (data.emailTimestamps && Array.isArray(data.emailTimestamps)) {
                this.emailTimestamps = new Map(data.emailTimestamps);
            }

            // Фильтровать истекшие письма
            const validEmails = [];
            const validTimestamps = new Map();

            for (const email of (data.emails || [])) {
                const emailTimestamp = this.emailTimestamps.get(email.id);
                if (emailTimestamp) {
                    const emailAge = now - emailTimestamp;
                    if (emailAge < this.settings.emailLifetime) {
                        validEmails.push(email);
                        validTimestamps.set(email.id, emailTimestamp);
                    }
                }
            }

            this.emailTimestamps = validTimestamps;
            return validEmails;
        } catch (error) {
            console.error('Ошибка загрузки писем из localStorage:', error);
            return null;
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
            // Показать индикатор загрузки
            this.ui.showToast('Создание почтового ящика...', 'info');
            
            // Удалить все существующие ящики текущего устройства перед созданием нового
            if (this.inboxes.length > 0) {
                for (const inbox of this.inboxes) {
                    try {
                        // Удалить все письма этого ящика
                        const emailsToRemove = this.emails.filter(email => email.inboxId === inbox.id);
                        for (const email of emailsToRemove) {
                            this.emailTimestamps.delete(email.id);
                            this.loadedEmailIds.delete(email.id);
                            this.clearEmailTimer(email.id);
                        }
                        this.emails = this.emails.filter(email => email.inboxId !== inbox.id);
                        
                        // Удалить ящик на сервере
                        await this.api.deleteInbox(inbox.id);
                } catch (error) {
                        console.warn(`Не удалось удалить старый ящик ${inbox.id}:`, error);
                    }
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
            this.loadedEmailIds.clear();
            this.clearAllEmailTimers();
            this.ui.updateEmailsList(this.emails);
            this.currentInboxId = null;
            
            // Сохранить в localStorage
            this.saveInboxesToLocalStorage();
            this.saveEmailsToLocalStorage();
            
            this.ui.showToast(this.i18n.t('inbox_created_success'), 'success');
            
            // Настроить автоудаление если включено
            if (this.settings.autoDeleteInboxes) {
                this.scheduleInboxDeletion(inbox.id);
            }
            
            return inbox;
        } catch (error) {
            console.error('Ошибка создания ящика:', error);
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
            
            // Сохранить локально созданные ящики перед загрузкой с сервера
            const localInboxes = [...this.inboxes];
            
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
            
            // Если ящик не найден на сервере, но есть локально созданный ящик,
            // проверим, не является ли локальный ящик валидным
            if (!deviceInbox && localInboxes.length > 0) {
                // Проверим, есть ли локальный ящик, который соответствует deviceId
                const localDeviceInbox = localInboxes.find(inbox => 
                    (inbox.name && inbox.name.includes(this.deviceId)) ||
                    (inbox.description && inbox.description.includes(this.deviceId))
                );
                
                if (localDeviceInbox) {
                    // Используем локальный ящик, если он недавно создан (менее 1 минуты назад)
                    // Это позволяет сохранить ящик, который только что был создан, но еще не синхронизирован с сервером
                    const createdAt = new Date(localDeviceInbox.createdAt || Date.now()).getTime();
                    const age = Date.now() - createdAt;
                    
                    // Если ящик создан менее минуты назад, считаем его валидным
                    if (age < 60000) {
                        console.log(`Используем локальный ящик для устройства ${this.deviceId}`);
                        deviceInbox = localDeviceInbox;
                    }
                }
            }
            
            // Если ящик для этого устройства не найден, используем данные из localStorage
            if (!deviceInbox) {
                console.log(`Ящик для устройства ${this.deviceId} не найден на сервере`);
                
                // Попробуем загрузить из localStorage, если еще не загружены
                if (this.inboxes.length === 0) {
                    const savedInboxes = this.loadInboxesFromLocalStorage();
                    if (savedInboxes && savedInboxes.inboxes && savedInboxes.inboxes.length > 0) {
                        // Проверить, не истекли ли ящики
                        const now = Date.now();
                        const validInboxes = savedInboxes.inboxes.filter(inbox => {
                            const createdAt = new Date(inbox.createdAt).getTime();
                            const age = now - createdAt;
                            return age < this.settings.inboxLifetime;
                        });
                        
                        if (validInboxes.length > 0) {
                            this.inboxes = validInboxes;
                            this.currentInboxId = savedInboxes.currentInboxId;
                        } else {
                            // Все ящики истекли, очистить localStorage
                            localStorage.removeItem('neuroMail_inboxes');
                            localStorage.removeItem('neuroMail_emails');
                            this.inboxes = [];
                        }
                    } else {
                        this.inboxes = [];
                    }
                } else {
                    // Использовать уже загруженные из localStorage
                    this.inboxes = localInboxes.length > 0 ? localInboxes : this.inboxes;
                }
                
                this.ui.updateInboxesList(this.inboxes);
                this.ui.updateInboxSelector(this.inboxes);
                this.ui.hideLoading('inboxes-section');
                return this.inboxes;
            } else {
                // Проверить, не истек ли срок действия ящика
                // Используем expiresAt если есть, иначе createdAt + inboxLifetime
                let expiresAt;
                if (deviceInbox.expiresAt) {
                    expiresAt = new Date(deviceInbox.expiresAt).getTime();
                } else {
                    const createdAt = new Date(deviceInbox.createdAt).getTime();
                    expiresAt = createdAt + this.settings.inboxLifetime;
                }
                
                const now = Date.now();
                
                if (now > expiresAt) {
                    // Ящик истек, удаляем его и показываем пустой список
                    // Новый ящик будет создан только по кнопке "Создать новый"
                    console.log(`Ящик устройства ${this.deviceId} истек, удаляем`);
                    try {
                        await this.api.deleteInbox(deviceInbox.id);
                    } catch (error) {
                        console.warn(`Не удалось удалить истекший ящик:`, error);
                    }
                    
                    this.inboxes = [];
                    
                    // Очистить localStorage
                    localStorage.removeItem('neuroMail_inboxes');
                    localStorage.removeItem('neuroMail_emails');
                    
                    this.ui.updateInboxesList(this.inboxes);
                    this.ui.updateInboxSelector(this.inboxes);
                    this.ui.hideLoading('inboxes-section');
                    return [];
                }
            }
            
            // Установить только ящик этого устройства
            this.inboxes = [deviceInbox];
            
            // Сохранить в localStorage
            this.saveInboxesToLocalStorage();
            
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            this.ui.hideLoading('inboxes-section');
            
            return this.inboxes;
        } catch (error) {
            console.error('Ошибка загрузки ящиков:', error);
            // При ошибке сохраняем локальные ящики если они есть
            if (this.inboxes.length > 0) {
                this.ui.updateInboxesList(this.inboxes);
                this.ui.updateInboxSelector(this.inboxes);
            }
            this.ui.hideLoading('inboxes-section');
            this.ui.showToast('Ошибка загрузки ящиков', 'error');
            return this.inboxes || [];
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
            
            // Удалить ящик на сервере
            await this.api.deleteInbox(inboxId);
            
            // Удалить все письма этого ящика из локального хранилища
            const emailsToRemove = this.emails.filter(email => email.inboxId === inboxId);
            for (const email of emailsToRemove) {
                // Очистить таймеры и метаданные писем
                this.emailTimestamps.delete(email.id);
                this.clearEmailTimer(email.id);
                this.loadedEmailIds.delete(email.id);
            }
            
            // Удалить письма этого ящика из массива
            this.emails = this.emails.filter(email => email.inboxId !== inboxId);
            
            // Удалить ящик из списка
            this.inboxes = this.inboxes.filter(inbox => inbox.id !== inboxId);
            
            // Сохранить изменения в localStorage
            this.saveInboxesToLocalStorage();
            this.saveEmailsToLocalStorage();
            
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            // Если это был текущий ящик, очистить текущий выбор
            if (this.currentInboxId === inboxId) {
                this.currentInboxId = null;
                this.ui.updateEmailsList([]);
            } else {
                // Обновить список писем, если он отображается
                this.ui.updateEmailsList(this.emails);
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
            
            // Убрать дубликаты по ID писем - используем Set для надежной проверки
            const uniqueEmails = [];
            const emailIds = new Set();
            
            if (emails && emails.length > 0) {
                for (const email of emails) {
                    // Убедиться, что у письма есть inboxId
                    if (!email.inboxId) {
                        email.inboxId = inboxId;
                    }
                    
                    // Проверяем дубликаты по ID
                    if (!emailIds.has(email.id) && !this.loadedEmailIds.has(email.id)) {
                        emailIds.add(email.id);
                        this.loadedEmailIds.add(email.id);
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
            
            // Сохранить письма в localStorage
            this.saveEmailsToLocalStorage();
            
            // Обновить список писем для текущего ящика
            // Сначала удалить все письма этого ящика, которые больше не существуют в API
            const currentInboxEmailIds = new Set(uniqueEmails.map(e => e.id));
            this.emails = this.emails.filter(email => {
                // Оставить письма других ящиков
                if (email.inboxId !== inboxId) {
                    return true;
                }
                // Для текущего ящика оставить только те, что есть в API
                return currentInboxEmailIds.has(email.id);
            });
            
            // Добавить новые письма из API
            for (const email of uniqueEmails) {
                // Проверить, нет ли уже такого письма в массиве
                const existingIndex = this.emails.findIndex(e => e.id === email.id);
                if (existingIndex === -1) {
                    this.emails.push(email);
                    } else {
                    // Обновить существующее письмо
                    this.emails[existingIndex] = email;
                    }
                }
            
            // Отсортировать письма по дате создания (новые первыми)
            this.emails.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.receivedAt || 0).getTime();
                const dateB = new Date(b.createdAt || b.receivedAt || 0).getTime();
                return dateB - dateA;
            });
            
            // Сохранить письма в localStorage после всех изменений
            this.saveEmailsToLocalStorage();
            
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
            
            // Обновить localStorage
            this.saveEmailsToLocalStorage();
            
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
            this.loadedEmailIds.clear();
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
            this.loadedEmailIds.clear();
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
                    
                    // Удалить все письма этого ящика
                    const emailsToRemove = this.emails.filter(email => email.inboxId === inbox.id);
                    for (const email of emailsToRemove) {
                        this.emailTimestamps.delete(email.id);
                        this.loadedEmailIds.delete(email.id);
                        this.clearEmailTimer(email.id);
                    }
                    this.emails = this.emails.filter(email => email.inboxId !== inbox.id);
                    
                    // Очистить текущий выбор если это был текущий ящик
                    if (this.currentInboxId === inbox.id) {
                        this.currentInboxId = null;
                        this.ui.updateEmailsList(this.emails);
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
                    this.loadedEmailIds.delete(email.id);
                    this.clearEmailTimer(email.id);
                    console.log(`Старое письмо ${email.id} удалено (возраст: ${Math.round(age / 1000 / 60)} минут)`);
                } catch (error) {
                    console.warn(`Не удалось удалить старое письмо ${email.id}:`, error);
                    // Удалить из локального списка даже если API запрос не удался
                    this.emails = this.emails.filter(e => e.id !== email.id);
                    this.emailTimestamps.delete(email.id);
                    this.loadedEmailIds.delete(email.id);
                    this.clearEmailTimer(email.id);
                }
            }
            
            if (emailsToDelete.length > 0) {
                // Обновить localStorage после удаления старых писем
                this.saveEmailsToLocalStorage();
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
                
                // Обновить localStorage
                this.saveEmailsToLocalStorage();
                
                this.ui.updateEmailsList(this.emails);
                console.log(`Письмо ${emailId} автоматически удалено через 10 минут`);
            } catch (error) {
                console.error(`Ошибка автоудаления письма ${emailId}:`, error);
                // Удалить из локального списка даже если API запрос не удался
                this.emails = this.emails.filter(e => e.id !== emailId);
                this.emailTimestamps.delete(emailId);
                this.emailDeletionTimers.delete(emailId);
                
                // Обновить localStorage
                this.saveEmailsToLocalStorage();
                
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
     * Удалить ящик и очистить связанные данные (вспомогательный метод)
     * @param {string} inboxId - ID ящика
     */
    async deleteInboxAndCleanup(inboxId) {
        try {
            // Удалить все письма этого ящика из локального хранилища
            const emailsToRemove = this.emails.filter(email => email.inboxId === inboxId);
            for (const email of emailsToRemove) {
                // Очистить таймеры и метаданные писем
                this.emailTimestamps.delete(email.id);
                this.loadedEmailIds.delete(email.id);
                this.clearEmailTimer(email.id);
            }
            
            // Удалить письма этого ящика из массива
            this.emails = this.emails.filter(email => email.inboxId !== inboxId);
            
            // Удалить ящик на сервере (письма удалятся автоматически)
            try {
                await this.api.deleteInbox(inboxId);
            } catch (error) {
                console.warn(`Не удалось удалить ящик ${inboxId} на сервере:`, error);
            }
            
            this.inboxes = this.inboxes.filter(inbox => inbox.id !== inboxId);
            
            // Очистить localStorage если ящиков больше нет
            if (this.inboxes.length === 0) {
                localStorage.removeItem('neuroMail_inboxes');
                localStorage.removeItem('neuroMail_emails');
            } else {
                // Обновить localStorage
                this.saveInboxesToLocalStorage();
                this.saveEmailsToLocalStorage();
            }
            
            this.ui.updateInboxesList(this.inboxes);
            this.ui.updateInboxSelector(this.inboxes);
            
            // Если это был текущий ящик, очистить текущий выбор
            if (this.currentInboxId === inboxId) {
                this.currentInboxId = null;
                this.ui.updateEmailsList([]);
            } else {
                // Обновить список писем, если он отображается
                this.ui.updateEmailsList(this.emails);
            }
            
            console.log(`Ящик ${inboxId} и его письма автоматически удалены`);
        } catch (error) {
            console.error('Ошибка удаления ящика:', error);
        }
    }

    /**
     * Запланировать автоудаление ящика
     * @param {string} inboxId - ID ящика
     */
    scheduleInboxDeletion(inboxId) {
        setTimeout(async () => {
            await this.deleteInboxAndCleanup(inboxId);
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
                            
                            // Сохранить в localStorage
                            this.saveEmailsToLocalStorage();
                            
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
     * Скачать вложение через emailId (используется когда attachmentId недоступен)
     * @param {HTMLElement} button - Кнопка с data-атрибутами emailId и filename
     */
    async downloadAttachmentByEmailId(button) {
        const emailId = button.getAttribute('data-email-id');
        const filename = button.getAttribute('data-filename');
        if (!emailId || !filename) {
            this.ui.showToast('Недостаточно данных для скачивания вложения', 'error');
            return;
        }
        await this.downloadAttachment(null, filename, emailId);
    }

    /**
     * Скачать вложение
     * @param {string} attachmentId - ID вложения (может быть null, если используется emailId)
     * @param {string} filename - Имя файла (опционально, если известно заранее)
     * @param {string} emailId - ID письма (опционально, используется если attachmentId недоступен)
     */
    async downloadAttachment(attachmentId, filename = null, emailId = null) {
        try {
            let attachment;
            
            // Если attachmentId недоступен, но есть emailId и filename, используем альтернативный метод
            if ((!attachmentId || attachmentId === 'undefined' || attachmentId === 'null') && emailId && filename) {
                console.log(`Попытка скачать вложение через emailId: ${emailId}, filename: ${filename}`);
                attachment = await this.api.getAttachmentByEmailIdAndFilename(emailId, filename);
            } else if (!attachmentId || attachmentId === 'undefined' || attachmentId === 'null') {
                throw new Error('ID вложения не указан. Необходимо указать emailId и filename для скачивания.');
            } else {
                // Получаем вложение как Blob для гарантированного скачивания
                attachment = await this.api.getAttachment(attachmentId, filename);
            }
            
            if (!attachment || !attachment.blob) {
                throw new Error('Не удалось получить данные вложения');
            }

            // Используем более надежный способ скачивания через Blob
            const blob = attachment.blob;
            const downloadFilename = attachment.filename || filename || `attachment-${attachmentId || 'unknown'}`;
            
            // Создаем ссылку для скачивания
            const link = document.createElement('a');
            link.href = attachment.downloadUrl;
            link.download = downloadFilename;
            
            // Добавляем атрибуты для принудительного скачивания
            link.style.display = 'none';
            link.setAttribute('download', downloadFilename);
            
            // Добавляем в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            
            // Очищаем URL после небольшой задержки
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(attachment.downloadUrl);
            }, 100);
            
            // Показываем информацию о размере файла
            const fileSize = attachment.size ? this.formatFileSize(attachment.size) : '';
            const message = fileSize 
                ? `Вложение скачивается... (${fileSize})` 
                : 'Вложение скачивается...';
            
            this.ui.showToast(message, 'info');
        } catch (error) {
            console.error('Ошибка скачивания вложения:', error);
            const errorMessage = error.message || 'Ошибка скачивания вложения';
            this.ui.showToast(errorMessage, 'error');
        }
    }

    /**
     * Форматировать размер файла
     * @param {number} bytes - Размер в байтах
     * @returns {string} Отформатированный размер
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
