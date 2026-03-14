/**
 * Контроллер сообщений и AI-чата для приложения видеозвонков на языке жестов
 * 
 * Основные функции:
 * - Управление сообщениями (получение, создание)
 * - Обработка AI-чата через OpenAI GPT
 * - Конвертация жестов в текст и обратно
 * - Генерация анимаций для аватара
 * - Расширенное логирование всех операций
 */

const Message = require('../models/Message');
//const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Создание директории для логов если не существует
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Создание потоков для записи логов ошибок и запросов к OpenAI
//const errorLogStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });
//const openaiLogStream = fs.createWriteStream(path.join(logDir, 'openai.log'), { flags: 'a' });

/**
 * Логирование ошибок в файл и консоль
 * @param {Error} error - Объект ошибки
 * @param {string} context - Контекст где произошла ошибка
 */
const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${context}: ${error.stack || error}\n`;
//errorLogStream.write(logMessage);
  console.error(logMessage);
};

/**
 * Логирование запросов к OpenAI API
//* @param {Object} data - Данные запроса
 */
//const logOpenAIRequest = (data) => {
//  const timestamp = new Date().toISOString();
//  openaiLogStream.write(`[${timestamp}] OpenAI Request: ${JSON.stringify(data, null, 2)}\n`);
//};

/**
 * Логирование ответов от OpenAI API
//* @param {Object} data - Данные ответа
 */
//const logOpenAIResponse = (data) => {
//  const timestamp = new Date().toISOString();
//  openaiLogStream.write(`[${timestamp}] OpenAI Response: ${JSON.stringify(data, null, 2)}\n`);
//};

// Инициализация OpenAI с логированием
//let openai;
//try {
//  openai = new OpenAI({
//    apiKey: process.env.OPENAI_API_KEY  // API ключ из переменных окружения
//  });
//  console.log('OpenAI client initialized successfully');
//} catch (initError) {
//  logError(initError, 'OpenAI Initialization');
//  throw new Error('Failed to initialize OpenAI client');
//}

/**
 * Получение всех сообщений из базы данных
 * @route GET /api/messages
 * @returns {Array} Список сообщений отсортированных по времени
 */
exports.getMessages = async (req, res) => {
  try {
    console.log('Fetching messages from database');
    const messages = await Message.find().sort({ timestamp: 1 });
    console.log(`Successfully retrieved ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    logError(error, 'getMessages');
    res.status(500).json({ 
      error: 'Ошибка сервера при получении сообщений',
      details: error.message 
    });
  }
};

/**
 * Создание нового сообщения
 * @route POST /api/messages
 * @param {string} content - Содержание сообщения
 * @param {string} type - Тип сообщения (text/sign)
 * @param {string} userId - ID пользователя
 * @param {string} username - Имя пользователя
 * @returns {Object} Созданное сообщение
 */
exports.createMessage = async (req, res) => {
  try {
    const { content, type, userId, username } = req.body;
    console.log('Creating new message:', { content, type, userId, username });
    
    const newMessage = new Message({
      content,
      type,
      userId,
      username,
      timestamp: new Date()
    });
    
    const savedMessage = await newMessage.save();
    console.log('Message saved successfully:', savedMessage._id);
    res.status(201).json(savedMessage);
  } catch (error) {
    logError(error, 'createMessage');
    res.status(500).json({ 
      error: 'Ошибка сервера при создании сообщения',
      details: error.message 
    });
  }
};

/**
 * Обработка сообщений через ИИ (как текстовых, так и жестовых)
 * @route POST /api/chat/ai
 * @param {Object} message - Сообщение для обработки
 * @param {string} type - Тип сообщения (text/sign)
 * @returns {Object} Ответ ИИ с контентом и данными анимации
 */
