import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Animation name mapping - maps game animation names to readable names
const ANIMATION_MAP: Record<string, string> = {
  'pmsa_wait': 'wait',      // Idle with weapon ready
  'pmsa_run': 'run',        // Running
  'pmsa_esc_f': 'dodge',    // Dodge roll
  'pmsa_atk1': 'atk1',      // Attack combo 1
  'pmsa_atk2': 'atk2',      // Attack combo 2
  'pmsa_atk3': 'atk3',      // Attack combo 3
  'pmsa_dam_n': 'dam_n',    // Normal damage (small hit)
  'pmsa_dam_h': 'dam_h',    // Heavy damage (flip backwards)
  'pmsa_dam_d': 'dam_d',    // Knockdown damage
  'pmsa_dam_d_lp': 'dam_d_lp', // Lying on ground
  'pmsa_dam_d_wa': 'dam_d_wa', // Wake up from down
  'pmsa_slp': 'slp',        // Stunned/disabled
  'pmsa_stp_fb': 'stp_fb',  // Forward/back strafe (locked on)
  'pmsa_stp_lr': 'stp_lr',  // Left/right strafe (locked on)
  'pmsa_tec': 'tec',        // Cast technique
  'pmsa_pa1': 'pa1',        // Photon art 1
  'pmsa_pa2': 'pa2',        // Photon art 2
  'pmsa_pa3': 'pa3',        // Photon art 3
  'pmbn_pb': 'pb',          // Photon blast
  'pmbn_pb_lp': 'pb_lp',    // Photon blast loop
};

// Player state machine states
type PlayerState =
  | 'idle'
  | 'running'
  | 'attacking'
  | 'dodging'
  | 'damaged'
  | 'down'
  | 'waking'
  | 'stunned'
  | 'casting';

// Attack combo state
type ComboState = 0 | 1 | 2 | 3; // 0 = not attacking, 1-3 = combo step

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  dodge: boolean;
  lockOn: boolean;
  snapCamera: boolean;
}

const MODEL_PATH = '/player/pc_000/pc_000/pc_000_000.glb';
const TEXTURE_PATH = '/player/pc_000/textures/pc_000_000.png';
const ANIMATION_PATH = '/player/animations/saver/m/01_saver_m/pc_000_000.glb';
const WEAPON_PATH = '/weapons/wsac01/wsac01/wsac01_1_o.glb';

// Weapon offset for saber
const WEAPON_OFFSET = { x: 0.310, y: 0.000, z: 0.000 };

