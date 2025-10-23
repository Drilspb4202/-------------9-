# 🚀 Промт для создания проекта NeuroMail

## 📋 Описание проекта

Создай веб-приложение **NeuroMail** - современный сервис для работы с временными почтовыми ящиками через API MailSlurp. Приложение должно предоставлять пользователям возможность создавать временные email-адреса, получать письма в реальном времени, отправлять письма и управлять почтовыми ящиками с красивым темным интерфейсом в стиле киберпанк.

## 🛠 Технические требования

### Основной стек
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Интеграция с MailSlurp API
- **Стиль**: Современный темный дизайн с неоновыми акцентами
- **Адаптивность**: Полная поддержка мобильных устройств
- **Языки**: Русский и английский (с переключателем)

### Архитектура приложения
- **Классовая архитектура** с четким разделением ответственности
- **Event-driven** коммуникация между компонентами
- **Модульная структура** для легкого сопровождения
- **Автоматическая ротация API ключей** при исчерпании лимитов

## 📁 Структура файлов

```
NeuroMail/
├── index.html                    # Главная страница
├── css/
│   ├── styles.css               # Основные стили
│   ├── mobile-enhancements.css  # Мобильные стили
│   ├── language-switcher.css    # Стили переключателя языков
│   ├── compact-design.css       # Компактный дизайн
│   └── button-fix.css          # Исправления кнопок
├── js/
│   ├── app.js                  # Главный контроллер приложения
│   ├── api.js                  # API клиент для MailSlurp
│   ├── ui.js                   # Управление UI компонентами
│   ├── api-key-pool.js         # Пул публичных API ключей
│   ├── apiKeyManager.js        # Менеджер API ключей
│   ├── generator.js            # Генератор тестовых данных
│   ├── i18n.js                 # Интернационализация
│   ├── performance-optimizer.js # Оптимизация производительности
│   ├── api-key-updater.js      # Обновление API ключей
│   ├── api-keys-checker.js     # Проверка API ключей
│   └── reset-api-keys.js       # Сброс API ключей
├── img/
│   ├── mail-logo.svg           # Логотип приложения
│   └── favicon.ico             # Иконка сайта
├── additional_files/
│   └── vercel-info.txt         # Информация о деплое
├── backup/                     # Резервные копии
├── clear-api-keys.html         # Очистка API ключей
├── clear-storage.html          # Очистка хранилища
├── open-project.html           # Открытие проекта
├── reset.html                  # Сброс настроек
├── run-with-python.bat         # Запуск через Python
├── start-server.ps1            # PowerShell сервер
├── vercel-info.txt             # Информация Vercel
├── yandex_f7e5350912ef6093.html # Яндекс верификация
└── README.md                   # Документация
```

## 🎨 Дизайн и стили

### Цветовая схема
```css
:root {
    --primary-color: #8a2be2;      /* Фиолетовый */
    --primary-hover: #7a1cd7;      /* Фиолетовый при наведении */
    --secondary-color: #b15eff;    /* Светло-фиолетовый */
    --accent-color: #ff00ff;       /* Розовый акцент */
    --bg-color: #0f0b21;           /* Темно-синий фон */
    --card-bg: #1a1633;            /* Фон карточек */
    --text-color: #ffffff;         /* Белый текст */
    --text-secondary: #c4b7e6;     /* Вторичный текст */
    --border-color: #35297d;       /* Цвет границ */
    --success-color: #00ffbb;      /* Зеленый успех */
    --error-color: #ff3366;        /* Красный ошибка */
    --warning-color: #ffbf00;      /* Желтый предупреждение */
    --info-color: #00aaff;         /* Синий информация */
    --danger-color: #ff3366;       /* Красный опасность */
    
    /* Градиенты */
    --gradient-primary: linear-gradient(135deg, #8a2be2, #b15eff);
    --gradient-accent: linear-gradient(135deg, #b15eff, #ff00ff);
    
    /* Тени и эффекты */
    --shadow: 0 4px 12px rgba(138, 43, 226, 0.2);
    --shadow-md: 0 6px 16px rgba(138, 43, 226, 0.4);
    --shadow-lg: 0 10px 30px rgba(138, 43, 226, 0.6);
    --glow: 0 0 10px rgba(138, 43, 226, 0.5), 0 0 20px rgba(138, 43, 226, 0.3);
    --glow-accent: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3);
    
    /* Переходы */
    --transition: all 0.3s ease;
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
}
```

