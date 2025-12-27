import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

type GateEdge = 'north' | 'south' | 'east' | 'west';

interface GateData {
  id: string;
  edge: GateEdge;
  position: number; // Position along the edge (0-1)
  width: number;
  label: string;
}

type BoxType = 'o01_cont' | 'o0c_recont';

interface BoxData {
  id: string;
  position: [number, number]; // World position
  size: [number, number];
  label: string;
  boxType: BoxType;
}

interface StageLayout {
  gridSize: number;
  gates: GateData[];
  boxes: BoxData[];
}

const STORAGE_KEY = 'stage-layout-configs';

// Stage lists (same as ValleyTriggerDebug)
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
  if (match) {
    return `stages/valley_${match[1]}`;
  }
  return 'stages/valley_a';
}

function loadAllConfigs(): Record<string, StageLayout> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAllConfigs(configs: Record<string, StageLayout>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

// Model paths
const GATE_MODEL_PATH = '/objects/01_o01a/o0c_gate.imd/o0c_gate.glb';
const BOX_MODEL_PATHS: Record<BoxType, string> = {
  'o01_cont': '/objects/01_o01a/o01_cont.imd/o01_cont.glb',
  'o0c_recont': '/objects/01_o01z/o0c_recont.imd/o0c_recont.glb',
};

function GateModel({
  position,
  rotation,
  selected,
  onClick
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  selected: boolean;
  onClick: () => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(GATE_MODEL_PATH, (gltf) => {
      const clone = gltf.scene.clone();
      // Set materials
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.transparent = true;
            mat.opacity = selected ? 0.9 : 0.7;
            if (selected) {
              mat.emissive = new THREE.Color(0x00ffff);
              mat.emissiveIntensity = 0.3;
            }
          }
        }
      });
      setModel(clone);
    });
  }, [selected]);

  if (!model) {
    // Fallback box while loading
    return (
      <group position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <mesh>
          <boxGeometry args={[2, 2, 1]} />
          <meshBasicMaterial color={selected ? '#00ffff' : '#00ff00'} transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={modelRef} position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={model} />
    </group>
  );
}

function BoxModel({
  position,
  boxType,
  selected,
  onClick
}: {
  position: [number, number];
  boxType: BoxType;
  selected: boolean;
  onClick: () => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(BOX_MODEL_PATHS[boxType], (gltf) => {
      const clone = gltf.scene.clone();
      // Adjust materials for selection visibility
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.transparent = true;
            mat.opacity = selected ? 0.9 : 0.7;
            if (selected) {
              mat.emissive = new THREE.Color(0xff00ff);
              mat.emissiveIntensity = 0.3;
            }
          }
        }
      });
      setModel(clone);
    });
  }, [boxType, selected]);

  if (!model) {
    // Fallback box while loading
    return (
      <group position={[position[0], 0, position[1]]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1, 1.5, 1]} />
          <meshBasicMaterial color={selected ? '#ff00ff' : '#ff6600'} transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={modelRef} position={[position[0], 0, position[1]]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={model} />
    </group>
  );
}

