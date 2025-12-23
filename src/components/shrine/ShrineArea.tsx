import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import ShrineEnv, { ShrineFloorCollision } from './environments/ShrineEnv';
import PlayerCharacter from '../city/PlayerCharacter';
import ShadowWispParticles from './ShadowWispParticles';
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
      if (e.key === 'ArrowLeft') rotationRef.current -= rotationSpeed;
      else if (e.key === 'ArrowRight') rotationRef.current += rotationSpeed;
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
type Weather = 'clear' | 'humid' | 'rain';

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

// Dark Shrine lighting - mysterious dark temple with ethereal glows
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.2,
    ambientColor: '#2a2a3a',
    directionalIntensity: 0.25,
    directionalColor: '#8888aa',
    directionalPosition: [10, 20, 10],
    fogColor: '#1a1a2a',
    fogNear: 20,
    fogFar: 90,
  },
  dusk: {
    ambientIntensity: 0.15,
    ambientColor: '#2a2030',
    directionalIntensity: 0.2,
    directionalColor: '#aa6688',
    directionalPosition: [30, 5, 10],
    fogColor: '#151520',
    fogNear: 15,
    fogFar: 75,
  },
  night: {
    ambientIntensity: 0.08,
    ambientColor: '#15151f',
    directionalIntensity: 0.1,
    directionalColor: '#5555aa',
    directionalPosition: [-10, 15, -10],
    fogColor: '#0a0a12',
    fogNear: 10,
    fogFar: 55,
  },
};

interface ShrineAreaProps {
  mapId: string;
  mapName: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  triggers?: TriggerConfig[];
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  children?: React.ReactNode;
}

export default function ShrineArea({ mapId, mapName, spawnPosition: defaultSpawn = [0, 10, 0], spawnRotation: defaultRotation = 0, triggers = [], timeOfDay = 'day', weather = 'clear', children }: ShrineAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const lighting = LIGHTING_CONFIGS[timeOfDay];

  const weatherAdjustedLighting = {
    ...lighting,
    fogNear: weather === 'humid' ? 12 : weather === 'rain' ? 8 : lighting.fogNear,
    fogFar: weather === 'humid' ? 60 : weather === 'rain' ? 45 : lighting.fogFar,
    fogColor: weather === 'humid' ? '#1a1a25' : weather === 'rain' ? '#12121a' : lighting.fogColor,
    ambientIntensity: weather === 'rain' ? lighting.ambientIntensity * 0.6 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? lighting.directionalIntensity * 0.4 : lighting.directionalIntensity,
  };

  const [debugStart, setDebugStart] = useState(true);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>(defaultSpawn);
  const [spawnRotation, setSpawnRotation] = useState<number>(defaultRotation);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const x = params.get('x');
    const y = params.get('y');
    const z = params.get('z');
    const r = params.get('r');
    if (x !== null && y !== null && z !== null) {
      setSpawnPosition([parseFloat(x), parseFloat(y), parseFloat(z)]);
    }
    if (r !== null) setSpawnRotation(parseFloat(r));
  }, []);

  const handleNPCInteraction = (npcName: string) => openShop(npcName);

  useEffect(() => {
    try {
      const selectedCharacterId = localStorage.getItem('selectedCharacterId');
      if (!selectedCharacterId) { setLoading(false); return; }
      const stored = localStorage.getItem('characters') || '[]';
      const chars = JSON.parse(stored);
      const character = chars.find((c: Character | null) => c?.character_id === selectedCharacterId);
      if (character) setSelectedCharacter(character);
      setLoading(false);
    } catch (err) { setLoading(false); }
  }, [setSelectedCharacter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const { x, y, z } = playerPosition;
        console.log(`debug ${debugStart ? 'start' : 'stop'}: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
        setDebugStart(!debugStart);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, debugStart]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2a 100%)', color: 'white' }}>
        <p>Loading {mapName}...</p>
      </div>
    );
  }

  if (!selectedCharacter) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2a 100%)', color: 'white', flexDirection: 'column', gap: '1rem' }}>
        <p>No character selected</p>
        <a href="/character-select" style={{ padding: '0.75rem 2rem', background: 'white', color: '#0a0a15', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          Back to Character Select
        </a>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <HUD />
      <PauseMenu />
      <ShopMenu />
      <Compass rotation={playerPosition.rotation} position="bottom-left" />

      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', borderRadius: '5px', fontFamily: 'monospace', fontSize: '12px' }}>
        <div>{mapName}</div>
        <div>Map ID: {mapId}</div>
        <div>Player Position:</div>
        <div>X: {playerPosition.x.toFixed(2)}</div>
        <div>Y: {playerPosition.y.toFixed(2)}</div>
        <div>Z: {playerPosition.z.toFixed(2)}</div>
        <div>Rot: {playerPosition.rotation.toFixed(2)}</div>
        <div style={{ marginTop: '0.5rem', color: '#aa88cc' }}>Press SPACE: {debugStart ? 'Debug Start' : 'Debug Stop'}</div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController target={playerPosition} />
        <fog attach="fog" args={[weatherAdjustedLighting.fogColor, weatherAdjustedLighting.fogNear, weatherAdjustedLighting.fogFar]} />
        <ambientLight intensity={weatherAdjustedLighting.ambientIntensity} color={weatherAdjustedLighting.ambientColor} />
        <directionalLight position={weatherAdjustedLighting.directionalPosition} intensity={weatherAdjustedLighting.directionalIntensity} color={weatherAdjustedLighting.directionalColor} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

        <Suspense fallback={null}>
          <ShrineEnv mapId={mapId} />
          <ShadowWispParticles intensity="light" />

          <Physics gravity={[0, -9.81, 0]}>
            <ShrineFloorCollision mapId={mapId} />
            {triggers.map((trigger, index) => (
              <MapTrigger key={index} position={trigger.position} targetUrl={trigger.targetUrl} targetMap={trigger.targetMap} label={trigger.label} spawnPosition={trigger.spawnPosition} spawnRotation={trigger.spawnRotation} />
            ))}
            {children}
            <PlayerCharacter character={selectedCharacter} onPositionChange={setPlayerPosition} onInteraction={handleNPCInteraction} spawnPosition={spawnPosition} spawnRotation={spawnRotation} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
