import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import SnowfieldEnv, { SnowfieldFloorCollision } from './environments/SnowfieldEnv';
import PlayerCharacter from '../city/PlayerCharacter';
import SnowParticles from './SnowParticles';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';
import Compass from '../ui/Compass';
import MapTrigger from '../valley/MapTrigger';
import { getMapConfig, getDefaultSpawn, type TriggerConfig as ConfigTrigger, type SpawnPoint } from './snowfieldConfig';

function CameraController({ target }: { target: { x: number; y: number; z: number } }) {
  const { camera, gl } = useThree();
  const rotationRef = useRef(0); // Horizontal rotation (yaw)
  const pitchRef = useRef(0.3); // Vertical rotation (pitch) - start slightly above
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
      // Clamp pitch to avoid flipping (between -80 and +80 degrees)
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

    // Calculate camera position using spherical coordinates
    const horizontalDist = Math.cos(pitchRef.current) * distance;
    const height = Math.sin(pitchRef.current) * distance;

    const offsetX = Math.sin(rotationRef.current) * horizontalDist;
    const offsetZ = Math.cos(rotationRef.current) * horizontalDist;

    camera.position.x = target.x + offsetX;
    camera.position.y = target.y + 1 + height; // +1 to orbit around character center
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
            {/* Direction arrow - points in the direction player will face */}
            <group rotation={[0, spawn.rotation, 0]}>
              {/* Arrow shaft */}
              <mesh position={[0, 0.3, 1.2]}>
                <boxGeometry args={[0.2, 0.2, 2]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {/* Arrow head - pointing forward (+Z when rotation=0) */}
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

      {/* Exit trigger markers - blue boxes centered at trigger position */}
      {triggers.map((trigger, index) => {
        const size: [number, number, number] = trigger.size || [6, 3, 2]; // Wide triggers to block paths
        const rotation = trigger.rotation || 0;
        return (
          <group key={index} position={trigger.position} rotation={[0, rotation, 0]}>
            {/* Blue transparent box - centered at trigger position (matching CuboidCollider behavior) */}
            <mesh>
              <boxGeometry args={size} />
              <meshBasicMaterial color="#0088ff" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            {/* Wireframe outline */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
              <lineBasicMaterial color="#00aaff" linewidth={2} />
            </lineSegments>
            {/* Label indicator at top */}
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
type Weather = 'clear' | 'snowing' | 'blizzard';

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

// Snowfield lighting - cold, icy atmosphere
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.6,
    ambientColor: '#e0f0ff',
    directionalIntensity: 0.8,
    directionalColor: '#fffef8',
    directionalPosition: [10, 20, 10],
    fogColor: '#c8dce8',
    fogNear: 30,
    fogFar: 150,
  },
  dusk: {
    ambientIntensity: 0.35,
    ambientColor: '#9999cc',
    directionalIntensity: 0.45,
    directionalColor: '#ff9966',
    directionalPosition: [30, 5, 10],
    fogColor: '#8a7a8a',
    fogNear: 20,
    fogFar: 120,
  },
  night: {
    ambientIntensity: 0.15,
    ambientColor: '#4a5a7a',
    directionalIntensity: 0.25,
    directionalColor: '#aaccff',
    directionalPosition: [-10, 15, -10],
    fogColor: '#1a2a3e',
    fogNear: 15,
    fogFar: 80,
  },
};

interface SnowfieldAreaProps {
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

export default function SnowfieldArea({ mapId, mapName, spawnPosition: propSpawn, spawnRotation: propRotation, triggers: propTriggers, timeOfDay = 'day', weather = 'clear', debugMode: initialDebug = true, children }: SnowfieldAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [showDebugMarkers, setShowDebugMarkers] = useState(initialDebug);

  // Get config from snowfieldConfig.ts, with prop overrides
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
    // Snowy weather reduces visibility
    fogNear: weather === 'snowing' ? 10 : weather === 'blizzard' ? 5 : lighting.fogNear,
    fogFar: weather === 'snowing' ? 50 : weather === 'blizzard' ? 25 : lighting.fogFar,
    // Snow uses whiter fog
    fogColor: weather === 'snowing' ? '#d8e8f0' : weather === 'blizzard' ? '#e8f0f8' : lighting.fogColor,
    // Blizzard darkens the scene slightly
    ambientIntensity: weather === 'blizzard' ? lighting.ambientIntensity * 0.7 : lighting.ambientIntensity,
    directionalIntensity: weather === 'blizzard' ? lighting.directionalIntensity * 0.5 : lighting.directionalIntensity,
  };
  const [debugStart, setDebugStart] = useState(true);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  // Read spawn parameters from URL, fallback to config
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>(configSpawn);
  const [spawnRotation, setSpawnRotation] = useState<number>(configRotation);

  useEffect(() => {
    // Check URL parameters for spawn position override
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
        background: 'linear-gradient(135deg, #1a4a6e 0%, #4a8ab0 100%)',
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
        background: 'linear-gradient(135deg, #1a4a6e 0%, #4a8ab0 100%)',
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
            color: '#1a4a6e',
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
        <button
          onClick={() => setShowDebugMarkers(!showDebugMarkers)}
          style={{
            marginTop: '0.5rem',
            padding: '4px 8px',
            background: showDebugMarkers ? '#00aa00' : '#555',
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
          {/* Snowfield Environment - OUTSIDE Physics */}
          <SnowfieldEnv mapId={mapId} />

          {/* Snow particle effect - intensity based on weather */}
          <SnowParticles intensity={weather === 'blizzard' ? 'heavy' : weather === 'snowing' ? 'normal' : 'light'} />

          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor collision mesh */}
            <SnowfieldFloorCollision mapId={mapId} />

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
