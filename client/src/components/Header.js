import React from 'react';

/**
 * Header component for the application
 * @param {Object} props - Component props
 * @param {boolean} props.isProcessing - Whether the AI is processing a request
 */
const Header = ({ isProcessing }) => {
  return (
    <header className="header">
      <h1>ИИ Помощник для Жестового Общения</h1>
      
      <div className="ai-status">
        <div className={`status-indicator ${isProcessing ? 'processing' : 'ready'}`}></div>
        <span>{isProcessing ? 'ИИ думает...' : 'ИИ готов к общению'}</span>
      </div>
    </header>
  );
};

export default Header;