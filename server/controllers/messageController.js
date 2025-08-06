const Message = require('../models/Message');
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
});
// Получение всех сообщений
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении сообщений' });
  }
};

// Создание нового сообщения
exports.createMessage = async (req, res) => {
  try {
    const { content, type, userId, username } = req.body;
    
    const newMessage = new Message({
      content,
      type,
      userId,
      username,
      timestamp: new Date()
    });
    
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Ошибка создания сообщения:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании сообщения' });
  }
};

// ИИ чат - обработка сообщений пользователя
exports.aiChat = async (req, res) => {
  try {
    const { message, type } = req.body;
    
    console.log('🤖 Получено сообщение для ИИ:', { message, type });
    
    // Симуляция времени обработки ИИ
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let aiResponse;
    let animationData = null;
    
    if (type === 'sign') {
      // Обработка жестового сообщения
      aiResponse = generateSignResponse(message.content);
      animationData = generateResponseAnimation(aiResponse);

  const response = {
    content: aiResponse,
    type: 'sign',
    userId: 'ai-assistant',
    username: 'ИИ Помощник',
    timestamp: new Date(),
    confidence: Math.random() * 0.3 + 0.7, // 70-100% уверенности
    animationData: animationData
  };

  console.log('🎯 ИИ ответ сгенерирован:', response.content);
  res.json(response);
  } else {
     // Обработка текстового сообщения через GPT
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: message.content || message }]
  });
    aiResponse = completion.choices[0].message.content;
    animationData = generateResponseAnimation(aiResponse); 
    
    const response = {
      content: aiResponse,
      type: 'text',
      userId: 'ai-assistant',
      username: 'ИИ Помощник',
      timestamp: new Date(),
      confidence: Math.random() * 0.3 + 0.7, // 70-100% уверенности
      animationData: animationData
    };
    
    console.log('🎯 ИИ ответ сгенерирован:', response.content);
    res.json(response);
   }
  } catch (error) {
    console.error('❌ Ошибка ИИ чата:', error);
    res.status(500).json({ 
      error: 'Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.' 
    });
  }
};

// Генерация ответа на жестовое сообщение
function generateSignResponse(signContent) {
  const signResponses = {
    'привет': 'Привет! Рад видеть вас! 👋',
    'спасибо': 'Пожалуйста! Всегда готов помочь! 😊',
    'пока': 'До свидания! Удачного дня! 👋',
    'да': 'Отлично! Продолжаем общение! ✅',
    'нет': 'Понятно, может быть в другой раз! 👌',
    'помощь': 'Конечно! Я здесь, чтобы помочь вам с жестовым языком! 🤝',
    'хорошо': 'Замечательно! Я рад, что все хорошо! 😊',
    'плохо': 'Сожалею, что дела идут не очень. Могу ли я чем-то помочь? 🤗'
  };
  
  const lowerSign = signContent.toLowerCase();
  return signResponses[lowerSign] || `Я распознал жест "${signContent}". Это интересно! Покажите еще один жест! 🤟`;
}

// Генерация ответа на текстовое сообщение
function generateTextResponse(text) {
  const lowerText = text.toLowerCase();
  
  // Ответы на приветствия
  if (lowerText.includes('привет') || lowerText.includes('здравствуй')) {
    return 'Привет! Рад общению с вами. Можете писать текстом или показывать жесты! 👋';
  }
  
  // Ответы на вопросы о самочувствии
  if (lowerText.includes('как дела') || lowerText.includes('как поживаете')) {
    return 'У меня все отлично! Готов помочь вам с изучением жестового языка. 😊';
  }
  
  // Ответы на вопросы о времени
  if (lowerText.includes('время') || lowerText.includes('час') || lowerText.includes('день') || lowerText.includes('месяц')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');
    const dateStr = now.toLocaleDateString('ru-RU');
    return `Сейчас ${timeStr}, дата: ${dateStr}. Хотите изучить жесты для времени? ⏰`;
  }
  
  // Ответы на вопросы о жестовом языке
  if (lowerText.includes('жест') || lowerText.includes('язык') || lowerText.includes('учить')) {
    return 'Жестовый язык - это прекрасный способ общения! Покажите любой жест, и я его распознаю! 🤟';
  }
  
  // Ответы на благодарности
  if (lowerText.includes('спасибо') || lowerText.includes('благодарю')) {
    return 'Пожалуйста! Всегда рад помочь! Есть еще вопросы? 😊';
  }
  
  // Дефолтные ответы
  const defaultResponses = [
    'Интересно! Расскажите больше или покажите жест! 🤔',
    'Понимаю вас. Что еще хотели бы обсудить? 💭',
    'Спасибо за сообщение! Можете также показать жест. 👐',
    'Хорошо! Попробуйте показать жест - я его распознаю! 🎯',
    'Понял! А теперь покажите какой-нибудь жест? 🤟'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Генерация данных анимации для аватара
function generateResponseAnimation(responseText) {
  // Базовая анимация на основе длины ответа
  const duration = Math.max(2000, responseText.length * 50);
  
  return {
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
}

// Определение эмоции из текста для анимации
function detectEmotion(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('😊') || lowerText.includes('рад') || lowerText.includes('отлично')) {
    return 'happy';
  }
  if (lowerText.includes('😔') || lowerText.includes('сожалею') || lowerText.includes('плохо')) {
    return 'sad';
  }
  if (lowerText.includes('🤔') || lowerText.includes('интересно') || lowerText.includes('думаю')) {
    return 'thinking';
  }
  
  return 'neutral';
}

// Конвертация жеста в текст (заглушка)
exports.signToText = async (req, res) => {
  try {
    const { gestureData } = req.body;
    
    // Здесь должна быть логика распознавания жестов
    // Пока возвращаем заглушку
    const recognizedText = 'Распознанный жест: привет';
    
    res.json({ 
      text: recognizedText,
      confidence: 0.85,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Ошибка распознавания жеста:', error);
    res.status(500).json({ error: 'Ошибка при распознавании жеста' });
  }
};

// Конвертация текста в жест (заглушка)
exports.textToSign = async (req, res) => {
  try {
    const { text } = req.body;
    
    // Здесь должна быть логика генерации жестов
    // Пока возвращаем заглушку
    const gestureData = {
      gestures: ['wave', 'point', 'thumbs_up'],
      duration: 3000,
      text: text
    };
    
    res.json({
      gestureData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Ошибка генерации жеста:', error);
    res.status(500).json({ error: 'Ошибка при генерации жеста' });
  }
};