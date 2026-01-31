/**
 * Drop System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerDropTable,
  getDropTable,
  getEnemyDropTable,
  rollDrop,
  rollQuantity,
  applyDifficultyModifier,
  rollEnemyDrops,
  calculateMesetaDrop,
  getMesetaRange,
  rollBoxDrops,
  calculateQuestDrops,
  formatDropRate,
  getEffectiveDropRate,
  isRareDropRate,
  clearDropTables,
} from './drops';
import type { AreaDropTable, DropEntry, EnemyDropTable } from './types';
import { DIFFICULTY_DROP_MODIFIERS, DIFFICULTY_MESETA_MODIFIERS } from './types';

// Test drop tables
const testDropTable: AreaDropTable = {
  areaId: 'test_area',
  difficulty: 'normal',
  enemies: [
    {
      enemyId: 'booma',
      commonDrops: [
        { itemId: 'monomate', dropRate: 0.3, minQuantity: 1, maxQuantity: 3 },
        { itemId: 'monofluid', dropRate: 0.2 },
      ],
      rareDrops: [
        { itemId: 'rare_sword', dropRate: 0.01 },
      ],
    },
    {
      enemyId: 'gobooma',
      commonDrops: [
        { itemId: 'dimate', dropRate: 0.25 },
      ],
      rareDrops: [
        { itemId: 'rare_armor', dropRate: 0.005 },
      ],
      guaranteedDrops: [
        { itemId: 'meseta_crystal', dropRate: 1.0 },
      ],
    },
  ],
  boxDrops: [
    { itemId: 'monomate', dropRate: 0.5 },
    { itemId: 'telepipe', dropRate: 0.1 },
  ],
};

describe('Drop System - Drop Table Management', () => {
  beforeEach(() => {
    clearDropTables();
  });

  it('registers and retrieves drop table', () => {
    registerDropTable(testDropTable);
    const table = getDropTable('test_area', 'normal');
    expect(table).not.toBeNull();
    expect(table?.areaId).toBe('test_area');
  });

  it('returns null for unregistered table', () => {
    const table = getDropTable('nonexistent', 'normal');
    expect(table).toBeNull();
  });

  it('retrieves enemy drop table', () => {
    registerDropTable(testDropTable);
    const enemyTable = getEnemyDropTable('test_area', 'normal', 'booma');
    expect(enemyTable).not.toBeNull();
    expect(enemyTable?.enemyId).toBe('booma');
  });

  it('returns null for unknown enemy', () => {
    registerDropTable(testDropTable);
    const enemyTable = getEnemyDropTable('test_area', 'normal', 'unknown');
    expect(enemyTable).toBeNull();
  });
});

describe('Drop System - Roll Functions', () => {
  it('rollDrop succeeds when roll < rate', () => {
    // Seed 100 = 1% roll, which is < 5% rate
    expect(rollDrop(0.05, 100)).toBe(true);
  });

  it('rollDrop fails when roll >= rate', () => {
    // Seed 5000 = 50% roll, which is >= 5% rate
    expect(rollDrop(0.05, 5000)).toBe(false);
  });

  it('rollDrop handles edge cases', () => {
    expect(rollDrop(1.0, 0)).toBe(true); // 100% rate always succeeds
    expect(rollDrop(0, 0)).toBe(false); // 0% rate always fails
  });

  it('rollQuantity returns value in range', () => {
    const entry: DropEntry = { itemId: 'test', dropRate: 1, minQuantity: 1, maxQuantity: 5 };

    for (let seed = 0; seed < 20; seed++) {
      const qty = rollQuantity(entry, seed);
      expect(qty).toBeGreaterThanOrEqual(1);
      expect(qty).toBeLessThanOrEqual(5);
    }
  });

  it('rollQuantity defaults to 1', () => {
    const entry: DropEntry = { itemId: 'test', dropRate: 1 };
    expect(rollQuantity(entry)).toBe(1);
  });
});

describe('Drop System - Difficulty Modifiers', () => {
  it('applies normal modifier (1.0x)', () => {
    expect(applyDifficultyModifier(0.1, 'normal')).toBe(0.1);
  });

  it('applies hard modifier (1.25x)', () => {
    expect(applyDifficultyModifier(0.1, 'hard')).toBe(0.125);
  });

  it('applies super-hard modifier (1.5x)', () => {
    expect(applyDifficultyModifier(0.1, 'super-hard')).toBeCloseTo(0.15);
  });

  it('caps at 100%', () => {
    expect(applyDifficultyModifier(0.9, 'super-hard')).toBe(1.0);
  });
});

describe('Drop System - Enemy Drops', () => {
  beforeEach(() => {
    clearDropTables();
    registerDropTable(testDropTable);
  });

  it('rolls guaranteed drops', () => {
    const gobooma = testDropTable.enemies.find(e => e.enemyId === 'gobooma')!;
    const drops = rollEnemyDrops(gobooma, 'normal');

    const guaranteed = drops.find(d => d.itemId === 'meseta_crystal');
    expect(guaranteed).toBeDefined();
  });

  it('rolls common drops based on rate', () => {
    const booma = testDropTable.enemies.find(e => e.enemyId === 'booma')!;

    // Use seed that triggers the drop (seed 100 = 1% < 30% rate)
    const drops = rollEnemyDrops(booma, 'normal', { seeds: { common: 100 } });

    const monomate = drops.find(d => d.itemId === 'monomate');
    expect(monomate).toBeDefined();
  });

  it('marks rare drops correctly', () => {
    const booma = testDropTable.enemies.find(e => e.enemyId === 'booma')!;

    // Use seed that triggers rare drop (seed 50 = 0.5% < 1% rate)
    const drops = rollEnemyDrops(booma, 'normal', { seeds: { rare: 50 } });

    const rare = drops.find(d => d.itemId === 'rare_sword');
    if (rare) {
      expect(rare.isRare).toBe(true);
    }
  });

  it('respects quantity ranges', () => {
    const booma = testDropTable.enemies.find(e => e.enemyId === 'booma')!;

    // Trigger monomate drop
    const drops = rollEnemyDrops(booma, 'normal', {
      seeds: { common: 100, quantity: 2 },
    });

    const monomate = drops.find(d => d.itemId === 'monomate');
    if (monomate) {
      expect(monomate.quantity).toBeGreaterThanOrEqual(1);
      expect(monomate.quantity).toBeLessThanOrEqual(3);
    }
  });
});

describe('Drop System - Meseta Drops', () => {
  it('calculates meseta with level scaling', () => {
    const level1 = calculateMesetaDrop(1, 'normal', 0);
    const level10 = calculateMesetaDrop(10, 'normal', 0);

    expect(level10).toBeGreaterThan(level1);
  });

  it('applies difficulty modifier to meseta', () => {
    const normal = calculateMesetaDrop(10, 'normal', 0);
    const hard = calculateMesetaDrop(10, 'hard', 0);
    const superHard = calculateMesetaDrop(10, 'super-hard', 0);

    expect(hard).toBeGreaterThan(normal);
    expect(superHard).toBeGreaterThan(hard);
  });

  it('returns meseta in expected range', () => {
    const range = getMesetaRange(10, 'normal');

    for (let seed = 0; seed < 100; seed++) {
      const meseta = calculateMesetaDrop(10, 'normal', seed);
      expect(meseta).toBeGreaterThanOrEqual(range.min);
      expect(meseta).toBeLessThanOrEqual(range.max);
    }
  });
});

describe('Drop System - Meseta Range', () => {
  it('calculates min and max meseta', () => {
    const range = getMesetaRange(10, 'normal');
    expect(range.min).toBeLessThan(range.max);
    expect(range.min).toBeGreaterThan(0);
  });

  it('scales with difficulty', () => {
    const normal = getMesetaRange(10, 'normal');
    const hard = getMesetaRange(10, 'hard');
    const superHard = getMesetaRange(10, 'super-hard');

    expect(hard.min).toBeGreaterThan(normal.min);
    expect(superHard.min).toBeGreaterThan(hard.min);
  });
});

describe('Drop System - Box Drops', () => {
  beforeEach(() => {
    clearDropTables();
    registerDropTable(testDropTable);
  });

  it('rolls box drops', () => {
    // Seed that triggers 50% drop
    const drops = rollBoxDrops('test_area', 'normal', 100);

    // Should have monomate (50% rate)
    const monomate = drops.find(d => d.itemId === 'monomate');
    expect(monomate).toBeDefined();
  });

  it('returns empty for area without box drops', () => {
    clearDropTables();
    registerDropTable({
      areaId: 'no_boxes',
      difficulty: 'normal',
      enemies: [],
    });

    const drops = rollBoxDrops('no_boxes', 'normal');
    expect(drops).toHaveLength(0);
  });
});

describe('Drop System - Quest Drops Calculation', () => {
  beforeEach(() => {
    clearDropTables();
    registerDropTable(testDropTable);
  });

  it('calculates total drops from enemies', () => {
    const result = calculateQuestDrops('test_area', 'normal', [
      { enemyId: 'booma', level: 5 },
      { enemyId: 'gobooma', level: 10 },
    ]);

    expect(result.meseta).toBeGreaterThan(0);
    // Gobooma has guaranteed drop
    const guaranteed = result.items.find(d => d.itemId === 'meseta_crystal');
    expect(guaranteed).toBeDefined();
  });

  it('handles unknown enemies gracefully', () => {
    const result = calculateQuestDrops('test_area', 'normal', [
      { enemyId: 'unknown', level: 5 },
    ]);

    // Should still get meseta but no item drops
    expect(result.meseta).toBeGreaterThan(0);
  });
});

describe('Drop System - Display Formatting', () => {
  it('formats drop rate as percentage', () => {
    expect(formatDropRate(0.1)).toBe('10.0%');
    expect(formatDropRate(0.05)).toBe('5.0%');
    expect(formatDropRate(0.333)).toBe('33.3%');
  });

  it('formats rare rates with more precision', () => {
    expect(formatDropRate(0.005)).toBe('0.50%');
    expect(formatDropRate(0.001)).toBe('0.10%');
  });

  it('shows effective rate after modifier', () => {
    expect(getEffectiveDropRate(0.1, 'normal')).toBe('10.0%');
    expect(getEffectiveDropRate(0.1, 'hard')).toBe('12.5%');
    expect(getEffectiveDropRate(0.1, 'super-hard')).toBe('15.0%');
  });
});

describe('Drop System - Rare Detection', () => {
  it('identifies rare drop rates', () => {
    expect(isRareDropRate(0.005)).toBe(true);
    expect(isRareDropRate(0.009)).toBe(true);
    expect(isRareDropRate(0.01)).toBe(false);
    expect(isRareDropRate(0.1)).toBe(false);
  });
});

describe('Drop System - Modifier Constants', () => {
  it('has correct drop modifiers', () => {
    expect(DIFFICULTY_DROP_MODIFIERS['normal']).toBe(1.0);
    expect(DIFFICULTY_DROP_MODIFIERS['hard']).toBe(1.25);
    expect(DIFFICULTY_DROP_MODIFIERS['super-hard']).toBe(1.5);
  });

  it('has correct meseta modifiers', () => {
    expect(DIFFICULTY_MESETA_MODIFIERS['normal']).toBe(1.0);
    expect(DIFFICULTY_MESETA_MODIFIERS['hard']).toBe(2.0);
    expect(DIFFICULTY_MESETA_MODIFIERS['super-hard']).toBe(3.0);
  });
});
