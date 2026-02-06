/**
 * API Tests
 * Comprehensive tests for the new SQLite-backed API
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetDatabase,
  createCharacter,
  getCharacter,
  getAllCharacters,
  deleteCharacter,
  updateMeseta,
  addExperience,
  getInventory,
  addItem,
  removeItem,
  getItem,
  getEquipment,
  equipWeapon,
  equipFrame,
  unequipWeapon,
  getStorage,
  depositItem,
  withdrawItem,
  depositMeseta,
  withdrawMeseta,
  goto,
  getLocation,
  enterMission,
  enterField,
  returnToCity,
  initCombat,
  spawnEnemies,
  attack,
  getEnemies,
  getPlayerState,
  isWaveCleared,
  buyItem,
  getItemShopInventory,
} from './index';
import { MONOMATE, MONOFLUID } from '../systems/inventory/starting-items';

describe('Character API', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('creates a character', () => {
    const result = createCharacter(0, 'HUmar', 'TestHero');
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('TestHero');
    expect(result.data?.class_id).toBe('HUmar');
    expect(result.data?.level).toBe(1);
    expect(result.data?.meseta).toBe(500);
  });

  it('rejects invalid class', () => {
    const result = createCharacter(0, 'InvalidClass', 'Test');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid class');
  });

  it('rejects duplicate slot', () => {
    createCharacter(0, 'HUmar', 'First');
    const result = createCharacter(0, 'RAmar', 'Second');
    expect(result.success).toBe(false);
    expect(result.message).toContain('already has a character');
  });

  it('gets character by ID', () => {
    const created = createCharacter(0, 'HUmar', 'TestHero');
    const char = getCharacter(created.data!.id);
    expect(char?.name).toBe('TestHero');
  });

  it('gets all characters', () => {
    createCharacter(0, 'HUmar', 'Hero1');
    createCharacter(2, 'RAmar', 'Hero2');
    const all = getAllCharacters();
    expect(all[0]?.name).toBe('Hero1');
    expect(all[1]).toBeNull();
    expect(all[2]?.name).toBe('Hero2');
    expect(all[3]).toBeNull();
  });

  it('deletes a character', () => {
    const created = createCharacter(0, 'HUmar', 'TestHero');
    const result = deleteCharacter(created.data!.id);
    expect(result.success).toBe(true);
    expect(getCharacter(created.data!.id)).toBeNull();
  });

  it('updates meseta', () => {
    const created = createCharacter(0, 'HUmar', 'TestHero');
    updateMeseta(created.data!.id, 100);
    const char = getCharacter(created.data!.id);
    expect(char?.meseta).toBe(600);
  });

  it('rejects negative meseta', () => {
    const created = createCharacter(0, 'HUmar', 'TestHero');
    const result = updateMeseta(created.data!.id, -1000);
    expect(result.success).toBe(false);
  });

  it('adds experience and levels up', () => {
    const created = createCharacter(0, 'HUmar', 'TestHero');
    const result = addExperience(created.data!.id, 1000);
    expect(result.success).toBe(true);
    const char = getCharacter(created.data!.id);
    expect(char?.experience).toBe(1000);
    expect(char?.level).toBeGreaterThan(1);
  });
});

describe('Inventory API', () => {
  let charId: string;

  beforeEach(() => {
    resetDatabase();
    const result = createCharacter(0, 'HUmar', 'TestHero');
    charId = result.data!.id;
  });

  it('starts with consumables', () => {
    const inv = getInventory(charId);
    expect(inv.length).toBe(2); // monomate and monofluid
    expect(inv.find(i => i.item_id === 'monomate')?.quantity).toBe(5);
  });

  it('adds items', () => {
    addItem(charId, MONOMATE, 3);
    const inv = getInventory(charId);
    const monomate = inv.find(i => i.item_id === 'monomate');
    expect(monomate?.quantity).toBe(8); // 5 + 3
  });

  it('removes items', () => {
    removeItem(charId, 'monomate', 2);
    const inv = getInventory(charId);
    const monomate = inv.find(i => i.item_id === 'monomate');
    expect(monomate?.quantity).toBe(3);
  });

  it('respects max stack', () => {
    addItem(charId, MONOMATE, 3); // Now at 8
    const result = addItem(charId, MONOMATE, 5); // Would be 13, max is 10
    expect(result.success).toBe(false);
    expect(result.message).toContain('max stack');
  });
});

describe('Equipment API', () => {
  let charId: string;

  beforeEach(() => {
    resetDatabase();
    const result = createCharacter(0, 'HUmar', 'TestHero');
    charId = result.data!.id;
  });

  it('starts with weapon and frame equipped', () => {
    const equip = getEquipment(charId);
    expect(equip.weapon?.name).toBe('Saber');
    expect(equip.frame?.name).toBe('Frame');
  });

  it('unequips weapon to inventory', () => {
    unequipWeapon(charId);
    const equip = getEquipment(charId);
    expect(equip.weapon).toBeNull();
    const inv = getInventory(charId);
    expect(inv.find(i => i.item.name === 'Saber')).toBeDefined();
  });

  it('swaps weapons', () => {
    // Unequip first
    unequipWeapon(charId);
    // Re-equip
    const inv = getInventory(charId);
    const saber = inv.find(i => i.item.name === 'Saber');
    equipWeapon(charId, saber!.item_id);
    const equip = getEquipment(charId);
    expect(equip.weapon?.name).toBe('Saber');
  });
});

describe('Storage API', () => {
  let charId: string;

  beforeEach(() => {
    resetDatabase();
    const result = createCharacter(0, 'HUmar', 'TestHero');
    charId = result.data!.id;
    goto(charId, 'storage');
  });

  it('starts empty', () => {
    const storage = getStorage();
    expect(storage.items.length).toBe(0);
    expect(storage.meseta).toBe(0);
  });

  it('deposits items', () => {
    depositItem(charId, 'monomate', 3);
    const storage = getStorage();
    expect(storage.items.length).toBe(1);
    expect(storage.items[0].quantity).toBe(3);
  });

  it('stacks items in storage', () => {
    depositItem(charId, 'monomate', 2);
    depositItem(charId, 'monomate', 2);
    const storage = getStorage();
    expect(storage.items.length).toBe(1);
    expect(storage.items[0].quantity).toBe(4);
  });

  it('withdraws items', () => {
    depositItem(charId, 'monomate', 3);
    withdrawItem(charId, 'monomate', 2);
    const storage = getStorage();
    expect(storage.items[0].quantity).toBe(1);
  });

  it('deposits meseta', () => {
    depositMeseta(charId, 100);
    const storage = getStorage();
    expect(storage.meseta).toBe(100);
  });

  it('withdraws meseta', () => {
    depositMeseta(charId, 200);
    withdrawMeseta(charId, 50);
    const storage = getStorage();
    expect(storage.meseta).toBe(150);
  });
});

describe('Location API', () => {
  let charId: string;

  beforeEach(() => {
    resetDatabase();
    const result = createCharacter(0, 'HUmar', 'TestHero');
    charId = result.data!.id;
  });

  it('starts in city', () => {
    expect(getLocation(charId)).toBe('city');
  });

  it('moves to shop', () => {
    goto(charId, 'shop');
    expect(getLocation(charId)).toBe('shop');
  });

  it('moves to weapon-shop', () => {
    goto(charId, 'weapon-shop');
    expect(getLocation(charId)).toBe('weapon-shop');
  });

  it('rejects invalid location', () => {
    const result = goto(charId, 'invalid');
    expect(result.success).toBe(false);
  });

  it('enters mission from guild', () => {
    goto(charId, 'guild');
    const result = enterMission(charId, 'mayors-mission', 'normal');
    expect(result.success).toBe(true);
    expect(getLocation(charId)).toBe('field');
  });

  it('requires guild to start mission', () => {
    const result = enterMission(charId, 'mayors-mission', 'normal');
    expect(result.success).toBe(false);
  });

  it('enters field from teleporter', () => {
    goto(charId, 'teleporter');
    const result = enterField(charId, 'gurhacia-valley', 'normal');
    expect(result.success).toBe(true);
    expect(getLocation(charId)).toBe('field');
  });

  it('returns to city', () => {
    goto(charId, 'guild');
    enterMission(charId, 'mayors-mission', 'normal');
    returnToCity(charId);
    expect(getLocation(charId)).toBe('city');
  });
});

describe('Combat API', () => {
  let charId: string;

  beforeEach(() => {
    resetDatabase();
    const result = createCharacter(0, 'HUmar', 'TestHero');
    charId = result.data!.id;
    goto(charId, 'guild');
    enterMission(charId, 'mayors-mission', 'normal');
    initCombat(charId);
  });

  it('spawns enemies', () => {
    const result = spawnEnemies(charId, 'mayors-mission', 'normal', 12345);
    expect(result.success).toBe(true);
    const enemies = getEnemies(charId);
    expect(enemies.length).toBeGreaterThan(0);
  });

  it('attacks enemies', () => {
    spawnEnemies(charId, 'mayors-mission', 'normal', 12345);
    const result = attack(charId, 0);
    expect(result.success).toBe(true);
    expect(result.data?.enemyName).toBeDefined();
  });

  it('tracks player HP', () => {
    spawnEnemies(charId, 'mayors-mission', 'normal', 12345);
    const before = getPlayerState(charId);
    attack(charId, 0);
    const after = getPlayerState(charId);
    // Counter-attack may have dealt damage
    expect(after.hp).toBeLessThanOrEqual(before.hp);
  });

  it('detects wave cleared', () => {
    spawnEnemies(charId, 'mayors-mission', 'normal', 12345);
    expect(isWaveCleared(charId)).toBe(false);
    // Would need to defeat all enemies to clear
  });

  it('rejects invalid target', () => {
    spawnEnemies(charId, 'mayors-mission', 'normal', 12345);
    const result = attack(charId, 99);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid target');
  });
});

describe('Shop API', () => {
  let charId: string;

  beforeEach(() => {
    resetDatabase();
    const result = createCharacter(0, 'HUmar', 'TestHero');
    charId = result.data!.id;
    goto(charId, 'shop');
  });

  it('lists shop items', () => {
    const items = getItemShopInventory();
    expect(items.length).toBeGreaterThan(0);
    expect(items.find(i => i.id === 'monomate')).toBeDefined();
  });

  it('buys items', () => {
    const result = buyItem(charId, 'monomate', 2);
    expect(result.success).toBe(true);
    const inv = getInventory(charId);
    const monomate = inv.find(i => i.item_id === 'monomate');
    expect(monomate?.quantity).toBe(7); // 5 + 2
  });

  it('rejects purchase without enough meseta', () => {
    updateMeseta(charId, -490); // Leave only 10
    const result = buyItem(charId, 'trimate', 1); // 600 meseta
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough meseta');
  });

  it('requires being at shop', () => {
    goto(charId, 'city');
    const result = buyItem(charId, 'monomate', 1);
    expect(result.success).toBe(false);
  });
});
