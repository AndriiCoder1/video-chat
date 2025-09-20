/**
 * Точка входа в приложение видеочата.
 * Инициализирует React-приложение и подготавливает DOM для WebRTC-компонентов.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Глобальные стили
import App from './App'; // Корневой компонент приложения
import reportWebVitals from './reportWebVitals';

// Создаем корневой DOM-элемент для рендеринга React-приложения
const root = ReactDOM.createRoot(document.getElementById('root'));

// Рендерим основное приложение в StrictMode для дополнительных проверок
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Инициализация сбора метрик производительности (опционально)
// Подробнее: https://bit.ly/CRA-vitals
reportWebVitals();