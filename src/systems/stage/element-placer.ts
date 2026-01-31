/**
 * Element Placer
 * Logic for placing interactive elements in stages
 */

import type {
  ElementSpawn,
  ElementType,
  FenceSwitchLink,
  DropTable,
  DropEntry,
  ContentDifficulty,
  StageConfig,
} from './types';
import { createSeededRandom } from './enemy-pools';

// ============================================================================
// Drop Tables
// ============================================================================

/** Default drop tables for different box types */
export const DEFAULT_DROP_TABLES: Record<string, DropTable> = {
  'common-box': {
    id: 'common-box',
    entries: [
      { itemId: 'monomate', weight: 40, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'dimate', weight: 20, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'monofluid', weight: 30, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'difluid', weight: 10, minQuantity: 1, maxQuantity: 1 },
    ],
    meseta: { min: 50, max: 200 },
    rolls: 1,
  },
  'uncommon-box': {
    id: 'uncommon-box',
    entries: [
      { itemId: 'dimate', weight: 35, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'trimate', weight: 15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'difluid', weight: 30, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'trifluid', weight: 10, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'telepipe', weight: 10, minQuantity: 1, maxQuantity: 1 },
    ],
    meseta: { min: 100, max: 400 },
    rolls: 2,
  },
  'rare-box': {
    id: 'rare-box',
    entries: [
      { itemId: 'trimate', weight: 30, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'trifluid', weight: 25, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'sol-atomizer', weight: 15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'moon-atomizer', weight: 10, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'star-atomizer', weight: 5, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'scape-doll', weight: 5, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'telepipe', weight: 10, minQuantity: 1, maxQuantity: 2 },
    ],
    meseta: { min: 300, max: 800 },
    rolls: 3,
  },
};

/**
 * Get a drop table by ID
 */
export function getDropTable(tableId: string): DropTable | null {
  return DEFAULT_DROP_TABLES[tableId] || null;
}

// ============================================================================
// Placement Parameters
// ============================================================================

/** Box placement parameters by difficulty */
const BOX_PARAMS: Record<ContentDifficulty, { minBoxes: number; maxBoxes: number; rareChance: number }> = {
  'normal': { minBoxes: 1, maxBoxes: 3, rareChance: 0.05 },
  'hard': { minBoxes: 2, maxBoxes: 4, rareChance: 0.10 },
  'super-hard': { minBoxes: 2, maxBoxes: 5, rareChance: 0.15 },
};

/** Get box placement parameters for difficulty */
export function getBoxParams(difficulty: ContentDifficulty) {
  return BOX_PARAMS[difficulty];
}

/** Puzzle (fence+switch) parameters */
const PUZZLE_PARAMS: Record<ContentDifficulty, { puzzleChance: number; maxPuzzles: number }> = {
  'normal': { puzzleChance: 0.2, maxPuzzles: 1 },
  'hard': { puzzleChance: 0.35, maxPuzzles: 2 },
  'super-hard': { puzzleChance: 0.5, maxPuzzles: 2 },
};

/** Get puzzle parameters for difficulty */
export function getPuzzleParams(difficulty: ContentDifficulty) {
  return PUZZLE_PARAMS[difficulty];
}

// ============================================================================
// Position Generation
// ============================================================================

/**
 * Generate random positions within a stage grid
 */
export function generateRandomPositions(
  count: number,
  gridSize: number,
  margin: number,
  random: () => number,
  existingPositions: [number, number, number][] = []
): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const minDistance = 4; // Minimum distance between elements
  const halfGrid = gridSize / 2;
  const maxAttempts = 50;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let position: [number, number, number] | null = null;

    while (attempts < maxAttempts) {
      const x = (random() * (gridSize - margin * 2)) - halfGrid + margin;
      const z = (random() * (gridSize - margin * 2)) - halfGrid + margin;
      const candidate: [number, number, number] = [x, 0, z];

      // Check distance from existing positions
      const allPositions = [...existingPositions, ...positions];
      const tooClose = allPositions.some(pos => {
        const dx = pos[0] - candidate[0];
        const dz = pos[2] - candidate[2];
        return Math.sqrt(dx * dx + dz * dz) < minDistance;
      });

      if (!tooClose) {
        position = candidate;
        break;
      }

      attempts++;
    }

    if (position) {
      positions.push(position);
    }
  }

  return positions;
}

