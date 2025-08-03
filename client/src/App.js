import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import VideoFeed from './components/VideoFeed';
import ChatInterface from './components/ChatInterface';
import AvatarRenderer from './components/AvatarRenderer';
import Header from './components/Header';

// Services
import { recognizeSign } from './services/signRecognitionService';

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

  // AI Response function
  const getAIResponse = async (userMessage) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/api/messages/ai-chat`, {
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
      
      // Add AI response to chat
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: aiResponse.response,
        type: 'text',
        userId: 'ai-assistant',
        username: 'ИИ Помощник',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // If AI response includes animation data, play it on avatar
      if (aiResponse.animationData) {
        setAvatarAnimation(aiResponse.animationData);
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
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

  // Initialize app
  useEffect(() => {
    console.log('AI Chat initialized');
  }, []);

  // Handle sign language detection
  const handleSignDetected = async (gestureData) => {
    try {
      // Use the sign recognition service to interpret the gesture
      const result = await recognizeSign(gestureData);
      
      if (result && result.text) {
        setCurrentSign(result);
        
        // After a brief delay, add the recognized sign to the chat
        // This prevents rapid-fire messages when the same sign is held
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
          
          // Get AI response to the recognized sign
          await getAIResponse(newMessage);
        }, 1000); // 1-second delay
      }
    } catch (error) {
      console.error('Error processing sign:', error);
    }
  };

  // Handle sending text messages
  const handleSendTextMessage = async (text) => {
    try {
      if (!text.trim()) return;
      
      // Create a new message object
      const newMessage = {
        id: Date.now().toString(),
        content: text,
        type: 'text',
        userId: user.id,
        username: user.name,
        timestamp: new Date()
      };
      
      // Add the message to the chat
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Get AI response to the text message
      await getAIResponse(newMessage);
      
    } catch (error) {
      console.error('Error sending text message:', error);
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