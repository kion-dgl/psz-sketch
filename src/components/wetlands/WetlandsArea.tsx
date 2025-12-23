import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import WetlandsEnv, { WetlandsFloorCollision } from './environments/WetlandsEnv';
import PlayerCharacter from '../city/PlayerCharacter';
import RainParticles from '../valley/RainParticles';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';
import Compass from '../ui/Compass';
import MapTrigger from '../valley/MapTrigger';

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
    const distance = 6;
    const height = 3;

    const offsetX = Math.sin(rotationRef.current) * distance;
    const offsetZ = Math.cos(rotationRef.current) * distance;

    camera.position.x = target.x + offsetX;
    camera.position.y = target.y + height;
    camera.position.z = target.z + offsetZ;

    camera.lookAt(target.x, target.y + 1, target.z);
  });

  return null;
}

interface TriggerConfig {
  position: [number, number, number];
  targetUrl?: string;
  targetMap?: string;
  label?: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
}

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'foggy' | 'rain' | 'rain-heavy';

interface LightingConfig {
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

// Wetlands lighting - more green/misty atmosphere
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.5,
    ambientColor: '#e0ffe0',
    directionalIntensity: 0.7,
    directionalColor: '#fffef0',
    directionalPosition: [10, 20, 10],
    fogColor: '#8fbc8f',
    fogNear: 30,
    fogFar: 150,
  },
  dusk: {
    ambientIntensity: 0.3,
    ambientColor: '#cc9966',
    directionalIntensity: 0.4,
    directionalColor: '#ff8844',
    directionalPosition: [30, 5, 10],
    fogColor: '#7a6655',
    fogNear: 20,
    fogFar: 120,
  },
  night: {
    ambientIntensity: 0.12,
    ambientColor: '#3a5a4a',
    directionalIntensity: 0.2,
    directionalColor: '#88aacc',
    directionalPosition: [-10, 15, -10],
    fogColor: '#1a2a1e',
    fogNear: 15,
    fogFar: 80,
  },
};

interface WetlandsAreaProps {
  mapId: string;
  mapName: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  triggers?: TriggerConfig[];
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  children?: React.ReactNode;
}

export default function WetlandsArea({ mapId, mapName, spawnPosition: defaultSpawn = [0, 10, 0], spawnRotation: defaultRotation = 0, triggers = [], timeOfDay = 'day', weather = 'clear', children }: WetlandsAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });

  // Get lighting configuration based on time of day
  const lighting = LIGHTING_CONFIGS[timeOfDay];

  // Adjust lighting for weather
  const weatherAdjustedLighting = {
    ...lighting,
    // Foggy weather reduces visibility
    fogNear: weather === 'foggy' ? 5 : weather === 'rain' ? 15 : weather === 'rain-heavy' ? 8 : lighting.fogNear,
    fogFar: weather === 'foggy' ? 40 : weather === 'rain' ? 60 : weather === 'rain-heavy' ? 35 : lighting.fogFar,
    // Rain uses darker fog
    fogColor: weather === 'rain' ? '#3a4a3a' : weather === 'rain-heavy' ? '#2a3a2a' : weather === 'foggy' ? '#6a8a6a' : lighting.fogColor,
    // Rain darkens the scene
    ambientIntensity: weather === 'rain' ? lighting.ambientIntensity * 0.7 : weather === 'rain-heavy' ? lighting.ambientIntensity * 0.5 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? lighting.directionalIntensity * 0.5 : weather === 'rain-heavy' ? lighting.directionalIntensity * 0.3 : lighting.directionalIntensity,
  };
  const [debugStart, setDebugStart] = useState(true);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  // Read spawn parameters from URL
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>(defaultSpawn);
  const [spawnRotation, setSpawnRotation] = useState<number>(defaultRotation);

  useEffect(() => {
    // Check URL parameters for spawn position
    const params = new URLSearchParams(window.location.search);
    const x = params.get('x');
    const y = params.get('y');
    const z = params.get('z');
    const r = params.get('r');

    if (x !== null && y !== null && z !== null) {
      setSpawnPosition([parseFloat(x), parseFloat(y), parseFloat(z)]);
    }
    if (r !== null) {
      setSpawnRotation(parseFloat(r));
    }
  }, []);

  const handleNPCInteraction = (npcName: string) => {
    openShop(npcName);
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
        setSelectedCharacter(character);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [setSelectedCharacter]);

  // Debug position logging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const { x, y, z } = playerPosition;
        if (debugStart) {
          console.log(`debug start: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
        } else {
          console.log(`debug stop: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
        }
        setDebugStart(!debugStart);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, debugStart]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #2d5016 0%, #4a7023 100%)',
        color: 'white'
      }}>
        <p>Loading {mapName}...</p>
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
        background: 'linear-gradient(135deg, #2d5016 0%, #4a7023 100%)',
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
            color: '#2d5016',
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
      {/* HUD - Character stats */}
      <HUD />

      {/* Pause Menu - Equipment */}
      <PauseMenu />

      {/* Shop Menu - NPC interactions */}
      <ShopMenu />

      {/* Compass */}
      <Compass rotation={playerPosition.rotation} position="bottom-left" />

      {/* Debug Position Display */}
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
        <div>{mapName}</div>
        <div>Map ID: {mapId}</div>
        <div>Player Position:</div>
        <div>X: {playerPosition.x.toFixed(2)}</div>
        <div>Y: {playerPosition.y.toFixed(2)}</div>
        <div>Z: {playerPosition.z.toFixed(2)}</div>
        <div>Rot: {playerPosition.rotation.toFixed(2)}</div>
        <div style={{ marginTop: '0.5rem', color: '#ffd700' }}>
          Press SPACE: {debugStart ? 'Debug Start' : 'Debug Stop'}
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController target={playerPosition} />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={[weatherAdjustedLighting.fogColor, weatherAdjustedLighting.fogNear, weatherAdjustedLighting.fogFar]} />

        <ambientLight intensity={weatherAdjustedLighting.ambientIntensity} color={weatherAdjustedLighting.ambientColor} />
        <directionalLight
          position={weatherAdjustedLighting.directionalPosition}
          intensity={weatherAdjustedLighting.directionalIntensity}
          color={weatherAdjustedLighting.directionalColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {/* Wetlands Environment - OUTSIDE Physics */}
          <WetlandsEnv mapId={mapId} />

          {/* Weather particle effects - wetlands uses rain more often */}
          {(weather === 'rain' || weather === 'rain-heavy') && (
            <RainParticles intensity={weather === 'rain-heavy' ? 'heavy' : 'normal'} />
          )}

          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor collision mesh */}
            <WetlandsFloorCollision mapId={mapId} />

            {/* Map triggers (loading zones) */}
            {triggers.map((trigger, index) => (
              <MapTrigger
                key={index}
                position={trigger.position}
                targetUrl={trigger.targetUrl}
                targetMap={trigger.targetMap}
                label={trigger.label}
                spawnPosition={trigger.spawnPosition}
                spawnRotation={trigger.spawnRotation}
              />
            ))}
            {children}

            {/* Player Character */}
            <PlayerCharacter
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={spawnPosition}
              spawnRotation={spawnRotation}
            />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
