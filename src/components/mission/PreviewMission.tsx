import { useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import ValleyEnv, { ValleyFloorCollision } from '../valley/environments/ValleyEnv';
import SandParticles from '../valley/SandParticles';
import PlayerCharacter from '../city/PlayerCharacter';
import CameraController from '../shared/CameraController';
import StageObjects from '../shared/StageObjects';
import { useCharacterStore } from '../../stores/characterStore';
import type { GateConfig } from '../shared/StageObjects';

// Warp model paths
const START_WARP_PATH = '/objects/special_z/o0s_warps.imd/o0s_warps.glb';
const AREA_WARP_PATH = '/objects/special_z/o0s_warpm.imd/o0s_warpm.glb';

// Warp model component - follows same pattern as StageObjects
function WarpModel({ modelPath, position, rotation = 0 }: {
  modelPath: string;
  position: [number, number, number];
  rotation?: number;
}) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Stage config from valley-configs.json
interface StageGateConfig {
  edge: string;
  x: number;
  z: number;
  scale?: number;
  animated?: boolean;
}

interface StageSpawnPoint {
  position: [number, number, number];
  rotation: number;
  label: string;
}

interface StageTrigger {
  position: [number, number, number];
  rotation: number;
  label: string;
}

interface StageConfig {
  gates: StageGateConfig[];
  spawnPoints: StageSpawnPoint[];
  triggers: StageTrigger[];
}

interface MissionCell {
  pos: string;
  stage: string;
  fullStageName: string; // Full stage name with prefix (e.g., "s01a_ib1")
  connections: Record<string, string>; // original gate → neighbor pos (e.g., "north": "0,2")
  start?: boolean;
  end?: boolean;
  warp?: string; // original gate that is the warp exit (e.g., "south")
}

interface Mission {
  area: string;
  cells: MissionCell[];
  stageConfigs?: Record<string, StageConfig>;
}

const START_SPAWN = {
  position: [-2.12, 1.0, -13.55] as [number, number, number],
  rotation: 3.19,
};

interface TriggerZoneProps {
  position: [number, number, number];
  rotation: number;
  targetUrl: string;
  label: string;
}

function TriggerZone({ position, rotation, targetUrl, label }: TriggerZoneProps) {
  const handleEnter = useCallback(() => {
    console.log(`[Trigger] Entering: ${label} → ${targetUrl}`);
    window.location.href = targetUrl;
  }, [targetUrl, label]);

  return (
    <>
      <RigidBody
        type="fixed"
        sensor
        position={position}
        rotation={[0, rotation, 0]}
        collisionGroups={0x00020002}
        onIntersectionEnter={handleEnter}
      >
        <CuboidCollider args={[3, 1.5, 1]} />
      </RigidBody>
      {/* Debug visual */}
      <mesh position={position} rotation={[0, rotation, 0]}>
        <boxGeometry args={[6, 3, 2]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.3} wireframe />
      </mesh>
    </>
  );
}

export default function PreviewMission() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [currentCellPos, setCurrentCellPos] = useState<string | null>(null);
  const [spawnPosition, setSpawnPosition] = useState<[number, number, number]>([0, 1, 0]);
  const [spawnRotation, setSpawnRotation] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [respawnKey, setRespawnKey] = useState(0);
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();

  // Load character
  useEffect(() => {
    try {
      const selectedCharacterId = localStorage.getItem('selectedCharacterId');
      if (selectedCharacterId) {
        const stored = localStorage.getItem('characters') || '[]';
        const chars = JSON.parse(stored);
        const character = chars.find((c: { character_id: string } | null) => c?.character_id === selectedCharacterId);
        if (character) setSelectedCharacter(character);
      }
    } catch { /* ignore */ }
  }, [setSelectedCharacter]);

  // Load mission and handle URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('complete') === 'true') {
      setComplete(true);
      return;
    }

    try {
      const stored = localStorage.getItem('mission');
      if (!stored) {
        setError('No mission found. Go to /grid to generate one.');
        return;
      }

      const parsed = JSON.parse(stored) as Mission;
      if (!parsed.cells?.length) {
        setError('Invalid mission data.');
        return;
      }

      setMission(parsed);

      const cellParam = params.get('cell');
      const fromParam = params.get('from'); // Previous cell position (e.g., "0,2")

      if (cellParam && fromParam && parsed.stageConfigs) {
        // Transitioning from another cell
        const targetCell = parsed.cells.find(c => c.pos === cellParam);
        if (targetCell) {
          const fullStageName = `s01a_${targetCell.stage}`;
          const stageConfig = parsed.stageConfigs[fullStageName];

          if (stageConfig) {
            // Find which gate connects to the previous cell
            const entryGate = Object.entries(targetCell.connections)
              .find(([_, neighborPos]) => neighborPos === fromParam)?.[0];

            if (entryGate) {
              // Find spawn point for this gate
              const spawnPoint = stageConfig.spawnPoints.find(sp =>
                sp.label.toLowerCase().includes(entryGate)
              );

              if (spawnPoint) {
                setSpawnPosition([...spawnPoint.position]);
                setSpawnRotation(spawnPoint.rotation);
              }
            }
          }
        }
        setCurrentCellPos(cellParam);
      } else {
        // Start cell - use START_SPAWN
        const startCell = parsed.cells.find(c => c.start);
        if (startCell) {
          setCurrentCellPos(startCell.pos);
          setSpawnPosition([...START_SPAWN.position]);
          setSpawnRotation(START_SPAWN.rotation);
        } else {
          setCurrentCellPos(parsed.cells[0].pos);
        }
      }
    } catch {
      setError('Failed to parse mission data.');
    }
  }, []);

  // Kill plane
  useEffect(() => {
    if (playerPosition.y < -10) {
      console.log('[Kill Plane] Respawning at origin');
      setSpawnPosition([0, 1, 0]);
      setSpawnRotation(0);
      setRespawnKey(k => k + 1);
    }
  }, [playerPosition.y]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h1>Mission Preview</h1>
        <p style={{ color: '#ff8888' }}>{error}</p>
        <a href="/grid" style={{ padding: '12px 24px', background: '#5588ff', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>Go to Grid Generator</a>
      </div>
    );
  }

  if (!mission || !currentCellPos || !selectedCharacter) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#1e3c72', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        Loading Mission...
      </div>
    );
  }

  if (complete) {
    return (
      <div style={{ minHeight: '100vh', background: '#1e5c32', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h1>Mission Complete!</h1>
        <a href="/grid" style={{ padding: '12px 24px', background: '#5588ff', color: 'white', textDecoration: 'none', borderRadius: '8px' }}>Back to Grid</a>
      </div>
    );
  }

  const currentCell = mission.cells.find(c => c.pos === currentCellPos);
  if (!currentCell) return null;

  // Use fullStageName from the cell (preserves original prefix like s01a_, s01b_, etc.)
  const fullStageName = currentCell.fullStageName || `s01a_${currentCell.stage}`;
  const stageConfig = mission.stageConfigs?.[fullStageName];

  // Build gates and triggers from stage config - NO ROTATION
  const gates: GateConfig[] = [];
  const triggers: TriggerZoneProps[] = [];
  let areaWarpPosition: [number, number, number] | null = null;
  let areaWarpRotation = 0;
  let startWarpPosition: [number, number, number] | null = null;

  if (stageConfig) {
    // For start cell, use the spawn position for the StartWarp
    if (currentCell.start) {
      // Use the player's spawn position for the StartWarp
      startWarpPosition = [spawnPosition[0], 0, spawnPosition[2]];
    }

    // Add all gates from stage config
    for (const gateConfig of stageConfig.gates) {
      const isWarpExit = currentCell.end && currentCell.warp === gateConfig.edge;

      if (isWarpExit) {
        // Don't add a gate for the warp exit - we'll render AreaWarp instead
        // Calculate position based on edge direction
        const edgeRotations: Record<string, number> = {
          north: 0,
          south: Math.PI,
          east: Math.PI / 2,
          west: -Math.PI / 2,
        };
        // Use Y=0 so the warp sits on the ground (model has its own height)
        areaWarpPosition = [gateConfig.x, 0, gateConfig.z];
        areaWarpRotation = edgeRotations[gateConfig.edge] || 0;
      } else {
        gates.push({
          edge: gateConfig.edge as 'north' | 'south' | 'east' | 'west',
          x: gateConfig.x,
          z: gateConfig.z,
          scale: gateConfig.scale || 1,
          animated: gateConfig.animated ?? true,
          blocked: false,
        });
      }

      // Find trigger for this gate
      const triggerConfig = stageConfig.triggers.find(t =>
        t.label.toLowerCase().includes(gateConfig.edge)
      );

      if (triggerConfig) {
        const neighborPos = currentCell.connections[gateConfig.edge];

        if (isWarpExit) {
          // This is the warp exit
          triggers.push({
            position: [...triggerConfig.position],
            rotation: triggerConfig.rotation,
            targetUrl: '/preview-mission?complete=true',
            label: 'Warp Exit',
          });
        } else if (neighborPos) {
          // This gate connects to a neighbor
          triggers.push({
            position: [...triggerConfig.position],
            rotation: triggerConfig.rotation,
            targetUrl: `/preview-mission?cell=${neighborPos}&from=${currentCell.pos}`,
            label: `To ${neighborPos}`,
          });
        }
      }
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Debug HUD */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 1000, fontFamily: 'monospace', fontSize: '12px' }}>
        <div>Cell: {currentCellPos}</div>
        <div>Stage: {currentCell.stage}</div>
        <div>Connections: {JSON.stringify(currentCell.connections)}</div>
        <div>X: {playerPosition.x.toFixed(2)} Y: {playerPosition.y.toFixed(2)} Z: {playerPosition.z.toFixed(2)}</div>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify({
            cell: currentCellPos,
            stage: currentCell.stage,
            connections: currentCell.connections,
            position: playerPosition
          }, null, 2))}
          style={{ marginTop: '0.5rem', padding: '4px 8px', cursor: 'pointer' }}
        >
          Copy Stats
        </button>
      </div>

      {/* Mission HUD */}
      <div style={{ position: 'fixed', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 1000, fontSize: '14px' }}>
        <div style={{ fontWeight: 600, color: '#88aaff' }}>Mission Preview</div>
        {currentCell.start && <div style={{ color: '#66aaff' }}>START</div>}
        {currentCell.end && <div style={{ color: '#ffaa66' }}>END - Find the warp!</div>}
      </div>

      <a href="/grid" style={{ position: 'fixed', bottom: '1rem', left: '1rem', padding: '8px 16px', background: 'rgba(0,0,0,0.8)', color: '#88aaff', textDecoration: 'none', borderRadius: '6px', zIndex: 1000 }}>← Back to Grid</a>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} />
        <CameraController target={playerPosition} distance={6} height={3} lobbyMode={false} />

        <fog attach="fog" args={['#87ceeb', 50, 200]} />
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={0.8} color="#fffaf0" castShadow />

        {/* Environment - NO ROTATION */}
        <ValleyEnv mapId={fullStageName} />

        <SandParticles intensity="light" />

        <Physics gravity={[0, -9.81, 0]}>
          {/* Floor collision - NO ROTATION */}
          <ValleyFloorCollision mapId={fullStageName} />

          {/* Gates */}
          <StageObjects gates={gates} />

          {/* Start Warp - only on start cell, positioned at spawn point */}
          {startWarpPosition && (
            <WarpModel
              modelPath={START_WARP_PATH}
              position={startWarpPosition}
            />
          )}

          {/* Area Warp - only on end cell at warp exit gate position */}
          {areaWarpPosition && (
            <WarpModel
              modelPath={AREA_WARP_PATH}
              position={areaWarpPosition}
              rotation={areaWarpRotation}
            />
          )}

          {/* Triggers */}
          {triggers.map((t, i) => (
            <TriggerZone key={i} {...t} />
          ))}

          <PlayerCharacter
            key={respawnKey}
            character={selectedCharacter}
            onPositionChange={setPlayerPosition}
            spawnPosition={spawnPosition}
            spawnRotation={spawnRotation + Math.PI}
          />
        </Physics>
      </Canvas>
    </div>
  );
}
