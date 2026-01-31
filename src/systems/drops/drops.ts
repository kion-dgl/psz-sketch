/**
 * Drop System
 * Item and meseta drop calculations
 */

import type {
  Difficulty,
  DropEntry,
  EnemyDropTable,
  AreaDropTable,
  DropResult,
  MesetaDropRange,
} from './types';
import {
  DIFFICULTY_DROP_MODIFIERS,
  DIFFICULTY_MESETA_MODIFIERS,
  BASE_MESETA_DROP,
} from './types';

// Store for drop tables (would be loaded from JSON in production)
const dropTables = new Map<string, AreaDropTable>();

/**
 * Register a drop table for an area
 */
export function registerDropTable(table: AreaDropTable): void {
  const key = `${table.areaId}_${table.difficulty}`;
  dropTables.set(key, table);
}

/**
 * Get drop table for an area and difficulty
 */
export function getDropTable(areaId: string, difficulty: Difficulty): AreaDropTable | null {
  const key = `${areaId}_${difficulty}`;
  return dropTables.get(key) ?? null;
}

/**
 * Get enemy drop table from area
 */
export function getEnemyDropTable(
  areaId: string,
  difficulty: Difficulty,
  enemyId: string
): EnemyDropTable | null {
  const areaTable = getDropTable(areaId, difficulty);
  if (!areaTable) return null;

  return areaTable.enemies.find(e => e.enemyId === enemyId) ?? null;
}

/**
 * Roll for a drop based on drop rate
 */
export function rollDrop(dropRate: number, seed?: number): boolean {
  const roll = seed !== undefined ? (seed % 10000) / 10000 : Math.random();
  return roll < dropRate;
}

/**
 * Get quantity for a drop
 */
export function rollQuantity(entry: DropEntry, seed?: number): number {
  const min = entry.minQuantity ?? 1;
  const max = entry.maxQuantity ?? 1;

  if (min === max) return min;

  const range = max - min + 1;
  const roll = seed !== undefined ? seed % range : Math.floor(Math.random() * range);
  return min + roll;
}

/**
 * Apply difficulty modifier to drop rate
 */
export function applyDifficultyModifier(dropRate: number, difficulty: Difficulty): number {
  const modifier = DIFFICULTY_DROP_MODIFIERS[difficulty];
  return Math.min(1, dropRate * modifier); // Cap at 100%
}

/**
 * Roll drops for a single enemy
 */
export function rollEnemyDrops(
  enemyDropTable: EnemyDropTable,
  difficulty: Difficulty,
  options: { seeds?: { common?: number; rare?: number; quantity?: number } } = {}
): DropResult[] {
  const results: DropResult[] = [];

  // Roll guaranteed drops
  if (enemyDropTable.guaranteedDrops) {
    for (const entry of enemyDropTable.guaranteedDrops) {
      results.push({
        itemId: entry.itemId,
        quantity: rollQuantity(entry, options.seeds?.quantity),
        isRare: false,
      });
    }
  }

  // Roll common drops
  for (const entry of enemyDropTable.commonDrops) {
    const modifiedRate = applyDifficultyModifier(entry.dropRate, difficulty);
    if (rollDrop(modifiedRate, options.seeds?.common)) {
      results.push({
        itemId: entry.itemId,
        quantity: rollQuantity(entry, options.seeds?.quantity),
        isRare: false,
      });
    }
  }

  // Roll rare drops
  for (const entry of enemyDropTable.rareDrops) {
    const modifiedRate = applyDifficultyModifier(entry.dropRate, difficulty);
    if (rollDrop(modifiedRate, options.seeds?.rare)) {
      results.push({
        itemId: entry.itemId,
        quantity: rollQuantity(entry, options.seeds?.quantity),
        isRare: true,
      });
    }
  }

  return results;
}

/**
 * Calculate meseta drop for an enemy
 */
export function calculateMesetaDrop(
  enemyLevel: number,
  difficulty: Difficulty,
  seed?: number
): number {
  const mesetaModifier = DIFFICULTY_MESETA_MODIFIERS[difficulty];

  // Base meseta scales with enemy level
  const levelModifier = 1 + (enemyLevel * 0.1);
  const min = Math.floor(BASE_MESETA_DROP.min * levelModifier * mesetaModifier);
  const max = Math.floor(BASE_MESETA_DROP.max * levelModifier * mesetaModifier);

  const range = max - min + 1;
  const roll = seed !== undefined ? seed % range : Math.floor(Math.random() * range);

  return min + roll;
}

/**
 * Get meseta range for display
 */
export function getMesetaRange(
  enemyLevel: number,
  difficulty: Difficulty
): MesetaDropRange {
  const mesetaModifier = DIFFICULTY_MESETA_MODIFIERS[difficulty];
  const levelModifier = 1 + (enemyLevel * 0.1);

  return {
    min: Math.floor(BASE_MESETA_DROP.min * levelModifier * mesetaModifier),
    max: Math.floor(BASE_MESETA_DROP.max * levelModifier * mesetaModifier),
  };
}

/**
 * Roll drops from a box/container
 */
export function rollBoxDrops(
  areaId: string,
  difficulty: Difficulty,
  seed?: number
): DropResult[] {
  const areaTable = getDropTable(areaId, difficulty);
  if (!areaTable?.boxDrops) return [];

  const results: DropResult[] = [];

  for (const entry of areaTable.boxDrops) {
    const modifiedRate = applyDifficultyModifier(entry.dropRate, difficulty);
    if (rollDrop(modifiedRate, seed)) {
      results.push({
        itemId: entry.itemId,
        quantity: rollQuantity(entry, seed),
        isRare: false,
      });
    }
  }

  return results;
}

/**
 * Calculate total drops from defeating enemies
 */
export function calculateQuestDrops(
  areaId: string,
  difficulty: Difficulty,
  enemiesDefeated: { enemyId: string; level: number }[]
): { items: DropResult[]; meseta: number } {
  let totalMeseta = 0;
  const allDrops: DropResult[] = [];

  for (const enemy of enemiesDefeated) {
    const dropTable = getEnemyDropTable(areaId, difficulty, enemy.enemyId);
    if (dropTable) {
      const drops = rollEnemyDrops(dropTable, difficulty);
      allDrops.push(...drops);
    }

    totalMeseta += calculateMesetaDrop(enemy.level, difficulty);
  }

  return {
    items: allDrops,
    meseta: totalMeseta,
  };
}

/**
 * Get drop rate display string
 */
export function formatDropRate(rate: number): string {
  if (rate >= 0.01) {
    return `${(rate * 100).toFixed(1)}%`;
  }
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Get effective drop rate after difficulty modifier
 */
export function getEffectiveDropRate(rate: number, difficulty: Difficulty): string {
  const effective = applyDifficultyModifier(rate, difficulty);
  return formatDropRate(effective);
}

/**
 * Check if drop rate is considered "rare"
 */
export function isRareDropRate(rate: number): boolean {
  return rate < 0.01; // Less than 1%
}

/**
 * Clear all drop tables (for testing)
 */
export function clearDropTables(): void {
  dropTables.clear();
}
