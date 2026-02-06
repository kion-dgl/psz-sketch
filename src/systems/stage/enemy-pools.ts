/**
 * Enemy Pools
 * Defines which enemies can spawn in each area
 * Uses proper PSZ enemy names from content/enemies/*.json
 */

import type { EnemyArea, EnemyPool, ContentDifficulty } from './types';

/**
 * Enemy pools organized by area
 * - common: High spawn rate, basic enemies
 * - uncommon: Medium spawn rate, stronger enemies
 * - rare: Low spawn rate, special conditions
 * - bosses: Area boss enemies
 * - elites: Mini-bosses or powerful variants
 *
 * Enemy names match content/enemies/*.json and content/drops/*.json
 */
export const ENEMY_POOLS: Record<EnemyArea, EnemyPool> = {
  gurhacia: {
    area: 'gurhacia',
    common: ['ghowl', 'vulkure', 'garapython'],
    uncommon: ['garahadan', 'grimble', 'tormatible'],
    rare: ['rappy', 'booma-origin', 'helion'],
    bosses: ['blaze-helion'],
    elites: ['helion'],
  },

  rioh: {
    area: 'rioh',
    common: ['usanny', 'usanimere', 'reyhound'],
    uncommon: ['stagg', 'hildegao'],
    rare: ['rappy', 'booma-origin', 'hildegigas'],
    bosses: ['hildegigas'],
    elites: ['hildegao'],
  },

  ozette: {
    area: 'ozette',
    common: ['porel', 'pomarr', 'hypao'],
    uncommon: ['vespao', 'pelcatraz'],
    rare: ['rappy', 'booma-origin', 'gigobooma-origin', 'pelcatobur'],
    bosses: ['pelcatobur'],
    elites: ['pelcatraz'],
  },

  paru: {
    area: 'paru',
    common: ['pobomma', 'bolix', 'izhirak-s6'],
    uncommon: ['goldix', 'azherowa-b2', 'froutang'],
    rare: ['ar-rappy', 'booma-origin', 'gigobooma-origin', 'frunaked'],
    bosses: ['frunaked'],
    elites: ['froutang'],
  },

  makara: {
    area: 'makara',
    common: ['batt', 'bullbatt', 'rumole'],
    uncommon: ['kapantha', 'rohjade'],
    rare: ['ar-rappy', 'booma-origin', 'gigobooma-origin', 'rohcrysta'],
    bosses: ['rohcrysta'],
    elites: ['rohjade'],
  },

  arca: {
    area: 'arca',
    common: ['korse', 'akorse', 'finjer-r'],
    uncommon: ['finjer-g', 'finjer-b'],
    rare: ['rab-rappy', 'booma-origin', 'gigobooma-origin'],
    bosses: ['blade-mother'],
    elites: ['akorse'],
  },

  dark: {
    area: 'dark',
    common: ['eulid', 'eulidveil', 'eulada'],
    uncommon: ['euladaveil', 'arkzein', 'arkzein-r'],
    rare: ['rab-rappy', 'booma-origin', 'gigobooma-origin', 'derreo'],
    bosses: ['dark-falz', 'chaos-mobius'],
    elites: ['derreo', 'arkzein-r'],
  },
};

/**
 * Get the enemy pool for an area
 */
export function getEnemyPool(area: EnemyArea): EnemyPool {
  return ENEMY_POOLS[area];
}

/**
 * Get all spawnable enemies for an area (excludes bosses)
 */
export function getSpawnableEnemies(area: EnemyArea): string[] {
  const pool = ENEMY_POOLS[area];
  return [...pool.common, ...pool.uncommon];
}

/**
 * Get rare enemies for an area
 */
export function getRareEnemies(area: EnemyArea): string[] {
  return ENEMY_POOLS[area].rare;
}

/**
 * Get boss enemies for an area
 */
export function getBossEnemies(area: EnemyArea): string[] {
  return ENEMY_POOLS[area].bosses;
}

/**
 * Get elite enemies for an area
 */
export function getEliteEnemies(area: EnemyArea): string[] {
  return ENEMY_POOLS[area].elites || [];
}

/**
 * Enemy count ranges based on difficulty
 */
