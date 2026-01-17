import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Lobby animation name mapping (actual names from GLB)
const ANIMATION_MAP: Record<string, string> = {
  'pmbn_wait': 'wait',           // Idle
  'pmsa_run': 'run',             // Running
  'pmbn_lb_dance_m': 'dance',    // Dance (male)
  'pmbn_lb_yes_m': 'yes',        // Yes gesture (male)
  'pmbn_lb_no_m': 'no',          // No gesture (male)
  'pmbn_neko': 'pet',            // Pet animation (neko = cat)
};

// Player state machine states
type PlayerState =
  | 'idle'
  | 'running'
  | 'dancing'
  | 'gesturing';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  dance: boolean;
}

const MODEL_PATH = '/player/pc_000/pc_000/pc_000_000.glb';
const TEXTURE_PATH = '/player/pc_000/textures/pc_000_000.png';
const ANIMATION_PATH = '/player/animations/lobby/m/99_lobby_m/pc_000_000.glb';

export default function LobbyMovementDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mixer: THREE.AnimationMixer | null;
    model: THREE.Object3D | null;
    animations: Map<string, THREE.AnimationClip>;
    currentAction: THREE.AnimationAction | null;
    playerPosition: THREE.Vector3;
    playerRotation: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [debugInfo, setDebugInfo] = useState('');

  const keyStateRef = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    dance: false,
  });

  const playerStateRef = useRef<PlayerState>('idle');

  // Play animation by mapped name
  const playAnimation = useCallback((name: string, options: {
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    onComplete?: () => void;
  } = {}) => {
    if (!sceneRef.current?.mixer || !sceneRef.current.animations) return;

    const { mixer, animations, currentAction } = sceneRef.current;
    const { loop = true, fadeIn = 0.1, fadeOut = 0.1, onComplete } = options;

    // Find the animation clip by mapped name
    let clip: THREE.AnimationClip | undefined;
    let foundGameName: string | undefined;
    for (const [gameName, mappedName] of Object.entries(ANIMATION_MAP)) {
      if (mappedName === name) {
        clip = animations.get(gameName);
        foundGameName = gameName;
        break;
      }
    }

    console.log(`playAnimation: looking for "${name}", mapped to "${foundGameName}", found:`, !!clip);
    console.log('Available animations:', Array.from(animations.keys()));

    if (!clip) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    // Fade out current action
    if (currentAction) {
      currentAction.fadeOut(fadeOut);
    }

    // Create and play new action
    const action = mixer.clipAction(clip);
    action.reset();
    action.fadeIn(fadeIn);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.play();

    sceneRef.current.currentAction = action;

    // Handle animation completion for non-looping animations
    if (!loop && onComplete) {
      const duration = clip.duration;
      setTimeout(onComplete, duration * 1000);
    }
  }, []);

  // Handle state transitions
  const transitionTo = useCallback((newState: PlayerState) => {
    console.log('transitionTo:', newState, 'from:', playerStateRef.current);
    playerStateRef.current = newState;
    setPlayerState(newState);

    switch (newState) {
      case 'idle':
        playAnimation('wait', { loop: true });
        break;
      case 'running':
        console.log('Should play run animation now');
        playAnimation('run', { loop: true });
        break;
      case 'dancing':
        playAnimation('dance', { loop: true });
        break;
    }
  }, [playAnimation]);

  // Trigger gesture animations
  const triggerGesture = useCallback((gesture: 'yes' | 'no' | 'pet') => {
    if (playerStateRef.current === 'gesturing') return;

    playerStateRef.current = 'gesturing';
    setPlayerState('gesturing');

    playAnimation(gesture, {
      loop: false,
      onComplete: () => transitionTo('idle'),
    });
  }, [playAnimation, transitionTo]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Camera - fixed, no user control
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Ground plane - lobby style floor
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a6741,
      roughness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Decorative grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x3a5731, 0x3a5731);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      mixer: null,
      model: null,
      animations: new Map(),
      currentAction: null,
      playerPosition: new THREE.Vector3(0, 0, 0),
      playerRotation: 0,
    };

    // Animation loop
    const clock = new THREE.Clock();
    const moveSpeed = 4;
    const rotateSpeed = 8;

    const animate = () => {
      requestAnimationFrame(animate);
      // Cap delta to prevent animation speed issues
      const delta = Math.min(clock.getDelta(), 1 / 60);

      if (sceneRef.current?.mixer) {
        sceneRef.current.mixer.update(delta);
      }

      // Handle movement (only when not gesturing)
      if (sceneRef.current?.model && playerStateRef.current !== 'gesturing') {
        const keys = keyStateRef.current;

        // Check for dance
        if (keys.dance) {
          if (playerStateRef.current !== 'dancing') {
            transitionTo('dancing');
          }
        } else {
          // Movement
          let isMoving = false;
          let moveX = 0;
          let moveZ = 0;

          // Screen-relative movement (camera is at +Z looking at player)
          // Forward = away from camera (-Z), Back = toward camera (+Z)
          // Left = -X, Right = +X
          if (keys.forward) { moveZ -= 1; isMoving = true; }
          if (keys.backward) { moveZ += 1; isMoving = true; }
          if (keys.left) { moveX -= 1; isMoving = true; }
          if (keys.right) { moveX += 1; isMoving = true; }

          if (isMoving) {
            // Normalize movement
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            if (length > 0) {
              moveX /= length;
              moveZ /= length;
            }

            // Move in input direction (screen-relative)
            sceneRef.current.playerPosition.x += moveX * moveSpeed * delta;
            sceneRef.current.playerPosition.z += moveZ * moveSpeed * delta;

            // Rotate character to face movement direction
            const targetRotation = Math.atan2(moveX, moveZ);
            let rotDiff = targetRotation - sceneRef.current.playerRotation;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            sceneRef.current.playerRotation += rotDiff * rotateSpeed * delta;

            // Apply to model
            sceneRef.current.model.position.copy(sceneRef.current.playerPosition);
            sceneRef.current.model.rotation.y = sceneRef.current.playerRotation;

            // Switch to run if idle or dancing
            if (playerStateRef.current === 'idle' || playerStateRef.current === 'dancing') {
              transitionTo('running');
            }
          } else {
            // Switch to idle if running
            if (playerStateRef.current === 'running') {
              transitionTo('idle');
            }
          }
        }
      }

      // Camera follows player (fixed angle, third-person perspective)
      if (sceneRef.current?.playerPosition) {
        const playerPos = sceneRef.current.playerPosition;

        // Fixed camera offset - doesn't rotate with player
        const cameraHeight = 4;
        const cameraDistance = 6;
        const desiredCameraPos = new THREE.Vector3(
          playerPos.x,
          playerPos.y + cameraHeight,
          playerPos.z + cameraDistance
        );

        // Smooth camera follow
        camera.position.lerp(desiredCameraPos, 0.1);
        camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
      }

      renderer.render(scene, camera);

      // Update debug info
      if (sceneRef.current?.playerPosition) {
        setDebugInfo(`Pos: (${sceneRef.current.playerPosition.x.toFixed(1)}, ${sceneRef.current.playerPosition.z.toFixed(1)}) | State: ${playerStateRef.current}`);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [transitionTo]);

  // Load model and animations
  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene } = sceneRef.current;
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    setIsLoading(true);

    // Load model
    loader.load(MODEL_PATH, (gltf) => {
      const model = gltf.scene;
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
      sceneRef.current!.model = model;

      // Apply texture
      textureLoader.load(TEXTURE_PATH, (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        });
      });

      // Load lobby animations
      loader.load(ANIMATION_PATH, (animGltf) => {
        const mixer = new THREE.AnimationMixer(model);
        sceneRef.current!.mixer = mixer;

        // Store animations in map
        const animMap = new Map<string, THREE.AnimationClip>();
        animGltf.animations.forEach((clip) => {
          animMap.set(clip.name, clip);
          console.log('Loaded lobby animation:', clip.name, '→', ANIMATION_MAP[clip.name] || 'unmapped');
        });
        sceneRef.current!.animations = animMap;

        // Start with idle animation
        transitionTo('idle');
        setIsLoading(false);
      });
    });
  }, [transitionTo]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keyStateRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keyStateRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keyStateRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keyStateRef.current.right = true;
          break;
        case 'KeyE':
          keyStateRef.current.dance = true;
          break;
        case 'KeyY':
          triggerGesture('yes');
          break;
        case 'KeyN':
          triggerGesture('no');
          break;
        case 'KeyP':
          triggerGesture('pet');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keyStateRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keyStateRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keyStateRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keyStateRef.current.right = false;
          break;
        case 'KeyE':
          keyStateRef.current.dance = false;
          // Return to idle when dance key released
          if (playerStateRef.current === 'dancing') {
            transitionTo('idle');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [transitionTo, triggerGesture]);

  return (
    <div style={styles.container}>
      {/* Controls overlay */}
      <div style={styles.controlsPanel}>
        <h3 style={styles.panelTitle}>Lobby Controls</h3>
        <div style={styles.controlsList}>
          <div style={styles.controlItem}><span style={styles.key}>WASD</span> Move</div>
          <div style={styles.controlItem}><span style={styles.key}>E</span> Dance (hold)</div>
          <div style={styles.controlItem}><span style={styles.key}>Y</span> Yes</div>
          <div style={styles.controlItem}><span style={styles.key}>N</span> No</div>
          <div style={styles.controlItem}><span style={styles.key}>P</span> Pet</div>
        </div>
        <div style={styles.stateInfo}>
          State: {playerState}
        </div>
      </div>

      {/* Debug info */}
      <div style={styles.debugPanel}>
        {debugInfo}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Loading Lobby...</div>
        </div>
      )}

      {/* 3D Canvas */}
      <div style={styles.canvasContainer} ref={containerRef} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
  },
  controlsPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    zIndex: 100,
    minWidth: 150,
  },
  panelTitle: {
    margin: '0 0 12px 0',
    fontSize: 16,
    color: '#8bf',
    borderBottom: '1px solid #444',
    paddingBottom: 8,
  },
  controlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  controlItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  key: {
    background: '#444',
    padding: '2px 8px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  stateInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #444',
    fontSize: 12,
    color: '#aaa',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
    zIndex: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
  },
};
