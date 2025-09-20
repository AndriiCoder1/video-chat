import React, { useState, useEffect } from 'react';
import './App.css';

// Компоненты
import VideoFeed from './components/VideoFeed';
import ChatInterface from './components/ChatInterface';
import AvatarRenderer from './components/AvatarRenderer';
import Header from './components/Header';

// Сервисы
import { recognizeSign } from './services/signRecognitionService';

/**
 * Основной компонент приложения "ИИ Помощник для жестового общения"
 * 
 * Координирует работу всех компонентов приложения:
 * - Управляет состоянием чата и сообщений
 * - Обрабатывает распознавание жестов и текстовые сообщения
 * - Взаимодействует с сервером ИИ для получения ответов
 * - Управляет анимацией 3D-аватара
 * - Отображает статус обработки запросов
 * 
 * Основной функционал:
 * - Инициализация приложения и начального состояния
 * - Обработка жестов, распознанных через видеопоток
 * - Отправка и получение текстовых сообщений
 * - Визуализация ответов ИИ через анимированного аватара
 * - Обработка ошибок и отображение статусов
 */
function App() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      content: 'Привет! Я ваш ИИ-помощник для общения жестами. Покажите жест, и я отвечу!',
      type: 'text',
      userId: 'ai-assistant',
      username: 'ИИ Помощник',
      timestamp: new Date()
    }
  ]);
  const [user, setUser] = useState({
    id: `user-${Date.now()}`,
    name: 'Вы'
  });
  const [currentSign, setCurrentSign] = useState(null);
  const [avatarAnimation, setAvatarAnimation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Функция получения ответа от ИИ
  const getAIResponse = async (userMessage) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL || 'https://video-chat-wy8a.onrender.com'}/api/messages/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: userMessage,
          type: userMessage.type || 'text'
        })
      });
      
      const aiResponse = await response.json();
      
      // Добавление ответа ИИ в чат
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: aiResponse.content,  
        type: 'text',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Если ответ ИИ содержит данные анимации, воспроизвести на аватаре
      if (aiResponse.animationData) {
        setAvatarAnimation(aiResponse.animationData);
      }
      
    } catch (error) {
      console.error('Ошибка при получении ответа от ИИ:', error);
      
      // Добавление сообщения об ошибке
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: 'Извините, произошла ошибка. Попробуйте еще раз.',
        type: 'text',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Инициализация приложения
  useEffect(() => {
    console.log('ИИ-чат инициализирован');
  }, []);

  // Обработка распознавания языка жестов
  const handleSignDetected = async (gestureData) => {
    try {
      // Использование сервиса распознавания жестов для интерпретации
      const result = await recognizeSign(gestureData);
      
      if (result && result.text) {
        setCurrentSign(result);
        
        // После небольшой задержки добавить распознанный жест в чат
        // Это предотвращает быстрые сообщения при удерживании одного жеста
        setTimeout(async () => {
          const newMessage = {
            id: Date.now().toString(),
            content: result.text,
            type: 'sign',
            userId: user.id,
            username: user.name,
            timestamp: new Date(),
            confidence: result.confidence
          };
          
          setMessages(prevMessages => [...prevMessages, newMessage]);
          
          // Получение ответа ИИ на распознанный жест
          await getAIResponse(newMessage);
        }, 1000); // Задержка в 1 секунду
      }
    } catch (error) {
      console.error('Ошибка обработки жеста:', error);
    }
  };

  // Обработка отправки текстовых сообщений
  const handleSendTextMessage = async (text) => {
    try {
      if (!text.trim()) return;
      
      // Создание нового объекта сообщения
      const newMessage = {
        id: Date.now().toString(),
        content: text,
        type: 'text',
        userId: user.id,
        username: user.name,
        timestamp: new Date()
      };
      
      // Добавление сообщения в чат
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      //  Получение ответа ИИ на текстовое сообщение
      await getAIResponse(newMessage);
      
    } catch (error) {
      console.error('Ошибка отправки текстового сообщения:', error);
    }
  };

  return (
    <div className="app">
      <Header isProcessing={isProcessing} />
      
      <div className="main-content">
        <div className="left-panel">
          <VideoFeed onSignDetected={handleSignDetected} currentSign={currentSign} />
          <AvatarRenderer animationData={avatarAnimation} />
        </div>
        
        <div className="right-panel">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendTextMessage} 
            currentUser={user}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}

export default App;