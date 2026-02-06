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
import { getWeapons, getArmors, getUnits, type WeaponData, type ArmorData, type UnitData } from '../../data/content-loader';

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
 * Remove an item from a shop's inventory (for one-time purchases like equipment)
 */
export function removeShopItem(shopId: ShopId | string, itemId: string): boolean {
  const inventory = getShopInventory(shopId);
  if (!inventory) return false;

  const index = inventory.items.findIndex(item => item.id === itemId);
  if (index === -1) return false;

  inventory.items.splice(index, 1);
  return true;
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
 * Generate randomized weapon shop inventory from content files
 */
function generateWeaponShopInventory(): EquipmentShopItem[] {
  const random = seededRandom(shopSeed);
  const items: EquipmentShopItem[] = [];

  // Get weapons from content
  const allWeapons = getWeapons();

  // Select basic weapons for shop (rarity 1-2, low level requirement)
  const shopWeaponIds = [
    'saber', 'blade', 'daggers', 'handgun', 'cane', 'rod', 'wand',
    'clear-saber', 'chrome-cutlass', 'ein-blade', 'red-saber'
  ];

  for (const weaponId of shopWeaponIds) {
    const weapon = allWeapons.get(weaponId);
    if (!weapon) continue;

    // Roll for random element
    const { element, percent } = rollWeaponElement(random);
    const elementSuffix = element !== 'None' ? ` [${element} ${percent}%]` : '';

    // Calculate price based on attack and rarity
    const basePrice = (weapon.attackBase ?? 30) * 15 + (weapon.rarity - 1) * 500;
    const priceBonus = element !== 'None' ? Math.floor(basePrice * (percent / 100)) : 0;

    items.push({
      id: `${weaponId}-${shopSeed}`,
      name: `${weapon.name}${elementSuffix}`,
      description: `${weapon.weaponType} - ATK ${weapon.attackBase ?? 0}`,
      price: basePrice + priceBonus,
      sellPrice: Math.floor((basePrice + priceBonus) * 0.25),
      rarity: weapon.rarity,
      category: 'weapon',
      requiredLevel: weapon.level,
      element: element,
      elementPercent: percent,
      attack: weapon.attackBase ?? 30,
      accuracy: weapon.accuracyBase,
      weaponType: weapon.weaponType,
    });
  }

  return items;
}

/**
 * Generate randomized armor shop inventory from content files
 */
function generateArmorShopInventory(): EquipmentShopItem[] {
  const random = seededRandom(shopSeed + 1000);
  const items: EquipmentShopItem[] = [];

  // Get armors from content
  const allArmors = getArmors();

  // Select basic armors for shop (rarity 1-2, low level requirement)
  const shopArmorIds = [
    'common-armor', 'battle-armor', 'brigandine-armor', 'asgard-frame'
  ];

  for (const armorId of shopArmorIds) {
    const armor = allArmors.get(armorId);
    if (!armor) continue;

    // Roll for unit slots (max from content, but random distribution)
    const maxSlots = armor.maxSlots ?? 0;
    const slots = maxSlots > 0 ? Math.min(rollArmorSlots(random), maxSlots) : 0;
    const slotSuffix = slots > 0 ? ` [${slots}S]` : '';

    // Calculate price based on defense and rarity
    const basePrice = (armor.defenseBase ?? 10) * 12 + (armor.rarity - 1) * 400;
    const priceBonus = slots * 500;

    items.push({
      id: `${armorId}-${shopSeed}`,
      name: `${armor.name}${slotSuffix}`,
      description: `${armor.type} - DEF ${armor.defenseBase ?? 0} EVA ${armor.evasionBase ?? 0}`,
      price: basePrice + priceBonus,
      sellPrice: Math.floor((basePrice + priceBonus) * 0.25),
      rarity: armor.rarity,
      category: 'armor',
      requiredLevel: armor.level,
      slots: slots,
      defense: armor.defenseBase,
      evasion: armor.evasionBase,
    });
  }

  // Add some fallback items if content loading failed
  if (items.length === 0) {
    items.push({
      id: `frame-${shopSeed}`,
      name: 'Frame',
      description: 'Basic armor',
      price: 400,
      sellPrice: 100,
      rarity: 1,
      category: 'armor',
      slots: 0,
      defense: 10,
      evasion: 5,
    });
  }

  return items;
}

/**
 * Generate unit shop inventory from content files
 */
function generateUnitShopInventory(): EquipmentShopItem[] {
  const items: EquipmentShopItem[] = [];

  // Get units from content
  const allUnits = getUnits();

  // Select basic units for shop (rarity 1-2)
  const shopUnitIds = [
    'knight-power', 'knight-guard', 'knight-hp', 'knight-pp', 'knight-mind',
    'resist-fire', 'resist-ice', 'resist-thunder'
  ];

  for (const unitId of shopUnitIds) {
    const unit = allUnits.get(unitId);
    if (!unit) continue;

    // Calculate price based on effect value and rarity
    const basePrice = (unit.effectValue ?? 5) * 100 + (unit.rarity - 1) * 300;

    items.push({
      id: unitId,
      name: unit.name,
      description: unit.effect,
      price: basePrice,
      sellPrice: Math.floor(basePrice * 0.25),
      rarity: unit.rarity,
      category: 'unit',
    });
  }

  // Fallback if content loading failed
  if (items.length === 0) {
    items.push(
      { id: 'knight-power', name: 'Knight/Power', description: 'ATK +5', price: 800, sellPrice: 200, rarity: 1, category: 'unit' },
      { id: 'knight-guard', name: 'Knight/Guard', description: 'DEF +5', price: 800, sellPrice: 200, rarity: 1, category: 'unit' },
      { id: 'knight-hp', name: 'Knight/HP', description: 'Max HP +20', price: 600, sellPrice: 150, rarity: 1, category: 'unit' },
    );
  }

  return items;
}

/**
 * Refresh weapon shop with new random items
 */
export function refreshWeaponShop(): void {
  shopSeed = Date.now();

  registerShopInventory({
    shopId: SHOP_IDS.WEAPON_SHOP,
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
