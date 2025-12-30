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
type Direction = 'north' | 'south' | 'east' | 'west';
type Rotation = 0 | 90 | 180 | 270;

// Parse stage configs
const configs = valleyConfigs as unknown as ValleyConfigs;

// Group stages by area (a, b, e)
const stagesByArea: Record<string, string[]> = {
  a: Object.keys(configs).filter(k => k.startsWith('s01a_')),
  b: Object.keys(configs).filter(k => k.startsWith('s01b_')),
  e: Object.keys(configs).filter(k => k.startsWith('s01e_')),
};

// Get original gate directions for a stage (before rotation)
function getOriginalGates(stageName: string): Set<Direction> {
  const config = configs[stageName];
  if (!config) return new Set();
  return new Set(config.gates.map(g => g.edge as Direction));
}

// Rotate a direction by given degrees (clockwise)
function rotateDirection(dir: Direction, rotation: Rotation): Direction {
  const dirs: Direction[] = ['north', 'east', 'south', 'west'];
  const idx = dirs.indexOf(dir);
  const newIdx = (idx + rotation / 90) % 4;
  return dirs[newIdx];
}

// Get opposite direction
function oppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
  };
  return opposites[dir];
}

// Get rotated gate directions
function getRotatedGates(stageName: string, rotation: Rotation): Set<Direction> {
  const original = getOriginalGates(stageName);
  const rotated = new Set<Direction>();
  for (const gate of original) {
    rotated.add(rotateDirection(gate, rotation));
  }
  return rotated;
}

// Cell in the grid
interface GridCell {
  stageName: string | null;
  rotation: Rotation;
  entryDirection: Direction | null; // Where we came from (open, no gate)
  isKeyGate: boolean;
  keyGateDirection: Direction | null; // Which exit has the key-gate
  hasKey: boolean;
  keyForCell: [number, number] | null;
  isStart: boolean;
  isEnd: boolean;
  pathOrder: number; // Order in traversal path
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
  path: [number, number][]; // Ordered path through the grid
}

// Get neighbor position in a direction
function getNeighbor(row: number, col: number, dir: Direction): [number, number] {
  switch (dir) {
    case 'north': return [row - 1, col];
    case 'south': return [row + 1, col];
    case 'east': return [row, col + 1];
    case 'west': return [row, col - 1];
  }
}

// Check if position is valid in grid
function isValidPos(row: number, col: number, gridSize: number): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

// Find all rotations that make a stage fit requirements
function findValidRotations(
  stageName: string,
  requiredEntry: Direction | null, // Must NOT have a gate here (entry point)
  requiredExits: Direction[] // Must have gates here
): Rotation[] {
  const validRotations: Rotation[] = [];

  for (const rotation of [0, 90, 180, 270] as Rotation[]) {
    const gates = getRotatedGates(stageName, rotation);

    // Entry direction must NOT have a gate (we came from there)
    if (requiredEntry && gates.has(requiredEntry)) continue;

    // Must have gates in all required exit directions
    let hasAllExits = true;
    for (const exit of requiredExits) {
      if (!gates.has(exit)) {
        hasAllExits = false;
        break;
      }
    }
    if (!hasAllExits) continue;

    validRotations.push(rotation);
  }

  return validRotations;
}

// Create empty cell
function emptyCell(): GridCell {
  return {
    stageName: null,
    rotation: 0,
    entryDirection: null,
    isKeyGate: false,
    keyGateDirection: null,
    hasKey: false,
    keyForCell: null,
    isStart: false,
    isEnd: false,
    pathOrder: -1,
  };
}

