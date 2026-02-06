/**
 * Storage API
 * Shared storage between all characters
 */
import { db } from '../db';
import { getItem, removeItem, addItem, isInventoryFull } from './inventory';
import { updateMeseta, getCharacter } from './character';
import type { GameItem } from '../systems/inventory/types';

export interface StorageSlot {
  item_id: string;
  item: GameItem;
  quantity: number;
}

export interface StorageState {
  items: StorageSlot[];
  meseta: number;
  maxSlots: number;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

const MAX_STORAGE_SLOTS = 200;

/**
 * Get shared storage state
 */
export function getStorage(): StorageState {
  const rows = db.prepare(`
    SELECT item_id, item_data, quantity FROM storage_items
  `).all() as { item_id: string; item_data: string; quantity: number }[];

  const mesetaRow = db.prepare(`
    SELECT amount FROM storage_meseta WHERE id = 1
  `).get() as { amount: number } | undefined;

  return {
    items: rows.map(row => ({
      item_id: row.item_id,
      item: JSON.parse(row.item_data),
      quantity: row.quantity,
    })),
    meseta: mesetaRow?.amount ?? 0,
    maxSlots: MAX_STORAGE_SLOTS,
  };
}

/**
 * Get storage slot count
 */
export function getStorageCount(): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM storage_items
  `).get() as { count: number };
  return result.count;
}

/**
 * Deposit meseta to storage
 */
export function depositMeseta(characterId: string, amount: number): ApiResult {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be positive.' };
  }

  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  if (char.meseta < amount) {
    return { success: false, message: `Only have ${char.meseta} meseta.` };
  }

  // Deduct from character
  updateMeseta(characterId, -amount);

  // Add to storage
  db.prepare(`
    UPDATE storage_meseta SET amount = amount + ? WHERE id = 1
  `).run(amount);

  const newBalance = getStorage().meseta;
  return { success: true, message: `Deposited ${amount} meseta. Storage now has ${newBalance}.` };
}

/**
 * Withdraw meseta from storage
 */
export function withdrawMeseta(characterId: string, amount: number): ApiResult {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be positive.' };
  }

  const storage = getStorage();
  if (storage.meseta < amount) {
    return { success: false, message: `Only ${storage.meseta} meseta in storage.` };
  }

  // Deduct from storage
  db.prepare(`
    UPDATE storage_meseta SET amount = amount - ? WHERE id = 1
  `).run(amount);

  // Add to character
  updateMeseta(characterId, amount);

  const char = getCharacter(characterId);
  return { success: true, message: `Withdrew ${amount} meseta. You now have ${char?.meseta ?? 0}.` };
}

/**
 * Deposit item to storage
 */
export function depositItem(characterId: string, itemId: string, quantity: number = 1): ApiResult {
  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive.' };
  }

  const invSlot = getItem(characterId, itemId);
  if (!invSlot) {
    return { success: false, message: 'Item not found in inventory.' };
  }

  if (invSlot.quantity < quantity) {
    return { success: false, message: `Only have ${invSlot.quantity}x ${invSlot.item.name}.` };
  }

  const item = invSlot.item;

  // Check for existing stack in storage
  const existing = db.prepare(`
    SELECT item_data, quantity FROM storage_items WHERE item_id = ?
  `).get(itemId) as { item_data: string; quantity: number } | undefined;

  if (existing) {
    const existingItem = JSON.parse(existing.item_data) as GameItem;
    if (existingItem.stackable) {
      const newQty = existing.quantity + quantity;
      if (newQty > (existingItem.maxStack || 99)) {
        return { success: false, message: `Exceeds max stack of ${existingItem.maxStack || 99} in storage.` };
      }
      db.prepare(`
        UPDATE storage_items SET quantity = ? WHERE item_id = ?
      `).run(newQty, itemId);
    } else {
      return { success: false, message: `${item.name} already in storage and cannot stack.` };
    }
  } else {
    // Check capacity
    if (getStorageCount() >= MAX_STORAGE_SLOTS) {
      return { success: false, message: 'Storage is full.' };
    }

    db.prepare(`
      INSERT INTO storage_items (item_id, item_data, quantity)
      VALUES (?, ?, ?)
    `).run(itemId, JSON.stringify(item), quantity);
  }

  // Remove from inventory
  removeItem(characterId, itemId, quantity);

  return { success: true, message: `Deposited ${quantity}x ${item.name} to storage.` };
}

/**
 * Withdraw item from storage
 */
export function withdrawItem(characterId: string, itemId: string, quantity: number = 1): ApiResult {
  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive.' };
  }

  const storageSlot = db.prepare(`
    SELECT item_data, quantity FROM storage_items WHERE item_id = ?
  `).get(itemId) as { item_data: string; quantity: number } | undefined;

  if (!storageSlot) {
    return { success: false, message: 'Item not found in storage.' };
  }

  if (storageSlot.quantity < quantity) {
    return { success: false, message: `Only ${storageSlot.quantity}x in storage.` };
  }

  const item = JSON.parse(storageSlot.item_data) as GameItem;

  // Check if can add to inventory
  if (isInventoryFull(characterId)) {
    // Check if can stack with existing
    const existing = getItem(characterId, itemId);
    if (!existing) {
      return { success: false, message: 'Inventory is full.' };
    }
  }

  // Add to inventory
  const addResult = addItem(characterId, item, quantity);
  if (!addResult.success) {
    return addResult;
  }

  // Remove from storage
  if (storageSlot.quantity === quantity) {
    db.prepare('DELETE FROM storage_items WHERE item_id = ?').run(itemId);
  } else {
    db.prepare(`
      UPDATE storage_items SET quantity = quantity - ? WHERE item_id = ?
    `).run(quantity, itemId);
  }

  return { success: true, message: `Withdrew ${quantity}x ${item.name} from storage.` };
}

/**
 * Clear all storage (for testing)
 */
export function clearStorage(): void {
  db.prepare('DELETE FROM storage_items').run();
  db.prepare('UPDATE storage_meseta SET amount = 0 WHERE id = 1').run();
}
