/**
 * Inventory System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInventory,
  getInventory,
  saveInventory,
  getUsedSlots,
  hasSpace,
  findItem,
  addItem,
  removeItem,
  equipItem,
  unequipItem,
  getEquippedItems,
  getEquipmentStats,
  sortInventory,
  clearInventory,
  canEquip,
  findAvailableUnitSlot,
  getSharedStorage,
  addToSharedStorage,
  removeFromSharedStorage,
  depositToStorage,
  withdrawFromStorage,
  getSharedStorageCount,
  clearSharedStorage,
  getSharedStorageMeseta,
  depositMesetaToStorage,
  withdrawMesetaFromStorage,
} from './inventory';
import type {
  GameItem,
  WeaponItem,
  ArmorItem,
  ConsumableItem,
  InventoryState,
} from './types';
import { DEFAULT_MAX_SLOTS, SHARED_STORAGE_SLOTS } from './types';
import { createAndSaveCharacter } from '../character/character';
import { getCharacterFromSlot, clearCharacterSlots } from '../character/storage';

// Test items
const testSword: WeaponItem = {
  id: 'sword_01',
  name: 'Chrome Sword',
  description: 'A basic sword',
  type: 'weapon',
  weaponType: 'sword',
  attack: 50,
  accuracy: 30,
  grindLevel: 0,
  maxGrind: 10,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 100,
  stackable: false,
  maxStack: 1,
};

const testHighLevelSword: WeaponItem = {
  ...testSword,
  id: 'sword_02',
  name: 'Elite Sword',
  requiredLevel: 50,
  rarity: 5,
};

const testHunterOnlySword: WeaponItem = {
  ...testSword,
  id: 'sword_03',
  name: 'Hunter Blade',
  classRestrictions: ['HUmar', 'HUmarl', 'HUcast', 'HUcaseal', 'HUnewm', 'HUnewearl'],
};

const testFrame: ArmorItem = {
  id: 'frame_01',
  name: 'Chrome Frame',
  description: 'Basic frame armor',
  type: 'armor',
  armorSlot: 'frame',
  defense: 20,
  evasion: 5,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 80,
  stackable: false,
  maxStack: 1,
  unitSlots: 2, // Can hold 2 units
};

const testBarrier: ArmorItem = {
  id: 'barrier_01',
  name: 'Chrome Barrier',
  description: 'Basic barrier',
  type: 'armor',
  armorSlot: 'barrier',
  defense: 15,
  evasion: 10,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 60,
  stackable: false,
  maxStack: 1,
};

const testUnit: ArmorItem = {
  id: 'unit_01',
  name: 'HP Unit',
  description: 'Increases HP',
  type: 'armor',
  armorSlot: 'unit',
  defense: 5,
  evasion: 0,
  requiredLevel: 1,
  rarity: 2,
  sellPrice: 200,
  stackable: false,
  maxStack: 1,
};

const testMonomate: ConsumableItem = {
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

describe('Inventory System - Creation', () => {
  it('creates empty inventory with default max slots', () => {
    const inventory = createInventory('char_1');
    expect(inventory.characterId).toBe('char_1');
    expect(inventory.items).toHaveLength(0);
    expect(inventory.maxSlots).toBe(DEFAULT_MAX_SLOTS);
    expect(inventory.equipment.weapon).toBeNull();
  });

  it('creates inventory with custom max slots up to maximum', () => {
    const inventory = createInventory('char_1', 30);
    expect(inventory.maxSlots).toBe(30);
  });

  it('caps max slots at maximum (40)', () => {
    const inventory = createInventory('char_1', 100);
    expect(inventory.maxSlots).toBe(40); // MAX_INVENTORY_SLOTS is 40
  });
});

describe('Inventory System - Storage', () => {
  beforeEach(() => {
    clearInventory('char_test');
  });

  it('saves and retrieves inventory', () => {
    const inventory = createInventory('char_test');
    addItem(inventory, testSword);

    const retrieved = getInventory('char_test');
    expect(retrieved.items).toHaveLength(1);
    expect(retrieved.items[0].item.name).toBe('Chrome Sword');
  });

  it('returns empty inventory for new character', () => {
    const inventory = getInventory('new_char');
    expect(inventory.items).toHaveLength(0);
  });
});

describe('Inventory System - Space Management', () => {
  it('counts used slots correctly', () => {
    const inventory = createInventory('char_1');
    expect(getUsedSlots(inventory)).toBe(0);

    addItem(inventory, testSword);
    const updated = getInventory('char_1');
    expect(getUsedSlots(updated)).toBe(1);
  });

  it('checks space availability', () => {
    const inventory = createInventory('char_1', 2);
    expect(hasSpace(inventory)).toBe(true);
    expect(hasSpace(inventory, 2)).toBe(true);
    expect(hasSpace(inventory, 3)).toBe(false);
  });
});

describe('Inventory System - Adding Items', () => {
  let inventory: InventoryState;

  beforeEach(() => {
    clearInventory('char_test');
    inventory = createInventory('char_test');
  });

  it('adds non-stackable item', () => {
    const result = addItem(inventory, testSword);
    expect(result.success).toBe(true);
    expect(result.inventory?.items).toHaveLength(1);
  });

  it('adds stackable item', () => {
    const result = addItem(inventory, testMonomate, 5);
    expect(result.success).toBe(true);
    expect(result.inventory?.items[0].quantity).toBe(5);
  });

  it('stacks with existing stackable item', () => {
    addItem(inventory, testMonomate, 3);
    const updated = getInventory('char_test');
    const result = addItem(updated, testMonomate, 4);

    expect(result.success).toBe(true);
    expect(result.inventory?.items).toHaveLength(1);
    expect(result.inventory?.items[0].quantity).toBe(7);
  });

  it('prevents exceeding max stack', () => {
    addItem(inventory, testMonomate, 8);
    const updated = getInventory('char_test');
    const result = addItem(updated, testMonomate, 5);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot stack');
  });

  it('prevents adding when inventory is full', () => {
    const smallInventory = createInventory('char_small', 1);
    addItem(smallInventory, testSword);
    const updated = getInventory('char_small');
    const result = addItem(updated, testFrame);

    expect(result.success).toBe(false);
    expect(result.message).toContain('full');
  });

  it('rejects zero or negative quantity', () => {
    const result = addItem(inventory, testMonomate, 0);
    expect(result.success).toBe(false);
  });
});

describe('Inventory System - Removing Items', () => {
  let inventory: InventoryState;

  beforeEach(() => {
    clearInventory('char_test');
    inventory = createInventory('char_test');
    addItem(inventory, testMonomate, 5);
    inventory = getInventory('char_test');
  });

  it('removes partial stack', () => {
    const result = removeItem(inventory, 'monomate', 2);
    expect(result.success).toBe(true);
    expect(result.inventory?.items[0].quantity).toBe(3);
  });

  it('removes entire stack', () => {
    const result = removeItem(inventory, 'monomate', 5);
    expect(result.success).toBe(true);
    expect(result.inventory?.items).toHaveLength(0);
  });

  it('fails when removing more than available', () => {
    const result = removeItem(inventory, 'monomate', 10);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough');
  });

  it('fails for non-existent item', () => {
    const result = removeItem(inventory, 'nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });
});

describe('Inventory System - Finding Items', () => {
  beforeEach(() => {
    clearInventory('char_test');
    const inventory = createInventory('char_test');
    addItem(inventory, testSword);
    addItem(getInventory('char_test'), testMonomate, 3);
  });

  it('finds existing item', () => {
    const inventory = getInventory('char_test');
    const found = findItem(inventory, 'sword_01');
    expect(found).not.toBeNull();
    expect(found?.item.name).toBe('Chrome Sword');
  });

  it('returns null for non-existent item', () => {
    const inventory = getInventory('char_test');
    const found = findItem(inventory, 'nonexistent');
    expect(found).toBeNull();
  });
});

describe('Inventory System - Equipping Items', () => {
  let inventory: InventoryState;

  beforeEach(() => {
    clearInventory('char_test');
    inventory = createInventory('char_test');
    addItem(inventory, testSword);
    addItem(getInventory('char_test'), testFrame);
    addItem(getInventory('char_test'), testBarrier);
    inventory = getInventory('char_test');
  });

  it('equips weapon', () => {
    const result = equipItem(inventory, 'sword_01', 1, 'HUmar');
    expect(result.success).toBe(true);

    const updated = getInventory('char_test');
    expect(updated.equipment.weapon?.item.name).toBe('Chrome Sword');
    expect(updated.items).toHaveLength(2); // Removed from inventory
  });

  it('equips frame armor', () => {
    const result = equipItem(inventory, 'frame_01', 1, 'HUmar');
    expect(result.success).toBe(true);

    const updated = getInventory('char_test');
    expect(updated.equipment.frame?.item.name).toBe('Chrome Frame');
  });

  it('equips barrier', () => {
    const result = equipItem(inventory, 'barrier_01', 1, 'HUmar');
    expect(result.success).toBe(true);

    const updated = getInventory('char_test');
    expect(updated.equipment.barrier?.item.name).toBe('Chrome Barrier');
  });

  it('replaces equipped item', () => {
    equipItem(inventory, 'sword_01', 1, 'HUmar');
    let updated = getInventory('char_test');

    const newSword: WeaponItem = { ...testSword, id: 'sword_new', name: 'New Sword' };
    addItem(updated, newSword);
    updated = getInventory('char_test');

    const result = equipItem(updated, 'sword_new', 1, 'HUmar');
    expect(result.success).toBe(true);
    expect(result.previousItem?.item.name).toBe('Chrome Sword');

    updated = getInventory('char_test');
    expect(updated.equipment.weapon?.item.name).toBe('New Sword');
    // Old sword should be back in inventory
    expect(findItem(updated, 'sword_01')).not.toBeNull();
  });

  it('fails when level requirement not met', () => {
    addItem(inventory, testHighLevelSword);
    const updated = getInventory('char_test');

    const result = equipItem(updated, 'sword_02', 10, 'HUmar');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Requires level');
  });

  it('fails when class restriction not met', () => {
    addItem(inventory, testHunterOnlySword);
    const updated = getInventory('char_test');

    const result = equipItem(updated, 'sword_03', 50, 'RAmar');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot be equipped');
  });

  it('fails for non-existent item', () => {
    const result = equipItem(inventory, 'nonexistent', 1, 'HUmar');
    expect(result.success).toBe(false);
  });

  it('fails for non-equippable item', () => {
    addItem(inventory, testMonomate);
    const updated = getInventory('char_test');

    const result = equipItem(updated, 'monomate', 1, 'HUmar');
    expect(result.success).toBe(false);
    expect(result.message).toContain('cannot be equipped');
  });
});

describe('Inventory System - Unit Slots', () => {
  let inventory: InventoryState;

  beforeEach(() => {
    clearInventory('char_test');
    inventory = createInventory('char_test');
  });

  it('finds available unit slot', () => {
    expect(findAvailableUnitSlot(inventory.equipment)).toBe('unit1');

    // Manually fill slots for testing
    inventory.equipment.unit1 = { item: testUnit, quantity: 1 };
    expect(findAvailableUnitSlot(inventory.equipment)).toBe('unit2');

    inventory.equipment.unit2 = { item: testUnit, quantity: 1 };
    inventory.equipment.unit3 = { item: testUnit, quantity: 1 };
    inventory.equipment.unit4 = { item: testUnit, quantity: 1 };
    expect(findAvailableUnitSlot(inventory.equipment)).toBeNull();
  });

  it('equips unit to first available slot', () => {
    // First equip a frame with unit slots
    addItem(inventory, testFrame);
    let updated = getInventory('char_test');
    equipItem(updated, 'frame_01', 1, 'HUmar');

    // Then add and equip a unit
    updated = getInventory('char_test');
    addItem(updated, testUnit);
    updated = getInventory('char_test');

    const result = equipItem(updated, 'unit_01', 1, 'HUmar');
    expect(result.success).toBe(true);

    const final = getInventory('char_test');
    expect(final.equipment.unit1?.item.name).toBe('HP Unit');
  });

  it('fails to equip unit without frame', () => {
    addItem(inventory, testUnit);
    const updated = getInventory('char_test');

    const result = equipItem(updated, 'unit_01', 1, 'HUmar');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Must equip a frame');
  });

  it('fails to equip unit when frame has no slots', () => {
    // Equip a frame with 0 unit slots
    const noSlotFrame: ArmorItem = { ...testFrame, id: 'frame_no_slots', unitSlots: 0 };
    addItem(inventory, noSlotFrame);
    let updated = getInventory('char_test');
    equipItem(updated, 'frame_no_slots', 1, 'HUmar');

    // Try to equip unit
    updated = getInventory('char_test');
    addItem(updated, testUnit);
    updated = getInventory('char_test');

    const result = equipItem(updated, 'unit_01', 1, 'HUmar');
    expect(result.success).toBe(false);
    expect(result.message).toContain('0 unit slot');
  });

  it('fails to equip unit when frame slots are full', () => {
    // Equip a frame with 1 unit slot
    const oneSlotFrame: ArmorItem = { ...testFrame, id: 'frame_one_slot', unitSlots: 1 };
    addItem(inventory, oneSlotFrame);
    let updated = getInventory('char_test');
    equipItem(updated, 'frame_one_slot', 1, 'HUmar');

    // Equip first unit
    updated = getInventory('char_test');
    addItem(updated, testUnit);
    updated = getInventory('char_test');
    equipItem(updated, 'unit_01', 1, 'HUmar');

    // Try to equip second unit
    updated = getInventory('char_test');
    const secondUnit: ArmorItem = { ...testUnit, id: 'unit_02', name: 'DEF Unit' };
    addItem(updated, secondUnit);
    updated = getInventory('char_test');

    const result = equipItem(updated, 'unit_02', 1, 'HUmar');
    expect(result.success).toBe(false);
    expect(result.message).toContain('1 unit slot');
  });
});

describe('Inventory System - Frame Swap Unequips Units', () => {
  let inventory: InventoryState;

  beforeEach(() => {
    clearInventory('char_test');
    inventory = createInventory('char_test');
  });

  it('unequips all units when frame is swapped', () => {
    // Equip a frame with 2 unit slots
    addItem(inventory, testFrame);
    let updated = getInventory('char_test');
    equipItem(updated, 'frame_01', 1, 'HUmar');

    // Equip two units
    updated = getInventory('char_test');
    addItem(updated, testUnit);
    updated = getInventory('char_test');
    equipItem(updated, 'unit_01', 1, 'HUmar');

    updated = getInventory('char_test');
    const secondUnit: ArmorItem = { ...testUnit, id: 'unit_02', name: 'DEF Unit' };
    addItem(updated, secondUnit);
    updated = getInventory('char_test');
    equipItem(updated, 'unit_02', 1, 'HUmar');

    // Verify units are equipped
    updated = getInventory('char_test');
    expect(updated.equipment.unit1).not.toBeNull();
    expect(updated.equipment.unit2).not.toBeNull();

    // Swap to a new frame
    const newFrame: ArmorItem = { ...testFrame, id: 'frame_02', name: 'New Frame', unitSlots: 4 };
    addItem(updated, newFrame);
    updated = getInventory('char_test');

    const result = equipItem(updated, 'frame_02', 1, 'HUmar');
    expect(result.success).toBe(true);
    expect(result.unequippedItems).toHaveLength(2);

    // Verify units are unequipped and back in inventory
    const final = getInventory('char_test');
    expect(final.equipment.unit1).toBeNull();
    expect(final.equipment.unit2).toBeNull();
    expect(final.equipment.frame?.item.name).toBe('New Frame');

    // Units should be in inventory
    const unit1InInv = final.items.find(s => s.item.id === 'unit_01');
    const unit2InInv = final.items.find(s => s.item.id === 'unit_02');
    expect(unit1InInv).toBeDefined();
    expect(unit2InInv).toBeDefined();
  });

  it('returns previous frame to inventory when swapped', () => {
    addItem(inventory, testFrame);
    let updated = getInventory('char_test');
    equipItem(updated, 'frame_01', 1, 'HUmar');

    updated = getInventory('char_test');
    const newFrame: ArmorItem = { ...testFrame, id: 'frame_02', name: 'New Frame' };
    addItem(updated, newFrame);
    updated = getInventory('char_test');

    const result = equipItem(updated, 'frame_02', 1, 'HUmar');
    expect(result.success).toBe(true);
    expect(result.previousItem?.item.name).toBe('Chrome Frame');

    const final = getInventory('char_test');
    const oldFrameInInv = final.items.find(s => s.item.id === 'frame_01');
    expect(oldFrameInInv).toBeDefined();
  });
});

describe('Inventory System - Unequipping', () => {
  let inventory: InventoryState;

  beforeEach(() => {
    clearInventory('char_test');
    inventory = createInventory('char_test');
    addItem(inventory, testSword);
    inventory = getInventory('char_test');
    equipItem(inventory, 'sword_01', 1, 'HUmar');
    inventory = getInventory('char_test');
  });

  it('unequips item to inventory', () => {
    const result = unequipItem(inventory, 'weapon');
    expect(result.success).toBe(true);
    expect(result.previousItem?.item.name).toBe('Chrome Sword');

    const updated = getInventory('char_test');
    expect(updated.equipment.weapon).toBeNull();
    expect(findItem(updated, 'sword_01')).not.toBeNull();
  });

  it('fails when slot is empty', () => {
    const result = unequipItem(inventory, 'frame');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Nothing equipped');
  });

  it('fails when inventory is full', () => {
    // Create a fresh inventory with max slots = 30
    clearInventory('char_full_test');
    const fullInventory = createInventory('char_full_test', 30);

    // Add sword and equip it
    addItem(fullInventory, testSword);
    let updated = getInventory('char_full_test');
    equipItem(updated, 'sword_01', 1, 'HUmar');
    updated = getInventory('char_full_test');

    // Fill remaining 29 slots (sword was removed from inventory when equipped)
    for (let i = 0; i < 30; i++) {
      addItem(getInventory('char_full_test'), { ...testMonomate, id: `mono_${i}` }, 1);
    }
    updated = getInventory('char_full_test');

    const result = unequipItem(updated, 'weapon');
    expect(result.success).toBe(false);
    expect(result.message).toContain('full');
  });
});

describe('Inventory System - Equipment Stats', () => {
  beforeEach(() => {
    clearInventory('char_test');
    const inventory = createInventory('char_test');
    addItem(inventory, testSword);
    addItem(getInventory('char_test'), testFrame);
    addItem(getInventory('char_test'), testBarrier);
  });

  it('calculates stats from equipped items', () => {
    let inventory = getInventory('char_test');
    equipItem(inventory, 'sword_01', 1, 'HUmar');
    inventory = getInventory('char_test');
    equipItem(inventory, 'frame_01', 1, 'HUmar');
    inventory = getInventory('char_test');
    equipItem(inventory, 'barrier_01', 1, 'HUmar');
    inventory = getInventory('char_test');

    const stats = getEquipmentStats(inventory);
    expect(stats.attack).toBe(50);
    expect(stats.accuracy).toBe(30);
    expect(stats.defense).toBe(35); // 20 + 15
    expect(stats.evasion).toBe(15); // 5 + 10
  });

  it('returns zero stats for empty equipment', () => {
    const inventory = createInventory('empty_char');
    const stats = getEquipmentStats(inventory);
    expect(stats.attack).toBe(0);
    expect(stats.defense).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(stats.evasion).toBe(0);
  });
});

describe('Inventory System - Getting Equipped Items', () => {
  it('returns only equipped items', () => {
    clearInventory('char_test');
    const inventory = createInventory('char_test');
    addItem(inventory, testSword);
    addItem(getInventory('char_test'), testFrame);

    let updated = getInventory('char_test');
    equipItem(updated, 'sword_01', 1, 'HUmar');
    updated = getInventory('char_test');

    const equipped = getEquippedItems(updated);
    expect(Object.keys(equipped)).toHaveLength(1);
    expect(equipped.weapon?.item.name).toBe('Chrome Sword');
  });
});

describe('Inventory System - Sorting', () => {
  beforeEach(() => {
    clearInventory('char_test');
    const inventory = createInventory('char_test');
    addItem(inventory, testMonomate);
    addItem(getInventory('char_test'), testSword);
    addItem(getInventory('char_test'), testFrame);
    addItem(getInventory('char_test'), testHighLevelSword);
  });

  it('sorts by type and rarity', () => {
    const inventory = getInventory('char_test');
    const sorted = sortInventory(inventory);

    // Weapons first (higher rarity first), then armor, then consumables
    expect(sorted.items[0].item.name).toBe('Elite Sword'); // weapon, rarity 5
    expect(sorted.items[1].item.name).toBe('Chrome Sword'); // weapon, rarity 1
    expect(sorted.items[2].item.name).toBe('Chrome Frame'); // armor
    expect(sorted.items[3].item.name).toBe('Monomate'); // consumable
  });
});

describe('Inventory System - canEquip', () => {
  it('allows equipping when requirements met', () => {
    const result = canEquip(testSword, 50, 'HUmar');
    expect(result.allowed).toBe(true);
  });

  it('rejects when level too low', () => {
    const result = canEquip(testHighLevelSword, 10, 'HUmar');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('level 50');
  });

  it('rejects when class not allowed', () => {
    const result = canEquip(testHunterOnlySword, 50, 'RAmar');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('RAmar');
  });
});

// ============================================
// SHARED STORAGE TESTS
// ============================================

describe('Shared Storage System', () => {
  beforeEach(() => {
    clearSharedStorage();
  });

  it('returns empty storage by default', () => {
    const storage = getSharedStorage();
    expect(storage.items).toHaveLength(0);
    expect(storage.maxSlots).toBe(SHARED_STORAGE_SLOTS);
  });

  it('adds item to shared storage', () => {
    const result = addToSharedStorage(testMonomate, 5);
    expect(result.success).toBe(true);

    const storage = getSharedStorage();
    expect(storage.items).toHaveLength(1);
    expect(storage.items[0].item.name).toBe('Monomate');
    expect(storage.items[0].quantity).toBe(5);
  });

  it('stacks items in shared storage', () => {
    addToSharedStorage(testMonomate, 3);
    const result = addToSharedStorage(testMonomate, 4);
    expect(result.success).toBe(true);

    const storage = getSharedStorage();
    expect(storage.items).toHaveLength(1);
    expect(storage.items[0].quantity).toBe(7);
  });

  it('rejects stacking over max', () => {
    addToSharedStorage(testMonomate, 8);
    const result = addToSharedStorage(testMonomate, 5);
    expect(result.success).toBe(false);
    expect(result.message).toContain('max stack');
  });

  it('removes item from shared storage', () => {
    addToSharedStorage(testMonomate, 5);
    const result = removeFromSharedStorage('monomate', 2);
    expect(result.success).toBe(true);

    const storage = getSharedStorage();
    expect(storage.items[0].quantity).toBe(3);
  });

  it('removes entire stack when quantity matches', () => {
    addToSharedStorage(testMonomate, 5);
    const result = removeFromSharedStorage('monomate', 5);
    expect(result.success).toBe(true);

    const storage = getSharedStorage();
    expect(storage.items).toHaveLength(0);
  });

  it('fails to remove non-existent item', () => {
    const result = removeFromSharedStorage('nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('fails to remove more than available', () => {
    addToSharedStorage(testMonomate, 3);
    const result = removeFromSharedStorage('monomate', 5);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Only 3');
  });

  it('counts shared storage items', () => {
    expect(getSharedStorageCount()).toBe(0);

    addToSharedStorage(testMonomate, 5);
    expect(getSharedStorageCount()).toBe(1);

    addToSharedStorage(testSword);
    expect(getSharedStorageCount()).toBe(2);
  });
});

describe('Storage Transfer - Deposit', () => {
  beforeEach(() => {
    clearInventory('char_transfer');
    clearSharedStorage();
    const inventory = createInventory('char_transfer');
    addItem(inventory, testMonomate, 5);
  });

  it('deposits item from inventory to storage', () => {
    const result = depositToStorage('char_transfer', 'monomate', 3);
    expect(result.success).toBe(true);

    const inventory = getInventory('char_transfer');
    expect(inventory.items[0].quantity).toBe(2);

    const storage = getSharedStorage();
    expect(storage.items[0].quantity).toBe(3);
  });

  it('fails when item not in inventory', () => {
    const result = depositToStorage('char_transfer', 'nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not in inventory');
  });

  it('fails when not enough in inventory', () => {
    const result = depositToStorage('char_transfer', 'monomate', 10);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Only 5');
  });
});

describe('Storage Transfer - Withdraw', () => {
  beforeEach(() => {
    clearInventory('char_transfer');
    clearSharedStorage();
    createInventory('char_transfer');
    addToSharedStorage(testMonomate, 5);
  });

  it('withdraws item from storage to inventory', () => {
    const result = withdrawFromStorage('char_transfer', 'monomate', 3);
    expect(result.success).toBe(true);

    const inventory = getInventory('char_transfer');
    expect(inventory.items[0].quantity).toBe(3);

    const storage = getSharedStorage();
    expect(storage.items[0].quantity).toBe(2);
  });

  it('fails when item not in storage', () => {
    const result = withdrawFromStorage('char_transfer', 'nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not in storage');
  });

  it('fails when not enough in storage', () => {
    const result = withdrawFromStorage('char_transfer', 'monomate', 10);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Only 5');
  });

  it('fails when inventory is full', () => {
    // Create a character with a full inventory
    clearInventory('char_full');
    const fullInventory = createInventory('char_full', 1);
    addItem(fullInventory, testSword);

    const result = withdrawFromStorage('char_full', 'monomate', 1);
    expect(result.success).toBe(false);
    expect(result.message).toContain('full');
  });
});

// ============================================
// SHARED STORAGE MESETA TESTS
// ============================================

describe('Shared Storage - Meseta', () => {
  beforeEach(() => {
    clearSharedStorage();
    // Clear character storage for clean test
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('character_slots');
    }
  });

  it('starts with zero meseta', () => {
    const balance = getSharedStorageMeseta();
    expect(balance).toBe(0);
  });

  it('includes meseta in shared storage state', () => {
    const storage = getSharedStorage();
    expect(storage.meseta).toBe(0);
  });
});

describe('Shared Storage - Deposit Meseta', () => {
  beforeEach(() => {
    clearSharedStorage();
    clearCharacterSlots();
  });

  it('deposits meseta from character to storage', () => {
    const character = createAndSaveCharacter({
      name: 'DepositTest',
      classId: 'HUmar',
      slot: 0,
    });

    // Character starts with 500 meseta
    const result = depositMesetaToStorage(character.character_id, 200);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(200);

    // Check character meseta reduced
    const updatedChar = getCharacterFromSlot(0);
    expect(updatedChar?.meseta).toBe(300);

    // Check storage meseta increased
    expect(getSharedStorageMeseta()).toBe(200);
  });

  it('fails when character has insufficient meseta', () => {
    const character = createAndSaveCharacter({
      name: 'PoorTest',
      classId: 'HUmar',
      slot: 0,
    });

    // Try to deposit more than character has (500)
    const result = depositMesetaToStorage(character.character_id, 1000);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough meseta');
  });

  it('fails with zero or negative amount', () => {
    const character = createAndSaveCharacter({
      name: 'ZeroTest',
      classId: 'HUmar',
      slot: 0,
    });

    expect(depositMesetaToStorage(character.character_id, 0).success).toBe(false);
    expect(depositMesetaToStorage(character.character_id, -100).success).toBe(false);
  });

  it('fails for non-existent character', () => {
    const result = depositMesetaToStorage('fake_id', 100);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Character not found');
  });
});

describe('Shared Storage - Withdraw Meseta', () => {
  beforeEach(() => {
    clearSharedStorage();
    clearCharacterSlots();
  });

  it('withdraws meseta from storage to character', () => {
    // First deposit some meseta
    const character = createAndSaveCharacter({
      name: 'WithdrawTest',
      classId: 'HUmar',
      slot: 0,
    });

    depositMesetaToStorage(character.character_id, 400);

    // Now withdraw
    const result = withdrawMesetaFromStorage(character.character_id, 150);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(250);

    // Check character meseta increased
    const updatedChar = getCharacterFromSlot(0);
    expect(updatedChar?.meseta).toBe(250); // 100 + 150

    // Check storage meseta decreased
    expect(getSharedStorageMeseta()).toBe(250);
  });

  it('fails when storage has insufficient meseta', () => {
    const character = createAndSaveCharacter({
      name: 'OverdrawTest',
      classId: 'HUmar',
      slot: 0,
    });

    // Storage starts with 0 meseta
    const result = withdrawMesetaFromStorage(character.character_id, 100);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough meseta in storage');
  });

  it('cannot withdraw below zero', () => {
    const character = createAndSaveCharacter({
      name: 'ZeroTest',
      classId: 'HUmar',
      slot: 0,
    });

    depositMesetaToStorage(character.character_id, 100);

    // Try to withdraw more than stored
    const result = withdrawMesetaFromStorage(character.character_id, 200);
    expect(result.success).toBe(false);
    expect(getSharedStorageMeseta()).toBe(100); // Unchanged
  });

  it('fails with zero or negative amount', () => {
    const character = createAndSaveCharacter({
      name: 'NegTest',
      classId: 'HUmar',
      slot: 0,
    });

    expect(withdrawMesetaFromStorage(character.character_id, 0).success).toBe(false);
    expect(withdrawMesetaFromStorage(character.character_id, -50).success).toBe(false);
  });
});

describe('Shared Storage - Cross-Character Access', () => {
  beforeEach(() => {
    clearSharedStorage();
    clearCharacterSlots();
  });

  it('allows one character to deposit and another to withdraw meseta', () => {
    // Create first character (Hunter)
    const hunter = createAndSaveCharacter({
      name: 'Hunter',
      classId: 'HUmar',
      slot: 0,
    });

    // Hunter deposits meseta
    depositMesetaToStorage(hunter.character_id, 300);
    expect(getSharedStorageMeseta()).toBe(300);

    // Create second character (Force)
    const force = createAndSaveCharacter({
      name: 'Force',
      classId: 'FOmarl',
      slot: 1,
    });

    // Force withdraws meseta
    const result = withdrawMesetaFromStorage(force.character_id, 200);
    expect(result.success).toBe(true);

    // Check balances
    const updatedHunter = getCharacterFromSlot(0);
    const updatedForce = getCharacterFromSlot(1);

    expect(updatedHunter?.meseta).toBe(200); // 500 - 300
    expect(updatedForce?.meseta).toBe(700); // 500 + 200
    expect(getSharedStorageMeseta()).toBe(100); // 300 - 200
  });

  it('allows one character to deposit and another to withdraw items', () => {
    // Create Hunter
    const hunter = createAndSaveCharacter({
      name: 'Hunter',
      classId: 'HUmar',
      slot: 0,
    });

    // Hunter picks up a rod (can't use it)
    const rod: WeaponItem = {
      id: 'found_rod',
      name: 'Found Rod',
      description: 'A rod found in the field',
      type: 'weapon',
      weaponType: 'rod',
      attack: 50,
      accuracy: 30,
      grindLevel: 0,
      maxGrind: 9,
      requiredLevel: 1,
      rarity: 2,
      sellPrice: 100,
      stackable: false,
      maxStack: 1,
      classRestrictions: ['FOmar', 'FOmarl', 'FOnewm', 'FOnewearl'],
    };

    // Add rod to Hunter's inventory
    let hunterInv = getInventory(hunter.character_id);
    addItem(hunterInv, rod);

    // Hunter deposits rod to shared storage
    depositToStorage(hunter.character_id, 'found_rod');

    // Verify rod is in shared storage
    const storage = getSharedStorage();
    expect(storage.items.find(s => s.item.id === 'found_rod')).toBeDefined();

    // Create Force
    const force = createAndSaveCharacter({
      name: 'Force',
      classId: 'FOmarl',
      slot: 1,
    });

    // Force withdraws the rod
    const result = withdrawFromStorage(force.character_id, 'found_rod');
    expect(result.success).toBe(true);

    // Verify Force has the rod
    const forceInv = getInventory(force.character_id);
    expect(forceInv.items.find(s => s.item.id === 'found_rod')).toBeDefined();
  });
});
