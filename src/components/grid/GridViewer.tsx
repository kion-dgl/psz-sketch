import { useState, useEffect, useCallback } from 'react';
import valleyConfigs from '../../../docs/valley-configs.json';

// Types for stage config
interface GateConfig {
  edge: string;
  x: number;
  z: number;
  scale: number;
  animated: boolean;
}

interface StageConfig {
  gridSize: number;
  gridOffset: number[];
  gates: GateConfig[];
  spawnPoints: unknown[];
  triggers: unknown[];
}

type ValleyConfigs = Record<string, StageConfig>;

// Parse stage configs
const configs = valleyConfigs as unknown as ValleyConfigs;

// Group stages by area (a, b, e)
const stagesByArea: Record<string, string[]> = {
  a: Object.keys(configs).filter(k => k.startsWith('s01a_')),
  b: Object.keys(configs).filter(k => k.startsWith('s01b_')),
  e: Object.keys(configs).filter(k => k.startsWith('s01e_')),
};

// Get gate directions for a stage
function getGateDirections(stageName: string): Set<string> {
  const config = configs[stageName];
  if (!config) return new Set();
  return new Set(config.gates.map(g => g.edge));
}

// Filter stages by required gates
function getStagesWithGates(
  area: string,
  required: { north?: boolean; south?: boolean; east?: boolean; west?: boolean }
): string[] {
  const stages = stagesByArea[area] || [];
  return stages.filter(stage => {
    const gates = getGateDirections(stage);
    if (required.north && !gates.has('north')) return false;
    if (required.south && !gates.has('south')) return false;
    if (required.east && !gates.has('east')) return false;
    if (required.west && !gates.has('west')) return false;
    return true;
  });
}

// Cell in the grid
interface GridCell {
  stageName: string | null;
  isKeyGate: boolean;
  hasKey: boolean;
  keyForCell: [number, number] | null;
  isStart: boolean;
  isEnd: boolean;
}

// Generation parameters
interface GenParams {
  gridSize: number;
  usedCells: number;
  keyGates: number;
}

// Generation result
interface GenerationResult {
  grid: GridCell[][];
  startCell: [number, number] | null;
  endCell: [number, number] | null;
}

// Generate a random grid layout with constraints
function generateGrid(area: string, params: GenParams, maxAttempts = 50): GenerationResult {
  const { gridSize, usedCells, keyGates } = params;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGenerateGrid(area, gridSize, usedCells, keyGates);
    if (result) return result;
  }

  // Fallback: return empty grid
  return {
    grid: Array(gridSize).fill(null).map(() =>
      Array(gridSize).fill(null).map(() => ({
        stageName: null,
        isKeyGate: false,
        hasKey: false,
        keyForCell: null,
        isStart: false,
        isEnd: false,
      }))
    ),
    startCell: null,
    endCell: null,
  };
}