### Ключевые элементы дизайна
- **Анимированный фон** с плавающими пузырьками
- **Градиентные кнопки** с неоновым свечением
- **Карточки** с тенями и скругленными углами
- **Иконки Font Awesome** для всех элементов
- **Плавные переходы** и анимации
- **Неоновые акценты** для важных элементов

## 🏗 Основные компоненты

### 1. MailSlurpApp (app.js)
**Центральный контроллер приложения**
```javascript
class MailSlurpApp {
    constructor() {
        this.api = new MailSlurpApi();
        this.ui = new MailSlurpUI(this);
        this.generator = new DataGenerator();
        this.i18n = new I18nManager();
        this.performanceOptimizer = new PerformanceOptimizer();
    }
    
    // Основные методы:
    // - init() - инициализация приложения
    // - createInbox() - создание почтового ящика
    // - deleteInbox() - удаление ящика
    // - loadEmails() - загрузка писем
    // - sendEmail() - отправка письма
    // - switchLanguage() - переключение языка
}
```

### 2. MailSlurpApi (api.js)
**API клиент для работы с MailSlurp**
```javascript
class MailSlurpApi {
    constructor() {
        this.keyPool = new ApiKeyPool();
        this.keyManager = new ApiKeyManager();
        this.baseUrl = 'https://api.mailslurp.com';
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }
    
    // Основные методы:
    // - createInbox() - создание ящика
    // - getInboxes() - получение списка ящиков
    // - deleteInbox() - удаление ящика
    // - getEmails() - получение писем
    // - sendEmail() - отправка письма
    // - waitForLatestEmail() - ожидание нового письма
    // - checkConnection() - проверка соединения
    // - switchApiMode() - переключение режима API
}
```

### 3. MailSlurpUI (ui.js)
**Управление UI компонентами**
```javascript
class MailSlurpUI {
    constructor(app) {
        this.app = app;
        this.navItems = document.querySelectorAll('.nav-item');
        this.contentSections = document.querySelectorAll('.content-section');
        this.modals = document.querySelectorAll('.modal');
    }
    
    // Основные методы:
    // - setupEventListeners() - настройка обработчиков
    // - showSection() - показ секции
    // - showModal() - показ модального окна
    // - hideModal() - скрытие модального окна
    // - updateInboxesList() - обновление списка ящиков
    // - updateEmailsList() - обновление списка писем
    // - showToast() - показ уведомления
}
```

### 4. ApiKeyPool (api-key-pool.js)
**Пул публичных API ключей**
```javascript
class ApiKeyPool {
    constructor() {
        this.publicKeys = [
            { key: "key1", usageCount: 0, isExhausted: false },
            { key: "key2", usageCount: 0, isExhausted: false },
            { key: "key3", usageCount: 0, isExhausted: false },
            { key: "key4", usageCount: 0, isExhausted: false },
            { key: "key5", usageCount: 0, isExhausted: false }
        ];
    }
    
    // Основные методы:
    // - getNextAvailableKey() - получение следующего ключа
    // - markCurrentKeyExhausted() - пометка ключа как исчерпанного
    // - getPoolStatus() - статус пула ключей
    // - resetPool() - сброс пула
}
```

### 5. DataGenerator (generator.js)
**Генератор тестовых данных**
```javascript
class DataGenerator {
    constructor() {
        this.femaleNames = ['Emma', 'Olivia', 'Ava', ...];
        this.maleNames = ['Liam', 'Noah', 'William', ...];
        this.lastNames = ['Smith', 'Johnson', 'Williams', ...];
    }
    
    // Основные методы:
    // - generateUserData() - генерация данных пользователя
    // - generateFirstName() - генерация имени
    // - generateLastName() - генерация фамилии
    // - generateLogin() - генерация логина
    // - generatePassword() - генерация пароля
}
```

### 6. I18nManager (i18n.js)
**Интернационализация**
```javascript
class I18nManager {
    constructor() {
        this.currentLang = 'ru';
        this.translations = {
            ru: { /* русские переводы */ },
            en: { /* английские переводы */ }
        };
    }
    
    // Основные методы:
    // - setLanguage() - установка языка
    // - t() - получение перевода
    // - initEvents() - инициализация событий
}
```

## ⚡ Функциональность

