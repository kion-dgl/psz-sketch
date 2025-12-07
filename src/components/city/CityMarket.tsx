import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import MarketEnvironment from './MarketEnvironment';
import PlayerCharacter from './PlayerCharacter';
import NPCs from './NPCs';
import InvisibleWalls from './InvisibleWalls';
import AreaTriggers from './AreaTriggers';

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
    const distance = 6; // Closer camera for better view
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

export default function CityMarket() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [isWallStart, setIsWallStart] = useState(true);
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>([0.98, 10, 62.79]);

  const handleNPCInteraction = (npcName: string) => {
    console.log(`[Market] Player interacted with: ${npcName}`);
    // TODO: Open dialogue UI, shop interface, etc.
  };

  useEffect(() => {
    // Check URL parameter for spawn location
    const urlParams = new URLSearchParams(window.location.search);
    const spawn = urlParams.get('spawn');

    if (spawn === 'counter-exit') {
      setSpawnPosition([0.98, 10, 18.84]);
    }

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
        setSelectedCharacter(character);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading character:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Spacebar listener for wall position logging
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isWallStart) {
          console.log(`wall start: x: ${playerPosition.x.toFixed(2)}, y: ${playerPosition.y.toFixed(2)}, z: ${playerPosition.z.toFixed(2)}`);
        } else {
          console.log(`wall stop: x: ${playerPosition.x.toFixed(2)}, y: ${playerPosition.y.toFixed(2)}, z: ${playerPosition.z.toFixed(2)}`);
        }
        setIsWallStart(!isWallStart);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, isWallStart]);

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
      {/* Position Display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <div>Character: {selectedCharacter.character_name}</div>
        <div>Class: {selectedCharacter.class_id}</div>
        <div>Position:</div>
        <div>X: {playerPosition.x.toFixed(2)}</div>
        <div>Y: {playerPosition.y.toFixed(2)}</div>
        <div>Z: {playerPosition.z.toFixed(2)}</div>
        <div>Rotation: {playerPosition.rotation.toFixed(2)}</div>
        <div style={{ marginTop: '0.5rem', color: '#ffd700' }}>
          Press SPACE: {isWallStart ? 'Wall Start' : 'Wall Stop'}
        </div>
        <div style={{ marginTop: '0.5rem', color: '#ff6b6b' }}>
          Press E to interact with NPCs
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 12]} />
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
          <Physics gravity={[0, -9.81, 0]}>
            {/* Market Environment */}
            <MarketEnvironment />

            {/* Invisible Walls */}
            <InvisibleWalls visible={true} />

            {/* Area Triggers */}
            <AreaTriggers visible={false} />

            {/* Player Character */}
            <PlayerCharacter
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              spawnPosition={spawnPosition}
              onInteraction={handleNPCInteraction}
            />

            {/* NPC Placeholders */}
            <NPCs />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
