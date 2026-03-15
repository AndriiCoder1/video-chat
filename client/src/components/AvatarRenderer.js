import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
/**
 * Компонент AvatarRenderer для отображения 3D аватара с анимацией
 * @param {Object} props - Компонентные пропсы
 * @param {Object} props.animationData - Данные анимации для воспроизведения
 */ 
const AvatarRenderer = ({ animationData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const avatarRef = useRef(null);
  const animationMixerRef = useRef(null);
  const activeAnimationRef = useRef(null);
  
  // Инициализация сцены, камеры и рендерера  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Создание сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Создание камеры
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 4;
    camera.position.y = 2;
    cameraRef.current = camera;
    
    // Создание рендерера
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Добавление освещения
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Создание простого аватара (заглушка)
    loadAvatarModel();
    
    // Обработка изменения размера окна
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Анимационный цикл
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Обновление анимации
      if (animationMixerRef.current) {
        animationMixerRef.current.update(0.016); // ~60fps
      }
      
      // Рендеринг сцены
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Очистка при размонтировании компонента
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Отмена анимационного кадра
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Удаление рендерера из DOM
      if (containerRef.current && rendererRef.current && rendererRef.current.domElement) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (err) {
          console.error('Error removing renderer from DOM:', err);
        }
      }
      
      // Освобождение ресурсов Three.js
      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current = null;
        }
        
        // Диспозиция аватара
        if (avatarRef.current) {
          // Проверка и удаление всех геометрий и материалов
          if (avatarRef.current.group) {
            // Очистка всех дочерних объектов
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
        
        // Очистка анимационного миксера
        if (animationMixerRef.current) {
          animationMixerRef.current = null;
        }
        
        // Очистка сцены
        if (sceneRef.current) {
          while(sceneRef.current.children.length > 0) { 
            sceneRef.current.remove(sceneRef.current.children[0]); 
          }
          sceneRef.current = null;
        }
        
        // Очистка камеры
        cameraRef.current = null;
      } catch (err) {
        console.error('Error disposing Three.js resources:', err);
      }
    };
  }, []);
  
  // Загрузка GLB модели вместо создания из примитивов
  const loadAvatarModel = () => {
    if (!sceneRef.current) return;
    
    const loader = new GLTFLoader();
    
    loader.load(
      '/models/mita/mita_model.glb', // путь к твоему файлу
      (gltf) => {
        const model = gltf.scene;
        
        // Масштабируем модель под размер сцены
        model.scale.set(0.083, 0.083, 0.083);
        
        // Центрируем модель
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Опускаем, чтобы стояла на полу
        model.position.y = -0.6; 
        model.position.z = -0.2;
        sceneRef.current.add(model);
        
        // Находим руки по именам (нужно узнать точные названия костей)
        const rightHand = model.getObjectByName('RightHand') || 
                        model.getObjectByName('mixamorigRightHand');
        const leftHand = model.getObjectByName('LeftHand') || 
                        model.getObjectByName('mixamorigLeftHand');
        
        avatarRef.current = {
          group: model,
          rightHand,
          leftHand
        };
        
        // Инициализация анимационного миксера на сцене
        animationMixerRef.current = new THREE.AnimationMixer(sceneRef.current);
        
        console.log('✅ Модель загружена!', {
          rightHand: !!rightHand,
          leftHand: !!leftHand
        });
      },
      (xhr) => {
        console.log(`Загрузка: ${(xhr.loaded / xhr.total * 100)}%`);
      },
      (error) => {
        console.error('❌ Ошибка загрузки модели:', error);
      }
    );
  };
    
  // Воспроизведение анимации при получении новых данных
  useEffect(() => {
    // Ждём, пока аватар создастся
    if (!avatarRef.current || !animationMixerRef.current) {
      console.log('⏳ Аватар ещё не готов, ждём...');
      return;
    }
    
    if (!animationData) return;

    console.log('🎬 Данные анимации:', {
      hasTracks: !!animationData.tracks,
      trackCount: animationData.tracks?.length,
      firstTrack: animationData.tracks?.[0],
      objectNames: animationData.tracks?.map(t => t.object)
    });
    
    // Проверка: если анимация уже воспроизводится, не запускаем новую
    if (activeAnimationRef.current && activeAnimationRef.current.isRunning()) {
      console.log('⏸️ Анимация уже воспроизводится, пропускаем');
      return;
    }

    console.log('🎬 Воспроизведение анимации:', animationData);
    
    try {
      const { leftHand, rightHand } = avatarRef.current;
      
      if (!leftHand || !rightHand) {
        console.error('❌ Объекты рук не найдены');
        return;
      }
      
      // Остановка предыдущей анимации
      if (activeAnimationRef.current) {
        activeAnimationRef.current.stop();
      }
      // Создание анимации на основе полученных данных
      let duration = animationData.duration || 2.0;
      let tracks = [];
      
      if (animationData.tracks && animationData.tracks.length > 0) {
        // Используем данные из сервера
        animationData.tracks.forEach(trackData => {
          const trackTimes = [];
          const trackValues = [];
          
          if (trackData.keyframes && trackData.keyframes.length > 0) {
            trackData.keyframes.forEach(kf => {
              // Если сервер присылает время в кадре, используем его, иначе распределяем по длительности
              const time = kf.time !== undefined ? kf.time : (kf.frame / 30) || 0;
              trackTimes.push(time);
              trackValues.push(kf.value.x, kf.value.y, kf.value.z);
              
              // Обновляем длительность клипа, если есть времена больше текущей
              if (time > duration) duration = time;
            });

            // Определяем имя объекта (убеждаемся, что оно соответствует иерархии)
             // В THREE.js для обращения к дочернему объекту по имени можно использовать скобки:
             // [имя].свойство
             const trackName = `${trackData.object}.position`;
            
            // Создаем векторный трек
            const track = new THREE.VectorKeyframeTrack(
              trackName,
              trackTimes,
              trackValues
            );
            tracks.push(track);
          }
        });
      } else {
        // Запасной вариант (тестовая анимация)
        const times = [0, duration / 4, duration / 2, (3 * duration) / 4, duration];
        const rightHandPositions = [];
        const leftHandPositions = [];
        
        times.forEach((time, index) => {
          rightHandPositions.push(0.45, 0.3 + Math.sin(index) * 0.2, 0);
          leftHandPositions.push(-0.45, 0.3 + Math.cos(index) * 0.2, 0);
        });
        
        tracks.push(new THREE.VectorKeyframeTrack('rightHand.position', times, rightHandPositions));
         tracks.push(new THREE.VectorKeyframeTrack('leftHand.position', times, leftHandPositions));
       }
      
      if (tracks.length === 0) {
        console.error('❌ Не удалось создать треки анимации');
        return;
      }
      // Создание анимации
      const clip = new THREE.AnimationClip('sign', duration, tracks);
      // Воспроизведение анимации
      const action = animationMixerRef.current.clipAction(clip);
      
      // КРАЙНЕ ВАЖНО: Если имена не находятся автоматически, можно вручную привязать объекты
      // Но в THREE.js AnimationMixer обычно это делает автоматически по имени.
      // Попробуем явно обновить привязки (bindings)
      // animationMixerRef.current.uncacheClip(clip);
      
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;

      // Когда анимация закончится, сбрасываем флаг
      action.onFinished = () => {
        activeAnimationRef.current = null;
      };
      // ФИНАЛЬНАЯ ДИАГНОСТИКА
      console.log('🎯 ПРОВЕРКА АНИМАЦИИ:', {
        mixer: !!animationMixerRef.current,
        scene: !!sceneRef.current,
        clipName: clip.name,
        clipDuration: clip.duration,
        tracksCount: clip.tracks.length,
        trackNames: clip.tracks.map(t => t.name),
        rightHandExists: !!sceneRef.current.getObjectByName('rightHand'),
        leftHandExists: !!sceneRef.current.getObjectByName('leftHand'),
        rightHandPos: sceneRef.current.getObjectByName('rightHand')?.position.clone(),
        leftHandPos: sceneRef.current.getObjectByName('leftHand')?.position.clone()
      });

      // Принудительно обновим миксер перед воспроизведением
      animationMixerRef.current.update(0);
      action.play();
      console.log('▶️ Анимация запущена');
      activeAnimationRef.current = action;
      
    } catch (error) {
      console.error('Ошибка воспроизведения анимации:', error);
      activeAnimationRef.current = null;
    }
  }, [animationData]);
  
  return (
    <div className="avatar-renderer">
      <div className="avatar-container" ref={containerRef}></div>
      <div className="avatar-status">
        {animationData ? (
          <p>Воспроизведение жеста: {animationData.text || 'gesture'}</p>
        ) : (
          <p>Аватар готов к работе. Ожидание жестов...</p>
        )}
      </div>
    </div>
  );
};

export default AvatarRenderer;