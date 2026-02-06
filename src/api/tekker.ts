/**
 * Tekker Shop API
 * Weapon grinding with grinder items and special weapon identification
 */
import { db } from '../db';
import { getCharacter, updateMeseta } from './character';
import { getItem, removeItem } from './inventory';
import { getEquipment } from './equipment';
import { getLocation } from './location';
import type { WeaponItem, GrinderItem } from '../systems/inventory/types';

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// GRINDER ITEMS
// ============================================================================

export const MONOGRINDER: GrinderItem = {
  id: 'monogrinder',
  name: 'Monogrinder',
  description: 'Increases weapon grind by +1. Used at the Tekker.',
  type: 'grinder',
  grindBonus: 1,
  rarity: 1,
  sellPrice: 100,
  stackable: true,
  maxStack: 99,
};

export const DIGRINDER: GrinderItem = {
  id: 'digrinder',
  name: 'Digrinder',
  description: 'Increases weapon grind by +2. Used at the Tekker.',
  type: 'grinder',
  grindBonus: 2,
  rarity: 2,
  sellPrice: 300,
  stackable: true,
  maxStack: 99,
};

export const TRIGRINDER: GrinderItem = {
  id: 'trigrinder',
  name: 'Trigrinder',
  description: 'Increases weapon grind by +3. Used at the Tekker.',
  type: 'grinder',
  grindBonus: 3,
  rarity: 3,
  sellPrice: 800,
  stackable: true,
  maxStack: 99,
};

export const GRINDERS: Record<string, GrinderItem> = {
  monogrinder: MONOGRINDER,
  digrinder: DIGRINDER,
  trigrinder: TRIGRINDER,
};

// ============================================================================
// GRINDING COSTS
// ============================================================================

/**
 * Meseta cost to grind scales with current grind level and weapon rarity
 */
function getGrindCost(weapon: WeaponItem, currentGrind: number): number {
  const rarityMultiplier = weapon.rarity ?? 1;
  const baseCost = 200 + currentGrind * 100;
  return baseCost * rarityMultiplier;
}

/**
 * Grind success rate - higher grind levels have lower success
 * Failure doesn't consume the grinder but still costs meseta
 */
function getGrindSuccessRate(currentGrind: number, grindBonus: number): number {
  // Base rates for different grind ranges
  if (currentGrind < 3) return 100;
  if (currentGrind < 5) return 95;
  if (currentGrind < 7) return 85;
  if (currentGrind < 9) return 70;

  // Higher grinders have slightly better rates at high levels
  const bonusRate = (grindBonus - 1) * 5;
  return Math.min(60 + bonusRate, 75);
}

// ============================================================================
// WEAPON GRINDING
// ============================================================================

/**
 * Apply a grinder to a weapon at the Tekker shop
 */
