export type ItemCategory = 'usable' | 'weapon' | 'armor' | 'special';

export interface InventoryItem {
  id: string;
  itemId?: string;
  name: string;
  japaneseName?: string;
  category: ItemCategory;
  quantity: number;
  description: string;
  rarity: number;
  // For armor
  dfp?: number;
  evp?: number;
  slots?: number;
  // For weapons
  atp?: number;
  ata?: number;
  mst?: number;
  weaponType?: string;
  level?: number;
  // For units
  unitType?: string;
}

export interface PlayerInventory {
  version: number;
  maxItems: number;
  items: InventoryItem[];
}
