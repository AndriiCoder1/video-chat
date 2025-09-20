import React, { useState, useRef, useEffect } from 'react';

 /**
 *  Компонент интерфейса чата для отображения и отправки сообщений
 *
 * Основная функциональность:
 * - Отображает историю сообщений с разделением на сообщения пользователя и собеседника
 * - Предоставляет возможность ввода и отправки новых сообщений
 * - Автоматически прокручивает чат к новым сообщениям
 * - Отображает индикатор процесса, когда ИИ "думает"
 * - Показывает уровень уверенности распознавания (если предоставлен)
 * - Форматирует время сообщений в удобный формат
 * 
 * Особенности: 
 * - Получает все данные через props, что делает компонент переиспользуемым и тестируемым
 * - Не содержит бизнес-логики, только отображает интерфейс
 * - Делегирует обработку событий (например, отправку сообщений) родительским компонентам
 *
 * @param {Object} props -  Пропсы компонента
 * @param {Array} props.messages -  Массив объектов сообщений
 * @param {Function} props.onSendMessage - Callback при отправке сообщения
 * @param {Object} props.currentUser - Информация о текущем пользователе
 * @param {boolean} props.isProcessing - Флаг обработки запроса ИИ
 */
const ChatInterface = ({ messages, onSendMessage, currentUser, isProcessing }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Автопрокрутка к низу при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Прокрутка к нижней части контейнера сообщений
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Обработка изменения ввода сообщения
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
  };
  
  // Обработка отправки сообщения
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };
  
  // Форматирование времени
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Chat</h2>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.userId === currentUser.id ? 'message-user' : 'message-other'
              } message-${message.type}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-meta">
                <span className="message-author">
                  {message.userId === currentUser.id ? 'You' : message.username}
                </span>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              {message.confidence && (
                <div className="message-confidence">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
            </div>
          ))
        )}
        {isProcessing && (
          <div className="ai-thinking">
            <div className="message message-other message-ai">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                ИИ думает...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="message-input"
          placeholder="Напишите сообщение или покажите жест..."
          value={messageText}
          onChange={handleInputChange}
          aria-label="Message input"
          disabled={isProcessing}
        />
        <button
          type="submit"
          className="send-button"
          aria-label="Send message"
          disabled={isProcessing}
        >
          Отправить
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;