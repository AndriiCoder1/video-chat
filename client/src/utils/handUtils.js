/**
 * Utility functions for hand landmark processing and drawing
 */

// Finger joint connections for drawing
const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

// Drawing styles
const style = {
  point: {
    color: '#4fc3f7',
    size: 6,
  },
  connection: {
    color: 'rgba(255, 255, 255, 0.7)',
    width: 2,
  },
};

/**
 * Draw hand landmarks on canvas
 * @param {Array} predictions - Hand predictions from the handpose model
 * @param {CanvasRenderingContext2D} ctx - Canvas context for drawing
 */
export const drawHand = (predictions, ctx) => {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Check if we have predictions
  if (predictions.length > 0) {
    // Loop through each prediction
    predictions.forEach((prediction) => {
      // Grab landmarks
      const landmarks = prediction.landmarks;
      
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
            landmarks[firstJointIndex][0],
            landmarks[firstJointIndex][1]
          );
          ctx.lineTo(
            landmarks[secondJointIndex][0],
            landmarks[secondJointIndex][1]
          );
          ctx.strokeStyle = style.connection.color;
          ctx.lineWidth = style.connection.width;
          ctx.stroke();
        }
      }
      
      // Draw landmarks
      for (let i = 0; i < landmarks.length; i++) {
        // Get x and y coordinates
        const x = landmarks[i][0];
        const y = landmarks[i][1];
        
        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, style.point.size, 0, 3 * Math.PI);
        ctx.fillStyle = style.point.color;
        ctx.fill();
      }
    });
  }
};

/**
 * Calculate the distance between two landmarks
 * @param {Array} landmark1 - First landmark [x, y, z]
 * @param {Array} landmark2 - Second landmark [x, y, z]
 * @returns {number} - Euclidean distance between landmarks
 */
export const calculateDistance = (landmark1, landmark2) => {
  const dx = landmark1[0] - landmark2[0];
  const dy = landmark1[1] - landmark2[1];
  const dz = landmark1[2] - landmark2[2];
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Calculate the angle between three landmarks
 * @param {Array} landmark1 - First landmark [x, y, z]
 * @param {Array} landmark2 - Second landmark (vertex) [x, y, z]
 * @param {Array} landmark3 - Third landmark [x, y, z]
 * @returns {number} - Angle in degrees
 */
export const calculateAngle = (landmark1, landmark2, landmark3) => {
  // Calculate vectors
  const vector1 = [
    landmark1[0] - landmark2[0],
    landmark1[1] - landmark2[1],
    landmark1[2] - landmark2[2],
  ];
  
  const vector2 = [
    landmark3[0] - landmark2[0],
    landmark3[1] - landmark2[1],
    landmark3[2] - landmark2[2],
  ];
  
  // Calculate dot product
  const dotProduct =
    vector1[0] * vector2[0] + vector1[1] * vector2[1] + vector1[2] * vector2[2];
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(
    vector1[0] * vector1[0] + vector1[1] * vector1[1] + vector1[2] * vector1[2]
  );
  
  const magnitude2 = Math.sqrt(
    vector2[0] * vector2[0] + vector2[1] * vector2[1] + vector2[2] * vector2[2]
  );
  
  // Calculate angle in radians
  const angleRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));
  
  // Convert to degrees
  return (angleRadians * 180) / Math.PI;
};

/**
 * Extract features from hand landmarks for sign recognition
 * @param {Array} landmarks - Hand landmarks from the handpose model
 * @returns {Object} - Features for sign recognition
 */
export const extractHandFeatures = (landmarks) => {
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