function tryGenerateGrid(
  area: string,
  gridSize: number,
  usedCells: number,
  keyGates: number
): GenerationResult | null {
  // Initialize empty grid
  const grid: GridCell[][] = Array(gridSize).fill(null).map(() =>
    Array(gridSize).fill(null).map(() => ({
      stageName: null,
      isKeyGate: false,
      hasKey: false,
      keyForCell: null,
      isStart: false,
      isEnd: false,
    }))
  );

  // Start from center
  const center = Math.floor(gridSize / 2);
  const visited = new Set<string>();
  const frontier: [number, number][] = [[center, center]];
  const placedCells: [number, number][] = [];

  while (placedCells.length < usedCells && frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const [row, col] = frontier.splice(idx, 1)[0];
    const key = `${row},${col}`;

    if (visited.has(key)) continue;
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) continue;

    visited.add(key);

    // Determine required gates based on placed neighbors
    const required: { north?: boolean; south?: boolean; east?: boolean; west?: boolean } = {};
    if (row > 0 && grid[row - 1][col].stageName) required.north = true;
    if (row < gridSize - 1 && grid[row + 1][col].stageName) required.south = true;
    if (col > 0 && grid[row][col - 1].stageName) required.west = true;
    if (col < gridSize - 1 && grid[row][col + 1].stageName) required.east = true;

    // Find valid stages that have the required gates
    const candidates = getStagesWithGates(area, required);

    if (candidates.length === 0) continue;

    // Pick random stage
    const stageName = candidates[Math.floor(Math.random() * candidates.length)];
    grid[row][col].stageName = stageName;

    placedCells.push([row, col]);

    // Add neighbors to frontier based on gates
    const gates = getGateDirections(stageName);
    if (gates.has('north') && row > 0) frontier.push([row - 1, col]);
    if (gates.has('south') && row < gridSize - 1) frontier.push([row + 1, col]);
    if (gates.has('west') && col > 0) frontier.push([row, col - 1]);
    if (gates.has('east') && col < gridSize - 1) frontier.push([row, col + 1]);
  }

  if (placedCells.length < 2) return null;

  // Find orphan gates (gates that don't connect to another cell)
  const orphanCells: { cell: [number, number]; direction: string }[] = [];

  for (const [row, col] of placedCells) {
    const stageName = grid[row][col].stageName;
    if (!stageName) continue;

    const gates = getGateDirections(stageName);

    for (const gate of gates) {
      let isOrphan = false;

      if (gate === 'north' && (row === 0 || !grid[row - 1][col].stageName)) isOrphan = true;
      if (gate === 'south' && (row === gridSize - 1 || !grid[row + 1][col].stageName)) isOrphan = true;
      if (gate === 'west' && (col === 0 || !grid[row][col - 1].stageName)) isOrphan = true;
      if (gate === 'east' && (col === gridSize - 1 || !grid[row][col + 1].stageName)) isOrphan = true;

      if (isOrphan) {
        orphanCells.push({ cell: [row, col], direction: gate });
      }
    }
  }

  // Need exactly 2 orphan gates: one start, one end
  if (orphanCells.length !== 2) return null;

  // Assign start and end
  // Prefer south-facing orphan as start (entry), north-facing as end (exit)
  let startIdx = orphanCells.findIndex(o => o.direction === 'south');
  if (startIdx === -1) startIdx = 0;
  const endIdx = startIdx === 0 ? 1 : 0;

  const startCell = orphanCells[startIdx].cell;
  const endCell = orphanCells[endIdx].cell;

  grid[startCell[0]][startCell[1]].isStart = true;
  grid[endCell[0]][endCell[1]].isEnd = true;

  // Place key-gates and keys (not on start/end cells)
  const availableCells = placedCells.filter(([r, c]) =>
    !grid[r][c].isStart && !grid[r][c].isEnd
  );

  if (keyGates > 0 && availableCells.length >= keyGates * 2) {
    const shuffled = [...availableCells].sort(() => Math.random() - 0.5);
    for (let i = 0; i < keyGates && i * 2 + 1 < shuffled.length; i++) {
      const [gateRow, gateCol] = shuffled[i * 2];
      const [keyRow, keyCol] = shuffled[i * 2 + 1];
      grid[gateRow][gateCol].isKeyGate = true;
      grid[keyRow][keyCol].hasKey = true;
      grid[keyRow][keyCol].keyForCell = [gateRow, gateCol];
    }
  }

  return { grid, startCell, endCell };
}

// Get gate color based on cell state
function getGateColor(cell: GridCell, direction: string): string {
  // Key-gates have purple gates
  if (cell.isKeyGate) return '#ff66ff';
  // Normal gates are green
  return '#88ff88';
}

// Cell display component
function GridCellDisplay({ cell, row, col }: { cell: GridCell; row: number; col: number }) {
  if (!cell.stageName) {
    return (
      <div style={{
        width: '120px',
        height: '120px',
        background: '#1a1a2e',
        border: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#333',
        fontSize: '10px',
      }}>
        {row},{col}
      </div>
    );
  }

  const gates = getGateDirections(cell.stageName);
  const config = configs[cell.stageName];

  // Determine background color
  let bgColor = '#2a2a4a';
  let borderColor = '#444';
  let borderWidth = '1px';

  if (cell.isStart) {
    bgColor = '#2a4a6a';
    borderColor = '#66aaff';
    borderWidth = '2px';
  } else if (cell.isEnd) {
    bgColor = '#6a4a2a';
    borderColor = '#ffaa66';
    borderWidth = '2px';
  }

  return (
    <div style={{
      width: '120px',
      height: '120px',
      background: bgColor,
      border: `${borderWidth} solid ${borderColor}`,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Start/End label */}
      {cell.isStart && (
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          background: '#66aaff',
          color: '#fff',
          fontSize: '8px',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: 600,
        }}>
          START
        </div>
      )}
      {cell.isEnd && (
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          background: '#ffaa66',
          color: '#fff',
          fontSize: '8px',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: 600,
        }}>
          END
        </div>
      )}

      {/* Key indicator - pink circle */}
      {cell.hasKey && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '16px',
          height: '16px',
          background: '#ff66aa',
          borderRadius: '50%',
          border: '2px solid #fff',
        }} title={`Key for ${cell.keyForCell?.[0]},${cell.keyForCell?.[1]}`} />
      )}

      {/* Stage name */}
      <div style={{
        color: '#fff',
        fontSize: '11px',
        fontWeight: 600,
        textAlign: 'center',
      }}>
        {cell.stageName.replace('s01a_', '').replace('s01b_', '').replace('s01e_', '')}
      </div>

      {/* Grid size */}
      <div style={{
        color: '#888',
        fontSize: '9px',
        marginTop: '2px',
      }}>
        {config?.gridSize || '?'}
      </div>

      {/* North gate */}
      {gates.has('north') && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '6px',
          background: getGateColor(cell, 'north'),
          borderRadius: '0 0 3px 3px',
        }} title={`North: x=${config?.gates.find(g => g.edge === 'north')?.x}`} />
      )}

      {/* South gate */}
      {gates.has('south') && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '6px',
          background: getGateColor(cell, 'south'),
          borderRadius: '3px 3px 0 0',
        }} title={`South: x=${config?.gates.find(g => g.edge === 'south')?.x}`} />
      )}

      {/* East gate */}
      {gates.has('east') && (
        <div style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '24px',
          background: getGateColor(cell, 'east'),
          borderRadius: '3px 0 0 3px',
        }} title={`East: z=${config?.gates.find(g => g.edge === 'east')?.z}`} />
      )}

      {/* West gate */}
      {gates.has('west') && (
        <div style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '24px',
          background: getGateColor(cell, 'west'),
          borderRadius: '0 3px 3px 0',
        }} title={`West: z=${config?.gates.find(g => g.edge === 'west')?.z}`} />
      )}

      {/* Coordinate label */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        right: '4px',
        fontSize: '9px',
        color: '#666',
      }}>
        {row},{col}
      </div>
    </div>
  );
}

