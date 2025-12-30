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
  isBranch: boolean; // Dead-end branch off main path
  pathOrder: number; // Order in traversal path
}

// Generation parameters
interface GenParams {
  gridSize: number;
  usedCells: number;
  keyGates: number;
  branches: number; // Number of dead-end branches
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
    isBranch: false,
    pathOrder: -1,
  };
}

// Generate a random grid layout with constraints
function generateGrid(area: string, params: GenParams, maxAttempts = 200): GenerationResult {
  const { gridSize, usedCells, keyGates, branches } = params;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGenerateGrid(area, gridSize, usedCells, keyGates, branches);
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
  keyGates: number,
  branches: number
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

  // Place sa1 at top-center, exiting south
  const sa1Row = 0;
  const sa1Col = Math.floor(gridSize / 2);

  // Get sa1's gates and find a rotation where one gate points south
  const sa1Gates = getOriginalGates(startStageName);
  if (sa1Gates.size === 0) return null;

  // Find rotation where at least one gate points south (into the grid)
  // and other gates don't point to occupied cells
  let sa1Rotation: Rotation = 0;
  let foundValidRotation = false;
  for (const rot of [0, 90, 180, 270] as Rotation[]) {
    const rotatedGates = getRotatedGates(startStageName, rot);
    if (!rotatedGates.has('south')) continue;

    // Check other gates don't create problems (they should point outside grid from row 0)
    let valid = true;
    for (const gate of rotatedGates) {
      if (gate === 'south') continue;
      const [nr, nc] = getNeighbor(sa1Row, sa1Col, gate);
      // From top-center, north goes outside grid (-1), east/west may be inside
      if (isValidPos(nr, nc, gridSize)) {
        // Gate points inside grid - would be orphan since we haven't placed anything yet
        // This is only ok if we're on an edge
        valid = false;
        break;
      }
    }
    if (valid) {
      sa1Rotation = rot;
      foundValidRotation = true;
      break;
    }
  }

  if (!foundValidRotation) return null;

  const sa1Exit = 'south' as Direction;

  // Place start cell
  grid[sa1Row][sa1Col] = {
    stageName: startStageName,
    rotation: sa1Rotation,
    entryDirection: null,
    isKeyGate: false,
    keyGateDirection: null,
    hasKey: false,
    keyForCell: null,
    isStart: true,
    isEnd: false,
    isBranch: false,
    pathOrder: 0,
  };
  path.push([sa1Row, sa1Col]);

  // Build LINEAR path - each step picks exactly one exit
  let currentRow = sa1Row;
  let currentCol = sa1Col;
  let lastExitDir = sa1Exit;

  const allStages = stagesByArea[area] || [];
  const candidateStages = allStages.filter(s => !s.endsWith('_sa1'));

  while (path.length < usedCells) {
    // Move to next cell
    const [nextRow, nextCol] = getNeighbor(currentRow, currentCol, lastExitDir);
    const entryDir = oppositeDirection(lastExitDir);

    if (!isValidPos(nextRow, nextCol, gridSize)) {
      // Can't continue - we've hit the edge
      break;
    }

    if (grid[nextRow][nextCol].stageName) {
      // Cell already occupied - can't continue this direction
      break;
    }

    const isLastCell = path.length === usedCells - 1;

    // Find valid stages for this position
    // For linear path: prefer stages with exactly 2 gates (entry + 1 exit)
    // For end cell: need exactly 2 gates where one exits outside grid
    const validCandidates: { stage: string; rotation: Rotation; exitDir: Direction | null }[] = [];

    for (const stage of candidateStages) {
      for (const rotation of [0, 90, 180, 270] as Rotation[]) {
        const rotatedGates = getRotatedGates(stage, rotation);

        // Must have gate at entry direction
        if (!rotatedGates.has(entryDir)) continue;

        // Get other gates (potential exits)
        const otherGates = [...rotatedGates].filter(g => g !== entryDir);

        if (isLastCell) {
          // End cell: need exactly 1 other gate that goes OUTSIDE the grid
          if (otherGates.length !== 1) continue;
          const exitGate = otherGates[0];
          const [er, ec] = getNeighbor(nextRow, nextCol, exitGate);
          if (isValidPos(er, ec, gridSize)) continue; // Must exit outside
          validCandidates.push({ stage, rotation, exitDir: exitGate });
        } else {
          // Middle cell: need exactly 1 other gate that goes to empty cell inside grid
          // (this ensures linear path with no orphan gates)
          if (otherGates.length !== 1) continue;
          const exitGate = otherGates[0];
          const [er, ec] = getNeighbor(nextRow, nextCol, exitGate);
          if (!isValidPos(er, ec, gridSize)) continue; // Must stay in grid
          if (grid[er][ec].stageName) continue; // Must be empty
          validCandidates.push({ stage, rotation, exitDir: exitGate });
        }
      }
    }

    if (validCandidates.length === 0) {
      // No valid stage found - try to end here if we have enough cells
      if (path.length >= 3) {
        let foundEnd = false;
        // Try to find an end cell stage
        for (const stage of candidateStages) {
          if (foundEnd) break;
          for (const rotation of [0, 90, 180, 270] as Rotation[]) {
            const rotatedGates = getRotatedGates(stage, rotation);
            if (!rotatedGates.has(entryDir)) continue;
            const otherGates = [...rotatedGates].filter(g => g !== entryDir);
            if (otherGates.length !== 1) continue;
            const exitGate = otherGates[0];
            const [er, ec] = getNeighbor(nextRow, nextCol, exitGate);
            if (!isValidPos(er, ec, gridSize)) {
              // Found end cell - mark exit as warp
              grid[nextRow][nextCol] = {
                stageName: stage,
                rotation: rotation,
                entryDirection: entryDir,
                isKeyGate: false,
                keyGateDirection: exitGate, // Reuse for warp direction
                hasKey: false,
                keyForCell: null,
                isStart: false,
                isEnd: true,
                isBranch: false,
                pathOrder: path.length,
              };
              path.push([nextRow, nextCol]);
              foundEnd = true;
              break;
            }
          }
        }
      }
      break;
    }

    // Pick random valid candidate
    const chosen = validCandidates[Math.floor(Math.random() * validCandidates.length)];

    // Place the cell
    grid[nextRow][nextCol] = {
      stageName: chosen.stage,
      rotation: chosen.rotation,
      entryDirection: entryDir,
      isKeyGate: false,
      keyGateDirection: isLastCell ? chosen.exitDir : null, // Warp direction for end cell
      hasKey: false,
      keyForCell: null,
      isStart: false,
      isEnd: isLastCell,
      isBranch: false,
      pathOrder: path.length,
    };
    path.push([nextRow, nextCol]);

    if (isLastCell || !chosen.exitDir) break;

    // Move to next
    currentRow = nextRow;
    currentCol = nextCol;
    lastExitDir = chosen.exitDir;
  }

  if (path.length < 3) return null;

  // Verify last cell is a proper end cell with warp exit
  const [endRow, endCol] = path[path.length - 1];
  const endCell = grid[endRow][endCol];

  // If last cell doesn't have a warp exit, try to replace it with a valid end cell
  if (!endCell.isEnd || !endCell.keyGateDirection) {
    const entryDir = endCell.entryDirection;
    if (!entryDir) return null;

    let foundValidEnd = false;
    for (const stage of candidateStages) {
      if (foundValidEnd) break;
      for (const rotation of [0, 90, 180, 270] as Rotation[]) {
        const rotatedGates = getRotatedGates(stage, rotation);
        if (!rotatedGates.has(entryDir)) continue;

        // Find a gate that exits outside the grid (warp)
        let warpDir: Direction | null = null;
        let hasOrphan = false;
        for (const gate of rotatedGates) {
          if (gate === entryDir) continue;
          const [nr, nc] = getNeighbor(endRow, endCol, gate);
          if (!isValidPos(nr, nc, gridSize)) {
            warpDir = gate;
          } else if (grid[nr][nc].stageName) {
            // Gate points to occupied cell without matching gate - orphan
            const neighborGates = getRotatedGates(grid[nr][nc].stageName!, grid[nr][nc].rotation);
            if (!neighborGates.has(oppositeDirection(gate))) {
              hasOrphan = true;
              break;
            }
          }
        }

        if (hasOrphan || !warpDir) continue;

        // Replace end cell with valid end stage
        grid[endRow][endCol] = {
          ...endCell,
          stageName: stage,
          rotation: rotation,
          isEnd: true,
          keyGateDirection: warpDir,
        };
        foundValidEnd = true;
        break;
      }
    }

    if (!foundValidEnd) return null; // Couldn't create valid end cell
  }

  // Add dead-end branches off the main path
  const branchCells: [number, number][] = [];
  if (branches > 0) {
    // Find cells on main path that could have branches
    // We need to find path cells where we can:
    // 1. The cell already has a gate in a direction with an empty adjacent cell, OR
    // 2. We can replace the cell with a 3-gate stage that maintains entry/exit + adds branch
    const branchCandidates: {
      pathCell: [number, number];
      branchDir: Direction;
      branchPos: [number, number];
      needsReplacement: boolean;
      replacementStage?: string;
      replacementRotation?: Rotation;
    }[] = [];

    for (const [pr, pc] of path) {
      const cell = grid[pr][pc];
      if (cell.isStart || cell.isEnd) continue;

      const currentGates = getRotatedGates(cell.stageName!, cell.rotation);

      // Find the exit direction (gate that's not entry)
      const exitDir = [...currentGates].find(g => g !== cell.entryDirection);
      if (!exitDir) continue;

      // Check all 4 directions for potential branch spots
      const directions: Direction[] = ['north', 'south', 'east', 'west'];
      for (const dir of directions) {
        // Skip entry and exit directions
        if (dir === cell.entryDirection) continue;
        if (dir === exitDir) continue;

        const [br, bc] = getNeighbor(pr, pc, dir);
        // Must be inside grid and empty
        if (!isValidPos(br, bc, gridSize)) continue;
        if (grid[br][bc].stageName) continue;

        // Check if current cell already has a gate in this direction
        if (currentGates.has(dir)) {
          // Great! Can branch without replacement
          branchCandidates.push({
            pathCell: [pr, pc],
            branchDir: dir,
            branchPos: [br, bc],
            needsReplacement: false,
          });
        } else {
          // Need to find a replacement stage with 3 gates: entry + exit + branch
          for (const stage of candidateStages) {
            let found = false;
            for (const rotation of [0, 90, 180, 270] as Rotation[]) {
              const rotatedGates = getRotatedGates(stage, rotation);

              // Must have gates at entry, exit, AND branch direction
              if (!rotatedGates.has(cell.entryDirection!)) continue;
              if (!rotatedGates.has(exitDir)) continue;
              if (!rotatedGates.has(dir)) continue;

              // Check that any other gates don't create orphans
              let valid = true;
              for (const gate of rotatedGates) {
                if (gate === cell.entryDirection || gate === exitDir || gate === dir) continue;
                const [nr, nc] = getNeighbor(pr, pc, gate);
                // Extra gate must go outside grid or to empty cell
                if (isValidPos(nr, nc, gridSize) && grid[nr][nc].stageName) {
                  valid = false;
                  break;
                }
              }
              if (!valid) continue;

              branchCandidates.push({
                pathCell: [pr, pc],
                branchDir: dir,
                branchPos: [br, bc],
                needsReplacement: true,
                replacementStage: stage,
                replacementRotation: rotation,
              });
              found = true;
              break;
            }
            if (found) break; // Only need one replacement option per direction
          }
        }
      }
    }

    // Shuffle and pick branches
    const shuffledCandidates = [...branchCandidates].sort(() => Math.random() - 0.5);
    let placedBranches = 0;

    for (const candidate of shuffledCandidates) {
      if (placedBranches >= branches) break;

      const { pathCell, branchDir, branchPos, needsReplacement, replacementStage, replacementRotation } = candidate;
      const [pr, pc] = pathCell;
      const [br, bc] = branchPos;

      // Check the cell is still empty (might have been used by another branch)
      if (grid[br][bc].stageName) continue;

      // If replacement needed, update the path cell
      if (needsReplacement && replacementStage && replacementRotation !== undefined) {
        const oldCell = grid[pr][pc];
        grid[pr][pc] = {
          ...oldCell,
          stageName: replacementStage,
          rotation: replacementRotation,
        };
      }

      // Entry direction for the branch cell is opposite of branch direction
      const branchEntry = oppositeDirection(branchDir);

      // Find a stage with exactly 1 gate that can serve as a dead end
      let foundBranch = false;
      const shuffledStages = [...candidateStages].sort(() => Math.random() - 0.5);

      for (const stage of shuffledStages) {
        if (foundBranch) break;
        for (const rotation of [0, 90, 180, 270] as Rotation[]) {
          const rotatedGates = getRotatedGates(stage, rotation);

          // Dead end: exactly 1 gate at the entry direction
          if (rotatedGates.size !== 1) continue;
          if (!rotatedGates.has(branchEntry)) continue;

          // Place the dead-end branch cell
          grid[br][bc] = {
            stageName: stage,
            rotation: rotation,
            entryDirection: branchEntry,
            isKeyGate: false,
            keyGateDirection: null,
            hasKey: false,
            keyForCell: null,
            isStart: false,
            isEnd: false,
            isBranch: true,
            pathOrder: -1, // Not part of main path
          };
          branchCells.push([br, bc]);
          foundBranch = true;
          placedBranches++;
          break;
        }
      }
    }
  }

  // Place key-gates and keys with reachability constraint
  // Prefer placing keys on branch cells to incentivize exploration
  if (keyGates > 0) {
    // Map branch cells to the main path cell they connect to
    const branchToPathOrder: Map<string, number> = new Map();
    for (const [br, bc] of branchCells) {
      const branchCell = grid[br][bc];
      // Find which main path cell this branch connects to
      const entryDir = branchCell.entryDirection;
      if (!entryDir) continue;
      const [pr, pc] = getNeighbor(br, bc, entryDir);
      if (isValidPos(pr, pc, gridSize) && grid[pr][pc].stageName) {
        branchToPathOrder.set(`${br},${bc}`, grid[pr][pc].pathOrder);
      }
    }

    // Available cells for key-gates (not start, not first few cells)
    const keyGateCandidates = path.slice(3).filter(([r, c]) => !grid[r][c].isEnd);

    const shuffledGateCells = [...keyGateCandidates].sort(() => Math.random() - 0.5);

    let placed = 0;
    for (const [gateRow, gateCol] of shuffledGateCells) {
      if (placed >= keyGates) break;

      const gateCell = grid[gateRow][gateCol];
      const gatePathOrder = gateCell.pathOrder;

      // Find main path cells before this one that can have the key
      const mainPathCandidates: [number, number][] = path.filter(([r, c]) => {
        const cell = grid[r][c];
        return cell.pathOrder < gatePathOrder &&
               cell.pathOrder > 0 && // Not start
               !cell.hasKey && // Doesn't already have a key
               !cell.isKeyGate;
      });

      // Find branch cells that are reachable before the key-gate
      const branchKeyCandidates: [number, number][] = branchCells.filter(([br, bc]) => {
        const cell = grid[br][bc];
        if (cell.hasKey) return false; // Already has a key
        const connectedPathOrder = branchToPathOrder.get(`${br},${bc}`);
        // Branch is reachable if the path cell it connects to is before the key-gate
        return connectedPathOrder !== undefined && connectedPathOrder < gatePathOrder;
      });

      // Prefer branch cells (80% chance if available)
      let keyCandidates: [number, number][];
      if (branchKeyCandidates.length > 0 && Math.random() < 0.8) {
        keyCandidates = branchKeyCandidates;
      } else if (mainPathCandidates.length > 0) {
        keyCandidates = mainPathCandidates;
      } else if (branchKeyCandidates.length > 0) {
        keyCandidates = branchKeyCandidates;
      } else {
        continue; // No valid candidates
      }

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

  // Validate all gate connections - every gate must have a matching gate on the neighbor
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = grid[r][c];
      if (!cell.stageName) continue;

      const gates = getRotatedGates(cell.stageName, cell.rotation);
      for (const dir of gates) {
        const [nr, nc] = getNeighbor(r, c, dir);

        // Gates pointing outside grid are OK (warp exits)
        if (!isValidPos(nr, nc, gridSize)) continue;

        const neighbor = grid[nr][nc];
        if (!neighbor.stageName) {
          // Gate points to empty cell - orphan!
          return null;
        }

        // Check neighbor has a gate back
        const neighborGates = getRotatedGates(neighbor.stageName, neighbor.rotation);
        if (!neighborGates.has(oppositeDirection(dir))) {
          // No matching gate - orphan!
          return null;
        }
      }
    }
  }

  // Simulate traversal to verify the grid is completable
  const simVisited = new Set<string>();
  const simKeys = new Set<string>();
  const simQueue: [number, number][] = [[sa1Row, sa1Col]];

  while (simQueue.length > 0) {
    const [r, c] = simQueue.shift()!;
    const key = `${r},${c}`;
    if (simVisited.has(key)) continue;
    simVisited.add(key);

    const cell = grid[r][c];
    if (!cell.stageName) continue;

    // Collect key
    if (cell.hasKey && cell.keyForCell) {
      simKeys.add(`${cell.keyForCell[0]},${cell.keyForCell[1]}`);
    }

    // Explore neighbors
    const gates = getRotatedGates(cell.stageName, cell.rotation);
    for (const dir of gates) {
      // Check if this is a locked key-gate
      if (cell.isKeyGate && cell.keyGateDirection === dir && !simKeys.has(key)) {
        continue; // Can't pass without key
      }

      const [nr, nc] = getNeighbor(r, c, dir);
      if (!isValidPos(nr, nc, gridSize)) continue;

      const neighbor = grid[nr][nc];
      if (!neighbor.stageName) continue;
      if (simVisited.has(`${nr},${nc}`)) continue;

      // Verify neighbor has gate back (already validated above, but double-check)
      const neighborGates = getRotatedGates(neighbor.stageName, neighbor.rotation);
      if (!neighborGates.has(oppositeDirection(dir))) continue;

      simQueue.push([nr, nc]);
    }
  }

  // Check if we reached the end
  if (!simVisited.has(`${endRow},${endCol}`)) {
    return null; // Can't reach the end - invalid grid
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
  if (cell.isKeyGate && cell.keyGateDirection === direction) return '#ff66ff'; // Pink for key-gate
  if (cell.isEnd && cell.keyGateDirection === direction) return '#aa66ff'; // Purple for warp exit
  return '#88ff88'; // Green for normal gate
}

// Cell display component
function GridCellDisplay({
  cell,
  row,
  col,
  isCurrent,
  isVisited,
  keyCollected,
}: {
  cell: GridCell;
  row: number;
  col: number;
  isCurrent?: boolean;
  isVisited?: boolean;
  keyCollected?: boolean;
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

  if (isCurrent) {
    bgColor = '#4a6a2a';
    borderColor = '#88ff44';
    borderWidth = '3px';
  } else if (isVisited) {
    bgColor = '#3a3a5a';
    borderColor = '#668866';
    borderWidth = '2px';
  } else if (cell.isStart) {
    bgColor = '#2a4a6a';
    borderColor = '#66aaff';
    borderWidth = '2px';
  } else if (cell.isEnd) {
    bgColor = '#6a4a2a';
    borderColor = '#ffaa66';
    borderWidth = '2px';
  } else if (cell.isBranch) {
    bgColor = '#2a4a4a';
    borderColor = '#66aaaa';
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

      {/* Key indicator - pink circle (grayed out if collected) */}
      {cell.hasKey && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '16px',
          height: '16px',
          background: keyCollected ? '#666' : '#ff66aa',
          borderRadius: '50%',
          border: `2px solid ${keyCollected ? '#888' : '#fff'}`,
          opacity: keyCollected ? 0.5 : 1,
        }} title={`Key for ${cell.keyForCell?.[0]},${cell.keyForCell?.[1]}${keyCollected ? ' (collected)' : ''}`} />
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

// Simulation state type
interface SimState {
  running: boolean;
  currentCell: [number, number] | null;
  visitedCells: Set<string>;
  keysCollected: Set<string>;
  gatesUnlocked: Set<string>;
  status: 'idle' | 'running' | 'success' | 'failed';
  message: string;
}

export default function GridViewer() {
  const [area, setArea] = useState<'a' | 'b'>('a');
  const [params, setParams] = useState<GenParams>({
    gridSize: 5,
    usedCells: 8,
    keyGates: 1,
    branches: 2,
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

  // Simulation state
  const [sim, setSim] = useState<SimState>({
    running: false,
    currentCell: null,
    visitedCells: new Set(),
    keysCollected: new Set(),
    gatesUnlocked: new Set(),
    status: 'idle',
    message: '',
  });

  const regenerate = useCallback(() => {
    setSeed(s => s + 1);
    setSim({ running: false, currentCell: null, visitedCells: new Set(), keysCollected: new Set(), gatesUnlocked: new Set(), status: 'idle', message: '' });
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

  // Short-form copy with minimal info
  const copyShortJSON = useCallback(() => {
    // Collect all cells (main path + branches)
    const allCells: { row: number; col: number; cell: GridCell }[] = [];
    for (let r = 0; r < result.grid.length; r++) {
      for (let c = 0; c < result.grid[r].length; c++) {
        const cell = result.grid[r][c];
        if (cell.stageName) {
          allCells.push({ row: r, col: c, cell });
        }
      }
    }

    const shortData = allCells.map(({ row, col, cell }) => {
      const gates = cell.stageName ? [...getRotatedGates(cell.stageName, cell.rotation)] : [];
      const entry: Record<string, unknown> = {
        pos: `${row},${col}`,
        stage: cell.stageName?.replace(/^s01[abe]_/, ''),
        gates: gates.map(g => g[0].toUpperCase()).join(''), // N, S, E, W
      };
      if (cell.isStart) entry.start = true;
      if (cell.isEnd) entry.end = true;
      if (cell.isBranch) entry.branch = true;
      if (cell.hasKey) entry.key = true;
      if (cell.isKeyGate) entry.keyGate = cell.keyGateDirection?.[0].toUpperCase();
      if (cell.isEnd && cell.keyGateDirection) entry.warp = cell.keyGateDirection[0].toUpperCase();
      return entry;
    });

    navigator.clipboard.writeText(JSON.stringify(shortData, null, 2))
      .then(() => {
        setCopyStatus('Short copied!');
        setTimeout(() => setCopyStatus(''), 2000);
      })
      .catch(() => {
        setCopyStatus('Failed');
        setTimeout(() => setCopyStatus(''), 2000);
      });
  }, [result]);

  // Simulation logic - animated traversal
  const runSimulation = useCallback(() => {
    if (!result.startCell || result.grid.length === 0) return;

    const visited = new Set<string>();
    const keysCollected = new Set<string>();
    const gatesUnlocked = new Set<string>();
    const toVisit: [number, number][] = [result.startCell];
    const visitOrder: [number, number][] = [];

    // BFS to find all reachable cells, collecting keys and unlocking gates
    while (toVisit.length > 0) {
      const [r, c] = toVisit.shift()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      visitOrder.push([r, c]);

      const cell = result.grid[r]?.[c];
      if (!cell?.stageName) continue;

      // Collect key if present
      if (cell.hasKey && cell.keyForCell) {
        keysCollected.add(`${cell.keyForCell[0]},${cell.keyForCell[1]}`);
        // Unlock the corresponding gate
        gatesUnlocked.add(`${cell.keyForCell[0]},${cell.keyForCell[1]}`);
      }

      // Find adjacent cells we can move to
      const gates = getRotatedGates(cell.stageName, cell.rotation);
      for (const dir of gates) {
        const [nr, nc] = getNeighbor(r, c, dir);
        if (!isValidPos(nr, nc, params.gridSize)) continue;
        const neighborKey = `${nr},${nc}`;
        if (visited.has(neighborKey)) continue;

        const neighbor = result.grid[nr]?.[nc];
        if (!neighbor?.stageName) continue;

        // Check if neighbor has a gate back to us
        const neighborGates = getRotatedGates(neighbor.stageName, neighbor.rotation);
        if (!neighborGates.has(oppositeDirection(dir))) continue;

        // Check if this is a key-gate that we haven't unlocked
        if (cell.isKeyGate && cell.keyGateDirection === dir && !gatesUnlocked.has(key)) {
          continue; // Can't pass through locked gate
        }

        toVisit.push([nr, nc]);
      }
    }

    // Check if we reached the end
    const reachedEnd = result.endCell ? visited.has(`${result.endCell[0]},${result.endCell[1]}`) : false;

    // Animate the traversal
    let step = 0;
    setSim({
      running: true,
      currentCell: visitOrder[0] || null,
      visitedCells: new Set(),
      keysCollected: new Set(),
      gatesUnlocked: new Set(),
      status: 'running',
      message: 'Simulating...',
    });

    const interval = setInterval(() => {
      if (step >= visitOrder.length) {
        clearInterval(interval);
        setSim(prev => ({
          ...prev,
          running: false,
          currentCell: null,
          status: reachedEnd ? 'success' : 'failed',
          message: reachedEnd ? 'Reached the end!' : 'Could not reach the end!',
        }));
        return;
      }

      const [r, c] = visitOrder[step];
      const cell = result.grid[r]?.[c];

      setSim(prev => {
        const newVisited = new Set(prev.visitedCells);
        newVisited.add(`${r},${c}`);

        const newKeys = new Set(prev.keysCollected);
        const newGates = new Set(prev.gatesUnlocked);
        if (cell?.hasKey && cell.keyForCell) {
          newKeys.add(`${cell.keyForCell[0]},${cell.keyForCell[1]}`);
          newGates.add(`${cell.keyForCell[0]},${cell.keyForCell[1]}`);
        }

        return {
          ...prev,
          currentCell: [r, c],
          visitedCells: newVisited,
          keysCollected: newKeys,
          gatesUnlocked: newGates,
          message: `Step ${step + 1}/${visitOrder.length}`,
        };
      });

      step++;
    }, 400);

    return () => clearInterval(interval);
  }, [result, params.gridSize]);

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

        <div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
          }}>
            Dead Ends
          </div>
          <input
            type="number"
            min={0}
            max={5}
            value={params.branches}
            onChange={(e) => setParams(p => ({ ...p, branches: parseInt(e.target.value) || 0 }))}
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
          onClick={runSimulation}
          disabled={sim.running}
          style={{
            padding: '12px 16px',
            background: sim.running ? '#444' : '#55aa55',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: sim.running ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => !sim.running && (e.currentTarget.style.background = '#66bb66')}
          onMouseLeave={(e) => !sim.running && (e.currentTarget.style.background = '#55aa55')}
        >
          {sim.running ? 'Simulating...' : 'Simulate'}
        </button>

        {/* Simulation status */}
        {sim.status !== 'idle' && (
          <div style={{
            padding: '8px 12px',
            background: sim.status === 'success' ? '#2a4a2a' : sim.status === 'failed' ? '#4a2a2a' : '#2a2a4a',
            border: `1px solid ${sim.status === 'success' ? '#66aa66' : sim.status === 'failed' ? '#aa6666' : '#6666aa'}`,
            borderRadius: '6px',
            fontSize: '12px',
            color: sim.status === 'success' ? '#88ff88' : sim.status === 'failed' ? '#ff8888' : '#8888ff',
            textAlign: 'center',
          }}>
            {sim.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyShortJSON}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: '#555588',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#666699'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#555588'}
          >
            Short
          </button>
          <button
            onClick={copyJSON}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: '#555588',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#666699'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#555588'}
          >
            Full
          </button>
        </div>
        {copyStatus && (
          <div style={{ fontSize: '12px', color: '#88ff88', textAlign: 'center' }}>
            {copyStatus}
          </div>
        )}

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
              width: '12px',
              height: '12px',
              background: '#66aaaa',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Dead End
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
              width: '20px',
              height: '6px',
              background: '#aa66ff',
              borderRadius: '2px',
              marginRight: '8px',
              verticalAlign: 'middle',
            }} />
            Warp Exit
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
          Valley {area.toUpperCase()} - {params.gridSize}x{params.gridSize} grid, {params.usedCells} cells, {params.keyGates} key-gates, {params.branches} dead ends
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
              {row.map((cell, colIndex) => {
                const cellKey = `${rowIndex},${colIndex}`;
                const isCurrent = sim.currentCell?.[0] === rowIndex && sim.currentCell?.[1] === colIndex;
                const isVisited = sim.visitedCells.has(cellKey);
                const keyCollected = !!(cell.hasKey && cell.keyForCell && sim.keysCollected.has(`${cell.keyForCell[0]},${cell.keyForCell[1]}`));
                return (
                  <GridCellDisplay
                    key={colIndex}
                    cell={cell}
                    row={rowIndex}
                    col={colIndex}
                    isCurrent={isCurrent}
                    isVisited={isVisited}
                    keyCollected={keyCollected}
                  />
                );
              })}
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