function SquareGrid({ size, offset }: { size: number; offset: [number, number] }) {
  const halfSize = size / 2;
  const lines: JSX.Element[] = [];

  // Grid lines centered on offset
  for (let i = -halfSize; i <= halfSize; i++) {
    const isEdge = Math.abs(i) === halfSize;
    const color = isEdge ? '#ffff00' : (i === 0 ? '#666666' : '#333333');

    // Horizontal lines (Z direction)
    lines.push(
      <line key={`h${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              offset[0] - halfSize, 0.15, offset[1] + i,
              offset[0] + halfSize, 0.15, offset[1] + i
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
    );

    // Vertical lines (X direction)
    lines.push(
      <line key={`v${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              offset[0] + i, 0.15, offset[1] - halfSize,
              offset[0] + i, 0.15, offset[1] + halfSize
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
    );
  }

  return <group>{lines}</group>;
}

function Gate({
  edge,
  position,
  gridSize,
  gridOffset,
  selected,
  onClick
}: {
  edge: GateEdge;
  position: number;
  gridSize: number;
  gridOffset: [number, number];
  selected: boolean;
  onClick: () => void;
}) {
  const halfSize = gridSize / 2;

  let pos: [number, number, number] = [0, 0, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  const edgePosition = (position - 0.5) * gridSize;

  switch (edge) {
    case 'north':
      pos = [gridOffset[0] + edgePosition, 0, gridOffset[1] - halfSize];
      rotation = [0, Math.PI, 0]; // Face south
      break;
    case 'south':
      pos = [gridOffset[0] + edgePosition, 0, gridOffset[1] + halfSize];
      rotation = [0, 0, 0]; // Face north
      break;
    case 'east':
      pos = [gridOffset[0] + halfSize, 0, gridOffset[1] + edgePosition];
      rotation = [0, -Math.PI / 2, 0]; // Face west
      break;
    case 'west':
      pos = [gridOffset[0] - halfSize, 0, gridOffset[1] + edgePosition];
      rotation = [0, Math.PI / 2, 0]; // Face east
      break;
  }

  return (
    <GateModel
      position={pos}
      rotation={rotation}
      selected={selected}
      onClick={onClick}
    />
  );
}

function Box({
  position,
  boxType,
  selected,
  onClick
}: {
  position: [number, number];
  boxType: BoxType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <BoxModel
      position={position}
      boxType={boxType}
      selected={selected}
      onClick={onClick}
    />
  );
}

function StageModel({
  selectedMap,
  showStage
}: {
  selectedMap: string;
  showStage: boolean;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    setModel(null);

    const loader = new GLTFLoader();
    const valleyDir = getValleyDir(selectedMap);
    // Stage files use _m suffix for the mesh
    const glbPath = `/${valleyDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      const scene = gltf.scene.clone();
      setModel(scene);
    }, undefined, (error) => {
      console.error('Error loading stage model:', error);
    });
  }, [selectedMap]);

  if (!showStage || !model) return null;

  return <primitive object={model} />;
}

// Visual ground plane for placement feedback
function GroundPlane({
  gridSize,
  gridOffset,
  placementMode,
  onClick
}: {
  gridSize: number;
  gridOffset: [number, number];
  placementMode: 'gate' | 'box' | 'select';
  onClick: (position: [number, number]) => void;
}) {
  const handleClick = (event: any) => {
    if (placementMode !== 'box') return;
    event.stopPropagation();
    const point = event.point;
    if (point) {
      // Snap to 0.5 grid
      const snappedX = Math.round(point.x * 2) / 2;
      const snappedZ = Math.round(point.z * 2) / 2;
      onClick([snappedX, snappedZ]);
    }
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[gridOffset[0], 0.02, gridOffset[1]]}
      onClick={handleClick}
    >
      <planeGeometry args={[gridSize, gridSize]} />
      <meshBasicMaterial
        color={placementMode === 'box' ? '#004400' : '#222222'}
        transparent
        opacity={placementMode === 'box' ? 0.3 : 0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function LayoutScene({
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
  placementMode,
  showStage,
  showGrid
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
  onAddBox: (position: [number, number]) => void;
  placementMode: 'gate' | 'box' | 'select';
  showStage: boolean;
  showGrid: boolean;
}) {
  return (
    <>
      <StageModel selectedMap={selectedMap} showStage={showStage} />

      {showGrid && <SquareGrid size={gridSize} offset={gridOffset} />}

      {/* Visual ground plane for placement */}
      <GroundPlane
        gridSize={gridSize}
        gridOffset={gridOffset}
        placementMode={placementMode}
        onClick={onAddBox}
      />

      {/* Gates */}
      {gates.map((gate) => (
        <Gate
          key={gate.id}
          edge={gate.edge}
          position={gate.position}
          gridSize={gridSize}
          gridOffset={gridOffset}
          selected={selectedGate === gate.id}
          onClick={() => onSelectGate(gate.id)}
        />
      ))}

      {/* Boxes */}
      {boxes.map((box) => (
        <Box
          key={box.id}
          position={box.position}
          boxType={box.boxType}
          selected={selectedBox === box.id}
          onClick={() => onSelectBox(box.id)}
        />
      ))}

      {/* Origin marker */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Grid center marker */}
      {showGrid && (
        <mesh position={[gridOffset[0], 0.25, gridOffset[1]]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      )}
    </>
  );
}

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

  // New gate defaults
  const [newGateEdge, setNewGateEdge] = useState<GateEdge>('north');
  const [newGatePosition, setNewGatePosition] = useState(0.5);
  const [newGateWidth, setNewGateWidth] = useState(3);

  // New box defaults
  const [newBoxType, setNewBoxType] = useState<BoxType>('o01_cont');

  // Load all configs on mount
  useEffect(() => {
    const configs = loadAllConfigs();
    setAllConfigs(configs);
  }, []);

  // Load config when map changes
  useEffect(() => {
    const configs = loadAllConfigs();
    if (configs[selectedMap]) {
      const config = configs[selectedMap];
      setGridSize(config.gridSize);
      setGates(config.gates);
      setBoxes(config.boxes);
    } else {
      // Reset to defaults for new map
      setGridSize(10);
      setGates([]);
      setBoxes([]);
    }
    setSelectedGate(null);
    setSelectedBox(null);
  }, [selectedMap]);

  // Save config when layout changes
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
    const newGate: GateData = {
      id: `gate_${Date.now()}`,
      edge: newGateEdge,
      position: newGatePosition,
      width: newGateWidth,
      label: `Gate ${gates.length + 1}`
    };
    setGates(prev => [...prev, newGate]);
    setSelectedGate(newGate.id);
  };

  const handleAddBox = (position: [number, number]) => {
    const newBox: BoxData = {
      id: `box_${Date.now()}`,
      position,
      size: [1, 1], // Size now determined by model
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

  const handleExport = () => {
    const halfSize = gridSize / 2;

    let code = `// Stage Layout: ${selectedMap}\n`;
    code += `// Grid Size: ${gridSize}x${gridSize}, Offset: [${gridOffset[0]}, ${gridOffset[1]}]\n\n`;

    code += `const stageConfig = {\n`;
    code += `  gridSize: ${gridSize},\n`;
    code += `  gridOffset: [${gridOffset[0]}, ${gridOffset[1]}],\n`;

    if (gates.length > 0) {
      code += `  gates: [\n`;
      gates.forEach((gate, i) => {
        const edgePos = (gate.position - 0.5) * gridSize;
        let worldPos: string;
        switch (gate.edge) {
          case 'north': worldPos = `[${(gridOffset[0] + edgePos).toFixed(2)}, 0, ${(gridOffset[1] - halfSize).toFixed(2)}]`; break;
          case 'south': worldPos = `[${(gridOffset[0] + edgePos).toFixed(2)}, 0, ${(gridOffset[1] + halfSize).toFixed(2)}]`; break;
          case 'east': worldPos = `[${(gridOffset[0] + halfSize).toFixed(2)}, 0, ${(gridOffset[1] + edgePos).toFixed(2)}]`; break;
          case 'west': worldPos = `[${(gridOffset[0] - halfSize).toFixed(2)}, 0, ${(gridOffset[1] + edgePos).toFixed(2)}]`; break;
        }
        code += `    { edge: '${gate.edge}', position: ${worldPos}, width: ${gate.width}, label: '${gate.label}' }${i < gates.length - 1 ? ',' : ''}\n`;
      });
      code += `  ],\n`;
    }

    if (boxes.length > 0) {
      code += `  obstacles: [\n`;
      boxes.forEach((box, i) => {
        code += `    { position: [${box.position[0].toFixed(2)}, 0, ${box.position[1].toFixed(2)}], type: '${box.boxType}', label: '${box.label}' }${i < boxes.length - 1 ? ',' : ''}\n`;
      });
      code += `  ]\n`;
    }

    code += `};\n`;

    navigator.clipboard.writeText(code);
    alert('Layout exported to clipboard!');
  };

  const handleExportAll = () => {
    const configs = loadAllConfigs();
    const configuredMaps = Object.keys(configs).sort();

    if (configuredMaps.length === 0) {
      alert('No stages configured yet!');
      return;
    }

    let code = `// Stage Layout configurations - Generated from layout editor\n`;
    code += `// Configured stages: ${configuredMaps.length}\n\n`;
    code += `export const STAGE_LAYOUTS: Record<string, StageLayout> = {\n`;

    configuredMaps.forEach((mapId, mapIndex) => {
      const config = configs[mapId];
      code += `  '${mapId}': {\n`;
      code += `    gridSize: ${config.gridSize},\n`;
      code += `    gates: ${JSON.stringify(config.gates, null, 6).replace(/\n/g, '\n    ')},\n`;
      code += `    boxes: ${JSON.stringify(config.boxes, null, 6).replace(/\n/g, '\n    ')}\n`;
      code += `  }${mapIndex < configuredMaps.length - 1 ? ',' : ''}\n`;
    });

    code += `};\n`;

    navigator.clipboard.writeText(code);
    alert(`Exported ${configuredMaps.length} stage configs to clipboard!`);
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
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Left Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        width: '300px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
          Stage Layout Editor
        </div>

        {/* Stage Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Select Stage:
          </label>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'monospace',
              cursor: 'pointer'
            }}
          >
            <optgroup label="Valley A">
              {VALLEY_A_MAPS.map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>
              ))}
            </optgroup>
            <optgroup label="Valley B">
              {VALLEY_B_MAPS.map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>
              ))}
            </optgroup>
            <optgroup label="Valley E">
              {VALLEY_E_MAPS.map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>
              ))}
            </optgroup>
            <optgroup label="Valley Z">
              {VALLEY_Z_MAPS.map((map) => (
                <option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Config Status */}
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: hasCurrentConfig ? 'rgba(0,150,0,0.3)' : 'rgba(150,100,0,0.3)',
          borderRadius: '4px',
          border: hasCurrentConfig ? '1px solid #0a0' : '1px solid #a80'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {hasCurrentConfig ? '✓ Layout saved' : '⚠ No layout yet'}
          </div>
          {hasCurrentConfig && (
            <div style={{ fontSize: '11px', color: '#aaa' }}>
              <div>Gates: {gates.length}</div>
              <div>Boxes: {boxes.length}</div>
            </div>
          )}
          <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
            Configured: {configuredCount} / {ALL_MAPS.length} stages
          </div>
        </div>

        {/* Grid Controls */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Grid Size: {gridSize}x{gridSize}
          </label>
          <input
            type="range"
            min="4"
            max="80"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>Grid X:</label>
            <input
              type="number"
              step="0.5"
              value={gridOffset[0]}
              onChange={(e) => setGridOffset([Number(e.target.value), gridOffset[1]])}
              style={{
                width: '100%',
                padding: '6px',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>Grid Z:</label>
            <input
              type="number"
              step="0.5"
              value={gridOffset[1]}
              onChange={(e) => setGridOffset([gridOffset[0], Number(e.target.value)])}
              style={{
                width: '100%',
                padding: '6px',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Toggle visibility */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showStage}
              onChange={(e) => setShowStage(e.target.checked)}
            />
            Stage
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Grid
          </label>
        </div>

        {/* Placement Mode */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Mode:
          </label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {(['select', 'gate', 'box'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPlacementMode(mode)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: placementMode === mode ? '#0066aa' : '#333',
                  color: 'white',
                  border: placementMode === mode ? '2px solid #00aaff' : '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  textTransform: 'capitalize'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Gate Controls */}
        {placementMode === 'gate' && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(0,255,0,0.1)',
            borderRadius: '4px',
            border: '1px solid #0a0'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#0f0' }}>
              New Gate Settings
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>Edge:</label>
              <select
                value={newGateEdge}
                onChange={(e) => setNewGateEdge(e.target.value as GateEdge)}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              >
                <option value="north">North (-Z)</option>
                <option value="south">South (+Z)</option>
                <option value="east">East (+X)</option>
                <option value="west">West (-X)</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                Position: {(newGatePosition * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={newGatePosition}
                onChange={(e) => setNewGatePosition(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                Width: {newGateWidth}
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={newGateWidth}
                onChange={(e) => setNewGateWidth(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={handleAddGate}
              style={{
                width: '100%',
                padding: '10px',
                background: '#00aa00',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
            >
              Add Gate
            </button>
          </div>
        )}

        {/* Box Controls */}
        {placementMode === 'box' && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(255,100,0,0.1)',
            borderRadius: '4px',
            border: '1px solid #a60'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#fa0' }}>
              Box Settings (Click to place)
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                Object Type:
              </label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {(['o01_cont', 'o0c_recont'] as BoxType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setNewBoxType(type)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      background: newBoxType === type ? '#aa6600' : '#333',
                      color: 'white',
                      border: newBoxType === type ? '2px solid #ffaa00' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '10px'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>
                {newBoxType === 'o01_cont' ? 'Container box' : 'Recovery container'}
              </div>
            </div>
          </div>
        )}

        {/* Selected Gate Editor */}
        {selectedGateData && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(0,255,255,0.1)',
            borderRadius: '4px',
            border: '1px solid #0aa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#0ff' }}>Edit Gate</span>
              <button
                onClick={() => handleRemoveGate(selectedGateData.id)}
                style={{
                  background: '#aa0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Delete
              </button>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>Label:</label>
              <input
                type="text"
                value={selectedGateData.label}
                onChange={(e) => handleUpdateGate(selectedGateData.id, { label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                Position: {(selectedGateData.position * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={selectedGateData.position}
                onChange={(e) => handleUpdateGate(selectedGateData.id, { position: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                Width: {selectedGateData.width}
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={selectedGateData.width}
                onChange={(e) => handleUpdateGate(selectedGateData.id, { width: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Selected Box Editor */}
        {selectedBoxData && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(255,0,255,0.1)',
            borderRadius: '4px',
            border: '1px solid #a0a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#f0f' }}>Edit Box</span>
              <button
                onClick={() => handleRemoveBox(selectedBoxData.id)}
                style={{
                  background: '#aa0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Delete
              </button>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>Label:</label>
              <input
                type="text"
                value={selectedBoxData.label}
                onChange={(e) => handleUpdateBox(selectedBoxData.id, { label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>Type:</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {(['o01_cont', 'o0c_recont'] as BoxType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleUpdateBox(selectedBoxData.id, { boxType: type })}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      background: selectedBoxData.boxType === type ? '#a06' : '#333',
                      color: 'white',
                      border: selectedBoxData.boxType === type ? '2px solid #f0f' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '9px'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#aaa' }}>
              Position: [{selectedBoxData.position[0].toFixed(2)}, {selectedBoxData.position[1].toFixed(2)}]
            </div>
          </div>
        )}

        {/* Items List */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold' }}>Gates ({gates.length}):</span>
          </div>
          {gates.length === 0 ? (
            <div style={{ color: '#666', fontSize: '11px' }}>No gates</div>
          ) : (
            gates.map(gate => (
              <div
                key={gate.id}
                onClick={() => setSelectedGate(gate.id)}
                style={{
                  padding: '6px',
                  background: selectedGate === gate.id ? 'rgba(0,255,255,0.3)' : 'rgba(0,255,0,0.1)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                {gate.label} ({gate.edge})
              </div>
            ))
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Boxes ({boxes.length}):
          </div>
          {boxes.length === 0 ? (
            <div style={{ color: '#666', fontSize: '11px' }}>No boxes</div>
          ) : (
            boxes.map(box => (
              <div
                key={box.id}
                onClick={() => setSelectedBox(box.id)}
                style={{
                  padding: '6px',
                  background: selectedBox === box.id ? 'rgba(255,0,255,0.3)' : 'rgba(255,100,0,0.1)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                {box.label} ({box.boxType})
              </div>
            ))
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              padding: '10px',
              background: '#0066aa',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            Copy This
          </button>
          <button
            onClick={handleExportAll}
            disabled={configuredCount === 0}
            style={{
              flex: 1,
              padding: '10px',
              background: configuredCount === 0 ? '#333' : '#006644',
              color: configuredCount === 0 ? '#666' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: configuredCount === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            Export All ({configuredCount})
          </button>
        </div>

        {hasCurrentConfig && (
          <button
            onClick={handleClearMap}
            style={{
              width: '100%',
              padding: '8px',
              background: '#660000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '11px',
              marginBottom: '10px'
            }}
          >
            Clear This Stage
          </button>
        )}

        {/* Instructions */}
        <div style={{
          padding: '10px',
          background: '#222',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#888'
        }}>
          <div><b>Controls:</b></div>
          <div>Left-drag: Rotate view</div>
          <div>Right-drag: Pan view</div>
          <div>Scroll: Zoom in/out</div>
          <div>Delete: Remove selected</div>
          <div>Click ground: Place box</div>
          <div style={{ marginTop: '5px', color: '#8f8' }}>
            <b>Auto-saves to localStorage</b>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <a
        href="/stage/valley"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '10px 20px',
          background: 'rgba(200, 50, 50, 0.9)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        Back to Valley
      </a>

      {/* 3D Scene */}
      <Canvas camera={{ position: [10, 15, 10], fov: 60, near: 0.1, far: 500 }}>
        <OrbitControls
          target={[gridOffset[0], 0, gridOffset[1]]}
          enableDamping
          dampingFactor={0.1}
        />

        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 30, 10]} intensity={0.8} castShadow />
        <directionalLight position={[-10, 20, -10]} intensity={0.3} />

        <Suspense fallback={null}>
          <LayoutScene
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
            placementMode={placementMode}
            showStage={showStage}
            showGrid={showGrid}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
