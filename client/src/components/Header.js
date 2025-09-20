import React from 'react';

/**
 * Компонент заголовка приложения с отображением статуса ИИ
 * 
 * Отображает:
 * - Название приложения
 * - Индикатор статуса работы ИИ (готов/в процессе)
 * - Визуальный индикатор (цветной круг) для быстрой идентификации статуса
 * 
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