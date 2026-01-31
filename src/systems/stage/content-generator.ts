/**
 * Content Generator
 * Generates complete stage and mission content
 */

import type {
  EnemyArea,
  ContentDifficulty,
  GenerationParams,
  GenerationResult,
  MissionContent,
  MissionLayout,
  StageContent,
  EnemySpawn,
  EnemyWave,
  WaveTrigger,
  KeyGateSpawn,
  GridCell,
  StageConfig,
} from './types';
import {
  createSeededRandom,
  generateEnemyComposition,
  getEnemyPool,
  pickRandomEnemy,
} from './enemy-pools';
import {
  generateStageElements,
  generateKeyElement,
  findKeyPosition,
  resetElementIdCounter,
} from './element-placer';

// ============================================================================
// Enemy Spawn Generation
// ============================================================================

/**
 * Generate spawn positions for enemies within a stage
 */
function generateEnemySpawnPositions(
  count: number,
  stageConfig: StageConfig,
  random: () => number,
  existingPositions: [number, number, number][] = []
): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const gridSize = stageConfig.gridSize;
  const halfGrid = gridSize / 2;
  const margin = 8; // Keep enemies away from edges
  const minDistance = 3; // Minimum distance between enemies
  const maxAttempts = 30;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let position: [number, number, number] | null = null;

    while (attempts < maxAttempts) {
      const x = (random() * (gridSize - margin * 2)) - halfGrid + margin;
      const z = (random() * (gridSize - margin * 2)) - halfGrid + margin;
      const candidate: [number, number, number] = [x, 0, z];

      // Check distance from all positions
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
 * Generate enemy spawns for a stage
 */
export function generateEnemySpawns(
  area: EnemyArea,
  difficulty: ContentDifficulty,
  stageConfig: StageConfig,
  random: () => number,
  options: {
    isBossStage?: boolean;
    bossId?: string;
    existingPositions?: [number, number, number][];
  } = {}
): EnemySpawn[] {
  const { isBossStage, bossId, existingPositions = [] } = options;
  const spawns: EnemySpawn[] = [];

  if (isBossStage && bossId) {
    // Boss stage: spawn boss in center with a few minions
    spawns.push({
      enemyId: bossId,
      position: [0, 0, 0],
      rotation: Math.PI, // Face south (toward player entry)
      waveGroup: 0,
    });

    // Add a few minions
    const minionCount = difficulty === 'normal' ? 2 : difficulty === 'hard' ? 3 : 4;
    const minionPositions = generateEnemySpawnPositions(
      minionCount,
      stageConfig,
      random,
      [...existingPositions, [0, 0, 0]]
    );

    for (const pos of minionPositions) {
      spawns.push({
        enemyId: pickRandomEnemy(area, difficulty, random, true), // Exclude rare
        position: pos,
        rotation: random() * Math.PI * 2,
        waveGroup: 0,
      });
    }

    return spawns;
  }

  // Regular stage: generate composition and spawn enemies
  const composition = generateEnemyComposition(area, difficulty, random);
  const totalCount = composition.reduce((sum, e) => sum + e.count, 0);

  // Generate positions for all enemies
  const positions = generateEnemySpawnPositions(totalCount, stageConfig, random, existingPositions);

  // Assign enemies to positions
  let posIndex = 0;
  for (const entry of composition) {
    for (let i = 0; i < entry.count && posIndex < positions.length; i++) {
      spawns.push({
        enemyId: entry.enemyId,
        position: positions[posIndex],
        rotation: random() * Math.PI * 2,
        waveGroup: 0, // All spawn immediately for now
      });
      posIndex++;
    }
  }

  return spawns;
}

/**
 * Convert enemy spawns to wave structure
 */
export function createEnemyWaves(spawns: EnemySpawn[]): EnemyWave[] {
  // Group spawns by wave group
  const waveGroups = new Map<number, EnemySpawn[]>();

  for (const spawn of spawns) {
    const group = spawn.waveGroup || 0;
    if (!waveGroups.has(group)) {
      waveGroups.set(group, []);
    }
    waveGroups.get(group)!.push(spawn);
  }

  // Convert to waves
  const waves: EnemyWave[] = [];
  const sortedGroups = Array.from(waveGroups.keys()).sort((a, b) => a - b);

  for (const groupNum of sortedGroups) {
    const trigger: WaveTrigger = groupNum === 0
      ? { type: 'immediate' }
      : { type: 'previous-cleared' };

    waves.push({
      waveNumber: groupNum,
      trigger,
      spawns: waveGroups.get(groupNum)!,
    });
  }

  return waves;
}

// ============================================================================
// Stage Content Generation
// ============================================================================

/**
 * Generate content for a single stage
 */
export function generateStageContent(
  stageId: string,
  stageConfig: StageConfig,
  area: EnemyArea,
  difficulty: ContentDifficulty,
  random: () => number,
  options: {
    hasKey?: boolean;
    keyGateId?: string;
    isBossStage?: boolean;
    bossId?: string;
  } = {}
): StageContent {
  const { hasKey, keyGateId, isBossStage, bossId } = options;

  // Generate elements first to get occupied positions
  const { elements, fenceSwitchLinks, dropTables } = generateStageElements(
    difficulty,
    stageConfig,
    random
  );

  // Get positions occupied by elements
  const elementPositions = elements.map(e => e.position);

  // Add key if needed
  if (hasKey && keyGateId) {
    const keyPosition = findKeyPosition(stageConfig, random, elementPositions);
    const keyElement = generateKeyElement(keyPosition, keyGateId);
    elements.push(keyElement);
    elementPositions.push(keyPosition);
  }

  // Generate enemy spawns
  const enemySpawns = generateEnemySpawns(area, difficulty, stageConfig, random, {
    isBossStage,
    bossId,
    existingPositions: elementPositions,
  });

  // Convert to waves
  const waves = createEnemyWaves(enemySpawns);

  return {
    stageId,
    waves,
    elements,
    keyGates: [], // Key-gates are handled at mission level
    fenceSwitchLinks,
    dropTables,
    requiresClear: true,
    bossId: isBossStage ? bossId : undefined,
  };
}

// ============================================================================
// Mission Content Generation
// ============================================================================

/**
 * Map stage area to enemy area
 */
function stageAreaToEnemyArea(stageArea: string): EnemyArea {
  if (stageArea.startsWith('valley')) return 'gurhacia';
  if (stageArea.startsWith('snowfield')) return 'rioh';
  if (stageArea.startsWith('wetland')) return 'ozette';
  if (stageArea.startsWith('city')) return 'paru';
  if (stageArea.startsWith('ruins')) return 'makara';
  if (stageArea.startsWith('plant')) return 'arca';
  if (stageArea.startsWith('shrine')) return 'dark';
  return 'gurhacia'; // Default
}

/**
 * Get boss for an area
 */
function getBossForArea(area: EnemyArea): string | null {
  const pool = getEnemyPool(area);
  return pool.bosses[0] || null;
}

/**
 * Generate complete mission content from a layout
 */
export function generateMissionContent(
  layout: MissionLayout,
  params: GenerationParams
): GenerationResult {
  const {
    enemyArea,
    difficulty,
    playerLevel,
    seed = Date.now(),
    includeBoss = true,
    bossId,
  } = params;

  // Create seeded random
  const random = createSeededRandom(seed);

  // Reset element ID counter for consistent generation
  resetElementIdCounter();

  // Track statistics
  let totalEnemies = 0;
  let totalBoxes = 0;
  let totalPuzzles = 0;

  // Find cells with keys and key-gates
  const keyCells = new Map<string, string>(); // keyCell pos -> keyGate pos
  for (const cell of layout.cells) {
    if (cell.key && cell.keyGate) {
      // Find the cell this key unlocks (the next cell in path)
      // For simplicity, we'll handle key-gates at the mission level
    }
  }

  // Find the end cell for boss placement
  const endCell = layout.cells.find(c => c.end);

  // Generate content for each cell
  const stageContents: Record<string, StageContent> = {};

  for (const cell of layout.cells) {
    const stageConfig = layout.stageConfigs[cell.fullStageName];
    if (!stageConfig) {
      console.warn(`No stage config for ${cell.fullStageName}`);
      continue;
    }

    // Determine if this is a boss stage
    const isBossStage = includeBoss && cell.end;
    const stageBossId = isBossStage ? (bossId || getBossForArea(enemyArea)) : undefined;

    // Generate content
    const content = generateStageContent(
      cell.fullStageName,
      stageConfig,
      enemyArea,
      difficulty,
      random,
      {
        hasKey: cell.key,
        keyGateId: cell.key ? `keygate-${cell.pos}` : undefined,
        isBossStage: !!isBossStage,
        bossId: stageBossId || undefined,
      }
    );

    // Add key-gate if this cell has one
    if (cell.keyGate) {
      const gateConfig = stageConfig.gates.find(g => g.edge === cell.keyGate);
      if (gateConfig) {
        content.keyGates.push({
          id: `keygate-${cell.pos}`,
          direction: cell.keyGate as 'north' | 'south' | 'east' | 'west',
          position: [gateConfig.x, 0, gateConfig.z],
          keyId: `key-for-${cell.pos}`, // Will be linked to actual key
        });
      }
    }

    stageContents[cell.pos] = content;

    // Update statistics
    for (const wave of content.waves) {
      totalEnemies += wave.spawns.length;
    }
    totalBoxes += content.elements.filter(e => e.type === 'box' || e.type === 'rare-box').length;
    totalPuzzles += content.fenceSwitchLinks.length;
  }

  // Calculate par time based on enemy count and difficulty
  const baseParTime = 60; // 1 minute base
  const timePerEnemy = difficulty === 'normal' ? 5 : difficulty === 'hard' ? 4 : 3;
  const timePerStage = 30;
  const parTime = baseParTime + (totalEnemies * timePerEnemy) + (layout.cells.length * timePerStage);

  // Build mission content
  const mission: MissionContent = {
    id: `generated-${seed}`,
    name: `${layout.area} Expedition`,
    description: `Explore the ${layout.area.replace('-', ' ')} and defeat all enemies.`,
    enemyArea,
    stageArea: layout.area,
    difficulty,
    layout,
    stageContents,
    recommendedLevel: playerLevel,
    parTime,
    isCurated: false,
  };

  return {
    mission,
    metadata: {
      seed,
      totalEnemies,
      totalBoxes,
      totalPuzzles,
      generatedAt: Date.now(),
    },
  };
}

// ============================================================================
// Curated Mission Loading
// ============================================================================

/**
 * Validate mission content structure
 */
export function validateMissionContent(mission: MissionContent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!mission.id) errors.push('Missing mission ID');
  if (!mission.name) errors.push('Missing mission name');
  if (!mission.layout) errors.push('Missing mission layout');
  if (!mission.stageContents) errors.push('Missing stage contents');

  // Check layout cells match stage contents
  if (mission.layout && mission.stageContents) {
    for (const cell of mission.layout.cells) {
      if (!mission.stageContents[cell.pos]) {
        errors.push(`Missing stage content for cell ${cell.pos}`);
      }
    }
  }

  // Check enemy areas are valid
  const validAreas: EnemyArea[] = ['gurhacia', 'rioh', 'ozette', 'paru', 'makara', 'arca', 'dark'];
  if (!validAreas.includes(mission.enemyArea)) {
    errors.push(`Invalid enemy area: ${mission.enemyArea}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create an empty stage content (for manual/curated missions)
 */
export function createEmptyStageContent(stageId: string): StageContent {
  return {
    stageId,
    waves: [],
    elements: [],
    keyGates: [],
    fenceSwitchLinks: [],
    dropTables: [],
    requiresClear: false,
  };
}

/**
 * Add enemies to a stage content (for curated mission building)
 */
export function addEnemiesToStage(
  content: StageContent,
  enemies: Array<{ enemyId: string; position: [number, number, number]; rotation?: number; waveGroup?: number }>
): StageContent {
  const spawns: EnemySpawn[] = enemies.map(e => ({
    enemyId: e.enemyId,
    position: e.position,
    rotation: e.rotation || 0,
    waveGroup: e.waveGroup || 0,
  }));

  const waves = createEnemyWaves(spawns);

  return {
    ...content,
    waves,
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  stageAreaToEnemyArea,
  getBossForArea,
  generateEnemySpawnPositions,
};
