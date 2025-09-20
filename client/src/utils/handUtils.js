/**
 * Утилиты для обработки и отрисовки landmarks (ключевых точек) обеих рук
 * 
 * Основные функции:
 * - Отрисовка скелета рук и ключевых точек на canvas
 * - Вычисление расстояний между landmarks
 * - Расчет углов между тремя landmarks
 * - Извлечение характеристик для одной и обеих рук
 * - Поддержка различных стилей отрисовки для левой и правой руки
 * 
 * Используется в компоненте VideoFeed для визуализации отслеживания рук
 * и в сервисе распознавания жестов для извлечения характеристик.
 */

// Соединения суставов пальцев для отрисовки
const fingerJoints = {
  thumb: [0, 1, 2, 3, 4], // Большой палец: от запястья к кончику
  indexFinger: [0, 5, 6, 7, 8], // Указательный палец: от запястья к кончику
  middleFinger: [0, 9, 10, 11, 12], // Средний палец: от запястья к кончику
  ringFinger: [0, 13, 14, 15, 16], // Безымянный палец: от запястья к кончику
  pinky: [0, 17, 18, 19, 20], // Мизинец: от запястья к кончику
};

// Стили отрисовки для разных рук
const handStyles = {
  Left: { // Стиль для левой руки
    point: { color: '#FF6B6B', size: 4 }, // Цвет и размер точек (красноватые точки)
    connection: { color: 'rgba(255, 107, 107, 0.8)', width: 2 } // Цвет и ширина соединений
  },
  Right: { // Стиль для правой руки
    point: { color: '#4ECDC4', size: 4 }, // Цвет и размер точек (голубоватые точки)
    connection: { color: 'rgba(78, 205, 196, 0.8)', width: 2 } // Цвет и ширина соединений
  }
};

/**
 * Отрисовывает landmarks обеих рук на canvas
 * @param {Array} handsData - Массив данных о руках с landmarks и handedness
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas для отрисовки
 */
export const drawBothHands = (handsData, ctx) => {
  // Очистка canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Проверка наличия данных о руках
  if (handsData && handsData.length > 0) {
    // Обработка каждой обнаруженной руки
    handsData.forEach((handData) => {
      const { landmarks, handedness } = handData;
      const style = handStyles[handedness] || handStyles.Right;
      
      // Отрисовка соединений суставов пальцев
      for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
        const finger = Object.keys(fingerJoints)[j];
        
        // Проход по суставам пальца
        for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
          // Получение соединенных суставов
          const firstJointIndex = fingerJoints[finger][k];
          const secondJointIndex = fingerJoints[finger][k + 1];
          
          // Отрисовка линии соединения
          ctx.beginPath();
          ctx.moveTo(
            landmarks[firstJointIndex].x * ctx.canvas.width,
            landmarks[firstJointIndex].y * ctx.canvas.height
          );
          ctx.lineTo(
            landmarks[secondJointIndex].x * ctx.canvas.width,
            landmarks[secondJointIndex].y * ctx.canvas.height
          );
          ctx.strokeStyle = style.connection.color;
          ctx.lineWidth = style.connection.width;
          ctx.stroke();
        }
      }
      
      // Отрисовка landmarks (ключевых точек)
      for (let i = 0; i < landmarks.length; i++) {
        // Получение координат x и y (MediaPipe возвращает нормализованные координаты)
        const x = landmarks[i].x * ctx.canvas.width;
        const y = landmarks[i].y * ctx.canvas.height;
        
        // Отрисовка точки
        ctx.beginPath();
        ctx.arc(x, y, style.point.size, 0, 2 * Math.PI);
        ctx.fillStyle = style.point.color;
        ctx.fill();
      }
    });
  }
};

/**
 * Вычисляет расстояние между двумя landmarks (нормализованные координаты)
 * @param {Object} landmark1 - Первый landmark {x, y, z}
 * @param {Object} landmark2 - Второй landmark {x, y, z}
 * @returns {number} - Евклидово расстояние между landmarks
 */
export const calculateDistance = (landmark1, landmark2) => {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = (landmark1.z || 0) - (landmark2.z || 0);
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Вычисляет угол между тремя landmarks
 * @param {Object} landmark1 - Первый landmark {x, y, z}
 * @param {Object} landmark2 - Второй landmark (вершина угла) {x, y, z}
 * @param {Object} landmark3 - Третий landmark {x, y, z}
 * @returns {number} - Угол в градусах
 */
export const calculateAngle = (landmark1, landmark2, landmark3) => {
  // Вычисление векторов
  const vector1 = {
    x: landmark1.x - landmark2.x,
    y: landmark1.y - landmark2.y,
    z: (landmark1.z || 0) - (landmark2.z || 0)
  };
  
  const vector2 = {
    x: landmark3.x - landmark2.x,
    y: landmark3.y - landmark2.y,
    z: (landmark3.z || 0) - (landmark2.z || 0)
  };
  
  // Вычисление скалярного произведения
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  
  // Вычисление длин векторов
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);
  
  // Вычисление угла в радианах
  const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
  
  // Конвертация в градусы
  return angleRad * (180 / Math.PI);
};

