import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Suspense, useState, useMemo } from 'react';
import { Gate } from '../elements';

// Area configurations
const AREAS = [
  { id: 'valley-a', label: 'Valley A', field: 'valley', area: 'a' },
  { id: 'valley-b', label: 'Valley B', field: 'valley', area: 'b' },
];

// Grid cell size (matches stage tile size)
const CELL_SIZE = 10;
const GRID_SIZE = 5;

// Gate positions on edges between cells
// Format: { row, col, direction: 'north' | 'south' | 'east' | 'west' }
interface GatePosition {
  row: number;
  col: number;
  direction: 'north' | 'south' | 'east' | 'west';
}

// Sample gate positions for testing alignment
const SAMPLE_GATES: GatePosition[] = [
  // Center cell gates
  { row: 2, col: 2, direction: 'north' },
  { row: 2, col: 2, direction: 'south' },
  { row: 2, col: 2, direction: 'east' },
  { row: 2, col: 2, direction: 'west' },
  // Some edge gates
  { row: 1, col: 2, direction: 'south' },
  { row: 3, col: 2, direction: 'north' },
  { row: 2, col: 1, direction: 'east' },
  { row: 2, col: 3, direction: 'west' },
];

function GridGate({ row, col, direction }: GatePosition) {
  // Calculate position based on cell and direction
  const position = useMemo(() => {
    const baseX = (col - 2) * CELL_SIZE;
    const baseZ = (row - 2) * CELL_SIZE;

    switch (direction) {
      case 'north':
        return [baseX, 0, baseZ - CELL_SIZE / 2] as [number, number, number];
      case 'south':
        return [baseX, 0, baseZ + CELL_SIZE / 2] as [number, number, number];
      case 'east':
        return [baseX + CELL_SIZE / 2, 0, baseZ] as [number, number, number];
      case 'west':
        return [baseX - CELL_SIZE / 2, 0, baseZ] as [number, number, number];
    }
  }, [row, col, direction]);

  // Calculate rotation based on direction
  const rotation = useMemo(() => {
    switch (direction) {
      case 'north':
      case 'south':
        return [0, 0, 0] as [number, number, number];
      case 'east':
      case 'west':
        return [0, Math.PI / 2, 0] as [number, number, number];
    }
  }, [direction]);

  return (
    <Suspense fallback={null}>
      <Gate position={position} rotation={rotation} state="closed" />
    </Suspense>
  );
}

function GridFloor() {
  const cells = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = (col - 2) * CELL_SIZE;
      const z = (row - 2) * CELL_SIZE;

      cells.push(
        <mesh key={`${row}-${col}`} position={[x, -0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CELL_SIZE - 0.2, CELL_SIZE - 0.2]} />
          <meshStandardMaterial
            color={(row + col) % 2 === 0 ? '#2a2a4a' : '#3a3a5a'}
            transparent
            opacity={0.5}
          />
        </mesh>
      );

      // Cell label
      cells.push(
        <mesh key={`label-${row}-${col}`} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#555" transparent opacity={0.3} />
        </mesh>
      );
    }
  }

  return <>{cells}</>;
}

function Scene({ gates }: { gates: GatePosition[] }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      <GridFloor />

      {gates.map((gate, i) => (
        <GridGate key={i} {...gate} />
      ))}

      <Grid
        infiniteGrid
        fadeDistance={60}
        fadeStrength={5}
        cellSize={CELL_SIZE}
        sectionSize={CELL_SIZE}
        cellColor="#333355"
        sectionColor="#444477"
      />

      <OrbitControls
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export default function GridViewer() {
  const [selectedArea, setSelectedArea] = useState(AREAS[0].id);
  const [showAllGates, setShowAllGates] = useState(true);

  const gates = showAllGates ? SAMPLE_GATES : [];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#1a1a2e',
      color: 'white',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Left Panel - Controls */}
      <div style={{
        width: '240px',
        borderRight: '1px solid #333',
        padding: '1.5rem',
        background: '#151525',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
          }}>
            Field / Area
          </div>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#2a2a4a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {AREAS.map(area => (
              <option key={area.id} value={area.id}>{area.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
          }}>
            Display
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: '#2a2a4a',
            borderRadius: '6px',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={showAllGates}
              onChange={(e) => setShowAllGates(e.target.checked)}
              style={{ accentColor: '#88aaff' }}
            />
            <span style={{ fontSize: '14px' }}>Show Gates</span>
          </label>
        </div>

        <div style={{
          fontSize: '12px',
          color: '#666',
          lineHeight: 1.6,
        }}>
          <p>5x5 grid showing gate alignment.</p>
          <p style={{ marginTop: '0.5rem' }}>Cell size: {CELL_SIZE} units</p>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <a
            href="/"
            style={{
              display: 'block',
              padding: '10px 14px',
              color: '#88aaff',
              textDecoration: 'none',
              fontSize: '13px',
              borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>

      {/* Main Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [30, 40, 30], fov: 50 }}>
          <Scene gates={gates} />
        </Canvas>

        {/* Grid legend */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>
            Grid Viewer
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {AREAS.find(a => a.id === selectedArea)?.label} - {GRID_SIZE}x{GRID_SIZE} grid
          </div>
        </div>

        {/* Coordinate guide */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
          fontSize: '12px',
          color: '#888',
        }}>
          <div>Row 0-4 (North → South)</div>
          <div>Col 0-4 (West → East)</div>
          <div style={{ marginTop: '4px', color: '#666' }}>Center: (2,2)</div>
        </div>
      </div>
    </div>
  );
}
