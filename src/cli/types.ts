/**
 * CLI Types
 * Types for the command-line interface
 */

import type { Character } from '../systems/character/types';
import type { ShopItem } from '../systems/shop/types';
import type { Mission, Difficulty } from '../systems/mission/types';

export type Location = 'city' | 'shop' | 'missions' | 'inventory' | 'storage' | 'guild' | 'field';

/** Detailed item info for UI display */
export interface DetailedItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material';
  rarity: number;
  quantity: number;
  // Weapon stats
  attack?: number;
  accuracy?: number;
  weaponType?: string;
  element?: string;
  // Armor stats
  defense?: number;
  evasion?: number;
  armorSlot?: 'frame' | 'barrier' | 'unit';
  unitSlots?: number;
  // Consumable
  effect?: string;
  effectValue?: number;
  // Level requirement
  requiredLevel?: number;
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

export interface GameState {
  character: Character | null;
  location: Location;
  inventory: DetailedItem[];
  equipment: EquipmentSlots;
  meseta: number;
  inCombat?: boolean;
  enemies?: EnemyInfo[];
  playerCombat?: PlayerCombat;
  stageIndex?: number;
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
