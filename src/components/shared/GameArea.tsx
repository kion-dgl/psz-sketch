import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, type ReactNode } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import { CollisionProvider } from '../../collision';
import AnimatedPlayerCharacter from '../city/AnimatedPlayerCharacter';
import CameraController from './CameraController';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';

export interface SpawnConfig {
  condition: string;
  position: [number, number, number];
  rotation: number;
}

export interface LightingConfig {
  ambientIntensity?: number;
  ambientColor?: string;
  directionalIntensity?: number;
  directionalColor?: string;
  directionalPosition?: [number, number, number];
}

export interface FogConfig {
  color: string;
  near: number;
  far: number;
}

export interface GameAreaRenderProps {
  playerPosition: { x: number; y: number; z: number; rotation: number };
  selectedCharacter: Character;
  setPlayerInInteractiveZone: (zone: string | null) => void;
}

export interface GameAreaProps {
  // Area identification
  areaName?: string;
  areaId?: string;

  // Spawn configuration
  defaultSpawnPosition: [number, number, number];
  defaultSpawnRotation?: number;
  spawnConfigs?: SpawnConfig[];
  addPiToSpawnRotation?: boolean;

  // Camera configuration
  lobbyMode?: boolean;
  cameraDistance?: number;
  cameraHeight?: number;

  // Lighting configuration
  lighting?: LightingConfig;
  fog?: FogConfig;

  // Theme
  backgroundGradient?: string;
  debugAccentColor?: string;

  // Debug options
  showDebugPanel?: boolean;
  debugLabel?: string;

  // Content - environment outside physics
  environmentOutsidePhysics?: ReactNode;

  // Content - render props for physics content (excludes PlayerCharacter)
  renderPhysicsContent?: (props: GameAreaRenderProps) => ReactNode;

  // Additional overlay UI (can be render prop to access player state)
  overlayUI?: ReactNode | ((props: {
    playerInInteractiveZone: string | null;
    playerPosition: { x: number; y: number; z: number; rotation: number };
  }) => ReactNode);
}

