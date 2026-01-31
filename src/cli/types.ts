/**
 * CLI Types
 * Types for the command-line interface
 */

import type { Character } from '../systems/character/types';
import type { ShopItem } from '../systems/shop/types';
import type { Mission, Difficulty } from '../systems/mission/types';
import type { InventoryItem } from '../systems/inventory/types';

export type Location = 'city' | 'shop' | 'missions' | 'inventory' | 'storage' | 'guild' | 'field';

export interface GameState {
  character: Character | null;
  location: Location;
  inventory: InventoryItem[];
  meseta: number;
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
