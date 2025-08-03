import { extractHandFeatures } from '../utils/handUtils';

/**
 * Sign language recognition service
 * This is a placeholder for a more sophisticated ML-based recognition system
 */

// Mock dictionary of sign patterns
// In a real implementation, this would be replaced with a trained ML model
const mockSignPatterns = {
  'HELLO': {
    // Simplified feature patterns for demonstration
    thumbToIndex: { min: 0.1, max: 0.3 },
    indexToMiddle: { min: 0.05, max: 0.15 },
    thumbAngle: { min: 10, max: 40 },
    indexAngle: { min: 150, max: 180 },
  },
  'THANK YOU': {
    thumbToIndex: { min: 0.2, max: 0.4 },
    indexToMiddle: { min: 0.1, max: 0.2 },
    thumbAngle: { min: 30, max: 60 },
    indexAngle: { min: 130, max: 160 },
  },
  'YES': {
    thumbToIndex: { min: 0.15, max: 0.35 },
    indexToMiddle: { min: 0.08, max: 0.18 },
    thumbAngle: { min: 20, max: 50 },
    indexAngle: { min: 140, max: 170 },
  },
  'NO': {
    thumbToIndex: { min: 0.25, max: 0.45 },
    indexToMiddle: { min: 0.12, max: 0.22 },
    thumbAngle: { min: 40, max: 70 },
    indexAngle: { min: 120, max: 150 },
  },
};

// Recent detections for smoothing
let recentDetections = [];
const MAX_RECENT_DETECTIONS = 5;

/**
 * Recognize sign language from hand gesture data
 * @param {Object} gestureData - Data containing hand landmarks and positions
 * @returns {Promise<Object>} - The recognized sign and confidence score
 */
export const recognizeSign = async (gestureData) => {
  try {
    // Extract features from hand landmarks
    const features = extractHandFeatures(gestureData.landmarks);
    
    // In a real implementation, this would use a trained ML model
    // For now, we'll use a simple pattern matching approach
    
    // Calculate match scores for each sign in our dictionary
    const matchScores = {};
    
    Object.keys(mockSignPatterns).forEach(sign => {
      const pattern = mockSignPatterns[sign];
      let score = 0;
      let matchCount = 0;
      
      // Check each feature against the pattern
      Object.keys(pattern).forEach(feature => {
        if (features[feature] !== undefined) {
          const { min, max } = pattern[feature];
          const value = features[feature];
          
          // Check if the feature value is within the expected range
          if (value >= min && value <= max) {
            score += 1;
          }
          
          matchCount += 1;
        }
      });
      
      // Calculate normalized score (0-1)
      matchScores[sign] = matchCount > 0 ? score / matchCount : 0;
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
    if (bestMatch && highestScore > 0.6) { // Threshold for detection
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
      
      return {
        text: mostCommon,
        confidence: confidence
      };
    }
    
    // If no good match or below threshold, return null
    return null;
  } catch (error) {
    console.error('Error in sign recognition:', error);
    return null;
  }
};

/**
 * Reset the recognition state
 * Useful when changing modes or users
 */
export const resetRecognition = () => {
  recentDetections = [];
};