export default function GameArea({
  areaName,
  areaId,
  defaultSpawnPosition,
  defaultSpawnRotation = 0,
  spawnConfigs = [],
  addPiToSpawnRotation = false,
  lobbyMode = false,
  cameraDistance = 6,
  cameraHeight = 3,
  lighting = {},
  fog,
  backgroundGradient = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  debugAccentColor = '#ffd700',
  showDebugPanel = true,
  debugLabel = 'Debug',
  environmentOutsidePhysics,
  renderPhysicsContent,
  overlayUI
}: GameAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [debugStart, setDebugStart] = useState(true);
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>(defaultSpawnPosition);
  const [spawnRotation, setSpawnRotation] = useState(defaultSpawnRotation);
  const [playerInInteractiveZone, setPlayerInInteractiveZone] = useState<string | null>(null);
  const [respawnKey, setRespawnKey] = useState(0);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  // Default lighting values
  const {
    ambientIntensity = 0.6,
    ambientColor = '#ffffff',
    directionalIntensity = 0.8,
    directionalColor = '#ffffff',
    directionalPosition = [10, 20, 10] as [number, number, number]
  } = lighting;

  const handleNPCInteraction = (npcName: string) => {
    openShop(npcName);
  };

  // Load character and handle spawn config (runs once on mount)
  useEffect(() => {
    // Check URL parameters for spawn
    const urlParams = new URLSearchParams(window.location.search);

    // Check for named spawn config (lobby style)
    const spawnName = urlParams.get('spawn');
    if (spawnName && spawnConfigs.length > 0) {
      const config = spawnConfigs.find(c => c.condition === spawnName);
      if (config) {
        setSpawnPosition(config.position);
        setSpawnRotation(config.rotation);
      }
    }

    // Check for coordinate spawn (stage style)
    const x = urlParams.get('x');
    const y = urlParams.get('y');
    const z = urlParams.get('z');
    const r = urlParams.get('r');
    if (x !== null && y !== null && z !== null) {
      setSpawnPosition([parseFloat(x), parseFloat(y), parseFloat(z)]);
    }
    if (r !== null) {
      setSpawnRotation(parseFloat(r));
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
    } catch {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelectedCharacter]); // Only run on mount - spawn configs are read once

  // Kill plane - respawn player if they fall below Y=-10
  useEffect(() => {
    if (playerPosition.y < -10) {
      console.log('[Kill Plane] Player fell below Y=-10, respawning to (0, 1, 0)');
      setSpawnPosition([0, 1, 0]);
      setSpawnRotation(0);
      setRespawnKey(k => k + 1);
    }
  }, [playerPosition.y]);

  // Debug position logging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const { x, y, z } = playerPosition;
        if (debugStart) {
          console.log(`${debugLabel.toLowerCase()} start: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
        } else {
          console.log(`${debugLabel.toLowerCase()} stop: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
        }
        setDebugStart(!debugStart);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, debugStart, debugLabel]);

  // Copy stats to clipboard
  const copyStats = () => {
    const stats = {
      area: areaId || areaName || 'unknown',
      position: {
        x: parseFloat(playerPosition.x.toFixed(2)),
        y: parseFloat(playerPosition.y.toFixed(2)),
        z: parseFloat(playerPosition.z.toFixed(2)),
      },
      rotation: parseFloat(playerPosition.rotation.toFixed(2)),
      spawn: {
        position: spawnPosition,
        rotation: spawnRotation,
      },
    };
    const text = JSON.stringify(stats, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      console.log('Stats copied to clipboard:', stats);
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: backgroundGradient,
        color: 'white'
      }}>
        <p>Loading{areaName ? ` ${areaName}` : ''}...</p>
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
        background: backgroundGradient,
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

  const finalSpawnRotation = addPiToSpawnRotation ? spawnRotation + Math.PI : spawnRotation;

  const renderProps: GameAreaRenderProps = {
    playerPosition,
    selectedCharacter,
    setPlayerInInteractiveZone
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <HUD />
      <PauseMenu />
      <ShopMenu />

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
          {areaName && <div>{areaName}</div>}
          {areaId && <div>ID: {areaId}</div>}
          <div>Player Position:</div>
          <div>X: {playerPosition.x.toFixed(2)}</div>
          <div>Y: {playerPosition.y.toFixed(2)}</div>
          <div>Z: {playerPosition.z.toFixed(2)}</div>
          <div>Rot: {playerPosition.rotation.toFixed(2)}</div>
          <div style={{ marginTop: '0.5rem', color: debugAccentColor }}>
            Press SPACE: {debugStart ? `${debugLabel} Start` : `${debugLabel} Stop`}
          </div>
          <button
            onClick={copyStats}
            style={{
              marginTop: '0.5rem',
              padding: '4px 8px',
              background: debugAccentColor,
              color: 'black',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            Copy Stats
          </button>
        </div>
      )}

      {/* Overlay UI (compass, interactive trigger UI, etc.) */}
      {typeof overlayUI === 'function'
        ? overlayUI({ playerInInteractiveZone, playerPosition })
        : overlayUI}

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController
          target={playerPosition}
          distance={cameraDistance}
          height={cameraHeight}
          lobbyMode={lobbyMode}
        />

        {fog && <fog attach="fog" args={[fog.color, fog.near, fog.far]} />}

        <ambientLight intensity={ambientIntensity} color={ambientColor} />
        <directionalLight
          position={directionalPosition}
          intensity={directionalIntensity}
          color={directionalColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {environmentOutsidePhysics}

          <CollisionProvider>
            {renderPhysicsContent?.(renderProps)}

            <AnimatedPlayerCharacter
              key={respawnKey}
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={spawnPosition}
              spawnRotation={finalSpawnRotation}
            />
          </CollisionProvider>
        </Suspense>
      </Canvas>
    </div>
  );
}