// Generate a random grid layout with constraints
function generateGrid(area: string, params: GenParams, maxAttempts = 100): GenerationResult {
  const { gridSize, usedCells, keyGates } = params;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGenerateGrid(area, gridSize, usedCells, keyGates);
    if (result) return result;
  }

  // Fallback: return empty grid
  return {
    grid: Array(gridSize).fill(null).map(() => Array(gridSize).fill(null).map(emptyCell)),
    startCell: null,
    endCell: null,
    path: [],
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
    Array(gridSize).fill(null).map(emptyCell)
  );

  const path: [number, number][] = [];
  const prefix = area === 'a' ? 's01a_' : area === 'b' ? 's01b_' : 's01e_';
  const startStageName = `${prefix}sa1`;

  // Check if start stage exists
  if (!configs[startStageName]) {
    return null;
  }

  // Start position: bottom center of grid, entering from south (outside)
  const startRow = gridSize - 1;
  const startCol = Math.floor(gridSize / 2);

  // sa1 has only a south gate, we enter from "outside" (south)
  // So the exit is south, but wait - that doesn't make sense for grid layout
  // Actually: sa1's south gate leads to the next area
  // In grid terms: we're at bottom, exit north into the grid
  // But sa1 only has south gate... let me think about this differently

  // sa1 is the START - you spawn there and exit through its gate
  // If sa1 has a south gate, that means you exit to the south
  // So in the grid, sa1 should be at top, and you go down (south)

  // Let's place sa1 at top-center, exiting south
  const sa1Row = 0;
  const sa1Col = Math.floor(gridSize / 2);

  // Get sa1's gates
  const sa1Gates = getOriginalGates(startStageName);
  if (sa1Gates.size !== 1) {
    // sa1 should have exactly 1 gate
    return null;
  }
  const sa1ExitDir = [...sa1Gates][0];

  // Find rotation to make sa1's exit point in a useful direction
  // We want to build the grid going down (south) ideally
  // So find rotation that puts the exit south
  let sa1Rotation: Rotation = 0;
  for (const rot of [0, 90, 180, 270] as Rotation[]) {
    const rotatedExit = rotateDirection(sa1ExitDir, rot);
    // Prefer south, but accept any direction that stays in grid
    const [nr, nc] = getNeighbor(sa1Row, sa1Col, rotatedExit);
    if (isValidPos(nr, nc, gridSize)) {
      sa1Rotation = rot;
      if (rotatedExit === 'south') break; // Prefer south
    }
  }

  const sa1RotatedGates = getRotatedGates(startStageName, sa1Rotation);
  const sa1Exit = [...sa1RotatedGates][0];

  // Place start cell
  grid[sa1Row][sa1Col] = {
    stageName: startStageName,
    rotation: sa1Rotation,
    entryDirection: null, // No entry - this is where you spawn
    isKeyGate: false,
    keyGateDirection: null,
    hasKey: false,
    keyForCell: null,
    isStart: true,
    isEnd: false,
    pathOrder: 0,
  };
  path.push([sa1Row, sa1Col]);

  // BFS to build the path
  // Each step: we have a current position and entry direction
  // We need to find the exit directions and pick one to continue
  interface FrontierItem {
    row: number;
    col: number;
    entryDir: Direction; // Direction we're entering FROM
  }

  const [nextRow, nextCol] = getNeighbor(sa1Row, sa1Col, sa1Exit);
  if (!isValidPos(nextRow, nextCol, gridSize)) {
    return null;
  }

  const frontier: FrontierItem[] = [{
    row: nextRow,
    col: nextCol,
    entryDir: oppositeDirection(sa1Exit), // If we exited south, we enter from north
  }];

  const allStages = stagesByArea[area] || [];
  // Exclude sa1 from candidates for other cells
  const candidateStages = allStages.filter(s => !s.endsWith('_sa1'));

  while (path.length < usedCells && frontier.length > 0) {
    // Pick from frontier (prefer first for more linear paths)
    const idx = Math.floor(Math.random() * Math.min(3, frontier.length));
    const { row, col, entryDir } = frontier.splice(idx, 1)[0];

    if (grid[row][col].stageName) continue; // Already placed

    // Determine which directions we CAN exit to (adjacent empty cells in grid)
    const possibleExits: Direction[] = [];
    for (const dir of ['north', 'south', 'east', 'west'] as Direction[]) {
      if (dir === entryDir) continue; // Can't exit back where we came from
      const [nr, nc] = getNeighbor(row, col, dir);
      if (isValidPos(nr, nc, gridSize) && !grid[nr][nc].stageName) {
        possibleExits.push(dir);
      }
    }

    // If this is potentially the last cell, we don't need exits
    const needsExit = path.length < usedCells - 1;

    // Find stages that can fit here
    const validCandidates: { stage: string; rotation: Rotation; exits: Direction[] }[] = [];

    for (const stage of candidateStages) {
      for (const rotation of [0, 90, 180, 270] as Rotation[]) {
        const rotatedGates = getRotatedGates(stage, rotation);

        // Must HAVE gate at entry direction (that's how we connect to previous cell)
        if (!rotatedGates.has(entryDir)) continue;

        // Collect which exits this stage+rotation would have (gates other than entry)
        const stageExits: Direction[] = [];
        for (const gate of rotatedGates) {
          if (gate === entryDir) continue; // Entry gate doesn't count as exit
          const [nr, nc] = getNeighbor(row, col, gate);
          if (isValidPos(nr, nc, gridSize) && !grid[nr][nc].stageName) {
            stageExits.push(gate);
          } else if (!isValidPos(nr, nc, gridSize) && path.length >= usedCells - 1) {
            // Gate outside grid is OK as end exit
            stageExits.push(gate);
          }
        }

        if (needsExit && stageExits.length === 0) continue;

        validCandidates.push({ stage, rotation, exits: stageExits });
      }
    }

    if (validCandidates.length === 0) continue;

    // Pick a random valid candidate
    const chosen = validCandidates[Math.floor(Math.random() * validCandidates.length)];

    // Place the cell
    grid[row][col] = {
      stageName: chosen.stage,
      rotation: chosen.rotation,
      entryDirection: entryDir,
      isKeyGate: false,
      keyGateDirection: null,
      hasKey: false,
      keyForCell: null,
      isStart: false,
      isEnd: false,
      pathOrder: path.length,
    };
    path.push([row, col]);

    // Add exits to frontier
    for (const exitDir of chosen.exits) {
      const [nr, nc] = getNeighbor(row, col, exitDir);
      if (isValidPos(nr, nc, gridSize) && !grid[nr][nc].stageName) {
        frontier.push({
          row: nr,
          col: nc,
          entryDir: oppositeDirection(exitDir),
        });
      }
    }
  }

  if (path.length < 2) return null;

  // Find end cell (last in path)
  const [endRow, endCol] = path[path.length - 1];
  grid[endRow][endCol].isEnd = true;

  // Validate: only reject gates leading OUTSIDE the grid (except for end cell)
  // Gates leading to empty cells within the grid are allowed for now
  for (const [row, col] of path) {
    const cell = grid[row][col];
    if (!cell.stageName) continue;

    const gates = getRotatedGates(cell.stageName, cell.rotation);
    for (const gate of gates) {
      const [nr, nc] = getNeighbor(row, col, gate);
      // Gates outside grid are only OK for end cell
      if (!isValidPos(nr, nc, gridSize) && !cell.isEnd) {
        return null;
      }
    }
  }

  // Place key-gates and keys with reachability constraint
  if (keyGates > 0) {
    // Available cells for key-gates (not start, not first few cells)
    const keyGateCandidates = path.slice(3).filter(([r, c]) => !grid[r][c].isEnd);
    // Available cells for keys (cells before the key-gate)

    const shuffledGateCells = [...keyGateCandidates].sort(() => Math.random() - 0.5);

    let placed = 0;
    for (const [gateRow, gateCol] of shuffledGateCells) {
      if (placed >= keyGates) break;

      const gateCell = grid[gateRow][gateCol];
      const gatePathOrder = gateCell.pathOrder;

      // Find cells before this one that can have the key
      const keyCandidates = path.filter(([r, c]) => {
        const cell = grid[r][c];
        return cell.pathOrder < gatePathOrder &&
               cell.pathOrder > 0 && // Not start
               !cell.hasKey && // Doesn't already have a key
               !cell.isKeyGate;
      });

      if (keyCandidates.length === 0) continue;

      // Pick random key location
      const [keyRow, keyCol] = keyCandidates[Math.floor(Math.random() * keyCandidates.length)];

      // Find which gate direction to lock
      const gates = getRotatedGates(gateCell.stageName!, gateCell.rotation);
      const exitGates = [...gates].filter(g => g !== gateCell.entryDirection);
      if (exitGates.length === 0) continue;

      const lockedDir = exitGates[Math.floor(Math.random() * exitGates.length)];

      gateCell.isKeyGate = true;
      gateCell.keyGateDirection = lockedDir;
      grid[keyRow][keyCol].hasKey = true;
      grid[keyRow][keyCol].keyForCell = [gateRow, gateCol];

      placed++;
    }
  }

  return {
    grid,
    startCell: [sa1Row, sa1Col],
    endCell: [endRow, endCol],
    path,
  };
}

