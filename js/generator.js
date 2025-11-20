/**
 * Генератор тестовых данных для регистрации
 * Создает реалистичные данные пользователей
 */
class DataGenerator {
    constructor() {
        this.geminiApi = new GeminiApi();
        this.femaleNames = [
            'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia',
            'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Mila', 'Ella', 'Avery',
            'Sofia', 'Camila', 'Aria', 'Scarlett', 'Victoria', 'Madison', 'Luna', 'Grace',
            'Chloe', 'Penelope', 'Layla', 'Riley', 'Zoey', 'Nora', 'Lily', 'Eleanor',
            'Hannah', 'Lillian', 'Addison', 'Aubrey', 'Ellie', 'Stella', 'Natalie', 'Zoe',
            'Leah', 'Hazel', 'Violet', 'Aurora', 'Savannah', 'Audrey', 'Brooklyn', 'Bella',
            'Claire', 'Skylar', 'Lucy', 'Paisley', 'Everly', 'Anna', 'Caroline', 'Nova',
            'Genesis', 'Aaliyah', 'Kennedy', 'Kinsley', 'Allison', 'Maya', 'Sarah', 'Madelyn',
            'Adeline', 'Alexa', 'Ariana', 'Elena', 'Gabriella', 'Naomi', 'Alice', 'Sadie',
            'Hailey', 'Eva', 'Emilia', 'Autumn', 'Quinn', 'Nevaeh', 'Piper', 'Ruby',
            'Serenity', 'Willow', 'Everleigh', 'Cora', 'Kaylee', 'Lydia', 'Aubree', 'Arianna',
            'Eliana', 'Peyton', 'Melody', 'Gianna', 'Isabelle', 'Julia', 'Valentina', 'Clara',
            // Польские имена
            'Anna', 'Maria', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Krystyna', 'Barbara', 'Ewa',
            'Elżbieta', 'Zofia', 'Janina', 'Magdalena', 'Monika', 'Jadwiga', 'Danuta', 'Irena',
            'Halina', 'Helena', 'Beata', 'Aleksandra', 'Marianna', 'Joanna', 'Wanda', 'Alina',
            'Mirosława', 'Stanisława', 'Grażyna', 'Bożena', 'Urszula', 'Wiesława', 'Genowefa',
            // Казахские имена
            'Айгүл', 'Айжан', 'Айнур', 'Айша', 'Алма', 'Алтынай', 'Амина', 'Асель',
            'Гүлнар', 'Динара', 'Жанар', 'Жанна', 'Зейнеп', 'Камила', 'Лейла', 'Мадина',
            'Назгуль', 'Нургуль', 'Раушан', 'Сауле', 'Сәуле', 'Толкын', 'Фатима', 'Шолпан'
        ];

        this.maleNames = [
            'Liam', 'Noah', 'William', 'James', 'Oliver', 'Benjamin', 'Elijah', 'Lucas',
            'Mason', 'Logan', 'Alexander', 'Ethan', 'Jacob', 'Michael', 'Daniel', 'Henry',
            'Jackson', 'Sebastian', 'Aiden', 'Matthew', 'Samuel', 'David', 'Joseph', 'Carter',
            'Owen', 'Wyatt', 'John', 'Jack', 'Luke', 'Jayden', 'Dylan', 'Grayson', 'Levi',
            'Isaac', 'Gabriel', 'Julian', 'Mateo', 'Anthony', 'Jaxon', 'Lincoln', 'Joshua',
            'Christopher', 'Andrew', 'Theodore', 'Caleb', 'Ryan', 'Asher', 'Nathan', 'Thomas',
            'Leo', 'Isaiah', 'Charles', 'Josiah', 'Hudson', 'Christian', 'Hunter', 'Connor',
            'Eli', 'Ezra', 'Aaron', 'Landon', 'Adrian', 'Jonathan', 'Nolan', 'Jeremiah',
            'Easton', 'Elias', 'Colton', 'Cameron', 'Carson', 'Robert', 'Angel', 'Maverick',
            'Nicholas', 'Dominic', 'Jaxson', 'Greyson', 'Adam', 'Ian', 'Austin', 'Santiago',
            'Jordan', 'Cooper', 'Brayden', 'Roman', 'Evan', 'Ezekiel', 'Xavier', 'Jose',
            'Jace', 'Jameson', 'Leonardo', 'Bryson', 'Axel', 'Everett', 'Parker', 'Kayden',
            'Miles', 'Sawyer', 'Jason', 'Declan', 'Weston', 'Micah', 'Ayden', 'Wesley',
            // Польские имена
            'Jan', 'Piotr', 'Andrzej', 'Krzysztof', 'Stanisław', 'Tomasz', 'Paweł', 'Marcin',
            'Michał', 'Marek', 'Grzegorz', 'Józef', 'Łukasz', 'Adam', 'Zbigniew', 'Henryk',
            'Ryszard', 'Kazimierz', 'Marian', 'Dariusz', 'Edward', 'Mieczysław', 'Eugeniusz',
            'Tadeusz', 'Edmund', 'Mariusz', 'Dawid', 'Kamil', 'Stefan', 'Robert', 'Zygmunt',
            // Казахские имена
            'Айдар', 'Айбек', 'Айдархан', 'Айтуар', 'Алмас', 'Алтынбек', 'Аман', 'Асхат',
            'Бахыт', 'Бекжан', 'Данияр', 'Ерлан', 'Жанат', 'Жаслан', 'Зайыр', 'Ибрагим',
            'Касым', 'Латиф', 'Марат', 'Нурлан', 'Олжас', 'Рамазан', 'Серик', 'Талгат',
            'Улан', 'Фарид', 'Хасан', 'Шынгыс', 'Эльдар', 'Юсуп', 'Ясыр'
        ];

        this.lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
            'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
            'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
            'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
            'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
            'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
            'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
            'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
            'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
            'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
            'Long', 'Ross', 'Foster', 'Jimenez',
            // Польские фамилии
            'Nowak', 'Kowalski', 'Wiśniewski', 'Dąbrowski', 'Lewandowski', 'Wójcik', 'Kamiński', 'Kowalczyk',
            'Zieliński', 'Szymański', 'Woźniak', 'Kozłowski', 'Jankowski', 'Wojciechowski', 'Kwiatkowski', 'Kaczmarek',
            'Mazur', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawłowski', 'Michalski', 'Nowicki',
            'Adamczyk', 'Dudek', 'Zając', 'Wieczorek', 'Jabłoński', 'Król', 'Majewski', 'Olszewski',
            // Казахские фамилии
            'Абдуллаев', 'Абдуллин', 'Абдурахманов', 'Абдурашидов', 'Абдусаламов', 'Абдусаттаров', 'Абдухаликов', 'Абдухамидов',
            'Абдуханов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов',
            'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов',
            'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов', 'Абдухарисов'
        ];

