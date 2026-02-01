/**
 * Game3D - Main Three.js Game Component
 * Renders the 3D game world using actual PSZ assets
 */

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';

// =============================================================================
// Asset Loading Components
// =============================================================================

function StageModel({ stageId }: { stageId: string }) {
  // Map stage IDs to asset paths
  const stagePaths: Record<string, string[]> = {
    'valley_a': [
      '/stages/valley_a/s01a_ga1/lndmd/s01a_ga1_m.glb',
      '/stages/valley_a/s01a_ib1/lndmd/s01a_ib1_m.glb',
      '/stages/valley_a/s01a_lb1/lndmd/s01a_lb1_m.glb',
      '/stages/valley_a/s01a_na1/lndmd/s01a_na1_m.glb',
      '/stages/valley_a/s01a_sa1/lndmd/s01a_sa1_m.glb',
    ],
  };

  const paths = stagePaths[stageId] || stagePaths['valley_a'];

  return (
    <group>
      {paths.map((path) => (
        <Suspense key={path} fallback={null}>
          <StageTile url={path} />
        </Suspense>
      ))}
    </group>
  );
}

function StageTile({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

// Player character model
function PlayerModel({
  characterId,
  position,
  rotation,
  isMoving,
}: {
  characterId: string;
  position: THREE.Vector3;
  rotation: number;
  isMoving: boolean;
}) {
  const group = useRef<Group>(null);

  // Load character model
  const modelPath = `/player/${characterId}/${characterId}/${characterId}_000.glb`;
  const animPath = '/player/animations/always/99_always/pc_000_000.glb';

  const { scene } = useGLTF(modelPath);

  // Try to load animations, fallback gracefully if not available
  let animGltf: any = null;
  try {
    animGltf = useGLTF(animPath);
  } catch {
    // Animations not available
  }

  const { actions } = useAnimations(animGltf?.animations || [], group);

  // Load and apply texture
  useEffect(() => {
    const texturePath = `/player/${characterId}/textures/${characterId}_000.png`;
    const loader = new THREE.TextureLoader();

    loader.load(texturePath, (texture) => {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              mat.map = texture;
              mat.needsUpdate = true;
            });
          } else {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        }
      });
    });
  }, [scene, characterId]);

  // Handle animations
  useEffect(() => {
    const runAction = actions['pmsa_run'];
    const idleAction = actions['pmsa_wait'];

    if (isMoving && runAction) {
      idleAction?.fadeOut(0.2);
      runAction.reset().fadeIn(0.2).play();
    } else if (idleAction) {
      runAction?.fadeOut(0.2);
      idleAction.reset().fadeIn(0.2).play();
    }
  }, [isMoving, actions]);

  // Update transform
  useFrame(() => {
    if (group.current) {
      group.current.position.copy(position);
      group.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={group} scale={[0.05, 0.05, 0.05]}>
      <primitive object={scene} />
    </group>
  );
}

// Enemy model
function EnemyModel({
  enemyId,
  position,
  rotation = 0,
}: {
  enemyId: string;
  position: [number, number, number];
  rotation?: number;
}) {
  const group = useRef<Group>(null);

  // Find the model file - enemies have their models in subdirectories
  const modelPath = `/enemies/${enemyId}/s_071/${enemyId}.glb`;

  let scene: THREE.Group;
  try {
    const gltf = useGLTF(modelPath);
    scene = gltf.scene;
  } catch {
    // Fallback to placeholder if model doesn't exist
    return (
      <mesh position={position} rotation={[0, rotation, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
    );
  }

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, [scene]);

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]} scale={[0.05, 0.05, 0.05]}>
      <primitive object={scene} />
    </group>
  );
}

// Interactable box using actual game asset
function TreasureBox({
  position,
  playerPosition,
  onInteract,
  opened,
}: {
  position: [number, number, number];
  playerPosition: THREE.Vector3;
  onInteract: () => void;
  opened: boolean;
}) {
  const group = useRef<Group>(null);
  const [isNearby, setIsNearby] = useState(false);
  const INTERACTION_DISTANCE = 2;

  // Try to load the actual box model
  const boxPath = '/objects/01_o01a/o0c_trebox.imd/o0c_trebox.glb';
  let boxScene: THREE.Group | null = null;

  try {
    const gltf = useGLTF(boxPath);
    boxScene = gltf.scene;
  } catch {
    // Will use fallback
  }

  useFrame(() => {
    const dx = position[0] - playerPosition.x;
    const dz = position[2] - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    setIsNearby(distance < INTERACTION_DISTANCE);

    // Hover animation for unopened boxes
    if (group.current && !opened) {
      group.current.rotation.y += 0.01;
      group.current.position.y = position[1] + Math.sin(Date.now() / 500) * 0.05;
    }
  });

  const handleClick = () => {
    if (isNearby && !opened) {
      onInteract();
    }
  };

  if (boxScene) {
    return (
      <group
        ref={group}
        position={position}
        scale={opened ? [0.03, 0.03, 0.03] : [0.05, 0.05, 0.05]}
        onClick={handleClick}
      >
        <primitive object={boxScene.clone()} />
      </group>
    );
  }

  // Fallback box
  return (
    <mesh
      ref={group as any}
      position={position}
      onClick={handleClick}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial
        color={opened ? '#666666' : isNearby ? '#ffd700' : '#8b4513'}
      />
    </mesh>
  );
}

