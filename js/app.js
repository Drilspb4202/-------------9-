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
        
        // Защита от множественных одновременных запросов
        this.loadingEmailsForInbox = new Set(); // Set inboxId, для которых идет загрузка
        this.loadEmailsDebounceTimer = null;
        
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
            if (!inboxId) {
                return [];
            }
            
            // Защита от множественных одновременных запросов для одного ящика
            if (this.loadingEmailsForInbox.has(inboxId)) {
                console.log(`Загрузка писем для ящика ${inboxId} уже выполняется, пропускаем`);
                return this.emails.filter(e => e.inboxId === inboxId);
            }
            
            this.loadingEmailsForInbox.add(inboxId);
            
            // Переключиться на вкладку с письмами
            this.ui.showSection('emails-section');
            
            this.currentInboxId = inboxId;
            
            // Обновить селектор ящиков на вкладке писем
            const inboxSelector = document.getElementById('inbox-selector');
            if (inboxSelector) {
                inboxSelector.value = inboxId;
            }
            
            this.ui.showLoading('emails-section');
            
            try {
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
                this.loadingEmailsForInbox.delete(inboxId);
                
                return this.emails;
            } catch (error) {
                this.loadingEmailsForInbox.delete(inboxId);
                throw error;
            }
        } catch (error) {
            console.error('Ошибка загрузки писем:', error);
            this.ui.hideLoading('emails-section');
            this.loadingEmailsForInbox.delete(inboxId);
            this.ui.showToast(this.i18n.t('error_loading_emails'), 'error');
            return [];
        }
    }

    /**
     * Загрузить все письма (с debounce для предотвращения множественных вызовов)
     */
    async loadEmails() {
        if (this.currentInboxId) {
            // Очистить предыдущий таймер
            if (this.loadEmailsDebounceTimer) {
                clearTimeout(this.loadEmailsDebounceTimer);
            }
            
            // Установить новый таймер с задержкой 300ms
            return new Promise((resolve) => {
                this.loadEmailsDebounceTimer = setTimeout(async () => {
                    const result = await this.loadEmailsForInbox(this.currentInboxId);
                    resolve(result);
                }, 300);
            });
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
            
            // Если вложений нет в ответе, загружаем их отдельно
            if (!email.attachments || email.attachments.length === 0) {
                try {
                    const attachments = await this.api.getEmailAttachments(emailId);
                    if (attachments && attachments.length > 0) {
                        email.attachments = attachments;
                    }
                } catch (attachmentsError) {
                    console.warn('Не удалось загрузить вложения отдельно:', attachmentsError);
                    // Продолжаем без вложений
                }
            }
            
            this.ui.showEmailViewer(email);
        } catch (error) {
            console.error('Ошибка загрузки письма:', error);
            this.ui.showToast('Ошибка загрузки письма', 'error');
        }
    }

    /**
     * Сохранить письмо как красивый HTML файл
     * @param {Object} email - Данные письма
     */
    saveEmailAsHtml(email) {
        try {
            const htmlContent = this.generateEmailHtml(email);
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            
            // Создаем имя файла из темы письма и даты
            const subject = email.subject || 'Письмо';
            const date = new Date(email.createdAt);
            const dateStr = date.toISOString().split('T')[0];
            const filename = `${this.sanitizeFilename(subject)}_${dateStr}.html`;
            
            // Скачиваем файл
            this.downloadBlob(blob, filename);
            
            this.ui.showToast('Письмо сохранено как HTML', 'success');
        } catch (error) {
            console.error('Ошибка при сохранении письма как HTML:', error);
            this.ui.showToast('Ошибка при сохранении письма', 'error');
        }
    }

    /**
     * Генерировать красивый HTML для письма
     * @param {Object} email - Данные письма
     * @returns {string} HTML контент
     */
    generateEmailHtml(email) {
        const from = email.from || 'Неизвестно';
        const to = email.to || 'Неизвестно';
        const subject = email.subject || '(Без темы)';
        const date = new Date(email.createdAt);
        const formattedDate = this.i18n.formatDate(date);
        const body = email.body || '';
        const isHTML = email.isHTML || false;
        const attachments = email.attachments || [];

        // Очищаем HTML контент для безопасного отображения
        const safeBody = isHTML ? this.sanitizeHtmlForFile(body) : this.escapeHtml(body);

        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(subject)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
        }
        
        .email-header h1 {
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .email-meta {
            display: grid;
            gap: 12px;
            font-size: 14px;
        }
        
        .email-meta-item {
            display: flex;
            align-items: flex-start;
        }
        
        .email-meta-item strong {
            min-width: 80px;
            opacity: 0.9;
            font-weight: 500;
        }
        
        .email-meta-item span {
            flex: 1;
        }
        
        .email-content {
            padding: 30px;
            background: #ffffff;
        }
        
        .email-body {
            font-size: 16px;
            line-height: 1.8;
            color: #333;
        }
        
        .email-body pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        
        .email-body img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 10px 0;
        }
        
        .email-body a {
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px solid #667eea;
        }
        
        .email-body a:hover {
            color: #764ba2;
            border-bottom-color: #764ba2;
        }
        
        .email-attachments {
            padding: 20px 30px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        
        .email-attachments h3 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #333;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .attachments-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .attachment-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #ffffff;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }
        
        .attachment-item i {
            color: #667eea;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            
            .email-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${this.escapeHtml(subject)}</h1>
            <div class="email-meta">
                <div class="email-meta-item">
                    <strong>От:</strong>
                    <span>${this.escapeHtml(from)}</span>
                </div>
                <div class="email-meta-item">
                    <strong>Кому:</strong>
                    <span>${this.escapeHtml(to)}</span>
                </div>
                <div class="email-meta-item">
                    <strong>Дата:</strong>
                    <span>${this.escapeHtml(formattedDate)}</span>
                </div>
            </div>
        </div>
        
        <div class="email-content">
            <div class="email-body">
                ${isHTML ? safeBody : `<pre>${safeBody}</pre>`}
            </div>
        </div>
        
        ${attachments.length > 0 ? `
        <div class="email-attachments">
            <h3>
                📎 Вложения (${attachments.length})
            </h3>
            <div class="attachments-list">
                ${attachments.map(att => `
                    <div class="attachment-item">
                        <span style="font-size: 18px;">📎</span>
                        <span>${this.escapeHtml(att.filename || att.name || 'Вложение')}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Сохранено из NeuroMail - ${new Date().toLocaleString('ru-RU')}</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Санитизировать HTML для безопасного сохранения в файл
     * @param {string} html - HTML контент
     * @returns {string} Безопасный HTML
     */
    sanitizeHtmlForFile(html) {
        // Создаем временный элемент для очистки HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Удаляем потенциально опасные элементы
        const dangerousTags = ['script', 'object', 'embed', 'iframe', 'form', 'input'];
        dangerousTags.forEach(tag => {
            const elements = temp.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });

        // Добавляем target="_blank" к внешним ссылкам
        const links = temp.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });

        return temp.innerHTML;
    }

    /**
     * Очистить имя файла от недопустимых символов
     * @param {string} filename - Имя файла
     * @returns {string} Очищенное имя файла
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    /**
     * Экранировать HTML символы
     * @param {string} text - Текст для экранирования
     * @returns {string} Экранированный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    /**
     * Проверка, является ли устройство iOS
     * @returns {boolean} true если устройство iOS
     */
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    /**
     * Определить MIME-тип на основе расширения файла
     * @param {string} filename - Имя файла
     * @returns {string} MIME-тип
     */
    getMimeTypeFromFilename(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'json': 'application/json',
            'conf': 'text/plain',
            'config': 'text/plain',
            'txt': 'text/plain',
            'xml': 'application/xml',
            'yaml': 'text/yaml',
            'yml': 'text/yaml',
            'ini': 'text/plain',
            'properties': 'text/plain',
            'env': 'text/plain',
            'log': 'text/plain',
            'pdf': 'application/pdf',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv': 'text/csv',
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Универсальный метод скачивания файла, работающий на всех платформах включая iOS
     * @param {Blob} blob - Blob объект файла
     * @param {string} filename - Имя файла
     */
    downloadBlob(blob, filename) {
        const isIOSDevice = this.isIOS();
        
        // Убеждаемся, что WireGuard конфиги имеют правильное расширение .conf
        let finalFilename = filename;
        if (/wireguard|wg|vpn/i.test(filename) && !filename.toLowerCase().endsWith('.conf')) {
            finalFilename = filename.replace(/\.[^.]*$/, '') + '.conf';
        }
        
        // Определяем правильный MIME-тип, если он не указан или неправильный
        let mimeType = blob.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
            mimeType = this.getMimeTypeFromFilename(finalFilename);
        }
        
        // Для WireGuard конфигов используем text/plain для лучшей совместимости с iOS
        const isWireGuardConfig = /\.conf$/i.test(finalFilename) || /wireguard|wg/i.test(finalFilename);
        if (isWireGuardConfig) {
            mimeType = 'text/plain';
        }
        
        // Создаем новый Blob с правильным MIME-типом
        const typedBlob = blob.type !== mimeType ? new Blob([blob], { type: mimeType }) : blob;
        
        if (isIOSDevice) {
            // Для iOS используем FileReader для создания data URL
            // Это позволяет открыть файл в новой вкладке, откуда пользователь может сохранить его
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                
                // Для WireGuard конфигов используем специальный метод
                if (isWireGuardConfig) {
                    this.downloadWireGuardConfigForIOS(typedBlob, finalFilename, dataUrl);
                    return;
                }
                
                // Пытаемся использовать Web Share API для iOS (если доступен)
                if (navigator.share && navigator.canShare) {
                    const file = new File([typedBlob], finalFilename, { type: mimeType });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            files: [file],
                            title: finalFilename
                        }).catch(() => {
                            // Если share не сработал, используем fallback метод
                            this.openBlobForIOS(dataUrl, finalFilename);
                        });
                        return;
                    }
                }
                
                // Fallback: открываем в новой вкладке
                this.openBlobForIOS(dataUrl, finalFilename);
            };
            reader.onerror = () => {
                throw new Error('Ошибка чтения файла');
            };
            reader.readAsDataURL(typedBlob);
        } else {
            // Для других платформ используем стандартный метод
            const url = URL.createObjectURL(typedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = finalFilename;
            link.style.display = 'none';
            link.setAttribute('download', finalFilename);
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }
    }

    /**
     * Скачать WireGuard конфиг для iOS с поддержкой открытия в WireGuard приложении
     * @param {Blob} blob - Blob объект файла
     * @param {string} filename - Имя файла
     * @param {string} dataUrl - Data URL файла
     */
    downloadWireGuardConfigForIOS(blob, filename, dataUrl) {
        // Создаем ссылку для скачивания с правильным атрибутом download
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.setAttribute('download', filename);
        link.style.display = 'none';
        
        // Добавляем ссылку в DOM и кликаем
        document.body.appendChild(link);
        link.click();
        
        // Удаляем ссылку через небольшую задержку
        setTimeout(() => {
            if (link.parentNode) {
                document.body.removeChild(link);
            }
        }, 100);
        
        // Показываем инструкции для пользователя
        const instructions = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: var(--card-bg, #1a1a2e); padding: 20px; border-radius: 12px; 
                        z-index: 10000; max-width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                        border: 2px solid var(--primary-color, #6366f1);">
                <h3 style="margin-top: 0; color: var(--primary-color, #6366f1);">
                    📱 WireGuard конфиг для iOS
                </h3>
                <p style="color: var(--text-color, #e0e0e0); line-height: 1.6;">
                    <strong>Файл: ${filename}</strong>
                </p>
                <ol style="color: var(--text-color, #e0e0e0); line-height: 1.8; padding-left: 20px;">
                    <li>Нажмите на ссылку выше (если появилась)</li>
                    <li>Выберите <strong>"Сохранить в файлы"</strong></li>
                    <li>Откройте приложение <strong>WireGuard</strong></li>
                    <li>Нажмите <strong>"+"</strong> → <strong>"Создать из файла"</strong></li>
                    <li>Выберите сохраненный файл <strong>${filename}</strong></li>
                </ol>
                <p style="color: var(--text-muted, #888); font-size: 0.9em; margin-bottom: 0;">
                    💡 Если файл не виден, проверьте папку "Загрузки" в приложении "Файлы"
                </p>
                <button onclick="this.parentElement.remove()" 
                        style="margin-top: 15px; padding: 10px 20px; background: var(--primary-color, #6366f1); 
                               color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
                    Понятно
                </button>
            </div>
        `;
        
        // Создаем контейнер для инструкций
        const instructionsDiv = document.createElement('div');
        instructionsDiv.innerHTML = instructions;
        document.body.appendChild(instructionsDiv);
        
        // Удаляем инструкции через 30 секунд
        setTimeout(() => {
            if (instructionsDiv.parentNode) {
                document.body.removeChild(instructionsDiv);
            }
        }, 30000);
    }

    /**
     * Открыть blob для iOS (fallback метод)
     * @param {string} dataUrl - Data URL файла
     * @param {string} filename - Имя файла
     */
    openBlobForIOS(dataUrl, filename) {
        // Определяем, является ли файл текстовым (конфиг, JSON и т.д.)
        const isTextFile = /\.(json|conf|config|txt|xml|yaml|yml|ini|properties|env|log|html|css|js)$/i.test(filename);
        const mimeType = this.getMimeTypeFromFilename(filename);
        const isTextMime = mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml';
        
        // Создаем временную ссылку для открытия файла
        const link = document.createElement('a');
        link.href = dataUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = filename;
        link.setAttribute('download', filename);
        
        // Для текстовых файлов пытаемся открыть в новой вкладке
        // Это позволит пользователю увидеть содержимое и сохранить через меню браузера
        if (isTextFile || isTextMime) {
            try {
                const newWindow = window.open(dataUrl, '_blank');
                if (newWindow && !newWindow.closed) {
                    // Файл открылся, показываем подсказку
                    this.ui.showToast('Файл открыт. Используйте меню браузера для сохранения', 'info', 4000);
                    return;
                }
            } catch (e) {
                console.log('Не удалось открыть файл автоматически:', e);
            }
        }
        
        // Если не удалось открыть автоматически, создаем видимую ссылку
        this.ui.showToast('Нажмите на ссылку ниже и выберите "Сохранить в файлы"', 'info', 5000);
        
        link.style.display = 'block';
        link.style.position = 'fixed';
        link.style.top = '50%';
        link.style.left = '50%';
        link.style.transform = 'translate(-50%, -50%)';
        link.style.padding = '15px 25px';
        link.style.backgroundColor = 'var(--primary-color, #6366f1)';
        link.style.color = 'white';
        link.style.borderRadius = '8px';
        link.style.zIndex = '10000';
        link.style.textDecoration = 'none';
        link.style.fontSize = '16px';
        link.style.fontWeight = 'bold';
        link.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        link.style.maxWidth = '90%';
        link.style.wordBreak = 'break-word';
        link.style.textAlign = 'center';
        link.textContent = `📥 Сохранить: ${filename}`;
        
        // Добавляем обработчик для удаления ссылки после клика
        link.addEventListener('click', () => {
            setTimeout(() => {
                if (link.parentNode) {
                    document.body.removeChild(link);
                }
            }, 2000);
        });
        
        document.body.appendChild(link);
        
        // Удаляем ссылку через 15 секунд
        setTimeout(() => {
            if (link.parentNode) {
                document.body.removeChild(link);
            }
        }, 15000);
    }

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

            const blob = attachment.blob;
            let downloadFilename = attachment.filename || filename || `attachment-${attachmentId || 'unknown'}`;
            
            // Проверяем, является ли файл WireGuard конфигом по содержимому (если это текстовый файл)
            if (blob.type === 'text/plain' || blob.type.startsWith('text/') || !blob.type || blob.type === 'application/octet-stream') {
                try {
                    // Читаем первые байты для проверки содержимого
                    const textPreview = await blob.slice(0, 200).text();
                    if (/\[Interface\]|\[Peer\]|PrivateKey|PublicKey|Endpoint/i.test(textPreview)) {
                        // Это WireGuard конфиг - убеждаемся, что у него правильное расширение
                        if (!downloadFilename.toLowerCase().endsWith('.conf')) {
                            downloadFilename = downloadFilename.replace(/\.[^.]*$/, '') + '.conf';
                        }
                    }
                } catch (e) {
                    // Если не удалось прочитать, просто используем текущее имя
                    console.log('Не удалось проверить содержимое файла:', e);
                }
            }
            
            // Используем универсальный метод скачивания
            this.downloadBlob(blob, downloadFilename);
            
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
