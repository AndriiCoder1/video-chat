// Message controller for handling message-related operations

// In-memory message storage (replace with database in production)
let messages = [];

/**
 * Get all messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMessages = async (req, res) => {
  try {
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createMessage = async (req, res) => {
  try {
    const { content, type, userId, username } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({ message: 'Content and type are required' });
    }
    
    const newMessage = {
      id: Date.now().toString(),
      content,
      type, // 'text' or 'sign'
      userId,
      username,
      timestamp: new Date()
    };
    
    messages.push(newMessage);
    
    // In a real app, save to database here
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Convert sign language to text
 * This is a placeholder for ML model integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.signToText = async (req, res) => {
  try {
    const { gestureData } = req.body;
    
    if (!gestureData) {
      return res.status(400).json({ message: 'Gesture data is required' });
    }
    
    // In a real implementation, this would call an ML model to interpret the gesture
    // For now, we'll return a mock response
    
    // Mock dictionary of some basic signs
    const mockSignDictionary = {
      'HELLO': { confidence: 0.95 },
      'THANK YOU': { confidence: 0.92 },
      'YES': { confidence: 0.88 },
      'NO': { confidence: 0.90 },
      'PLEASE': { confidence: 0.85 }
    };
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return a random sign from our dictionary (in a real app, this would be the ML model's prediction)
    const signs = Object.keys(mockSignDictionary);
    const randomSign = signs[Math.floor(Math.random() * signs.length)];
    
    res.json({
      text: randomSign,
      confidence: mockSignDictionary[randomSign].confidence
    });
  } catch (error) {
    console.error('Error in sign-to-text conversion:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Convert text to sign language animation data
 * This is a placeholder for animation data generation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.textToSign = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    // In a real implementation, this would generate animation data for the 3D avatar
    // For now, we'll return a mock response with placeholder animation data
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock animation data (in a real app, this would be actual animation keyframes)
    const animationData = {
      word: text,
      frames: [
        // Sample keyframes for animation
        { time: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
        { time: 0.5, position: { x: 0.2, y: 0.1, z: 0 }, rotation: { x: 0.1, y: 0, z: 0.1 } },
        { time: 1.0, position: { x: 0.4, y: 0.2, z: 0 }, rotation: { x: 0.2, y: 0, z: 0.2 } },
        { time: 1.5, position: { x: 0.2, y: 0.1, z: 0 }, rotation: { x: 0.1, y: 0, z: 0.1 } },
        { time: 2.0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
      ],
      duration: 2.0
    };
    
    res.json(animationData);
  } catch (error) {
    console.error('Error in text-to-sign conversion:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * AI Chat endpoint for responding to user messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.aiChat = async (req, res) => {
  try {
    const { message, type } = req.body;
    
    if (!message || !message.content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate AI response based on message type and content
    let aiResponse;
    
    if (type === 'sign' || message.type === 'sign') {
      // Response to sign language
      aiResponse = generateSignResponse(message.content, message.confidence);
    } else {
      // Response to text message
      aiResponse = generateTextResponse(message.content);
    }
    
    // Generate animation data for avatar response
    const animationData = await generateResponseAnimation(aiResponse);
    
    res.json({
      response: aiResponse,
      animationData: animationData,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Generate AI response to sign language input
 * @param {string} signText - Recognized sign text
 * @param {number} confidence - Recognition confidence
 * @returns {string} AI response
 */
function generateSignResponse(signText, confidence) {
  const responses = {
    'HELLO': [
      'Привет! Рад вас видеть!',
      'Здравствуйте! Как дела?',
      'Привет! Отличный жест!'
    ],
    'THANK YOU': [
      'Пожалуйста! Всегда рад помочь.',
      'Не за что! Обращайтесь еще.',
      'Рад был помочь!'
    ],
    'YES': [
      'Отлично! Понял вас.',
      'Хорошо, согласен.',
      'Да, все верно!'
    ],
    'NO': [
      'Понятно, хорошо.',
      'Хорошо, учту это.',
      'Понял, спасибо за уточнение.'
    ],
    'PLEASE': [
      'Конечно! Чем могу помочь?',
      'С удовольствием помогу!',
      'Да, конечно!'
    ]
  };
  
  const signResponses = responses[signText.toUpperCase()] || [
    `Я вижу жест "${signText}". Интересно!`,
    `Понял ваш жест "${signText}".`,
    `Спасибо за жест "${signText}"!`
  ];
  
  const response = signResponses[Math.floor(Math.random() * signResponses.length)];
  
  // Add confidence comment if low
  if (confidence && confidence < 0.8) {
    return response + ` (Уверенность распознавания: ${Math.round(confidence * 100)}%)`;
  }
  
  return response;
}

/**
 * Generate AI response to text input
 * @param {string} text - User text message
 * @returns {string} AI response
 */
function generateTextResponse(text) {
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based responses
  if (lowerText.includes('привет') || lowerText.includes('здравствуй')) {
    return 'Привет! Рад общению с вами. Можете писать текстом или показывать жесты!';
  }
  
  if (lowerText.includes('как дела') || lowerText.includes('как поживаете')) {
    return 'У меня все отлично! Готов помочь вам с изучением жестового языка.';
  }
  
  if (lowerText.includes('спасибо') || lowerText.includes('благодарю')) {
    return 'Пожалуйста! Всегда рад помочь в изучении жестового языка.';
  }
  
  if (lowerText.includes('помощь') || lowerText.includes('помоги')) {
    return 'Конечно помогу! Покажите жест, и я его распознаю, или задайте вопрос о жестовом языке.';
  }
  
  if (lowerText.includes('жест') || lowerText.includes('жестовый')) {
    return 'Жестовый язык - это прекрасный способ общения! Покажите любой жест, и я постараюсь его понять.';
  }
  
  // Default responses
  const defaultResponses = [
    'Интересно! Расскажите больше.',
    'Понимаю вас. Что еще хотели бы обсудить?',
    'Спасибо за сообщение! Можете также показать жест.',
    'Хорошо! Попробуйте показать жест - я его распознаю.',
    'Понял! А теперь покажите какой-нибудь жест?'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * Generate animation data for AI response
 * @param {string} responseText - AI response text
 * @returns {Object} Animation data
 */
async function generateResponseAnimation(responseText) {
  // Simulate animation generation time
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generate simple animation based on response length
  const duration = Math.max(2.0, responseText.length * 0.1);
  
  return {
    word: responseText.substring(0, 20) + (responseText.length > 20 ? '...' : ''),
    frames: [
      { time: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
      { time: duration * 0.25, position: { x: 0.1, y: 0.1, z: 0 }, rotation: { x: 0.1, y: 0.1, z: 0 } },
      { time: duration * 0.5, position: { x: 0.2, y: 0.2, z: 0.1 }, rotation: { x: 0.2, y: 0, z: 0.1 } },
      { time: duration * 0.75, position: { x: 0.1, y: 0.1, z: 0 }, rotation: { x: 0.1, y: -0.1, z: 0 } },
      { time: duration, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
    ],
    duration: duration
  };
}