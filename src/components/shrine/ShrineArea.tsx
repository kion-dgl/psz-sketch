import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import ShrineEnv, { ShrineFloorCollision } from './environments/ShrineEnv';
import PlayerCharacter from '../city/PlayerCharacter';
import ShadowWispParticles from './ShadowWispParticles';
import LightDarkParticles from './LightDarkParticles';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';
import Compass from '../ui/Compass';
import MapTrigger from '../valley/MapTrigger';
import { getMapConfig, getDefaultSpawn, type TriggerConfig as ConfigTrigger, type SpawnPoint } from './shrineConfig';

function CameraController({ target }: { target: { x: number; y: number; z: number } }) {
  const { camera, gl } = useThree();
  const rotationRef = useRef(0);
  const pitchRef = useRef(0.3);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const rotationSpeed = 0.05;
      if (e.key === 'ArrowLeft') {
        rotationRef.current -= rotationSpeed;
      } else if (e.key === 'ArrowRight') {
        rotationRef.current += rotationSpeed;
      } else if (e.key === 'ArrowUp') {
        pitchRef.current = Math.min(pitchRef.current + rotationSpeed, Math.PI / 2 - 0.1);
      } else if (e.key === 'ArrowDown') {
        pitchRef.current = Math.max(pitchRef.current - rotationSpeed, -Math.PI / 2 + 0.1);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastMouseX.current;
      const deltaY = e.clientY - lastMouseY.current;
      const rotationSpeed = 0.005;

      rotationRef.current -= deltaX * rotationSpeed;
      pitchRef.current = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, pitchRef.current + deltaY * rotationSpeed)
      );

      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    const canvas = gl.domElement;
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl]);

  useFrame(() => {
    const distance = 6;

    const horizontalDist = Math.cos(pitchRef.current) * distance;
    const height = Math.sin(pitchRef.current) * distance;

    const offsetX = Math.sin(rotationRef.current) * horizontalDist;
    const offsetZ = Math.cos(rotationRef.current) * horizontalDist;

    camera.position.x = target.x + offsetX;
    camera.position.y = target.y + 1 + height;
    camera.position.z = target.z + offsetZ;

    camera.lookAt(target.x, target.y + 1, target.z);
  });

  return null;
}

// Debug visualization for spawn points and triggers
function DebugMarkers({
  spawnPoints,
  triggers
}: {
  spawnPoints: SpawnPoint[];
  triggers: ConfigTrigger[];
}) {
  return (
    <group>
      {/* Spawn point markers - green for default, yellow for others */}
      {spawnPoints.map((spawn, index) => {
        const color = spawn.isDefault ? '#00ff00' : '#ffff00';
        return (
          <group key={index} position={spawn.position}>
            {/* Base platform */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            {/* Spawn indicator pole */}
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Direction arrow */}
            <group rotation={[0, spawn.rotation, 0]}>
              <mesh position={[0, 0.3, 1.2]}>
                <boxGeometry args={[0.2, 0.2, 2]} />
                <meshBasicMaterial color={color} />
              </mesh>
              <mesh position={[0, 0.3, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.4, 0.8, 8]} />
                <meshBasicMaterial color={color} />
              </mesh>
            </group>
            {/* Label sphere at top */}
            <mesh position={[0, 2.2, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
      })}

      {/* Exit trigger markers - blue boxes */}
      {triggers.map((trigger, index) => {
        const size: [number, number, number] = trigger.size || [6, 3, 2];
        const rotation = trigger.rotation || 0;
        return (
          <group key={index} position={trigger.position} rotation={[0, rotation, 0]}>
            <mesh>
              <boxGeometry args={size} />
              <meshBasicMaterial color="#0088ff" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
              <lineBasicMaterial color="#00aaff" linewidth={2} />
            </lineSegments>
            <mesh position={[0, size[1] / 2 + 0.5, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color="#0088ff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

interface TriggerConfig {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
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
  debugMode?: boolean;
  children?: React.ReactNode;
}

export default function ShrineArea({ mapId, mapName, spawnPosition: propSpawn, spawnRotation: propRotation, triggers: propTriggers, timeOfDay = 'day', weather = 'clear', debugMode: initialDebug = true, children }: ShrineAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [showDebugMarkers, setShowDebugMarkers] = useState(initialDebug);

  // Get config from shrineConfig.ts, with prop overrides
  const mapConfig = getMapConfig(mapId);
  const defaultSpawn = getDefaultSpawn(mapConfig);
  const configSpawn = propSpawn || defaultSpawn.position;
  const configRotation = propRotation ?? defaultSpawn.rotation;
  const configTriggers = propTriggers && propTriggers.length > 0 ? propTriggers : mapConfig.triggers;
  const configSpawnPoints = mapConfig.spawnPoints;

  // Get lighting configuration based on time of day
  const lighting = LIGHTING_CONFIGS[timeOfDay];

  // Adjust lighting for weather
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

  // Read spawn parameters from URL, fallback to config
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>(configSpawn);
  const [spawnRotation, setSpawnRotation] = useState<number>(configRotation);

  useEffect(() => {
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
  }, [configSpawn, configRotation]);

  const handleNPCInteraction = (npcName: string) => {
    openShop(npcName);
  };

  useEffect(() => {
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
        background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2a 100%)',
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
        background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2a 100%)',
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
            color: '#0a0a15',
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
        <div style={{ marginTop: '0.5rem', color: '#aa88cc' }}>
          Press SPACE: {debugStart ? 'Debug Start' : 'Debug Stop'}
        </div>
        <button
          onClick={() => setShowDebugMarkers(!showDebugMarkers)}
          style={{
            marginTop: '0.5rem',
            padding: '4px 8px',
            background: showDebugMarkers ? '#8855aa' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '11px',
            width: '100%'
          }}
        >
          {showDebugMarkers ? 'Hide' : 'Show'} Debug Markers
        </button>
      </div>

      {/* 3D Scene */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController target={playerPosition} />

        {/* Fog for dark shrine atmosphere */}
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
          {/* Shrine Environment - OUTSIDE Physics */}
          <ShrineEnv mapId={mapId} />

          {/* Conditional particles based on shrine section */}
          {mapId.startsWith('s07a_') && <ShadowWispParticles intensity="normal" />}
          {mapId.startsWith('s07b_') && <LightDarkParticles intensity="normal" />}
          {mapId.startsWith('s07e_') && <ShadowWispParticles intensity="light" />}
          {mapId.startsWith('s07z_') && <LightDarkParticles intensity="heavy" />}

          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor collision mesh */}
            <ShrineFloorCollision mapId={mapId} />

            {/* Map triggers (loading zones) */}
            {configTriggers.map((trigger, index) => (
              <MapTrigger
                key={index}
                position={trigger.position}
                size={trigger.size || [6, 3, 2]}
                rotation={trigger.rotation || 0}
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
              spawnRotation={spawnRotation + Math.PI}
            />
          </Physics>

          {/* Debug markers for spawn points and triggers */}
          {showDebugMarkers && (
            <DebugMarkers
              spawnPoints={configSpawnPoints}
              triggers={configTriggers}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
