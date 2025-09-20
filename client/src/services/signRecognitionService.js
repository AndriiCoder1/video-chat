import { extractBothHandsFeatures } from '../utils/handUtils';

/**
 * Сервис распознавания языка жестов с поддержкой двух рук
 * 
 * Основные функции:
 * - Распознавание жестов на основе анализа положения обеих рук
 * - Поддержка различных жестов с конфигурируемыми параметрами
 * - Сглаживание результатов через систему недавних обнаружений
 * - Фильтрация повторяющихся жестов для предотвращения спама
 * - Расчет уверенности распознавания на основе согласованности жестов
 * 
 * Особенности реализации:
 * - Использование MediaPipe Hands для отслеживания ключевых точек рук
 * - Поддержка жестов, требующих одной или обеих рук
 * - Настраиваемые параметры для каждого жеста (углы, расстояния)
 * - Система весов и проверок для точного распознавания
 */

// Улучшенные шаблоны жестов с поддержкой двух рук
const bothHandsSignPatterns = {
  'HELLO': {
    requiresBothHands: false, // Не требует обеих рук
    rightHand: {
      thumbToIndex: { min: 0.1, max: 0.3 }, // Расстояние между большим и указательным пальцем
      indexAngle: { min: 150, max: 180 }, // Угол между указательного пальца
    }
  },
  'THANK YOU': {
    requiresBothHands: true, // Требует обеих рук
    bothHands: {
      handsDistance: { min: 0.2, max: 0.5 }, // Расстояние между руками
      handsSymmetric: true // Руки симметричны
    },
    leftHand: {
      thumbToIndex: { min: 0.2, max: 0.4 } // Расстояние между большим и указательным пальцем левой руки
    },
    rightHand: {
      thumbToIndex: { min: 0.2, max: 0.4 } // Расстояние между большим и указательным пальцем правой руки
    }
  },
  'YES': {
    requiresBothHands: false,
    rightHand: {
      thumbAngle: { min: 20, max: 50 }, // Угол большого пальца
      indexAngle: { min: 140, max: 170 } // Угол указательного пальца
    }
  },
  'NO': {
    requiresBothHands: true,
    bothHands: {
      indexFingertipsDistance: { min: 0.3, max: 0.7 } // Расстояние между кончиками указательных пальцев
    }
  },
  'PLEASE': {
    requiresBothHands: true,
    bothHands: {
      handsDistance: { min: 0.1, max: 0.3 }, // Расстояние между руками
      handsSymmetric: true // Руки симметричны
    }
  },
  'LOVE': {
    requiresBothHands: false,
    rightHand: {
      thumbToIndex: { min: 0.15, max: 0.35 }, // Расстояние между большим и указательным пальцем
      pinkyAngle: { min: 160, max: 180 } // Угол мизинца
    }
  }
};

// Хранилище недавних распознаваний для сглаживания результатов
let recentDetections = [];
let lastSentDetection = null; // Последнее отправленное распознавание
const MAX_RECENT_DETECTIONS = 5; // Максимальное количество хранимых распознаваний

/**
 * Распознает язык жестов на основе данных о положении обеих рук
 * @param {Object} gestureData - Данные, содержащие landmarks и позиции обеих рук
 * @returns {Promise<Object>} - Распознанный жест и показатель уверенности
 */
