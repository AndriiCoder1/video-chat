/**
 * Регистрирует метрики веб-производительности (Web Vitals) и передает их через callback-функцию.
 * @param {Function} onPerfEntry - Callback-функция, которая будет вызываться при получении метрик.
 * @example
 * // Использование:
 * reportWebVitals(console.log); // Логирует метрики в консоль
 */
const reportWebVitals = onPerfEntry => {
  // Проверяем, что onPerfEntry является функцией
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Динамически импортируем библиотеку web-vitals для уменьшения размера бандла
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Регистрируем метрики:
      getCLS(onPerfEntry); // Cumulative Layout Shift (Визуальное смещение)
      getFID(onPerfEntry); // First Input Delay (Задержка первого ввода)
      getFCP(onPerfEntry); // First Contentful Paint (Первая отрисовка контента)
      getLCP(onPerfEntry); // Largest Contentful Paint (Отрисовка крупнейшего контента)
      getTTFB(onPerfEntry); // Time to First Byte (Время до первого байта)
    });
  }
};

export default reportWebVitals;