export function applyGrinder(
  characterId: string,
  weaponItemId: string,
  grinderItemId: string
): ApiResult<{
  success: boolean;
  newGrind?: number;
  attackBonus?: number;
  grindConsumed: boolean;
}> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const location = getLocation(characterId);
  if (location !== 'tekker') {
    return { success: false, message: 'Must be at the Tekker to grind weapons.' };
  }

  // Get the grinder from inventory
  const grinderSlot = getItem(characterId, grinderItemId);
  if (!grinderSlot) {
    return { success: false, message: 'Grinder not found in inventory.' };
  }

  const grinder = grinderSlot.item as GrinderItem;
  if (grinder.type !== 'grinder') {
    return { success: false, message: 'Item is not a grinder.' };
  }

  // Get the weapon (check equipped first, then inventory)
  const equipment = getEquipment(characterId);
  let weapon: WeaponItem | null = null;
  let isEquipped = false;

  if (equipment?.weapon?.id === weaponItemId) {
    weapon = equipment.weapon as WeaponItem;
    isEquipped = true;
  } else {
    const item = getItem(characterId, weaponItemId);
    if (item?.item?.type === 'weapon') {
      weapon = item.item as WeaponItem;
    }
  }

  if (!weapon) {
    return { success: false, message: 'Weapon not found.' };
  }

  // Check if weapon is identified (can't grind unidentified weapons)
  if (weapon.identified === false) {
    return { success: false, message: 'Cannot grind an unidentified weapon. Appraise it first.' };
  }

  const currentGrind = weapon.grindLevel ?? 0;
  const maxGrind = weapon.maxGrind ?? 10;
  const targetGrind = currentGrind + grinder.grindBonus;

  if (currentGrind >= maxGrind) {
    return { success: false, message: `Weapon is already at max grind (+${maxGrind}).` };
  }

  // Calculate cost
  const cost = getGrindCost(weapon, currentGrind);
  if (char.meseta < cost) {
    return { success: false, message: `Not enough meseta. Need ${cost}, have ${char.meseta}.` };
  }

  // Deduct meseta first (always costs meseta whether success or fail)
  updateMeseta(characterId, -cost);

  // Check success rate
  const successRate = getGrindSuccessRate(currentGrind, grinder.grindBonus);
  const roll = Math.random() * 100;
  const succeeded = roll < successRate;

  if (!succeeded) {
    // Failure - grinder is NOT consumed, only meseta lost
    return {
      success: false,
      message: `Grinding failed! (${successRate}% chance) Lost ${cost} meseta. Grinder preserved.`,
      data: { success: false, grindConsumed: false },
    };
  }

  // Success - consume grinder
  removeItem(characterId, grinderItemId, 1);

  // Calculate new grind (capped at max)
  const newGrind = Math.min(targetGrind, maxGrind);
  const actualBonus = newGrind - currentGrind;

  // Update weapon
  weapon.grindLevel = newGrind;

  // Attack bonus per grind level
  const attackPerGrind = 2;
  const totalAttackBonus = actualBonus * attackPerGrind;
  weapon.attack = (weapon.attack ?? 0) + totalAttackBonus;

  // Save updated weapon
  if (isEquipped) {
    db.prepare(`UPDATE equipment SET item_data = ? WHERE character_id = ? AND slot = 'weapon'`)
      .run(JSON.stringify(weapon), characterId);
  } else {
    db.prepare(`UPDATE inventory SET item_data = ? WHERE character_id = ? AND item_id = ?`)
      .run(JSON.stringify(weapon), characterId, weaponItemId);
  }

  return {
    success: true,
    message: `Grinding successful! ${weapon.name} is now +${newGrind}. ATK +${totalAttackBonus}. Cost: ${cost} meseta.`,
    data: { success: true, newGrind, attackBonus: totalAttackBonus, grindConsumed: true },
  };
}

/**
 * Get grind info for a weapon
 */
export function getGrindInfo(
  characterId: string,
  weaponItemId: string,
  grinderItemId?: string
): ApiResult<{
  weaponName: string;
  currentGrind: number;
  maxGrind: number;
  grinderBonus?: number;
  cost: number;
  successRate: number;
}> {
  const equipment = getEquipment(characterId);
  let weapon: WeaponItem | null = null;

  if (equipment?.weapon?.id === weaponItemId) {
    weapon = equipment.weapon as WeaponItem;
  } else {
    const item = getItem(characterId, weaponItemId);
    if (item?.item?.type === 'weapon') {
      weapon = item.item as WeaponItem;
    }
  }

  if (!weapon) {
    return { success: false, message: 'Weapon not found.' };
  }

  const currentGrind = weapon.grindLevel ?? 0;
  const maxGrind = weapon.maxGrind ?? 10;
  const cost = getGrindCost(weapon, currentGrind);

  // Get grinder bonus if specified
  let grinderBonus: number | undefined;
  if (grinderItemId) {
    const grinderSlot = getItem(characterId, grinderItemId);
    if (grinderSlot?.item?.type === 'grinder') {
      grinderBonus = (grinderSlot.item as GrinderItem).grindBonus;
    }
  }

  const successRate = getGrindSuccessRate(currentGrind, grinderBonus ?? 1);
  const displayName = weapon.identified === false ? 'SPECIAL WEAPON' : weapon.name;

  return {
    success: true,
    message: `${displayName} +${currentGrind}/${maxGrind}. Cost: ${cost} meseta (${successRate}% success)`,
    data: {
      weaponName: displayName,
      currentGrind,
      maxGrind,
      grinderBonus,
      cost,
      successRate
    },
  };
}

// ============================================================================
// SPECIAL WEAPON IDENTIFICATION
// ============================================================================

/**
 * Cost to identify a special weapon based on rarity
 */
function getIdentifyCost(rarity: number): number {
  const baseCosts: Record<number, number> = {
    5: 1000,
    6: 2500,
    7: 5000,
  };
  return baseCosts[rarity] ?? 500;
}

/**
 * Identify a special weapon at the Tekker
 * Reveals the true name and stats of unidentified 5-7★ weapons
 */
