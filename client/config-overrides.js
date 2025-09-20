const { override } = require('customize-cra');

/**
 * Конфигурация для настройки Webpack Dev Server в Create React App
 * Используется customize-cra для переопределения стандартных настроек CRA
 */
module.exports = {
  /**
   * Настраивает конфигурацию dev сервера
   * @param {Function} configFunction - Оригинальная функция создания конфигурации dev сервера
   * @returns {Function} Новая функция конфигурации с примененными изменениями
   */
  devServer: function(configFunction) {
    // Возвращаем новую функцию конфигурации, которая заменит стандартную
    return function(proxy, allowedHost) {
      // Получаем стандартную конфигурацию dev сервера
      const config = configFunction(proxy, allowedHost);
      
       /**
       * Устанавливаем allowedHosts в 'all' для разрешения доступа с любых хостов
       * Это решает проблему с ошибкой "Invalid Host header" при доступе к dev серверу
       * с различных доменов или в Docker-контейнерах
       */
      config.allowedHosts = 'all';
      
      // Возвращаем измененную конфигурацию
      return config;
    };
  }
};