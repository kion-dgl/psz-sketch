/**
 * Shop API
 * Buy and sell items
 */
import { db } from '../db';
import { getCharacter, updateMeseta } from './character';
import { addItem, removeItem, getItem, getInventory } from './inventory';
import { getLocation } from './location';
import {
  initializeDefaultShops,
  getShopItems,
  findShopItem,
  purchaseItem as shopPurchase,
  removeShopItem,
  refreshWeaponShop,
  getWeaponShopItems,
  SHOP_IDS,
} from '../systems/shop/shop';
import type { ShopItem, EquipmentShopItem } from '../systems/shop/types';
import {
  MONOMATE,
  DIMATE,
  TRIMATE,
  MONOFLUID,
  DIFLUID,
  TRIFLUID,
} from '../systems/inventory/starting-items';
import type { GameItem, ConsumableItem } from '../systems/inventory/types';

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// Initialize shops on module load
initializeDefaultShops();

// Map shop item IDs to actual item definitions
const CONSUMABLE_ITEMS: Record<string, ConsumableItem> = {
  monomate: MONOMATE,
  dimate: DIMATE,
  trimate: TRIMATE,
  monofluid: MONOFLUID,
  difluid: DIFLUID,
  trifluid: TRIFLUID,
  telepipe: {
    id: 'telepipe',
    name: 'Telepipe',
    description: 'Return to city',
    type: 'consumable',
    effect: 'telepipe',
    effectValue: 0,
    rarity: 1,
    sellPrice: 37,
    stackable: true,
    maxStack: 10,
  },
  moon_atomizer: {
    id: 'moon_atomizer',
    name: 'Moon Atomizer',
    description: 'Revive ally',
    type: 'consumable',
    effect: 'revive',
    effectValue: 100,
    rarity: 2,
    sellPrice: 125,
    stackable: true,
    maxStack: 10,
  },
  sol_atomizer: {
    id: 'sol_atomizer',
    name: 'Sol Atomizer',
    description: 'Cure status effects',
    type: 'consumable',
    effect: 'cure_status',
    effectValue: 0,
    rarity: 2,
    sellPrice: 75,
    stackable: true,
    maxStack: 10,
  },
};

/**
 * Get item shop inventory
 */
export function getItemShopInventory(): ShopItem[] {
  return getShopItems(SHOP_IDS.ITEM_SHOP);
}

/**
 * Get weapon shop inventory
 */
export function getWeaponShopInventory(): EquipmentShopItem[] {
  return getWeaponShopItems();
}

/**
 * Refresh weapon shop inventory
 */
export function refreshWeaponShopInventory(): void {
  refreshWeaponShop();
}

/**
 * Buy a consumable from the item shop
 */
export function buyItem(characterId: string, itemId: string, quantity: number = 1): ApiResult {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const location = getLocation(characterId);
  if (location !== 'shop') {
    return { success: false, message: 'Must be at shop to buy items.' };
  }

  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive.' };
  }

  // Find item in shop
  const shopItem = findShopItem(SHOP_IDS.ITEM_SHOP, itemId);
  if (!shopItem) {
    return { success: false, message: 'Item not found in shop.' };
  }

  const totalCost = shopItem.price * quantity;
  if (char.meseta < totalCost) {
    return { success: false, message: `Not enough meseta. Need ${totalCost}, have ${char.meseta}.` };
  }

  // Get the actual item definition
  const itemDef = CONSUMABLE_ITEMS[itemId];
  if (!itemDef) {
    return { success: false, message: 'Item definition not found.' };
  }

  // Check stack limit
  const existing = getItem(characterId, itemId);
  if (existing && itemDef.stackable) {
    const maxStack = itemDef.maxStack || 10;
    if (existing.quantity + quantity > maxStack) {
      return { success: false, message: `Cannot carry more than ${maxStack} ${itemDef.name}.` };
    }
  }

  // Add to inventory
  const addResult = addItem(characterId, itemDef, quantity);
  if (!addResult.success) {
    return addResult;
  }

  // Deduct meseta
  updateMeseta(characterId, -totalCost);

  return {
    success: true,
    message: `Bought ${quantity}x ${shopItem.name} for ${totalCost} meseta.`,
    data: { itemId, quantity, totalCost },
  };
}

