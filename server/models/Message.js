/**
 * Модель сообщения для приложения видеозвонков на языке жестов
 * 
 * Этот файл предоставляет структуру данных для сообщений в системе.
 * В текущей реализации используется класс Message с валидацией, но также
 * предоставлен пример схемы Mongoose для будущей интеграции с MongoDB.
 * 
 * Сообщения могут быть двух типов:
 * - text: текстовые сообщения
 * - sign: сообщения, содержащие жестовую информацию
 * 
 * @module models/Message
 * @version 1.0.0
 */

/**
 * Пример схемы Mongoose для интеграции с MongoDB (закомментировано)
 * В production-реализации рекомендуется использовать базу данных
 * для сохранения сообщений между перезапусками сервера
 * 
 * Раскомментируйте этот код при подключении MongoDB:
 * 
 * const mongoose = require('mongoose');
 * 
 * const MessageSchema = new mongoose.Schema({
 *   content: {
 *     type: String,
 *     required: true
 *   },
 *   type: {
 *     type: String,
 *     enum: ['text', 'sign'], // Ограничение допустимых значений
 *     required: true
 *   },
 *   userId: {
 *     type: String,
 *     required: true
 *   },
 *   username: {
 *     type: String,
 *     required: true
 *   },
 *   timestamp: {
 *     type: Date,
 *     default: Date.now // Автоматическая установка времени создания
 *   }
 * });
 * 
 * // Индексация для оптимизации запросов
 * MessageSchema.index({ timestamp: 1 });
 * MessageSchema.index({ userId: 1, timestamp: 1 });
 * 
 * module.exports = mongoose.model('Message', MessageSchema);
 */

/**
 * Класс Message - реализация модели сообщения для хранения в памяти
 * Используется как временное решение до подключения базы данных
 */
class Message {
  /**
   * Создает новый экземпляр сообщения
   * @param {string} id - Уникальный идентификатор сообщения
   * @param {string} content - Содержание сообщения (текст или описание жеста)
   * @param {string} type - Тип сообщения: 'text' или 'sign'
   * @param {string} userId - Идентификатор пользователя-отправителя
   * @param {string} username - Имя пользователя-отправителя
   * @param {Date} timestamp - Временная метка сообщения (по умолчанию текущее время)
   */
  constructor(id, content, type, userId, username, timestamp = new Date()) {
    this.id = id;
    this.content = content;
    this.type = type; // 'text' или 'sign'
    this.userId = userId;
    this.username = username;
    this.timestamp = timestamp;
  }
  
  /**
   * Валидирует данные сообщения перед созданием объекта
   * @static
   * @param {Object} messageData - Данные для валидации
   * @param {string} messageData.content - Содержание сообщения
   * @param {string} messageData.type - Тип сообщения
   * @param {string} messageData.userId - ID пользователя
   * @param {string} messageData.username - Имя пользователя
   * @returns {Object} Результат валидации {valid: boolean, error: string|null}
   * 
   * @example
   * // Пример использования:
   * const validation = Message.validate(messageData);
   * if (!validation.valid) {
   *   console.error(validation.error);
   * }
   */
  static validate(messageData) {
    const { content, type, userId, username } = messageData;
    
    // Проверка наличия и типа содержимого
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Content is required and must be a string' };
    }
    
    // Проверка типа сообщения (только text или sign)
    if (!type || !['text', 'sign'].includes(type)) {
      return { valid: false, error: 'Type is required and must be either "text" or "sign"' };
    }
    
    // Проверка идентификатора пользователя
    if (!userId || typeof userId !== 'string') {
      return { valid: false, error: 'User ID is required and must be a string' };
    }
    
    // Проверка имени пользователя
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required and must be a string' };
    }
    
    // Все проверки пройдены успешно
    return { valid: true };
  }

/**
   * Преобразует объект сообщения в формат для клиента
   * @returns {Object} Объект с данными сообщения
   */
  toClientFormat() {
    return {
      id: this.id,
      content: this.content,
      type: this.type,
      userId: this.userId,
      username: this.username,
      timestamp: this.timestamp.toISOString()
    };
  }
  
  /**
   * Создает экземпляр Message из данных объекта
   * @static
   * @param {Object} data - Данные для создания сообщения
   * @returns {Message} Экземпляр класса Message
   */
  static fromObject(data) {
    return new Message(
      data.id,
      data.content,
      data.type,
      data.userId,
      data.username,
      new Date(data.timestamp)
    );
  }
}

// Экспорт класса для использования в других модулях
module.exports = Message;