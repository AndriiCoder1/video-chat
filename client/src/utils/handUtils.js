/**
 * Utility functions for both hands landmark processing and drawing
 */

// Finger joint connections for drawing
const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

// Drawing styles for different hands
const handStyles = {
  Left: {
    point: { color: '#FF6B6B', size: 4 },
    connection: { color: 'rgba(255, 107, 107, 0.8)', width: 2 }
  },
  Right: {
    point: { color: '#4ECDC4', size: 4 },
    connection: { color: 'rgba(78, 205, 196, 0.8)', width: 2 }
  }
};

/**
 * Draw both hands landmarks on canvas
 * @param {Array} handsData - Array of hand data with landmarks and handedness
 * @param {CanvasRenderingContext2D} ctx - Canvas context for drawing
 */
export const drawBothHands = (handsData, ctx) => {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Check if we have hands data
  if (handsData && handsData.length > 0) {
    handsData.forEach((handData) => {
      const { landmarks, handedness } = handData;
      const style = handStyles[handedness] || handStyles.Right;
      
      // Draw finger joints connections
      for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
        const finger = Object.keys(fingerJoints)[j];
        
        // Loop through finger joints
        for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
          // Get connected joints
          const firstJointIndex = fingerJoints[finger][k];
          const secondJointIndex = fingerJoints[finger][k + 1];
          
          // Draw path
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
      
      // Draw landmarks
      for (let i = 0; i < landmarks.length; i++) {
        // Get x and y coordinates (MediaPipe returns normalized coordinates)
        const x = landmarks[i].x * ctx.canvas.width;
        const y = landmarks[i].y * ctx.canvas.height;
        
        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, style.point.size, 0, 2 * Math.PI);
        ctx.fillStyle = style.point.color;
        ctx.fill();
      }
    });
  }
};

/**
 * Calculate the distance between two landmarks (normalized coordinates)
 * @param {Object} landmark1 - First landmark {x, y, z}
 * @param {Object} landmark2 - Second landmark {x, y, z}
 * @returns {number} - Euclidean distance between landmarks
 */
export const calculateDistance = (landmark1, landmark2) => {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = (landmark1.z || 0) - (landmark2.z || 0);
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Calculate the angle between three landmarks
 * @param {Object} landmark1 - First landmark {x, y, z}
 * @param {Object} landmark2 - Second landmark (vertex) {x, y, z}
 * @param {Object} landmark3 - Third landmark {x, y, z}
 * @returns {number} - Angle in degrees
 */
export const calculateAngle = (landmark1, landmark2, landmark3) => {
  // Calculate vectors
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
  
  // Calculate dot product
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);
  
  // Calculate angle in radians
  const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
  
  // Convert to degrees
  return angleRad * (180 / Math.PI);
};

/**
 * Extract features from both hands landmarks
 * @param {Array} handsData - Array of hand data
 * @returns {Object} - Extracted features for both hands
 */
export const extractBothHandsFeatures = (handsData) => {
  const features = {
    leftHand: null,
    rightHand: null,
    bothHands: null
  };
  
  if (!handsData || handsData.length === 0) {
    return features;
  }
  
  // Process each detected hand
  handsData.forEach((handData) => {
    const { landmarks, handedness } = handData;
    const handFeatures = extractSingleHandFeatures(landmarks);
    
    if (handedness === 'Left') {
      features.leftHand = handFeatures;
    } else if (handedness === 'Right') {
      features.rightHand = handFeatures;
    }
  });
  
  // Calculate features that require both hands
  if (features.leftHand && features.rightHand) {
    const leftHand = handsData.find(h => h.handedness === 'Left');
    const rightHand = handsData.find(h => h.handedness === 'Right');
    
    features.bothHands = {
      // Distance between hands
      handsDistance: calculateDistance(
        leftHand.landmarks[9], // Left hand middle finger MCP
        rightHand.landmarks[9]  // Right hand middle finger MCP
      ),
      
      // Distance between index fingertips
      indexFingertipsDistance: calculateDistance(
        leftHand.landmarks[8],  // Left index fingertip
        rightHand.landmarks[8]  // Right index fingertip
      ),
      
      // Relative hand positions
      leftHandHigher: leftHand.landmarks[9].y < rightHand.landmarks[9].y,
      handsSymmetric: Math.abs(leftHand.landmarks[9].y - rightHand.landmarks[9].y) < 0.1
    };
  }
  
  return features;
};

/**
 * Extract features from a single hand
 * @param {Array} landmarks - Hand landmarks
 * @returns {Object} - Extracted features
 */
const extractSingleHandFeatures = (landmarks) => {
  // Calculate distances between fingertips and wrist
  const thumbToWrist = calculateDistance(landmarks[4], landmarks[0]);
  const indexToWrist = calculateDistance(landmarks[8], landmarks[0]);
  const middleToWrist = calculateDistance(landmarks[12], landmarks[0]);
  const ringToWrist = calculateDistance(landmarks[16], landmarks[0]);
  const pinkyToWrist = calculateDistance(landmarks[20], landmarks[0]);
  
  // Calculate angles at finger joints
  const thumbAngle = calculateAngle(landmarks[2], landmarks[3], landmarks[4]);
  const indexAngle = calculateAngle(landmarks[6], landmarks[7], landmarks[8]);
  const middleAngle = calculateAngle(landmarks[10], landmarks[11], landmarks[12]);
  const ringAngle = calculateAngle(landmarks[14], landmarks[15], landmarks[16]);
  const pinkyAngle = calculateAngle(landmarks[18], landmarks[19], landmarks[20]);
  
  // Calculate distances between fingertips
  const thumbToIndex = calculateDistance(landmarks[4], landmarks[8]);
  const indexToMiddle = calculateDistance(landmarks[8], landmarks[12]);
  const middleToRing = calculateDistance(landmarks[12], landmarks[16]);
  const ringToPinky = calculateDistance(landmarks[16], landmarks[20]);
  
  return {
    // Distances to wrist
    thumbToWrist,
    indexToWrist,
    middleToWrist,
    ringToWrist,
    pinkyToWrist,
    
    // Joint angles
    thumbAngle,
    indexAngle,
    middleAngle,
    ringAngle,
    pinkyAngle,
    
    // Fingertip distances
    thumbToIndex,
    indexToMiddle,
    middleToRing,
    ringToPinky,
  };
};