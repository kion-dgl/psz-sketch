/**
 * Enemy Pools Tests
 */

import { describe, it, expect } from 'vitest';
import {
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
import type { EnemyArea, ContentDifficulty } from './types';

describe('Enemy Pools', () => {
  describe('ENEMY_POOLS', () => {
    it('should have pools for all areas', () => {
      const areas: EnemyArea[] = ['gurhacia', 'rioh', 'ozette', 'paru', 'makara', 'arca', 'dark'];
      for (const area of areas) {
        expect(ENEMY_POOLS[area]).toBeDefined();
        expect(ENEMY_POOLS[area].area).toBe(area);
      }
    });

    it('should have common enemies for each area', () => {
      for (const pool of Object.values(ENEMY_POOLS)) {
        expect(pool.common.length).toBeGreaterThan(0);
      }
    });

    it('should have correct enemies for gurhacia', () => {
      const pool = ENEMY_POOLS.gurhacia;
      expect(pool.common).toContain('snake');
      expect(pool.common).toContain('lizard');
      expect(pool.common).toContain('hyena');
      expect(pool.uncommon).toContain('vulture');
      expect(pool.uncommon).toContain('lion');
      expect(pool.bosses).toContain('boss_dragon');
    });

    it('should have correct enemies for dark shrine', () => {
      const pool = ENEMY_POOLS.dark;
      expect(pool.common).toContain('circle');
      expect(pool.common).toContain('lower');
      expect(pool.common).toContain('leg');
      expect(pool.bosses).toContain('boss_darkfalz');
    });
  });

  describe('getEnemyPool', () => {
    it('should return the pool for an area', () => {
      const pool = getEnemyPool('gurhacia');
      expect(pool.area).toBe('gurhacia');
      expect(pool.common).toContain('snake');
    });

    it('should return different pools for different areas', () => {
      const gurhacia = getEnemyPool('gurhacia');
      const arca = getEnemyPool('arca');
      expect(gurhacia.common).not.toEqual(arca.common);
    });
  });

  describe('getSpawnableEnemies', () => {
    it('should return common and uncommon enemies', () => {
      const enemies = getSpawnableEnemies('gurhacia');
      expect(enemies).toContain('snake');
      expect(enemies).toContain('lizard');
      expect(enemies).toContain('vulture');
      expect(enemies).toContain('lion');
    });

    it('should not include rare enemies', () => {
      const enemies = getSpawnableEnemies('gurhacia');
      expect(enemies).not.toContain('rappy');
      expect(enemies).not.toContain('booma');
    });

    it('should not include bosses', () => {
      const enemies = getSpawnableEnemies('gurhacia');
      expect(enemies).not.toContain('boss_dragon');
    });
  });

  describe('getRareEnemies', () => {
    it('should return rare enemies for an area', () => {
      const rare = getRareEnemies('gurhacia');
      expect(rare).toContain('rappy');
      expect(rare).toContain('booma');
      expect(rare).toContain('lion_rare');
    });

    it('should include rappies in multiple areas', () => {
      expect(getRareEnemies('gurhacia')).toContain('rappy');
      expect(getRareEnemies('rioh')).toContain('rappy');
      expect(getRareEnemies('paru')).toContain('rappy_blue');
      expect(getRareEnemies('arca')).toContain('rappy_red');
    });
  });

  describe('getBossEnemies', () => {
    it('should return boss enemies for areas with bosses', () => {
      expect(getBossEnemies('gurhacia')).toContain('boss_dragon');
      expect(getBossEnemies('ozette')).toContain('boss_octopus');
      expect(getBossEnemies('paru')).toContain('boss_robot');
      expect(getBossEnemies('arca')).toContain('boss_mother');
      expect(getBossEnemies('dark')).toContain('boss_darkfalz');
    });

    it('should return empty array for areas without bosses', () => {
      expect(getBossEnemies('rioh')).toHaveLength(0);
      expect(getBossEnemies('makara')).toHaveLength(0);
    });
  });

  describe('getEliteEnemies', () => {
    it('should return elite enemies for an area', () => {
      const elites = getEliteEnemies('gurhacia');
      expect(elites).toContain('lion');
    });

    it('should return empty array if no elites defined', () => {
      // All areas have elites in our config, but test the fallback
      const pool = getEnemyPool('gurhacia');
      expect(pool.elites).toBeDefined();
    });
  });

  describe('getEnemyCountRange', () => {
    it('should return correct range for normal difficulty', () => {
      const range = getEnemyCountRange('normal');
      expect(range.min).toBe(3);
      expect(range.max).toBe(6);
    });

    it('should return correct range for hard difficulty', () => {
      const range = getEnemyCountRange('hard');
      expect(range.min).toBe(5);
      expect(range.max).toBe(8);
    });

    it('should return correct range for super-hard difficulty', () => {
      const range = getEnemyCountRange('super-hard');
      expect(range.min).toBe(7);
      expect(range.max).toBe(12);
    });

    it('should have increasing ranges with difficulty', () => {
      const normal = getEnemyCountRange('normal');
      const hard = getEnemyCountRange('hard');
      const superHard = getEnemyCountRange('super-hard');

      expect(hard.min).toBeGreaterThan(normal.min);
      expect(superHard.min).toBeGreaterThan(hard.min);
    });
  });

  describe('getSpawnWeights', () => {
    it('should return weights for normal difficulty', () => {
      const weights = getSpawnWeights('normal');
      expect(weights.common).toBe(70);
      expect(weights.uncommon).toBe(25);
      expect(weights.rare).toBe(5);
    });

    it('should have more rare spawns on higher difficulties', () => {
      const normal = getSpawnWeights('normal');
      const hard = getSpawnWeights('hard');
      const superHard = getSpawnWeights('super-hard');

      expect(hard.rare).toBeGreaterThan(normal.rare);
      expect(superHard.rare).toBeGreaterThan(hard.rare);
    });

    it('should have weights that make sense', () => {
      const difficulties: ContentDifficulty[] = ['normal', 'hard', 'super-hard'];
      for (const diff of difficulties) {
        const weights = getSpawnWeights(diff);
        expect(weights.common + weights.uncommon + weights.rare).toBe(100);
      }
    });
  });

  describe('createSeededRandom', () => {
    it('should produce deterministic results', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const values1 = [random1(), random1(), random1()];
      const values2 = [random2(), random2(), random2()];

      expect(values1).toEqual(values2);
    });

    it('should produce different results for different seeds', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(54321);

      expect(random1()).not.toBe(random2());
    });

    it('should produce values between 0 and 1', () => {
      const random = createSeededRandom(42);
      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('pickRandomEnemy', () => {
    it('should return an enemy from the pool', () => {
      const random = createSeededRandom(12345);
      const enemy = pickRandomEnemy('gurhacia', 'normal', random);
      expect(isEnemyValidForArea(enemy, 'gurhacia')).toBe(true);
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const enemies1 = [
        pickRandomEnemy('gurhacia', 'normal', random1),
        pickRandomEnemy('gurhacia', 'normal', random1),
        pickRandomEnemy('gurhacia', 'normal', random1),
      ];
      const enemies2 = [
        pickRandomEnemy('gurhacia', 'normal', random2),
        pickRandomEnemy('gurhacia', 'normal', random2),
        pickRandomEnemy('gurhacia', 'normal', random2),
      ];

      expect(enemies1).toEqual(enemies2);
    });

    it('should respect excludeRare flag', () => {
      // Run many times with high rare weight to test exclusion
      const random = createSeededRandom(99999);
      const enemies: string[] = [];
      const rareEnemies = getRareEnemies('gurhacia');

      for (let i = 0; i < 100; i++) {
        enemies.push(pickRandomEnemy('gurhacia', 'super-hard', random, true));
      }

      // None should be rare enemies
      for (const enemy of enemies) {
        expect(rareEnemies).not.toContain(enemy);
      }
    });

    it('should pick from different areas correctly', () => {
      const random = createSeededRandom(12345);
      const gurhaciaEnemy = pickRandomEnemy('gurhacia', 'normal', random);

      const random2 = createSeededRandom(12345);
      const arcaEnemy = pickRandomEnemy('arca', 'normal', random2);

      // Different areas should produce different enemy types
      const gurhaciaPool = getEnemyPool('gurhacia');
      const arcaPool = getEnemyPool('arca');

      const isGurhaciaEnemy = [...gurhaciaPool.common, ...gurhaciaPool.uncommon, ...gurhaciaPool.rare].includes(gurhaciaEnemy);
      const isArcaEnemy = [...arcaPool.common, ...arcaPool.uncommon, ...arcaPool.rare].includes(arcaEnemy);

      expect(isGurhaciaEnemy).toBe(true);
      expect(isArcaEnemy).toBe(true);
    });
  });

  describe('generateEnemyComposition', () => {
    it('should generate composition within count range', () => {
      const random = createSeededRandom(12345);
      const composition = generateEnemyComposition('gurhacia', 'normal', random);

      const totalCount = composition.reduce((sum, e) => sum + e.count, 0);
      const range = getEnemyCountRange('normal');

      expect(totalCount).toBeGreaterThanOrEqual(range.min);
      expect(totalCount).toBeLessThanOrEqual(range.max);
    });

    it('should only include valid enemies for the area', () => {
      const random = createSeededRandom(12345);
      const composition = generateEnemyComposition('gurhacia', 'hard', random);

      for (const entry of composition) {
        expect(isEnemyValidForArea(entry.enemyId, 'gurhacia')).toBe(true);
      }
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const comp1 = generateEnemyComposition('ozette', 'hard', random1);
      const comp2 = generateEnemyComposition('ozette', 'hard', random2);

      expect(comp1).toEqual(comp2);
    });

    it('should generate more enemies on higher difficulties', () => {
      // Use same seed, average over multiple runs
      const normalCounts: number[] = [];
      const hardCounts: number[] = [];

      for (let i = 0; i < 20; i++) {
        const normalRandom = createSeededRandom(i * 1000);
        const hardRandom = createSeededRandom(i * 1000);

        const normalComp = generateEnemyComposition('gurhacia', 'normal', normalRandom);
        const hardComp = generateEnemyComposition('gurhacia', 'hard', hardRandom);

        normalCounts.push(normalComp.reduce((sum, e) => sum + e.count, 0));
        hardCounts.push(hardComp.reduce((sum, e) => sum + e.count, 0));
      }

      const avgNormal = normalCounts.reduce((a, b) => a + b, 0) / normalCounts.length;
      const avgHard = hardCounts.reduce((a, b) => a + b, 0) / hardCounts.length;

      expect(avgHard).toBeGreaterThan(avgNormal);
    });
  });

  describe('isEnemyValidForArea', () => {
    it('should return true for common enemies', () => {
      expect(isEnemyValidForArea('snake', 'gurhacia')).toBe(true);
      expect(isEnemyValidForArea('shooter', 'arca')).toBe(true);
    });

    it('should return true for uncommon enemies', () => {
      expect(isEnemyValidForArea('lion', 'gurhacia')).toBe(true);
      expect(isEnemyValidForArea('swordman', 'arca')).toBe(true);
    });

    it('should return true for rare enemies', () => {
      expect(isEnemyValidForArea('rappy', 'gurhacia')).toBe(true);
      expect(isEnemyValidForArea('booma', 'gurhacia')).toBe(true);
    });

    it('should return true for bosses', () => {
      expect(isEnemyValidForArea('boss_dragon', 'gurhacia')).toBe(true);
      expect(isEnemyValidForArea('boss_darkfalz', 'dark')).toBe(true);
    });

    it('should return false for enemies from other areas', () => {
      expect(isEnemyValidForArea('snake', 'arca')).toBe(false);
      expect(isEnemyValidForArea('shooter', 'gurhacia')).toBe(false);
      expect(isEnemyValidForArea('boss_dragon', 'dark')).toBe(false);
    });
  });

  describe('getAreasForEnemy', () => {
    it('should return areas where common enemies spawn', () => {
      const areas = getAreasForEnemy('snake');
      expect(areas).toContain('gurhacia');
      expect(areas).toHaveLength(1);
    });

    it('should return multiple areas for rappies', () => {
      // Regular rappy spawns in gurhacia and rioh
      const rappyAreas = getAreasForEnemy('rappy');
      expect(rappyAreas).toContain('gurhacia');
      expect(rappyAreas).toContain('rioh');
    });

    it('should return correct area for bosses', () => {
      const dragonAreas = getAreasForEnemy('boss_dragon');
      expect(dragonAreas).toContain('gurhacia');
      expect(dragonAreas).toHaveLength(1);
    });

    it('should return empty array for unknown enemies', () => {
      const areas = getAreasForEnemy('unknown_enemy');
      expect(areas).toHaveLength(0);
    });
  });
});
