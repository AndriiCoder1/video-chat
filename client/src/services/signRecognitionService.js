import { extractBothHandsFeatures } from '../utils/handUtils';

/**
 * Enhanced sign language recognition service with both hands support
 */

// Enhanced sign patterns that consider both hands
const bothHandsSignPatterns = {
  'HELLO': {
    requiresBothHands: false,
    rightHand: {
      thumbToIndex: { min: 0.1, max: 0.3 },
      indexAngle: { min: 150, max: 180 },
    }
  },
  'THANK YOU': {
    requiresBothHands: true,
    bothHands: {
      handsDistance: { min: 0.2, max: 0.5 },
      handsSymmetric: true
    },
    leftHand: {
      thumbToIndex: { min: 0.2, max: 0.4 }
    },
    rightHand: {
      thumbToIndex: { min: 0.2, max: 0.4 }
    }
  },
  'YES': {
    requiresBothHands: false,
    rightHand: {
      thumbAngle: { min: 20, max: 50 },
      indexAngle: { min: 140, max: 170 }
    }
  },
  'NO': {
    requiresBothHands: true,
    bothHands: {
      indexFingertipsDistance: { min: 0.3, max: 0.7 }
    }
  },
  'PLEASE': {
    requiresBothHands: true,
    bothHands: {
      handsDistance: { min: 0.1, max: 0.3 },
      handsSymmetric: true
    }
  },
  'LOVE': {
    requiresBothHands: false,
    rightHand: {
      thumbToIndex: { min: 0.15, max: 0.35 },
      pinkyAngle: { min: 160, max: 180 }
    }
  }
};

// Recent detections for smoothing
let recentDetections = [];
let lastSentDetection = null; // New: track last sent
const MAX_RECENT_DETECTIONS = 5;

/**
 * Recognize sign language from both hands gesture data
 * @param {Object} gestureData - Data containing both hands landmarks and positions
 * @returns {Promise<Object>} - The recognized sign and confidence score
 */
export const recognizeSign = async (gestureData) => {
  try {
    if (!gestureData || !gestureData.hands || gestureData.hands.length === 0) {
      return null;
    }

    // Extract features from both hands
    const features = extractBothHandsFeatures(gestureData.hands);

    // Calculate match scores for each sign pattern
    const matchScores = {};

    Object.keys(bothHandsSignPatterns).forEach(sign => {
      const pattern = bothHandsSignPatterns[sign];
      let score = 0;
      let totalChecks = 0;

      // Check if both hands are required but not available
      if (pattern.requiresBothHands && (!features.leftHand || !features.rightHand)) {
        matchScores[sign] = 0;
        return;
      }

      // Check both hands features
      if (pattern.bothHands && features.bothHands) {
        const bothHandsScore = checkFeatureMatch(features.bothHands, pattern.bothHands);
        score += bothHandsScore.score;
        totalChecks += bothHandsScore.checks;
      }

      // Check left hand features
      if (pattern.leftHand && features.leftHand) {
        const leftHandScore = checkFeatureMatch(features.leftHand, pattern.leftHand);
        score += leftHandScore.score;
        totalChecks += leftHandScore.checks;
      }

      // Check right hand features
      if (pattern.rightHand && features.rightHand) {
        const rightHandScore = checkFeatureMatch(features.rightHand, pattern.rightHand);
        score += rightHandScore.score;
        totalChecks += rightHandScore.checks;
      }

      // Calculate normalized score
      matchScores[sign] = totalChecks > 0 ? score / totalChecks : 0;
    });

    // Find the best match
    let bestMatch = null;
    let highestScore = 0;

    Object.keys(matchScores).forEach(sign => {
      if (matchScores[sign] > highestScore) {
        highestScore = matchScores[sign];
        bestMatch = sign;
      }
    });

    // Add to recent detections for smoothing
    if (bestMatch && highestScore > 0.7) { // Увеличен порог распознавания
      recentDetections.push(bestMatch);

      // Keep only the most recent detections
      if (recentDetections.length > MAX_RECENT_DETECTIONS) {
        recentDetections.shift();
      }

      // Find the most common detection in the recent history
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

      // Calculate confidence based on consistency and match score
      const consistency = highestCount / MAX_RECENT_DETECTIONS;
      const confidence = (highestScore + consistency) / 2;

      // Don't return repeated message if it's the same
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
    console.error('Error in both hands sign recognition:', error);
    return null;
  }
};

/**
 * Check if features match a pattern
 * @param {Object} features - Extracted features
 * @param {Object} pattern - Pattern to match against
 * @returns {Object} - Score and number of checks
 */
const checkFeatureMatch = (features, pattern) => {
  let score = 0;
  let checks = 0;

  Object.keys(pattern).forEach(feature => {
    if (features[feature] !== undefined) {
      const patternValue = pattern[feature];
      const featureValue = features[feature];

      if (typeof patternValue === 'object' && patternValue.min !== undefined) {
        if (featureValue >= patternValue.min && featureValue <= patternValue.max) {
          score += 1;
        }
      } else if (typeof patternValue === 'boolean') {
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
 * Reset the recognition state
 * Useful when changing modes or users
 */
export const resetRecognition = () => {
  recentDetections = [];
  lastSentDetection = null;
};
