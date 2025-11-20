/**
 * Оптимизатор производительности
 * Управляет оптимизацией UI и производительности приложения
 */
class PerformanceOptimizer {
    constructor() {
        this.scrollThrottle = 16; // 60fps
        this.resizeThrottle = 100;
        this.scrollTimeout = null;
        this.resizeTimeout = null;
        this.intersectionObserver = null;
        this.performanceMetrics = {
            renderTime: 0,
            apiResponseTime: 0,
            memoryUsage: 0
        };
        
        this.init();
    }

    /**
     * Инициализация оптимизатора
     */
    init() {
        this.setupScrollOptimization();
        this.setupResizeOptimization();
        this.setupLazyLoading();
        this.setupMemoryMonitoring();
        this.setupPerformanceMonitoring();
    }

    /**
     * Настроить оптимизацию скролла
     */
    setupScrollOptimization() {
        let ticking = false;
        
        const optimizedScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    }

    /**
     * Обработчик скролла
     */
    handleScroll() {
        // Скрытие/показ мобильной навигации
        const mobileNav = document.querySelector('.mobile-fixed-nav');
        if (mobileNav) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                mobileNav.classList.add('scrolled');
            } else {
                mobileNav.classList.remove('scrolled');
            }
        }

        // Ленивая загрузка изображений при скролле
        this.lazyLoadImages();
    }

    /**
     * Настроить оптимизацию изменения размера
     */
    setupResizeOptimization() {
        const optimizedResizeHandler = () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, this.resizeThrottle);
        };

        window.addEventListener('resize', optimizedResizeHandler);
    }

    /**
     * Обработчик изменения размера
     */
    handleResize() {
        // Обновление адаптивных элементов
        this.updateResponsiveElements();
        
        // Пересчет размеров модальных окон
        this.updateModalSizes();
    }

    /**
     * Настроить ленивую загрузку
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loadLazyElement(entry.target);
                            this.intersectionObserver.unobserve(entry.target);
                        }
                    });
                },
                {
                    rootMargin: '50px 0px',
                    threshold: 0.1
                }
            );

            // Наблюдать за элементами с data-lazy
            document.addEventListener('DOMContentLoaded', () => {
                this.observeLazyElements();
            });
        }
    }

    /**
     * Наблюдать за ленивыми элементами
     */
    observeLazyElements() {
        const lazyElements = document.querySelectorAll('[data-lazy]');
        lazyElements.forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }

    /**
     * Загрузить ленивый элемент
     * @param {Element} element - Элемент для загрузки
     */
    loadLazyElement(element) {
        const src = element.dataset.lazy;
        if (src) {
            if (element.tagName === 'IMG') {
                element.src = src;
                element.classList.add('loaded');
            } else if (element.tagName === 'IFRAME') {
                element.src = src;
                element.classList.add('loaded');
            }
        }
    }

    /**
     * Ленивая загрузка изображений
     */
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-lazy]:not(.loaded)');
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                this.loadLazyElement(img);
            }
        });
    }

    /**
     * Настроить мониторинг памяти
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
                
                // Предупреждение о высоком использовании памяти
                if (this.performanceMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
                    console.warn('Высокое использование памяти:', this.performanceMetrics.memoryUsage);
                    this.cleanupMemory();
                }
            }, 30000); // Каждые 30 секунд
        }
    }

    /**
     * Настроить мониторинг производительности
     */
    setupPerformanceMonitoring() {
        // Мониторинг времени рендеринга
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'measure') {
                    this.performanceMetrics.renderTime = entry.duration;
                }
            }
        });

        observer.observe({ entryTypes: ['measure'] });

        // Мониторинг API запросов
        this.monitorApiPerformance();
    }

    /**
     * Мониторинг производительности API
     */
    monitorApiPerformance() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = function(...args) {
            const startTime = performance.now();
            
            return originalFetch.apply(this, args).then(response => {
                const endTime = performance.now();
                self.performanceMetrics.apiResponseTime = endTime - startTime;
                
                // Логирование медленных запросов
                if (self.performanceMetrics.apiResponseTime > 5000) { // 5 секунд
                    console.warn('Медленный API запрос:', self.performanceMetrics.apiResponseTime + 'ms');
                }
                
                return response;
            });
        };
    }

    /**
     * Очистка памяти
     */
    cleanupMemory() {
        // Очистка неиспользуемых элементов DOM
        const unusedElements = document.querySelectorAll('.unused, .hidden');
        unusedElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });

        // Очистка кэша изображений
        this.clearImageCache();

        // Принудительная сборка мусора (если доступна)
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Очистка кэша изображений
     */
    clearImageCache() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.complete && img.naturalWidth === 0) {
                img.src = '';
            }
        });
    }

    /**
     * Батчинг DOM обновлений
     * @param {Function} updateFunction - Функция обновления
     */
    batchDOMUpdates(updateFunction) {
        requestAnimationFrame(() => {
            updateFunction();
        });
    }

    /**
     * Дебаунс функции
     * @param {Function} func - Функция для дебаунса
     * @param {number} wait - Время ожидания
     * @returns {Function} Дебаунсированная функция
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Троттлинг функции
     * @param {Function} func - Функция для троттлинга
     * @param {number} limit - Лимит времени
     * @returns {Function} Троттлированная функция
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Обновить адаптивные элементы
     */
    updateResponsiveElements() {
        const isMobile = window.innerWidth <= 768;
        
        // Обновить классы для мобильных устройств
        document.body.classList.toggle('mobile', isMobile);
        
        // Обновить размеры модальных окон
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            if (isMobile) {
                modal.style.width = '95%';
                modal.style.maxWidth = 'none';
            } else {
                modal.style.width = '';
                modal.style.maxWidth = '';
            }
        });
    }

    /**
     * Обновить размеры модальных окон
     */
    updateModalSizes() {
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            const rect = modal.getBoundingClientRect();
            if (rect.height > window.innerHeight * 0.9) {
                modal.style.maxHeight = '90vh';
                modal.style.overflowY = 'auto';
            }
        });
    }

    /**
     * Оптимизировать анимации
     */
    optimizeAnimations() {
        // Отключить анимации на слабых устройствах
        if (this.isLowEndDevice()) {
            document.body.classList.add('no-animations');
        }

        // Использовать CSS transforms вместо изменения позиции
        const animatedElements = document.querySelectorAll('.animated');
        animatedElements.forEach(element => {
            element.style.willChange = 'transform';
        });
    }

    /**
     * Проверить, является ли устройство слабым
     * @returns {boolean} true если устройство слабое
     */
    isLowEndDevice() {
        // Проверка по количеству ядер процессора
        const cores = navigator.hardwareConcurrency || 2;
        
        // Проверка по памяти
        const memory = navigator.deviceMemory || 4;
        
        // Проверка по соединению
        const connection = navigator.connection;
        const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
        
        return cores <= 2 || memory <= 2 || isSlowConnection;
    }

    /**
     * Предзагрузка критических ресурсов
     */
    preloadCriticalResources() {
        const criticalImages = [
            'img/mail-logo.svg',
            'img/favicon.ico'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    /**
     * Оптимизировать загрузку шрифтов
     */
    optimizeFontLoading() {
        // Предзагрузка шрифтов
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
    }

    /**
     * Получить метрики производительности
     * @returns {Object} Метрики производительности
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            memoryInfo: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            timing: performance.timing ? {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            } : null
        };
    }

    /**
     * Создать отчет о производительности
     * @returns {string} Отчет в формате JSON
     */
    generatePerformanceReport() {
        const metrics = this.getPerformanceMetrics();
        return JSON.stringify(metrics, null, 2);
    }

    /**
     * Очистка ресурсов
     */
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        clearTimeout(this.scrollTimeout);
        clearTimeout(this.resizeTimeout);
        
        // Восстановить оригинальный fetch
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
