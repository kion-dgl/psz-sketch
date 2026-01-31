/**
 * Stage Content System
 * Handles stage content generation and mission structure
 */

// Types
export * from './types';

// Enemy Pools
export {
  ENEMY_POOLS,
  getEnemyPool,
  getSpawnableEnemies,
  getRareEnemies,
  getBossEnemies,
  getEliteEnemies,
  getEnemyCountRange,
  getSpawnWeights,
  createSeededRandom,
  pickRandomEnemy,
  generateEnemyComposition,
  isEnemyValidForArea,
  getAreasForEnemy,
} from './enemy-pools';

// Element Placer
export {
  DEFAULT_DROP_TABLES,
  getDropTable,
  getBoxParams,
  getPuzzleParams,
  generateRandomPositions,
  generatePositionNearGate,
  generateElementId,
  resetElementIdCounter,
  generateBoxes,
  generateFenceSwitchPuzzle,
  generateStageElements,
  generateKeyElement,
  findKeyPosition,
  validateElementPlacement,
  validateFenceSwitchLinks,
} from './element-placer';

// Content Generator
export {
  generateEnemySpawns,
  createEnemyWaves,
  generateStageContent,
  generateMissionContent,
  validateMissionContent,
  createEmptyStageContent,
  addEnemiesToStage,
  stageAreaToEnemyArea,
  getBossForArea,
  generateEnemySpawnPositions,
} from './content-generator';
