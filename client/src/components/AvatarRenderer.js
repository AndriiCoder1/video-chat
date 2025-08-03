import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * AvatarRenderer component for displaying a 3D avatar that performs sign language
 * @param {Object} props - Component props
 * @param {Object} props.animationData - Animation data for the avatar
 */
const AvatarRenderer = ({ animationData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const avatarRef = useRef(null);
  const animationMixerRef = useRef(null);
  const activeAnimationRef = useRef(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Create a simple avatar (placeholder)
    createPlaceholderAvatar();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Update animation mixer
      if (animationMixerRef.current) {
        animationMixerRef.current.update(0.016); // ~60fps
      }
      
      // Render scene
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cancel animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Safely remove renderer from DOM
      if (containerRef.current && rendererRef.current && rendererRef.current.domElement) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (err) {
          console.error('Error removing renderer from DOM:', err);
        }
      }
      
      // Safely dispose of Three.js resources
      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current = null;
        }
        
        // Dispose of avatar geometries and materials
        if (avatarRef.current) {
          // Check if the avatar has geometry and material properties before disposing
          if (avatarRef.current.group) {
            // Traverse all children and dispose geometries and materials
            avatarRef.current.group.traverse((object) => {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach(material => material.dispose());
                } else {
                  object.material.dispose();
                }
              }
            });
          }
          avatarRef.current = null;
        }
        
        // Clear animation mixer
        if (animationMixerRef.current) {
          animationMixerRef.current = null;
        }
        
        // Clear scene
        if (sceneRef.current) {
          while(sceneRef.current.children.length > 0) { 
            sceneRef.current.remove(sceneRef.current.children[0]); 
          }
          sceneRef.current = null;
        }
        
        // Clear camera
        cameraRef.current = null;
      } catch (err) {
        console.error('Error disposing Three.js resources:', err);
      }
    };
  }, []);
  
  // Create a placeholder avatar (simple 3D model)
  const createPlaceholderAvatar = () => {
    if (!sceneRef.current) return;
    
    // Create a group for the avatar
    const avatarGroup = new THREE.Group();
    sceneRef.current.add(avatarGroup);
    
    // Create a simple humanoid figure
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xf5d0c5 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.6;
    avatarGroup.add(head);
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4a6fa5 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.25;
    avatarGroup.add(body);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 32);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x4a6fa5 });
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, 0.3, 0);
    leftArm.rotation.z = Math.PI / 2;
    avatarGroup.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, 0.3, 0);
    rightArm.rotation.z = -Math.PI / 2;
    avatarGroup.add(rightArm);
    
    // Hands
    const handGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const handMaterial = new THREE.MeshPhongMaterial({ color: 0xf5d0c5 });
    
    // Left hand
    const leftHand = new THREE.Mesh(handGeometry, handMaterial);
    leftHand.position.set(-0.45, 0.3, 0);
    avatarGroup.add(leftHand);
    
    // Right hand
    const rightHand = new THREE.Mesh(handGeometry, handMaterial);
    rightHand.position.set(0.45, 0.3, 0);
    avatarGroup.add(rightHand);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 32);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.1, -0.2, 0);
    avatarGroup.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.1, -0.2, 0);
    avatarGroup.add(rightLeg);
    
    // Store references for animation
    avatarRef.current = {
      group: avatarGroup,
      head,
      leftHand,
      rightHand,
      leftArm,
      rightArm
    };
    
    // Create animation mixer
    animationMixerRef.current = new THREE.AnimationMixer(avatarGroup);
  };
  
  // Apply animation data when it changes
  useEffect(() => {
    if (!animationData || !avatarRef.current || !animationMixerRef.current) return;
    
    // Stop any active animation
    if (activeAnimationRef.current) {
      activeAnimationRef.current.stop();
    }
    
    // Create a simple animation based on the received data
    const { leftHand, rightHand, leftArm, rightArm } = avatarRef.current;
    
    // Create keyframe tracks for hand movements
    const duration = animationData.duration || 2.0;
    const times = [0, duration / 4, duration / 2, (3 * duration) / 4, duration];
    
    // Simple animation for demonstration
    // In a real implementation, this would use the actual animation data
    const rightHandPositions = [];
    const leftHandPositions = [];
    
    // Generate simple hand movements
    times.forEach((time, index) => {
      // Right hand movement (wave)
      const rightX = 0.45;
      const rightY = 0.3 + Math.sin(index * Math.PI / 2) * 0.2;
      const rightZ = Math.cos(index * Math.PI / 2) * 0.2;
      
      rightHandPositions.push(rightX, rightY, rightZ);
      
      // Left hand movement (mirror of right)
      const leftX = -0.45;
      const leftY = 0.3 + Math.sin((index * Math.PI / 2) + Math.PI) * 0.2;
      const leftZ = Math.cos((index * Math.PI / 2) + Math.PI) * 0.2;
      
      leftHandPositions.push(leftX, leftY, leftZ);
    });
    
    // Create animation tracks
    const rightHandTrack = new THREE.KeyframeTrack(
      '.rightHand.position',
      times,
      rightHandPositions
    );
    
    const leftHandTrack = new THREE.KeyframeTrack(
      '.leftHand.position',
      times,
      leftHandPositions
    );
    
    // Create animation clip
    const clip = new THREE.AnimationClip('sign', duration, [
      rightHandTrack,
      leftHandTrack
    ]);
    
    // Play animation
    const action = animationMixerRef.current.clipAction(clip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
    
    activeAnimationRef.current = action;
    
  }, [animationData]);
  
  return (
    <div className="avatar-renderer">
      <div className="avatar-container" ref={containerRef}></div>
      <div className="avatar-status">
        {animationData ? (
          <p>Signing: {animationData.text || 'gesture'}</p>
        ) : (
          <p>Avatar ready</p>
        )}
      </div>
    </div>
  );
};

export default AvatarRenderer;