### Основные возможности
- ✅ **Создание временных почтовых ящиков** с автоматической генерацией адресов
- ✅ **Просмотр входящих писем** в реальном времени с уведомлениями
- ✅ **Отправка писем** с поддержкой HTML, Markdown и обычного текста
- ✅ **Удаление почтовых ящиков и писем** с подтверждением
- ✅ **Автоматическое удаление ящиков** через 5 минут (публичный API)
- ✅ **Генератор тестовых данных** для регистрации на сайтах
- ✅ **Многоязычность** (русский/английский) с переключателем
- ✅ **Адаптивный дизайн** для всех устройств
- ✅ **Мобильная навигация** с фиксированным меню

### Дополнительные функции
- 🔑 **Управление API ключами** (публичные/персональные/комбинированные)
- 📊 **Статистика использования** ящиков, писем, API запросов
- ⚙️ **Настройки** тайм-аутов, автоудаления, логирования
- 🎨 **Современный UI** с анимациями и неоновыми эффектами
- 📱 **Мобильная оптимизация** с touch-интерфейсом
- 🔒 **Секретный код** для отключения автоудаления
- 💰 **Premium секция** с информацией о персональных ключах
- ❤️ **Поддержка проекта** с возможностью донатов

## 🔌 API интеграция

### MailSlurp API endpoints
```javascript
const API_ENDPOINTS = {
    // Управление ящиками
    CREATE_INBOX: 'POST /inboxes',
    GET_INBOXES: 'GET /inboxes',
    DELETE_INBOX: 'DELETE /inboxes/{id}',
    GET_INBOX: 'GET /inboxes/{id}',
    
    // Управление письмами
    GET_EMAILS: 'GET /emails',
    GET_EMAIL: 'GET /emails/{id}',
    SEND_EMAIL: 'POST /inboxes/{id}',
    DELETE_EMAIL: 'DELETE /emails/{id}',
    WAIT_FOR_EMAIL: 'GET /waitForLatestEmail',
    
    // Управление вложениями
    GET_ATTACHMENT: 'GET /attachments/{id}',
    
    // Информация об аккаунте
    GET_USER_INFO: 'GET /user/info'
};
```

### Система API ключей
- **Пул из 5 публичных ключей** с автоматической ротацией
- **Поддержка персональных ключей** пользователя
- **Отслеживание лимитов** и автоматическое переключение
- **Три режима работы**:
  - `public` - только публичные ключи
  - `personal` - только персональный ключ
  - `combined` - комбинированный режим

### Обработка ошибок
```javascript
// Система повторных попыток с экспоненциальной задержкой
async withRetry(requestFn) {
    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;
            if (attempt < this.maxRetries - 1) {
                await this.delay(this.retryDelay * Math.pow(2, attempt));
            }
        }
    }
    throw lastError;
}
```

## 📱 Мобильная версия

### Особенности мобильного интерфейса
- **Фиксированная навигация** внизу экрана
- **Скрытие/показ навигации** при скролле
- **Адаптивные таблицы** с горизонтальным скроллом
- **Touch-оптимизированные** элементы управления
- **Отдельные стили** для мобильных устройств
- **Упрощенная навигация** с иконками

### Мобильная навигация
```html
<div class="mobile-fixed-nav">
    <div class="mobile-nav-item active" data-target="inboxes-section">
        <i class="fas fa-inbox"></i>
        <span>Ящики</span>
    </div>
    <div class="mobile-nav-item" data-target="emails-section">
        <i class="fas fa-envelope"></i>
        <span>Письма</span>
    </div>
    <div class="mobile-nav-item" data-target="settings-section">
        <i class="fas fa-cog"></i>
        <span>Настройки</span>
    </div>
    <div class="mobile-nav-item" data-target="premium-section">
        <i class="fas fa-key"></i>
        <span>Premium</span>
    </div>
</div>
```

## 🌍 Интернационализация

### Поддерживаемые языки
- **Русский** (по умолчанию)
- **Английский**

### Система переводов
```javascript
const translations = {
    ru: {
        app_name: "NeuroMail",
        nav_inboxes: "Почтовые ящики",
        nav_emails: "Письма",
        nav_settings: "Настройки",
        create_new_inbox: "Создать новый",
        inbox_loading: "Загрузка почтовых ящиков...",
        // ... остальные переводы
    },
    en: {
        app_name: "NeuroMail",
        nav_inboxes: "Mailboxes",
        nav_emails: "Emails",
        nav_settings: "Settings",
        create_new_inbox: "Create New",
        inbox_loading: "Loading mailboxes...",
        // ... остальные переводы
    }
};
```

