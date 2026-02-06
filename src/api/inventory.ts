/**
 * Inventory API
 * Item management for characters
 */
import { db } from '../db';
import type { GameItem, ConsumableItem } from '../systems/inventory/types';

export interface InventorySlot {
  item_id: string;
  item: GameItem;
  quantity: number;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

const MAX_INVENTORY_SLOTS = 40;

/**
 * Get character's inventory
 */
export function getInventory(characterId: string): InventorySlot[] {
  const rows = db.prepare(`
    SELECT item_id, item_data, quantity FROM inventory WHERE character_id = ?
  `).all(characterId) as { item_id: string; item_data: string; quantity: number }[];

  return rows.map(row => ({
    item_id: row.item_id,
    item: JSON.parse(row.item_data),
    quantity: row.quantity,
  }));
}

/**
 * Get inventory slot count
 */
export function getInventoryCount(characterId: string): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM inventory WHERE character_id = ?
  `).get(characterId) as { count: number };
  return result.count;
}

/**
 * Check if inventory is full
 */
export function isInventoryFull(characterId: string): boolean {
  return getInventoryCount(characterId) >= MAX_INVENTORY_SLOTS;
}

/**
 * Add item to inventory
 */
export function addItem(characterId: string, item: GameItem, quantity: number = 1): ApiResult {
  // Check for existing stack
  const existing = db.prepare(`
    SELECT item_data, quantity FROM inventory WHERE character_id = ? AND item_id = ?
  `).get(characterId, item.id) as { item_data: string; quantity: number } | undefined;

  if (existing) {
    const existingItem = JSON.parse(existing.item_data) as GameItem;
    if (existingItem.stackable) {
      const newQty = existing.quantity + quantity;
      if (newQty > (existingItem.maxStack || 99)) {
        return { success: false, message: `Exceeds max stack of ${existingItem.maxStack || 99}` };
      }
      db.prepare(`
        UPDATE inventory SET quantity = ? WHERE character_id = ? AND item_id = ?
      `).run(newQty, characterId, item.id);
      return { success: true, message: `Added ${quantity}x ${item.name}. Now have ${newQty}.` };
    }
    // Non-stackable item already exists
    return { success: false, message: `Already have ${item.name}.` };
  }

  // Check capacity for new slot
  if (isInventoryFull(characterId)) {
    return { success: false, message: 'Inventory is full.' };
  }

  db.prepare(`
    INSERT INTO inventory (character_id, item_id, item_data, quantity)
    VALUES (?, ?, ?, ?)
  `).run(characterId, item.id, JSON.stringify(item), quantity);

  return { success: true, message: `Added ${quantity}x ${item.name}.` };
}

/**
 * Remove item from inventory
 */
export function removeItem(characterId: string, itemId: string, quantity: number = 1): ApiResult<GameItem> {
  const existing = db.prepare(`
    SELECT item_data, quantity FROM inventory WHERE character_id = ? AND item_id = ?
  `).get(characterId, itemId) as { item_data: string; quantity: number } | undefined;

  if (!existing) {
    return { success: false, message: 'Item not found in inventory.' };
  }

  const item = JSON.parse(existing.item_data) as GameItem;

  if (existing.quantity < quantity) {
    return { success: false, message: `Only have ${existing.quantity}x ${item.name}.` };
  }

  if (existing.quantity === quantity) {
    db.prepare(`
      DELETE FROM inventory WHERE character_id = ? AND item_id = ?
    `).run(characterId, itemId);
  } else {
    db.prepare(`
      UPDATE inventory SET quantity = quantity - ? WHERE character_id = ? AND item_id = ?
    `).run(quantity, characterId, itemId);
  }

  return { success: true, message: `Removed ${quantity}x ${item.name}.`, data: item };
}

/**
 * Get a specific item from inventory
 */
export function getItem(characterId: string, itemId: string): InventorySlot | null {
  const row = db.prepare(`
    SELECT item_id, item_data, quantity FROM inventory WHERE character_id = ? AND item_id = ?
  `).get(characterId, itemId) as { item_id: string; item_data: string; quantity: number } | undefined;

  if (!row) return null;

  return {
    item_id: row.item_id,
    item: JSON.parse(row.item_data),
    quantity: row.quantity,
  };
}

/**
 * Use a consumable item
 */
export function useConsumable(characterId: string, itemId: string): ApiResult<{ effect: string; value: number }> {
  const slot = getItem(characterId, itemId);
  if (!slot) {
    return { success: false, message: 'Item not found in inventory.' };
  }

  if (slot.item.type !== 'consumable') {
    return { success: false, message: 'This item cannot be used.' };
  }

  const consumable = slot.item as ConsumableItem;

  // Remove one from inventory
  removeItem(characterId, itemId, 1);

  return {
    success: true,
    message: `Used ${consumable.name}.`,
    data: { effect: consumable.effect, value: consumable.effectValue },
  };
}
