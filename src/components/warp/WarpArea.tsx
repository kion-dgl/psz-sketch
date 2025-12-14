import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import WarpEnvironment, { WarpGroundPlane } from './WarpEnvironment';
import PlayerCharacter from '../city/PlayerCharacter';
import WarpNPCs from './WarpNPCs';
import WarpWalls from './WarpWalls';
import WarpTriggers from './WarpTriggers';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';

// Kill plane component to respawn player if they fall
function KillPlane({ onRespawn }: { onRespawn: () => void }) {
  return (
    <RigidBody
      type="fixed"
      position={[0, -50, 0]}
      sensor
      onIntersectionEnter={() => onRespawn()}
    >
      <mesh>
        <boxGeometry args={[200, 1, 200]} />
        <meshStandardMaterial color="red" transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
}

// Debug plane at y=0 to visualize if something is there
function DebugPlaneAtZero() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="magenta" transparent opacity={0.5} side={2} />
    </mesh>
  );
}

// Add a visible flat collision plane at y=0 to test if player stands on it
function TestCollisionPlane() {
  return (
    <RigidBody type="fixed" position={[0, 0, 0]} collisionGroups={0x00030003} userData={{ type: 'test-plane' }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="orange" transparent opacity={0.7} side={2} />
      </mesh>
    </RigidBody>
  );
}

function CameraController({ target }: { target: { x: number; y: number; z: number } }) {
  const { camera } = useThree();
  const rotationRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const rotationSpeed = 0.05;
      if (e.key === 'ArrowLeft') {
        rotationRef.current -= rotationSpeed;
      } else if (e.key === 'ArrowRight') {
        rotationRef.current += rotationSpeed;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useFrame(() => {
    // Position camera behind and above the player with rotation
    const distance = 6;
    const height = 3;

    const offsetX = Math.sin(rotationRef.current) * distance;
    const offsetZ = Math.cos(rotationRef.current) * distance;

    camera.position.x = target.x + offsetX;
    camera.position.y = target.y + height;
    camera.position.z = target.z + offsetZ;

    // Look at the player
    camera.lookAt(target.x, target.y + 1, target.z);
  });

  return null;
}

export default function WarpArea() {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [respawnKey, setRespawnKey] = useState(0);
  const [showStage, setShowStage] = useState(true);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  const handleNPCInteraction = (npcName: string) => {
    openShop(npcName);
  };

  const handleRespawn = () => {
    // Force player to respawn by changing key
    setRespawnKey(prev => prev + 1);
  };

  useEffect(() => {
    // Load selected character from localStorage
    try {
      const selectedCharacterId = localStorage.getItem('selectedCharacterId');
      if (!selectedCharacterId) {
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem('characters') || '[]';
      const chars = JSON.parse(stored);
      const character = chars.find((c: Character | null) => c?.character_id === selectedCharacterId);

      if (character) {
        // Set in global store so UI components can access it
        setSelectedCharacter(character);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [setSelectedCharacter]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!selectedCharacter) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p>No character selected</p>
        <a
          href="/character-select"
          style={{
            padding: '0.75rem 2rem',
            background: 'white',
            color: '#1e3c72',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Back to Character Select
        </a>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Debug Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div>
          <button
            onClick={() => setShowStage(!showStage)}
            style={{
              padding: '5px 10px',
              marginBottom: '10px',
              cursor: 'pointer',
              background: showStage ? '#4CAF50' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '3px'
            }}
          >
            Stage: {showStage ? 'ON' : 'OFF'}
          </button>
        </div>
        <div>Player Position:</div>
        <div>X: {playerPosition.x.toFixed(2)}</div>
        <div>Y: {playerPosition.y.toFixed(2)}</div>
        <div>Z: {playerPosition.z.toFixed(2)}</div>
        <div>Rot: {playerPosition.rotation.toFixed(2)}</div>
      </div>

      {/* HUD - Character stats */}
      <HUD />

      {/* Pause Menu - Equipment */}
      <PauseMenu />

      {/* Shop Menu - NPC interactions */}
      <ShopMenu />

      {/* 3D Scene */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController target={playerPosition} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {/* Warp Environment - OUTSIDE Physics to prevent auto-collision */}
          {showStage && <WarpEnvironment />}

          <Physics gravity={[0, -9.81, 0]}>
            {/* Ground plane - GREEN */}
            <WarpGroundPlane />

            {/* Warp Walls - DISABLED (causes floating bug) */}
            {/* <WarpWalls visible={true} /> */}

            {/* Kill plane to respawn player if they fall */}
            <KillPlane onRespawn={handleRespawn} />

            {/* Area Triggers */}
            <WarpTriggers visible={false} />

            {/* Warp NPCs */}
            <WarpNPCs />

            {/* Player Character */}
            <PlayerCharacter
              key={respawnKey}
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={[0, 5, 0]}
            />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