### Переключатель языков
```html
<div class="language-switcher">
    <button id="lang-ru" class="lang-btn active" data-lang="ru">RU</button>
    <button id="lang-en" class="lang-btn" data-lang="en">EN</button>
</div>
```

## 🚀 Производительность

### Оптимизации
- **Ленивая загрузка** изображений в письмах
- **Throttling** для событий скролла
- **Батчинг DOM обновлений** при быстрых взаимодействиях
- **Кэширование API ответов** в localStorage
- **Оптимизация для мобильных** устройств
- **Минификация CSS и JS** для продакшена

### PerformanceOptimizer класс
```javascript
class PerformanceOptimizer {
    constructor() {
        this.scrollThrottle = 16; // 60fps
        this.resizeThrottle = 100;
    }
    
    // Основные методы:
    // - throttleScroll() - оптимизация скролла
    // - throttleResize() - оптимизация изменения размера
    // - lazyLoadImages() - ленивая загрузка изображений
    // - batchDOMUpdates() - батчинг обновлений DOM
}
```

## 🔒 Безопасность

### Меры безопасности
- **Санитизация HTML контента** писем перед отображением
- **Валидация API ключей** перед использованием
- **Очистка localStorage** от устаревших данных
- **Защита от XSS атак** в содержимом писем
- **CORS настройки** для API запросов
- **Валидация пользовательского ввода**

### Санитизация контента
```javascript
sanitizeHtmlContent(html) {
    // Добавляем target="_blank" и rel="noopener noreferrer" 
    // ко всем внешним ссылкам
    return html.replace(/<a\s+(?:[^>]*?\s+)?href=(['"])(http[^'"]+)\1/gi, 
        '<a href=$1$2$1 target="_blank" rel="noopener noreferrer"');
}
```

## 🎯 Дополнительные компоненты

### 1. Генератор данных
```javascript
class DataGenerator {
    generateUserData() {
        return {
            firstName: this.generateFirstName(),
            lastName: this.generateLastName(),
            login: this.generateLogin(),
            password: this.generatePassword(),
            email: this.generateEmail(),
            expiry: new Date(Date.now() + 5 * 60 * 1000) // 5 минут
        };
    }
}
```

### 2. Система уведомлений
```javascript
class ToastNotification {
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}
```

### 3. Модальные окна
- **Создание ящика** - подтверждение создания
- **Отправка письма** - форма с редактором
- **Подтверждение удаления** - безопасное удаление
- **Генератор данных** - отображение сгенерированных данных
- **Настройки** - конфигурация приложения

### 4. Статистика
- Количество созданных ящиков
- Количество полученных писем
- Количество отправленных писем
- Количество API запросов
- Статус подключения к API

## 🛠 Настройки приложения

### Конфигурируемые параметры
```javascript
const settings = {
    // API настройки
    emailWaitTimeout: 30,        // Ожидание письма (сек)
    httpTimeout: 10,             // Тайм-аут HTTP запроса (сек)
    
    // Автоудаление
    autoDeleteInboxes: true,     // Автоудаление ящиков
    autoDeleteEmails: true,      // Автоудаление писем
    autoDeleteDays: 7,           // Возраст писем для удаления
    inboxDeleteTimer: 10,        // Таймер удаления ящика (мин)
    
    // Логирование
    enableLogging: true,         // Включить журналирование
    saveLogToFile: true,         // Сохранять в файл
    logFilePath: './mailslurp.log' // Путь к файлу лога
};
```

## 💰 Premium функции

### Секция Premium
- **Информация о персональных API ключах**
- **Преимущества Premium подписки**
- **Способы получения ключа**
- **Контакты для покупки**
- **Отзывы пользователей**

### Секретный код
```javascript
// Секретный код для отключения автоудаления
const SECRET_CODE_HASH = 'bf8d24b69c1ac79babe38beac4839311'; // MD5 от "Skarn4202"

checkSecretCode(code) {
    const hash = this.md5(code);
    if (hash === SECRET_CODE_HASH) {
        this.secretCodeActivated = true;
        localStorage.setItem('secret_code_activated', 'true');
        return true;
    }
    return false;
}
```

## 🚀 Запуск проекта

