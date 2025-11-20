/**
 * Gemini API клиент для генерации адресных данных
 */
class GeminiApi {
    constructor() {
        this.apiKey = 'AIzaSyA3PiwMbmIzVKX3scHvQewSjMrd878hvrM';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    /**
     * Генерировать адресные данные для выбранной страны и штата
     * @param {string} country - Страна
     * @param {string} state - Штат/регион
     * @returns {Promise<Object>} Адресные данные
     */
    async generateAddressData(country, state) {
        try {
            const prompt = this.createAddressPrompt(country, state);
            const response = await this.makeRequest(prompt);
            return this.parseAddressResponse(response);
        } catch (error) {
            console.error('Ошибка генерации адресных данных:', error);
            return this.getFallbackAddress(country, state);
        }
    }

    /**
     * Создать промпт для генерации адреса
     * @param {string} country - Страна
     * @param {string} state - Штат/регион
     * @returns {string} Промпт
     */
    createAddressPrompt(country, state) {
        return `Сгенерируй реалистичный адрес для ${country}, ${state}. 
        Верни данные в формате JSON:
        {
            "city": "название города",
            "street": "название улицы",
            "houseNumber": "номер дома",
            "apartment": "номер квартиры",
            "postalCode": "почтовый индекс",
            "fullAddress": "полный адрес"
        }
        
        Используй реальные названия улиц и городов для ${country}, ${state}. 
        Почтовый индекс должен соответствовать формату ${country}.`;
    }

    /**
     * Выполнить запрос к Gemini API
     * @param {string} prompt - Промпт
     * @returns {Promise<Object>} Ответ API
     */
    async makeRequest(prompt) {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Парсить ответ от Gemini API
     * @param {Object} response - Ответ API
     * @returns {Object} Адресные данные
     */
    parseAddressResponse(response) {
        try {
            const text = response.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Не удалось найти JSON в ответе');
            }
        } catch (error) {
            console.error('Ошибка парсинга ответа:', error);
            return this.getFallbackAddress('USA', 'California');
        }
    }

    /**
     * Получить резервные адресные данные
     * @param {string} country - Страна
     * @param {string} state - Штат/регион
     * @returns {Object} Резервные данные
     */
    getFallbackAddress(country, state) {
        const fallbackData = {
            USA: {
                California: {
                    city: 'Los Angeles',
                    street: 'Sunset Boulevard',
                    houseNumber: Math.floor(Math.random() * 9999) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '90210',
                    fullAddress: ''
                },
                NewYork: {
                    city: 'New York',
                    street: 'Broadway',
                    houseNumber: Math.floor(Math.random() * 9999) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '10001',
                    fullAddress: ''
                },
                Texas: {
                    city: 'Houston',
                    street: 'Main Street',
                    houseNumber: Math.floor(Math.random() * 9999) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '77001',
                    fullAddress: ''
                }
            },
            Russia: {
                Moscow: {
                    city: 'Москва',
                    street: 'Тверская улица',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '101000',
                    fullAddress: ''
                },
                SaintPetersburg: {
                    city: 'Санкт-Петербург',
                    street: 'Невский проспект',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '190000',
                    fullAddress: ''
                }
            },
            Germany: {
                Bavaria: {
                    city: 'Munich',
                    street: 'Marienplatz',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '80331',
                    fullAddress: ''
                }
            },
            Poland: {
                Mazowieckie: {
                    city: 'Warsaw',
                    street: 'Krakowskie Przedmieście',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '00-001',
                    fullAddress: ''
                },
                Slaskie: {
                    city: 'Katowice',
                    street: 'Mariacka',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '40-001',
                    fullAddress: ''
                }
            },
            Kazakhstan: {
                Almaty: {
                    city: 'Алматы',
                    street: 'Абая',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '050000',
                    fullAddress: ''
                },
                NurSultan: {
                    city: 'Нур-Султан',
                    street: 'Нурсултан Назарбаев',
                    houseNumber: Math.floor(Math.random() * 200) + 1,
                    apartment: Math.floor(Math.random() * 200) + 1,
                    postalCode: '010000',
                    fullAddress: ''
                }
            }
        };

        const countryData = fallbackData[country] || fallbackData.USA;
        const stateData = countryData[state] || countryData.California;
        
        // Формируем полный адрес
        stateData.fullAddress = `${stateData.houseNumber} ${stateData.street}, Apt ${stateData.apartment}, ${stateData.city}, ${stateData.postalCode}`;
        
        return stateData;
    }

    /**
     * Получить список штатов/регионов для страны
     * @param {string} country - Страна
     * @returns {Array} Список штатов
     */
    getStatesForCountry(country) {
        const states = {
            USA: [
                { value: 'California', name: 'Калифорния' },
                { value: 'NewYork', name: 'Нью-Йорк' },
                { value: 'Texas', name: 'Техас' },
                { value: 'Florida', name: 'Флорида' },
                { value: 'Illinois', name: 'Иллинойс' },
                { value: 'Pennsylvania', name: 'Пенсильвания' },
                { value: 'Ohio', name: 'Огайо' },
                { value: 'Georgia', name: 'Джорджия' },
                { value: 'NorthCarolina', name: 'Северная Каролина' },
                { value: 'Michigan', name: 'Мичиган' }
            ],
            Russia: [
                { value: 'Moscow', name: 'Москва' },
                { value: 'SaintPetersburg', name: 'Санкт-Петербург' },
                { value: 'Novosibirsk', name: 'Новосибирск' },
                { value: 'Yekaterinburg', name: 'Екатеринбург' },
                { value: 'Kazan', name: 'Казань' },
                { value: 'NizhnyNovgorod', name: 'Нижний Новгород' },
                { value: 'Chelyabinsk', name: 'Челябинск' },
                { value: 'Omsk', name: 'Омск' },
                { value: 'Samara', name: 'Самара' },
                { value: 'Rostov', name: 'Ростов-на-Дону' }
            ],
            Germany: [
                { value: 'Bavaria', name: 'Бавария' },
                { value: 'BadenWurttemberg', name: 'Баден-Вюртемберг' },
                { value: 'NorthRhineWestphalia', name: 'Северный Рейн-Вестфалия' },
                { value: 'Hesse', name: 'Гессен' },
                { value: 'Saxony', name: 'Саксония' },
                { value: 'RhinelandPalatinate', name: 'Рейнланд-Пфальц' },
                { value: 'Berlin', name: 'Берлин' },
                { value: 'SchleswigHolstein', name: 'Шлезвиг-Гольштейн' },
                { value: 'Brandenburg', name: 'Бранденбург' },
                { value: 'SaxonyAnhalt', name: 'Саксония-Анхальт' }
            ],
            France: [
                { value: 'IleDeFrance', name: 'Иль-де-Франс' },
                { value: 'AuvergneRhoneAlpes', name: 'Овернь-Рона-Альпы' },
                { value: 'HautsDeFrance', name: 'О-де-Франс' },
                { value: 'Occitanie', name: 'Окситания' },
                { value: 'NouvelleAquitaine', name: 'Новая Аквитания' },
                { value: 'GrandEst', name: 'Гранд-Эст' },
                { value: 'PaysDeLaLoire', name: 'Пеи-де-ла-Луар' },
                { value: 'Brittany', name: 'Бретань' },
                { value: 'Normandy', name: 'Нормандия' },
                { value: 'ProvenceAlpesCoteDAzur', name: 'Прованс-Альпы-Лазурный берег' }
            ],
            UK: [
                { value: 'England', name: 'Англия' },
                { value: 'Scotland', name: 'Шотландия' },
                { value: 'Wales', name: 'Уэльс' },
                { value: 'NorthernIreland', name: 'Северная Ирландия' }
            ],
            Canada: [
                { value: 'Ontario', name: 'Онтарио' },
                { value: 'Quebec', name: 'Квебек' },
                { value: 'BritishColumbia', name: 'Британская Колумбия' },
                { value: 'Alberta', name: 'Альберта' },
                { value: 'Manitoba', name: 'Манитоба' },
                { value: 'Saskatchewan', name: 'Саскачеван' },
                { value: 'NovaScotia', name: 'Новая Шотландия' },
                { value: 'NewBrunswick', name: 'Нью-Брансуик' },
                { value: 'Newfoundland', name: 'Ньюфаундленд' },
                { value: 'PrinceEdwardIsland', name: 'Остров Принца Эдуарда' }
            ],
            Australia: [
                { value: 'NewSouthWales', name: 'Новый Южный Уэльс' },
                { value: 'Victoria', name: 'Виктория' },
                { value: 'Queensland', name: 'Квинсленд' },
                { value: 'WesternAustralia', name: 'Западная Австралия' },
                { value: 'SouthAustralia', name: 'Южная Австралия' },
                { value: 'Tasmania', name: 'Тасмания' },
                { value: 'AustralianCapitalTerritory', name: 'Австралийская столичная территория' },
                { value: 'NorthernTerritory', name: 'Северная территория' }
            ],
            Japan: [
                { value: 'Tokyo', name: 'Токио' },
                { value: 'Osaka', name: 'Осака' },
                { value: 'Kyoto', name: 'Киото' },
                { value: 'Yokohama', name: 'Иокогама' },
                { value: 'Nagoya', name: 'Нагоя' },
                { value: 'Sapporo', name: 'Саппоро' },
                { value: 'Fukuoka', name: 'Фукуока' },
                { value: 'Kobe', name: 'Кобе' },
                { value: 'Hiroshima', name: 'Хиросима' },
                { value: 'Sendai', name: 'Сендай' }
            ],
            Brazil: [
                { value: 'SaoPaulo', name: 'Сан-Паулу' },
                { value: 'RioDeJaneiro', name: 'Рио-де-Жанейро' },
                { value: 'MinasGerais', name: 'Минас-Жерайс' },
                { value: 'Bahia', name: 'Баия' },
                { value: 'Parana', name: 'Парана' },
                { value: 'RioGrandeDoSul', name: 'Риу-Гранди-ду-Сул' },
                { value: 'Pernambuco', name: 'Пернамбуку' },
                { value: 'Ceara', name: 'Сеара' },
                { value: 'Para', name: 'Пара' },
                { value: 'SantaCatarina', name: 'Санта-Катарина' }
            ],
            India: [
                { value: 'Maharashtra', name: 'Махараштра' },
                { value: 'UttarPradesh', name: 'Уттар-Прадеш' },
                { value: 'Bihar', name: 'Бихар' },
                { value: 'WestBengal', name: 'Западная Бенгалия' },
                { value: 'MadhyaPradesh', name: 'Мадхья-Прадеш' },
                { value: 'TamilNadu', name: 'Тамилнад' },
                { value: 'Rajasthan', name: 'Раджастхан' },
                { value: 'Karnataka', name: 'Карнатака' },
                { value: 'Gujarat', name: 'Гуджарат' },
                { value: 'AndhraPradesh', name: 'Андхра-Прадеш' }
            ],
            Poland: [
                { value: 'Mazowieckie', name: 'Мазовецкое' },
                { value: 'Slaskie', name: 'Силезское' },
                { value: 'Wielkopolskie', name: 'Великопольское' },
                { value: 'Malopolskie', name: 'Малопольское' },
                { value: 'Dolnoslaskie', name: 'Нижнесилезское' },
                { value: 'Lodzkie', name: 'Лодзинское' },
                { value: 'Lubelskie', name: 'Люблинское' },
                { value: 'Podkarpackie', name: 'Подкарпатское' },
                { value: 'KujawskoPomorskie', name: 'Куявско-Поморское' },
                { value: 'Zachodniopomorskie', name: 'Западно-Поморское' }
            ],
            Kazakhstan: [
                { value: 'Almaty', name: 'Алматы' },
                { value: 'NurSultan', name: 'Нур-Султан' },
                { value: 'Shymkent', name: 'Шымкент' },
                { value: 'Aktobe', name: 'Актобе' },
                { value: 'Taraz', name: 'Тараз' },
                { value: 'Pavlodar', name: 'Павлодар' },
                { value: 'Semey', name: 'Семей' },
                { value: 'Oskemen', name: 'Усть-Каменогорск' },
                { value: 'Oral', name: 'Уральск' },
                { value: 'Kyzylorda', name: 'Кызылорда' }
            ]
        };

        return states[country] || states.USA;
    }
}
