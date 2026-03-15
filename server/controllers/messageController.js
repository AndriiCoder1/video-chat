/**
 * Контроллер сообщений и AI-чата для приложения видеозвонков на языке жестов
 * 
 * Основные функции:
 * - Управление сообщениями (получение, создание)
 * - Обработка AI-чата через Hugginface
 * - Конвертация жестов в текст и обратно
 * - Генерация анимаций для аватара
 * - Расширенное логирование всех операций
 */

const Message = require('../models/Message');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Создание директории для логов если не существует
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Логирование ошибок в файл и консоль
 * @param {Error} error - Объект ошибки
 * @param {string} context - Контекст где произошла ошибка
 */
const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${context}: ${error.stack || error}\n`;
  console.error(logMessage);
};

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
  const requestId = Math.random().toString(36).substring(2, 9);
  
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
        confidence: Math.random() * 0.3 + 0.7,
        animationData: animationData
      };

      console.log(`[${requestId}] 🎯 ИИ ответ сгенерирован (sign):`, response.content);
      return res.json(response);
    }
    
    // Обработка текстового сообщения
    console.log(`[${requestId}] Processing text message with Hugginface`);
    
    const userMessage = message.content || message;
    
    // Функция определения типа запроса
    function determineQueryType(message) {
      const lowerMsg = message.toLowerCase();
      
      const types = {
        price: ['цена', 'стоит', 'курс', 'price', 'cost', 'сколько стоит', 'биткоин', 'bitcoin'],
        weather: ['погода', 'weather', 'температура'],
        time: ['время', 'time', 'час', 'который'],
        date: ['дата', 'date', 'день', 'число'],
        product: ['купить', 'продажа', 'buy', 'sell', 'магазин', 'билет', 'театр', 'кино'],
        news: ['новости', 'последние', 'свежие', 'news']
      };
      
      for (const [type, keywords] of Object.entries(types)) {
        if (keywords.some(k => lowerMsg.includes(k))) {
          return type;
        }
      }
      return 'general';
    }

    // Функция оптимизации поискового запроса
    function optimizeSearchQuery(message, type) {
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-CA"); 
      const year = today.getFullYear(); 
      const optimizers = {
        price: `${message} price USD ${dateStr} current`,
        product: `${message} ${year} price review latest`,
        weather: `${message} ${dateStr}`,
        news: `${message} ${dateStr} latest`,
        general: message
      };
      return optimizers[type] || message;
    }

    // Функция проверки, нужен ли поиск в интернете
    function shouldSearchInternet(message) {
      const lowerMsg = message.toLowerCase();
      
      const searchTriggers = [
        'погода', 'новости', 'курс', 'доллар', 'евро', 'биткоин',
        'weather', 'news', 'price', 'bitcoin', 'сегодня', 'сейчас',
        'today', 'now', 'current', 'wie spät', 'aktuelle zeit',
        'цена', 'стоит', 'купить', 'продажа', 'билет', 'театр', 'кино',
        'cost', 'buy', 'sell', 'ticket', 'price', 'market',
        'последний', 'latest', 'новый', 'new', '2026', '2025'
      ];
      
      for (const trigger of searchTriggers) {
        if (lowerMsg.includes(trigger)) {
          console.log(`[Search] Триггер поиска: "${trigger}"`);
          return true;
        }
      }
      return false;
    }

    // Если запрос про время/дату - обрабатываем локально
    if (userMessage.toLowerCase().includes('какой сегодня день') ||
        userMessage.toLowerCase().includes('сколько сейчас время') ||
        userMessage.toLowerCase().includes('который час') ||
        userMessage.toLowerCase().includes('what time') ||
        userMessage.toLowerCase().includes('what day') ||
        userMessage.toLowerCase().includes('current time') ||
        userMessage.toLowerCase().includes('today\'s date') ||
        userMessage.toLowerCase().includes('wie spät') ||
        userMessage.toLowerCase().includes('welcher tag') ||
        userMessage.toLowerCase().includes('aktuelle zeit') ||
        userMessage.toLowerCase().includes('heutiges datum')) {
      
      const now = new Date();
      
      // Определяем язык для ответа
      let locale = "de-CH";  // по умолчанию 
      let timeZone = "Europe/Zurich"; 
      
      if (userMessage.toLowerCase().includes('what') || 
          userMessage.toLowerCase().includes('current') ||
          userMessage.toLowerCase().includes('today')) {
        locale = "en-US";
      } else if (userMessage.toLowerCase().includes('wie') || 
                userMessage.toLowerCase().includes('welcher') ||
                userMessage.toLowerCase().includes('aktuelle') ||
                userMessage.toLowerCase().includes('heutiges')) {
        locale = "de-DE";  
      } else if (userMessage.toLowerCase().includes('какой') || 
                userMessage.toLowerCase().includes('сколько')) {
        locale = "ru-RU";
      }
      
      // Форматируем время с правильными настройками
      const localTime = now.toLocaleString(locale, { 
        timeZone: timeZone,
        dateStyle: "full",
        timeStyle: "medium"
      });
      
      const response = {
        content: localTime,
        type: 'text',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date(),
        confidence: 0.95,
        animationData: generateResponseAnimation(localTime)
      };
      
      console.log(`[${requestId}] 🎯 Локальное время отправлено (${locale})`);
      return res.json(response);
    }

    // Если нужен поиск в интернете
    if (shouldSearchInternet(userMessage)) {
      try {
        const GoogleSearch = require("google-search-results-nodejs").GoogleSearch;
        const search = new GoogleSearch(process.env.SERPAPI_KEY);
        
        // Определяем тип и оптимизируем запрос
        const queryType = determineQueryType(userMessage);
        const optimizedQuery = optimizeSearchQuery(userMessage, queryType);
        
        // Определяем, нужен ли международный поиск
        const isInternational = userMessage.toLowerCase().includes('биткоин') ||
                                userMessage.toLowerCase().includes('bitcoin') ||
                                userMessage.toLowerCase().includes('btc') ||
                                userMessage.toLowerCase().includes('ethereum') ||
                                userMessage.toLowerCase().includes('eth') ||
                                userMessage.toLowerCase().includes('gold') ||
                                userMessage.toLowerCase().includes('золото') ||
                                userMessage.toLowerCase().includes('цена') ||
                                userMessage.toLowerCase().includes('price') ||
                                userMessage.toLowerCase().includes('курс') ||
                                userMessage.toLowerCase().includes('cost');

        const params = { 
          q: optimizedQuery,
          hl: isInternational ? "en" : "de",  
          gl: isInternational ? "us" : "ch",  
          num: 10
        };
        
        console.log(`[${requestId}] 🔍 Поиск: "${userMessage}" → оптимизирован: "${optimizedQuery}" (тип: ${queryType})`);
        
        const searchResults = await new Promise((resolve, reject) => {
          search.json(params, (data) => {
            if (!data) return reject(new Error("Пустой ответ"));
            if (data.error) return reject(new Error(data.error));
            resolve(data);
          });
        });
        
        let resultText = "Результаты поиска не найдены.";
        let firstLink = null;

        if (searchResults.answer_box?.type === "weather_result") {
          const weather = searchResults.answer_box;
          resultText = `Погода в ${weather.location} на ${weather.date}: ${weather.weather}, температура ${weather.temperature}°${weather.unit}, осадки ${weather.precipitation}, влажность ${weather.humidity}, ветер ${weather.wind}.`;
          firstLink = searchResults.organic_results?.[0]?.link || null;
          
          const displayText = resultText + (firstLink ? ` Подробнее: <a href="${firstLink}" target="_blank">${firstLink}</a>` : '');
        
          const response = {
          content: displayText,
          type: 'text',
          userId: 'ai-assistant',
          username: 'ИИ Помощник',
          timestamp: new Date(),
          confidence: 0.9,
          animationData: generateResponseAnimation(resultText)
        };
        
        console.log(`[${requestId}] 🎯 Погода отправлена`);
        return res.json(response);
        
      } else if (searchResults.organic_results?.[0]) {
        resultText = searchResults.organic_results[0].snippet;
        firstLink = searchResults.organic_results[0].link;
      }

    
      const displayText = resultText + (firstLink ? ` Подробнее: <a href="${firstLink}" target="_blank">${firstLink}</a>` : '');
      
      const searchResponse = {
        content: displayText,
        type: 'text',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date(),
        confidence: 0.85,
        animationData: generateResponseAnimation(resultText)
      };
      
      console.log(`[${requestId}] 🎯 Результат поиска отправлен`);
      return res.json(searchResponse);
      
    } catch (err) {
      console.error('[Search] Ошибка:', err);
      // Если поиск не сработал, идём дальше к AI
    }
  }

  // Детектор запросов на код
  const isCodeRequest = userMessage.toLowerCase().includes('код') ||
                          userMessage.toLowerCase().includes('function') ||
                          userMessage.toLowerCase().includes('def') ||
                          userMessage.toLowerCase().includes('python') ||
                          userMessage.toLowerCase().includes('javascript') ||
                          userMessage.toLowerCase().includes('напиши');

    let promptText = userMessage;
    if (isCodeRequest) {
      promptText = `Ты — AI-помощник, специализирующийся на написании кода.
      
