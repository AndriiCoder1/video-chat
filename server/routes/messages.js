/**
 * Маршруты (Routes) для работы с сообщениями в приложении видеозвонков на языке жестов
 * 
 * Этот файл определяет API endpoints для:
 * - Получения и создания сообщений
 * - Конвертации жестов в текст и обратно
 * - Взаимодействия с AI-чатом
 * 
 * Все маршруты используют соответствующие контроллеры из messageController
 * 
 * @module routes/messages
 * @version 1.0.0
 * @requires express
 */

const express = require('express');
const router = express.Router();

// Импорт контроллера сообщений
const messageController = require('../controllers/messageController');

// Маршруты для работы с сообщениями
/**
 * @route GET /api/messages
 * @description Получение всех сообщений из системы
 * @access Public
 * @returns {Array} Массив объектов сообщений с полями:
 * - id {string} Уникальный идентификатор
 * - content {string} Содержание сообщения
 * - type {string} Тип сообщения (text/sign)
 * - userId {string} ID пользователя
 * - username {string} Имя пользователя
 * - timestamp {Date} Временная метка
 */
router.get('/', messageController.getMessages);

/**
 * @route POST /api/messages
 * @description Создание нового сообщения в системе
 * @access Public
 * @param {Object} req.body - Данные сообщения
 * @param {string} req.body.content - Текст или описание жеста
 * @param {string} req.body.type - Тип сообщения: "text" или "sign"
 * @param {string} req.body.userId - ID пользователя-отправителя
 * @param {string} req.body.username - Имя пользователя-отправителя
 * @returns {Object} Созданное сообщение с присвоенным ID и временной меткой
 */
router.post('/', messageController.createMessage);

// Маршруты для конвертации жестов
/**
 * @route POST /api/messages/sign-to-text
 * @description Конвертация жестового сообщения в текст (заглушка для будущей ML-интеграции)
 * @access Public
 * @param {Object} req.body - Данные жеста
 * @param {Object} req.body.gestureData - Данные жеста для распознавания
 * @returns {Object} Результат распознавания:
 * - text {string} Распознанный текст
 * - confidence {number} Уверенность распознавания (0-1)
 * - timestamp {Date} Временная метка обработки
 */
router.post('/sign-to-text', messageController.signToText);

/**
 * @route POST /api/messages/text-to-sign
 * @description Конвертация текста в данные для жестовой анимации
 * @access Public
 * @param {Object} req.body - Текст для конвертации
 * @param {string} req.body.text - Текст для преобразования в жест
 * @returns {Object} Данные для анимации:
 * - gestures {Array} Массив жестов
 * - duration {number} Длительность анимации в ms
 * - text {string} Исходный текст
 */
router.post('/text-to-sign', messageController.textToSign);

// Маршрут для взаимодействия с AI-чатом
/**
 * @route POST /api/messages/ai-chat
 * @description Обработка сообщений через AI (OpenAI GPT для текста, заглушка для жестов)
 * @access Public
 * @param {Object} req.body - Данные запроса
 * @param {Object} req.body.message - Сообщение для обработки
 * @param {string} req.body.type - Тип сообщения: "text" или "sign"
 * @returns {Object} Ответ AI-ассистента:
 * - content {string} Текст ответа
 * - type {string} Тип ответа (text/sign)
 * - userId {string} "ai-assistant"
 * - username {string} "ИИ Помощник"
 * - timestamp {Date} Временная метка
 * - confidence {number} Уверенность ответа (0-1)
 * - animationData {Object|null} Данные анимации для жестов
 */
router.post('/ai-chat', messageController.aiChat);

// Экспорт роутера для использования в основном приложении
module.exports = router;