/**
 * Buy equipment from the weapon shop
 */
export function buyEquipment(characterId: string, itemId: string): ApiResult {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const location = getLocation(characterId);
  if (location !== 'weapon-shop') {
    return { success: false, message: 'Must be at weapon shop to buy equipment.' };
  }

  // Find item in weapon shop
  const items = getWeaponShopItems();
  const shopItem = items.find(i => i.id === itemId) as EquipmentShopItem | undefined;
  if (!shopItem) {
    return { success: false, message: 'Equipment not found in shop.' };
  }

  if (char.meseta < shopItem.price) {
    return { success: false, message: `Not enough meseta. Need ${shopItem.price}, have ${char.meseta}.` };
  }

  // Convert shop item to game item
  let gameItem: GameItem;
  if (shopItem.category === 'weapon') {
    gameItem = {
      id: shopItem.id,
      name: shopItem.name,
      description: shopItem.description,
      type: 'weapon',
      rarity: shopItem.rarity,
      sellPrice: shopItem.sellPrice,
      stackable: false,
      maxStack: 1,
      attack: shopItem.attack || 30,
      accuracy: 50,
      weaponType: 'sword',
      element: shopItem.element?.toLowerCase() as any || null,
      elementPercent: shopItem.elementPercent || 0,
      grindLevel: 0,
      maxGrind: 10,
      requiredLevel: shopItem.requiredLevel || 1,
    };
  } else if (shopItem.category === 'armor') {
    gameItem = {
      id: shopItem.id,
      name: shopItem.name,
      description: shopItem.description,
      type: 'armor',
      rarity: shopItem.rarity,
      sellPrice: shopItem.sellPrice,
      stackable: false,
      maxStack: 1,
      defense: shopItem.defense || 10,
      evasion: shopItem.evasion || 5,
      unitSlots: shopItem.slots || 0,
      requiredLevel: shopItem.requiredLevel || 1,
    };
  } else if (shopItem.category === 'unit') {
    gameItem = {
      id: shopItem.id,
      name: shopItem.name,
      description: shopItem.description,
      type: 'unit',
      rarity: shopItem.rarity,
      sellPrice: shopItem.sellPrice,
      stackable: false,
      maxStack: 1,
      attackBonus: 0,
      defenseBonus: 5,
      accuracyBonus: 0,
      evasionBonus: 0,
      hpBonus: 0,
      tpBonus: 0,
      requiredLevel: shopItem.requiredLevel || 1,
    };
  } else {
    return { success: false, message: 'Unknown equipment type.' };
  }

  // Add to inventory
  const addResult = addItem(characterId, gameItem, 1);
  if (!addResult.success) {
    return addResult;
  }

  // Deduct meseta
  updateMeseta(characterId, -shopItem.price);

  // Remove from shop (one-time purchase)
  removeShopItem(SHOP_IDS.WEAPON_SHOP, itemId);

  return {
    success: true,
    message: `Bought ${shopItem.name} for ${shopItem.price} meseta.`,
    data: { itemId, price: shopItem.price },
  };
}

/**
 * Sell an item
 */
export function sellItem(characterId: string, itemId: string, quantity: number = 1): ApiResult {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const location = getLocation(characterId);
  if (location !== 'shop' && location !== 'weapon-shop') {
    return { success: false, message: 'Must be at a shop to sell items.' };
  }

  const invItem = getItem(characterId, itemId);
  if (!invItem) {
    return { success: false, message: 'Item not in inventory.' };
  }

  if (invItem.quantity < quantity) {
    return { success: false, message: `Only have ${invItem.quantity}x ${invItem.item.name}.` };
  }

  const sellPrice = (invItem.item.sellPrice || 10) * quantity;

  // Remove from inventory
  const removeResult = removeItem(characterId, itemId, quantity);
  if (!removeResult.success) {
    return removeResult;
  }

  // Add meseta
  updateMeseta(characterId, sellPrice);

  return {
    success: true,
    message: `Sold ${quantity}x ${invItem.item.name} for ${sellPrice} meseta.`,
    data: { itemId, quantity, sellPrice },
  };
}
