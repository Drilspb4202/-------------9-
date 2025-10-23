/**
 * Менеджер API ключей
 * Управляет персональными ключами и настройками API
 */
class ApiKeyManager {
    constructor() {
        this.storageKey = 'neuroMail_apiSettings';
        this.defaultSettings = {
            apiMode: 'public',
            personalApiKey: null,
            autoRotateKeys: true,
            maxRetries: 3,
            timeout: 10000
        };
        this.settings = this.loadSettings();
    }

    /**
     * Загрузить настройки из localStorage
     * @returns {Object} Настройки
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return { ...this.defaultSettings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек API:', error);
        }
        return { ...this.defaultSettings };
    }

    /**
     * Сохранить настройки в localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Ошибка сохранения настроек API:', error);
        }
    }

    /**
     * Установить режим API
     * @param {string} mode - Режим (public, personal, combined)
     */
    setApiMode(mode) {
        if (['public', 'personal', 'combined'].includes(mode)) {
            this.settings.apiMode = mode;
            this.saveSettings();
            console.log(`Режим API установлен: ${mode}`);
        } else {
            throw new Error('Неверный режим API. Доступные: public, personal, combined');
        }
    }

    /**
     * Получить текущий режим API
     * @returns {string} Режим API
     */
    getApiMode() {
        return this.settings.apiMode;
    }

    /**
     * Установить персональный API ключ
     * @param {string} key - API ключ
     */
    setPersonalApiKey(key) {
        if (key && key.trim().length > 0) {
            this.settings.personalApiKey = key.trim();
            this.saveSettings();
            console.log('Персональный API ключ установлен');
        } else {
            this.settings.personalApiKey = null;
            this.saveSettings();
            console.log('Персональный API ключ удален');
        }
    }

    /**
     * Получить персональный API ключ
     * @returns {string|null} API ключ
     */
    getPersonalApiKey() {
        return this.settings.personalApiKey;
    }

    /**
     * Проверить валидность API ключа
     * @param {string} key - API ключ для проверки
     * @returns {Promise<boolean>} true если ключ валиден
     */
    async validateApiKey(key) {
        if (!key || key.trim().length === 0) {
            return false;
        }

        try {
            const response = await fetch('https://api.mailslurp.com/user/info', {
                method: 'GET',
                headers: {
                    'x-api-key': key.trim(),
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            return response.ok;
        } catch (error) {
            console.error('Ошибка валидации API ключа:', error);
            return false;
        }
    }

    /**
     * Получить все настройки
     * @returns {Object} Настройки
     */
    getAllSettings() {
        return { ...this.settings };
    }

    /**
     * Обновить настройки
     * @param {Object} newSettings - Новые настройки
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    /**
     * Сбросить настройки к значениям по умолчанию
     */
    resetSettings() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        console.log('Настройки API сброшены к значениям по умолчанию');
    }

    /**
     * Получить статистику использования ключей
     * @returns {Object} Статистика
     */
    getKeyStats() {
        return {
            currentMode: this.settings.apiMode,
            hasPersonalKey: !!this.settings.personalApiKey,
            personalKeyLength: this.settings.personalApiKey ? this.settings.personalApiKey.length : 0,
            settings: this.settings
        };
    }

    /**
     * Экспортировать настройки
     * @returns {string} JSON строка с настройками
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Импортировать настройки
     * @param {string} settingsJson - JSON строка с настройками
     * @returns {boolean} true если импорт успешен
     */
    importSettings(settingsJson) {
        try {
            const importedSettings = JSON.parse(settingsJson);
            this.settings = { ...this.defaultSettings, ...importedSettings };
            this.saveSettings();
            console.log('Настройки API импортированы');
            return true;
        } catch (error) {
            console.error('Ошибка импорта настроек API:', error);
            return false;
        }
    }

    /**
     * Очистить все данные
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            this.settings = { ...this.defaultSettings };
            console.log('Все данные API менеджера очищены');
        } catch (error) {
            console.error('Ошибка очистки данных API:', error);
        }
    }

    /**
     * Получить рекомендуемые настройки для режима
     * @param {string} mode - Режим API
     * @returns {Object} Рекомендуемые настройки
     */
    getRecommendedSettings(mode) {
        const recommendations = {
            public: {
                apiMode: 'public',
                autoRotateKeys: true,
                maxRetries: 3,
                timeout: 10000
            },
            personal: {
                apiMode: 'personal',
                autoRotateKeys: false,
                maxRetries: 2,
                timeout: 15000
            },
            combined: {
                apiMode: 'combined',
                autoRotateKeys: true,
                maxRetries: 3,
                timeout: 10000
            }
        };

        return recommendations[mode] || recommendations.public;
    }

    /**
     * Применить рекомендуемые настройки
     * @param {string} mode - Режим API
     */
    applyRecommendedSettings(mode) {
        const recommended = this.getRecommendedSettings(mode);
        this.updateSettings(recommended);
        console.log(`Применены рекомендуемые настройки для режима: ${mode}`);
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiKeyManager;
}