export function identifyWeapon(
  characterId: string,
  weaponItemId: string
): ApiResult<{
  name: string;
  attack: number;
  accuracy: number;
  element?: string;
  elementPercent?: number;
  rarity: number;
}> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const location = getLocation(characterId);
  if (location !== 'tekker') {
    return { success: false, message: 'Must be at the Tekker to identify weapons.' };
  }

  // Get the weapon from inventory (can't identify equipped weapons - must unequip first)
  const itemSlot = getItem(characterId, weaponItemId);
  if (!itemSlot) {
    return { success: false, message: 'Weapon not found in inventory.' };
  }

  const weapon = itemSlot.item as WeaponItem;
  if (weapon.type !== 'weapon') {
    return { success: false, message: 'Item is not a weapon.' };
  }

  if (weapon.identified !== false) {
    return { success: false, message: 'Weapon is already identified.' };
  }

  // Calculate cost
  const cost = getIdentifyCost(weapon.rarity);
  if (char.meseta < cost) {
    return { success: false, message: `Not enough meseta. Need ${cost}, have ${char.meseta}.` };
  }

  // Deduct meseta
  updateMeseta(characterId, -cost);

  // Reveal the weapon's true identity
  weapon.identified = true;
  weapon.name = weapon.hiddenName ?? weapon.name;
  weapon.attack = weapon.hiddenAttack ?? weapon.attack;
  weapon.accuracy = weapon.hiddenAccuracy ?? weapon.accuracy;
  weapon.element = weapon.hiddenElement ?? weapon.element;
  weapon.elementPercent = weapon.hiddenElementPercent ?? weapon.elementPercent;

  // Clean up hidden fields
  delete weapon.hiddenName;
  delete weapon.hiddenAttack;
  delete weapon.hiddenAccuracy;
  delete weapon.hiddenElement;
  delete weapon.hiddenElementPercent;

  // Save updated weapon
  db.prepare(`UPDATE inventory SET item_data = ? WHERE character_id = ? AND item_id = ?`)
    .run(JSON.stringify(weapon), characterId, weaponItemId);

  return {
    success: true,
    message: `Identified: ${weapon.name}! (Cost: ${cost} meseta)`,
    data: {
      name: weapon.name,
      attack: weapon.attack,
      accuracy: weapon.accuracy,
      element: weapon.element,
      elementPercent: weapon.elementPercent,
      rarity: weapon.rarity,
    },
  };
}

/**
 * Get identification cost for a weapon
 */
export function getIdentifyCostInfo(
  characterId: string,
  weaponItemId: string
): ApiResult<{ cost: number; rarity: number }> {
  const itemSlot = getItem(characterId, weaponItemId);
  if (!itemSlot) {
    return { success: false, message: 'Weapon not found.' };
  }

  const weapon = itemSlot.item as WeaponItem;
  if (weapon.type !== 'weapon') {
    return { success: false, message: 'Item is not a weapon.' };
  }

  if (weapon.identified !== false) {
    return { success: false, message: 'Weapon is already identified.' };
  }

  const cost = getIdentifyCost(weapon.rarity);
  return {
    success: true,
    message: `Identification cost: ${cost} meseta`,
    data: { cost, rarity: weapon.rarity },
  };
}

/**
 * Create an unidentified special weapon (for drops)
 */
export function createUnidentifiedWeapon(weapon: WeaponItem): WeaponItem {
  // Only make 5-7★ weapons unidentified
  if ((weapon.rarity ?? 1) < 5) {
    return { ...weapon, identified: true };
  }

  return {
    ...weapon,
    identified: false,
    // Store true values in hidden fields
    hiddenName: weapon.name,
    hiddenAttack: weapon.attack,
    hiddenAccuracy: weapon.accuracy,
    hiddenElement: weapon.element,
    hiddenElementPercent: weapon.elementPercent,
    // Show as special weapon
    name: 'SPECIAL WEAPON',
    // Hide some stats (show base weapon type stats?)
    attack: 0,
    accuracy: 0,
    element: undefined,
    elementPercent: undefined,
  };
}

/**
 * List all unidentified weapons in inventory
 */
export function getUnidentifiedWeapons(characterId: string): ApiResult<WeaponItem[]> {
  const rows = db.prepare(`
    SELECT item_data FROM inventory
    WHERE character_id = ? AND item_data LIKE '%"identified":false%'
  `).all(characterId) as { item_data: string }[];

  const weapons: WeaponItem[] = [];
  for (const row of rows) {
    try {
      const item = JSON.parse(row.item_data);
      if (item.type === 'weapon' && item.identified === false) {
        weapons.push(item);
      }
    } catch {
      // Skip invalid items
    }
  }

  return {
    success: true,
    message: `${weapons.length} unidentified weapon(s)`,
    data: weapons,
  };
}