export const recognizeSign = async (gestureData) => {
  try {
    // Проверка наличия данных о руках
    if (!gestureData || !gestureData.hands || gestureData.hands.length === 0) {
      return null;
    }

    // Извлечение характеристик из данных обеих рук
    const features = extractBothHandsFeatures(gestureData.hands);

    // Расчет показателей соответствия для каждого шаблона жеста
    const matchScores = {};

    Object.keys(bothHandsSignPatterns).forEach(sign => {
      const pattern = bothHandsSignPatterns[sign];
      let score = 0;
      let totalChecks = 0;

      // Проверка требования обеих рук
      if (pattern.requiresBothHands && (!features.leftHand || !features.rightHand)) {
        matchScores[sign] = 0;
        return;
      }

      // Проверка характеристик обеих рук
      if (pattern.bothHands && features.bothHands) {
        const bothHandsScore = checkFeatureMatch(features.bothHands, pattern.bothHands);
        score += bothHandsScore.score;
        totalChecks += bothHandsScore.checks;
      }

      // Проверка характеристик левой руки
      if (pattern.leftHand && features.leftHand) {
        const leftHandScore = checkFeatureMatch(features.leftHand, pattern.leftHand);
        score += leftHandScore.score;
        totalChecks += leftHandScore.checks;
      }

      // Проверка характеристик правой руки
      if (pattern.rightHand && features.rightHand) {
        const rightHandScore = checkFeatureMatch(features.rightHand, pattern.rightHand);
        score += rightHandScore.score;
        totalChecks += rightHandScore.checks;
      }

      // Расчет нормализованного показателя
      matchScores[sign] = totalChecks > 0 ? score / totalChecks : 0;
    });

    // Поиск наилучшего соответствия
    let bestMatch = null;
    let highestScore = 0;

    Object.keys(matchScores).forEach(sign => {
      if (matchScores[sign] > highestScore) {
        highestScore = matchScores[sign];
        bestMatch = sign;
      }
    });

    // Добавление в недавние распознавания для сглаживания
    if (bestMatch && highestScore > 0.7) { // Увеличен порог распознавания
      recentDetections.push(bestMatch);

      //  Сохранение только самых последних распознаваний
      if (recentDetections.length > MAX_RECENT_DETECTIONS) {
        recentDetections.shift();
      }

      // Поиск наиболее частого распознавания в recentDetections
      const counts = {};
      recentDetections.forEach(detection => {
        counts[detection] = (counts[detection] || 0) + 1;
      });

      let mostCommon = null;
      let highestCount = 0;

      Object.keys(counts).forEach(detection => {
        if (counts[detection] > highestCount) {
          highestCount = counts[detection];
          mostCommon = detection;
        }
      });

      // Расчет уверенности на основе согласованности и показателя соответствия
      const consistency = highestCount / MAX_RECENT_DETECTIONS;
      const confidence = (highestScore + consistency) / 2;

      // Не возвращать повторяющиеся сообщения
      if (mostCommon === lastSentDetection && confidence > 0.8) {
        return null;
      }

      // Увеличить требования к стабильности
      const MIN_CONSISTENT_DETECTIONS = 3; // Минимум 3 одинаковых распознавания
      const MIN_CONFIDENCE_THRESHOLD = 0.8; // Повысить порог уверенности
      
      // Добавить проверку времени удержания жеста
      let gestureStartTime = null;
      const MIN_GESTURE_DURATION = 1500; // 1.5 секунды
      
      if (mostCommon && Date.now() - gestureStartTime > MIN_GESTURE_DURATION) {
        // Отправить жест
      }
      if (confidence > 0.7) {
        lastSentDetection = mostCommon;
        return {
          text: mostCommon,
          confidence: confidence,
          handsUsed: gestureData.hands.map(h => h.handedness)
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Ошибка в распознавании жестов двумя руками:', error);
    return null;
  }
};

/**
 * Проверяет соответствие характеристик шаблону
 * @param {Object} features - Извлеченные характеристики
 * @param {Object} pattern -  Шаблон для сравнения
 * @returns {Object} - Показатель соответствия и количество проверок
 */
const checkFeatureMatch = (features, pattern) => {
  let score = 0;
  let checks = 0;

  Object.keys(pattern).forEach(feature => {
    if (features[feature] !== undefined) {
      const patternValue = pattern[feature];
      const featureValue = features[feature];

      // Проверка диапазона значений
      if (typeof patternValue === 'object' && patternValue.min !== undefined) {
        if (featureValue >= patternValue.min && featureValue <= patternValue.max) {
          score += 1;
        }
      } 
      // Проверка булевых значений
      else if (typeof patternValue === 'boolean') {
        if (featureValue === patternValue) {
          score += 1;
        }
      }

      checks += 1;
    }
  });

  return { score, checks };
};

/**
 * Сбрасывает состояние распознавания
 * Полезно при смене режимов или пользователей
 */
export const resetRecognition = () => {
  recentDetections = [];
  lastSentDetection = null;
};
