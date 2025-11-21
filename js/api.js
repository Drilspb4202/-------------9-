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

                // Для DELETE запросов и ответов без содержимого возвращаем true
                const contentLength = response.headers.get('content-length');
                const method = (options.method || '').toUpperCase();
                
                // Если нет содержимого или это DELETE запрос, возвращаем успешный результат
                if (method === 'DELETE' || contentLength === '0' || response.status === 204) {
                    return true;
                }
                
                // Проверяем, есть ли текст для парсинга
                const text = await response.text();
                if (!text || text.trim() === '') {
                    return true;
                }
                
                // Пытаемся распарсить JSON
                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    // Если не JSON, возвращаем текст
                    return text;
                }
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
                    expiresAt: options.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 минут
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
     * Получить вложение по ID
     * @param {string} attachmentId - ID вложения
     * @param {string} filename - Имя файла (опционально)
     * @returns {Promise<Object>} Данные вложения с downloadUrl и filename
     */
    async getAttachment(attachmentId, filename = null) {
        const requestFn = async () => {
            const apiKey = this.getCurrentApiKey();
            if (!apiKey) {
                throw new Error('Нет доступных API ключей');
            }

            const url = `${this.baseUrl}/attachments/${attachmentId}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Увеличиваем таймаут для больших файлов

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
                }

                // Получаем вложение как Blob, чтобы гарантированно скачать даже подозрительные файлы
                const blob = await response.blob();
                
                // Получаем имя файла из заголовков или используем переданное
                let attachmentFilename = filename;
                if (!attachmentFilename) {
                    const contentDisposition = response.headers.get('content-disposition');
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                        if (filenameMatch && filenameMatch[1]) {
                            attachmentFilename = filenameMatch[1].replace(/['"]/g, '');
                            // Декодируем URL-encoded имя файла
                            try {
                                attachmentFilename = decodeURIComponent(attachmentFilename);
                            } catch (e) {
                                // Если не удалось декодировать, используем как есть
                            }
                        }
                    }
                }
                
                if (!attachmentFilename) {
                    attachmentFilename = `attachment-${attachmentId}`;
                }

                const downloadUrl = URL.createObjectURL(blob);
                
                this.keyPool.markCurrentKeyUsed(false);
                
                return {
                    downloadUrl: downloadUrl,
                    filename: attachmentFilename,
                    blob: blob,
                    size: blob.size,
                    type: blob.type
                };
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        };

        return this.withRetry(requestFn);
    }

    /**
     * Получить список вложений письма
     * @param {string} emailId - ID письма
     * @returns {Promise<Array>} Список вложений
     */
    async getEmailAttachments(emailId) {
        try {
            const response = await this.makeRequest(`/emails/${emailId}/attachments`, {
                method: 'GET'
            });

            return response || [];
        } catch (error) {
            console.error('Ошибка получения вложений письма:', error);
            throw error;
        }
    }

    /**
     * Скачать вложение письма по emailId и имени файла
     * @param {string} emailId - ID письма
     * @param {string} filename - Имя файла вложения
     * @returns {Promise<Object>} Данные вложения
     */
    async getAttachmentByEmailIdAndFilename(emailId, filename) {
        const requestFn = async () => {
            // Сначала получаем список вложений письма
            let attachments = [];
            try {
                attachments = await this.getEmailAttachments(emailId);
            } catch (error) {
                console.warn('Не удалось получить список вложений через API, пробуем альтернативный метод:', error);
                // Если не удалось получить список, попробуем скачать напрямую через emailId
                // В этом случае используем первый доступный attachmentId из исходного email
            }
            
            // Ищем вложение по имени файла (точное совпадение)
            let attachmentId = null;
            for (const attachment of attachments) {
                const attFilename = attachment.filename || attachment.name || '';
                if (attFilename === filename || 
                    attFilename.toLowerCase() === filename.toLowerCase() ||
                    (attachment.contentId && attachment.contentId.includes(filename))) {
                    attachmentId = attachment.id || attachment.attachmentId || attachment.attachmentMetaId;
                    if (attachmentId) break;
                }
            }
            
            // Если не нашли точное совпадение, ищем частичное
            if (!attachmentId) {
                for (const attachment of attachments) {
                    const attFilename = attachment.filename || attachment.name || '';
                    if (attFilename.includes(filename) || filename.includes(attFilename)) {
                        attachmentId = attachment.id || attachment.attachmentId || attachment.attachmentMetaId;
                        if (attachmentId) break;
                    }
                }
            }
            
            // Если все еще не нашли, пробуем взять первое вложение
            if (!attachmentId && attachments.length > 0) {
                attachmentId = attachments[0].id || attachments[0].attachmentId || attachments[0].attachmentMetaId;
                console.log(`Используем первое доступное вложение: ${attachmentId}`);
            }
            
            if (!attachmentId) {
                throw new Error(`Вложение "${filename}" не найдено в письме. Всего вложений: ${attachments.length}`);
            }
            
            // Скачиваем вложение через emailId и attachmentId
            const apiKey = this.getCurrentApiKey();
            if (!apiKey) {
                throw new Error('Нет доступных API ключей');
            }

            const url = `${this.baseUrl}/emails/${emailId}/attachments/${attachmentId}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
                }

                // Получаем вложение как Blob, чтобы гарантированно скачать даже подозрительные файлы
                const blob = await response.blob();
                
                // Получаем имя файла из заголовков или используем переданное
                let attachmentFilename = filename;
                if (!attachmentFilename) {
                    const contentDisposition = response.headers.get('content-disposition');
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                        if (filenameMatch && filenameMatch[1]) {
                            attachmentFilename = filenameMatch[1].replace(/['"]/g, '');
                            try {
                                attachmentFilename = decodeURIComponent(attachmentFilename);
                            } catch (e) {
                                // Если не удалось декодировать, используем как есть
                            }
                        }
                    }
                }
                
                if (!attachmentFilename) {
                    attachmentFilename = `attachment-${attachmentId}`;
                }

                const downloadUrl = URL.createObjectURL(blob);
                
                this.keyPool.markCurrentKeyUsed(false);
                
                return {
                    downloadUrl: downloadUrl,
                    filename: attachmentFilename,
                    blob: blob,
                    size: blob.size,
                    type: blob.type
                };
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        };

        return this.withRetry(requestFn);
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
