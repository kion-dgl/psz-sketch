import { useState } from 'react';

// Area configurations
const AREAS = [
  { id: 'valley-a', label: 'Valley A', field: 'valley', area: 'a' },
  { id: 'valley-b', label: 'Valley B', field: 'valley', area: 'b' },
];

// Stage data type
interface StageCell {
  name: string;
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

// Sample 5x5 grid data for Valley A
const VALLEY_A_GRID: (StageCell | null)[][] = [
  [
    { name: 's01', north: false, south: true, east: true, west: false },
    { name: 's02', north: false, south: true, east: true, west: true },
    { name: 's03', north: false, south: true, east: true, west: true },
    { name: 's04', north: false, south: true, east: true, west: true },
    { name: 's05', north: false, south: true, east: false, west: true },
  ],
  [
    { name: 's06', north: true, south: true, east: true, west: false },
    { name: 's07', north: true, south: true, east: true, west: true },
    { name: 's08', north: true, south: true, east: true, west: true },
    { name: 's09', north: true, south: true, east: true, west: true },
    { name: 's10', north: true, south: true, east: false, west: true },
  ],
  [
    { name: 's11', north: true, south: true, east: true, west: false },
    { name: 's12', north: true, south: true, east: true, west: true },
    { name: 's13', north: true, south: true, east: true, west: true },
    { name: 's14', north: true, south: true, east: true, west: true },
    { name: 's15', north: true, south: true, east: false, west: true },
  ],
  [
    { name: 's16', north: true, south: true, east: true, west: false },
    { name: 's17', north: true, south: true, east: true, west: true },
    { name: 's18', north: true, south: true, east: true, west: true },
    { name: 's19', north: true, south: true, east: true, west: true },
    { name: 's20', north: true, south: true, east: false, west: true },
  ],
  [
    { name: 's21', north: true, south: false, east: true, west: false },
    { name: 's22', north: true, south: false, east: true, west: true },
    { name: 's23', north: true, south: false, east: true, west: true },
    { name: 's24', north: true, south: false, east: true, west: true },
    { name: 's25', north: true, south: false, east: false, west: true },
  ],
];

// Sample 5x5 grid data for Valley B
const VALLEY_B_GRID: (StageCell | null)[][] = [
  [
    { name: 's01', north: false, south: true, east: true, west: false },
    { name: 's02', north: false, south: false, east: true, west: true },
    { name: 's03', north: false, south: true, east: true, west: true },
    { name: 's04', north: false, south: false, east: true, west: true },
    { name: 's05', north: false, south: true, east: false, west: true },
  ],
  [
    { name: 's06', north: true, south: true, east: false, west: false },
    { name: 's07', north: false, south: true, east: true, west: false },
    { name: 's08', north: true, south: false, east: false, west: true },
    { name: 's09', north: false, south: true, east: true, west: false },
    { name: 's10', north: true, south: true, east: false, west: true },
  ],
  [
    { name: 's11', north: true, south: true, east: true, west: false },
    { name: 's12', north: true, south: true, east: true, west: true },
    { name: 's13', north: false, south: true, east: true, west: true },
    { name: 's14', north: true, south: true, east: true, west: true },
    { name: 's15', north: true, south: true, east: false, west: true },
  ],
  [
    { name: 's16', north: true, south: false, east: false, west: false },
    { name: 's17', north: true, south: true, east: true, west: false },
    { name: 's18', north: true, south: false, east: false, west: true },
    { name: 's19', north: true, south: true, east: true, west: false },
    { name: 's20', north: true, south: false, east: false, west: true },
  ],
  [
    { name: 's21', north: false, south: false, east: true, west: false },
    { name: 's22', north: true, south: false, east: true, west: true },
    { name: 's23', north: false, south: false, east: true, west: true },
    { name: 's24', north: true, south: false, east: true, west: true },
    { name: 's25', north: false, south: false, east: false, west: true },
  ],
];

const GRIDS: Record<string, (StageCell | null)[][]> = {
  'valley-a': VALLEY_A_GRID,
  'valley-b': VALLEY_B_GRID,
};

function StageCell({ cell, row, col }: { cell: StageCell | null; row: number; col: number }) {
  if (!cell) {
    return (
      <div style={{
        width: '100px',
        height: '100px',
        background: '#1a1a2e',
        border: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#444',
        fontSize: '12px',
      }}>
        empty
      </div>
    );
  }

  return (
    <div style={{
      width: '100px',
      height: '100px',
      background: '#2a2a4a',
      border: '1px solid #444',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Stage name */}
      <div style={{
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        zIndex: 1,
      }}>
        {cell.name}
      </div>

      {/* North gate */}
      {cell.north && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '8px',
          background: '#88ff88',
          borderRadius: '0 0 4px 4px',
        }} title="North Gate" />
      )}

      {/* South gate */}
      {cell.south && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '8px',
          background: '#88ff88',
          borderRadius: '4px 4px 0 0',
        }} title="South Gate" />
      )}

      {/* East gate */}
      {cell.east && (
        <div style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '8px',
          height: '30px',
          background: '#88ff88',
          borderRadius: '4px 0 0 4px',
        }} title="East Gate" />
      )}

      {/* West gate */}
      {cell.west && (
        <div style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '8px',
          height: '30px',
          background: '#88ff88',
          borderRadius: '0 4px 4px 0',
        }} title="West Gate" />
      )}

      {/* Coordinate label */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        right: '4px',
        fontSize: '10px',
        color: '#666',
      }}>
        {row},{col}
      </div>
    </div>
  );
}

export default function GridViewer() {
  const [selectedArea, setSelectedArea] = useState(AREAS[0].id);

  const grid = GRIDS[selectedArea] || VALLEY_A_GRID;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#1a1a2e',
      color: 'white',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Left Panel - Controls */}
      <div style={{
        width: '200px',
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

        <div style={{
          fontSize: '12px',
          color: '#888',
          lineHeight: 1.6,
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              background: '#88ff88',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Gate (open direction)
          </div>
          <p>Green bars show which directions have gates connecting to adjacent stages.</p>
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

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '0.5rem',
        }}>
          Grid Viewer
        </h1>
        <p style={{
          color: '#888',
          marginBottom: '2rem',
        }}>
          {AREAS.find(a => a.id === selectedArea)?.label} - 5x5 Stage Layout
        </p>

        {/* Compass */}
        <div style={{
          marginBottom: '1rem',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
        }}>
          <div>N</div>
          <div>W ← → E</div>
          <div>S</div>
        </div>

        {/* Grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          background: '#111',
          padding: '2px',
          borderRadius: '8px',
        }}>
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', gap: '2px' }}>
              {row.map((cell, colIndex) => (
                <StageCell key={colIndex} cell={cell} row={rowIndex} col={colIndex} />
              ))}
            </div>
          ))}
        </div>

        {/* Row/Col labels */}
        <div style={{
          marginTop: '1rem',
          fontSize: '12px',
          color: '#666',
        }}>
          Row 0 = North, Row 4 = South | Col 0 = West, Col 4 = East
        </div>
      </div>
    </div>
  );
}