### Локальный сервер
```bash
# Python (рекомендуется)
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000

# PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File start-server.ps1
```

### Доступ к приложению
- **URL**: `http://localhost:8000`
- **Порт**: 8000 (или любой другой доступный)

## 🧪 Тестирование

### Чек-лист тестирования
1. ✅ **Создание и удаление ящиков**
2. ✅ **Получение и отправка писем**
3. ✅ **Работа на мобильных устройствах**
4. ✅ **Переключение языков**
5. ✅ **Генератор данных**
6. ✅ **API ключи и их ротация**
7. ✅ **Модальные окна**
8. ✅ **Настройки приложения**
9. ✅ **Адаптивность дизайна**
10. ✅ **Производительность**

### Тестовые сценарии
```javascript
// Тестирование API ключей
const testApiKeys = async () => {
    const status = await window.mailSlurpApi.checkConnection();
    console.log('API Status:', status);
    
    const poolStatus = window.mailSlurpApi.getPublicKeyPoolStatus();
    console.log('Pool Status:', poolStatus);
};

// Тестирование создания ящика
const testCreateInbox = async () => {
    try {
        const inbox = await window.mailSlurpApi.createInbox();
        console.log('Created inbox:', inbox);
    } catch (error) {
        console.error('Error creating inbox:', error);
    }
};
```

## 📚 Документация

### README.md
```markdown
# NeuroMail - Временные почтовые ящики

## Описание
NeuroMail - это современный веб-сервис для работы с временными почтовыми ящиками через API MailSlurp.

## Возможности
- Создание временных email-адресов
- Получение писем в реальном времени
- Отправка писем с поддержкой HTML/Markdown
- Генератор тестовых данных
- Многоязычность (RU/EN)
- Адаптивный дизайн

## Установка
1. Клонируйте репозиторий
2. Запустите локальный сервер
3. Откройте http://localhost:8000

## Использование
1. Создайте почтовый ящик
2. Используйте адрес для регистрации
3. Получайте письма в реальном времени
4. Удаляйте ящики после использования
```

## 🎨 Дополнительные элементы дизайна

### Анимированный фон
```css
.animated-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
}

.animated-bubble {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(138, 43, 226, 0.3), transparent);
    animation: float 6s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
}
```

### Неоновые эффекты
```css
.neon-glow {
    box-shadow: 
        0 0 5px var(--primary-color),
        0 0 10px var(--primary-color),
        0 0 15px var(--primary-color),
        0 0 20px var(--primary-color);
    animation: neon-pulse 2s ease-in-out infinite alternate;
}

@keyframes neon-pulse {
    from { box-shadow: 0 0 5px var(--primary-color); }
    to { box-shadow: 0 0 20px var(--primary-color), 0 0 30px var(--primary-color); }
}
```

## 🔧 Конфигурация

### Переменные окружения
```javascript
const config = {
    // API настройки
    MAILSLURP_BASE_URL: 'https://api.mailslurp.com',
    API_TIMEOUT: 10000,
    MAX_RETRIES: 3,
    
    // Настройки приложения
    INBOX_LIFETIME: 5 * 60 * 1000, // 5 минут
    EMAIL_CHECK_INTERVAL: 5000,    // 5 секунд
    MAX_INBOXES_PER_USER: 10,
    
    // Настройки UI
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 300,
    MOBILE_BREAKPOINT: 768
};
```

## 📱 PWA возможности

### Манифест приложения
```json
{
    "name": "NeuroMail",
    "short_name": "NeuroMail",
    "description": "Временные почтовые ящики",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0f0b21",
    "theme_color": "#8a2be2",
    "icons": [
        {
            "src": "img/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "img/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

## 🎯 Заключение

Этот промт содержит все необходимые детали для создания полнофункционального веб-приложения NeuroMail с современным дизайном, полной функциональностью и отличной производительностью. Приложение готово к использованию и может быть легко развернуто на любом хостинге.

### Ключевые особенности реализации:
- 🏗 **Модульная архитектура** с четким разделением ответственности
- 🎨 **Современный дизайн** в стиле киберпанк
- 📱 **Полная адаптивность** для всех устройств
- 🌍 **Многоязычность** с легким добавлением новых языков
- ⚡ **Высокая производительность** с оптимизациями
- 🔒 **Безопасность** с защитой от основных угроз
- 🚀 **Готовность к продакшену** с настройками и документацией

---

**Удачи в разработке! 🚀**
