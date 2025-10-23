/**
 * Пул публичных API ключей для MailSlurp
 * Автоматическая ротация при исчерпании лимитов
 */
class ApiKeyPool {
    constructor() {
        // Публичные API ключи, предоставленные Khan
        this.publicKeys = [
            { 
                key: "69c1983367897df2e0f28e68eeab1567312e7b8cb63b32924b13f09b4e5ef959", 
                usageCount: 0, 
                isExhausted: false,
                lastUsed: null,
                errorCount: 0
            },
            { 
                key: "0d71400fe28471738cf0b933ffaa701d9ce7d9e09e07d52c271753c387f8bfcb", 
                usageCount: 0, 
                isExhausted: false,
                lastUsed: null,
                errorCount: 0
            },
            { 
                key: "07da08f927f3c354bddcba093f38ee83f37ee265c7e1000e35a4ef236e5a43cb", 
                usageCount: 0, 
                isExhausted: false,
                lastUsed: null,
                errorCount: 0
            }
        ];
        
        this.currentKeyIndex = 0;
        this.maxUsagePerKey = 100; // Максимальное количество использований на ключ
        this.maxErrorsPerKey = 5; // Максимальное количество ошибок на ключ
    }

    /**
     * Получить следующий доступный API ключ
     * @returns {string|null} API ключ или null если все ключи исчерпаны
     */
    getNextAvailableKey() {
        // Проверяем текущий ключ
        let attempts = 0;
        const maxAttempts = this.publicKeys.length;
        
        while (attempts < maxAttempts) {
            const currentKey = this.publicKeys[this.currentKeyIndex];
            
            if (!currentKey.isExhausted && currentKey.errorCount < this.maxErrorsPerKey) {
                return currentKey.key;
            }
            
            // Переходим к следующему ключу
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.publicKeys.length;
            attempts++;
        }
        
        // Если все ключи исчерпаны, сбрасываем счетчики
        console.warn('Все публичные API ключи исчерпаны, сбрасываем счетчики');
        this.resetPool();
        
        return this.publicKeys[this.currentKeyIndex].key;
    }

    /**
     * Отметить текущий ключ как использованный
     * @param {boolean} hasError - Была ли ошибка при использовании
     */
    markCurrentKeyUsed(hasError = false) {
        const currentKey = this.publicKeys[this.currentKeyIndex];
        
        if (currentKey) {
            currentKey.usageCount++;
            currentKey.lastUsed = new Date();
            
            if (hasError) {
                currentKey.errorCount++;
            }
            
            // Проверяем, не исчерпан ли ключ
            if (currentKey.usageCount >= this.maxUsagePerKey || 
                currentKey.errorCount >= this.maxErrorsPerKey) {
                currentKey.isExhausted = true;
                console.log(`API ключ ${this.currentKeyIndex + 1} исчерпан. Переключение на следующий.`);
            }
        }
    }

    /**
     * Получить статус пула ключей
     * @returns {Object} Статус пула
     */
    getPoolStatus() {
        const totalKeys = this.publicKeys.length;
        const availableKeys = this.publicKeys.filter(key => !key.isExhausted && key.errorCount < this.maxErrorsPerKey).length;
        const exhaustedKeys = this.publicKeys.filter(key => key.isExhausted || key.errorCount >= this.maxErrorsPerKey).length;
        
        return {
            total: totalKeys,
            available: availableKeys,
            exhausted: exhaustedKeys,
            currentIndex: this.currentKeyIndex,
            keys: this.publicKeys.map((key, index) => ({
                index: index + 1,
                usageCount: key.usageCount,
                errorCount: key.errorCount,
                isExhausted: key.isExhausted,
                lastUsed: key.lastUsed,
                isCurrent: index === this.currentKeyIndex
            }))
        };
    }

    /**
     * Сбросить пул ключей
     */
    resetPool() {
        this.publicKeys.forEach(key => {
            key.usageCount = 0;
            key.isExhausted = false;
            key.errorCount = 0;
            key.lastUsed = null;
        });
        this.currentKeyIndex = 0;
        console.log('Пул API ключей сброшен');
    }

    /**
     * Принудительно переключиться на следующий ключ
     */
    switchToNextKey() {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.publicKeys.length;
        console.log(`Переключение на API ключ ${this.currentKeyIndex + 1}`);
    }

    /**
     * Получить информацию о текущем ключе
     * @returns {Object} Информация о текущем ключе
     */
    getCurrentKeyInfo() {
        const currentKey = this.publicKeys[this.currentKeyIndex];
        return {
            index: this.currentKeyIndex + 1,
            usageCount: currentKey.usageCount,
            errorCount: currentKey.errorCount,
            isExhausted: currentKey.isExhausted,
            lastUsed: currentKey.lastUsed,
            remainingUsage: Math.max(0, this.maxUsagePerKey - currentKey.usageCount),
            remainingErrors: Math.max(0, this.maxErrorsPerKey - currentKey.errorCount)
        };
    }

    /**
     * Проверить, есть ли доступные ключи
     * @returns {boolean} true если есть доступные ключи
     */
    hasAvailableKeys() {
        return this.publicKeys.some(key => !key.isExhausted && key.errorCount < this.maxErrorsPerKey);
    }

    /**
     * Получить статистику использования
     * @returns {Object} Статистика использования
     */
    getUsageStats() {
        const totalUsage = this.publicKeys.reduce((sum, key) => sum + key.usageCount, 0);
        const totalErrors = this.publicKeys.reduce((sum, key) => sum + key.errorCount, 0);
        
        return {
            totalUsage,
            totalErrors,
            averageUsagePerKey: totalUsage / this.publicKeys.length,
            averageErrorsPerKey: totalErrors / this.publicKeys.length,
            mostUsedKey: this.publicKeys.reduce((max, key) => 
                key.usageCount > max.usageCount ? key : max
            ),
            leastUsedKey: this.publicKeys.reduce((min, key) => 
                key.usageCount < min.usageCount ? key : min
            )
        };
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiKeyPool;
}
