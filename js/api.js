/**
 * API клиент для работы с MailSlurp
 * Поддерживает автоматическую ротацию ключей и обработку ошибок
 */
class MailSlurpApi {
    constructor() {
        this.keyPool = new ApiKeyPool();
        this.keyManager = new ApiKeyManager();
        this.baseUrl = 'https://api.mailslurp.com';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.timeout = 10000; // 10 секунд
        this.currentApiMode = 'public'; // public, personal, combined
        this.personalApiKey = null;
    }

    /**
     * Выполнить HTTP запрос с автоматической ротацией ключей
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Опции запроса
     * @returns {Promise} Результат запроса
     */
    async makeRequest(endpoint, options = {}) {
        const requestFn = async () => {
            const apiKey = this.getCurrentApiKey();
            if (!apiKey) {
                throw new Error('Нет доступных API ключей');
            }

            const url = `${this.baseUrl}${endpoint}`;
            const requestOptions = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    ...options.headers
                },
                timeout: this.timeout
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                const response = await fetch(url, {
                    ...requestOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        };

        return this.withRetry(requestFn);
    }

    /**
     * Получить текущий API ключ в зависимости от режима
     * @returns {string|null} API ключ
     */
    getCurrentApiKey() {
        switch (this.currentApiMode) {
            case 'personal':
                return this.personalApiKey || this.keyPool.getNextAvailableKey();
            case 'combined':
                return this.personalApiKey || this.keyPool.getNextAvailableKey();
            case 'public':
            default:
                return this.keyPool.getNextAvailableKey();
        }
    }

    /**
     * Выполнить запрос с повторными попытками
     * @param {Function} requestFn - Функция запроса
     * @returns {Promise} Результат запроса
     */
    async withRetry(requestFn) {
        let lastError;
        
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const result = await requestFn();
                this.keyPool.markCurrentKeyUsed(false);
                return result;
            } catch (error) {
                lastError = error;
                
                // Проверяем, нужно ли переключить ключ
                if (this.shouldSwitchKey(error)) {
                    this.keyPool.markCurrentKeyUsed(true);
                    this.keyPool.switchToNextKey();
                }
                
                if (attempt < this.maxRetries - 1) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    await this.delay(delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Проверить, нужно ли переключить ключ
     * @param {Error} error - Ошибка
     * @returns {boolean} true если нужно переключить ключ
     */
    shouldSwitchKey(error) {
        const errorMessage = error.message.toLowerCase();
        return errorMessage.includes('401') || 
               errorMessage.includes('unauthorized') ||
               errorMessage.includes('quota') ||
               errorMessage.includes('limit');
    }

    /**
     * Задержка выполнения
     * @param {number} ms - Миллисекунды
     * @returns {Promise} Promise с задержкой
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Создать новый почтовый ящик
     * @param {Object} options - Опции создания
     * @returns {Promise<Object>} Созданный ящик
     */
    async createInbox(options = {}) {
        try {
            const response = await this.makeRequest('/inboxes', {
                method: 'POST',
                body: JSON.stringify({
                    name: options.name || `NeuroMail-${Date.now()}`,
                    description: options.description || 'Временный почтовый ящик',
                    expiresAt: options.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 минут
                    ...options
                })
            });

            console.log('Создан новый почтовый ящик:', response);
            return response;
        } catch (error) {
            console.error('Ошибка создания ящика:', error);
            throw error;
        }
    }

    /**
     * Получить список почтовых ящиков
     * @param {Object} options - Опции запроса
     * @returns {Promise<Array>} Список ящиков
     */
    async getInboxes(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page);
            if (options.size) params.append('size', options.size);
            if (options.sort) params.append('sort', options.sort);

            const endpoint = `/inboxes${params.toString() ? '?' + params.toString() : ''}`;
            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return response.content || response;
        } catch (error) {
            console.error('Ошибка получения ящиков:', error);
            throw error;
        }
    }

    /**
     * Удалить почтовый ящик
     * @param {string} inboxId - ID ящика
     * @returns {Promise<boolean>} true если удален
     */
    async deleteInbox(inboxId) {
        try {
            await this.makeRequest(`/inboxes/${inboxId}`, {
                method: 'DELETE'
            });

            console.log('Ящик удален:', inboxId);
            return true;
        } catch (error) {
            console.error('Ошибка удаления ящика:', error);
            throw error;
        }
    }

    /**
     * Получить письма из ящика
     * @param {string} inboxId - ID ящика
     * @param {Object} options - Опции запроса
     * @returns {Promise<Array>} Список писем
     */
    async getEmails(inboxId, options = {}) {
        try {
            const params = new URLSearchParams();
            params.append('inboxId', inboxId);
            if (options.page) params.append('page', options.page);
            if (options.size) params.append('size', options.size);
            if (options.sort) params.append('sort', options.sort);

            const endpoint = `/emails?${params.toString()}`;
            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return response.content || response;
        } catch (error) {
            console.error('Ошибка получения писем:', error);
            throw error;
        }
    }

    /**
     * Получить конкретное письмо
     * @param {string} emailId - ID письма
     * @returns {Promise<Object>} Письмо
     */
    async getEmail(emailId) {
        try {
            const response = await this.makeRequest(`/emails/${emailId}`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('Ошибка получения письма:', error);
            throw error;
        }
    }

    /**
     * Получить вложение по ID
     * @param {string} attachmentId - ID вложения
     * @returns {Promise<Blob>} Вложение как Blob
     */
    async getAttachment(attachmentId) {
        try {
            const apiKey = this.getCurrentApiKey();
            if (!apiKey) {
                throw new Error('Нет доступных API ключей');
            }

            const url = `${this.baseUrl}/attachments/${attachmentId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'Accept': '*/*'
                }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('Ошибка получения вложения:', error);
            throw error;
        }
    }

    /**
     * Скачать вложение
     * @param {string} attachmentId - ID вложения
     * @param {string} filename - Имя файла
     * @returns {Promise<void>}
     */
    async downloadAttachment(attachmentId, filename = 'attachment') {
        try {
            const blob = await this.getAttachment(attachmentId);
            
            // Определяем MIME тип и расширение файла
            const mimeType = blob.type || 'application/octet-stream';
            const fileExtension = this.getFileExtensionFromMimeType(mimeType);
            const finalFilename = filename.includes('.') ? filename : `${filename}${fileExtension}`;
            
            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = finalFilename;
            link.style.display = 'none';
            
            // Добавляем ссылку в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            
            // Небольшая задержка перед удалением ссылки
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            return true;
        } catch (error) {
            console.error('Ошибка скачивания вложения:', error);
            throw error;
        }
    }

    /**
     * Получить расширение файла из MIME типа
     * @param {string} mimeType - MIME тип
     * @returns {string} Расширение файла
     */
    getFileExtensionFromMimeType(mimeType) {
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
            'text/plain': '.txt',
            'text/html': '.html',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'application/zip': '.zip',
            'application/x-rar-compressed': '.rar',
            'application/x-7z-compressed': '.7z',
            'video/mp4': '.mp4',
            'video/avi': '.avi',
            'video/quicktime': '.mov',
            'audio/mp3': '.mp3',
            'audio/wav': '.wav',
            'audio/ogg': '.ogg'
        };
        
        return mimeToExt[mimeType] || '.bin';
    }

    /**
     * Отправить письмо
     * @param {string} inboxId - ID ящика отправителя
     * @param {Object} emailData - Данные письма
     * @returns {Promise<Object>} Результат отправки
     */
    async sendEmail(inboxId, emailData) {
        try {
            const response = await this.makeRequest(`/inboxes/${inboxId}`, {
                method: 'POST',
                body: JSON.stringify({
                    to: emailData.to,
                    subject: emailData.subject,
                    body: emailData.body,
                    isHTML: emailData.isHTML || false,
                    ...emailData
                })
            });

            console.log('Письмо отправлено:', response);
            return response;
        } catch (error) {
            console.error('Ошибка отправки письма:', error);
            throw error;
        }
    }

    /**
     * Удалить письмо
     * @param {string} emailId - ID письма
     * @returns {Promise<boolean>} true если удалено
     */
    async deleteEmail(emailId) {
        try {
            await this.makeRequest(`/emails/${emailId}`, {
                method: 'DELETE'
            });

            console.log('Письмо удалено:', emailId);
            return true;
        } catch (error) {
            console.error('Ошибка удаления письма:', error);
            throw error;
        }
    }

    /**
     * Ожидать новое письмо
     * @param {string} inboxId - ID ящика
     * @param {number} timeout - Таймаут в секундах
     * @returns {Promise<Object>} Новое письмо
     */
    async waitForLatestEmail(inboxId, timeout = 30) {
        try {
            const params = new URLSearchParams();
            params.append('inboxId', inboxId);
            params.append('timeout', timeout * 1000); // MailSlurp ожидает миллисекунды

            const response = await this.makeRequest(`/waitForLatestEmail?${params.toString()}`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('Ошибка ожидания письма:', error);
            throw error;
        }
    }

    /**
     * Проверить соединение с API
     * @returns {Promise<Object>} Статус соединения
     */
    async checkConnection() {
        try {
            const response = await this.makeRequest('/user/info', {
                method: 'GET'
            });

            return {
                connected: true,
                userInfo: response,
                apiKeyInfo: this.keyPool.getCurrentKeyInfo(),
                poolStatus: this.keyPool.getPoolStatus()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                apiKeyInfo: this.keyPool.getCurrentKeyInfo(),
                poolStatus: this.keyPool.getPoolStatus()
            };
        }
    }

    /**
     * Переключить режим API
     * @param {string} mode - Режим (public, personal, combined)
     * @param {string} personalKey - Персональный ключ (если нужен)
     */
    switchApiMode(mode, personalKey = null) {
        this.currentApiMode = mode;
        if (personalKey) {
            this.personalApiKey = personalKey;
        }
        console.log(`Режим API изменен на: ${mode}`);
    }

    /**
     * Получить статус пула публичных ключей
     * @returns {Object} Статус пула
     */
    getPublicKeyPoolStatus() {
        return this.keyPool.getPoolStatus();
    }

    /**
     * Получить статистику использования
     * @returns {Object} Статистика
     */
    getUsageStats() {
        return this.keyPool.getUsageStats();
    }

    /**
     * Сбросить пул ключей
     */
    resetKeyPool() {
        this.keyPool.resetPool();
    }

    /**
     * Получить вложения письма
     * @param {string} attachmentId - ID вложения
     * @returns {Promise<Object>} Данные вложения
     */
    async getAttachment(attachmentId) {
        try {
            const response = await this.makeRequest(`/attachments/${attachmentId}`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('Ошибка получения вложения:', error);
            throw error;
        }
    }

    /**
     * Получить информацию о пользователе
     * @returns {Promise<Object>} Информация о пользователе
     */
    async getUserInfo() {
        try {
            const response = await this.makeRequest('/user/info', {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('Ошибка получения информации о пользователе:', error);
            throw error;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MailSlurpApi;
}