        this.domains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
            'protonmail.com', 'yandex.ru', 'mail.ru', 'rambler.ru', 'bk.ru', 'list.ru',
            'wp.pl', 'onet.pl', 'interia.pl', 'gazeta.pl', 'mail.kz', 'yandex.kz'
        ];

        this.companies = [
            'TechCorp', 'InnovateLab', 'DigitalWorks', 'CloudSoft', 'DataFlow', 'WebCraft',
            'CodeForge', 'ByteStream', 'NetSolutions', 'CyberTech', 'AppBuilder', 'DevStudio',
            'SoftWare', 'InfoTech', 'SystemCore', 'LogicGate', 'DataSync', 'CloudBase',
            'WebLogic', 'CodeBase', 'TechFlow', 'DigitalCore', 'NetCraft', 'AppLogic'
        ];

        this.jobTitles = [
            'Software Engineer', 'Web Developer', 'Data Analyst', 'Product Manager', 'UX Designer',
            'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
            'Mobile Developer', 'QA Engineer', 'System Administrator', 'Database Administrator',
            'Cloud Architect', 'Security Engineer', 'Machine Learning Engineer', 'Data Scientist',
            'Business Analyst', 'Project Manager', 'Technical Writer', 'UI Designer', 'Marketing Manager',
            'Sales Representative', 'Customer Success Manager', 'Operations Manager', 'HR Specialist'
        ];

        this.cities = [
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
            'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
            'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston',
            'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis',
            'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
            'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs', 'Raleigh', 'Miami',
            'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa'
        ];

        this.streets = [
            'Main St', 'Oak Ave', 'Pine St', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Park Ave',
            'First St', 'Second St', 'Third St', 'Washington St', 'Lincoln Ave', 'Jefferson St',
            'Madison Ave', 'Franklin St', 'Jackson St', 'Adams St', 'Monroe St', 'Wilson Ave',
            'Johnson St', 'Brown Ave', 'Davis St', 'Miller Ave', 'Wilson St', 'Moore Ave',
            'Taylor St', 'Anderson Ave', 'Thomas St', 'Jackson Ave', 'White St', 'Harris Ave',
            'Martin St', 'Thompson Ave', 'Garcia St', 'Martinez Ave', 'Robinson St', 'Clark Ave',
            'Rodriguez St', 'Lewis Ave', 'Lee St', 'Walker Ave', 'Hall St', 'Allen Ave',
            'Young St', 'Hernandez Ave', 'King St', 'Wright Ave', 'Lopez St', 'Hill Ave',
            'Scott St', 'Green Ave', 'Adams St', 'Baker Ave', 'Gonzalez St', 'Nelson Ave'
        ];
    }

    /**
     * Генерировать случайное число в диапазоне
     * @param {number} min - Минимум
     * @param {number} max - Максимум
     * @returns {number} Случайное число
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Генерировать случайный элемент из массива
     * @param {Array} array - Массив
     * @returns {*} Случайный элемент
     */
    randomChoice(array) {
        return array[this.randomInt(0, array.length - 1)];
    }

    /**
     * Генерировать случайное имя
     * @param {string} gender - Пол ('male' или 'female')
     * @returns {string} Имя
     */
    generateFirstName(gender = null) {
        if (!gender) {
            gender = this.randomChoice(['male', 'female']);
        }
        
        const names = gender === 'female' ? this.femaleNames : this.maleNames;
        return this.randomChoice(names);
    }

    /**
     * Генерировать случайную фамилию
     * @returns {string} Фамилия
     */
    generateLastName() {
        return this.randomChoice(this.lastNames);
    }

    /**
     * Генерировать полное имя
     * @param {string} gender - Пол
     * @returns {Object} Объект с именем и фамилией
     */
    generateFullName(gender = null) {
        const firstName = this.generateFirstName(gender);
        const lastName = this.generateLastName();
        
        return {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            gender: gender || (this.femaleNames.includes(firstName) ? 'female' : 'male')
        };
    }

    /**
     * Генерировать email адрес
     * @param {string} firstName - Имя
     * @param {string} lastName - Фамилия
     * @returns {string} Email адрес
     */
    generateEmail(firstName, lastName) {
        const domain = this.randomChoice(this.domains);
        const formats = [
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${this.randomInt(1, 999)}`,
            `${lastName.toLowerCase()}.${firstName.toLowerCase()}`,
            `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}.${lastName.charAt(0).toLowerCase()}${this.randomInt(1, 99)}`
        ];
        
        const username = this.randomChoice(formats);
        return `${username}@${domain}`;
    }

    /**
     * Генерировать логин
     * @param {string} firstName - Имя
     * @param {string} lastName - Фамилия
     * @returns {string} Логин
     */
    generateLogin(firstName, lastName) {
        const formats = [
            `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
            `${firstName.toLowerCase()}${this.randomInt(1, 999)}`,
            `${lastName.toLowerCase()}${firstName.charAt(0).toLowerCase()}`,
            `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}${this.randomInt(1, 99)}`
        ];
        
        return this.randomChoice(formats);
    }

    /**
     * Генерировать пароль
     * @param {number} length - Длина пароля
     * @returns {string} Пароль
     */
    generatePassword(length = 12) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';
        
        // Гарантируем наличие разных типов символов
        password += this.randomChoice(lowercase);
        password += this.randomChoice(uppercase);
        password += this.randomChoice(numbers);
        password += this.randomChoice(symbols);
        
        // Заполняем остальную длину
        for (let i = 4; i < length; i++) {
            password += this.randomChoice(allChars);
        }
        
        // Перемешиваем символы
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Генерировать номер телефона
     * @returns {string} Номер телефона
     */
    generatePhoneNumber() {
        const areaCode = this.randomInt(200, 999);
        const exchange = this.randomInt(200, 999);
        const number = this.randomInt(1000, 9999);
        return `+1 (${areaCode}) ${exchange}-${number}`;
    }

    /**
     * Генерировать адрес
     * @returns {Object} Адрес
     */
    generateAddress() {
        const streetNumber = this.randomInt(1, 9999);
        const street = this.randomChoice(this.streets);
        const city = this.randomChoice(this.cities);
        const state = this.randomChoice(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']);
        const zipCode = this.randomInt(10000, 99999);
        
        return {
            street: `${streetNumber} ${street}`,
            city,
            state,
            zipCode: zipCode.toString(),
            fullAddress: `${streetNumber} ${street}, ${city}, ${state} ${zipCode}`
        };
    }

    /**
     * Генерировать данные компании
     * @returns {Object} Данные компании
     */
    generateCompanyData() {
        const company = this.randomChoice(this.companies);
        const jobTitle = this.randomChoice(this.jobTitles);
        const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
        
        return {
            company,
            jobTitle,
            website: `https://www.${domain}`,
            email: `info@${domain}`
        };
    }

    /**
     * Генерировать дату рождения
     * @param {number} minAge - Минимальный возраст
     * @param {number} maxAge - Максимальный возраст
     * @returns {Object} Дата рождения
     */
    generateBirthDate(minAge = 18, maxAge = 65) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - this.randomInt(minAge, maxAge);
        const birthMonth = this.randomInt(1, 12);
        const birthDay = this.randomInt(1, 28); // Безопасный день для всех месяцев
        
        const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
        const age = currentYear - birthYear;
        
        return {
            birthDate: birthDate.toISOString().split('T')[0],
            age,
            birthYear,
            birthMonth,
            birthDay
        };
    }

    /**
     * Генерировать полные данные пользователя
     * @param {Object} options - Опции генерации
     * @returns {Object} Полные данные пользователя
     */
    generateUserData(options = {}) {
        const {
            gender = null,
            includeAddress = true,
            includeCompany = true,
            includeBirthDate = true,
            passwordLength = 12
        } = options;

        const nameData = this.generateFullName(gender);
        const email = this.generateEmail(nameData.firstName, nameData.lastName);
        const login = this.generateLogin(nameData.firstName, nameData.lastName);
        const password = this.generatePassword(passwordLength);
        const phoneNumber = this.generatePhoneNumber();
        
        const userData = {
            firstName: nameData.firstName,
            lastName: nameData.lastName,
            fullName: nameData.fullName,
            gender: nameData.gender,
            email,
            login,
            password,
            phoneNumber,
            expiry: new Date(Date.now() + 5 * 60 * 1000) // 5 минут
        };

        if (includeAddress) {
            userData.address = this.generateAddress();
        }

        if (includeCompany) {
            userData.company = this.generateCompanyData();
        }

        if (includeBirthDate) {
            userData.birthDate = this.generateBirthDate();
        }

        return userData;
    }

    /**
     * Генерировать данные пользователя с адресом через Gemini API
     * @param {string} country - Страна
     * @param {string} state - Штат/регион
     * @returns {Promise<Object>} Данные пользователя с адресом
     */
    async generateUserDataWithAddress(country, state) {
        try {
            // Генерируем базовые данные
            const nameData = this.generateFullName();
            const email = this.generateEmail(nameData.firstName, nameData.lastName);
            const login = this.generateLogin(nameData.firstName, nameData.lastName);
            const password = this.generatePassword();
            const phoneNumber = this.generatePhoneNumber();
            const birthDate = this.generateBirthDate();
            const companyData = this.generateCompanyData();

            // Получаем адресные данные через Gemini API
            const addressData = await this.geminiApi.generateAddressData(country, state);

            const userData = {
                firstName: nameData.firstName,
                lastName: nameData.lastName,
                fullName: nameData.fullName,
                gender: nameData.gender,
                email,
                login,
                password,
                phoneNumber: phoneNumber,
                birthDate,
                company: {
                    company: companyData.company,
                    jobTitle: companyData.jobTitle,
                    website: companyData.website,
                    email: companyData.email
                },
                address: {
                    country,
                    state,
                    city: addressData.city,
                    street: addressData.street,
                    houseNumber: addressData.houseNumber,
                    apartment: addressData.apartment,
                    postalCode: addressData.postalCode,
                    fullAddress: addressData.fullAddress
                },
                expiry: new Date(Date.now() + 5 * 60 * 1000) // 5 минут
            };

            return userData;
        } catch (error) {
            console.error('Ошибка генерации данных с адресом:', error);
            // Возвращаем базовые данные без адреса
            return this.generateUserData({ includeAddress: true });
        }
    }

    /**
     * Генерировать данные для регистрации на сайте
     * @param {string} siteName - Название сайта
     * @returns {Object} Данные для регистрации
     */
    generateRegistrationData(siteName = 'Website') {
        const userData = this.generateUserData({
            includeAddress: true,
            includeCompany: false,
            includeBirthDate: true
        });

        return {
            ...userData,
            siteName,
            registrationDate: new Date().toISOString(),
            temporaryEmail: userData.email,
            notes: `Временные данные для регистрации на ${siteName}`
        };
    }

    /**
     * Форматировать данные для отображения
     * @param {Object} data - Данные
     * @returns {string} HTML строка
     */
    formatDataForDisplay(data) {
        let html = '<div class="generated-data">';
        
        // Основная информация
        html += '<div class="data-section">';
        html += '<h4>👤 Основная информация</h4>';
        html += `<div class="data-item copyable" data-value="${data.firstName}">
                    <span class="data-label">Имя:</span>
                    <span class="data-value">${data.firstName}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.firstName}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += `<div class="data-item copyable" data-value="${data.lastName}">
                    <span class="data-label">Фамилия:</span>
                    <span class="data-value">${data.lastName}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.lastName}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += `<div class="data-item copyable" data-value="${data.fullName}">
                    <span class="data-label">Полное имя:</span>
                    <span class="data-value">${data.fullName}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.fullName}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += `<div class="data-item">
                    <span class="data-label">Пол:</span>
                    <span class="data-value">${data.gender === 'female' ? 'Женский' : 'Мужской'}</span>
                 </div>`;
        html += '</div>';

        // Контактная информация
        html += '<div class="data-section">';
        html += '<h4>📧 Контактная информация</h4>';
        html += `<div class="data-item copyable" data-value="${data.email}">
                    <span class="data-label">Email:</span>
                    <span class="data-value">${data.email}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.email}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += `<div class="data-item copyable" data-value="${data.login}">
                    <span class="data-label">Логин:</span>
                    <span class="data-value">${data.login}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.login}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += `<div class="data-item copyable" data-value="${data.password}">
                    <span class="data-label">Пароль:</span>
                    <span class="data-value password-field">
                        <span class="password-text">${data.password}</span>
                        <button class="toggle-password" onclick="togglePassword(this)" title="Показать/скрыть пароль">
                            <i class="fas fa-eye"></i>
                        </button>
                    </span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.password}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += `<div class="data-item copyable" data-value="${data.phoneNumber}">
                    <span class="data-label">Телефон:</span>
                    <span class="data-value">${data.phoneNumber}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${data.phoneNumber}')" title="Копировать">
                        <i class="fas fa-copy"></i>
                    </button>
                 </div>`;
        html += '</div>';

        // Адрес
        if (data.address) {
            html += '<div class="data-section">';
            html += '<h4>🏠 Адресная информация</h4>';
            html += `<div class="data-item copyable" data-value="${data.address.country}">
                        <span class="data-label">Страна:</span>
                        <span class="data-value">${data.address.country}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.country}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.state}">
                        <span class="data-label">Штат/Регион:</span>
                        <span class="data-value">${data.address.state}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.state}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.city}">
                        <span class="data-label">Город:</span>
                        <span class="data-value">${data.address.city}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.city}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.street}">
                        <span class="data-label">Улица:</span>
                        <span class="data-value">${data.address.street}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.street}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.houseNumber}">
                        <span class="data-label">Дом:</span>
                        <span class="data-value">${data.address.houseNumber}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.houseNumber}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.apartment}">
                        <span class="data-label">Квартира:</span>
                        <span class="data-value">${data.address.apartment}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.apartment}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.postalCode}">
                        <span class="data-label">Индекс:</span>
                        <span class="data-value">${data.address.postalCode}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.postalCode}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.address.fullAddress}">
                        <span class="data-label">Полный адрес:</span>
                        <span class="data-value">${data.address.fullAddress}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.address.fullAddress}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += '</div>';
        }

        // Компания
        if (data.company) {
            html += '<div class="data-section">';
            html += '<h4>🏢 Работа</h4>';
            html += `<div class="data-item copyable" data-value="${data.company.company}">
                        <span class="data-label">Компания:</span>
                        <span class="data-value">${data.company.company}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.company.company}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.company.jobTitle}">
                        <span class="data-label">Должность:</span>
                        <span class="data-value">${data.company.jobTitle}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.company.jobTitle}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item copyable" data-value="${data.company.website}">
                        <span class="data-label">Сайт:</span>
                        <span class="data-value">${data.company.website}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.company.website}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += '</div>';
        }

        // Дата рождения
        if (data.birthDate) {
            html += '<div class="data-section">';
            html += '<h4>🎂 Дата рождения</h4>';
            html += `<div class="data-item copyable" data-value="${data.birthDate.birthDate}">
                        <span class="data-label">Дата:</span>
                        <span class="data-value">${data.birthDate.birthDate}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.birthDate.birthDate}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                     </div>`;
            html += `<div class="data-item">
                        <span class="data-label">Возраст:</span>
                        <span class="data-value">${data.birthDate.age} лет</span>
                     </div>`;
            html += '</div>';
        }

        // Дополнительная информация
        html += '<div class="data-section">';
        html += '<h4>⏰ Временная информация</h4>';
        html += `<div class="data-item">
                    <span class="data-label">Создано:</span>
                    <span class="data-value">${new Date().toLocaleString()}</span>
                 </div>`;
        html += `<div class="data-item">
                    <span class="data-label">Истекает:</span>
                    <span class="data-value">${data.expiry.toLocaleString()}</span>
                 </div>`;
        html += '</div>';

        html += '</div>';
        return html;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGenerator;
}
