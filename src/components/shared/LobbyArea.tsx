import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, type ReactNode } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import PlayerCharacter from '../city/PlayerCharacter';
import CameraController from './CameraController';
import { InteractiveTriggerUI } from './InteractiveTriggers';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';

export interface SpawnConfig {
  condition: string;
  position: [number, number, number];
  rotation: number;
}

export interface LobbyRenderProps {
  playerPosition: { x: number; y: number; z: number; rotation: number };
  selectedCharacter: Character;
  spawnPosition: [number, number, number];
  spawnRotation: number;
  respawnKey: number;
  setPlayerPosition: (pos: { x: number; y: number; z: number; rotation: number }) => void;
  setPlayerInInteractiveZone: (zone: string | null) => void;
  handleNPCInteraction: (npcName: string) => void;
}

export interface LobbyAreaProps {
  // Render props for physics content
  renderPhysicsContent: (props: LobbyRenderProps) => ReactNode;
  // Environment elements outside physics (optional)
  environmentOutsidePhysics?: ReactNode;
  // Spawn configurations based on URL params
  spawnConfigs?: SpawnConfig[];
  // Default spawn position and rotation
  defaultSpawnPosition: [number, number, number];
  defaultSpawnRotation?: number;
  // Camera settings
  cameraDistance?: number;
  cameraHeight?: number;
  // Debug label for space key
  debugLabel?: string;
  // Background gradient for loading/no-character states
  backgroundGradient?: string;
  // Show interactive trigger UI
  showInteractiveTriggerUI?: boolean;
}

export default function LobbyArea({
  renderPhysicsContent,
  environmentOutsidePhysics,
  spawnConfigs = [],
  defaultSpawnPosition,
  defaultSpawnRotation = 0,
  cameraDistance = 6,
  cameraHeight = 3,
  debugLabel = 'Debug',
  backgroundGradient = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  showInteractiveTriggerUI = false
}: LobbyAreaProps) {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [debugStart, setDebugStart] = useState(true);
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>(defaultSpawnPosition);
  const [spawnRotation, setSpawnRotation] = useState(defaultSpawnRotation);
  const [playerInInteractiveZone, setPlayerInInteractiveZone] = useState<string | null>(null);
  const [respawnKey, setRespawnKey] = useState(0);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  const handleNPCInteraction = (npcName: string) => {
    openShop(npcName);
  };

  useEffect(() => {
    // Check URL parameter for spawn location
    const urlParams = new URLSearchParams(window.location.search);
    const spawn = urlParams.get('spawn');

    if (spawn) {
      const config = spawnConfigs.find(c => c.condition === spawn);
      if (config) {
        setSpawnPosition(config.position);
        setSpawnRotation(config.rotation);
      }
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
      setLoading(false);
    }
  }, [setSelectedCharacter, spawnConfigs]);

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

  const renderProps: LobbyRenderProps = {
    playerPosition,
    selectedCharacter,
    spawnPosition,
    spawnRotation,
    respawnKey,
    setPlayerPosition,
    setPlayerInInteractiveZone,
    handleNPCInteraction
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <HUD />
      <PauseMenu />
      <ShopMenu />

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
        <div>Player Position:</div>
        <div>X: {playerPosition.x.toFixed(2)}</div>
        <div>Y: {playerPosition.y.toFixed(2)}</div>
        <div>Z: {playerPosition.z.toFixed(2)}</div>
        <div>Rot: {playerPosition.rotation.toFixed(2)}</div>
        <div style={{ marginTop: '0.5rem', color: '#ffd700' }}>
          Press SPACE: {debugStart ? `${debugLabel} Start` : `${debugLabel} Stop`}
        </div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController
          target={playerPosition}
          distance={cameraDistance}
          height={cameraHeight}
          lobbyMode={true}
        />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {environmentOutsidePhysics}

          <Physics gravity={[0, -9.81, 0]}>
            {renderPhysicsContent(renderProps)}

            <PlayerCharacter
              key={respawnKey}
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={spawnPosition}
              spawnRotation={spawnRotation}
            />
          </Physics>
        </Suspense>
      </Canvas>

      {showInteractiveTriggerUI && (
        <InteractiveTriggerUI playerInZone={playerInInteractiveZone} />
      )}
    </div>
  );
}
