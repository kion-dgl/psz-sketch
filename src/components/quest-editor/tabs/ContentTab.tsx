/**
 * ContentTab — 3D cell preview with key/gate placement
 *
 * Left: Mini grid for cell selection
 * Center: 3D StageCanvas showing the selected cell's GLB
 * Right: Cell content inspector (key position, gate info)
 */

import { useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { QuestProject, Direction } from '../types';
import { ROLE_COLORS } from '../types';
import { getRotatedGates, getStageConfig, getStageSuffix } from '../hooks/useStageConfigs';
import { getGlbPath, getAreaFromMapId } from '../../stage-editor/constants';
import type { GateConfig } from '../../../systems/stage/types';

// ============================================================================
// Types
// ============================================================================

interface ContentTabProps {
  project: QuestProject;
  onUpdateProject: (updater: (prev: QuestProject) => QuestProject) => void;
}

// ============================================================================
// 3D Marker components
// ============================================================================

/** Gate marker — cyan wireframe box at gate position */
function GateMarker({ gate, isLocked }: { gate: GateConfig; isLocked: boolean }) {
  const boxWidth = 6;
  const boxHeight = 4;
  const boxDepth = 1;
  const color = isLocked ? '#ff66ff' : '#00ffff';

  // Rotation based on gate edge
  const rotation = gate.edge === 'north' ? Math.PI
    : gate.edge === 'south' ? 0
    : gate.edge === 'east' ? Math.PI / 2
    : -Math.PI / 2;

  return (
    <group position={[gate.x, 0, gate.z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, boxHeight / 2, 0]}>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      <lineSegments position={[0, boxHeight / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
      {/* Label */}
      <mesh position={[0, boxHeight + 0.5, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Key marker — pink sphere that shows authored key position */
function KeyMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial color="#ff66aa" transparent opacity={0.8} />
      </mesh>
      {/* Ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.05, 0]}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshBasicMaterial color="#ff66aa" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
      {/* Vertical line to ground */}
      <mesh position={[0, -position[1] / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, position[1], 8]} />
        <meshBasicMaterial color="#ff66aa" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/** Spawn point marker — green sphere with arrow */
function SpawnMarker({ position, edge }: { position: [number, number, number]; edge: string }) {
  const rotation = edge === 'north' ? Math.PI
    : edge === 'south' ? 0
    : edge === 'east' ? Math.PI / 2
    : -Math.PI / 2;

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
      </mesh>
      {/* Direction arrow */}
      <group rotation={[0, rotation, 0]}>
        <mesh position={[0, 0.3, 1]}>
          <boxGeometry args={[0.15, 0.15, 1.0]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.3, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.5, 8]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Placement cursor — follows mouse, shows where key will be placed */
function KeyPlacementCursor() {
  const { camera, raycaster, pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -1), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!groupRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      groupRef.current.position.set(intersection.x, 1, intersection.z);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial color="#ff66aa" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1 + 0.05, 0]}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshBasicMaterial color="#ff66aa" side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/** Ground click handler — invisible plane for click-to-place */
function GroundClickPlane({ onPlace }: { onPlace: (pos: [number, number, number]) => void }) {
  const { camera, raycaster, pointer } = useThree();
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -1), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  const handleClick = useCallback(() => {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      onPlace([
        Math.round(intersection.x * 10) / 10,
        1,
        Math.round(intersection.z * 10) / 10,
      ]);
    }
  }, [raycaster, pointer, camera, groundPlane, intersection, onPlace]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Stage model loader */
function StageModel({ mapId }: { mapId: string }) {
  const areaKey = getAreaFromMapId(mapId) || 'valley';
  const glbPath = getGlbPath(areaKey, mapId);
  const { scene } = useGLTF(glbPath);
  return <primitive object={scene} />;
}

// ============================================================================
// Mini Grid (compact version for left panel)
// ============================================================================

function MiniGrid({
  project,
  selectedCell,
  onCellSelect,
}: {
  project: QuestProject;
  selectedCell: string | null;
  onCellSelect: (pos: string) => void;
}) {
  const CELL_SIZE = 48;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1px',
      background: '#111',
      padding: '4px',
      borderRadius: '6px',
    }}>
      {Array.from({ length: project.gridSize }, (_, row) => (
        <div key={row} style={{ display: 'flex', gap: '1px' }}>
          {Array.from({ length: project.gridSize }, (_, col) => {
            const pos = `${row},${col}`;
            const cell = project.cells[pos];
            const isSelected = selectedCell === pos;
            const isStart = project.startPos === pos;
            const isEnd = project.endPos === pos;
            const hasKey = Object.values(project.keyLinks).includes(pos);
            const isKeyGate = pos in project.keyLinks;
            const hasKeyPosition = cell?.keyPosition != null;

            if (!cell) {
              return (
                <div key={col} style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: '#1a1a2e',
                  border: '1px solid #222',
                }} />
              );
            }

            return (
              <div
                key={col}
                onClick={() => onCellSelect(pos)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: isSelected ? '#3a3a6a' : '#2a2a4a',
                  border: `2px solid ${isSelected ? '#88aaff' : ROLE_COLORS[cell.role]}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  fontSize: '9px',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {getStageSuffix(cell.stageName)}
                {/* Badges */}
                {isStart && <div style={{ position: 'absolute', top: 1, left: 1, width: 6, height: 6, background: '#66aaff', borderRadius: '50%' }} />}
                {isEnd && <div style={{ position: 'absolute', top: 1, left: 1, width: 6, height: 6, background: '#ffaa66', borderRadius: '50%' }} />}
                {hasKey && <div style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, background: hasKeyPosition ? '#88ff88' : '#ff66aa', borderRadius: '50%' }} />}
                {isKeyGate && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 6, height: 6, background: '#ff66ff', borderRadius: 1 }} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Cell Content Inspector (right panel)
// ============================================================================

function CellContentInspector({
  project,
  selectedCell,
  placingKey,
  onTogglePlaceKey,
  onClearKeyPosition,
  onSetKeyPosition,
}: {
  project: QuestProject;
  selectedCell: string;
  placingKey: boolean;
  onTogglePlaceKey: () => void;
  onClearKeyPosition: () => void;
  onSetKeyPosition: (pos: [number, number, number]) => void;
}) {
  const cell = project.cells[selectedCell];
  if (!cell) {
    return (
      <div style={{ padding: '1rem', color: '#888' }}>
        <div style={labelStyle}>Empty Cell</div>
        <p style={{ fontSize: '13px' }}>Select an occupied cell from the grid.</p>
      </div>
    );
  }

  const config = getStageConfig(cell.stageName);
  const gates = getRotatedGates(cell.stageName, cell.rotation ?? 0);
  const isStart = project.startPos === selectedCell;
  const isEnd = project.endPos === selectedCell;
  const hasKey = Object.values(project.keyLinks).includes(selectedCell);
  const isKeyGate = selectedCell in project.keyLinks;
  const keyPos = cell.keyPosition;

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={sectionStyle}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
          {getStageSuffix(cell.stageName)}
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>
          {cell.stageName} at {selectedCell}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {isStart && <span style={badgeStyle('#66aaff')}>START</span>}
          {isEnd && <span style={badgeStyle('#ffaa66')}>END</span>}
          {hasKey && <span style={badgeStyle('#ff66aa')}>KEY</span>}
          {isKeyGate && <span style={badgeStyle('#ff66ff')}>GATE</span>}
          <span style={badgeStyle(ROLE_COLORS[cell.role])}>{cell.role.toUpperCase()}</span>
        </div>
      </div>

      {/* Gate info */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Gates ({gates.size})</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['north', 'south', 'east', 'west'] as Direction[]).map(dir => {
            const hasGate = gates.has(dir);
            const isLocked = cell.lockedGate === dir;
            return (
              <div key={dir} style={{
                padding: '3px 8px',
                background: isLocked ? '#ff66ff33' : hasGate ? '#00ffff22' : '#222',
                border: `1px solid ${isLocked ? '#ff66ff' : hasGate ? '#00ffff' : '#333'}`,
                borderRadius: '4px',
                fontSize: '10px',
                color: isLocked ? '#ff66ff' : hasGate ? '#00ffff' : '#555',
                fontWeight: 600,
              }}>
                {dir[0].toUpperCase()}
                {isLocked && ' locked'}
              </div>
            );
          })}
        </div>
        {config && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            Grid: {config.gridSize} | Offset: [{config.gridOffset.join(', ')}]
          </div>
        )}
      </div>

      {/* Key placement */}
      {hasKey && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Key Position</div>
          {keyPos ? (
            <>
              <div style={{
                padding: '8px',
                background: '#88ff8822',
                border: '1px solid #88ff88',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#88ff88',
                fontFamily: 'monospace',
                marginBottom: '8px',
              }}>
                [{keyPos[0]}, {keyPos[1]}, {keyPos[2]}]
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={onTogglePlaceKey}
                  style={{
                    ...btnStyle,
                    background: placingKey ? '#ff66aa' : '#555588',
                  }}
                >
                  {placingKey ? 'Placing...' : 'Reposition'}
                </button>
                <button
                  onClick={onClearKeyPosition}
                  style={{ ...btnStyle, background: '#884444' }}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: '#ff8888', marginBottom: '8px' }}>
                No position set. Click the 3D view to place the key.
              </div>
              <button
                onClick={onTogglePlaceKey}
                style={{
                  ...btnStyle,
                  background: placingKey ? '#ff66aa' : '#448844',
                  width: '100%',
                }}
              >
                {placingKey ? 'Click 3D view to place...' : 'Place Key'}
              </button>
            </>
          )}
          <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
            Unlocks: {Object.entries(project.keyLinks).find(([_, v]) => v === selectedCell)?.[0] || 'unlinked'}
          </div>
        </div>
      )}

      {/* Key-gate info */}
      {isKeyGate && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Key-Gate</div>
          <div style={{ fontSize: '12px', color: '#cc88ff' }}>
            Locked gate: {cell.lockedGate || 'not set'}
          </div>
          <div style={{ fontSize: '12px', color: '#cc88ff', marginTop: '2px' }}>
            Key at: {project.keyLinks[selectedCell] || 'unlinked'}
          </div>
        </div>
      )}

      {/* Spawn points from config */}
      {config && config.spawnPoints.length > 0 && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Spawn Points</div>
          {config.spawnPoints.map((sp, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#88ff88', fontFamily: 'monospace', marginBottom: '2px' }}>
              {sp.label}: [{sp.position.map(v => v.toFixed(0)).join(', ')}]
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {cell.notes && (
        <div style={sectionStyle}>
          <div style={labelStyle}>Notes</div>
          <div style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>
            {cell.notes}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '11px',
  cursor: 'pointer',
};

function badgeStyle(color: string): React.CSSProperties {
  return {
    padding: '2px 6px',
    background: color + '33',
    border: `1px solid ${color}`,
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: 700,
    color,
  };
}

// ============================================================================
// Main ContentTab
// ============================================================================

export default function ContentTab({ project, onUpdateProject }: ContentTabProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [placingKey, setPlacingKey] = useState(false);

  const cell = selectedCell ? project.cells[selectedCell] : null;
  const config = cell ? getStageConfig(cell.stageName) : null;
  const hasKey = selectedCell ? Object.values(project.keyLinks).includes(selectedCell) : false;

  const handlePlaceKey = useCallback((pos: [number, number, number]) => {
    if (!selectedCell) return;
    onUpdateProject(prev => ({
      ...prev,
      cells: {
        ...prev.cells,
        [selectedCell]: { ...prev.cells[selectedCell], keyPosition: pos },
      },
    }));
    setPlacingKey(false);
  }, [selectedCell, onUpdateProject]);

  const handleClearKeyPosition = useCallback(() => {
    if (!selectedCell) return;
    onUpdateProject(prev => {
      const updated = { ...prev.cells[selectedCell] };
      delete updated.keyPosition;
      return {
        ...prev,
        cells: { ...prev.cells, [selectedCell]: updated },
      };
    });
  }, [selectedCell, onUpdateProject]);

  const handleTogglePlaceKey = useCallback(() => {
    setPlacingKey(p => !p);
  }, []);

  // Select first cell with a key if none selected
  const handleCellSelect = useCallback((pos: string) => {
    setSelectedCell(pos);
    setPlacingKey(false);
  }, []);

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left panel — Mini grid */}
      <div style={{
        width: '260px',
        borderRight: '1px solid #333',
        background: '#151525',
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Cell
        </div>
        <MiniGrid
          project={project}
          selectedCell={selectedCell}
          onCellSelect={handleCellSelect}
        />
        <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, background: '#ff66aa', borderRadius: '50%', marginRight: 4 }} />Key (no position)</div>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, background: '#88ff88', borderRadius: '50%', marginRight: 4 }} />Key (placed)</div>
          <div><span style={{ display: 'inline-block', width: 8, height: 8, background: '#ff66ff', borderRadius: 1, marginRight: 4 }} />Key-Gate</div>
        </div>
      </div>

      {/* Center — 3D preview */}
      <div style={{ flex: 1, position: 'relative', background: '#1a1a2e' }}>
        {cell ? (
          <>
            <Canvas
              camera={{ position: [0, 40, 40], fov: 50 }}
            >
              <color attach="background" args={['#1a1a2e']} />
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 20, 10]} intensity={0.8} />

              <Suspense fallback={null}>
                <StageModel mapId={cell.stageName} />
              </Suspense>

              {/* Ground grid */}
              <Grid
                args={[100, 100]}
                position={[0, 0.01, 0]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#333"
                sectionSize={10}
                sectionThickness={1}
                sectionColor="#555"
                fadeDistance={100}
                fadeStrength={1}
              />

              {/* Gate markers */}
              {config?.gates.map((gate, i) => (
                <GateMarker
                  key={i}
                  gate={gate}
                  isLocked={cell.lockedGate === gate.edge}
                />
              ))}

              {/* Spawn points */}
              {config?.spawnPoints.map((sp, i) => (
                <SpawnMarker
                  key={i}
                  position={sp.position}
                  edge={config.gates[i]?.edge || 'north'}
                />
              ))}

              {/* Key marker (if this cell has a key with authored position) */}
              {hasKey && cell.keyPosition && !placingKey && (
                <KeyMarker position={cell.keyPosition} />
              )}

              {/* Key placement mode */}
              {placingKey && (
                <>
                  <KeyPlacementCursor />
                  <GroundClickPlane onPlace={handlePlaceKey} />
                </>
              )}

              <OrbitControls makeDefault />
            </Canvas>

            {/* Overlay info */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(0,0,0,0.7)', padding: '8px 12px',
              borderRadius: '6px', fontSize: '12px', color: '#fff',
            }}>
              {cell.stageName}
              {(cell.rotation ?? 0) !== 0 && ` (rotated ${cell.rotation}deg)`}
            </div>

            {placingKey && (
              <div style={{
                position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                background: '#ff66aa', padding: '8px 20px',
                borderRadius: '20px', fontSize: '13px', color: '#fff', fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => setPlacingKey(false)}
              >
                Click in 3D view to place key | ESC to cancel
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#666', fontSize: '14px',
            flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '32px', opacity: 0.3 }}>3D</div>
            <div>Select a cell to preview its stage</div>
          </div>
        )}
      </div>

      {/* Right panel — Inspector */}
      <div style={{
        width: '260px',
        borderLeft: '1px solid #333',
        background: '#151525',
        overflowY: 'auto',
      }}>
        {selectedCell ? (
          <CellContentInspector
            project={project}
            selectedCell={selectedCell}
            placingKey={placingKey}
            onTogglePlaceKey={handleTogglePlaceKey}
            onClearKeyPosition={handleClearKeyPosition}
            onSetKeyPosition={handlePlaceKey}
          />
        ) : (
          <div style={{ padding: '1rem', color: '#888', fontSize: '13px' }}>
            Select a cell from the grid to inspect and edit its content.
          </div>
        )}
      </div>
    </div>
  );
}

