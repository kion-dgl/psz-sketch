/**
 * Leveling System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getLevelForExp,
  getExpForLevel,
  getExpToNextLevel,
  getExpRequiredForLevel,
  getLevelProgress,
  applyExpGain,
  getExpInfo,
  getExpMultiplier,
  calculateTotalExp,
  getLevelCap,
  meetsLevelRequirement,
  MAX_LEVEL,
  MIN_LEVEL,
} from './leveling';

describe('Leveling System - getLevelForExp', () => {
  it('returns level 1 for 0 experience', () => {
    expect(getLevelForExp(0)).toBe(1);
  });

  it('returns level 1 for negative experience', () => {
    expect(getLevelForExp(-100)).toBe(1);
  });

  it('returns level 2 at 70 exp', () => {
    expect(getLevelForExp(70)).toBe(2);
  });

  it('returns level 10 at 3100 exp', () => {
    expect(getLevelForExp(3100)).toBe(10);
  });

  it('returns level 50 at 306700 exp', () => {
    expect(getLevelForExp(306700)).toBe(50);
  });

  it('returns level 100 at max exp', () => {
    expect(getLevelForExp(6355210)).toBe(100);
  });

  it('handles partial progress correctly', () => {
    // 69 exp is not enough for level 2
    expect(getLevelForExp(69)).toBe(1);
    // 71 exp is past level 2 threshold
    expect(getLevelForExp(71)).toBe(2);
  });
});

describe('Leveling System - getExpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(getExpForLevel(1)).toBe(0);
  });

  it('returns 70 for level 2', () => {
    expect(getExpForLevel(2)).toBe(70);
  });

  it('returns correct exp for level 10', () => {
    expect(getExpForLevel(10)).toBe(3100);
  });

  it('returns correct exp for level 50', () => {
    expect(getExpForLevel(50)).toBe(306700);
  });

  it('returns correct exp for level 100', () => {
    expect(getExpForLevel(100)).toBe(6355210);
  });

  it('handles below minimum level', () => {
    expect(getExpForLevel(0)).toBe(0);
    expect(getExpForLevel(-1)).toBe(0);
  });

  it('handles above maximum level', () => {
    expect(getExpForLevel(101)).toBe(6355210);
  });
});

describe('Leveling System - getExpToNextLevel', () => {
  it('returns 70 at 0 exp (level 1)', () => {
    expect(getExpToNextLevel(0)).toBe(70);
  });

  it('returns correct exp at partial level', () => {
    // At 35 exp, need 35 more to reach level 2 (70)
    expect(getExpToNextLevel(35)).toBe(35);
  });

  it('returns null at max level', () => {
    expect(getExpToNextLevel(6355210)).toBeNull();
  });

  it('calculates correctly mid-level', () => {
    // Level 10 starts at 3100, level 11 at 4000
    // At 3500 exp, need 500 more
    expect(getExpToNextLevel(3500)).toBe(500);
  });
});

describe('Leveling System - getExpRequiredForLevel', () => {
  it('returns 70 for level 1', () => {
    expect(getExpRequiredForLevel(1)).toBe(70);
  });

  it('returns 90 for level 2', () => {
    expect(getExpRequiredForLevel(2)).toBe(90);
  });

  it('returns null for level 100 (no next level)', () => {
    expect(getExpRequiredForLevel(100)).toBeNull();
  });

  it('returns null for invalid levels', () => {
    expect(getExpRequiredForLevel(0)).toBeNull();
    expect(getExpRequiredForLevel(101)).toBeNull();
  });
});

describe('Leveling System - getLevelProgress', () => {
  it('returns 0 at level start', () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it('returns 50 at halfway through level', () => {
    // Level 1: 0 to 70, halfway is 35
    expect(getLevelProgress(35)).toBe(50);
  });

  it('returns 100 at max level', () => {
    expect(getLevelProgress(6355210)).toBe(100);
  });

  it('calculates mid-level progress correctly', () => {
    // Level 10: 3100 to 4000 (900 range)
    // At 3550, that's 450/900 = 50%
    expect(getLevelProgress(3550)).toBe(50);
  });
});

describe('Leveling System - applyExpGain', () => {
  it('applies exp without level up', () => {
    const result = applyExpGain(0, 35);
    expect(result.previousLevel).toBe(1);
    expect(result.newLevel).toBe(1);
    expect(result.levelsGained).toBe(0);
    expect(result.currentExp).toBe(35);
    expect(result.didLevelUp).toBe(false);
  });

  it('applies exp with single level up', () => {
    const result = applyExpGain(0, 80);
    expect(result.previousLevel).toBe(1);
    expect(result.newLevel).toBe(2);
    expect(result.levelsGained).toBe(1);
    expect(result.currentExp).toBe(80);
    expect(result.didLevelUp).toBe(true);
  });

  it('applies exp with multiple level ups', () => {
    const result = applyExpGain(0, 500);
    expect(result.previousLevel).toBe(1);
    expect(result.newLevel).toBe(5);
    expect(result.levelsGained).toBe(4);
    expect(result.didLevelUp).toBe(true);
  });

  it('throws error for negative exp gain', () => {
    expect(() => applyExpGain(100, -50)).toThrow('cannot be negative');
  });

  it('returns correct expToNextLevel', () => {
    const result = applyExpGain(0, 100);
    // Level 2 at 70, level 3 at 160
    // At 100, need 60 more to reach 160
    expect(result.expToNextLevel).toBe(60);
  });

  it('returns null expToNextLevel at max', () => {
    const result = applyExpGain(6355210, 1000);
    expect(result.expToNextLevel).toBeNull();
  });
});

describe('Leveling System - getExpInfo', () => {
  it('returns complete exp info for new character', () => {
    const info = getExpInfo(0);
    expect(info.level).toBe(1);
    expect(info.currentExp).toBe(0);
    expect(info.expToNextLevel).toBe(70);
    expect(info.levelProgress).toBe(0);
    expect(info.isMaxLevel).toBe(false);
  });

  it('returns complete exp info for mid-level character', () => {
    const info = getExpInfo(50000);
    expect(info.level).toBe(27); // 50000 is between level 27 (46440) and 28 (51610)
    expect(info.currentExp).toBe(50000);
    expect(info.isMaxLevel).toBe(false);
  });

  it('returns complete exp info for max level character', () => {
    const info = getExpInfo(6355210);
    expect(info.level).toBe(100);
    expect(info.expToNextLevel).toBeNull();
    expect(info.levelProgress).toBe(100);
    expect(info.isMaxLevel).toBe(true);
  });
});

describe('Leveling System - Difficulty Multipliers', () => {
  it('returns 1.0 for normal difficulty', () => {
    expect(getExpMultiplier('normal')).toBe(1.0);
  });

  it('returns 1.5 for hard difficulty', () => {
    expect(getExpMultiplier('hard')).toBe(1.5);
  });

  it('returns 2.0 for super-hard difficulty', () => {
    expect(getExpMultiplier('super-hard')).toBe(2.0);
  });

  it('calculates total exp with multiplier', () => {
    expect(calculateTotalExp(100, 'normal')).toBe(100);
    expect(calculateTotalExp(100, 'hard')).toBe(150);
    expect(calculateTotalExp(100, 'super-hard')).toBe(200);
  });

  it('floors fractional exp', () => {
    expect(calculateTotalExp(33, 'hard')).toBe(49); // 33 * 1.5 = 49.5 -> 49
  });
});

describe('Leveling System - Level Caps', () => {
  it('returns 50 for normal difficulty', () => {
    expect(getLevelCap('normal')).toBe(50);
  });

  it('returns 80 for hard difficulty', () => {
    expect(getLevelCap('hard')).toBe(80);
  });

  it('returns 100 for super-hard difficulty', () => {
    expect(getLevelCap('super-hard')).toBe(100);
  });
});

describe('Leveling System - Level Requirements', () => {
  it('normal allows any level', () => {
    expect(meetsLevelRequirement(1, 'normal')).toBe(true);
    expect(meetsLevelRequirement(50, 'normal')).toBe(true);
  });

  it('hard requires level 20', () => {
    expect(meetsLevelRequirement(19, 'hard')).toBe(false);
    expect(meetsLevelRequirement(20, 'hard')).toBe(true);
    expect(meetsLevelRequirement(50, 'hard')).toBe(true);
  });

  it('super-hard requires level 50', () => {
    expect(meetsLevelRequirement(49, 'super-hard')).toBe(false);
    expect(meetsLevelRequirement(50, 'super-hard')).toBe(true);
    expect(meetsLevelRequirement(100, 'super-hard')).toBe(true);
  });
});

describe('Leveling System - Constants', () => {
  it('exports MAX_LEVEL as 100', () => {
    expect(MAX_LEVEL).toBe(100);
  });

  it('exports MIN_LEVEL as 1', () => {
    expect(MIN_LEVEL).toBe(1);
  });
});
