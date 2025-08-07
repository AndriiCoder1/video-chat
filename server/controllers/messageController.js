const Message = require('../models/Message');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Настройка логгера
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const errorLogStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });
const openaiLogStream = fs.createWriteStream(path.join(logDir, 'openai.log'), { flags: 'a' });

const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${context}: ${error.stack || error}\n`;
  errorLogStream.write(logMessage);
  console.error(logMessage);
};

const logOpenAIRequest = (data) => {
  const timestamp = new Date().toISOString();
  openaiLogStream.write(`[${timestamp}] OpenAI Request: ${JSON.stringify(data, null, 2)}\n`);
};

const logOpenAIResponse = (data) => {
  const timestamp = new Date().toISOString();
  openaiLogStream.write(`[${timestamp}] OpenAI Response: ${JSON.stringify(data, null, 2)}\n`);
};

// Инициализация OpenAI с логированием
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
  });
  console.log('OpenAI client initialized successfully');
} catch (initError) {
  logError(initError, 'OpenAI Initialization');
  throw new Error('Failed to initialize OpenAI client');
}

// Получение всех сообщений с улучшенным логированием
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

// Создание нового сообщения с улучшенным логированием
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

// ИИ чат - обработка сообщений пользователя с расширенным логированием
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
    let openaiErrorDetails = null;
    
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
      res.json(response);
    } else {
      // Обработка текстового сообщения через GPT
      console.log(`[${requestId}] Processing text message with OpenAI`);
      
      const userMessage = message.content || message;
      const messages = [{ role: "user", content: userMessage }];
      
      logOpenAIRequest({
        requestId,
        model: "gpt-3.5-turbo",
        messages,
        timestamp: new Date().toISOString()
      });
      
      try {
        const startOpenAI = Date.now();
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.7
        });
        
        const openaiDuration = Date.now() - startOpenAI;
        logOpenAIResponse({
          requestId,
          durationMs: openaiDuration,
          response: completion,
          timestamp: new Date().toISOString()
        });
        
        aiResponse = completion.choices[0]?.message?.content;
        console.log(`[${requestId}] OpenAI response received`, {
          responseLength: aiResponse?.length,
          duration: openaiDuration
        });
        
        if (!aiResponse) {
          throw new Error('Empty response from OpenAI');
        }
      } catch (openaiError) {
        openaiErrorDetails = {
          code: openaiError.code,
          message: openaiError.message,
          stack: openaiError.stack,
          status: openaiError.status,
          response: openaiError.response?.data
        };
        
        logError(openaiError, `OpenAI API Error [${requestId}]`);
        console.error(`[${requestId}] ❌ OpenAI API Error:`, openaiErrorDetails);
        
        // Специфическая обработка ошибок
        if (openaiError.code === 'invalid_api_key') {
          aiResponse = 'Ошибка конфигурации API. Обратитесь к администратору.';
        } else if (openaiError.code === 'rate_limit_exceeded') {
          aiResponse = 'Превышен лимит запросов. Попробуйте позже.';
        } else if (openaiError.code === 'context_length_exceeded') {
          aiResponse = 'Сообщение слишком длинное. Пожалуйста, сократите его.';
        } else if (openaiError.status === 429) {
          aiResponse = 'Слишком много запросов. Подождите немного.';
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
        ...(openaiErrorDetails && { errorDetails: openaiErrorDetails })
      };
      
      console.log(`[${requestId}] 🎯 ИИ ответ сгенерирован (text):`, {
        content: response.content,
        length: response.content?.length,
        hasError: !!openaiErrorDetails
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

// Генерация ответа на жестовое сообщение
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

// Генерация данных анимации для аватара
function generateResponseAnimation(responseText) {
  try {
    if (!responseText) {
      console.warn('Empty response text for animation generation');
      return null;
    }
    
    const duration = Math.max(2000, responseText.length * 50);
    const animation = {
      type: 'gesture',
      duration: duration,
      keyframes: [
        { time: 0, gesture: 'neutral' },
        { time: 0.3, gesture: 'speaking' },
        { time: 0.7, gesture: 'gesturing' },
        { time: 1.0, gesture: 'neutral' }
      ],
      emotion: detectEmotion(responseText)
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

// Определение эмоции из текста для анимации
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

// Конвертация жеста в текст с улучшенным логированием
exports.signToText = async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 9);
  
  try {
    const { gestureData } = req.body;
    console.log(`[${requestId}] Sign to text conversion request:`, {
      gestureData: gestureData ? 'received' : 'missing'
    });
    
    // Заглушка для демонстрации
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

// Конвертация текста в жест с улучшенным логированием
exports.textToSign = async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 9);
  
  try {
    const { text } = req.body;
    console.log(`[${requestId}] Text to sign conversion request:`, {
      textLength: text?.length
    });
    
    // Заглушка для демонстрации
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
process.on('exit', () => {
  errorLogStream.end();
  openaiLogStream.end();
});

process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());