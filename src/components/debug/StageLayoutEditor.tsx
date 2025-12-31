import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

type GateEdge = 'north' | 'south' | 'east' | 'west';

interface GateData {
  id: string;
  edge: GateEdge;
  x: number;
  z: number;
  scale: number;
  label: string;
}

type BoxType = 'o01_cont' | 'o0c_recont';

interface BoxData {
  id: string;
  x: number;
  z: number;
  label: string;
  boxType: BoxType;
}

interface StageLayout {
  gridSize: number;
  gates: GateData[];
  boxes: BoxData[];
}

const STORAGE_KEY = 'stage-layout-configs';

const VALLEY_A_MAPS = [
  's01a_ga1', 's01a_ib1', 's01a_ib2', 's01a_ic1', 's01a_ic3',
  's01a_lb1', 's01a_lb3', 's01a_lc1', 's01a_lc2', 's01a_na1',
  's01a_nb2', 's01a_nc2', 's01a_sa1', 's01a_tb3', 's01a_tc3',
  's01a_td1', 's01a_td2', 's01a_xb2'
];

const VALLEY_B_MAPS = [
  's01b_ga1', 's01b_ib1', 's01b_ib2', 's01b_ic1', 's01b_ic3',
  's01b_lb1', 's01b_lb3', 's01b_lc1', 's01b_lc2', 's01b_na1',
  's01b_nb2', 's01b_nc2', 's01b_sa1', 's01b_tb3', 's01b_tc3',
  's01b_td1', 's01b_td2', 's01b_xb2'
];

const VALLEY_E_MAPS = ['s01e_ia1'];
const VALLEY_Z_MAPS = ['s01z_na1'];
const ALL_MAPS = [...VALLEY_A_MAPS, ...VALLEY_B_MAPS, ...VALLEY_E_MAPS, ...VALLEY_Z_MAPS];

function getValleyDir(mapId: string): string {
  const match = mapId.match(/^s01([a-z])_/);
  return match ? `stages/valley_${match[1]}` : 'stages/valley_a';
}

function loadAllConfigs(): Record<string, StageLayout> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const configs = JSON.parse(stored);
    // Migrate old format (worldPosition) to new format (x, z)
    for (const key of Object.keys(configs)) {
      const config = configs[key];
      if (config.gates) {
        config.gates = config.gates.map((g: any) => ({
          ...g,
          x: g.x ?? g.worldPosition?.[0] ?? 0,
          z: g.z ?? g.worldPosition?.[1] ?? 0,
        }));
      }
      if (config.boxes) {
        config.boxes = config.boxes.map((b: any) => ({
          ...b,
          x: b.x ?? b.position?.[0] ?? 0,
          z: b.z ?? b.position?.[1] ?? 0,
        }));
      }
    }
    return configs;
  } catch {
    return {};
  }
}

function saveAllConfigs(configs: Record<string, StageLayout>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

const GATE_MODEL_PATH = '/objects/01_o01a/o0c_gate.imd/o0c_gate.glb';
const BOX_MODEL_PATHS: Record<BoxType, string> = {
  'o01_cont': '/objects/01_o01a/o01_cont.imd/o01_cont.glb',
  'o0c_recont': '/objects/01_o01z/o0c_recont.imd/o0c_recont.glb',
};

function getGateRotation(edge: GateEdge): number {
  switch (edge) {
    case 'north': return Math.PI;
    case 'south': return 0;
    case 'east': return -Math.PI / 2;
    case 'west': return Math.PI / 2;
  }
}

// Gate model using useLoader for reliable loading
function GateObject({
  x,
  z,
  edge,
  scale,
  selected,
  isPreview,
  onClick
}: {
  x: number;
  z: number;
  edge: GateEdge;
  scale: number;
  selected: boolean;
  isPreview?: boolean;
  onClick?: () => void;
}) {
  const gltf = useLoader(GLTFLoader, GATE_MODEL_PATH);
  const rotation = getGateRotation(edge);

  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const color = isPreview ? 0x00ff00 : (selected ? 0x00ffff : 0xcccccc);
        const opacity = isPreview ? 0.7 : (selected ? 0.9 : 0.8);
        mesh.material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
        });
      }
    });
    return clone;
  }, [gltf, selected, isPreview]);

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, rotation, 0]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
    >
      <primitive object={clonedScene} scale={[scale, scale, scale]} />
      {/* Bounding box wireframe */}
      <mesh position={[0, scale, 0]}>
        <boxGeometry args={[scale * 2.5, scale * 2, scale * 0.5]} />
        <meshBasicMaterial
          color={isPreview ? '#00ff00' : (selected ? '#00ffff' : '#888888')}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

