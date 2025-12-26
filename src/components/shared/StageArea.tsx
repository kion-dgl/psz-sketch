import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, type ReactNode } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import PlayerCharacter from '../city/PlayerCharacter';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';
import Compass from '../ui/Compass';
import MapTrigger from '../valley/MapTrigger';
import CameraController from './CameraController';
import DebugMarkers, { type SpawnPoint, type TriggerConfig } from './DebugMarkers';

export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

export interface ThemeConfig {
  loadingBackground: string;
  loadingTextColor?: string;
  debugAccentColor: string;
  debugButtonActiveColor?: string;
}

export interface MapConfig {
  triggers: TriggerConfig[];
  spawnPoints: SpawnPoint[];
}

export interface StageAreaProps {
  // Required identifiers
  mapId: string;
  mapName: string;

  // Render components (passed as JSX)
  environment: ReactNode;
  floorCollision: ReactNode;
  particles?: ReactNode;

  // Lighting configuration
  lighting: LightingConfig;

  // Theme configuration
  theme: ThemeConfig;

  // Optional spawn/trigger configuration
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  triggers?: TriggerConfig[];
  spawnPoints?: SpawnPoint[];

  // Optional config module functions
  getMapConfig?: (mapId: string) => MapConfig;
  getDefaultSpawn?: (config: MapConfig) => { position: [number, number, number]; rotation: number };

  // Debug and display options
  debugMode?: boolean;
  showDebugPanel?: boolean;
  addPiToSpawnRotation?: boolean;

  // Additional children to render in Physics
  children?: ReactNode;
}

export default function StageArea({
  mapId,
  mapName,
  environment,
  floorCollision,
  particles,
  lighting,
  theme,
  spawnPosition: propSpawn,
  spawnRotation: propRotation,
  triggers: propTriggers,
  spawnPoints: propSpawnPoints,
  getMapConfig,
  getDefaultSpawn: getDefaultSpawnFn,
  debugMode: initialDebug = true,
  showDebugPanel = true,
  addPiToSpawnRotation = true,
  children
}: StageAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [showDebugMarkers, setShowDebugMarkers] = useState(initialDebug);
  const [debugStart, setDebugStart] = useState(true);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  // Get config from module if provided, with prop overrides
  const mapConfig = getMapConfig ? getMapConfig(mapId) : { triggers: [], spawnPoints: [] };
  const defaultSpawn = getDefaultSpawnFn ? getDefaultSpawnFn(mapConfig) : { position: [0, 10, 0] as [number, number, number], rotation: 0 };

  const configSpawn = propSpawn || defaultSpawn.position;
  const configRotation = propRotation ?? defaultSpawn.rotation;
  const configTriggers = propTriggers && propTriggers.length > 0 ? propTriggers : mapConfig.triggers;
  const configSpawnPoints = propSpawnPoints && propSpawnPoints.length > 0 ? propSpawnPoints : mapConfig.spawnPoints;

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
    } catch {
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
        background: theme.loadingBackground,
        color: theme.loadingTextColor || 'white'
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
        background: theme.loadingBackground,
        color: theme.loadingTextColor || 'white',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p>No character selected</p>
        <a
          href="/character-select"
          style={{
            padding: '0.75rem 2rem',
            background: 'white',
            color: theme.debugAccentColor,
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

  const finalSpawnRotation = addPiToSpawnRotation ? spawnRotation + Math.PI : spawnRotation;

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
      {showDebugPanel && (
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
          <div style={{ marginTop: '0.5rem', color: theme.debugAccentColor }}>
            Press SPACE: {debugStart ? 'Debug Start' : 'Debug Stop'}
          </div>
          {configSpawnPoints.length > 0 && (
            <button
              onClick={() => setShowDebugMarkers(!showDebugMarkers)}
              style={{
                marginTop: '0.5rem',
                padding: '4px 8px',
                background: showDebugMarkers ? (theme.debugButtonActiveColor || '#00aa00') : '#555',
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
          )}
        </div>
      )}

      {/* 3D Scene */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController target={playerPosition} />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={[lighting.fogColor, lighting.fogNear, lighting.fogFar]} />

        <ambientLight intensity={lighting.ambientIntensity} color={lighting.ambientColor} />
        <directionalLight
          position={lighting.directionalPosition}
          intensity={lighting.directionalIntensity}
          color={lighting.directionalColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {/* Environment mesh - OUTSIDE Physics */}
          {environment}

          {/* Particle effects */}
          {particles}

          <Physics gravity={[0, -9.81, 0]}>
            {/* Floor collision mesh */}
            {floorCollision}

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

            {/* Additional children */}
            {children}

            {/* Player Character */}
            <PlayerCharacter
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={spawnPosition}
              spawnRotation={finalSpawnRotation}
            />
          </Physics>

          {/* Debug markers for spawn points and triggers */}
          {showDebugMarkers && configSpawnPoints.length > 0 && (
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

// Re-export types for convenience
export type { SpawnPoint, TriggerConfig } from './DebugMarkers';
