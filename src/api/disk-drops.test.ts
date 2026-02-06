/**
 * Technique Disk Drop System Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTechniqueDisk,
  generateRandomDisk,
  useDisk,
  getTechniqueLimit,
  getTechniqueLevels,
  setTechniqueLevel,
} from './skills';
import { initializeDatabase, resetDatabase } from '../db';
import { createCharacter } from './character';

describe('Technique Disk System', () => {
  beforeEach(async () => {
    await initializeDatabase();
    resetDatabase();
  });

  describe('createTechniqueDisk', () => {
    it('creates a disk with correct properties', () => {
      const disk = createTechniqueDisk('foie', 5);

      expect(disk.type).toBe('disk');
      expect(disk.name).toBe('Disk: Foie Lv.5');
      expect(disk.techniqueId).toBe('foie');
      expect(disk.level).toBe(5);
      expect(disk.stackable).toBe(false);
      expect(disk.id).toContain('disk_foie_5_');
    });

    it('creates unique IDs for each disk', () => {
      const disk1 = createTechniqueDisk('foie', 5);
      const disk2 = createTechniqueDisk('foie', 5);

      expect(disk1.id).not.toBe(disk2.id);
    });

    it('assigns higher rarity to advanced techniques', () => {
      const basicDisk = createTechniqueDisk('foie', 10);
      const advancedDisk = createTechniqueDisk('gifoie', 10);

      expect(advancedDisk.rarity).toBeGreaterThan(basicDisk.rarity);
    });

    it('assigns higher rarity to higher levels', () => {
      const lowLevel = createTechniqueDisk('foie', 5);
      const highLevel = createTechniqueDisk('foie', 25);

      expect(highLevel.rarity).toBeGreaterThan(lowLevel.rarity);
    });
  });

  describe('generateRandomDisk', () => {
    it('generates disks within level range for normal difficulty', () => {
      for (let i = 0; i < 20; i++) {
        const disk = generateRandomDisk('gurhacia', 'normal', false, false);
        expect(disk.level).toBeGreaterThanOrEqual(1);
        expect(disk.level).toBeLessThanOrEqual(10);
      }
    });

    it('generates higher level disks for hard difficulty', () => {
      for (let i = 0; i < 20; i++) {
        const disk = generateRandomDisk('gurhacia', 'hard', false, false);
        expect(disk.level).toBeGreaterThanOrEqual(8);
        expect(disk.level).toBeLessThanOrEqual(20);
      }
    });

    it('generates even higher level disks for super-hard', () => {
      for (let i = 0; i < 20; i++) {
        const disk = generateRandomDisk('gurhacia', 'super-hard', false, false);
        expect(disk.level).toBeGreaterThanOrEqual(15);
        expect(disk.level).toBeLessThanOrEqual(30);
      }
    });

    it('generates higher level disks for bosses', () => {
      const levels: number[] = [];
      for (let i = 0; i < 50; i++) {
        const disk = generateRandomDisk('gurhacia', 'normal', true, false);
        levels.push(disk.level);
      }
      const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
      // Boss bonus should push average above normal range
      expect(avgLevel).toBeGreaterThan(5);
    });
  });

  describe('getTechniqueLimit', () => {
    it('returns null for CAST classes', () => {
      expect(getTechniqueLimit('HUcast', 'foie')).toBeNull();
      expect(getTechniqueLimit('RAcast', 'resta')).toBeNull();
    });

    it('returns 10 for Hunter/Ranger basic techniques', () => {
      expect(getTechniqueLimit('HUmar', 'foie')).toBe(10);
      expect(getTechniqueLimit('RAmar', 'barta')).toBe(10);
      expect(getTechniqueLimit('HUmarl', 'zonde')).toBe(10);
    });

    it('returns 15 for Force techniques', () => {
      expect(getTechniqueLimit('FOmar', 'foie')).toBe(15);
      expect(getTechniqueLimit('FOmarl', 'grants')).toBe(15);
      expect(getTechniqueLimit('FOnewearl', 'megid')).toBe(15);
    });

    it('returns null for techniques class cannot learn', () => {
      expect(getTechniqueLimit('HUmar', 'grants')).toBeNull();
      expect(getTechniqueLimit('RAmar', 'megid')).toBeNull();
    });
  });

  describe('useDisk', () => {
    it('teaches a new technique to a Force', () => {
      const charResult = createCharacter(1, 'FOmar', 'TestMage');
      expect(charResult.success).toBe(true);
      const charId = charResult.data!.id;

      const disk = createTechniqueDisk('foie', 5);
      const result = useDisk(charId, disk);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Learned');
      expect(result.data?.newLevel).toBe(5);

      const levels = getTechniqueLevels(charId);
      expect(levels['foie']).toBe(5);
    });

    it('upgrades an existing technique', () => {
      const charResult = createCharacter(1, 'FOmar', 'TestMage');
      const charId = charResult.data!.id;

      // Learn at level 3
      setTechniqueLevel(charId, 'foie', 3);

      // Use level 7 disk
      const disk = createTechniqueDisk('foie', 7);
      const result = useDisk(charId, disk);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Upgraded');
      expect(result.data?.newLevel).toBe(7);
    });

    it('fails if disk level is lower than current', () => {
      const charResult = createCharacter(1, 'FOmar', 'TestMage');
      const charId = charResult.data!.id;

      setTechniqueLevel(charId, 'foie', 10);

      const disk = createTechniqueDisk('foie', 5);
      const result = useDisk(charId, disk);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Already know');
    });

    it('fails if disk level exceeds class limit', () => {
      const charResult = createCharacter(1, 'HUmar', 'TestHunter');
      const charId = charResult.data!.id;

      // HUmar can only learn foie up to level 10
      const disk = createTechniqueDisk('foie', 15);
      const result = useDisk(charId, disk);

      expect(result.success).toBe(false);
      expect(result.message).toContain('level 10');
    });

    it('fails for CAST classes', () => {
      const charResult = createCharacter(1, 'HUcast', 'TestCast');
      const charId = charResult.data!.id;

      const disk = createTechniqueDisk('foie', 5);
      const result = useDisk(charId, disk);

      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot use techniques');
    });
  });

  describe('Drop Rate Simulation', () => {
    it('simulates expected drop rates', () => {
      // Simulate the drop rate logic directly
      const iterations = 10000;
      let normalDrops = 0;
      let hardDrops = 0;
      let bossDrops = 0;

      for (let i = 0; i < iterations; i++) {
        // Normal enemy, hard difficulty
        const normalChance = 0.03 + 0.02; // 5%
        if (Math.random() < normalChance) normalDrops++;

        // Rare enemy, hard difficulty
        const rareChance = 0.10 + 0.02; // 12%
        if (Math.random() < rareChance) hardDrops++;

        // Boss, super-hard difficulty
        const bossChance = 0.25 + 0.05; // 30%
        if (Math.random() < bossChance) bossDrops++;
      }

      // Check rates are within expected range (with some variance tolerance)
      const normalRate = normalDrops / iterations;
      const hardRate = hardDrops / iterations;
      const bossRate = bossDrops / iterations;

      expect(normalRate).toBeGreaterThan(0.04);
      expect(normalRate).toBeLessThan(0.06);

      expect(hardRate).toBeGreaterThan(0.10);
      expect(hardRate).toBeLessThan(0.14);

      expect(bossRate).toBeGreaterThan(0.27);
      expect(bossRate).toBeLessThan(0.33);
    });
  });
});
