import React, { useState, useRef, useEffect } from 'react';

/**
 * ChatInterface component for displaying and sending messages
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @param {Function} props.onSendMessage - Callback when a message is sent
 * @param {Object} props.currentUser - Current user information
 * @param {boolean} props.isProcessing - Whether the AI is processing a request
 */
const ChatInterface = ({ messages, onSendMessage, currentUser, isProcessing }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Scroll to the bottom of the messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle message input change
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
  };
  
  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };
  
  // Format timestamp
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