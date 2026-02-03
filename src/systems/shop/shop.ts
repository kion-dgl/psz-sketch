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
  EquipmentShopItem,
} from './types';
import { SELL_MULTIPLIER, SHOP_IDS } from './types';

// Elements available for weapons
const WEAPON_ELEMENTS = ['Fire', 'Ice', 'Thunder', 'Light', 'Dark', 'None'];

// Seed for consistent randomization per session
let shopSeed = Date.now();

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
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Roll for armor slots (0 common, 1 rare, 2 very rare, 3 extremely rare)
 */
function rollArmorSlots(random: () => number): number {
  const roll = random();
  if (roll < 0.70) return 0;      // 70% chance: 0 slots
  if (roll < 0.90) return 1;      // 20% chance: 1 slot
  if (roll < 0.98) return 2;      // 8% chance: 2 slots
  return 3;                        // 2% chance: 3 slots
}

/**
 * Roll for weapon element
 */
function rollWeaponElement(random: () => number): { element: string; percent: number } {
  const roll = random();
  if (roll < 0.40) {
    return { element: 'None', percent: 0 };
  }
  const element = WEAPON_ELEMENTS[Math.floor(random() * (WEAPON_ELEMENTS.length - 1))];
  const percent = Math.floor(random() * 15) + 5; // 5-20%
  return { element, percent };
}

/**
 * Generate randomized weapon shop inventory
 */
function generateWeaponShopInventory(): EquipmentShopItem[] {
  const random = seededRandom(shopSeed);
  const items: EquipmentShopItem[] = [];

  // Base weapons with randomized elements
  const baseWeapons = [
    { id: 'saber', name: 'Saber', desc: 'Basic sword', price: 500, rarity: 1, attack: 30 },
    { id: 'brand', name: 'Brand', desc: 'Stronger sword', price: 2000, rarity: 2, attack: 55, level: 10 },
    { id: 'buster', name: 'Buster', desc: 'Heavy sword', price: 5000, rarity: 3, attack: 85, level: 20 },
    { id: 'dagger', name: 'Dagger', desc: 'Quick blade', price: 400, rarity: 1, attack: 22 },
    { id: 'handgun', name: 'Handgun', desc: 'Basic ranged', price: 600, rarity: 1, attack: 25 },
    { id: 'autogun', name: 'Autogun', desc: 'Automatic ranged', price: 2500, rarity: 2, attack: 50, level: 10 },
    { id: 'cane', name: 'Cane', desc: 'Basic rod', price: 400, rarity: 1, attack: 18 },
    { id: 'rod', name: 'Rod', desc: 'Better rod', price: 1800, rarity: 2, attack: 40, level: 10 },
  ];

  for (const base of baseWeapons) {
    const { element, percent } = rollWeaponElement(random);
    const elementSuffix = element !== 'None' ? ` [${element} ${percent}%]` : '';
    const priceBonus = element !== 'None' ? Math.floor(base.price * (percent / 100)) : 0;

    items.push({
      id: `${base.id}-${shopSeed}`,
      name: `${base.name}${elementSuffix}`,
      description: base.desc,
      price: base.price + priceBonus,
      sellPrice: Math.floor((base.price + priceBonus) * 0.25),
      rarity: base.rarity,
      category: 'weapon',
      requiredLevel: base.level,
      element: element,
      elementPercent: percent,
      attack: base.attack,
    });
  }

  return items;
}

/**
 * Generate randomized armor shop inventory
 */
function generateArmorShopInventory(): EquipmentShopItem[] {
  const random = seededRandom(shopSeed + 1000);
  const items: EquipmentShopItem[] = [];

  const baseArmors = [
    { id: 'frame', name: 'Frame', desc: 'Basic armor', price: 400, rarity: 1, def: 10, eva: 5 },
    { id: 'armor', name: 'Armor', desc: 'Standard armor', price: 1200, rarity: 2, def: 25, eva: 10, level: 5 },
    { id: 'gear', name: 'Gear', desc: 'Sturdy armor', price: 3000, rarity: 2, def: 45, eva: 15, level: 10 },
    { id: 'barrier', name: 'Barrier', desc: 'Energy shield', price: 600, rarity: 1, def: 5, eva: 15 },
    { id: 'shield', name: 'Shield', desc: 'Protective shield', price: 1500, rarity: 2, def: 15, eva: 20, level: 5 },
  ];

  for (const base of baseArmors) {
    const slots = rollArmorSlots(random);
    const slotSuffix = slots > 0 ? ` [${slots}S]` : '';
    const priceBonus = slots * 500; // Each slot adds 500 meseta

    items.push({
      id: `${base.id}-${shopSeed}`,
      name: `${base.name}${slotSuffix}`,
      description: base.desc,
      price: base.price + priceBonus,
      sellPrice: Math.floor((base.price + priceBonus) * 0.25),
      rarity: base.rarity,
      category: 'armor',
      requiredLevel: base.level,
      slots: slots,
      defense: base.def,
      evasion: base.eva,
    });
  }

  return items;
}

/**
 * Generate unit shop inventory (weak units only)
 */
function generateUnitShopInventory(): EquipmentShopItem[] {
  return [
    { id: 'knight-power', name: 'Knight/Power', description: 'ATK +5', price: 800, sellPrice: 200, rarity: 1, category: 'unit' },
    { id: 'knight-guard', name: 'Knight/Guard', description: 'DEF +5', price: 800, sellPrice: 200, rarity: 1, category: 'unit' },
    { id: 'knight-hp', name: 'Knight/HP', description: 'Max HP +20', price: 600, sellPrice: 150, rarity: 1, category: 'unit' },
    { id: 'knight-pp', name: 'Knight/PP', description: 'Max PP +5', price: 600, sellPrice: 150, rarity: 1, category: 'unit' },
    { id: 'knight-mind', name: 'Knight/Mind', description: 'TEC +5', price: 700, sellPrice: 175, rarity: 1, category: 'unit' },
    { id: 'resist-fire', name: 'Resist/Fire', description: 'Fire resist +5', price: 500, sellPrice: 125, rarity: 1, category: 'unit' },
    { id: 'resist-ice', name: 'Resist/Ice', description: 'Ice resist +5', price: 500, sellPrice: 125, rarity: 1, category: 'unit' },
    { id: 'resist-thunder', name: 'Resist/Thunder', description: 'Thunder resist +5', price: 500, sellPrice: 125, rarity: 1, category: 'unit' },
  ];
}

/**
 * Refresh weapon shop with new random items
 */
export function refreshWeaponShop(): void {
  shopSeed = Date.now();

  registerShopInventory({
    shopId: SHOP_IDS.ARMOR_SHOP,
    items: [
      ...generateWeaponShopInventory(),
      ...generateArmorShopInventory(),
      ...generateUnitShopInventory(),
    ],
  });
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

  // Weapon/Armor Shop (randomized inventory)
  refreshWeaponShop();
}

export { SHOP_IDS };
