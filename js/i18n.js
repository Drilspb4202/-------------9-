/**
 * Менеджер интернационализации
 * Управляет переводами и переключением языков
 */
class I18nManager {
    constructor() {
        this.currentLang = 'ru';
        this.translations = {
            ru: {
                // Общие
                app_name: "NeuroMail",
                loading: "Загрузка...",
                error: "Ошибка",
                success: "Успешно",
                cancel: "Отмена",
                save: "Сохранить",
                delete: "Удалить",
                edit: "Редактировать",
                close: "Закрыть",
                confirm: "Подтвердить",
                yes: "Да",
                no: "Нет",
                ok: "ОК",
                
                // Навигация
                nav_inboxes: "Почтовые ящики",
                nav_emails: "Письма",
                nav_generator: "Генератор",
                nav_settings: "Настройки",
                nav_premium: "Premium",
                
                // Заголовки секций
                inboxes_title: "Почтовые ящики",
                emails_title: "Письма",
                generator_title: "Генератор данных",
                settings_title: "Настройки",
                premium_title: "Premium",
                
                // Кнопки
                create_new_inbox: "Создать новый",
                generate_data: "Сгенерировать",
                send_email: "Отправить письмо",
                refresh: "Обновить",
                copy_data: "Копировать",
                generate_new: "Сгенерировать новые",
                get_premium: "Получить Premium",
                
                // Статусы
                connected: "Подключено",
                disconnected: "Отключено",
                inbox_loading: "Загрузка почтовых ящиков...",
                emails_loading: "Загрузка писем...",
                creating_inbox: "Создание ящика...",
                
                // Ящики
                select_inbox: "Выберите ящик",
                inbox_email: "Email адрес",
                inbox_created: "Создан",
                inbox_expires: "Истекает",
                inbox_actions: "Действия",
                no_inboxes: "Нет почтовых ящиков",
                create_first_inbox: "Создайте первый ящик",
                
                // Письма
                email_from: "От:",
                email_to: "Кому:",
                email_subject: "Тема:",
                email_date: "Дата:",
                email_content: "Содержимое:",
                email_attachments: "Вложения:",
                email_viewer: "Просмотр письма",
                no_emails: "Нет писем",
                no_emails_in_inbox: "В этом ящике нет писем",
                
                // Отправка писем
                send_email_title: "Отправка письма",
                email_html_format: "HTML формат",
                
                // Создание ящика
                create_inbox_title: "Создание почтового ящика",
                create_inbox_description: "Создаем новый временный почтовый ящик...",
                
                // Генератор
                generator_modal_title: "Сгенерированные данные",
                generated_user_data: "Сгенерированные данные пользователя",
                
                // Настройки
                api_settings: "Настройки API",
                app_settings: "Настройки приложения",
                api_mode: "Режим API:",
                api_mode_public: "Публичные ключи",
                api_mode_personal: "Персональный ключ",
                api_mode_combined: "Комбинированный",
                personal_api_key: "Персональный API ключ:",
                auto_delete_inboxes: "Автоудаление ящиков",
                enable_notifications: "Уведомления",
                
                // Premium
                premium_benefits: "Преимущества Premium",
                premium_feature_1: "Неограниченные ящики",
                premium_feature_2: "Приоритетная поддержка",
                premium_feature_3: "Расширенная статистика",
                premium_feature_4: "API без лимитов",
                
                // Уведомления
                inbox_created_success: "Почтовый ящик создан успешно",
                inbox_deleted_success: "Почтовый ящик удален",
                email_sent_success: "Письмо отправлено успешно",
                email_deleted_success: "Письмо удалено",
                data_generated_success: "Данные сгенерированы",
                data_copied_success: "Данные скопированы в буфер обмена",
                settings_saved_success: "Настройки сохранены",
                api_key_updated_success: "API ключ обновлен",
                
                // Ошибки
                error_creating_inbox: "Ошибка создания ящика",
                error_deleting_inbox: "Ошибка удаления ящика",
                error_loading_emails: "Ошибка загрузки писем",
                error_sending_email: "Ошибка отправки письма",
                error_deleting_email: "Ошибка удаления письма",
                error_api_connection: "Ошибка подключения к API",
                error_invalid_api_key: "Неверный API ключ",
                error_no_api_keys: "Нет доступных API ключей",
                error_generating_data: "Ошибка генерации данных",
                
                // Подтверждения
                confirm_delete_inbox: "Вы уверены, что хотите удалить этот ящик?",
                confirm_delete_email: "Вы уверены, что хотите удалить это письмо?",
                confirm_delete_all_inboxes: "Вы уверены, что хотите удалить все ящики?",
                
                // Время
                just_now: "только что",
                minutes_ago: "минут назад",
                hours_ago: "часов назад",
                days_ago: "дней назад",
                expires_in: "истекает через",
                expired: "истек"
            },
            
            en: {
                // General
                app_name: "NeuroMail",
                loading: "Loading...",
                error: "Error",
                success: "Success",
                cancel: "Cancel",
                save: "Save",
                delete: "Delete",
                edit: "Edit",
                close: "Close",
                confirm: "Confirm",
                yes: "Yes",
                no: "No",
                ok: "OK",
                
                // Navigation
                nav_inboxes: "Mailboxes",
                nav_emails: "Emails",
                nav_generator: "Generator",
                nav_settings: "Settings",
                nav_premium: "Premium",
                
                // Section headers
                inboxes_title: "Mailboxes",
                emails_title: "Emails",
                generator_title: "Data Generator",
                settings_title: "Settings",
                premium_title: "Premium",
                
                // Buttons
                create_new_inbox: "Create New",
                generate_data: "Generate",
                send_email: "Send Email",
                refresh: "Refresh",
                copy_data: "Copy",
                generate_new: "Generate New",
                get_premium: "Get Premium",
                
                // Status
                connected: "Connected",
                disconnected: "Disconnected",
                inbox_loading: "Loading mailboxes...",
                emails_loading: "Loading emails...",
                creating_inbox: "Creating mailbox...",
                
                // Inboxes
                select_inbox: "Select mailbox",
                inbox_email: "Email address",
                inbox_created: "Created",
                inbox_expires: "Expires",
                inbox_actions: "Actions",
                no_inboxes: "No mailboxes",
                create_first_inbox: "Create first mailbox",
                
                // Emails
                email_from: "From:",
                email_to: "To:",
                email_subject: "Subject:",
                email_date: "Date:",
                email_content: "Content:",
                email_attachments: "Attachments:",
                email_viewer: "Email Viewer",
                no_emails: "No emails",
                no_emails_in_inbox: "No emails in this mailbox",
                
                // Sending emails
                send_email_title: "Send Email",
                email_html_format: "HTML format",
                
                // Creating inbox
                create_inbox_title: "Creating Mailbox",
                create_inbox_description: "Creating new temporary mailbox...",
                
                // Generator
                generator_modal_title: "Generated Data",
                generated_user_data: "Generated user data",
                
                // Settings
                api_settings: "API Settings",
                app_settings: "Application Settings",
                api_mode: "API Mode:",
                api_mode_public: "Public Keys",
                api_mode_personal: "Personal Key",
                api_mode_combined: "Combined",
                personal_api_key: "Personal API Key:",
                auto_delete_inboxes: "Auto-delete mailboxes",
                enable_notifications: "Notifications",
                
                // Premium
                premium_benefits: "Premium Benefits",
                premium_feature_1: "Unlimited mailboxes",
                premium_feature_2: "Priority support",
                premium_feature_3: "Extended statistics",
                premium_feature_4: "Unlimited API",
                
                // Notifications
                inbox_created_success: "Mailbox created successfully",
                inbox_deleted_success: "Mailbox deleted",
                email_sent_success: "Email sent successfully",
                email_deleted_success: "Email deleted",
                data_generated_success: "Data generated",
                data_copied_success: "Data copied to clipboard",
                settings_saved_success: "Settings saved",
                api_key_updated_success: "API key updated",
                
                // Errors
                error_creating_inbox: "Error creating mailbox",
                error_deleting_inbox: "Error deleting mailbox",
                error_loading_emails: "Error loading emails",
                error_sending_email: "Error sending email",
                error_deleting_email: "Error deleting email",
                error_api_connection: "API connection error",
                error_invalid_api_key: "Invalid API key",
                error_no_api_keys: "No available API keys",
                error_generating_data: "Error generating data",
                
                // Confirmations
                confirm_delete_inbox: "Are you sure you want to delete this mailbox?",
                confirm_delete_email: "Are you sure you want to delete this email?",
                confirm_delete_all_inboxes: "Are you sure you want to delete all mailboxes?",
                
                // Time
                just_now: "just now",
                minutes_ago: "minutes ago",
                hours_ago: "hours ago",
                days_ago: "days ago",
                expires_in: "expires in",
                expired: "expired"
            }
        };
        
        this.loadLanguage();
        this.initEvents();
    }

