/**
 * Starting Items
 * Default items given to new characters
 */

import type { WeaponItem, ArmorItem, ConsumableItem } from './types';

// ============================================
// STARTER WEAPONS (1* rarity, class-specific)
// ============================================

export const STARTER_SABER: WeaponItem = {
  id: 'starter_saber',
  name: 'Saber',
  description: 'A basic sword for close combat.',
  type: 'weapon',
  weaponType: 'saber',
  attack: 30,
  accuracy: 25,
  grindLevel: 0,
  maxGrind: 9,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 50,
  stackable: false,
  maxStack: 1,
  classRestrictions: ['HUmar', 'HUmarl', 'HUcast', 'HUcaseal', 'HUnewm', 'HUnewearl'],
};

export const STARTER_RIFLE: WeaponItem = {
  id: 'starter_rifle',
  name: 'Handgun',
  description: 'A basic ranged weapon.',
  type: 'weapon',
  weaponType: 'handgun',
  attack: 25,
  accuracy: 35,
  grindLevel: 0,
  maxGrind: 9,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 50,
  stackable: false,
  maxStack: 1,
  classRestrictions: ['RAmar', 'RAmarl', 'RAcast', 'RAcaseal'],
};

export const STARTER_ROD: WeaponItem = {
  id: 'starter_rod',
  name: 'Cane',
  description: 'A basic technique amplifier.',
  type: 'weapon',
  weaponType: 'rod',
  attack: 15,
  accuracy: 20,
  grindLevel: 0,
  maxGrind: 9,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 50,
  stackable: false,
  maxStack: 1,
  classRestrictions: ['FOmar', 'FOmarl', 'FOnewm', 'FOnewearl'],
};

// ============================================
// STARTER ARMOR
// ============================================

export const STARTER_FRAME: ArmorItem = {
  id: 'starter_frame',
  name: 'Frame',
  description: 'Basic protective armor.',
  type: 'armor',
  armorSlot: 'frame',
  defense: 10,
  evasion: 5,
  requiredLevel: 1,
  rarity: 1,
  sellPrice: 30,
  stackable: false,
  maxStack: 1,
  unitSlots: 0,
};

// ============================================
// STARTER CONSUMABLES
// ============================================

export const MONOMATE: ConsumableItem = {
  id: 'monomate',
  name: 'Monomate',
  description: 'Restores a small amount of HP.',
  type: 'consumable',
  effect: 'heal_hp',
  effectValue: 100,
  rarity: 1,
  sellPrice: 25,
  stackable: true,
  maxStack: 10,
};

export const MONOFLUID: ConsumableItem = {
  id: 'monofluid',
  name: 'Monofluid',
  description: 'Restores a small amount of TP.',
  type: 'consumable',
  effect: 'heal_tp',
  effectValue: 50,
  rarity: 1,
  sellPrice: 50,
  stackable: true,
  maxStack: 10,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the starter weapon for a class
 */
export function getStarterWeaponForClass(classId: string): WeaponItem {
  const upperClass = classId.toUpperCase();

  if (upperClass.startsWith('HU')) {
    return { ...STARTER_SABER };
  }
  if (upperClass.startsWith('RA')) {
    return { ...STARTER_RIFLE };
  }
  if (upperClass.startsWith('FO')) {
    return { ...STARTER_ROD };
  }

  // Default to saber if unknown class
  return { ...STARTER_SABER };
}

/**
 * Get all starting items for a new character
 */
export function getStartingItems(classId: string): {
  weapon: WeaponItem;
  frame: ArmorItem;
  consumables: { item: ConsumableItem; quantity: number }[];
  meseta: number;
} {
  return {
    weapon: getStarterWeaponForClass(classId),
    frame: { ...STARTER_FRAME },
    consumables: [
      { item: { ...MONOMATE }, quantity: 5 },
      { item: { ...MONOFLUID }, quantity: 5 },
    ],
    meseta: 500,
  };
}

/**
 * Starting meseta for new characters
 */
export const STARTING_MESETA = 500;