Правила:
1. Отвечай ТОЛЬКО кодом, без пояснений
2. Используй латинские буквы для названий функций и переменных
3. Пиши полные, рабочие функции
4. Для Python: используй def и return
5. Для JavaScript: используй function или async function

Запрос: ${userMessage}

Код:`;
    }

    try {
      const startSpace = Date.now();
      
      const spaceResponse = await axios.post('https://Andrii1-my-chat-model.hf.space/chat', {
        text: promptText,
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
      ...(spaceErrorDetails && { errorDetails: spaceErrorDetails })
    };
    
    console.log(`[${requestId}] 🎯 ИИ ответ сгенерирован (text):`, {
      content: response.content,
      length: response.content?.length,
      hasError: !!spaceErrorDetails
    });
    
    res.json(response);
    
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
    
    const duration = Math.max(2000, responseText.length * 50);
    
    // Простая анимация для теста
    const animation = {
      type: 'gesture',
      duration: duration,
      tracks: [
        {
          object: 'rightHand', 
          property: 'position',
          keyframes: [
            { time: 0, value: { x: 0.45, y: 0.3, z: 0 } },
            { time: duration * 0.3, value: { x: 0.6, y: 0.5, z: 0.2 } },
            { time: duration * 0.7, value: { x: 0.3, y: 0.4, z: -0.2 } },
            { time: duration, value: { x: 0.45, y: 0.3, z: 0 } }
          ]
        },
        {
          object: 'leftHand',
          property: 'position',
          keyframes: [
            { time: 0, value: { x: -0.45, y: 0.3, z: 0 } },
            { time: duration * 0.3, value: { x: -0.6, y: 0.5, z: -0.2 } },
            { time: duration * 0.7, value: { x: -0.3, y: 0.4, z: 0.2 } },
            { time: duration, value: { x: -0.45, y: 0.3, z: 0 } }
          ]
        }
      ],
      emotion: detectEmotion(responseText)
    };
    
    console.log('Generated animation:', animation);
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

// Обработка сигналов завершения для корректного закрытия ресурсов
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());