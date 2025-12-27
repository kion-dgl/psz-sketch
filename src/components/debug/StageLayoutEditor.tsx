import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

type GateEdge = 'north' | 'south' | 'east' | 'west';

interface GateData {
  id: string;
  edge: GateEdge;
  position: number; // Position along the edge (0-1)
  width: number;
  label: string;
}

interface BoxData {
  id: string;
  position: [number, number];
  size: [number, number];
  label: string;
}

interface StageLayout {
  gridSize: number;
  gates: GateData[];
  boxes: BoxData[];
}

const STORAGE_KEY = 'stage-layout-configs';

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

function SquareGrid({ size }: { size: number }) {
  const halfSize = size / 2;
  const lines: JSX.Element[] = [];

  // Grid lines
  for (let i = -halfSize; i <= halfSize; i++) {
    const isEdge = Math.abs(i) === halfSize;
    const color = isEdge ? '#ffff00' : (i === 0 ? '#666666' : '#333333');
    const lineWidth = isEdge ? 2 : 1;

    // Horizontal lines (Z direction)
    lines.push(
      <line key={`h${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-halfSize, 0.05, i, halfSize, 0.05, i])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={lineWidth} />
      </line>
    );

    // Vertical lines (X direction)
    lines.push(
      <line key={`v${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([i, 0.05, -halfSize, i, 0.05, halfSize])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={lineWidth} />
      </line>
    );
  }

  return <group>{lines}</group>;
}

function Gate({
  edge,
  position,
  width,
  gridSize,
  selected,
  onClick
}: {
  edge: GateEdge;
  position: number;
  width: number;
  gridSize: number;
  selected: boolean;
  onClick: () => void;
}) {
  const halfSize = gridSize / 2;
  const gateDepth = 1;
  const gateHeight = 2;

  let pos: [number, number, number] = [0, gateHeight / 2, 0];
  let rotation: [number, number, number] = [0, 0, 0];
  let scale: [number, number, number] = [width, gateHeight, gateDepth];

  const edgePosition = (position - 0.5) * gridSize;

  switch (edge) {
    case 'north':
      pos = [edgePosition, gateHeight / 2, -halfSize];
      rotation = [0, 0, 0];
      break;
    case 'south':
      pos = [edgePosition, gateHeight / 2, halfSize];
      rotation = [0, 0, 0];
      break;
    case 'east':
      pos = [halfSize, gateHeight / 2, edgePosition];
      rotation = [0, Math.PI / 2, 0];
      break;
    case 'west':
      pos = [-halfSize, gateHeight / 2, edgePosition];
      rotation = [0, Math.PI / 2, 0];
      break;
  }

  return (
    <group position={pos} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh>
        <boxGeometry args={scale} />
        <meshBasicMaterial
          color={selected ? '#00ffff' : '#00ff00'}
          transparent
          opacity={0.6}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...scale)]} />
        <lineBasicMaterial color={selected ? '#00ffff' : '#00ff00'} />
      </lineSegments>
    </group>
  );
}

function Box({
  position,
  size,
  gridSize,
  selected,
  onClick
}: {
  position: [number, number];
  size: [number, number];
  gridSize: number;
  selected: boolean;
  onClick: () => void;
}) {
  const halfSize = gridSize / 2;
  const boxHeight = 1.5;

  // Convert grid-relative position to world position
  const worldX = position[0] - halfSize + size[0] / 2;
  const worldZ = position[1] - halfSize + size[1] / 2;

  return (
    <group
      position={[worldX, boxHeight / 2, worldZ]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <mesh>
        <boxGeometry args={[size[0], boxHeight, size[1]]} />
        <meshBasicMaterial
          color={selected ? '#ff00ff' : '#ff6600'}
          transparent
          opacity={0.5}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size[0], boxHeight, size[1])]} />
        <lineBasicMaterial color={selected ? '#ff00ff' : '#ff8800'} />
      </lineSegments>
    </group>
  );
}