/**
 * Generate position near a gate (for elements protecting/near gates)
 */
export function generatePositionNearGate(
  gateEdge: 'north' | 'south' | 'east' | 'west',
  gateX: number,
  gateZ: number,
  distance: number,
  random: () => number
): [number, number, number] {
  // Offset perpendicular to the gate
  const perpOffset = (random() - 0.5) * 8;

  switch (gateEdge) {
    case 'north':
      return [gateX + perpOffset, 0, gateZ + distance];
    case 'south':
      return [gateX + perpOffset, 0, gateZ - distance];
    case 'east':
      return [gateX - distance, 0, gateZ + perpOffset];
    case 'west':
      return [gateX + distance, 0, gateZ + perpOffset];
  }
}

// ============================================================================
// Element Generation
// ============================================================================

let elementIdCounter = 0;

/**
 * Generate a unique element ID
 */
export function generateElementId(type: ElementType): string {
  elementIdCounter++;
  return `${type}-${elementIdCounter}`;
}

/**
 * Reset element ID counter (for testing)
 */
export function resetElementIdCounter(): void {
  elementIdCounter = 0;
}

/**
 * Generate box elements for a stage
 */
export function generateBoxes(
  difficulty: ContentDifficulty,
  gridSize: number,
  random: () => number,
  existingPositions: [number, number, number][] = []
): ElementSpawn[] {
  const params = BOX_PARAMS[difficulty];
  const boxCount = Math.floor(random() * (params.maxBoxes - params.minBoxes + 1)) + params.minBoxes;

  const positions = generateRandomPositions(boxCount, gridSize, 5, random, existingPositions);

  return positions.map(position => {
    const isRare = random() < params.rareChance;
    const type: ElementType = isRare ? 'rare-box' : 'box';
    const dropTable = isRare ? 'rare-box' : (random() < 0.3 ? 'uncommon-box' : 'common-box');

    return {
      id: generateElementId(type),
      type,
      position,
      rotation: random() * Math.PI * 2,
      dropTable,
    };
  });
}

/**
 * Generate a fence+switch puzzle
 */
export function generateFenceSwitchPuzzle(
  gridSize: number,
  random: () => number,
  existingPositions: [number, number, number][] = []
): { elements: ElementSpawn[]; link: FenceSwitchLink } | null {
  // Generate fence position
  const fencePositions = generateRandomPositions(1, gridSize, 6, random, existingPositions);
  if (fencePositions.length === 0) return null;

  const fencePosition = fencePositions[0];

  // Generate switch position (away from fence)
  const switchPositions = generateRandomPositions(
    1,
    gridSize,
    4,
    random,
    [...existingPositions, fencePosition]
  );
  if (switchPositions.length === 0) return null;

  const switchPosition = switchPositions[0];

  // Pick switch type
  const switchTypes: Array<'step-switch' | 'interact-switch' | 'remote-switch'> = [
    'step-switch',
    'interact-switch',
    'remote-switch',
  ];
  const switchType = switchTypes[Math.floor(random() * switchTypes.length)];

  const fenceId = generateElementId('fence');
  const switchId = generateElementId(switchType);

  const elements: ElementSpawn[] = [
    {
      id: fenceId,
      type: 'fence',
      position: fencePosition,
      rotation: random() * Math.PI * 2,
      linkedTo: switchId,
    },
    {
      id: switchId,
      type: switchType,
      position: switchPosition,
      rotation: 0,
      linkedTo: fenceId,
    },
  ];

  const link: FenceSwitchLink = {
    fenceId,
    switchId,
    switchType: switchType.replace('-switch', '') as 'step' | 'interact' | 'remote',
  };

  return { elements, link };
}

