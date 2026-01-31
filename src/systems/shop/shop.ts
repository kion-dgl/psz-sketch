/**
 * Shop System
 * Item purchasing and selling logic
 */

import type {
  ShopItem,
  ShopInventory,
  PurchaseResult,
  SellResult,
  ShopCategory,
  ShopId,
} from './types';
import { SELL_MULTIPLIER, SHOP_IDS } from './types';

// Shop inventories (would be loaded from JSON in production)
const shopInventories = new Map<string, ShopInventory>();

/**
 * Register a shop's inventory
 */
export function registerShopInventory(inventory: ShopInventory): void {
  shopInventories.set(inventory.shopId, inventory);
}

/**
 * Get a shop's inventory
 */
export function getShopInventory(shopId: ShopId | string): ShopInventory | null {
  return shopInventories.get(shopId) ?? null;
}

/**
 * Get all items in a shop
 */
export function getShopItems(shopId: ShopId | string): ShopItem[] {
  const inventory = getShopInventory(shopId);
  return inventory?.items ?? [];
}

/**
 * Get items by category
 */
export function getShopItemsByCategory(shopId: ShopId | string, category: ShopCategory): ShopItem[] {
  const items = getShopItems(shopId);
  return items.filter(item => item.category === category);
}

/**
 * Find a specific item in a shop
 */
export function findShopItem(shopId: ShopId | string, itemId: string): ShopItem | null {
  const items = getShopItems(shopId);
  return items.find(item => item.id === itemId) ?? null;
}

/**
 * Check if player can afford an item
 */
export function canAfford(meseta: number, item: ShopItem, quantity: number = 1): boolean {
  return meseta >= item.price * quantity;
}

/**
 * Check if item is in stock
 */
export function isInStock(item: ShopItem, quantity: number = 1): boolean {
  if (item.stock === undefined || item.stock === null) {
    return true; // Unlimited stock
  }
  return item.stock >= quantity;
}

/**
 * Calculate total cost
 */
export function calculateTotalCost(item: ShopItem, quantity: number): number {
  return item.price * quantity;
}

/**
 * Calculate sell value
 */
export function calculateSellValue(item: ShopItem, quantity: number = 1): number {
  return Math.floor(item.sellPrice * quantity);
}

/**
 * Purchase an item from a shop
 */
export function purchaseItem(
  shopId: ShopId | string,
  itemId: string,
  quantity: number,
  currentMeseta: number
): PurchaseResult {
  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive' };
  }

  const item = findShopItem(shopId, itemId);
  if (!item) {
    return { success: false, message: 'Item not found in shop' };
  }

  if (!isInStock(item, quantity)) {
    return { success: false, message: 'Item out of stock' };
  }

  const totalCost = calculateTotalCost(item, quantity);
  if (!canAfford(currentMeseta, item, quantity)) {
    return {
      success: false,
      message: `Not enough meseta. Need ${totalCost}, have ${currentMeseta}`,
    };
  }

  // Update stock if not unlimited
  if (item.stock !== undefined && item.stock !== null) {
    item.stock -= quantity;
  }

  return {
    success: true,
    message: `Purchased ${quantity}x ${item.name}`,
    item,
    quantity,
    totalCost,
    remainingMeseta: currentMeseta - totalCost,
  };
}

/**
 * Sell an item
 */
export function sellItem(
  item: ShopItem,
  quantity: number,
  currentMeseta: number
): SellResult {
  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive' };
  }

  const totalValue = calculateSellValue(item, quantity);

  return {
    success: true,
    message: `Sold ${quantity}x ${item.name} for ${totalValue} meseta`,
    item,
    quantity,
    totalValue,
    newMeseta: currentMeseta + totalValue,
  };
}

/**
 * Get formatted price string
 */
export function formatPrice(price: number): string {
  return price.toLocaleString();
}

/**
 * Check if player meets level requirement
 */
export function meetsLevelRequirement(item: ShopItem, playerLevel: number): boolean {
  if (!item.requiredLevel) return true;
  return playerLevel >= item.requiredLevel;
}

/**
 * Get items player can buy
 */
export function getAvailableItems(
  shopId: ShopId | string,
  playerLevel: number,
  meseta: number
): ShopItem[] {
  const items = getShopItems(shopId);
  return items.filter(item =>
    meetsLevelRequirement(item, playerLevel) &&
    isInStock(item)
  );
}