// Get gate display color
function getGateColor(
  cell: GridCell,
  direction: Direction,
  isEntry: boolean
): string {
  if (isEntry) return '#ffffff'; // White for entry (open)
  if (cell.isKeyGate && cell.keyGateDirection === direction) return '#ff66ff'; // Purple for key-gate
  return '#88ff88'; // Green for normal gate
}

// Cell display component
function GridCellDisplay({
  cell,
  row,
  col,
}: {
  cell: GridCell;
  row: number;
  col: number;
}) {
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

  const gates = getRotatedGates(cell.stageName, cell.rotation);
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

  // Directions with openings (entry or gates)
  const hasNorth = gates.has('north') || cell.entryDirection === 'north';
  const hasSouth = gates.has('south') || cell.entryDirection === 'south';
  const hasEast = gates.has('east') || cell.entryDirection === 'east';
  const hasWest = gates.has('west') || cell.entryDirection === 'west';

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

      {/* Rotation indicator */}
      {cell.rotation !== 0 && (
        <div style={{
          color: '#666',
          fontSize: '8px',
          marginTop: '1px',
        }}>
          R{cell.rotation}°
        </div>
      )}

      {/* Path order */}
      <div style={{
        color: '#888',
        fontSize: '9px',
        marginTop: '2px',
      }}>
        #{cell.pathOrder}
      </div>

      {/* North opening */}
      {hasNorth && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '6px',
          background: getGateColor(cell, 'north', cell.entryDirection === 'north'),
          borderRadius: '0 0 3px 3px',
        }} title={cell.entryDirection === 'north' ? 'Entry (open)' : 'Gate'} />
      )}

      {/* South opening */}
      {hasSouth && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '6px',
          background: getGateColor(cell, 'south', cell.entryDirection === 'south'),
          borderRadius: '3px 3px 0 0',
        }} title={cell.entryDirection === 'south' ? 'Entry (open)' : 'Gate'} />
      )}

      {/* East opening */}
      {hasEast && (
        <div style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '24px',
          background: getGateColor(cell, 'east', cell.entryDirection === 'east'),
          borderRadius: '3px 0 0 3px',
        }} title={cell.entryDirection === 'east' ? 'Entry (open)' : 'Gate'} />
      )}

      {/* West opening */}
      {hasWest && (
        <div style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '24px',
          background: getGateColor(cell, 'west', cell.entryDirection === 'west'),
          borderRadius: '0 3px 3px 0',
        }} title={cell.entryDirection === 'west' ? 'Entry (open)' : 'Gate'} />
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
    usedCells: 8,
    keyGates: 1,
  });
  const [result, setResult] = useState<GenerationResult>({
    grid: [],
    startCell: null,
    endCell: null,
    path: [],
  });
  const [seed, setSeed] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const regenerate = useCallback(() => {
    setSeed(s => s + 1);
  }, []);

  useEffect(() => {
    const genResult = generateGrid(area, params);
    setResult(genResult);
    // Debug info
    const info = `Area: ${area}, Params: ${JSON.stringify(params)}, Path length: ${genResult.path.length}, Start: ${genResult.startCell}, End: ${genResult.endCell}`;
    setDebugInfo(info);
    console.log('Generation result:', genResult);
  }, [area, params, seed]);

  const copyJSON = useCallback(() => {
    const exportData = {
      area,
      params,
      result: {
        path: result.path,
        startCell: result.startCell,
        endCell: result.endCell,
        cells: result.path.map(([r, c]) => {
          const cell = result.grid[r]?.[c];
          return cell ? {
            position: [r, c],
            stageName: cell.stageName,
            rotation: cell.rotation,
            entryDirection: cell.entryDirection,
            isKeyGate: cell.isKeyGate,
            keyGateDirection: cell.keyGateDirection,
            hasKey: cell.hasKey,
            keyForCell: cell.keyForCell,
            isStart: cell.isStart,
            isEnd: cell.isEnd,
            pathOrder: cell.pathOrder,
          } : null;
        }),
      },
      stageConfigs: Object.fromEntries(
        result.path.map(([r, c]) => {
          const cell = result.grid[r]?.[c];
          if (cell?.stageName) {
            return [cell.stageName, configs[cell.stageName]];
          }
          return [null, null];
        }).filter(([k]) => k !== null)
      ),
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      .then(() => {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 2000);
      })
      .catch(() => {
        setCopyStatus('Failed to copy');
        setTimeout(() => setCopyStatus(''), 2000);
      });
  }, [area, params, result]);

  const placedCount = result.path.length;

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
            Path Length
          </div>
          <input
            type="number"
            min={2}
            max={params.gridSize * params.gridSize}
            value={params.usedCells}
            onChange={(e) => setParams(p => ({ ...p, usedCells: parseInt(e.target.value) || 8 }))}
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

        <button
          onClick={copyJSON}
          style={{
            padding: '12px 16px',
            background: '#555588',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#666699'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#555588'}
        >
          {copyStatus || 'Copy JSON'}
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
              background: '#ffffff',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Entry (open)
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
                <GridCellDisplay
                  key={colIndex}
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                />
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
          Path: {placedCount} stages
          {result.startCell && ` | Start: ${result.startCell[0]},${result.startCell[1]}`}
          {result.endCell && ` | End: ${result.endCell[0]},${result.endCell[1]}`}
        </div>

        {/* Path display */}
        {result.path.length > 0 && (
          <div style={{
            marginTop: '1rem',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center',
            maxWidth: '600px',
          }}>
            Path: {result.path.map(([r, c]) => {
              const cell = result.grid[r][c];
              return cell.stageName?.replace('s01a_', '').replace('s01b_', '').replace('s01e_', '');
            }).join(' → ')}
          </div>
        )}

        {/* Debug info */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#222',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#888',
          fontFamily: 'monospace',
          maxWidth: '600px',
          wordBreak: 'break-all',
        }}>
          {debugInfo}
        </div>

        {/* Empty grid message */}
        {result.path.length === 0 && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#442222',
            borderRadius: '8px',
            color: '#ff8888',
            fontSize: '14px',
          }}>
            Generation failed after 100 attempts. Try different parameters or check console for errors.
          </div>
        )}
      </div>
    </div>
  );
}
