/**
 * Shop System Types
 */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  sellPrice: number;
  rarity: number;
  category: ShopCategory;
  stock?: number; // null = unlimited
  requiredLevel?: number;
}

export type ShopCategory = 'consumable' | 'weapon' | 'armor' | 'unit' | 'material' | 'tech';

// Extended shop item for equipment with randomized attributes
export interface EquipmentShopItem extends ShopItem {
  slots?: number;           // For armor: 0-3 slots
  element?: string;         // For weapons: element type
  elementPercent?: number;  // For weapons: element percentage
  attack?: number;          // For weapons: attack power
  defense?: number;         // For armor: defense value
  evasion?: number;         // For armor: evasion value
}

export interface ShopInventory {
  shopId: string;
  items: ShopItem[];
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: ShopItem;
  quantity?: number;
  totalCost?: number;
  remainingMeseta?: number;
}

export interface SellResult {
  success: boolean;
  message: string;
  item?: ShopItem;
  quantity?: number;
  totalValue?: number;
  newMeseta?: number;
}

export interface ShopState {
  meseta: number;
  inventory: ShopInventory[];
}

export const SELL_MULTIPLIER = 0.25; // Sell for 25% of buy price
export const SHOP_IDS = {
  ITEM_SHOP: 'item-shop',
  WEAPON_SHOP: 'weapon-shop',
  ARMOR_SHOP: 'armor-shop',
  TECH_SHOP: 'tech-shop',
} as const;

export type ShopId = typeof SHOP_IDS[keyof typeof SHOP_IDS];
