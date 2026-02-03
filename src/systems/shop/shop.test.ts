/**
 * Shop System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerShopInventory,
  getShopInventory,
  getShopItems,
  getShopItemsByCategory,
  findShopItem,
  canAfford,
  isInStock,
  calculateTotalCost,
  calculateSellValue,
  purchaseItem,
  sellItem,
  formatPrice,
  meetsLevelRequirement,
  getAvailableItems,
  getAffordableItems,
  restockItem,
  clearShopInventories,
  initializeDefaultShops,
  SHOP_IDS,
} from './shop';
import type { ShopInventory, ShopItem } from './types';

function createTestShopInventory(): ShopInventory {
  return {
    shopId: 'test-shop',
    items: [
      { id: 'item1', name: 'Monomate', description: 'Heal 100 HP', price: 50, sellPrice: 12, rarity: 1, category: 'consumable' },
      { id: 'item2', name: 'Dimate', description: 'Heal 300 HP', price: 200, sellPrice: 50, rarity: 2, category: 'consumable' },
      { id: 'item3', name: 'Saber', description: 'Basic sword', price: 500, sellPrice: 125, rarity: 1, category: 'weapon' },
      { id: 'item4', name: 'Brand', description: 'Better sword', price: 2000, sellPrice: 500, rarity: 2, category: 'weapon', requiredLevel: 10 },
      { id: 'item5', name: 'Limited', description: 'Limited stock', price: 1000, sellPrice: 250, rarity: 3, category: 'material', stock: 5 },
    ],
  };
}

const testShopInventory = createTestShopInventory();

describe('Shop System - Inventory Management', () => {
  beforeEach(() => {
    clearShopInventories();
  });

  it('registers and retrieves shop inventory', () => {
    registerShopInventory(testShopInventory);
    const inventory = getShopInventory('test-shop');
    expect(inventory).not.toBeNull();
    expect(inventory?.shopId).toBe('test-shop');
  });

  it('returns null for unknown shop', () => {
    const inventory = getShopInventory('nonexistent');
    expect(inventory).toBeNull();
  });

  it('gets all shop items', () => {
    registerShopInventory(testShopInventory);
    const items = getShopItems('test-shop');
    expect(items).toHaveLength(5);
  });

  it('gets items by category', () => {
    registerShopInventory(testShopInventory);
    const consumables = getShopItemsByCategory('test-shop', 'consumable');
    expect(consumables).toHaveLength(2);
    expect(consumables.every(i => i.category === 'consumable')).toBe(true);
  });

  it('finds specific item', () => {
    registerShopInventory(testShopInventory);
    const item = findShopItem('test-shop', 'item3');
    expect(item?.name).toBe('Saber');
  });

  it('returns null for unknown item', () => {
    registerShopInventory(testShopInventory);
    const item = findShopItem('test-shop', 'nonexistent');
    expect(item).toBeNull();
  });
});

describe('Shop System - Affordability', () => {
  const item: ShopItem = { id: 'test', name: 'Test', description: '', price: 100, sellPrice: 25, rarity: 1, category: 'consumable' };

  it('checks if player can afford item', () => {
    expect(canAfford(200, item, 1)).toBe(true);
    expect(canAfford(100, item, 1)).toBe(true);
    expect(canAfford(99, item, 1)).toBe(false);
  });

  it('checks affordability for multiple items', () => {
    expect(canAfford(300, item, 3)).toBe(true);
    expect(canAfford(299, item, 3)).toBe(false);
  });
});

describe('Shop System - Stock Management', () => {
  beforeEach(() => {
    clearShopInventories();
    registerShopInventory(testShopInventory);
  });

  it('returns true for unlimited stock', () => {
    const item = findShopItem('test-shop', 'item1')!;
    expect(isInStock(item, 100)).toBe(true);
  });

  it('checks limited stock', () => {
    const item = findShopItem('test-shop', 'item5')!;
    expect(isInStock(item, 5)).toBe(true);
    expect(isInStock(item, 6)).toBe(false);
  });

  it('restocks items', () => {
    // Buy all stock first
    purchaseItem('test-shop', 'item5', 5, 10000);
    const item = findShopItem('test-shop', 'item5')!;
    expect(isInStock(item, 1)).toBe(false);

    // Restock
    restockItem('test-shop', 'item5', 3);
    expect(isInStock(item, 3)).toBe(true);
  });
});

describe('Shop System - Price Calculations', () => {
  const item: ShopItem = { id: 'test', name: 'Test', description: '', price: 100, sellPrice: 25, rarity: 1, category: 'consumable' };

  it('calculates total cost', () => {
    expect(calculateTotalCost(item, 1)).toBe(100);
    expect(calculateTotalCost(item, 5)).toBe(500);
  });

  it('calculates sell value', () => {
    expect(calculateSellValue(item, 1)).toBe(25);
    expect(calculateSellValue(item, 4)).toBe(100);
  });

  it('formats price with commas', () => {
    expect(formatPrice(1000)).toBe('1,000');
    expect(formatPrice(1234567)).toBe('1,234,567');
  });
});

describe('Shop System - Purchasing', () => {
  beforeEach(() => {
    clearShopInventories();
    // Create fresh inventory for each test
    registerShopInventory(createTestShopInventory());
  });

  it('successfully purchases item', () => {
    const result = purchaseItem('test-shop', 'item1', 2, 1000);
    expect(result.success).toBe(true);
    expect(result.quantity).toBe(2);
    expect(result.totalCost).toBe(100);
    expect(result.remainingMeseta).toBe(900);
  });

  it('fails when not enough meseta', () => {
    const result = purchaseItem('test-shop', 'item3', 1, 100);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough meseta');
  });

  it('fails for invalid quantity', () => {
    const result = purchaseItem('test-shop', 'item1', 0, 1000);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Quantity');
  });

  it('fails for unknown item', () => {
    const result = purchaseItem('test-shop', 'nonexistent', 1, 1000);
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('decrements limited stock', () => {
    // First verify initial stock
    const itemBefore = findShopItem('test-shop', 'item5')!;
    expect(itemBefore.stock).toBe(5);

    // item5 has stock of 5
    const result = purchaseItem('test-shop', 'item5', 2, 10000);
    expect(result.success).toBe(true);

    const itemAfter = findShopItem('test-shop', 'item5')!;
    expect(itemAfter.stock).toBe(3);
  });

  it('fails when out of stock', () => {
    // Verify initial stock and buy all of it
    const itemBefore = findShopItem('test-shop', 'item5')!;
    expect(itemBefore.stock).toBe(5);

    const buyAll = purchaseItem('test-shop', 'item5', 5, 10000);
    expect(buyAll.success).toBe(true);

    // Now try to buy more
    const result = purchaseItem('test-shop', 'item5', 1, 10000);
    expect(result.success).toBe(false);
    expect(result.message).toContain('out of stock');
  });
});

describe('Shop System - Selling', () => {
  const item: ShopItem = { id: 'test', name: 'Test Item', description: '', price: 100, sellPrice: 25, rarity: 1, category: 'consumable' };

  it('successfully sells item', () => {
    const result = sellItem(item, 3, 1000);
    expect(result.success).toBe(true);
    expect(result.quantity).toBe(3);
    expect(result.totalValue).toBe(75);
    expect(result.newMeseta).toBe(1075);
  });

  it('fails for invalid quantity', () => {
    const result = sellItem(item, 0, 1000);
    expect(result.success).toBe(false);
  });
});

describe('Shop System - Level Requirements', () => {
  beforeEach(() => {
    clearShopInventories();
    registerShopInventory(testShopInventory);
  });

  it('checks level requirement', () => {
    const noReq = findShopItem('test-shop', 'item3')!; // Saber, no requirement
    const withReq = findShopItem('test-shop', 'item4')!; // Brand, requires level 10

    expect(meetsLevelRequirement(noReq, 1)).toBe(true);
    expect(meetsLevelRequirement(withReq, 5)).toBe(false);
    expect(meetsLevelRequirement(withReq, 10)).toBe(true);
    expect(meetsLevelRequirement(withReq, 20)).toBe(true);
  });

  it('gets available items for level', () => {
    const items = getAvailableItems('test-shop', 5, 10000);
    // Should exclude item4 (requires level 10)
    expect(items.find(i => i.id === 'item4')).toBeUndefined();
    expect(items.find(i => i.id === 'item3')).toBeDefined();
  });
});

describe('Shop System - Filtered Lists', () => {
  beforeEach(() => {
    clearShopInventories();
    registerShopInventory(testShopInventory);
  });

  it('gets affordable items', () => {
    const items = getAffordableItems('test-shop', 150);
    // Should include item1 (50) and not others
    expect(items.find(i => i.id === 'item1')).toBeDefined();
    expect(items.find(i => i.id === 'item2')).toBeUndefined(); // 200
  });
});

describe('Shop System - Default Shops', () => {
  beforeEach(() => {
    clearShopInventories();
  });

  it('initializes default shops', () => {
    initializeDefaultShops();

    const itemShop = getShopInventory(SHOP_IDS.ITEM_SHOP);
    const armorShop = getShopInventory(SHOP_IDS.ARMOR_SHOP);

    expect(itemShop).not.toBeNull();
    expect(armorShop).not.toBeNull();
    expect(itemShop!.items.length).toBeGreaterThan(0);
    expect(armorShop!.items.length).toBeGreaterThan(0);
  });

  it('item shop has consumables', () => {
    initializeDefaultShops();
    const items = getShopItemsByCategory(SHOP_IDS.ITEM_SHOP, 'consumable');
    expect(items.length).toBeGreaterThan(0);
    expect(items.find(i => i.id === 'monomate')).toBeDefined();
  });

  it('armor shop has weapons with randomized IDs', () => {
    initializeDefaultShops();
    const items = getShopItemsByCategory(SHOP_IDS.ARMOR_SHOP, 'weapon');
    expect(items.length).toBeGreaterThan(0);
    // Weapons now have randomized IDs like 'saber-{seed}'
    expect(items.find(i => i.id.startsWith('saber-'))).toBeDefined();
  });
});

describe('Shop System - Shop IDs', () => {
  it('exports shop ID constants', () => {
    expect(SHOP_IDS.ITEM_SHOP).toBe('item-shop');
    expect(SHOP_IDS.WEAPON_SHOP).toBe('weapon-shop');
    expect(SHOP_IDS.ARMOR_SHOP).toBe('armor-shop');
    expect(SHOP_IDS.TECH_SHOP).toBe('tech-shop');
  });
});