export default function GridViewer() {
  const [area, setArea] = useState<'a' | 'b'>('a');
  const [params, setParams] = useState<GenParams>({
    gridSize: 5,
    usedCells: 12,
    keyGates: 2,
  });
  const [result, setResult] = useState<GenerationResult>({ grid: [], startCell: null, endCell: null });
  const [seed, setSeed] = useState(0);

  const regenerate = useCallback(() => {
    setSeed(s => s + 1);
  }, []);

  useEffect(() => {
    setResult(generateGrid(area, params));
  }, [area, params, seed]);

  const placedCount = result.grid.flat().filter(c => c.stageName).length;

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
        width: '220px',
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
            Area
          </div>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as 'a' | 'b')}
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
            <option value="a">Valley A ({stagesByArea.a.length} stages)</option>
            <option value="b">Valley B ({stagesByArea.b.length} stages)</option>
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
            Grid Size
          </div>
          <input
            type="number"
            min={3}
            max={7}
            value={params.gridSize}
            onChange={(e) => setParams(p => ({ ...p, gridSize: parseInt(e.target.value) || 5 }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#2a2a4a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
          }}>
            Used Cells
          </div>
          <input
            type="number"
            min={2}
            max={params.gridSize * params.gridSize}
            value={params.usedCells}
            onChange={(e) => setParams(p => ({ ...p, usedCells: parseInt(e.target.value) || 12 }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#2a2a4a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
          }}>
            Key-Gates
          </div>
          <input
            type="number"
            min={0}
            max={5}
            value={params.keyGates}
            onChange={(e) => setParams(p => ({ ...p, keyGates: parseInt(e.target.value) || 0 }))}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#2a2a4a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>

        <button
          onClick={regenerate}
          style={{
            padding: '12px 16px',
            background: '#5588ff',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6699ff'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#5588ff'}
        >
          Regenerate
        </button>

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
              background: '#66aaff',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Start Cell
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              background: '#ffaa66',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            End Cell
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '20px',
              height: '6px',
              background: '#88ff88',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Gate
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '20px',
              height: '6px',
              background: '#ff66ff',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Key-Gate
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              background: '#ff66aa',
              borderRadius: '50%',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Key
          </div>
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
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a4a'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
        overflow: 'auto',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '0.5rem',
        }}>
          Grid Generator
        </h1>
        <p style={{
          color: '#888',
          marginBottom: '2rem',
        }}>
          Valley {area.toUpperCase()} - {params.gridSize}x{params.gridSize} grid, {params.usedCells} cells, {params.keyGates} key-gates
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
          {result.grid.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', gap: '2px' }}>
              {row.map((cell, colIndex) => (
                <GridCellDisplay key={colIndex} cell={cell} row={rowIndex} col={colIndex} />
              ))}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          marginTop: '1.5rem',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
        }}>
          Placed: {placedCount} stages
          {result.startCell && ` | Start: ${result.startCell[0]},${result.startCell[1]}`}
          {result.endCell && ` | End: ${result.endCell[0]},${result.endCell[1]}`}
        </div>
      </div>
    </div>
  );
}
