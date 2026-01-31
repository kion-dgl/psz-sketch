/**
 * Character System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacter,
  createAndSaveCharacter,
  validateCharacterName,
  validateClassId,
  validateSlot,
  validateCharacterCreation,
  selectCharacter,
  selectCharacterBySlot,
  deleteCharacter,
  getCharacterSlots,
  getSelectedCharacter,
  isNameTaken,
  addMeseta,
  removeMeseta,
  getCharacterDisplayInfo,
  calculateTextureId,
  generateCharacterId,
} from './character';
import {
  getCharacterFromSlot,
  saveCharacterToSlot,
  isSlotAvailable,
  getCharacterCount,
  findEmptySlot,
} from './storage';
import { MAX_SLOTS, MAX_NAME_LENGTH, VALID_CLASS_IDS } from './types';
import { createInventory, addItem, getInventory, clearInventory } from '../inventory/inventory';
import type { ConsumableItem } from '../inventory/types';

describe('Character System - Name Validation', () => {
  it('validates valid names', () => {
    expect(validateCharacterName('Hero').valid).toBe(true);
    expect(validateCharacterName('Test Character').valid).toBe(true);
    expect(validateCharacterName("Player's Name").valid).toBe(true);
    expect(validateCharacterName('Name-123').valid).toBe(true);
  });

  it('rejects empty names', () => {
    const result = validateCharacterName('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Character name is required');
  });

  it('rejects whitespace-only names', () => {
    const result = validateCharacterName('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Character name is required');
  });

  it('rejects names that are too long', () => {
    const longName = 'A'.repeat(MAX_NAME_LENGTH + 1);
    const result = validateCharacterName(longName);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('characters or less');
  });

  it('accepts names at max length', () => {
    const maxName = 'A'.repeat(MAX_NAME_LENGTH);
    const result = validateCharacterName(maxName);
    expect(result.valid).toBe(true);
  });

  it('rejects names with invalid characters', () => {
    const result = validateCharacterName('Hero@123');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('invalid characters');
  });
});

describe('Character System - Class Validation', () => {
  it('validates all valid class IDs', () => {
    for (const classId of VALID_CLASS_IDS) {
      expect(validateClassId(classId).valid).toBe(true);
    }
  });

  it('rejects empty class ID', () => {
    const result = validateClassId('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Class is required');
  });

  it('rejects invalid class IDs', () => {
    const result = validateClassId('InvalidClass');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid class');
  });
});

describe('Character System - Slot Validation', () => {
  it('validates valid slots', () => {
    for (let i = 0; i < MAX_SLOTS; i++) {
      expect(validateSlot(i).valid).toBe(true);
    }
  });

  it('rejects negative slots', () => {
    const result = validateSlot(-1);
    expect(result.valid).toBe(false);
  });

  it('rejects slots >= MAX_SLOTS', () => {
    const result = validateSlot(MAX_SLOTS);
    expect(result.valid).toBe(false);
  });

  it('rejects non-number slots', () => {
    const result = validateSlot(NaN);
    expect(result.valid).toBe(false);
  });
});

describe('Character System - Character Creation', () => {
  it('creates a character with valid params', () => {
    const character = createCharacter({
      name: 'TestHero',
      classId: 'HUmar',
      slot: 0,
    });

    expect(character.character_name).toBe('TestHero');
    expect(character.class_id).toBe('HUmar');
    expect(character.slot).toBe(0);
    expect(character.level).toBe(1);
    expect(character.experience).toBe(0);
    expect(character.character_id).toMatch(/^char_/);
    expect(character.created_at).toBeDefined();
  });

  it('creates a character with customization options', () => {
    const character = createCharacter({
      name: 'CustomHero',
      classId: 'FOmarl',
      slot: 1,
      variationIndex: 2,
      bodyColorIndex: 3,
      hairColorIndex: 1,
      skinToneIndex: 2,
    });

    expect(character.variation_index).toBe(2);
    // texture_id = (hairColorIndex * 3 + skinToneIndex)_bodyColorIndex = (1*3+2)_3 = 5_3
    expect(character.texture_id).toBe('5_3');
  });

  it('throws error for invalid name', () => {
    expect(() => createCharacter({
      name: '',
      classId: 'HUmar',
      slot: 0,
    })).toThrow();
  });

  it('throws error for invalid class', () => {
    expect(() => createCharacter({
      name: 'Hero',
      classId: 'InvalidClass',
      slot: 0,
    })).toThrow();
  });

  it('throws error for invalid slot', () => {
    expect(() => createCharacter({
      name: 'Hero',
      classId: 'HUmar',
      slot: -1,
    })).toThrow();
  });

  it('trims whitespace from name', () => {
    const character = createCharacter({
      name: '  SpacedName  ',
      classId: 'HUmar',
      slot: 0,
    });
    expect(character.character_name).toBe('SpacedName');
  });
});

describe('Character System - Storage Integration', () => {
  it('creates and saves character to storage', () => {
    const character = createAndSaveCharacter({
      name: 'SavedHero',
      classId: 'RAmar',
      slot: 0,
    });

    const retrieved = getCharacterFromSlot(0);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.character_name).toBe('SavedHero');
    expect(retrieved?.character_id).toBe(character.character_id);
  });

  it('throws error when saving to occupied slot', () => {
    createAndSaveCharacter({
      name: 'FirstHero',
      classId: 'HUmar',
      slot: 0,
    });

    expect(() => createAndSaveCharacter({
      name: 'SecondHero',
      classId: 'HUmar',
      slot: 0,
    })).toThrow('Slot is already occupied');
  });

  it('selects character by ID', () => {
    const character = createAndSaveCharacter({
      name: 'SelectableHero',
      classId: 'HUmar',
      slot: 0,
    });

    const selected = selectCharacter(character.character_id);
    expect(selected).not.toBeNull();
    expect(selected?.character_name).toBe('SelectableHero');

    const currentSelected = getSelectedCharacter();
    expect(currentSelected?.character_id).toBe(character.character_id);
  });

  it('selects character by slot', () => {
    createAndSaveCharacter({
      name: 'SlotHero',
      classId: 'HUmar',
      slot: 1,
    });

    const selected = selectCharacterBySlot(1);
    expect(selected).not.toBeNull();
    expect(selected?.character_name).toBe('SlotHero');
  });

  it('returns null for invalid character ID', () => {
    const selected = selectCharacter('nonexistent_id');
    expect(selected).toBeNull();
  });

  it('returns null for empty slot', () => {
    const selected = selectCharacterBySlot(3);
    expect(selected).toBeNull();
  });

  it('deletes character from slot', () => {
    createAndSaveCharacter({
      name: 'ToDelete',
      classId: 'HUmar',
      slot: 0,
    });

    expect(getCharacterFromSlot(0)).not.toBeNull();

    deleteCharacter(0);

    expect(getCharacterFromSlot(0)).toBeNull();
  });

  it('throws error when deleting from invalid slot', () => {
    expect(() => deleteCharacter(-1)).toThrow();
    expect(() => deleteCharacter(MAX_SLOTS)).toThrow();
  });

  it('clears character inventory when deleted', () => {
    // Create a character
    const character = createAndSaveCharacter({
      name: 'ToDeleteWithInv',
      classId: 'HUmar',
      slot: 0,
    });

    // Add items to their inventory
    const testItem: ConsumableItem = {
      id: 'monomate',
      name: 'Monomate',
      description: 'Restores HP',
      type: 'consumable',
      effect: 'heal',
      effectValue: 100,
      rarity: 1,
      sellPrice: 25,
      stackable: true,
      maxStack: 10,
    };

    const inventory = createInventory(character.character_id);
    addItem(inventory, testItem, 5);

    // Verify inventory has items
    let retrievedInventory = getInventory(character.character_id);
    expect(retrievedInventory.items).toHaveLength(1);

    // Delete the character
    deleteCharacter(0);

    // Verify inventory is cleared
    retrievedInventory = getInventory(character.character_id);
    expect(retrievedInventory.items).toHaveLength(0);
  });

  it('returns all character slots', () => {
    createAndSaveCharacter({ name: 'Hero1', classId: 'HUmar', slot: 0 });
    createAndSaveCharacter({ name: 'Hero2', classId: 'RAmar', slot: 2 });

    const slots = getCharacterSlots();
    expect(slots.length).toBe(MAX_SLOTS);
    expect(slots[0]?.character_name).toBe('Hero1');
    expect(slots[1]).toBeNull();
    expect(slots[2]?.character_name).toBe('Hero2');
    expect(slots[3]).toBeNull();
  });

  it('checks slot availability', () => {
    expect(isSlotAvailable(0)).toBe(true);

    createAndSaveCharacter({ name: 'Hero', classId: 'HUmar', slot: 0 });

    expect(isSlotAvailable(0)).toBe(false);
    expect(isSlotAvailable(1)).toBe(true);
  });

  it('finds empty slot', () => {
    expect(findEmptySlot()).toBe(0);

    createAndSaveCharacter({ name: 'Hero1', classId: 'HUmar', slot: 0 });
    expect(findEmptySlot()).toBe(1);

    createAndSaveCharacter({ name: 'Hero2', classId: 'HUmar', slot: 1 });
    expect(findEmptySlot()).toBe(2);
  });

  it('counts characters', () => {
    expect(getCharacterCount()).toBe(0);

    createAndSaveCharacter({ name: 'Hero1', classId: 'HUmar', slot: 0 });
    expect(getCharacterCount()).toBe(1);

    createAndSaveCharacter({ name: 'Hero2', classId: 'HUmar', slot: 2 });
    expect(getCharacterCount()).toBe(2);
  });
});

describe('Character System - Name Uniqueness', () => {
  it('detects taken names', () => {
    createAndSaveCharacter({ name: 'UniqueHero', classId: 'HUmar', slot: 0 });

    expect(isNameTaken('UniqueHero')).toBe(true);
    expect(isNameTaken('uniquehero')).toBe(true); // case insensitive
    expect(isNameTaken('OtherHero')).toBe(false);
  });

  it('excludes specified slot when checking name', () => {
    createAndSaveCharacter({ name: 'MyHero', classId: 'HUmar', slot: 0 });

    expect(isNameTaken('MyHero', 0)).toBe(false); // exclude own slot
    expect(isNameTaken('MyHero', 1)).toBe(true);
  });
});

describe('Character System - Meseta Management', () => {
  it('starts with 500 meseta', () => {
    const character = createAndSaveCharacter({
      name: 'StarterHero',
      classId: 'HUmar',
      slot: 0,
    });

    expect(character.meseta).toBe(500);
  });

  it('adds meseta to character', () => {
    const character = createAndSaveCharacter({
      name: 'RichHero',
      classId: 'HUmar',
      slot: 0,
    });

    // Character starts with 500 meseta
    const updated = addMeseta(character.character_id, 1000);
    expect(updated.meseta).toBe(1500); // 500 + 1000

    const stored = getCharacterFromSlot(0);
    expect(stored?.meseta).toBe(1500);
  });

  it('removes meseta from character', () => {
    const character = createAndSaveCharacter({
      name: 'SpendingHero',
      classId: 'HUmar',
      slot: 0,
    });

    // Character starts with 500 meseta
    const updated = removeMeseta(character.character_id, 300);

    expect(updated.meseta).toBe(200); // 500 - 300
  });

  it('throws error when removing more meseta than available', () => {
    const character = createAndSaveCharacter({
      name: 'PoorHero',
      classId: 'HUmar',
      slot: 0,
    });

    // Character starts with 500 meseta
    expect(() => removeMeseta(character.character_id, 600)).toThrow('Not enough meseta');
  });

  it('throws error for nonexistent character', () => {
    expect(() => addMeseta('fake_id', 100)).toThrow('Character not found');
    expect(() => removeMeseta('fake_id', 100)).toThrow('Character not found');
  });
});

describe('Character System - Display Info', () => {
  it('returns correct display info for Hunter Human', () => {
    const character = createCharacter({
      name: 'HunterHuman',
      classId: 'HUmar',
      slot: 0,
    });

    const info = getCharacterDisplayInfo(character);
    expect(info.name).toBe('HunterHuman');
    expect(info.race).toBe('Human');
    expect(info.type).toBe('Hunter');
  });

  it('returns correct display info for Ranger Cast', () => {
    const character = createCharacter({
      name: 'RangerCast',
      classId: 'RAcast',
      slot: 0,
    });

    const info = getCharacterDisplayInfo(character);
    expect(info.race).toBe('Cast');
    expect(info.type).toBe('Ranger');
  });

  it('returns correct display info for Force Newman', () => {
    const character = createCharacter({
      name: 'ForceNewman',
      classId: 'FOnewearl',
      slot: 0,
    });

    const info = getCharacterDisplayInfo(character);
    expect(info.race).toBe('Newman');
    expect(info.type).toBe('Force');
  });
});

describe('Character System - Utilities', () => {
  it('generates unique character IDs', () => {
    const id1 = generateCharacterId();
    const id2 = generateCharacterId();

    expect(id1).toMatch(/^char_/);
    expect(id2).toMatch(/^char_/);
    expect(id1).not.toBe(id2);
  });

  it('calculates texture ID correctly', () => {
    // Default values
    expect(calculateTextureId()).toBe('0_0');

    // Hair color affects skin tone range
    expect(calculateTextureId(0, 0, 0)).toBe('0_0');
    expect(calculateTextureId(0, 1, 0)).toBe('1_0');
    expect(calculateTextureId(0, 2, 0)).toBe('2_0');
    expect(calculateTextureId(1, 0, 0)).toBe('3_0');
    expect(calculateTextureId(1, 1, 0)).toBe('4_0');
    expect(calculateTextureId(2, 2, 0)).toBe('8_0');

    // Body color is separate
    expect(calculateTextureId(0, 0, 3)).toBe('0_3');
    expect(calculateTextureId(1, 2, 4)).toBe('5_4');
  });
});

describe('Character System - Full Creation Validation', () => {
  it('validates all params together', () => {
    const result = validateCharacterCreation({
      name: 'ValidHero',
      classId: 'HUmar',
      slot: 0,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('collects all validation errors', () => {
    const result = validateCharacterCreation({
      name: '',
      classId: 'InvalidClass',
      slot: -1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates slot availability', () => {
    createAndSaveCharacter({ name: 'Existing', classId: 'HUmar', slot: 0 });

    const result = validateCharacterCreation({
      name: 'New',
      classId: 'HUmar',
      slot: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slot is already occupied');
  });
});

describe('Character System - Starting Equipment', () => {
  it('initializes inventory with starter weapon for Hunter', () => {
    const character = createAndSaveCharacter({
      name: 'HunterStart',
      classId: 'HUmar',
      slot: 0,
    });

    const inventory = getInventory(character.character_id);
    expect(inventory.equipment.weapon?.item.name).toBe('Saber');
  });

  it('initializes inventory with starter weapon for Ranger', () => {
    const character = createAndSaveCharacter({
      name: 'RangerStart',
      classId: 'RAmar',
      slot: 0,
    });

    const inventory = getInventory(character.character_id);
    expect(inventory.equipment.weapon?.item.name).toBe('Handgun');
  });

  it('initializes inventory with starter weapon for Force', () => {
    const character = createAndSaveCharacter({
      name: 'ForceStart',
      classId: 'FOmarl',
      slot: 0,
    });

    const inventory = getInventory(character.character_id);
    expect(inventory.equipment.weapon?.item.name).toBe('Cane');
  });

  it('initializes inventory with starter frame', () => {
    const character = createAndSaveCharacter({
      name: 'ArmorStart',
      classId: 'HUmar',
      slot: 0,
    });

    const inventory = getInventory(character.character_id);
    expect(inventory.equipment.frame?.item.name).toBe('Frame');
  });

  it('initializes inventory with consumables', () => {
    const character = createAndSaveCharacter({
      name: 'ConsumablesStart',
      classId: 'HUmar',
      slot: 0,
    });

    const inventory = getInventory(character.character_id);
    const monomate = inventory.items.find(s => s.item.id === 'monomate');
    const monofluid = inventory.items.find(s => s.item.id === 'monofluid');

    expect(monomate).toBeDefined();
    expect(monomate?.quantity).toBe(5);
    expect(monofluid).toBeDefined();
    expect(monofluid?.quantity).toBe(5);
  });
});
