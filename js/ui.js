/**
 * Управление UI компонентами
 * Обрабатывает взаимодействие с пользователем и обновление интерфейса
 */
class MailSlurpUI {
    constructor(app) {
        this.app = app;
        this.navItems = document.querySelectorAll('.nav-item');
        this.contentSections = document.querySelectorAll('.content-section');
        this.modals = document.querySelectorAll('.modal');
        this.mobileNavItems = document.querySelectorAll('.mobile-nav-item');
        
        this.setupEventListeners();
        this.initMobileNavigation();
    }

    /**
     * Настроить обработчики событий
     */
    setupEventListeners() {
        // Навигация
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.showSection(target);
            });
        });

        // Мобильная навигация
        this.mobileNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.showSection(target);
            });
        });

        // Модальные окна
        this.modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal(modal.id);
                });
            }

            // Закрытие по клику вне модального окна
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Кнопка создания ящика
        const createInboxBtn = document.getElementById('create-inbox-btn');
        if (createInboxBtn) {
            createInboxBtn.addEventListener('click', () => {
                this.app.createInbox();
            });
        }

        // Кнопка генерации данных
        const generateDataBtn = document.getElementById('generate-data-btn');
        if (generateDataBtn) {
            generateDataBtn.addEventListener('click', () => {
                this.app.generateUserData();
            });
        }

        // Селектор страны
        const countrySelector = document.getElementById('country-selector');
        if (countrySelector) {
            countrySelector.addEventListener('change', (e) => {
                this.updateStateSelector(e.target.value);
            });
        }

        // Кнопка обновления писем
        const refreshEmailsBtn = document.getElementById('refresh-emails-btn');
        if (refreshEmailsBtn) {
            refreshEmailsBtn.addEventListener('click', () => {
                this.app.refreshEmails();
            });
        }

        // Селектор ящиков
        const inboxSelector = document.getElementById('inbox-selector');
        if (inboxSelector) {
            inboxSelector.addEventListener('change', (e) => {
                this.app.loadEmailsForInbox(e.target.value);
            });
        }

        // Форма отправки письма
        const sendEmailForm = document.getElementById('send-email-form');
        if (sendEmailForm) {
            sendEmailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSendEmail(e);
            });
        }

        // Кнопки в модальном окне генератора
        const copyDataBtn = document.getElementById('copy-data-btn');
        if (copyDataBtn) {
            copyDataBtn.addEventListener('click', () => {
                this.copyGeneratedData();
            });
        }

        const generateNewBtn = document.getElementById('generate-new-btn');
        if (generateNewBtn) {
            generateNewBtn.addEventListener('click', () => {
                this.app.generateUserData();
            });
        }

        // Настройки API
        const apiModeSelect = document.getElementById('api-mode');
        if (apiModeSelect) {
            apiModeSelect.addEventListener('change', (e) => {
                this.app.switchApiMode(e.target.value);
            });
        }

        const personalApiKeyInput = document.getElementById('personal-api-key');
        if (personalApiKeyInput) {
            personalApiKeyInput.addEventListener('blur', (e) => {
                this.app.updatePersonalApiKey(e.target.value);
            });
        }

        // Обработка изменения языка
        document.addEventListener('languageChanged', () => {
            this.updateUIAfterLanguageChange();
        });
    }

    /**
     * Инициализировать мобильную навигацию
     */
    initMobileNavigation() {
        // Скрытие/показ мобильной навигации при скролле
        let lastScrollTop = 0;
        const mobileNav = document.querySelector('.mobile-fixed-nav');
        
        if (mobileNav) {
            window.addEventListener('scroll', () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // Скролл вниз - скрываем навигацию
                    mobileNav.style.transform = 'translateY(100%)';
                } else {
                    // Скролл вверх - показываем навигацию
                    mobileNav.style.transform = 'translateY(0)';
                }
                
                lastScrollTop = scrollTop;
            });
        }
    }

    /**
     * Показать секцию контента
     * @param {string} sectionId - ID секции
     */
    showSection(sectionId) {
        // Скрыть все секции
        this.contentSections.forEach(section => {
            section.classList.remove('active');
        });

        // Показать выбранную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Обновить активные элементы навигации
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === sectionId) {
                item.classList.add('active');
            }
        });

        this.mobileNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === sectionId) {
                item.classList.add('active');
            }
        });

        // Загрузить данные для секции
        this.loadSectionData(sectionId);
    }

    /**
     * Загрузить данные для секции
     * @param {string} sectionId - ID секции
     */
    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'inboxes-section':
                this.app.loadInboxes();
                break;
            case 'emails-section':
                this.app.loadEmails();
                break;
            case 'settings-section':
                this.loadSettings();
                break;
        }
    }

    /**
     * Показать модальное окно
     * @param {string} modalId - ID модального окна
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Скрыть модальное окно
     * @param {string} modalId - ID модального окна
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Обновить список почтовых ящиков
     * @param {Array} inboxes - Список ящиков
     */
    updateInboxesList(inboxes) {
        const container = document.getElementById('inboxes-list');
        const loading = document.getElementById('inboxes-loading');
        
        if (loading) {
            loading.style.display = 'none';
        }

        if (!container) return;

        if (inboxes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>${this.app.i18n.t('no_inboxes')}</h3>
                    <p>${this.app.i18n.t('create_first_inbox')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = inboxes.map(inbox => this.createInboxItem(inbox)).join('');
        
        // Добавить обработчики событий для новых элементов
        this.setupInboxEventListeners();
    }

    /**
     * Создать элемент ящика
     * @param {Object} inbox - Данные ящика
     * @returns {string} HTML строка
     */
    createInboxItem(inbox) {
        const createdDate = new Date(inbox.createdAt);
        const expiresDate = new Date(inbox.expiresAt);
        const isExpired = expiresDate < new Date();
        
        return `
            <div class="inbox-item" data-inbox-id="${inbox.id}">
                <div class="inbox-header">
                    <div class="inbox-email clickable-email" onclick="window.mailSlurpApp.copyEmailToClipboard('${inbox.emailAddress}')" title="Нажмите чтобы скопировать email">
                        <i class="fas fa-copy copy-icon"></i>
                        ${inbox.emailAddress}
                    </div>
                    <div class="inbox-actions">
                        <button class="btn btn-small btn-primary" onclick="window.mailSlurpApp.sendEmailFromInbox('${inbox.id}')" title="Отправить письмо">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="window.mailSlurpApp.loadEmailsForInbox('${inbox.id}')" title="Просмотреть письма">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="window.mailSlurpApp.deleteInbox('${inbox.id}')" title="Удалить ящик">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="inbox-meta">
                    <div><strong>${this.app.i18n.t('inbox_created')}:</strong> ${this.app.i18n.formatDate(createdDate)}</div>
                    <div><strong>${this.app.i18n.t('inbox_expires')}:</strong> 
                        <span class="${isExpired ? 'text-danger' : 'text-warning'}">
                            ${isExpired ? this.app.i18n.t('expired') : this.app.i18n.formatRelativeTime(expiresDate)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Обновить список писем
     * @param {Array} emails - Список писем
     */
    updateEmailsList(emails) {
        const container = document.getElementById('emails-list');
        const loading = document.getElementById('emails-loading');
        
        if (loading) {
            loading.style.display = 'none';
        }

        if (!container) return;

        if (emails.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-envelope"></i>
                    <h3>${this.app.i18n.t('no_emails')}</h3>
                    <p>${this.app.i18n.t('no_emails_in_inbox')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = emails.map(email => this.createEmailItem(email)).join('');
        
        // Добавить обработчики событий для новых элементов
        this.setupEmailEventListeners();
    }

    /**
     * Создать элемент письма
     * @param {Object} email - Данные письма
     * @returns {string} HTML строка
     */
    createEmailItem(email) {
        const receivedDate = new Date(email.createdAt);
        const isRead = email.read || false;
        const hasAttachments = email.attachments && email.attachments.length > 0;
        const isDuplicate = email._isDuplicate || false;
        
        return `
            <div class="email-item ${isRead ? 'read' : 'unread'} ${isDuplicate ? 'duplicate' : ''}" data-email-id="${email.id}">
                <div class="email-header">
                    <div class="email-subject">
                        ${isDuplicate ? '<i class="fas fa-exclamation-triangle duplicate-warning" title="Возможный дубликат"></i>' : ''}
                        ${email.subject || '(Без темы)'}
                        ${hasAttachments ? '<i class="fas fa-paperclip attachment-indicator" title="Есть вложения"></i>' : ''}
                    </div>
                    <div class="email-actions">
                        <button class="btn btn-small btn-primary" onclick="window.mailSlurpApp.viewEmail('${email.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="window.mailSlurpApp.deleteEmail('${email.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="email-meta">
                    <div><strong>${this.app.i18n.t('email_from')}</strong> ${email.from || 'Неизвестно'}</div>
                    <div><strong>${this.app.i18n.t('email_date')}</strong> ${this.app.i18n.formatDate(receivedDate)}</div>
                    ${hasAttachments ? `<div><strong>Вложения:</strong> ${email.attachments.length}</div>` : ''}
                    ${isDuplicate ? '<div class="duplicate-notice"><i class="fas fa-info-circle"></i> Возможный дубликат</div>' : ''}
                </div>
                ${email.body ? `<div class="email-preview">${this.truncateText(email.body, 100)}</div>` : ''}
            </div>
        `;
    }

    /**
     * Обновить селектор ящиков
     * @param {Array} inboxes - Список ящиков
     */
    updateInboxSelector(inboxes) {
        const selector = document.getElementById('inbox-selector');
        if (!selector) return;

        selector.innerHTML = `
            <option value="">${this.app.i18n.t('select_inbox')}</option>
            ${inboxes.map(inbox => `
                <option value="${inbox.id}">${inbox.emailAddress}</option>
            `).join('')}
        `;
    }

    /**
     * Показать письмо в модальном окне
     * @param {Object} email - Данные письма
     */
    showEmailViewer(email) {
        const modal = document.getElementById('view-email-modal');
        if (!modal) return;

        // Заполнить заголовок письма
        document.getElementById('email-from').textContent = email.from || 'Неизвестно';
        document.getElementById('email-to-view').textContent = email.to || 'Неизвестно';
        document.getElementById('email-subject-view').textContent = email.subject || '(Без темы)';
        document.getElementById('email-date').textContent = this.app.i18n.formatDate(new Date(email.createdAt));

        // Обработать содержимое письма
        const emailBody = document.getElementById('email-body');
        if (email.body) {
            if (email.isHTML) {
                // Безопасное отображение HTML
                emailBody.innerHTML = this.sanitizeHtmlContent(email.body);
            } else {
                // Отображение как обычный текст
                emailBody.innerHTML = `<pre>${this.escapeHtml(email.body)}</pre>`;
            }
        } else {
            emailBody.innerHTML = '<p class="text-muted">Содержимое письма отсутствует</p>';
        }

        // Обработать вложения
        const attachmentsContainer = document.getElementById('email-attachments');
        const attachmentsList = document.getElementById('attachments-list');
        
        if (email.attachments && email.attachments.length > 0) {
            attachmentsContainer.style.display = 'block';
            attachmentsList.innerHTML = email.attachments.map(attachment => {
                const filename = attachment.filename || attachment.name || 'Вложение';
                const fileSize = attachment.contentLength ? this.formatFileSize(attachment.contentLength) : '';
                const mimeType = attachment.contentType || 'application/octet-stream';
                const fileIcon = this.getFileIcon(mimeType);
                
                return `
                    <div class="attachment-item" data-attachment-id="${attachment.id}">
                        <div class="attachment-info">
                            <i class="${fileIcon}"></i>
                            <div class="attachment-details">
                                <span class="attachment-name">${filename}</span>
                                ${fileSize ? `<span class="attachment-size">${fileSize}</span>` : ''}
                            </div>
                        </div>
                        <div class="attachment-actions">
                            <button class="btn btn-small btn-secondary download-btn" 
                                    onclick="window.mailSlurpApp.downloadAttachment('${attachment.id}', '${filename}')"
                                    title="Скачать вложение">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            attachmentsContainer.style.display = 'none';
        }

        this.showModal('view-email-modal');
    }

    /**
     * Обновить селектор штатов/регионов
     * @param {string} country - Выбранная страна
     */
    updateStateSelector(country) {
        const stateSelector = document.getElementById('state-selector');
        if (!stateSelector) return;

        // Очищаем текущие опции
        stateSelector.innerHTML = '<option value="" data-i18n="select_state">Выберите штат/регион</option>';

        if (!country) {
            stateSelector.disabled = true;
            return;
        }

        // Получаем штаты для выбранной страны
        const states = this.app.generator.geminiApi.getStatesForCountry(country);
        
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.value;
            option.textContent = state.name;
            stateSelector.appendChild(option);
        });

        stateSelector.disabled = false;
    }

    /**
     * Показать уведомление
     * @param {string} message - Сообщение
     * @param {string} type - Тип уведомления (success, error, warning, info)
     * @param {number} duration - Длительность показа в мс
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Автоматическое удаление
        setTimeout(() => {
            toast.remove();
        }, duration);

        // Удаление по клику
        toast.addEventListener('click', () => {
            toast.remove();
        });
    }

    /**
     * Получить иконку для типа уведомления
     * @param {string} type - Тип уведомления
     * @returns {string} Название иконки
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Обрезать текст
     * @param {string} text - Текст
     * @param {number} length - Максимальная длина
     * @returns {string} Обрезанный текст
     */
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    /**
     * Экранировать HTML
     * @param {string} text - Текст
     * @returns {string} Экранированный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Санитизировать HTML контент
     * @param {string} html - HTML контент
     * @returns {string} Безопасный HTML
     */
    sanitizeHtmlContent(html) {
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
     * Обработать отправку письма
     * @param {Event} e - Событие формы
     */
    handleSendEmail(e) {
        const formData = new FormData(e.target);
        const emailData = {
            to: document.getElementById('email-to').value,
            subject: document.getElementById('email-subject').value,
            body: document.getElementById('email-content').value,
            isHTML: document.getElementById('email-html').checked
        };

        this.app.sendEmail(emailData);
        this.hideModal('send-email-modal');
    }

    /**
     * Копировать сгенерированные данные
     */
    copyGeneratedData() {
        const dataContainer = document.getElementById('generated-data-modal');
        if (!dataContainer) return;

        const text = dataContainer.textContent;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(this.app.i18n.t('data_copied_success'), 'success');
        }).catch(() => {
            this.showToast('Ошибка копирования', 'error');
        });
    }

    /**
     * Загрузить настройки
     */
    loadSettings() {
        const apiMode = document.getElementById('api-mode');
        const personalApiKey = document.getElementById('personal-api-key');
        const autoDeleteInboxes = document.getElementById('auto-delete-inboxes');
        const enableNotifications = document.getElementById('enable-notifications');

        if (apiMode) {
            apiMode.value = this.app.api.keyManager.getApiMode();
        }

        if (personalApiKey) {
            personalApiKey.value = this.app.api.keyManager.getPersonalApiKey() || '';
        }

        // Загрузить другие настройки из localStorage
        if (autoDeleteInboxes) {
            autoDeleteInboxes.checked = localStorage.getItem('autoDeleteInboxes') !== 'false';
        }

        if (enableNotifications) {
            enableNotifications.checked = localStorage.getItem('enableNotifications') !== 'false';
        }
    }

    /**
     * Обновить UI после изменения языка
     */
    updateUIAfterLanguageChange() {
        // Обновить заголовки и текст
        this.updateInboxesList(this.app.inboxes || []);
        this.updateEmailsList(this.app.emails || []);
        this.loadSettings();
    }

    /**
     * Настроить обработчики событий для ящиков
     */
    setupInboxEventListeners() {
        // Обработчики уже добавлены через onclick в HTML
    }

    /**
     * Настроить обработчики событий для писем
     */
    setupEmailEventListeners() {
        // Обработчики уже добавлены через onclick в HTML
    }

    /**
     * Показать индикатор загрузки
     * @param {string} sectionId - ID секции
     */
    showLoading(sectionId) {
        const loading = document.getElementById(`${sectionId.replace('-section', '')}-loading`);
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    /**
     * Скрыть индикатор загрузки
     * @param {string} sectionId - ID секции
     */
    hideLoading(sectionId) {
        const loading = document.getElementById(`${sectionId.replace('-section', '')}-loading`);
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Обновить статус подключения
     * @param {boolean} connected - Статус подключения
     */
    updateConnectionStatus(connected) {
        const icon = document.getElementById('connection-icon');
        const text = document.getElementById('connection-text');
        
        if (icon && text) {
            if (connected) {
                icon.className = 'fas fa-wifi';
                text.textContent = this.app.i18n.t('connected');
                text.parentElement.classList.remove('disconnected');
            } else {
                icon.className = 'fas fa-wifi-slash';
                text.textContent = this.app.i18n.t('disconnected');
                text.parentElement.classList.add('disconnected');
            }
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
     * Получить иконку файла по MIME типу
     * @param {string} mimeType - MIME тип
     * @returns {string} CSS класс иконки
     */
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'fas fa-file-image';
        } else if (mimeType.startsWith('video/')) {
            return 'fas fa-file-video';
        } else if (mimeType.startsWith('audio/')) {
            return 'fas fa-file-audio';
        } else if (mimeType === 'application/pdf') {
            return 'fas fa-file-pdf';
        } else if (mimeType.includes('word') || mimeType.includes('document')) {
            return 'fas fa-file-word';
        } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            return 'fas fa-file-excel';
        } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
            return 'fas fa-file-powerpoint';
        } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
            return 'fas fa-file-archive';
        } else if (mimeType.startsWith('text/')) {
            return 'fas fa-file-alt';
        } else {
            return 'fas fa-file';
        }
    }

    /**
     * Скачать вложение (глобальная функция)
     * @param {string} attachmentId - ID вложения
     * @param {string} filename - Имя файла
     */
    downloadAttachment(attachmentId, filename) {
        if (this.app) {
            this.app.downloadAttachment(attachmentId, filename);
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MailSlurpUI;
}
