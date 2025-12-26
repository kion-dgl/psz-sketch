import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, useEffect, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import UndergroundEnvironment, { UndergroundGroundPlane, DebugGroundPlane } from './UndergroundEnvironment';
import PlayerCharacter from '../city/PlayerCharacter';
import UndergroundNPCs from './UndergroundNPCs';
import UndergroundWalls from './UndergroundWalls';
import UndergroundTriggers from './UndergroundTriggers';
import InteractiveTriggers, { InteractiveTriggerUI, type InteractiveTrigger } from '../shared/InteractiveTriggers';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';

const UNDERGROUND_TRIGGERS: InteractiveTrigger[] = [
  { position: [0.04, 1, -3.91], radius: 2, height: 3, targetArea: '/stage/city', name: 'Exit to City' }
];

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

export default function UndergroundArea() {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [debugStart, setDebugStart] = useState(true);
  const [playerInInteractiveZone, setPlayerInInteractiveZone] = useState<string | null>(null);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

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
      {/* HUD - Character stats */}
      <HUD />

      {/* Pause Menu - Equipment */}
      <PauseMenu />

      {/* Shop Menu - NPC interactions */}
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
          Press SPACE: {debugStart ? 'Debug Start' : 'Debug Stop'}
        </div>
      </div>

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
          {/* Underground Environment - OUTSIDE Physics to prevent auto-collision */}
          <UndergroundEnvironment />

          <Physics gravity={[0, -9.81, 0]}>
            {/* Debug ground plane at Y=0 */}
            <DebugGroundPlane />

            {/* Ground plane - disabled until collision hull exists */}
            {/* <UndergroundGroundPlane /> */}

            {/* Underground Walls */}
            <UndergroundWalls visible={true} />

            {/* Area Triggers */}
            <UndergroundTriggers visible={false} />

            {/* Interactive Triggers (require 'e' key) */}
            <InteractiveTriggers triggers={UNDERGROUND_TRIGGERS} visible={true} onPlayerInZone={setPlayerInInteractiveZone} />

            {/* Underground NPCs */}
            <UndergroundNPCs />

            {/* Player Character */}
            <PlayerCharacter
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={[0, 10, 0]}
            />
          </Physics>
        </Suspense>
      </Canvas>

      {/* Interactive trigger UI prompt */}
      <InteractiveTriggerUI playerInZone={playerInInteractiveZone} />
    </div>
  );
}