// =============================================================================
// Camera Controller
// =============================================================================

function ThirdPersonCamera({
  target,
  onMove,
}: {
  target: THREE.Vector3;
  onMove: (moving: boolean, direction: THREE.Vector3) => void;
}) {
  const { camera } = useThree();
  const cameraAngle = useRef(0);
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) keys.current[key as keyof typeof keys.current] = true;
      if (e.key === 'Shift') keys.current.shift = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) keys.current[key as keyof typeof keys.current] = false;
      if (e.key === 'Shift') keys.current.shift = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = true;
        lastMouseX.current = e.clientX;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - lastMouseX.current;
        cameraAngle.current -= deltaX * 0.005;
        lastMouseX.current = e.clientX;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useFrame(() => {
    // Calculate movement
    const direction = new THREE.Vector3();
    if (keys.current.w) direction.z -= 1;
    if (keys.current.s) direction.z += 1;
    if (keys.current.a) direction.x -= 1;
    if (keys.current.d) direction.x += 1;

    const moving = direction.length() > 0;

    if (moving) {
      direction.normalize();
      // Rotate direction by camera angle
      const rotatedDir = new THREE.Vector3(
        direction.x * Math.cos(cameraAngle.current) - direction.z * Math.sin(cameraAngle.current),
        0,
        direction.x * Math.sin(cameraAngle.current) + direction.z * Math.cos(cameraAngle.current)
      );
      const speed = keys.current.shift ? 0.15 : 0.08;
      rotatedDir.multiplyScalar(speed);
      onMove(true, rotatedDir);
    } else {
      onMove(false, new THREE.Vector3());
    }

    // Update camera position
    const cameraDistance = 8;
    const cameraHeight = 5;
    const cameraX = target.x + Math.sin(cameraAngle.current) * cameraDistance;
    const cameraZ = target.z + Math.cos(cameraAngle.current) * cameraDistance;

    camera.position.set(cameraX, target.y + cameraHeight, cameraZ);
    camera.lookAt(target.x, target.y + 1, target.z);
  });

  return null;
}

// =============================================================================
// HUD Components
// =============================================================================

interface GameState {
  hp: number;
  maxHp: number;
  meseta: number;
  inventory: { id: string; name: string; quantity: number }[];
  boxesOpened: Set<number>;
}

