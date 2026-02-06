/**
 * Combat System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBaseDamage,
  calculateElementalMultiplier,
  applyDefense,
  applyCritical,
  applyVariance,
  calculateDamage,
  getMinDamage,
  getMaxDamage,
  getDamageRange,
} from './damage';
import {
  calculateHitChance,
  calculateCriticalChance,
  rollHit,
  rollCritical,
  getHitChanceDisplay,
  getEffectiveAccuracy,
  hasAccuracyAdvantage,
  hasAccuracyDisadvantage,
  compareAccuracy,
  requiredAccuracyFor,
} from './accuracy';
import {
  resolveAttack,
  applyDamage,
  isDefeated,
  healCombatant,
  getHpPercent,
  getHpBarColor,
  simulateAverageDamage,
} from './combat';
import type { WeaponStats, CombatStats } from './types';
import { CRITICAL_MULTIPLIER, BASE_HIT_CHANCE, MAX_HIT_CHANCE, MIN_HIT_CHANCE } from './types';

describe('Combat - Base Damage Calculation', () => {
  it('calculates base damage from attack stats', () => {
    expect(calculateBaseDamage(50, 100)).toBe(150);
    expect(calculateBaseDamage(100, 200)).toBe(300);
  });

  it('includes grind bonus', () => {
    expect(calculateBaseDamage(50, 100, 20)).toBe(170);
  });

  it('returns minimum of 1', () => {
    expect(calculateBaseDamage(0, 0, 0)).toBe(1);
  });
});

describe('Combat - Elemental Multiplier', () => {
  it('returns 1.0 for no element', () => {
    expect(calculateElementalMultiplier(null, null, 0)).toBe(1.0);
    expect(calculateElementalMultiplier('fire', null, 50)).toBe(1.0);
    expect(calculateElementalMultiplier(null, 'ice', 50)).toBe(1.0);
  });

  it('returns bonus for hitting weakness', () => {
    // Fire vs Ice weakness (ice is weak to fire? No, ice beats fire)
    // Actually fire and ice are opposites
    expect(calculateElementalMultiplier('fire', 'ice', 100)).toBe(1.5);
    expect(calculateElementalMultiplier('ice', 'fire', 100)).toBe(1.5);
  });

  it('scales bonus with element percent', () => {
    expect(calculateElementalMultiplier('fire', 'ice', 50)).toBe(1.25);
    expect(calculateElementalMultiplier('fire', 'ice', 0)).toBe(1.0);
  });

  it('light beats dark', () => {
    expect(calculateElementalMultiplier('light', 'dark', 100)).toBe(1.5);
  });

  it('returns 1.0 for non-weakness', () => {
    expect(calculateElementalMultiplier('fire', 'lightning', 100)).toBe(1.0);
  });
});

describe('Combat - Defense Reduction', () => {
  // New formula: damage - (defense * 0.25) - (damage * defense / 600)
  // Flat reduction + percentage reduction for meaningful tank differentiation

  it('reduces damage based on defense', () => {
    // 100 - (100 * 0.25) - (100 * 100 / 600) = 100 - 25 - 16.67 = 58
    expect(applyDefense(100, 100)).toBe(58);
  });

  it('handles zero defense', () => {
    // 100 - 0 - 0 = 100
    expect(applyDefense(100, 0)).toBe(100);
  });

  it('handles high defense (CAST tank level)', () => {
    // 100 - (200 * 0.25) - (100 * 200 / 600) = 100 - 50 - 33.33 = 16
    expect(applyDefense(100, 200)).toBe(16);
  });

  it('returns minimum of 1', () => {
    expect(applyDefense(1, 10000)).toBe(1);
  });

  it('handles negative defense as zero', () => {
    expect(applyDefense(100, -50)).toBe(100);
  });
});

describe('Combat - Critical Hits', () => {
  it('applies critical multiplier', () => {
    expect(applyCritical(100, true)).toBe(Math.floor(100 * CRITICAL_MULTIPLIER));
    expect(applyCritical(100, true)).toBe(150);
  });

  it('returns original damage when not critical', () => {
    expect(applyCritical(100, false)).toBe(100);
  });
});

describe('Combat - Damage Variance', () => {
  it('applies deterministic variance with seed', () => {
    // Seed 10: (10 % 21 - 10) / 100 = 0 / 100 = 0%
    expect(applyVariance(100, 10)).toBe(100);
  });

  it('variance stays within ±10%', () => {
    const damage = 100;
    for (let seed = 0; seed < 100; seed++) {
      const result = applyVariance(damage, seed);
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(110);
    }
  });

  it('returns minimum of 1', () => {
    expect(applyVariance(1, 0)).toBeGreaterThanOrEqual(1);
  });
});

describe('Combat - Full Damage Calculation', () => {
  const weapon: WeaponStats = {
    attack: 100,
    accuracy: 50,
    element: 'fire',
    elementPercent: 50,
    grindBonus: 10,
  };

  it('calculates complete damage pipeline', () => {
    const result = calculateDamage(
      { attack: 50 },
      weapon,
      { defense: 50, weakness: 'ice' },
      { isCritical: false, varianceSeed: 10 }
    );

    expect(result.baseDamage).toBe(160); // 50 + 100 + 10
    expect(result.attackBonus).toBe(110); // 100 + 10
    expect(result.criticalMultiplier).toBe(1.0);
  });

  it('applies critical multiplier in calculation', () => {
    const result = calculateDamage(
      { attack: 50 },
      { ...weapon, element: null, elementPercent: 0 },
      { defense: 0 },
      { isCritical: true, varianceSeed: 10 }
    );

    expect(result.criticalMultiplier).toBe(CRITICAL_MULTIPLIER);
  });
});

describe('Combat - Damage Range Display', () => {
  it('calculates min and max damage', () => {
    expect(getMinDamage(100)).toBe(90);
    expect(getMaxDamage(100)).toBe(110);
  });

  it('gets damage range for UI', () => {
    const range = getDamageRange(50, 100, 50);
    // Base: 150, after defense: 150 - (50 * 0.25) - (150 * 50 / 600) = 150 - 12.5 - 12.5 = 125
    expect(range.min).toBe(112); // floor(125 * 0.9)
    expect(range.max).toBe(137); // floor(125 * 1.1)
  });
});

describe('Combat - Hit Chance Calculation', () => {
  it('returns base hit chance for equal stats', () => {
    expect(calculateHitChance(100, 100)).toBe(BASE_HIT_CHANCE);
  });

  it('increases hit chance with higher accuracy', () => {
    const baseChance = calculateHitChance(100, 100);
    const higherChance = calculateHitChance(150, 100);
    expect(higherChance).toBeGreaterThan(baseChance);
  });

  it('decreases hit chance with higher evasion', () => {
    const baseChance = calculateHitChance(100, 100);
    const lowerChance = calculateHitChance(100, 150);
    expect(lowerChance).toBeLessThan(baseChance);
  });

  it('caps at maximum hit chance', () => {
    expect(calculateHitChance(1000, 0)).toBe(MAX_HIT_CHANCE);
  });

  it('floors at minimum hit chance', () => {
    expect(calculateHitChance(0, 1000)).toBe(MIN_HIT_CHANCE);
  });
});

describe('Combat - Critical Chance', () => {
  it('returns base crit chance with no bonuses', () => {
    expect(calculateCriticalChance(0, 0)).toBe(0.05);
  });

  it('increases with luck', () => {
    expect(calculateCriticalChance(100, 0)).toBeCloseTo(0.15); // 5% + 10%
  });

  it('includes weapon crit bonus', () => {
    expect(calculateCriticalChance(0, 0.1)).toBeCloseTo(0.15); // 5% + 10%
  });

  it('caps at 25%', () => {
    expect(calculateCriticalChance(1000, 0.5)).toBe(0.25);
  });
});

describe('Combat - Roll Functions', () => {
  it('rollHit uses deterministic seed', () => {
    // Seed 30 = 30% chance, should hit if chance is > 0.3
    expect(rollHit(0.5, 30)).toBe(true); // 0.3 < 0.5
    expect(rollHit(0.2, 30)).toBe(false); // 0.3 >= 0.2
  });

  it('rollCritical uses deterministic seed', () => {
    expect(rollCritical(0.1, 5)).toBe(true); // 0.05 < 0.1
    expect(rollCritical(0.05, 10)).toBe(false); // 0.1 >= 0.05
  });
});

describe('Combat - Hit Chance Display', () => {
  it('formats hit chance as percentage', () => {
    expect(getHitChanceDisplay(0.7)).toBe('70%');
    expect(getHitChanceDisplay(0.85)).toBe('85%');
    expect(getHitChanceDisplay(0.333)).toBe('33%');
  });
});

describe('Combat - Effective Accuracy', () => {
  it('calculates net accuracy', () => {
    expect(getEffectiveAccuracy(100, 50)).toBe(50);
    expect(getEffectiveAccuracy(50, 100)).toBe(0); // Clamped to 0
  });
});

describe('Combat - Accuracy Advantage', () => {
  it('detects advantage at high hit chance', () => {
    expect(hasAccuracyAdvantage(0.85)).toBe(true);
    expect(hasAccuracyAdvantage(0.90)).toBe(true);
    expect(hasAccuracyAdvantage(0.80)).toBe(false);
  });

  it('detects disadvantage at low hit chance', () => {
    expect(hasAccuracyDisadvantage(0.45)).toBe(true);
    expect(hasAccuracyDisadvantage(0.40)).toBe(true);
    expect(hasAccuracyDisadvantage(0.50)).toBe(false);
  });

  it('compares accuracy correctly', () => {
    expect(compareAccuracy(200, 50)).toBe('advantage');
    expect(compareAccuracy(50, 200)).toBe('disadvantage');
    expect(compareAccuracy(100, 100)).toBe('neutral');
  });
});

describe('Combat - Required Accuracy', () => {
  it('calculates accuracy needed for target hit chance', () => {
    // To hit 90% with 50 evasion
    const required = requiredAccuracyFor(0.9, 50);
    const hitChance = calculateHitChance(required, 50);
    expect(hitChance).toBeGreaterThanOrEqual(0.9);
  });
});

describe('Combat - Attack Resolution', () => {
  const attacker: CombatStats = {
    attack: 100,
    defense: 50,
    accuracy: 100,
    evasion: 50,
    hp: 500,
    maxHp: 500,
  };

  const weapon: WeaponStats = {
    attack: 100,
    accuracy: 30,
    element: null,
    elementPercent: 0,
    grindBonus: 0,
  };

  const defender: CombatStats = {
    attack: 50,
    defense: 50,
    accuracy: 50,
    evasion: 50,
    hp: 300,
    maxHp: 300,
  };

  it('resolves a hitting attack', () => {
    const result = resolveAttack({
      attacker,
      weapon,
      defender,
      seeds: { hit: 10, crit: 99, damage: 10 },
    });

    expect(result.hit).toBe(true);
    expect(result.totalDamage).toBeGreaterThan(0);
    expect(result.critical).toBe(false);
  });

  it('resolves a missing attack', () => {
    const result = resolveAttack({
      attacker,
      weapon,
      defender,
      seeds: { hit: 99, crit: 99, damage: 10 }, // 99% seed > most hit chances
    });

    expect(result.hit).toBe(false);
    expect(result.totalDamage).toBe(0);
    expect(result.damage).toBe(0);
  });

  it('resolves a critical hit', () => {
    const result = resolveAttack({
      attacker: { ...attacker, luck: 100 }, // High luck for higher crit chance
      weapon: { ...weapon, critBonus: 0.2 },
      defender,
      seeds: { hit: 10, crit: 1, damage: 10 }, // Low crit seed = crit
    });

    expect(result.hit).toBe(true);
    expect(result.critical).toBe(true);
  });
});

describe('Combat - HP Management', () => {
  const combatant: CombatStats = {
    attack: 100,
    defense: 50,
    accuracy: 100,
    evasion: 50,
    hp: 500,
    maxHp: 500,
  };

  it('applies damage', () => {
    const damaged = applyDamage(combatant, 100);
    expect(damaged.hp).toBe(400);
  });

  it('does not go below 0 HP', () => {
    const damaged = applyDamage(combatant, 1000);
    expect(damaged.hp).toBe(0);
  });

  it('detects defeat', () => {
    expect(isDefeated(combatant)).toBe(false);
    expect(isDefeated({ ...combatant, hp: 0 })).toBe(true);
    expect(isDefeated({ ...combatant, hp: -10 })).toBe(true);
  });

  it('heals combatant', () => {
    const damaged = { ...combatant, hp: 200 };
    const healed = healCombatant(damaged, 100);
    expect(healed.hp).toBe(300);
  });

  it('does not overheal', () => {
    const damaged = { ...combatant, hp: 450 };
    const healed = healCombatant(damaged, 100);
    expect(healed.hp).toBe(500); // Capped at maxHp
  });
});

describe('Combat - HP Display', () => {
  it('calculates HP percentage', () => {
    expect(getHpPercent({ hp: 50, maxHp: 100 } as CombatStats)).toBe(50);
    expect(getHpPercent({ hp: 75, maxHp: 100 } as CombatStats)).toBe(75);
    expect(getHpPercent({ hp: 0, maxHp: 100 } as CombatStats)).toBe(0);
  });

  it('handles zero maxHp', () => {
    expect(getHpPercent({ hp: 0, maxHp: 0 } as CombatStats)).toBe(0);
  });

  it('returns correct HP bar color', () => {
    expect(getHpBarColor(75)).toBe('green');
    expect(getHpBarColor(51)).toBe('green');
    expect(getHpBarColor(50)).toBe('yellow');
    expect(getHpBarColor(26)).toBe('yellow');
    expect(getHpBarColor(25)).toBe('red');
    expect(getHpBarColor(0)).toBe('red');
  });
});

describe('Combat - Damage Simulation', () => {
  const params = {
    attacker: {
      attack: 100,
      defense: 50,
      accuracy: 100,
      evasion: 50,
      hp: 500,
      maxHp: 500,
    },
    weapon: {
      attack: 100,
      accuracy: 30,
      element: null as const,
      elementPercent: 0,
      grindBonus: 0,
    },
    defender: {
      attack: 50,
      defense: 50,
      accuracy: 50,
      evasion: 50,
      hp: 300,
      maxHp: 300,
    },
  };

  it('simulates average damage', () => {
    const result = simulateAverageDamage(params, 100);

    expect(result.averageDamage).toBeGreaterThan(0);
    expect(result.hitRate).toBeGreaterThan(0);
    expect(result.hitRate).toBeLessThanOrEqual(1);
    expect(result.critRate).toBeLessThanOrEqual(1);
  });
});