export default function PlayerMovementDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    mixer: THREE.AnimationMixer | null;
    model: THREE.Object3D | null;
    animations: Map<string, THREE.AnimationClip>;
    currentAction: THREE.AnimationAction | null;
    playerPosition: THREE.Vector3;
    playerRotation: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [comboState, setComboState] = useState<ComboState>(0);
  const [debugInfo, setDebugInfo] = useState('');

  const keyStateRef = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    attack: false,
    dodge: false,
    lockOn: false,
    snapCamera: false,
  });

  const playerStateRef = useRef<PlayerState>('idle');
  const comboStateRef = useRef<ComboState>(0);
  const comboWindowRef = useRef<boolean>(false);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dodgeDirectionRef = useRef<number>(0); // Store rotation when dodge starts

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
    for (const [gameName, mappedName] of Object.entries(ANIMATION_MAP)) {
      if (mappedName === name) {
        clip = animations.get(gameName);
        break;
      }
    }

    if (!clip) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    // For dodge animation, strip out position tracks to prevent root motion
    let processedClip = clip;
    if (name === 'dodge') {
      const filteredTracks = clip.tracks.filter(track => {
        // Remove position tracks (they contain .position in the name)
        return !track.name.includes('.position');
      });
      processedClip = new THREE.AnimationClip(clip.name + '_noroot', clip.duration, filteredTracks);
    }

    // Fade out current action
    if (currentAction) {
      currentAction.fadeOut(fadeOut);
    }

    // Create and play new action
    const action = mixer.clipAction(processedClip);
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
    playerStateRef.current = newState;
    setPlayerState(newState);

    switch (newState) {
      case 'idle':
        playAnimation('wait', { loop: true });
        break;
      case 'running':
        playAnimation('run', { loop: true });
        break;
      case 'dodging':
        // Store current facing direction for dodge movement
        if (sceneRef.current) {
          dodgeDirectionRef.current = sceneRef.current.playerRotation;
        }
        playAnimation('dodge', {
          loop: false,
          onComplete: () => transitionTo('idle'),
        });
        break;
      case 'damaged':
        playAnimation('dam_n', {
          loop: false,
          onComplete: () => transitionTo('idle'),
        });
        break;
    }
  }, [playAnimation]);

  // Handle attack combo
  const startAttack = useCallback(() => {
    if (playerStateRef.current === 'attacking') {
      // Check if we're in combo window
      if (comboWindowRef.current && comboStateRef.current < 3) {
        comboStateRef.current = (comboStateRef.current + 1) as ComboState;
        setComboState(comboStateRef.current);
        comboWindowRef.current = false;

        const atkName = `atk${comboStateRef.current}` as 'atk1' | 'atk2' | 'atk3';
        playAnimation(atkName, {
          loop: false,
          onComplete: () => {
            if (comboStateRef.current >= 3) {
              // Combo finished, return to idle
              comboStateRef.current = 0;
              setComboState(0);
              transitionTo('idle');
            } else {
              // Open combo window
              comboWindowRef.current = true;
              // Close window after timeout
              if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
              comboTimeoutRef.current = setTimeout(() => {
                if (comboWindowRef.current) {
                  comboWindowRef.current = false;
                  comboStateRef.current = 0;
                  setComboState(0);
                  transitionTo('idle');
                }
              }, 500); // 500ms combo window
            }
          },
        });
      }
      return;
    }

    // Start fresh attack combo
    playerStateRef.current = 'attacking';
    setPlayerState('attacking');
    comboStateRef.current = 1;
    setComboState(1);
    comboWindowRef.current = false;

    playAnimation('atk1', {
      loop: false,
      onComplete: () => {
        // Open combo window
        comboWindowRef.current = true;
        // Close window after timeout
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = setTimeout(() => {
          if (comboWindowRef.current) {
            comboWindowRef.current = false;
            comboStateRef.current = 0;
            setComboState(0);
            transitionTo('idle');
          }
        }, 500);
      },
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

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 6);
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
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d5c3d,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid overlay
    const gridHelper = new THREE.GridHelper(50, 50, 0x2d4c2d, 0x2d4c2d);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      mixer: null,
      model: null,
      animations: new Map(),
      currentAction: null,
      playerPosition: new THREE.Vector3(0, 0, 0),
      playerRotation: 0,
    };

    // Animation loop
    const clock = new THREE.Clock();
    const moveSpeed = 6; // Increased movement speed
    const rotateSpeed = 5;
    let dodgeTimer = 0;
    const dodgeDuration = 0.8; // Approximate dodge animation duration
    const dodgeYOffset = -0.3; // How much to lower during roll

    const animate = () => {
      requestAnimationFrame(animate);
      // Cap delta to prevent animation speed issues with high frame rates
      const delta = Math.min(clock.getDelta(), 1 / 30); // Cap at ~30fps worth of delta

      if (sceneRef.current?.mixer) {
        sceneRef.current.mixer.update(delta);
      }

      // Handle dodge roll movement (apply root motion manually)
      if (sceneRef.current?.model && playerStateRef.current === 'dodging') {
        const dodgeSpeed = 5; // Speed of dodge roll
        const dodgeDir = dodgeDirectionRef.current;

        // Track dodge progress
        dodgeTimer += delta;
        const dodgeProgress = Math.min(dodgeTimer / dodgeDuration, 1);

        // Move in the direction player was facing when dodge started
        sceneRef.current.playerPosition.x += Math.sin(dodgeDir) * dodgeSpeed * delta;
        sceneRef.current.playerPosition.z += Math.cos(dodgeDir) * dodgeSpeed * delta;

        // Lower Y during roll using a sine curve (down in middle, up at start/end)
        const yOffset = Math.sin(dodgeProgress * Math.PI) * dodgeYOffset;

        // Apply position to model with Y offset
        sceneRef.current.model.position.set(
          sceneRef.current.playerPosition.x,
          sceneRef.current.playerPosition.y + yOffset,
          sceneRef.current.playerPosition.z
        );
      } else {
        // Reset dodge timer when not dodging
        dodgeTimer = 0;
      }

      // Handle movement
      if (sceneRef.current?.model && playerStateRef.current !== 'attacking' && playerStateRef.current !== 'dodging') {
        const keys = keyStateRef.current;
        let isMoving = false;
        let moveX = 0;
        let moveZ = 0;

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

          if (keys.lockOn) {
            // Lock-on mode: player doesn't rotate, uses strafe animations
            // Movement is relative to player's current facing direction
            const sin = Math.sin(sceneRef.current.playerRotation);
            const cos = Math.cos(sceneRef.current.playerRotation);

            // Transform input to world space based on player rotation (negate to fix direction)
            const worldMoveX = -(moveX * cos - moveZ * sin);
            const worldMoveZ = -(moveX * sin + moveZ * cos);

            sceneRef.current.playerPosition.x += worldMoveX * moveSpeed * delta;
            sceneRef.current.playerPosition.z += worldMoveZ * moveSpeed * delta;

            // Apply position (no rotation change)
            sceneRef.current.model.position.copy(sceneRef.current.playerPosition);

            // Determine which strafe animation to use
            const isStrafing = Math.abs(moveX) > Math.abs(moveZ);
            const targetAnim = isStrafing ? 'stp_lr' : 'stp_fb';

            if (playerStateRef.current !== 'strafing_fb' && playerStateRef.current !== 'strafing_lr') {
              if (isStrafing) {
                playerStateRef.current = 'strafing_lr' as PlayerState;
                playAnimation('stp_lr', { loop: true });
              } else {
                playerStateRef.current = 'strafing_fb' as PlayerState;
                playAnimation('stp_fb', { loop: true });
              }
            }
          } else {
            // Normal mode: rotate towards movement direction
            const targetRotation = Math.atan2(moveX, moveZ);

            // Smoothly rotate towards target
            let rotDiff = targetRotation - sceneRef.current.playerRotation;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            sceneRef.current.playerRotation += rotDiff * rotateSpeed * delta;

            // Move in facing direction
            const moveDir = new THREE.Vector3(
              Math.sin(sceneRef.current.playerRotation),
              0,
              Math.cos(sceneRef.current.playerRotation)
            );
            sceneRef.current.playerPosition.add(moveDir.multiplyScalar(moveSpeed * delta));

            // Apply to model
            sceneRef.current.model.position.copy(sceneRef.current.playerPosition);
            sceneRef.current.model.rotation.y = sceneRef.current.playerRotation;

            // Switch to run if idle
            if (playerStateRef.current === 'idle') {
              transitionTo('running');
            }
          }
        } else {
          // Switch to idle if running or strafing
          if (playerStateRef.current === 'running' ||
              playerStateRef.current === 'strafing_fb' as PlayerState ||
              playerStateRef.current === 'strafing_lr' as PlayerState) {
            transitionTo('idle');
          }
        }

      }

      // Always update camera to follow player (even when not moving)
      if (sceneRef.current?.playerPosition) {
        const playerPos = sceneRef.current.playerPosition;
        const playerRot = sceneRef.current.playerRotation;
        const keys = keyStateRef.current;

        // Update orbit controls target to player position
        controls.target.set(playerPos.x, 1, playerPos.z);

        let desiredCameraPos: THREE.Vector3;

        if (keys.lockOn || keys.snapCamera) {
          // Lock-on/snap mode: camera stays behind player based on their facing direction
          const cameraDistance = 6;
          const cameraHeight = 3;
          desiredCameraPos = new THREE.Vector3(
            playerPos.x - Math.sin(playerRot) * cameraDistance,
            playerPos.y + cameraHeight,
            playerPos.z - Math.cos(playerRot) * cameraDistance
          );
          if (keys.snapCamera) {
            // Instant snap
            camera.position.copy(desiredCameraPos);
          } else {
            // Smooth follow when locked on
            camera.position.lerp(desiredCameraPos, 0.1);
          }
        } else {
          // Normal mode: camera follows at fixed world offset
          desiredCameraPos = new THREE.Vector3(
            playerPos.x,
            playerPos.y + 3,
            playerPos.z + 6
          );
          // Smoothly move camera
          camera.position.lerp(desiredCameraPos, 0.05);
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Update debug info
      if (sceneRef.current?.playerPosition) {
        setDebugInfo(`Pos: (${sceneRef.current.playerPosition.x.toFixed(1)}, ${sceneRef.current.playerPosition.z.toFixed(1)}) | State: ${playerStateRef.current} | Combo: ${comboStateRef.current}`);
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

      // Load animations
      loader.load(ANIMATION_PATH, (animGltf) => {
        const mixer = new THREE.AnimationMixer(model);
        sceneRef.current!.mixer = mixer;

        // Store animations in map
        const animMap = new Map<string, THREE.AnimationClip>();
        animGltf.animations.forEach((clip) => {
          animMap.set(clip.name, clip);
          console.log('Loaded animation:', clip.name, '→', ANIMATION_MAP[clip.name] || 'unmapped');
        });
        sceneRef.current!.animations = animMap;

        // Load weapon
        loader.load(WEAPON_PATH, (weaponGltf) => {
          const weapon = weaponGltf.scene;
          weapon.traverse((child: any) => {
            if (child.isMesh) {
              child.geometry?.computeVertexNormals();
              child.material = new THREE.MeshNormalMaterial({
                flatShading: true,
                side: THREE.DoubleSide,
              });
              child.castShadow = true;
            }
          });

          // Find hand bone
          let handBone: THREE.Bone | null = null;
          model.traverse((child) => {
            if (child.name === '070_RArm02') {
              handBone = child as THREE.Bone;
            }
          });

          if (handBone) {
            weapon.position.set(WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z);
            handBone.add(weapon);
          }

          // Start with idle animation
          transitionTo('idle');
          setIsLoading(false);
        });
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
        case 'Space':
          if (playerStateRef.current !== 'dodging' && playerStateRef.current !== 'attacking') {
            transitionTo('dodging');
          }
          e.preventDefault();
          break;
        case 'KeyJ':
        case 'KeyZ':
          startAttack();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keyStateRef.current.lockOn = true;
          break;
        case 'Tab':
          keyStateRef.current.snapCamera = true;
          e.preventDefault();
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
        case 'ShiftLeft':
        case 'ShiftRight':
          keyStateRef.current.lockOn = false;
          break;
        case 'Tab':
          keyStateRef.current.snapCamera = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [transitionTo, startAttack]);

  return (
    <div style={styles.container}>
      {/* Controls overlay */}
      <div style={styles.controlsPanel}>
        <h3 style={styles.panelTitle}>Controls</h3>
        <div style={styles.controlsList}>
          <div style={styles.controlItem}><span style={styles.key}>WASD</span> Move</div>
          <div style={styles.controlItem}><span style={styles.key}>Space</span> Dodge</div>
          <div style={styles.controlItem}><span style={styles.key}>J / Z</span> Attack</div>
          <div style={styles.controlItem}><span style={styles.key}>Shift</span> Lock-on (strafe)</div>
          <div style={styles.controlItem}><span style={styles.key}>Tab</span> Snap camera behind</div>
        </div>
        <div style={styles.comboInfo}>
          <div>Combo: {comboState > 0 ? `Attack ${comboState}/3` : 'Ready'}</div>
          <div>State: {playerState}</div>
        </div>
      </div>

      {/* Debug info */}
      <div style={styles.debugPanel}>
        {debugInfo}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Loading...</div>
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
    color: '#6bf',
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
  comboInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #444',
    fontSize: 12,
    color: '#aaa',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
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
