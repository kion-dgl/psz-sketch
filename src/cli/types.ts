/**
 * CLI Types
 * Types for the command-line interface
 */

import type { Character } from '../systems/character/types';
import type { ShopItem } from '../systems/shop/types';
import type { Mission, Difficulty } from '../systems/mission/types';

export type Location = 'city' | 'shop' | 'weapon-shop' | 'missions' | 'inventory' | 'storage' | 'guild' | 'teleporter' | 'field';

/** Detailed item info for UI display */
export interface DetailedItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'unit' | 'consumable' | 'material';
  rarity: number;
  quantity: number;
  // Weapon stats
  attack?: number;
  accuracy?: number;
  weaponType?: string;
  element?: string;
  elementPercent?: number;
  grindLevel?: number;
  maxGrind?: number;
  // Armor/Frame stats
  defense?: number;
  evasion?: number;
  unitSlots?: number;
  // Unit stats
  attackBonus?: number;
  defenseBonus?: number;
  accuracyBonus?: number;
  evasionBonus?: number;
  hpBonus?: number;
  tpBonus?: number;
  fireResist?: number;
  iceResist?: number;
  thunderResist?: number;
  lightResist?: number;
  darkResist?: number;
  // Consumable
  effect?: string;
  effectValue?: number;
  // Level requirement
  requiredLevel?: number;
  // Equipment state
  equipped?: boolean;
}

/** Equipment slot info */
export interface EquipmentSlots {
  weapon: DetailedItem | null;
  frame: DetailedItem | null;
  barrier: DetailedItem | null;
  unit1: DetailedItem | null;
  unit2: DetailedItem | null;
  unit3: DetailedItem | null;
  unit4: DetailedItem | null;
}

export interface PlayerCombat {
  hp: number;
  maxHp: number;
  tp: number;
  maxTp: number;
}

export interface EnemyInfo {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
}

export interface DroppedItemInfo {
  dropId: number;
  type: 'item' | 'meseta';
  itemId?: string;
  name: string;
  meseta?: number;
}

export interface CurrentStageInfo {
  stageId: string;      // e.g., 'valley_a'
  variant: 'a' | 'e' | 'b' | 'z';
  areaId: string;       // e.g., 'valley'
  areaName: string;     // e.g., 'Valley'
  variantName: string;  // e.g., 'A' or 'Boss'
}

export interface StorageItemInfo {
  id: string;
  name: string;
  quantity: number;
}

export interface StorageInfo {
  items: StorageItemInfo[];
  meseta: number;
}

export interface GameState {
  character: Character | null;
  location: Location;
  inventory: DetailedItem[];
  equipment: EquipmentSlots;
  meseta: number;
  inventorySlots?: number;
  maxInventorySlots?: number;
  inCombat?: boolean;
  enemies?: EnemyInfo[];
  playerCombat?: PlayerCombat;
  stageIndex?: number;
  isAtFinalStage?: boolean;
  droppedItems?: DroppedItemInfo[];
  currentStage?: CurrentStageInfo;
  currentWave?: number;
  totalWaves?: number;
  sessionType?: 'field' | 'mission' | null;
  storage?: StorageInfo;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface AvailableCommand {
  name: string;
  description: string;
  usage: string;
  args: CommandArg[];
}

export interface CommandArg {
  name: string;
  type: 'string' | 'number';
  required: boolean;
  description: string;
}
