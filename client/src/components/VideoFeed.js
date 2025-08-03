import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs';
import { drawHand } from '../utils/handUtils';

/**
 * VideoFeed component for capturing and processing sign language
 * @param {Object} props - Component props
 * @param {Function} props.onSignDetected - Callback when a sign is detected
 * @param {Object} props.currentSign - Currently detected sign
 */
const VideoFeed = ({ onSignDetected, currentSign }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState(null);

  // Load the handpose model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        // Load the TensorFlow.js model
        const loadedModel = await handpose.load();
        setModel(loadedModel);
        setIsModelLoading(false);
        console.log('Handpose model loaded');
      } catch (err) {
        console.error('Error loading handpose model:', err);
        setError('Failed to load hand detection model. Please refresh and try again.');
        setIsModelLoading(false);
      }
    };
    
    loadModel();
    
    // Clean up
    return () => {
      // Safely clean up TensorFlow memory without calling dispose directly
      try {
        // Clear any tensors in memory
        if (tf && typeof tf.engine === 'function') {
          const engine = tf.engine();
          if (engine && typeof engine.disposeVariables === 'function') {
            engine.disposeVariables();
          }
        }
      } catch (err) {
        console.error('Error cleaning up TensorFlow resources:', err);
      }
    };
  }, []);

  // Detect hands in the video feed
  useEffect(() => {
    let detectionInterval;
    
    const runHandpose = async () => {
      if (
        model &&
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4 &&
        canvasRef.current &&
        isCameraOn
      ) {
        // Get video properties
        const video = webcamRef.current.video;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Set canvas dimensions to match video
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        
        // Make hand predictions
        try {
          const hand = await model.estimateHands(video);
          
          // Draw hand landmarks on canvas
          const ctx = canvasRef.current.getContext('2d');
          drawHand(hand, ctx);
          
          // Process hand data for sign language recognition
          if (hand.length > 0) {
            // Extract hand landmarks and prepare data for sign recognition
            const gestureData = {
              landmarks: hand[0].landmarks,
              boundingBox: hand[0].boundingBox
            };
            
            // Call the sign detection callback
            onSignDetected(gestureData);
          }
        } catch (err) {
          console.error('Error detecting hands:', err);
        }
      }
    };
    
    // Run detection at regular intervals
    if (!isModelLoading && isCameraOn) {
      detectionInterval = setInterval(runHandpose, 100); // 10 fps
    }
    
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [model, isModelLoading, isCameraOn, onSignDetected]);

  // Toggle camera on/off
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
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
            />
            <canvas
              ref={canvasRef}
              className="hand-landmarks"
            />
          </>
        )}
        
        {!isCameraOn && (
          <div className="camera-off-message">
            <p>Camera is turned off</p>
          </div>
        )}
        
        {isModelLoading && (
          <div className="loading-message">
            <p>Loading hand detection model...</p>
          </div>
        )}
        
        {currentSign && (
          <div className="sign-indicator">
            <p>{currentSign.text}</p>
            <small>Confidence: {Math.round(currentSign.confidence * 100)}%</small>
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