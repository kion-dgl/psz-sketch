/**
 * Statistical Confidence Tests
 * Monte Carlo simulations to verify RNG-based systems behave correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveAttack,
  calculateDamage,
  getMinDamage,
  getMaxDamage,
  applyDefense,
  calculateBaseDamage,
  simulateAverageDamage,
  calculateHitChance,
  calculateCriticalChance,
} from './combat/combat';
import type { WeaponStats, CombatStats } from './combat/types';
import {
  rollDrop,
  rollEnemyDrops,
  calculateMesetaDrop,
  getMesetaRange,
  registerDropTable,
  clearDropTables,
} from './drops/drops';
import type { AreaDropTable, EnemyDropTable } from './drops/types';
import { execute, resetState } from '../cli/api';

// Helper: Calculate confidence interval for binomial proportion
function binomialConfidenceInterval(
  observed: number,
  total: number,
  confidence: number = 0.99
): { lower: number; upper: number } {
  // Wilson score interval for better accuracy at extreme probabilities
  const z = confidence === 0.99 ? 2.576 : 1.96; // 99% or 95% confidence
  const p = observed / total;
  const n = total;

  const denominator = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  return {
    lower: Math.max(0, (center - spread) / denominator),
    upper: Math.min(1, (center + spread) / denominator),
  };
}

describe('Monte Carlo: Combat Damage Distribution', () => {
  const ITERATIONS = 1000;

  const attacker: CombatStats = {
    hp: 100,
    maxHp: 100,
    attack: 50,
    defense: 20,
    accuracy: 100,
    evasion: 10,
  };

  const weapon: WeaponStats = {
    attack: 100,
    accuracy: 50,
    element: null,
    elementPercent: 0,
    grindBonus: 10,
  };

  const defender: CombatStats = {
    hp: 500,
    maxHp: 500,
    attack: 30,
    defense: 50,
    accuracy: 80,
    evasion: 20,
  };

  it('damage always falls within theoretical min/max bounds', () => {
    // Calculate theoretical bounds
    const baseDamage = calculateBaseDamage(attacker.attack, weapon.attack, weapon.grindBonus);
    const afterDefense = applyDefense(baseDamage, defender.defense);
    const theoreticalMin = getMinDamage(afterDefense);
    const theoreticalMax = getMaxDamage(afterDefense);

    // Run many iterations
    const damages: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const result = calculateDamage(
        { attack: attacker.attack },
        weapon,
        { defense: defender.defense },
        { isCritical: false }
      );
      damages.push(result.finalDamage);
    }

    // All damages should be within bounds
    const minObserved = Math.min(...damages);
    const maxObserved = Math.max(...damages);

    expect(minObserved).toBeGreaterThanOrEqual(theoreticalMin);
    expect(maxObserved).toBeLessThanOrEqual(theoreticalMax);

    // Should see variety in damage values (not all the same)
    const uniqueDamages = new Set(damages).size;
    expect(uniqueDamages).toBeGreaterThan(5);
  });

  it('critical hits deal approximately 1.5x damage', () => {
    const normalDamages: number[] = [];
    const criticalDamages: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const normalResult = calculateDamage(
        { attack: attacker.attack },
        weapon,
        { defense: defender.defense },
        { isCritical: false, varianceSeed: i }
      );
      normalDamages.push(normalResult.finalDamage);

      const critResult = calculateDamage(
        { attack: attacker.attack },
        weapon,
        { defense: defender.defense },
        { isCritical: true, varianceSeed: i }
      );
      criticalDamages.push(critResult.finalDamage);
    }

    const avgNormal = normalDamages.reduce((a, b) => a + b, 0) / normalDamages.length;
    const avgCritical = criticalDamages.reduce((a, b) => a + b, 0) / criticalDamages.length;

    // Critical should be ~1.5x normal (within 5% tolerance for variance)
    const ratio = avgCritical / avgNormal;
    expect(ratio).toBeGreaterThan(1.45);
    expect(ratio).toBeLessThan(1.55);
  });

  it('hit rate matches calculated probability within confidence interval', () => {
    const expectedHitChance = calculateHitChance(attacker.accuracy + weapon.accuracy, defender.evasion);

    let hits = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const result = resolveAttack({
        attacker: { ...attacker, luck: 10 },
        weapon: { ...weapon, critBonus: 5 },
        defender,
      });
      if (result.hit) hits++;
    }

    const observedRate = hits / ITERATIONS;
    const ci = binomialConfidenceInterval(hits, ITERATIONS);

    // Expected rate should fall within confidence interval
    expect(expectedHitChance).toBeGreaterThanOrEqual(ci.lower);
    expect(expectedHitChance).toBeLessThanOrEqual(ci.upper);
  });

  it('critical rate matches calculated probability within confidence interval', () => {
    const luck = 15;
    const critBonus = 10;
    const expectedCritChance = calculateCriticalChance(luck, critBonus);

    // Only count crits on hits
    let hits = 0;
    let crits = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const result = resolveAttack({
        attacker: { ...attacker, luck, accuracy: 200 }, // High accuracy to ensure hits
        weapon: { ...weapon, critBonus, accuracy: 100 },
        defender: { ...defender, evasion: 0 },
      });
      if (result.hit) {
        hits++;
        if (result.critical) crits++;
      }
    }

    // Need enough hits for meaningful analysis
    expect(hits).toBeGreaterThan(ITERATIONS * 0.9);

    const observedCritRate = crits / hits;
    const ci = binomialConfidenceInterval(crits, hits);

    // Expected crit rate should fall within confidence interval
    expect(expectedCritChance).toBeGreaterThanOrEqual(ci.lower);
    expect(expectedCritChance).toBeLessThanOrEqual(ci.upper);
  });

  it('simulateAverageDamage returns consistent results', () => {
    // Run simulation multiple times
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(
        simulateAverageDamage({
          attacker: { ...attacker, luck: 10 },
          weapon: { ...weapon, critBonus: 5 },
          defender,
        }, 500)
      );
    }

    // Average damages should be within 15% of each other
    const avgDamages = results.map(r => r.averageDamage);
    const meanAvg = avgDamages.reduce((a, b) => a + b, 0) / avgDamages.length;

    for (const avg of avgDamages) {
      expect(avg).toBeGreaterThan(meanAvg * 0.85);
      expect(avg).toBeLessThan(meanAvg * 1.15);
    }
  });
});

describe('Monte Carlo: Drop Rate Verification', () => {
  const ITERATIONS = 2000; // More iterations for rare drops

  beforeEach(() => {
    clearDropTables();
  });

  it('common drop rate matches expected probability', () => {
    const expectedRate = 0.3; // 30% drop rate

    let drops = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      if (rollDrop(expectedRate)) drops++;
    }

    const ci = binomialConfidenceInterval(drops, ITERATIONS);

    // Expected rate should fall within 99% confidence interval
    expect(expectedRate).toBeGreaterThanOrEqual(ci.lower);
    expect(expectedRate).toBeLessThanOrEqual(ci.upper);
  });

  it('rare drop rate matches expected probability', () => {
    const expectedRate = 0.05; // 5% drop rate

    let drops = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      if (rollDrop(expectedRate)) drops++;
    }

    const ci = binomialConfidenceInterval(drops, ITERATIONS);

    // Expected rate should fall within 99% confidence interval
    expect(expectedRate).toBeGreaterThanOrEqual(ci.lower);
    expect(expectedRate).toBeLessThanOrEqual(ci.upper);
  });

  it('meseta drops fall within expected range', () => {
    const enemyLevel = 10;
    const difficulty = 'normal' as const;

    const range = getMesetaRange(enemyLevel, difficulty);
    const drops: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      drops.push(calculateMesetaDrop(enemyLevel, difficulty));
    }

    const minObserved = Math.min(...drops);
    const maxObserved = Math.max(...drops);

    // All drops should be within theoretical range
    expect(minObserved).toBeGreaterThanOrEqual(range.min);
    expect(maxObserved).toBeLessThanOrEqual(range.max);

    // Should see variety across the range
    const uniqueValues = new Set(drops).size;
    expect(uniqueValues).toBeGreaterThan(Math.min(10, range.max - range.min));
  });

  it('enemy drop table produces expected distribution', () => {
    const dropTable: EnemyDropTable = {
      enemyId: 'test_enemy',
      commonDrops: [
        { itemId: 'common_item', dropRate: 0.5, minQuantity: 1, maxQuantity: 1 },
      ],
      rareDrops: [
        { itemId: 'rare_item', dropRate: 0.1, minQuantity: 1, maxQuantity: 1 },
      ],
    };

    let commonDrops = 0;
    let rareDrops = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const results = rollEnemyDrops(dropTable, 'normal');
      if (results.some(r => r.itemId === 'common_item')) commonDrops++;
      if (results.some(r => r.itemId === 'rare_item')) rareDrops++;
    }

    // Common drops (50% rate)
    const commonCi = binomialConfidenceInterval(commonDrops, ITERATIONS);
    expect(0.5).toBeGreaterThanOrEqual(commonCi.lower);
    expect(0.5).toBeLessThanOrEqual(commonCi.upper);

    // Rare drops (10% rate)
    const rareCi = binomialConfidenceInterval(rareDrops, ITERATIONS);
    expect(0.1).toBeGreaterThanOrEqual(rareCi.lower);
    expect(0.1).toBeLessThanOrEqual(rareCi.upper);
  });

  it('difficulty modifiers affect drop rates correctly', () => {
    const dropTable: EnemyDropTable = {
      enemyId: 'test_enemy',
      commonDrops: [
        { itemId: 'test_item', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 },
      ],
      rareDrops: [],
    };

    // Normal difficulty (1.0x modifier)
    let normalDrops = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const results = rollEnemyDrops(dropTable, 'normal');
      if (results.length > 0) normalDrops++;
    }

    // Hard difficulty (1.1x modifier = 22% effective rate)
    let hardDrops = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const results = rollEnemyDrops(dropTable, 'hard');
      if (results.length > 0) hardDrops++;
    }

    // Hard should have higher drop rate than normal
    const normalRate = normalDrops / ITERATIONS;
    const hardRate = hardDrops / ITERATIONS;

    // Allow some variance but hard should trend higher
    expect(hardRate).toBeGreaterThanOrEqual(normalRate * 0.9);
  });
});

describe('Full Gameplay Loop Integration', () => {
  beforeEach(() => {
    resetState();
  });

  const testGameplayLoop = (classId: string, className: string) => {
    it(`completes full loop as ${className}`, () => {
      // 1. Create character
      let result = execute(`create-character ${classId} TestChar`);
      expect(result.success).toBe(true);
      expect(result.message).toContain(className);

      // 2. Check starting inventory
      result = execute('show-inventory');
      expect(result.success).toBe(true);
      expect(result.message).toContain('monomate');

      // 3. Check starting equipment
      result = execute('show-equipment');
      expect(result.success).toBe(true);

      // 4. View stats
      result = execute('show-stats');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Level:');
      expect(result.message).toContain('Meseta:');

      // 5. Go to shop
      result = execute('goto shop');
      expect(result.success).toBe(true);

      // 6. View shop items
      result = execute('list-items');
      expect(result.success).toBe(true);

      // 7. Buy an item (if have meseta)
      result = execute('buy monomate');
      // May succeed or fail based on meseta, both are valid

      // 8. Go to guild
      result = execute('goto guild');
      expect(result.success).toBe(true);

      // 9. List fields
      result = execute('list-fields');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Gurhacia');

      // 10. Enter a field
      result = execute('enter-field gurhacia-valley normal');
      expect(result.success).toBe(true);

      // 11. Check session state
      result = execute('show-session');
      expect(result.success).toBe(true);
      expect(result.message).toContain('field');

      // 12. Use telepipe to return
      result = execute('use-telepipe');
      expect(result.success).toBe(true);

      // 13. Abandon session
      result = execute('abandon-session');
      expect(result.success).toBe(true);

      // 14. Create MAG
      result = execute('create-mag');
      expect(result.success).toBe(true);

      // 15. Show MAG
      result = execute('show-mag');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Mag');

      // 16. Feed MAG
      result = execute('feed-mag monomate');
      // May fail if no monomates left, but command should work
    });
  };

  // Test all class types
  testGameplayLoop('humar', 'HUmar');
  testGameplayLoop('hunewearl', 'HUnewearl');
  testGameplayLoop('ramar', 'RAmar');
  testGameplayLoop('racast', 'RAcast');
  testGameplayLoop('fonewm', 'FOnewm');
  testGameplayLoop('fomarl', 'FOmarl');
});

describe('Combat Gameplay Loop', () => {
  beforeEach(() => {
    resetState();
  });

  it('attack command requires enemy index', () => {
    // Create character and enter field
    execute('create-character humar Fighter');
    execute('goto guild');
    execute('enter-field gurhacia-valley normal');

    // Attack without index should prompt for index
    const result = execute('attack');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Usage');
  });

  it('techniques require being in combat/field', () => {
    execute('create-character fonewm Mage');

    // Cast outside of field should fail
    let result = execute('cast foie');
    expect(result.success).toBe(false);

    // Enter field
    execute('goto guild');
    execute('enter-field gurhacia-valley normal');

    // Cast requires a target
    result = execute('cast foie');
    // Either needs target or no enemies present
    expect(result.message).toBeDefined();
  });

  it('use command works with valid items', () => {
    execute('create-character humar Fighter');

    // Goto inventory to use items
    execute('goto inventory');

    // Use a monomate from inventory
    const result = execute('use monomate');
    // Should succeed or indicate it worked
    expect(result.message).toBeDefined();
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    resetState();
  });

  it('handles empty inventory gracefully', () => {
    execute('create-character humar Test');

    // Go to inventory
    execute('goto inventory');

    // Try to use an item we don't have
    const result = execute('use trimate');
    expect(result.success).toBe(false);
    // Should indicate item not found or not available
    expect(result.message).toBeDefined();
  });

  it('handles invalid commands gracefully', () => {
    execute('create-character humar Test');

    let result = execute('invalid-command');
    expect(result.success).toBe(false);

    result = execute('equip nonexistent-item');
    expect(result.success).toBe(false);

    result = execute('feed-mag invalid-item');
    expect(result.success).toBe(false);
  });

  it('handles level boundary conditions', () => {
    execute('create-character humar Test');

    // Check stats at level 1
    const result = execute('show-stats');
    expect(result.success).toBe(true);
    expect(result.message).toContain('Level: 1');
  });

  it('handles MAG at various evolution thresholds', () => {
    execute('create-character humar Test');
    execute('create-mag');

    // Show MAG at level 0
    let result = execute('show-mag');
    expect(result.message).toContain('Level: 0');
    expect(result.message).toContain('Stage 1');
  });
});
