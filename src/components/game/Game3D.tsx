/**
 * Game3D - Main Three.js Game Component
 * Renders the 3D game world and handles game state
 */

import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Text } from '@react-three/drei';
import { Player } from './Player';
import { InteractableBox } from './InteractableBox';

// Game state types
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

interface GameState {
  hp: number;
  maxHp: number;
  meseta: number;
  inventory: InventoryItem[];
  boxesOpened: Set<number>;
}

// Floor component
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#3a5f3a" />
    </mesh>
  );
}

// Grid overlay for visual reference
function Grid() {
  return (
    <gridHelper args={[50, 50, '#2a4f2a', '#2a4f2a']} position={[0, 0.01, 0]} />
  );
}

// Camera rig that follows player
function CameraRig({ playerPosition }: { playerPosition: [number, number, number] }) {
  return (
    <OrbitControls
      target={playerPosition}
      enablePan={false}
      minDistance={5}
      maxDistance={15}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={Math.PI / 6}
    />
  );
}

// HUD overlay
function HUD({ gameState }: { gameState: GameState }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px',
        pointerEvents: 'none',
        fontFamily: 'monospace',
        color: 'white',
        textShadow: '2px 2px 4px black',
      }}
    >
      {/* HP Bar */}
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
              background: gameState.hp > gameState.maxHp * 0.5 ? '#4caf50' : gameState.hp > gameState.maxHp * 0.25 ? '#ff9800' : '#f44336',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Meseta */}
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>
        Meseta: {gameState.meseta}
      </div>

      {/* Inventory */}
      <div style={{ fontSize: '14px' }}>
        <div style={{ marginBottom: '4px' }}>Inventory:</div>
        {gameState.inventory.length === 0 ? (
          <div style={{ color: '#999' }}>  (empty)</div>
        ) : (
          gameState.inventory.map((item) => (
            <div key={item.id}>
              {'  '}{item.name} x{item.quantity}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Controls help
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
      <div>Click - Interact</div>
      <div>Mouse - Camera</div>
    </div>
  );
}

// Message log
function MessageLog({ messages }: { messages: string[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '300px',
        maxHeight: '150px',
        padding: '12px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      {messages.slice(-5).map((msg, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.15 }}>
          {msg}
        </div>
      ))}
    </div>
  );
}

// Box drop table
const BOX_DROPS = [
  { id: 'monomate', name: 'Monomate', chance: 0.4 },
  { id: 'monofluid', name: 'Monofluid', chance: 0.3 },
  { id: 'dimate', name: 'Dimate', chance: 0.15 },
  { id: 'difluid', name: 'Difluid', chance: 0.1 },
  { id: 'meseta', name: 'Meseta', chance: 0.05 },
];

// Box positions
const BOX_POSITIONS: [number, number, number][] = [
  [5, 0.4, 5],
  [-5, 0.4, 5],
  [5, 0.4, -5],
  [-5, 0.4, -5],
  [10, 0.4, 0],
  [-10, 0.4, 0],
  [0, 0.4, 10],
  [0, 0.4, -10],
];

export function Game3D() {
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0.6, 0]);
  const [messages, setMessages] = useState<string[]>(['Welcome! Use WASD to move.', 'Find and open boxes to collect items.']);
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

  const handleBoxInteract = useCallback((boxIndex: number) => {
    if (gameState.boxesOpened.has(boxIndex)) return;

    // Roll for drop
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
      const newState = { ...prev };
      newState.boxesOpened = new Set(prev.boxesOpened);
      newState.boxesOpened.add(boxIndex);

      if (drop.id === 'meseta') {
        const amount = Math.floor(Math.random() * 100) + 50;
        newState.meseta = prev.meseta + amount;
        addMessage(`Found ${amount} Meseta!`);
      } else {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const existing = prev.inventory.find((i) => i.id === drop.id);
        if (existing) {
          newState.inventory = prev.inventory.map((i) =>
            i.id === drop.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          newState.inventory = [...prev.inventory, { id: drop.id, name: drop.name, quantity }];
        }
        addMessage(`Found ${drop.name} x${quantity}!`);
      }

      return newState;
    });
  }, [gameState.boxesOpened, addMessage]);

  // Keyboard shortcut to take damage (for testing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q') {
        setGameState((prev) => ({
          ...prev,
          hp: Math.max(0, prev.hp - 10),
        }));
        addMessage('Took 10 damage! (Press Q to test)');
      }
      if (e.key === 'e') {
        // Use monomate
        const monomate = gameState.inventory.find((i) => i.id === 'monomate');
        if (monomate && monomate.quantity > 0) {
          setGameState((prev) => ({
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + 30),
            inventory: prev.inventory
              .map((i) => (i.id === 'monomate' ? { ...i, quantity: i.quantity - 1 } : i))
              .filter((i) => i.quantity > 0),
          }));
          addMessage('Used Monomate! Restored 30 HP.');
        } else {
          addMessage('No Monomate in inventory!');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.inventory, addMessage]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        {/* Sky */}
        <Sky sunPosition={[100, 20, 100]} />

        {/* Environment */}
        <Floor />
        <Grid />

        {/* Player */}
        <Player position={playerPosition} onPositionChange={setPlayerPosition} />

        {/* Interactable boxes */}
        {BOX_POSITIONS.map((pos, i) => (
          <InteractableBox
            key={i}
            position={pos}
            playerPosition={playerPosition}
            onInteract={() => handleBoxInteract(i)}
            opened={gameState.boxesOpened.has(i)}
          />
        ))}

        {/* Camera controls */}
        <CameraRig playerPosition={playerPosition} />
      </Canvas>

      {/* UI Overlays */}
      <HUD gameState={gameState} />
      <ControlsHelp />
      <MessageLog messages={messages} />

      {/* Test controls hint */}
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
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Test Controls:</div>
        <div>Q - Take 10 damage</div>
        <div>E - Use Monomate</div>
      </div>
    </div>
  );
}

export default Game3D;