function HUD({ gameState }: { gameState: GameState }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        padding: '16px',
        pointerEvents: 'none',
        fontFamily: 'monospace',
        color: 'white',
        textShadow: '2px 2px 4px black',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
          HP: {gameState.hp}/{gameState.maxHp}
        </div>
        <div
          style={{
            width: '200px',
            height: '20px',
            background: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(gameState.hp / gameState.maxHp) * 100}%`,
              height: '100%',
              background: gameState.hp > 50 ? '#4caf50' : gameState.hp > 25 ? '#ff9800' : '#f44336',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Meseta: {gameState.meseta}</div>
      <div style={{ fontSize: '14px' }}>
        <div style={{ marginBottom: '4px' }}>Inventory:</div>
        {gameState.inventory.length === 0 ? (
          <div style={{ color: '#999' }}>  (empty)</div>
        ) : (
          gameState.inventory.map((item) => (
            <div key={item.id}>{'  '}{item.name} x{item.quantity}</div>
          ))
        )}
      </div>
    </div>
  );
}

function ControlsHelp() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        padding: '12px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: 'white',
      }}
    >
      <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Controls:</div>
      <div>WASD - Move</div>
      <div>Shift - Run</div>
      <div>Click+Drag - Camera</div>
      <div>Click Box - Interact</div>
    </div>
  );
}

function MessageLog({ messages }: { messages: string[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '300px',
        padding: '12px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: 'white',
      }}
    >
      {messages.slice(-5).map((msg, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.15 }}>{msg}</div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Game Component
// =============================================================================

const BOX_DROPS = [
  { id: 'monomate', name: 'Monomate', chance: 0.4 },
  { id: 'monofluid', name: 'Monofluid', chance: 0.3 },
  { id: 'dimate', name: 'Dimate', chance: 0.15 },
  { id: 'difluid', name: 'Difluid', chance: 0.1 },
  { id: 'meseta', name: 'Meseta', chance: 0.05 },
];

const BOX_POSITIONS: [number, number, number][] = [
  [5, 0.5, 5],
  [-5, 0.5, 5],
  [5, 0.5, -5],
  [-5, 0.5, -5],
  [10, 0.5, 0],
  [-10, 0.5, 0],
];

export function Game3D() {
  const [playerPosition] = useState(() => new THREE.Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [messages, setMessages] = useState<string[]>(['Welcome to Gurhacia Valley!', 'Use WASD to move, find treasure boxes.']);
  const [gameState, setGameState] = useState<GameState>({
    hp: 100,
    maxHp: 100,
    meseta: 500,
    inventory: [],
    boxesOpened: new Set(),
  });

  const addMessage = useCallback((msg: string) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleMove = useCallback((moving: boolean, direction: THREE.Vector3) => {
    setIsMoving(moving);
    if (moving) {
      playerPosition.add(direction);
      setPlayerRotation(Math.atan2(direction.x, direction.z));
    }
  }, [playerPosition]);

  const handleBoxInteract = useCallback((boxIndex: number) => {
    if (gameState.boxesOpened.has(boxIndex)) return;

    const roll = Math.random();
    let cumulative = 0;
    let drop = BOX_DROPS[0];
    for (const item of BOX_DROPS) {
      cumulative += item.chance;
      if (roll < cumulative) {
        drop = item;
        break;
      }
    }

    setGameState((prev) => {
      const newState = { ...prev, boxesOpened: new Set(prev.boxesOpened) };
      newState.boxesOpened.add(boxIndex);

      if (drop.id === 'meseta') {
        const amount = Math.floor(Math.random() * 100) + 50;
        newState.meseta += amount;
        addMessage(`Found ${amount} Meseta!`);
      } else {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const existing = prev.inventory.find((i) => i.id === drop.id);
        if (existing) {
          newState.inventory = prev.inventory.map((i) =>
            i.id === drop.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          newState.inventory = [...prev.inventory, { ...drop, quantity }];
        }
        addMessage(`Found ${drop.name} x${quantity}!`);
      }
      return newState;
    });
  }, [gameState.boxesOpened, addMessage]);

  // Test controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q') {
        setGameState((prev) => ({ ...prev, hp: Math.max(0, prev.hp - 10) }));
        addMessage('Took 10 damage!');
      }
      if (e.key === 'e') {
        const monomate = gameState.inventory.find((i) => i.id === 'monomate');
        if (monomate && monomate.quantity > 0) {
          setGameState((prev) => ({
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + 30),
            inventory: prev.inventory
              .map((i) => (i.id === 'monomate' ? { ...i, quantity: i.quantity - 1 } : i))
              .filter((i) => i.quantity > 0),
          }));
          addMessage('Used Monomate! +30 HP');
        } else {
          addMessage('No Monomate!');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.inventory, addMessage]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <Canvas shadows camera={{ fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Sky sunPosition={[100, 50, 100]} />

        <Suspense fallback={null}>
          <StageModel stageId="valley_a" />

          <PlayerModel
            characterId="pc_000"
            position={playerPosition}
            rotation={playerRotation}
            isMoving={isMoving}
          />

          {BOX_POSITIONS.map((pos, i) => (
            <TreasureBox
              key={i}
              position={pos}
              playerPosition={playerPosition}
              onInteract={() => handleBoxInteract(i)}
              opened={gameState.boxesOpened.has(i)}
            />
          ))}
        </Suspense>

        <ThirdPersonCamera target={playerPosition} onMove={handleMove} />

        {/* Ground plane fallback */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#3a5f3a" />
        </mesh>
      </Canvas>

      <HUD gameState={gameState} />
      <ControlsHelp />
      <MessageLog messages={messages} />

      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '12px',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ff9800',
        }}
      >
        <div style={{ fontWeight: 'bold' }}>Test:</div>
        <div>Q - Damage</div>
        <div>E - Use Monomate</div>
      </div>
    </div>
  );
}

export default Game3D;
