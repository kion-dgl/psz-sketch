/**
 * Equipment API
 * Equip/unequip items for characters
 */
import { db } from '../db';
import { getItem, removeItem, addItem } from './inventory';
import type { WeaponItem, ArmorItem, UnitItem, GameItem } from '../systems/inventory/types';

export type EquipmentSlot = 'weapon' | 'frame' | 'unit1' | 'unit2' | 'unit3' | 'unit4';

export interface EquipmentState {
  weapon: WeaponItem | null;
  frame: ArmorItem | null;
  unit1: UnitItem | null;
  unit2: UnitItem | null;
  unit3: UnitItem | null;
  unit4: UnitItem | null;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Get character's equipped items
 */
export function getEquipment(characterId: string): EquipmentState {
  const rows = db.prepare(`
    SELECT slot, item_data FROM equipment WHERE character_id = ?
  `).all(characterId) as { slot: string; item_data: string }[];

  const equipment: EquipmentState = {
    weapon: null,
    frame: null,
    unit1: null,
    unit2: null,
    unit3: null,
    unit4: null,
  };

  for (const row of rows) {
    const item = JSON.parse(row.item_data);
    equipment[row.slot as EquipmentSlot] = item;
  }

  return equipment;
}

/**
 * Get equipped item in a specific slot
 */
export function getEquippedItem(characterId: string, slot: EquipmentSlot): GameItem | null {
  const row = db.prepare(`
    SELECT item_data FROM equipment WHERE character_id = ? AND slot = ?
  `).get(characterId, slot) as { item_data: string } | undefined;

  if (!row) return null;
  return JSON.parse(row.item_data);
}

/**
 * Equip a weapon from inventory
 */
export function equipWeapon(characterId: string, itemId: string): ApiResult<WeaponItem> {
  const invSlot = getItem(characterId, itemId);
  if (!invSlot) {
    return { success: false, message: 'Item not found in inventory.' };
  }

  if (invSlot.item.type !== 'weapon') {
    return { success: false, message: 'This is not a weapon.' };
  }

  const weapon = invSlot.item as WeaponItem;

  // If something is already equipped, put it back in inventory
  const currentWeapon = getEquippedItem(characterId, 'weapon');
  if (currentWeapon) {
    addItem(characterId, currentWeapon, 1);
  }

  // Remove from inventory
  removeItem(characterId, itemId, 1);

  // Equip
  db.prepare(`
    INSERT OR REPLACE INTO equipment (character_id, slot, item_data)
    VALUES (?, 'weapon', ?)
  `).run(characterId, JSON.stringify(weapon));

  return { success: true, message: `Equipped ${weapon.name}.`, data: weapon };
}

/**
 * Equip a frame from inventory
 */
export function equipFrame(characterId: string, itemId: string): ApiResult<ArmorItem> {
  const invSlot = getItem(characterId, itemId);
  if (!invSlot) {
    return { success: false, message: 'Item not found in inventory.' };
  }

  if (invSlot.item.type !== 'armor') {
    return { success: false, message: 'This is not armor.' };
  }

  const frame = invSlot.item as ArmorItem;

  // If something is already equipped, put it back in inventory
  const currentFrame = getEquippedItem(characterId, 'frame');
  if (currentFrame) {
    addItem(characterId, currentFrame, 1);
  }

  // Remove from inventory
  removeItem(characterId, itemId, 1);

  // Equip
  db.prepare(`
    INSERT OR REPLACE INTO equipment (character_id, slot, item_data)
    VALUES (?, 'frame', ?)
  `).run(characterId, JSON.stringify(frame));

  return { success: true, message: `Equipped ${frame.name}.`, data: frame };
}

/**
 * Equip a unit from inventory
 */
export function equipUnit(characterId: string, itemId: string, slotNum?: number): ApiResult<{ unit: UnitItem; slot: number }> {
  const invSlot = getItem(characterId, itemId);
  if (!invSlot) {
    return { success: false, message: 'Item not found in inventory.' };
  }

  if (invSlot.item.type !== 'unit') {
    return { success: false, message: 'This is not a unit.' };
  }

  const unit = invSlot.item as UnitItem;
  const equipment = getEquipment(characterId);

  // Check frame unit slots
  const frame = equipment.frame;
  const maxUnits = frame?.unitSlots ?? 0;
  if (maxUnits === 0) {
    return { success: false, message: 'Your frame has no unit slots.' };
  }

  // Find target slot
  let targetSlot: EquipmentSlot;
  if (slotNum !== undefined) {
    if (slotNum < 1 || slotNum > 4) {
      return { success: false, message: 'Invalid unit slot. Choose 1-4.' };
    }
    if (slotNum > maxUnits) {
      return { success: false, message: `Your frame only has ${maxUnits} unit slot(s).` };
    }
    targetSlot = `unit${slotNum}` as EquipmentSlot;
  } else {
    // Find first empty slot
    const slots: EquipmentSlot[] = ['unit1', 'unit2', 'unit3', 'unit4'].slice(0, maxUnits) as EquipmentSlot[];
    const emptySlot = slots.find(s => !equipment[s]);
    if (!emptySlot) {
      return { success: false, message: 'All unit slots are full.' };
    }
    targetSlot = emptySlot;
  }

  // If something is already in target slot, put it back in inventory
  const currentUnit = equipment[targetSlot];
  if (currentUnit) {
    addItem(characterId, currentUnit, 1);
  }

  // Remove from inventory
  removeItem(characterId, itemId, 1);

  // Equip
  db.prepare(`
    INSERT OR REPLACE INTO equipment (character_id, slot, item_data)
    VALUES (?, ?, ?)
  `).run(characterId, targetSlot, JSON.stringify(unit));

  const slotNumber = parseInt(targetSlot.replace('unit', ''));
  return { success: true, message: `Equipped ${unit.name} in slot ${slotNumber}.`, data: { unit, slot: slotNumber } };
}

/**
 * Unequip weapon
 */
export function unequipWeapon(characterId: string): ApiResult {
  const current = getEquippedItem(characterId, 'weapon');
  if (!current) {
    return { success: false, message: 'No weapon equipped.' };
  }

  // Add back to inventory
  const addResult = addItem(characterId, current, 1);
  if (!addResult.success) {
    return { success: false, message: `Cannot unequip: ${addResult.message}` };
  }

  db.prepare('DELETE FROM equipment WHERE character_id = ? AND slot = ?')
    .run(characterId, 'weapon');

  return { success: true, message: `Unequipped ${current.name}.` };
}

/**
 * Unequip frame
 */
export function unequipFrame(characterId: string): ApiResult {
  const current = getEquippedItem(characterId, 'frame');
  if (!current) {
    return { success: false, message: 'No frame equipped.' };
  }

  // Add back to inventory
  const addResult = addItem(characterId, current, 1);
  if (!addResult.success) {
    return { success: false, message: `Cannot unequip: ${addResult.message}` };
  }

  db.prepare('DELETE FROM equipment WHERE character_id = ? AND slot = ?')
    .run(characterId, 'frame');

  return { success: true, message: `Unequipped ${current.name}.` };
}

/**
 * Unequip unit
 */
export function unequipUnit(characterId: string, slotNum: number): ApiResult {
  if (slotNum < 1 || slotNum > 4) {
    return { success: false, message: 'Invalid unit slot. Choose 1-4.' };
  }

  const slot = `unit${slotNum}` as EquipmentSlot;
  const current = getEquippedItem(characterId, slot);
  if (!current) {
    return { success: false, message: `No unit in slot ${slotNum}.` };
  }

  // Add back to inventory
  const addResult = addItem(characterId, current, 1);
  if (!addResult.success) {
    return { success: false, message: `Cannot unequip: ${addResult.message}` };
  }

  db.prepare('DELETE FROM equipment WHERE character_id = ? AND slot = ?')
    .run(characterId, slot);

  return { success: true, message: `Unequipped ${current.name}.` };
}