/**
 * Извлекает характеристики из landmarks обеих рук
 * @param {Array} handsData - Массив данных о руках
 * @returns {Object} - Извлеченные характеристики для обеих рук
 */
export const extractBothHandsFeatures = (handsData) => {
  const features = {
    leftHand: null, // Характеристики левой руки
    rightHand: null, // Характеристики правой руки
    bothHands: null // Характеристики, требующие обеих рук
  };
  
  // Проверка наличия данных о руках
  if (!handsData || handsData.length === 0) {
    return features;
  }
  
  //  Обработка каждой обнаруженной руки
  handsData.forEach((handData) => {
    const { landmarks, handedness } = handData;
    const handFeatures = extractSingleHandFeatures(landmarks);

    // Сохранение характеристик в соответствующее свойство
    if (handedness === 'Left') {
      features.leftHand = handFeatures;
    } else if (handedness === 'Right') {
      features.rightHand = handFeatures;
    }
  });
  
  // Вычисление характеристик, требующих обеих рук
  if (features.leftHand && features.rightHand) {
    const leftHand = handsData.find(h => h.handedness === 'Left');
    const rightHand = handsData.find(h => h.handedness === 'Right');
    
    features.bothHands = {
      // Расстояние между руками (по средним точкам ладоней)
      handsDistance: calculateDistance(
        leftHand.landmarks[9], // Средняя точка ладони левой руки (middle finger MCP)
        rightHand.landmarks[9]  // Средняя точка ладони правой руки (middle finger MCP)
      ),
      
      // Расстояние между кончиками указательных пальцев
      indexFingertipsDistance: calculateDistance(
        leftHand.landmarks[8],  // Кончик указательного пальца левой руки
        rightHand.landmarks[8]  // Кончик указательного пальца правой руки
      ),
      
      // Относительные позиции рук 
      leftHandHigher: leftHand.landmarks[9].y < rightHand.landmarks[9].y, // Левая рука выше правой
      handsSymmetric: Math.abs(leftHand.landmarks[9].y - rightHand.landmarks[9].y) < 0.1 // Руки симметричны по высоте
    };
  }
  
  return features;
};

/**
 * Извлекает характеристики из landmarks одной руки
 * @param {Array} landmarks - Landmarks руки
 * @returns {Object} - Извлеченные характеристики
 */
const extractSingleHandFeatures = (landmarks) => {
  // Вычисление расстояний от кончиков пальцев до запястья
  const thumbToWrist = calculateDistance(landmarks[4], landmarks[0]); // Большой палец до запястья
  const indexToWrist = calculateDistance(landmarks[8], landmarks[0]); // Указательный палец до запястья
  const middleToWrist = calculateDistance(landmarks[12], landmarks[0]); // Средний палец до запястья
  const ringToWrist = calculateDistance(landmarks[16], landmarks[0]); // Безымянный палец до запястья
  const pinkyToWrist = calculateDistance(landmarks[20], landmarks[0]); // Мизинец до запястья
  
  // Вычисление углов в суставах пальцев
  const thumbAngle = calculateAngle(landmarks[2], landmarks[3], landmarks[4]); // Угол большого пальца
  const indexAngle = calculateAngle(landmarks[6], landmarks[7], landmarks[8]); // Угол указательного пальца
  const middleAngle = calculateAngle(landmarks[10], landmarks[11], landmarks[12]); // Угол среднего пальца
  const ringAngle = calculateAngle(landmarks[14], landmarks[15], landmarks[16]); // Угол безымянного пальца
  const pinkyAngle = calculateAngle(landmarks[18], landmarks[19], landmarks[20]); // Угол мизинца
  
  // Вычисление расстояний между кончиками пальцев
  const thumbToIndex = calculateDistance(landmarks[4], landmarks[8]); // Большой-указательный 
  const indexToMiddle = calculateDistance(landmarks[8], landmarks[12]); // Указательный-средний
  const middleToRing = calculateDistance(landmarks[12], landmarks[16]); // Средний-безымянный
  const ringToPinky = calculateDistance(landmarks[16], landmarks[20]); // Безымянный-мизинец
  
  return {
    // Расстояния до запястья
    thumbToWrist,
    indexToWrist,
    middleToWrist,
    ringToWrist,
    pinkyToWrist,
    
    // Углы в суставах 
    thumbAngle,
    indexAngle,
    middleAngle,
    ringAngle,
    pinkyAngle,
    
    // Расстояния между кончиками пальцев
    thumbToIndex,
    indexToMiddle,
    middleToRing,
    ringToPinky,
  };
};