// Box model using useLoader
function BoxObject({
  x,
  z,
  boxType,
  selected,
  onClick
}: {
  x: number;
  z: number;
  boxType: BoxType;
  selected: boolean;
  onClick?: () => void;
}) {
  const gltf = useLoader(GLTFLoader, BOX_MODEL_PATHS[boxType]);

  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: selected ? 0xff00ff : 0xff6600,
          transparent: true,
          opacity: selected ? 0.9 : 0.7,
        });
      }
    });
    return clone;
  }, [gltf, selected]);

  return (
    <group
      position={[x, 0, z]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
    >
      <primitive object={clonedScene} />
      {/* Bounding box */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.2, 1.5, 1.2]} />
        <meshBasicMaterial color={selected ? '#ff00ff' : '#ff6600'} wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function SquareGrid({ size, offset }: { size: number; offset: [number, number] }) {
  const halfSize = size / 2;
  const lines: React.ReactNode[] = [];

  for (let i = -halfSize; i <= halfSize; i++) {
    const isEdge = Math.abs(i) === halfSize;
    const color = isEdge ? '#ffff00' : (i === 0 ? '#666666' : '#333333');

    const hPositions = new Float32Array([
      offset[0] - halfSize, 0.15, offset[1] + i,
      offset[0] + halfSize, 0.15, offset[1] + i
    ]);
    lines.push(
      <line key={`h${i}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[hPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
    );

    const vPositions = new Float32Array([
      offset[0] + i, 0.15, offset[1] - halfSize,
      offset[0] + i, 0.15, offset[1] + halfSize
    ]);
    lines.push(
      <line key={`v${i}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[vPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
    );
  }

  return <group>{lines}</group>;
}

function StageModel({ selectedMap, showStage }: { selectedMap: string; showStage: boolean }) {
  const valleyDir = getValleyDir(selectedMap);
  const glbPath = `/${valleyDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

  const gltf = useLoader(GLTFLoader, glbPath);

  if (!showStage) return null;

  return <primitive object={gltf.scene.clone()} />;
}

function GroundPlane({
  active,
  onClick
}: {
  active: boolean;
  onClick: (x: number, z: number) => void;
}) {
  const handleClick = (event: any) => {
    if (!active) return;
    event.stopPropagation();
    const point = event.point;
    if (point) {
      const snappedX = Math.round(point.x * 2) / 2;
      const snappedZ = Math.round(point.z * 2) / 2;
      onClick(snappedX, snappedZ);
    }
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={handleClick}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color={active ? '#003300' : '#111111'}
        transparent
        opacity={active ? 0.2 : 0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Calculate world position for gate preview
function getPreviewPosition(edge: GateEdge, offset: number, gridSize: number, gridOffset: [number, number]): [number, number] {
  const halfSize = gridSize / 2;
  switch (edge) {
    case 'north': return [gridOffset[0] + offset, gridOffset[1] - halfSize];
    case 'south': return [gridOffset[0] + offset, gridOffset[1] + halfSize];
    case 'east': return [gridOffset[0] + halfSize, gridOffset[1] + offset];
    case 'west': return [gridOffset[0] - halfSize, gridOffset[1] + offset];
  }
}

function Scene({
  selectedMap,
  gridSize,
  gridOffset,
  gates,
  boxes,
  selectedGate,
  selectedBox,
  onSelectGate,
  onSelectBox,
  onAddBox,
  onAddGate,
  placementMode,
  showStage,
  showGrid,
  previewGate
}: {
  selectedMap: string;
  gridSize: number;
  gridOffset: [number, number];
  gates: GateData[];
  boxes: BoxData[];
  selectedGate: string | null;
  selectedBox: string | null;
  onSelectGate: (id: string | null) => void;
  onSelectBox: (id: string | null) => void;
  onAddBox: (x: number, z: number) => void;
  onAddGate: () => void;
  placementMode: 'gate' | 'box' | 'select';
  showStage: boolean;
  showGrid: boolean;
  previewGate: { edge: GateEdge; offset: number; scale: number } | null;
}) {
  const previewPos = previewGate
    ? getPreviewPosition(previewGate.edge, previewGate.offset, gridSize, gridOffset)
    : null;

  return (
    <>
      <Suspense fallback={null}>
        <StageModel selectedMap={selectedMap} showStage={showStage} />
      </Suspense>

      {showGrid && <SquareGrid size={gridSize} offset={gridOffset} />}

      <GroundPlane active={placementMode === 'box'} onClick={onAddBox} />

      {/* Gate Preview */}
      {placementMode === 'gate' && previewGate && previewPos && (
        <Suspense fallback={null}>
          <GateObject
            x={previewPos[0]}
            z={previewPos[1]}
            edge={previewGate.edge}
            scale={previewGate.scale}
            selected={false}
            isPreview={true}
            onClick={onAddGate}
          />
        </Suspense>
      )}

      {/* Placed Gates */}
      {gates.map((gate) => (
        <Suspense key={gate.id} fallback={null}>
          <GateObject
            x={gate.x}
            z={gate.z}
            edge={gate.edge}
            scale={gate.scale}
            selected={selectedGate === gate.id}
            onClick={() => onSelectGate(gate.id)}
          />
        </Suspense>
      ))}

      {/* Placed Boxes */}
      {boxes.map((box) => (
        <Suspense key={box.id} fallback={null}>
          <BoxObject
            x={box.x}
            z={box.z}
            boxType={box.boxType}
            selected={selectedBox === box.id}
            onClick={() => onSelectBox(box.id)}
          />
        </Suspense>
      ))}

      {/* Origin marker */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </>
  );
}

// Styles
const panelStyle: React.CSSProperties = {
  background: '#1a1a1a',
  color: 'white',
  padding: '15px',
  fontFamily: 'monospace',
  fontSize: '13px',
  overflowY: 'auto',
  borderRight: '2px solid #333',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  background: '#333',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#333',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'monospace',
};

export default function StageLayoutEditor() {
  const [selectedMap, setSelectedMap] = useState('s01a_ga1');
  const [gridSize, setGridSize] = useState(10);
  const [gridOffset, setGridOffset] = useState<[number, number]>([0, 0]);
  const [gates, setGates] = useState<GateData[]>([]);
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<'gate' | 'box' | 'select'>('select');
  const [allConfigs, setAllConfigs] = useState<Record<string, StageLayout>>({});
  const [showStage, setShowStage] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const [newGateEdge, setNewGateEdge] = useState<GateEdge>('north');
  const [newGateOffset, setNewGateOffset] = useState(0);
  const [newGateScale, setNewGateScale] = useState(2.5);
  const [newBoxType, setNewBoxType] = useState<BoxType>('o01_cont');

  useEffect(() => {
    setAllConfigs(loadAllConfigs());
  }, []);

  useEffect(() => {
    const configs = loadAllConfigs();
    if (configs[selectedMap]) {
      const config = configs[selectedMap];
      setGridSize(config.gridSize);
      setGates(config.gates);
      setBoxes(config.boxes);
    } else {
      setGridSize(10);
      setGates([]);
      setBoxes([]);
    }
    setSelectedGate(null);
    setSelectedBox(null);
  }, [selectedMap]);

  useEffect(() => {
    const configs = loadAllConfigs();
    if (gates.length > 0 || boxes.length > 0 || gridSize !== 10) {
      configs[selectedMap] = { gridSize, gates, boxes };
    } else {
      delete configs[selectedMap];
    }
    saveAllConfigs(configs);
    setAllConfigs(configs);
  }, [gates, boxes, gridSize, selectedMap]);

  const handleAddGate = () => {
    const [x, z] = getPreviewPosition(newGateEdge, newGateOffset, gridSize, gridOffset);
    const newGate: GateData = {
      id: `gate_${Date.now()}`,
      edge: newGateEdge,
      x,
      z,
      scale: newGateScale,
      label: `Gate ${gates.length + 1}`
    };
    setGates(prev => [...prev, newGate]);
    setSelectedGate(newGate.id);
  };

  const handleAddBox = (x: number, z: number) => {
    const newBox: BoxData = {
      id: `box_${Date.now()}`,
      x,
      z,
      label: `${newBoxType} ${boxes.length + 1}`,
      boxType: newBoxType
    };
    setBoxes(prev => [...prev, newBox]);
    setSelectedBox(newBox.id);
  };

  const handleRemoveGate = (id: string) => {
    setGates(prev => prev.filter(g => g.id !== id));
    if (selectedGate === id) setSelectedGate(null);
  };

  const handleRemoveBox = (id: string) => {
    setBoxes(prev => prev.filter(b => b.id !== id));
    if (selectedBox === id) setSelectedBox(null);
  };

  const handleUpdateGate = (id: string, updates: Partial<GateData>) => {
    setGates(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleUpdateBox = (id: string, updates: Partial<BoxData>) => {
    setBoxes(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleClearMap = () => {
    if (confirm(`Clear all layout data for ${selectedMap}?`)) {
      setGates([]);
      setBoxes([]);
      setGridSize(10);
    }
  };

  const handleCopyJSON = () => {
    const config = {
      gridSize,
      gates: gates.map(g => ({
        edge: g.edge,
        x: g.x,
        z: g.z,
        scale: g.scale,
        label: g.label
      })),
      boxes: boxes.map(b => ({
        x: b.x,
        z: b.z,
        boxType: b.boxType,
        label: b.label
      }))
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert('Copied to clipboard!');
  };

  const handleExportAll = () => {
    const configs = loadAllConfigs();
    const output: Record<string, any> = {};
    for (const [mapId, config] of Object.entries(configs)) {
      output[mapId] = {
        gridSize: config.gridSize,
        gates: config.gates.map(g => ({ edge: g.edge, x: g.x, z: g.z, scale: g.scale, label: g.label })),
        boxes: config.boxes.map(b => ({ x: b.x, z: b.z, boxType: b.boxType, label: b.label }))
      };
    }
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    alert(`Exported ${Object.keys(configs).length} stages to clipboard!`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedGate) handleRemoveGate(selectedGate);
      if (selectedBox) handleRemoveBox(selectedBox);
    }
  };

  const selectedGateData = gates.find(g => g.id === selectedGate);
  const selectedBoxData = boxes.find(b => b.id === selectedBox);
  const hasCurrentConfig = !!allConfigs[selectedMap];
  const configuredCount = Object.keys(allConfigs).length;

  return (
    <div
      style={{ display: 'flex', width: '100vw', height: '100vh' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Left Panel - Sidebar */}
      <div style={{ ...panelStyle, width: '320px', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Stage Layout Editor</h2>

        {/* Stage Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stage:</label>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <optgroup label="Valley A">
              {VALLEY_A_MAPS.map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : ''}{map}</option>
              ))}
            </optgroup>
            <optgroup label="Valley B">
              {VALLEY_B_MAPS.map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : ''}{map}</option>
              ))}
            </optgroup>
            <optgroup label="Valley E/Z">
              {[...VALLEY_E_MAPS, ...VALLEY_Z_MAPS].map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : ''}{map}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Status */}
        <div style={{
          marginBottom: '15px',
          padding: '8px',
          background: hasCurrentConfig ? '#1a3a1a' : '#3a3a1a',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          {hasCurrentConfig ? `✓ Saved: ${gates.length} gates, ${boxes.length} boxes` : '⚠ No layout'}
          <div style={{ color: '#888' }}>Configured: {configuredCount}/{ALL_MAPS.length}</div>
        </div>

        {/* Grid Controls */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Grid: {gridSize}x{gridSize}</label>
          <input type="range" min="4" max="80" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px' }}>Offset X:</label>
              <input type="number" step="0.5" value={gridOffset[0]} onChange={(e) => setGridOffset([Number(e.target.value), gridOffset[1]])} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px' }}>Offset Z:</label>
              <input type="number" step="0.5" value={gridOffset[1]} onChange={(e) => setGridOffset([gridOffset[0], Number(e.target.value)])} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
          <label><input type="checkbox" checked={showStage} onChange={(e) => setShowStage(e.target.checked)} /> Stage</label>
          <label><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid</label>
        </div>

        {/* Mode */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mode:</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {(['select', 'gate', 'box'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPlacementMode(mode)}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: placementMode === mode ? '#0066aa' : '#333',
                  border: placementMode === mode ? '2px solid #00aaff' : '1px solid #555',
                  textTransform: 'capitalize'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Gate Placement Controls */}
        {placementMode === 'gate' && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#1a2a1a', borderRadius: '4px', border: '1px solid #0a0' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#0f0' }}>Gate Placement</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px' }}>Edge:</label>
              <select value={newGateEdge} onChange={(e) => setNewGateEdge(e.target.value as GateEdge)} style={inputStyle}>
                <option value="north">North (-Z)</option>
                <option value="south">South (+Z)</option>
                <option value="east">East (+X)</option>
                <option value="west">West (-X)</option>
              </select>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px' }}>Offset: {newGateOffset}</label>
              <input type="number" step="0.5" value={newGateOffset} onChange={(e) => setNewGateOffset(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px' }}>Scale: {newGateScale}</label>
              <input type="range" min="1" max="5" step="0.5" value={newGateScale} onChange={(e) => setNewGateScale(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <button onClick={handleAddGate} style={{ ...buttonStyle, width: '100%', background: '#00aa00', fontWeight: 'bold' }}>
              Add Gate (or click preview)
            </button>
          </div>
        )}

        {/* Box Placement Controls */}
        {placementMode === 'box' && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a1a0a', borderRadius: '4px', border: '1px solid #a60' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#fa0' }}>Box Placement (click ground)</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {(['o01_cont', 'o0c_recont'] as BoxType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setNewBoxType(type)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    fontSize: '10px',
                    background: newBoxType === type ? '#aa6600' : '#333',
                    border: newBoxType === type ? '2px solid #ffaa00' : '1px solid #555',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Gate Editor */}
        {selectedGateData && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#0a2a2a', borderRadius: '4px', border: '1px solid #0aa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#0ff' }}>Edit: {selectedGateData.label}</span>
              <button onClick={() => handleRemoveGate(selectedGateData.id)} style={{ ...buttonStyle, background: '#aa0000', padding: '2px 8px', fontSize: '10px' }}>Delete</button>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Label:</label>
              <input type="text" value={selectedGateData.label} onChange={(e) => handleUpdateGate(selectedGateData.id, { label: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Edge:</label>
              <select value={selectedGateData.edge} onChange={(e) => handleUpdateGate(selectedGateData.id, { edge: e.target.value as GateEdge })} style={inputStyle}>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px' }}>X:</label>
                <input type="number" step="0.5" value={selectedGateData.x} onChange={(e) => handleUpdateGate(selectedGateData.id, { x: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px' }}>Z:</label>
                <input type="number" step="0.5" value={selectedGateData.z} onChange={(e) => handleUpdateGate(selectedGateData.id, { z: Number(e.target.value) })} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '10px' }}>Scale: {selectedGateData.scale}</label>
              <input type="range" min="1" max="5" step="0.5" value={selectedGateData.scale} onChange={(e) => handleUpdateGate(selectedGateData.id, { scale: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {/* Selected Box Editor */}
        {selectedBoxData && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#2a0a2a', borderRadius: '4px', border: '1px solid #a0a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#f0f' }}>Edit: {selectedBoxData.label}</span>
              <button onClick={() => handleRemoveBox(selectedBoxData.id)} style={{ ...buttonStyle, background: '#aa0000', padding: '2px 8px', fontSize: '10px' }}>Delete</button>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Label:</label>
              <input type="text" value={selectedBoxData.label} onChange={(e) => handleUpdateBox(selectedBoxData.id, { label: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
              {(['o01_cont', 'o0c_recont'] as BoxType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleUpdateBox(selectedBoxData.id, { boxType: type })}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    fontSize: '9px',
                    background: selectedBoxData.boxType === type ? '#a06' : '#333',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px' }}>X:</label>
                <input type="number" step="0.5" value={selectedBoxData.x} onChange={(e) => handleUpdateBox(selectedBoxData.id, { x: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px' }}>Z:</label>
                <input type="number" step="0.5" value={selectedBoxData.z} onChange={(e) => handleUpdateBox(selectedBoxData.id, { z: Number(e.target.value) })} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Lists */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Gates ({gates.length}):</div>
          {gates.map(gate => (
            <div
              key={gate.id}
              onClick={() => setSelectedGate(gate.id)}
              style={{
                padding: '4px 6px',
                background: selectedGate === gate.id ? '#0aa' : '#222',
                borderRadius: '3px',
                marginBottom: '2px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {gate.label} ({gate.edge}) [{gate.x.toFixed(1)}, {gate.z.toFixed(1)}]
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Boxes ({boxes.length}):</div>
          {boxes.map(box => (
            <div
              key={box.id}
              onClick={() => setSelectedBox(box.id)}
              style={{
                padding: '4px 6px',
                background: selectedBox === box.id ? '#a0a' : '#222',
                borderRadius: '3px',
                marginBottom: '2px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {box.label} [{box.x.toFixed(1)}, {box.z.toFixed(1)}]
            </div>
          ))}
        </div>

        {/* Actions */}
        {hasCurrentConfig && (
          <button onClick={handleClearMap} style={{ ...buttonStyle, width: '100%', background: '#660000', marginBottom: '10px' }}>
            Clear Stage
          </button>
        )}

        {/* Export */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <button onClick={handleCopyJSON} style={{ ...buttonStyle, flex: 1 }}>
            Copy JSON
          </button>
          <button onClick={handleExportAll} style={{ ...buttonStyle, flex: 1 }}>
            Export All
          </button>
        </div>

        <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
          Controls: Drag=rotate, Right-drag=pan, Scroll=zoom, Del=remove
        </div>
      </div>

      {/* Right Panel - 3D View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <a
          href="/stage/valley"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            padding: '8px 16px',
            background: '#c33',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          Back
        </a>

        <Canvas camera={{ position: [10, 15, 10], fov: 60, near: 0.1, far: 500 }}>
          <OrbitControls target={[gridOffset[0], 0, gridOffset[1]]} enableDamping dampingFactor={0.1} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[20, 30, 10]} intensity={0.8} />
          <directionalLight position={[-10, 20, -10]} intensity={0.3} />

          <Scene
            selectedMap={selectedMap}
            gridSize={gridSize}
            gridOffset={gridOffset}
            gates={gates}
            boxes={boxes}
            selectedGate={selectedGate}
            selectedBox={selectedBox}
            onSelectGate={setSelectedGate}
            onSelectBox={setSelectedBox}
            onAddBox={handleAddBox}
            onAddGate={handleAddGate}
            placementMode={placementMode}
            showStage={showStage}
            showGrid={showGrid}
            previewGate={placementMode === 'gate' ? { edge: newGateEdge, offset: newGateOffset, scale: newGateScale } : null}
          />
        </Canvas>
      </div>
    </div>
  );
}