/**
 * Get items player can afford
 */
export function getAffordableItems(
  shopId: ShopId | string,
  meseta: number
): ShopItem[] {
  const items = getShopItems(shopId);
  return items.filter(item => canAfford(meseta, item));
}

/**
 * Restock a shop item
 */
export function restockItem(shopId: ShopId | string, itemId: string, quantity: number): boolean {
  const item = findShopItem(shopId, itemId);
  if (!item) return false;

  if (item.stock !== undefined) {
    item.stock += quantity;
  }
  return true;
}

/**
 * Reset all shop stock
 */
export function resetShopStock(shopId: ShopId | string): void {
  const inventory = getShopInventory(shopId);
  if (!inventory) return;

  // This would reset to original values from config
  // For now, just mark all items as unlimited
  for (const item of inventory.items) {
    if (item.stock !== undefined) {
      item.stock = 99; // Reset to default
    }
  }
}

/**
 * Clear all shop inventories (for testing)
 */
export function clearShopInventories(): void {
  shopInventories.clear();
}

/**
 * Initialize default shops
 */
export function initializeDefaultShops(): void {
  // Item Shop
  registerShopInventory({
    shopId: SHOP_IDS.ITEM_SHOP,
    items: [
      { id: 'monomate', name: 'Monomate', description: 'Restores 100 HP', price: 50, sellPrice: 12, rarity: 1, category: 'consumable' },
      { id: 'dimate', name: 'Dimate', description: 'Restores 300 HP', price: 200, sellPrice: 50, rarity: 2, category: 'consumable' },
      { id: 'trimate', name: 'Trimate', description: 'Restores 600 HP', price: 600, sellPrice: 150, rarity: 3, category: 'consumable' },
      { id: 'monofluid', name: 'Monofluid', description: 'Restores 50 PP', price: 100, sellPrice: 25, rarity: 1, category: 'consumable' },
      { id: 'difluid', name: 'Difluid', description: 'Restores 100 PP', price: 300, sellPrice: 75, rarity: 2, category: 'consumable' },
      { id: 'trifluid', name: 'Trifluid', description: 'Restores all PP', price: 800, sellPrice: 200, rarity: 3, category: 'consumable' },
      { id: 'telepipe', name: 'Telepipe', description: 'Return to city', price: 150, sellPrice: 37, rarity: 1, category: 'consumable' },
      { id: 'moon_atomizer', name: 'Moon Atomizer', description: 'Revive ally', price: 500, sellPrice: 125, rarity: 2, category: 'consumable' },
      { id: 'sol_atomizer', name: 'Sol Atomizer', description: 'Cure status effects', price: 300, sellPrice: 75, rarity: 2, category: 'consumable' },
    ],
  });

  // Weapon Shop
  registerShopInventory({
    shopId: SHOP_IDS.WEAPON_SHOP,
    items: [
      { id: 'saber', name: 'Saber', description: 'Basic sword', price: 500, sellPrice: 125, rarity: 1, category: 'weapon' },
      { id: 'brand', name: 'Brand', description: 'Stronger sword', price: 2000, sellPrice: 500, rarity: 2, category: 'weapon', requiredLevel: 10 },
      { id: 'buster', name: 'Buster', description: 'Heavy sword', price: 5000, sellPrice: 1250, rarity: 3, category: 'weapon', requiredLevel: 20 },
      { id: 'handgun', name: 'Handgun', description: 'Basic ranged weapon', price: 600, sellPrice: 150, rarity: 1, category: 'weapon' },
      { id: 'autogun', name: 'Autogun', description: 'Automatic ranged', price: 2500, sellPrice: 625, rarity: 2, category: 'weapon', requiredLevel: 10 },
      { id: 'lockgun', name: 'Lockgun', description: 'Homing ranged', price: 6000, sellPrice: 1500, rarity: 3, category: 'weapon', requiredLevel: 20 },
      { id: 'cane', name: 'Cane', description: 'Basic rod', price: 400, sellPrice: 100, rarity: 1, category: 'weapon' },
      { id: 'rod', name: 'Rod', description: 'Better rod', price: 1800, sellPrice: 450, rarity: 2, category: 'weapon', requiredLevel: 10 },
    ],
  });
}

export { SHOP_IDS };