const ENEMY_COUNT_RANGES: Record<ContentDifficulty, { min: number; max: number }> = {
  'normal': { min: 3, max: 6 },
  'hard': { min: 5, max: 8 },
  'super-hard': { min: 7, max: 12 },
};

/**
 * Get enemy count range for a difficulty
 */
export function getEnemyCountRange(difficulty: ContentDifficulty): { min: number; max: number } {
  return ENEMY_COUNT_RANGES[difficulty];
}

/**
 * Spawn weights for enemy rarity tiers
 */
const SPAWN_WEIGHTS: Record<ContentDifficulty, { common: number; uncommon: number; rare: number }> = {
  'normal': { common: 70, uncommon: 25, rare: 5 },
  'hard': { common: 55, uncommon: 35, rare: 10 },
  'super-hard': { common: 40, uncommon: 40, rare: 20 },
};

/**
 * Get spawn weights for a difficulty
 */
export function getSpawnWeights(difficulty: ContentDifficulty): { common: number; uncommon: number; rare: number } {
  return SPAWN_WEIGHTS[difficulty];
}

/**
 * Simple seeded random number generator
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Pick a random enemy from the pool based on difficulty weights
 */
export function pickRandomEnemy(
  area: EnemyArea,
  difficulty: ContentDifficulty,
  random: () => number = Math.random,
  excludeRare: boolean = false
): string {
  const pool = ENEMY_POOLS[area];
  const weights = SPAWN_WEIGHTS[difficulty];

  // Calculate total weight
  let totalWeight = weights.common + weights.uncommon;
  if (!excludeRare && pool.rare.length > 0) {
    totalWeight += weights.rare;
  }

  // Roll for tier
  const roll = random() * totalWeight;

  if (roll < weights.common && pool.common.length > 0) {
    // Common enemy
    const idx = Math.floor(random() * pool.common.length);
    return pool.common[idx];
  } else if (roll < weights.common + weights.uncommon && pool.uncommon.length > 0) {
    // Uncommon enemy
    const idx = Math.floor(random() * pool.uncommon.length);
    return pool.uncommon[idx];
  } else if (!excludeRare && pool.rare.length > 0) {
    // Rare enemy
    const idx = Math.floor(random() * pool.rare.length);
    return pool.rare[idx];
  }

  // Fallback to common
  if (pool.common.length > 0) {
    const idx = Math.floor(random() * pool.common.length);
    return pool.common[idx];
  }

  // Ultimate fallback
  return pool.uncommon[0] || 'snake';
}

/**
 * Generate enemy composition for a stage
 */
export function generateEnemyComposition(
  area: EnemyArea,
  difficulty: ContentDifficulty,
  random: () => number = Math.random
): { enemyId: string; count: number }[] {
  const countRange = ENEMY_COUNT_RANGES[difficulty];
  const totalCount = Math.floor(random() * (countRange.max - countRange.min + 1)) + countRange.min;

  // Track enemy counts
  const composition: Map<string, number> = new Map();

  for (let i = 0; i < totalCount; i++) {
    const enemyId = pickRandomEnemy(area, difficulty, random);
    composition.set(enemyId, (composition.get(enemyId) || 0) + 1);
  }

  // Convert to array
  return Array.from(composition.entries()).map(([enemyId, count]) => ({
    enemyId,
    count,
  }));
}

/**
 * Check if an enemy is valid for an area
 */
export function isEnemyValidForArea(enemyId: string, area: EnemyArea): boolean {
  const pool = ENEMY_POOLS[area];
  return (
    pool.common.includes(enemyId) ||
    pool.uncommon.includes(enemyId) ||
    pool.rare.includes(enemyId) ||
    pool.bosses.includes(enemyId) ||
    (pool.elites?.includes(enemyId) ?? false)
  );
}

/**
 * Get all areas where an enemy can spawn
 */
export function getAreasForEnemy(enemyId: string): EnemyArea[] {
  const areas: EnemyArea[] = [];
  for (const [area, pool] of Object.entries(ENEMY_POOLS)) {
    if (
      pool.common.includes(enemyId) ||
      pool.uncommon.includes(enemyId) ||
      pool.rare.includes(enemyId) ||
      pool.bosses.includes(enemyId) ||
      (pool.elites?.includes(enemyId) ?? false)
    ) {
      areas.push(area as EnemyArea);
    }
  }
  return areas;
}
