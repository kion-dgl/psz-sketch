/**
 * Inventory System Types
 */

export interface ItemBase {
  id: string;
  name: string;
  description: string;
  rarity: number;
  sellPrice: number;
  stackable: boolean;
  maxStack: number;
}

export interface WeaponItem extends ItemBase {
  type: 'weapon';
  weaponType: string;
  attack: number;
  accuracy: number;
  element?: string;
  elementPercent?: number;
  grindLevel: number;
  maxGrind: number;
  requiredLevel: number;
  classRestrictions?: string[];
}

export interface ArmorItem extends ItemBase {
  type: 'armor';
  armorSlot: 'frame' | 'barrier' | 'unit';
  defense: number;
  evasion: number;
  resistances?: Record<string, number>;
  requiredLevel: number;
  /** Number of unit slots (0-4). Only applicable to frames. */
  unitSlots?: number;
}

export interface ConsumableItem extends ItemBase {
  type: 'consumable';
  effect: string;
  effectValue?: number;
}

export interface MaterialItem extends ItemBase {
  type: 'material';
  materialType: string;
}

export type GameItem = WeaponItem | ArmorItem | ConsumableItem | MaterialItem;

export interface InventorySlot {
  item: GameItem;
  quantity: number;
  equipped?: boolean;
}

export interface EquipmentSlots {
  weapon: InventorySlot | null;
  frame: InventorySlot | null;
  barrier: InventorySlot | null;
  unit1: InventorySlot | null;
  unit2: InventorySlot | null;
  unit3: InventorySlot | null;
  unit4: InventorySlot | null;
  mag: InventorySlot | null;
}

export interface InventoryState {
  characterId: string;
  items: InventorySlot[];
  equipment: EquipmentSlots;
  maxSlots: number;
}

export interface InventoryResult {
  success: boolean;
  message: string;
  inventory?: InventoryState;
}

export interface EquipResult {
  success: boolean;
  message: string;
  previousItem?: InventorySlot | null;
  /** Items that were unequipped (e.g., units when armor is swapped) */
  unequippedItems?: InventorySlot[];
}

export type EquipmentSlotType = keyof EquipmentSlots;

export const DEFAULT_MAX_SLOTS = 40;
export const MAX_INVENTORY_SLOTS = 40;
export const SHARED_STORAGE_SLOTS = 500;

export interface SharedStorageState {
  items: InventorySlot[];
  maxSlots: number;
  /** Shared meseta balance accessible by all characters */
  meseta: number;
}

export interface MesetaTransferResult {
  success: boolean;
  message: string;
  newBalance?: number;
}
