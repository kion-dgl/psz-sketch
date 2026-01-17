import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameState } from '../../stores/gameStateStore';
import { CollisionProvider } from '../../collision';
import FreePlayerCharacter from './FreePlayerCharacter';
import FixedCameraController from '../shared/FixedCameraController';
import HUD from '../ui/HUD';
import PauseMenu from '../ui/PauseMenu';
import ShopMenu from '../ui/ShopMenu';
import MarketEnvironment from './MarketEnvironment';
import ShopNPCs from './ShopNPCs';
import InvisibleWalls from './InvisibleWalls';
import AreaTriggers from './AreaTriggers';
import InteractiveTriggers, { type InteractiveTrigger } from '../shared/InteractiveTriggers';

const CITY_TRIGGERS: InteractiveTrigger[] = [
  { position: [-13.44, 1, 57.44], radius: 2, height: 3, targetArea: '/stage/underground', name: 'Enter Underground' }
];

const DEFAULT_SPAWN: [number, number, number] = [0.98, 10, 62.79];

export default function CityMarketFree() {
  const [loading, setLoading] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [playerInInteractiveZone, setPlayerInInteractiveZone] = useState<string | null>(null);
  const { openShop } = useGameState();
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  const handleNPCInteraction = (npcName: string) => {
    openShop(npcName);
  };

  // Load character
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
    } catch {
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
        <p>Loading City Market...</p>
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
      <HUD />
      <PauseMenu />
      <ShopMenu />

      {/* Controls hint */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div>WASD - Move (screen-relative)</div>
        <div>E - Interact with NPCs</div>
      </div>

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
        <div>City Market (Free Movement)</div>
        <div>X: {playerPosition.x.toFixed(2)}</div>
        <div>Y: {playerPosition.y.toFixed(2)}</div>
        <div>Z: {playerPosition.z.toFixed(2)}</div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <FixedCameraController
          target={playerPosition}
          distance={6}
          height={4}
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
          <CollisionProvider>
            <MarketEnvironment />
            <InvisibleWalls visible={false} />
            <AreaTriggers visible={false} />
            <InteractiveTriggers
              triggers={CITY_TRIGGERS}
              visible={false}
              onPlayerInZone={setPlayerInInteractiveZone}
            />
            <ShopNPCs />

            <FreePlayerCharacter
              character={selectedCharacter}
              onPositionChange={setPlayerPosition}
              onInteraction={handleNPCInteraction}
              spawnPosition={DEFAULT_SPAWN}
              spawnRotation={Math.PI}
            />
          </CollisionProvider>
        </Suspense>
      </Canvas>
    </div>
  );
}