    /**
     * Загрузить язык из localStorage
     */
    loadLanguage() {
        const savedLang = localStorage.getItem('neuroMail_language');
        if (savedLang && this.translations[savedLang]) {
            this.currentLang = savedLang;
        }
    }

    /**
     * Установить язык
     * @param {string} lang - Код языка
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('neuroMail_language', lang);
            this.updatePageLanguage();
            this.triggerLanguageChange();
        }
    }

    /**
     * Получить перевод
     * @param {string} key - Ключ перевода
     * @param {Object} params - Параметры для подстановки
     * @returns {string} Переведенный текст
     */
    t(key, params = {}) {
        let translation = this.translations[this.currentLang][key] || 
                         this.translations['ru'][key] || 
                         key;

        // Подстановка параметров
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });

        return translation;
    }

    /**
     * Обновить язык на странице
     */
    updatePageLanguage() {
        // Обновляем атрибут lang у html
        document.documentElement.lang = this.currentLang;

        // Обновляем все элементы с data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'password') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Обновляем активную кнопку языка
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === this.currentLang) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Инициализировать события переключения языка
     */
    initEvents() {
        // Обработчики для кнопок переключения языка
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lang-btn') || e.target.closest('.lang-btn')) {
                const btn = e.target.classList.contains('lang-btn') ? e.target : e.target.closest('.lang-btn');
                const lang = btn.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
            }
        });
    }

    /**
     * Запустить событие изменения языка
     */
    triggerLanguageChange() {
        const event = new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        });
        document.dispatchEvent(event);
    }

    /**
     * Получить текущий язык
     * @returns {string} Код языка
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Получить список доступных языков
     * @returns {Array} Список языков
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * Добавить новый перевод
     * @param {string} lang - Код языка
     * @param {string} key - Ключ
     * @param {string} value - Значение
     */
    addTranslation(lang, key, value) {
        if (!this.translations[lang]) {
            this.translations[lang] = {};
        }
        this.translations[lang][key] = value;
    }

    /**
     * Получить все переводы для языка
     * @param {string} lang - Код языка
     * @returns {Object} Переводы
     */
    getTranslationsForLanguage(lang) {
        return this.translations[lang] || {};
    }

    /**
     * Проверить, есть ли перевод для ключа
     * @param {string} key - Ключ
     * @param {string} lang - Код языка (опционально)
     * @returns {boolean} true если перевод существует
     */
    hasTranslation(key, lang = null) {
        const targetLang = lang || this.currentLang;
        return !!(this.translations[targetLang] && this.translations[targetLang][key]);
    }

    /**
     * Форматировать дату в зависимости от языка
     * @param {Date} date - Дата
     * @returns {string} Отформатированная дата
     */
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return new Intl.DateTimeFormat(this.currentLang === 'ru' ? 'ru-RU' : 'en-US', options).format(date);
    }

    /**
     * Форматировать относительное время
     * @param {Date} date - Дата
     * @returns {string} Относительное время
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) {
            return this.t('just_now');
        } else if (minutes < 60) {
            return `${minutes} ${this.t('minutes_ago')}`;
        } else if (hours < 24) {
            return `${hours} ${this.t('hours_ago')}`;
        } else {
            return `${days} ${this.t('days_ago')}`;
        }
    }

    /**
     * Получить направление текста для языка
     * @returns {string} 'ltr' или 'rtl'
     */
    getTextDirection() {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(this.currentLang) ? 'rtl' : 'ltr';
    }

    /**
     * Экспортировать переводы
     * @returns {Object} Все переводы
     */
    exportTranslations() {
        return JSON.stringify(this.translations, null, 2);
    }

    /**
     * Импортировать переводы
     * @param {string} translationsJson - JSON строка с переводами
     * @returns {boolean} true если импорт успешен
     */
    importTranslations(translationsJson) {
        try {
            const imported = JSON.parse(translationsJson);
            this.translations = { ...this.translations, ...imported };
            this.updatePageLanguage();
            return true;
        } catch (error) {
            console.error('Ошибка импорта переводов:', error);
            return false;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nManager;
}