exports.aiChat = async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 9); // Уникальный ID для отслеживания запроса
  
  
  try {
    const { message, type } = req.body;
    
    console.log(`[${requestId}] 🤖 Получено сообщение для ИИ:`, { 
      type, 
      content: message.content || message,
      timestamp: new Date().toISOString()
    });
    
    let aiResponse;
    let animationData = null;
    let spaceErrorDetails = null;
    //let openaiErrorDetails = null;
    
    if (type === 'sign') {
      // Обработка жестового сообщения
      console.log(`[${requestId}] Processing sign message`);
      aiResponse = generateSignResponse(message.content);
      animationData = generateResponseAnimation(aiResponse);

      const response = {
        content: aiResponse,
        type: 'sign',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date(),
        confidence: Math.random() * 0.3 + 0.7, // Случайное значение уверенности между 0.7 и 1.0
        animationData: animationData
      };

      console.log(`[${requestId}] 🎯 ИИ ответ сгенерирован (sign):`, response.content);
      res.json(response);
    } else {
      // Обработка текстового сообщения через GPT
      console.log(`[${requestId}] Processing text message with OpenAI`);
      
      const userMessage = message.content || message;

      try {
        const startSpace = Date.now();
        
        // Вызов Space на Hugging Face
        const spaceResponse = await axios.post('https://Andrii1-my-chat-model.hf.space/chat', {
          text: userMessage,
          type: 'text'
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`  
          },
          timeout: 300000 
        });
        
        const spaceDuration = Date.now() - startSpace;
        console.log(`[${requestId}] Hugging Face Space response received`, {
          responseLength: spaceResponse.data.response?.length,
          duration: spaceDuration
        });
        
        aiResponse = spaceResponse.data.response;
        
        if (!aiResponse) {
          throw new Error('Empty response from Hugging Face Space');
        }
      } catch (spaceError) {
        spaceErrorDetails = {
          code: spaceError.code,
          message: spaceError.message,
          stack: spaceError.stack,
          status: spaceError.response?.status,
          response: spaceError.response?.data
        };
        
        logError(spaceError, `Hugging Face Space Error [${requestId}]`);
        console.error(`[${requestId}] ❌ Hugging Face Space Error:`, spaceErrorDetails);
        
        // Специфическая обработка различных ошибок
        if (spaceError.code === 'ECONNREFUSED') {
          aiResponse = 'Сервис ИИ временно недоступен. Попробуйте позже.';
        } else if (spaceError.code === 'ETIMEDOUT') {
          aiResponse = 'Сервис ИИ отвечает слишком долго. Попробуйте еще раз.';
        } else {
          aiResponse = 'Временная ошибка сервиса. Попробуйте еще раз.';
        }
      }
      
      animationData = generateResponseAnimation(aiResponse); 
      
      const response = {
        content: aiResponse,
        type: 'text',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date(),
        confidence: Math.random() * 0.3 + 0.7,
        animationData: animationData,
        ...(spaceErrorDetails && { errorDetails: spaceErrorDetails }) // Добавляем детали ошибки только если есть
      };
      
      console.log(`[${requestId}] 🎯 ИИ ответ сгенерирован (text):`, {
        content: response.content,
        length: response.content?.length,
        hasError: !!spaceErrorDetails
      });
      
      res.json(response);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, `aiChat [${requestId}]`);
    console.error(`[${requestId}] ❌ Critical error in aiChat after ${duration}ms:`, error);
    
    res.status(500).json({ 
      error: 'Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.',
      requestId,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Генерация ответа на жестовое сообщение
 * @param {string} signContent - Распознанное содержание жеста
 * @returns {string} Текстовый ответ на жест
 */
function generateSignResponse(signContent) {
  try {
    console.log('Generating sign response for:', signContent);

    // Словарь предопределенных ответов на жесты
    const signResponses = {
      'привет': 'Привет! Рад видеть вас! 👋',
      'спасибо': 'Пожалуйста! Всегда готов помочь! 😊',
      'пока': 'До свидания! Удачного дня! 👋',
      'да': 'Отлично! Продолжаем общение! ✅',
      'нет': 'Понятно, может быть в другой раз! 👌',
      'помощь': 'Конечно! Я здесь, чтобы помочь вам с жестовым языком! 🤝',
      'хорошо': 'Замечательно! Я рад, что все хорошо! 😊',
      'плохо': 'Сожалею, что дела идут не очень. Могу ли я чем-то помочь? 🤗',
      'hello': 'Hello! Nice to see you! 👋',
      'no': 'I see. Maybe another time! 👌',
      'please': 'You\'re welcome! How else can I help? 😊'
    };
    
    const lowerSign = signContent.toLowerCase();
    const response = signResponses[lowerSign] || `Я распознал жест "${signContent}". Это интересно! Покажите еще один жест! 🤟`;
    
    console.log('Generated sign response:', response);
    return response;
  } catch (error) {
    logError(error, 'generateSignResponse');
    return `Я получил ваш жест "${signContent}", но возникла небольшая проблема. Попробуйте еще раз!`;
  }
}

/**
 * Генерация данных анимации для аватара на основе текста ответа
 * @param {string} responseText - Текст ответа ИИ
 * @returns {Object} Данные анимации для аватара
 */
function generateResponseAnimation(responseText) {
  try {
    if (!responseText) {
      console.warn('Empty response text for animation generation');
      return null;
    }
    
     // Расчет длительности анимации на основе длины текста
    const duration = Math.max(2000, responseText.length * 50);
    const animation = {
      type: 'gesture',
      duration: duration,
      keyframes: [
        { time: 0, gesture: 'neutral' },     // Начальное положение
        { time: 0.3, gesture: 'speaking' },  // Начало речи
        { time: 0.7, gesture: 'gesturing' }, // Активная жестикуляция
        { time: 1.0, gesture: 'neutral' }    // Возврат в нейтральное положение
      ],
      emotion: detectEmotion(responseText)   // Определение эмоции для анимации
    };
    
    console.log('Generated animation:', {
      duration,
      emotion: animation.emotion
    });
    
    return animation;
  } catch (error) {
    logError(error, 'generateResponseAnimation');
    return null;
  }
}

/**
 * Определение эмоции из текста для адекватной анимации аватара
 * @param {string} text - Текст для анализа
 * @returns {string} Тип эмоции (happy, sad, thinking, neutral)
 */
function detectEmotion(text) {
  try {
    if (!text) return 'neutral';
    
    const lowerText = text.toLowerCase();
    
    // Определение эмоции по ключевым словам и эмодзи
    if (lowerText.includes('😊') || lowerText.includes('рад') || lowerText.includes('отлично') || 
        lowerText.includes('happy') || lowerText.includes('great')) {
      return 'happy';
    }
    if (lowerText.includes('😔') || lowerText.includes('сожалею') || lowerText.includes('плохо') || 
        lowerText.includes('sorry') || lowerText.includes('bad')) {
      return 'sad';
    }
    if (lowerText.includes('🤔') || lowerText.includes('интересно') || lowerText.includes('думаю') || 
        lowerText.includes('think') || lowerText.includes('interesting')) {
      return 'thinking';
    }
    
    return 'neutral';
  } catch (error) {
    logError(error, 'detectEmotion');
    return 'neutral';
  }
}

/**
 * Конвертация жеста в текст (заглушка для демонстрации)
 * @route POST /api/sign/to-text
 * @param {Object} gestureData - Данные жеста
 * @returns {Object} Распознанный текст и уверенность распознавания
 */
exports.signToText = async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 9);
  
  try {
    const { gestureData } = req.body;
    console.log(`[${requestId}] Sign to text conversion request:`, {
      gestureData: gestureData ? 'received' : 'missing'
    });
    
    // Заглушка для демонстрации - в реальном приложении здесь будет интеграция с ML моделью
    const recognizedText = 'Распознанный жест: привет';
    
    const result = { 
      text: recognizedText,
      confidence: 0.85,
      timestamp: new Date(),
      requestId
    };
    
    console.log(`[${requestId}] Sign to text result:`, result);
    res.json(result);
  } catch (error) {
    logError(error, `signToText [${requestId}]`);
    res.status(500).json({ 
      error: 'Ошибка при распознавании жеста',
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Конвертация текста в жест (заглушка для демонстрации)
 * @route POST /api/text/to-sign
 * @param {string} text - Текст для конвертации в жест
 * @returns {Object} Данные жестовой анимации
 */
exports.textToSign = async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 9);
  
  try {
    const { text } = req.body;
    console.log(`[${requestId}] Text to sign conversion request:`, {
      textLength: text?.length
    });
    
    // Заглушка для демонстрации - в реальном приложении здесь будет интеграция с жестовым движком
    const gestureData = {
      gestures: ['wave', 'point', 'thumbs_up'],
      duration: 3000,
      text: text,
      requestId
    };
    
    console.log(`[${requestId}] Generated gesture data:`, {
      gestures: gestureData.gestures,
      duration: gestureData.duration
    });
    
    res.json({
      gestureData,
      timestamp: new Date(),
      requestId
    });
  } catch (error) {
    logError(error, `textToSign [${requestId}]`);
    res.status(500).json({ 
      error: 'Ошибка при генерации жеста',
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Закрытие потоков логов при завершении процесса
//process.on('exit', () => {
//  errorLogStream.end();
//  openaiLogStream.end();
//});

// Обработка сигналов завершения для корректного закрытия ресурсов
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());