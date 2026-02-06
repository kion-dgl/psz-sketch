/**
 * Tekker Shop Tests
 * Grinding and weapon identification
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyGrinder,
  identifyWeapon,
  getGrindInfo,
  getIdentifyCostInfo,
  createUnidentifiedWeapon,
  MONOGRINDER,
  DIGRINDER,
  TRIGRINDER,
} from './tekker';
import { initializeDatabase, resetDatabase } from '../db';
import { createCharacter } from './character';
import { addItem } from './inventory';
import { goto } from './location';
import type { WeaponItem } from '../systems/inventory/types';

describe('Tekker Shop', () => {
  beforeEach(async () => {
    await initializeDatabase();
    resetDatabase();
  });

  describe('Grinder Items', () => {
    it('has correct grind bonuses', () => {
      expect(MONOGRINDER.grindBonus).toBe(1);
      expect(DIGRINDER.grindBonus).toBe(2);
      expect(TRIGRINDER.grindBonus).toBe(3);
    });

    it('grinders are stackable', () => {
      expect(MONOGRINDER.stackable).toBe(true);
      expect(MONOGRINDER.maxStack).toBe(99);
    });
  });

  describe('createUnidentifiedWeapon', () => {
    it('does not modify low rarity weapons', () => {
      const weapon: WeaponItem = {
        id: 'saber_123',
        name: 'Saber',
        description: 'A basic sword',
        type: 'weapon',
        weaponType: 'Saber',
        attack: 50,
        accuracy: 100,
        grindLevel: 0,
        maxGrind: 10,
        rarity: 3,
        sellPrice: 100,
        requiredLevel: 1,
        stackable: false,
        maxStack: 1,
      };

      const result = createUnidentifiedWeapon(weapon);
      expect(result.identified).toBe(true);
      expect(result.name).toBe('Saber');
    });

    it('hides 5+ star weapons as SPECIAL WEAPON', () => {
      const weapon: WeaponItem = {
        id: 'lavis_123',
        name: 'Lavis Kanon',
        description: 'A legendary sword',
        type: 'weapon',
        weaponType: 'Saber',
        attack: 283,
        accuracy: 245,
        element: 'soul',
        elementPercent: 30,
        grindLevel: 0,
        maxGrind: 40,
        rarity: 7,
        sellPrice: 10000,
        requiredLevel: 90,
        stackable: false,
        maxStack: 1,
      };

      const result = createUnidentifiedWeapon(weapon);
      expect(result.identified).toBe(false);
      expect(result.name).toBe('SPECIAL WEAPON');
      expect(result.attack).toBe(0);
      expect(result.accuracy).toBe(0);
      expect(result.element).toBeUndefined();
      expect(result.hiddenName).toBe('Lavis Kanon');
      expect(result.hiddenAttack).toBe(283);
    });
  });

  describe('applyGrinder', () => {
    it('requires being at tekker location', () => {
      const charResult = createCharacter(1, 'HUmar', 'TestHunter');
      const charId = charResult.data!.id;

      goto(charId, 'city'); // Not at tekker

      const result = applyGrinder(charId, 'weapon_123', 'monogrinder');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Tekker');
    });
  });

  describe('identifyWeapon', () => {
    it('requires being at tekker location', () => {
      const charResult = createCharacter(1, 'HUmar', 'TestHunter');
      const charId = charResult.data!.id;

      goto(charId, 'city'); // Not at tekker

      const result = identifyWeapon(charId, 'weapon_123');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Tekker');
    });
  });

  describe('getIdentifyCostInfo', () => {
    it('returns different costs based on rarity', () => {
      const charResult = createCharacter(1, 'HUmar', 'TestHunter');
      const charId = charResult.data!.id;

      // Create unidentified weapons of different rarities
      const weapon5: WeaponItem = createUnidentifiedWeapon({
        id: 'weapon5_123',
        name: 'Rare Weapon',
        description: 'test',
        type: 'weapon',
        weaponType: 'Saber',
        attack: 100,
        accuracy: 100,
        grindLevel: 0,
        maxGrind: 10,
        rarity: 5,
        sellPrice: 500,
        requiredLevel: 50,
        stackable: false,
        maxStack: 1,
      });

      const weapon7: WeaponItem = createUnidentifiedWeapon({
        id: 'weapon7_123',
        name: 'Super Rare Weapon',
        description: 'test',
        type: 'weapon',
        weaponType: 'Saber',
        attack: 200,
        accuracy: 200,
        grindLevel: 0,
        maxGrind: 10,
        rarity: 7,
        sellPrice: 5000,
        requiredLevel: 90,
        stackable: false,
        maxStack: 1,
      });

      addItem(charId, weapon5 as any, 1);
      addItem(charId, weapon7 as any, 1);

      const cost5 = getIdentifyCostInfo(charId, weapon5.id);
      const cost7 = getIdentifyCostInfo(charId, weapon7.id);

      expect(cost5.success).toBe(true);
      expect(cost7.success).toBe(true);
      expect(cost7.data!.cost).toBeGreaterThan(cost5.data!.cost);
    });
  });
});