/**
 * Generate all elements for a stage
 */
export function generateStageElements(
  difficulty: ContentDifficulty,
  stageConfig: StageConfig,
  random: () => number
): {
  elements: ElementSpawn[];
  fenceSwitchLinks: FenceSwitchLink[];
  dropTables: DropTable[];
} {
  const elements: ElementSpawn[] = [];
  const fenceSwitchLinks: FenceSwitchLink[] = [];
  const dropTableIds = new Set<string>();
  const occupiedPositions: [number, number, number][] = [];

  const gridSize = stageConfig.gridSize;
  const puzzleParams = PUZZLE_PARAMS[difficulty];

  // Maybe add a fence+switch puzzle
  if (random() < puzzleParams.puzzleChance) {
    const puzzle = generateFenceSwitchPuzzle(gridSize, random, occupiedPositions);
    if (puzzle) {
      elements.push(...puzzle.elements);
      fenceSwitchLinks.push(puzzle.link);
      puzzle.elements.forEach(e => occupiedPositions.push(e.position));
    }
  }

  // Add boxes
  const boxes = generateBoxes(difficulty, gridSize, random, occupiedPositions);
  elements.push(...boxes);
  boxes.forEach(box => {
    if (box.dropTable) {
      dropTableIds.add(box.dropTable);
    }
  });

  // Collect drop tables
  const dropTables: DropTable[] = [];
  for (const tableId of dropTableIds) {
    const table = DEFAULT_DROP_TABLES[tableId];
    if (table) {
      dropTables.push(table);
    }
  }

  return { elements, fenceSwitchLinks, dropTables };
}

// ============================================================================
// Key Placement
// ============================================================================

/**
 * Generate a key element at a position
 */
export function generateKeyElement(
  position: [number, number, number],
  keyGateId: string
): ElementSpawn {
  return {
    id: generateElementId('key'),
    type: 'key',
    position,
    rotation: 0,
    linkedTo: keyGateId,
  };
}

/**
 * Find a suitable position for a key in a stage
 */
export function findKeyPosition(
  stageConfig: StageConfig,
  random: () => number,
  existingPositions: [number, number, number][] = []
): [number, number, number] {
  // Try to place key in a non-trivial location
  const positions = generateRandomPositions(1, stageConfig.gridSize, 8, random, existingPositions);

  if (positions.length > 0) {
    return positions[0];
  }

  // Fallback to center-ish location
  return [
    (random() - 0.5) * 10,
    0,
    (random() - 0.5) * 10,
  ];
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate element placement (no overlaps, within bounds)
 */
export function validateElementPlacement(
  elements: ElementSpawn[],
  gridSize: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const halfGrid = gridSize / 2;

  for (const element of elements) {
    const [x, , z] = element.position;

    // Check bounds
    if (Math.abs(x) > halfGrid || Math.abs(z) > halfGrid) {
      errors.push(`Element ${element.id} is out of bounds at (${x}, ${z})`);
    }
  }

  // Check for overlaps (within 2 units)
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];
      const dx = a.position[0] - b.position[0];
      const dz = a.position[2] - b.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 2) {
        errors.push(`Elements ${a.id} and ${b.id} are too close (${dist.toFixed(1)} units)`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate fence-switch links
 */
export function validateFenceSwitchLinks(
  links: FenceSwitchLink[],
  elements: ElementSpawn[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const elementIds = new Set(elements.map(e => e.id));

  for (const link of links) {
    if (!elementIds.has(link.fenceId)) {
      errors.push(`Fence ${link.fenceId} not found in elements`);
    }
    if (!elementIds.has(link.switchId)) {
      errors.push(`Switch ${link.switchId} not found in elements`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
