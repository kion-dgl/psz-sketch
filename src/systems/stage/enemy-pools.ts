/**
 * Enemy Pools
 * Defines which enemies can spawn in each area
 */

import type { EnemyArea, EnemyPool, ContentDifficulty } from './types';

/**
 * Enemy pools organized by area
 * - common: High spawn rate, basic enemies
 * - uncommon: Medium spawn rate, stronger enemies
 * - rare: Low spawn rate, special conditions
 * - bosses: Area boss enemies
 * - elites: Mini-bosses or powerful variants
 */
export const ENEMY_POOLS: Record<EnemyArea, EnemyPool> = {
  gurhacia: {
    area: 'gurhacia',
    common: ['snake', 'lizard', 'hyena'],
    uncommon: ['vulture', 'lion'],
    rare: ['snake_rare', 'hyena_rare', 'lion_rare', 'rappy', 'booma'],
    bosses: ['boss_dragon'],
    elites: ['lion'],
  },

  rioh: {
    area: 'rioh',
    common: ['wolf', 'deer', 'rabbit'],
    uncommon: ['gorilla', 'gorilla_female'],
    rare: ['rabbit_rare', 'gorilla_rare', 'rappy'],
    bosses: [], // Rioh shares boss with another area or has story boss
    elites: ['gorilla'],
  },

  ozette: {
    area: 'ozette',
    common: ['seal', 'frog'],
    uncommon: ['roc'],
    rare: ['seal_rare', 'frog_rare', 'roc_rare', 'jigobooma'],
    bosses: ['boss_octopus'],
    elites: ['roc'],
  },

  paru: {
    area: 'paru',
    common: ['shrimp', 'frog_bomb'],
    uncommon: ['orangutan', 'quad'],
    rare: ['shrimp_rare', 'orangutan_rare', 'quad_rare', 'rappy_blue'],
    bosses: ['boss_robot'],
    elites: ['quad'],
  },

  makara: {
    area: 'makara',
    common: ['bat', 'mole'],
    uncommon: ['bat_blue', 'tiger', 'armadillo'],
    rare: ['armadillo_rare'],
    bosses: [], // Makara may share boss or have story-specific boss
    elites: ['tiger'],
  },

  arca: {
    area: 'arca',
    common: ['shooter', 'board'],
    uncommon: ['shooter_leader', 'swordman', 'board_blue', 'board_green'],
    rare: ['swordman_rare', 'rappy_red'],
    bosses: ['boss_mother'],
    elites: ['shooter_leader', 'swordman'],
  },

  dark: {
    area: 'dark',
    common: ['circle', 'lower', 'leg'],
    uncommon: ['circle_black', 'lower_black', 'leg_black', 'tank'],
    rare: ['tank_rare', 'swordman_b', 'swordman_rare_b'],
    bosses: ['boss_darkfalz'],
    elites: ['mother', 'tank'],
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
