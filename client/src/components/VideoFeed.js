import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawBothHands } from '../utils/handUtils';

/**
 * Компонент VideoFeed для захвата видео и обработки языка жестов с использованием обеих рук
 * 
 * Основные функции:
 * - Инициализация и управление веб-камерой
 * - Настройка и использование модели MediaPipe Hands для отслеживания рук
 * - Визуализация landmarks (ключевых точек) рук на canvas
 * - Обнаружение и обработка жестов с помощью обеих рук
 * - Предоставление данных жестов родительскому компоненту
 * - Управление состоянием камеры (вкл/выкл)
 * 
 * @param {Object} props - Пропсы компонента
 * @param {Function} props.onSignDetected - Callback при обнаружении жеста
 * @param {Object} props.currentSign - Текущий распознанный жест
 */
const VideoFeed = ({ onSignDetected, currentSign }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState(null);
  const [detectedHands, setDetectedHands] = useState([]);

  //  Инициализация MediaPipe Hands
  useEffect(() => {
    const initializeHands = async () => {
      try {
        setIsModelLoading(true);
        
        // Создание экземпляра MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        
        // Настройка обнаружения рук
        hands.setOptions({
          maxNumHands: 2, // Обнаружение обеих рук
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        // Настройка callback для результатов
        hands.onResults(onResults);
        
        handsRef.current = hands;
        setIsModelLoading(false);
        console.log('MediaPipe Hands инициализирован для обнаружения обеих рук');
        
      } catch (err) {
        console.error('Ошибка инициализации MediaPipe Hands:', err);
        setError('Не удалось загрузить модель распознавания рук. Обновите страницу и попробуйте снова.');
        setIsModelLoading(false);
      }
    };

    initializeHands();
    
    return () => {
      // Очистка ресурсов
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  // Инициализация камеры когда модель рук готова
  useEffect(() => {
    if (!isModelLoading && handsRef.current && webcamRef.current && isCameraOn) {
      const video = webcamRef.current.video;
      
      if (video) {
        const camera = new Camera(video, {
          onFrame: async () => {
            if (handsRef.current) {
              await handsRef.current.send({ image: video });
            }
          },
          width: 640,
          height: 480
        });
        
        camera.start();
        cameraRef.current = camera;
      }
    }
    
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isModelLoading, isCameraOn]);

  // Обработка результатов обнаружения рук
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const DETECTION_COOLDOWN = 2000; // Задержка в 2 секунды между обнаружениями
  
  const onResults = (results) => {
    const now = Date.now();
    // Пропустить обработку если не прошло достаточно времени с последнего обнаружения
    if (now - lastDetectionTime < DETECTION_COOLDOWN) {
      return; 
    }
    
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Установка размера canvas в соответствии с видео
    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Отрисовка рук при обнаружении
    if (results.multiHandLandmarks && results.multiHandedness) {
      const handsData = [];
      
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];
        
        // Отрисовка landmarks и соединений рук
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: handedness.label === 'Left' ? '#FF0000' : '#0000FF',
          lineWidth: 2
        });
        
        drawLandmarks(ctx, landmarks, {
          color: handedness.label === 'Left' ? '#FF6B6B' : '#4ECDC4',
          lineWidth: 1,
          radius: 3
        });
        
        // Подготовка данных руки для распознавания
        handsData.push({
          landmarks: landmarks,
          handedness: handedness.label,
          score: handedness.score
        });
      }
      
      setDetectedHands(handsData);
      
      // Отправка данных обеих рук для распознавания жестов
      if (handsData.length > 0) {
        const gestureData = {
          hands: handsData,
          timestamp: Date.now()
        };
        
        setLastDetectionTime(now);
        onSignDetected(gestureData);
      }
    } else {
      setDetectedHands([]);
    }
  };

  // Переключение камеры вкл/выкл
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (cameraRef.current) {
      if (isCameraOn) {
        cameraRef.current.stop();
      } else {
        cameraRef.current.start();
      }
    }
  };

  return (
    <div className="video-feed">
      {error && <div className="error-message">{error}</div>}
      
      <div className="video-container">
        {isCameraOn && (
          <>
            <Webcam
              ref={webcamRef}
              className="webcam"
              mirrored={true}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
            />
            <canvas
              ref={canvasRef}
              className="hand-landmarks"
            />
          </>
        )}
        
        {!isCameraOn && (
          <div className="camera-off-message">
            <p>Камера выключена</p>
          </div>
        )}
        
        {isModelLoading && (
          <div className="loading-message">
            <p>Загрузка модели распознавания рук...</p>
          </div>
        )}
        
        {currentSign && (
          <div className="sign-indicator">
            <p>{currentSign.text}</p>
            <small>Уверенность: {Math.round(currentSign.confidence * 100)}%</small>
          </div>
        )}
        
        {detectedHands.length > 0 && (
          <div className="hands-info">
            <p>Обнаружено рук: {detectedHands.length}</p>
            {detectedHands.map((hand, index) => (
              <small key={index}>
                {hand.handedness} рука (уверенность: {Math.round(hand.score * 100)}%)
              </small>
            ))}
          </div>
        )}
      </div>
      
      <div className="controls">
        <button className="control-button" onClick={toggleCamera}>
          {isCameraOn ? '🎥' : '▶️'}
        </button>
      </div>
    </div>
  );
};

export default VideoFeed;