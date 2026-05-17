/**
 * Основной серверный файл для приложения видеозвонков на языке жестов
 * 
 * Назначение:
 * - Инициализация Express сервера
 * - Настройка middleware и CORS
 * - Подключение маршрутов API
 * - Обслуживание статических файлов в production
 * - Базовая конфигурация сервера
 * 
 * @version 1.0.0
 * @requires express
 * @requires cors
 * @requires path
 * @requires dotenv
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Загрузка переменных окружения из .env файла

// Подключение маршрутов для работы с сообщениями
const messageRoutes = require('./routes/messages');

// Инициализация Express приложения
const app = express();

// Настройка CORS, а также конфигурация политики CORS для разрешения запросов с определенных доменов
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://video-chat-wy8a.onrender.com'] // Разрешенные домены в production
    : ['http://localhost:3000', 'http://localhost:3001'], // Разрешенные домены в development
  credentials: true // Разрешение отправки cookies и авторизационных заголовков
}));

// Парсинг JSON тел входящих запросов (максимальный размер 10MB)
app.use(express.json({ limit: '10mb' }));

// Парсинг URL-encoded тел (данные форм)
app.use(express.urlencoded({ extended: true }));

// Middleware для логирования всех входящих запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next(); // Передача управления следующему middleware
});

// Подключение маршрутов для работы с сообщениями по префиксу /api/messages
app.use('/api/messages', messageRoutes);

// Обработка статических файлов в продакшене
if (process.env.NODE_ENV === 'production') {
  // Обслуживание статических файлов из папки build клиентского приложения
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  /**
   * Обработка всех GET запросов, не попавших под API маршруты
   * Возвращает React приложение для поддержки клиентской маршрутизации
   */
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Установка порта и запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` ИИ Сервер жестового языка запущен на порту ${PORT}`);
  console.log(` Режим: ${process.env.NODE_ENV || 'development'}`);
});
