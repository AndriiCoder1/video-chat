const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Импорт маршрутов
const messageRoutes = require('./routes/messages');

// Инициализация Express приложения
const app = express();

// Настройка CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.onrender.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Парсинг JSON тел запросов
app.use(express.json());

// Логирование API запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API маршруты
app.use('/api/messages', messageRoutes);

// Обслуживание статических файлов в продакшене
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Обработка всех остальных запросов - возврат React приложения
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Установка порта и запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ИИ Сервер жестового языка запущен на порту ${PORT}`);
  console.log(`🌐 Режим: ${process.env.NODE_ENV || 'development'}`);
});