function LayoutScene({
  gridSize,
  gates,
  boxes,
  selectedGate,
  selectedBox,
  onSelectGate,
  onSelectBox,
  onAddBox,
  placementMode
}: {
  gridSize: number;
  gates: GateData[];
  boxes: BoxData[];
  selectedGate: string | null;
  selectedBox: string | null;
  onSelectGate: (id: string | null) => void;
  onSelectBox: (id: string | null) => void;
  onAddBox: (position: [number, number]) => void;
  placementMode: 'gate' | 'box' | 'select';
}) {
  const planeRef = useRef<THREE.Mesh>(null);
  const halfSize = gridSize / 2;

  const handleClick = (event: any) => {
    if (placementMode !== 'box') return;
    event.stopPropagation();
    const point = event.point;
    if (point) {
      // Snap to grid
      const gridX = Math.floor(point.x + halfSize);
      const gridZ = Math.floor(point.z + halfSize);
      if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
        onAddBox([gridX, gridZ]);
      }
    }
  };

  return (
    <>
      <SquareGrid size={gridSize} />

      {/* Click plane */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[gridSize + 10, gridSize + 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Gates */}
      {gates.map((gate) => (
        <Gate
          key={gate.id}
          edge={gate.edge}
          position={gate.position}
          width={gate.width}
          gridSize={gridSize}
          selected={selectedGate === gate.id}
          onClick={() => onSelectGate(gate.id)}
        />
      ))}

      {/* Boxes */}
      {boxes.map((box) => (
        <Box
          key={box.id}
          position={box.position}
          size={box.size}
          gridSize={gridSize}
          selected={selectedBox === box.id}
          onClick={() => onSelectBox(box.id)}
        />
      ))}

      {/* Origin marker */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </>
  );
}

export default function StageLayoutEditor() {
  const [stageName, setStageName] = useState('new_stage');
  const [gridSize, setGridSize] = useState(10);
  const [gates, setGates] = useState<GateData[]>([]);
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<'gate' | 'box' | 'select'>('select');
  const [zoom, setZoom] = useState(30);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, z: 0 });
  const [allConfigs, setAllConfigs] = useState<Record<string, StageLayout>>({});

  // New gate defaults
  const [newGateEdge, setNewGateEdge] = useState<GateEdge>('north');
  const [newGatePosition, setNewGatePosition] = useState(0.5);
  const [newGateWidth, setNewGateWidth] = useState(3);

  // New box defaults
  const [newBoxWidth, setNewBoxWidth] = useState(2);
  const [newBoxDepth, setNewBoxDepth] = useState(2);

  useEffect(() => {
    const configs = loadAllConfigs();
    setAllConfigs(configs);
  }, []);

  useEffect(() => {
    if (allConfigs[stageName]) {
      const config = allConfigs[stageName];
      setGridSize(config.gridSize);
      setGates(config.gates);
      setBoxes(config.boxes);
    } else {
      setGates([]);
      setBoxes([]);
    }
  }, [stageName, allConfigs]);

  const saveLayout = () => {
    const configs = loadAllConfigs();
    configs[stageName] = { gridSize, gates, boxes };
    saveAllConfigs(configs);
    setAllConfigs(configs);
  };

  useEffect(() => {
    // Auto-save on changes
    if (gates.length > 0 || boxes.length > 0) {
      saveLayout();
    }
  }, [gates, boxes, gridSize]);

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
      size: [newBoxWidth, newBoxDepth],
      label: `Box ${boxes.length + 1}`
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

  const handleExport = () => {
    const halfSize = gridSize / 2;

    let code = `// Stage Layout: ${stageName}\n`;
    code += `// Grid Size: ${gridSize}x${gridSize}\n\n`;

    code += `const stageConfig = {\n`;
    code += `  gridSize: ${gridSize},\n`;
    code += `  bounds: {\n`;
    code += `    minX: ${-halfSize},\n`;
    code += `    maxX: ${halfSize},\n`;
    code += `    minZ: ${-halfSize},\n`;
    code += `    maxZ: ${halfSize}\n`;
    code += `  },\n`;

    if (gates.length > 0) {
      code += `  gates: [\n`;
      gates.forEach((gate, i) => {
        const edgePos = (gate.position - 0.5) * gridSize;
        let worldPos: string;
        switch (gate.edge) {
          case 'north': worldPos = `[${edgePos.toFixed(2)}, 0, ${-halfSize}]`; break;
          case 'south': worldPos = `[${edgePos.toFixed(2)}, 0, ${halfSize}]`; break;
          case 'east': worldPos = `[${halfSize}, 0, ${edgePos.toFixed(2)}]`; break;
          case 'west': worldPos = `[${-halfSize}, 0, ${edgePos.toFixed(2)}]`; break;
        }
        code += `    { edge: '${gate.edge}', position: ${worldPos}, width: ${gate.width}, label: '${gate.label}' }${i < gates.length - 1 ? ',' : ''}\n`;
      });
      code += `  ],\n`;
    }

    if (boxes.length > 0) {
      code += `  obstacles: [\n`;
      boxes.forEach((box, i) => {
        const worldX = box.position[0] - halfSize + box.size[0] / 2;
        const worldZ = box.position[1] - halfSize + box.size[1] / 2;
        code += `    { position: [${worldX.toFixed(2)}, 0, ${worldZ.toFixed(2)}], size: [${box.size[0]}, ${box.size[1]}], label: '${box.label}' }${i < boxes.length - 1 ? ',' : ''}\n`;
      });
      code += `  ]\n`;
    }

    code += `};\n`;

    navigator.clipboard.writeText(code);
    alert('Layout exported to clipboard!');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const panSpeed = 2;
    switch(e.key) {
      case 'w':
      case 'ArrowUp':
        setCameraPosition(prev => ({ ...prev, z: prev.z - panSpeed }));
        break;
      case 's':
      case 'ArrowDown':
        setCameraPosition(prev => ({ ...prev, z: prev.z + panSpeed }));
        break;
      case 'a':
      case 'ArrowLeft':
        setCameraPosition(prev => ({ ...prev, x: prev.x - panSpeed }));
        break;
      case 'd':
      case 'ArrowRight':
        setCameraPosition(prev => ({ ...prev, x: prev.x + panSpeed }));
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedGate) handleRemoveGate(selectedGate);
        if (selectedBox) handleRemoveBox(selectedBox);
        break;
    }
  };

  const selectedGateData = gates.find(g => g.id === selectedGate);
  const selectedBoxData = boxes.find(b => b.id === selectedBox);
  const configuredStages = Object.keys(allConfigs);

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

        {/* Stage Name */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Stage Name:
          </label>
          <input
            type="text"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
          {configuredStages.length > 0 && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) setStageName(e.target.value); }}
              style={{
                width: '100%',
                marginTop: '5px',
                padding: '6px',
                background: '#333',
                color: '#888',
                border: '1px solid #555',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            >
              <option value="">Load existing...</option>
              {configuredStages.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Grid Size */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Grid Size: {gridSize}x{gridSize}
          </label>
          <input
            type="range"
            min="4"
            max="30"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
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
                Position along edge: {(newGatePosition * 100).toFixed(0)}%
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
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                Width (X): {newBoxWidth}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={newBoxWidth}
                onChange={(e) => setNewBoxWidth(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px' }}>
                Depth (Z): {newBoxDepth}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={newBoxDepth}
                onChange={(e) => setNewBoxDepth(Number(e.target.value))}
                style={{ width: '100%' }}
              />
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

            <div style={{ fontSize: '11px', color: '#aaa' }}>
              Position: [{selectedBoxData.position[0]}, {selectedBoxData.position[1]}]
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>
              Size: {selectedBoxData.size[0]}x{selectedBoxData.size[1]}
            </div>
          </div>
        )}

        {/* Zoom */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Zoom: {zoom}
          </label>
          <input
            type="range"
            min="10"
            max="80"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Items List */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Gates ({gates.length}):
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
                {box.label} ({box.size[0]}x{box.size[1]})
              </div>
            ))
          )}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          style={{
            width: '100%',
            padding: '10px',
            background: '#006644',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}
        >
          Export Layout
        </button>

        {/* Instructions */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#222',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#888'
        }}>
          <div><b>Controls:</b></div>
          <div>WASD / Arrows: Pan camera</div>
          <div>Delete: Remove selected</div>
          <div>Click: Select / Place box</div>
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
      <Canvas>
        <OrthographicCamera
          makeDefault
          position={[cameraPosition.x, 50, cameraPosition.z]}
          zoom={zoom}
          near={0.1}
          far={500}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 30, 0]} intensity={0.5} />

        <Suspense fallback={null}>
          <LayoutScene
            gridSize={gridSize}
            gates={gates}
            boxes={boxes}
            selectedGate={selectedGate}
            selectedBox={selectedBox}
            onSelectGate={setSelectedGate}
            onSelectBox={setSelectedBox}
            onAddBox={handleAddBox}
            placementMode={placementMode}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
