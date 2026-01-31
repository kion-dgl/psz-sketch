/**
 * Inventory System
 * Inventory management and equipment logic
 */

import type {
  InventoryState,
  InventorySlot,
  InventoryResult,
  EquipResult,
  EquipmentSlots,
  EquipmentSlotType,
  GameItem,
  WeaponItem,
  ArmorItem,
  SharedStorageState,
  MesetaTransferResult,
} from './types';
import { DEFAULT_MAX_SLOTS, MAX_INVENTORY_SLOTS, SHARED_STORAGE_SLOTS } from './types';
import { getCharacterSlots, updateCharacter } from '../character/storage';

const STORAGE_KEY_PREFIX = 'inventory_';

/**
 * Create an empty inventory state
 */
export function createInventory(characterId: string, maxSlots: number = DEFAULT_MAX_SLOTS): InventoryState {
  return {
    characterId,
    items: [],
    equipment: {
      weapon: null,
      frame: null,
      barrier: null,
      unit1: null,
      unit2: null,
      unit3: null,
      unit4: null,
      mag: null,
    },
    maxSlots: Math.min(maxSlots, MAX_INVENTORY_SLOTS),
  };
}

/**
 * Get inventory from storage
 */
export function getInventory(characterId: string): InventoryState {
  if (typeof localStorage === 'undefined') {
    return createInventory(characterId);
  }

  const stored = localStorage.getItem(STORAGE_KEY_PREFIX + characterId);
  if (!stored) {
    return createInventory(characterId);
  }

  try {
    return JSON.parse(stored);
  } catch {
    return createInventory(characterId);
  }
}

/**
 * Save inventory to storage
 */
export function saveInventory(inventory: InventoryState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY_PREFIX + inventory.characterId, JSON.stringify(inventory));
}

/**
 * Count used inventory slots
 */
export function getUsedSlots(inventory: InventoryState): number {
  return inventory.items.length;
}

/**
 * Check if inventory has space
 */
export function hasSpace(inventory: InventoryState, slotsNeeded: number = 1): boolean {
  return getUsedSlots(inventory) + slotsNeeded <= inventory.maxSlots;
}

/**
 * Find an item in inventory by ID
 */
export function findItem(inventory: InventoryState, itemId: string): InventorySlot | null {
  return inventory.items.find(slot => slot.item.id === itemId) ?? null;
}

/**
 * Find index of item in inventory
 */
export function findItemIndex(inventory: InventoryState, itemId: string): number {
  return inventory.items.findIndex(slot => slot.item.id === itemId);
}

/**
 * Add item to inventory
 */
export function addItem(inventory: InventoryState, item: GameItem, quantity: number = 1): InventoryResult {
  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive' };
  }

  // Check if item is stackable and already exists
  if (item.stackable) {
    const existingIndex = findItemIndex(inventory, item.id);
    if (existingIndex !== -1) {
      const existingSlot = inventory.items[existingIndex];
      const newQuantity = existingSlot.quantity + quantity;

      if (newQuantity > item.maxStack) {
        return { success: false, message: `Cannot stack more than ${item.maxStack}` };
      }

      const newItems = [...inventory.items];
      newItems[existingIndex] = { ...existingSlot, quantity: newQuantity };

      const newInventory = { ...inventory, items: newItems };
      saveInventory(newInventory);
      return { success: true, message: 'Item added', inventory: newInventory };
    }
  }

  // Add as new slot
  if (!hasSpace(inventory)) {
    return { success: false, message: 'Inventory is full' };
  }

  const newSlot: InventorySlot = { item, quantity };
  const newInventory = {
    ...inventory,
    items: [...inventory.items, newSlot],
  };

  saveInventory(newInventory);
  return { success: true, message: 'Item added', inventory: newInventory };
}

/**
 * Remove item from inventory
 */
export function removeItem(inventory: InventoryState, itemId: string, quantity: number = 1): InventoryResult {
  const index = findItemIndex(inventory, itemId);
  if (index === -1) {
    return { success: false, message: 'Item not found' };
  }

  const slot = inventory.items[index];
  if (slot.quantity < quantity) {
    return { success: false, message: 'Not enough items' };
  }

  let newItems: InventorySlot[];
  if (slot.quantity === quantity) {
    // Remove entire slot
    newItems = [...inventory.items];
    newItems.splice(index, 1);
  } else {
    // Reduce quantity
    newItems = [...inventory.items];
    newItems[index] = { ...slot, quantity: slot.quantity - quantity };
  }

  const newInventory = { ...inventory, items: newItems };
  saveInventory(newInventory);
  return { success: true, message: 'Item removed', inventory: newInventory };
}

/**
 * Get the correct equipment slot for an item
 */
export function getEquipmentSlotForItem(item: GameItem): EquipmentSlotType | null {
  if (item.type === 'weapon') {
    return 'weapon';
  }

  if (item.type === 'armor') {
    const armorItem = item as ArmorItem;
    if (armorItem.armorSlot === 'frame') return 'frame';
    if (armorItem.armorSlot === 'barrier') return 'barrier';
    if (armorItem.armorSlot === 'unit') return null; // Units handled separately
  }

  return null;
}

/**
 * Find an available unit slot
 */
export function findAvailableUnitSlot(equipment: EquipmentSlots): EquipmentSlotType | null {
  if (!equipment.unit1) return 'unit1';
  if (!equipment.unit2) return 'unit2';
  if (!equipment.unit3) return 'unit3';
  if (!equipment.unit4) return 'unit4';
  return null;
}

/**
 * Count how many units are currently equipped
 */
export function getEquippedUnitCount(equipment: EquipmentSlots): number {
  let count = 0;
  if (equipment.unit1) count++;
  if (equipment.unit2) count++;
  if (equipment.unit3) count++;
  if (equipment.unit4) count++;
  return count;
}

/**
 * Get the number of unit slots available on the equipped frame
 * Returns 0 if no frame is equipped
 */
export function getAvailableUnitSlots(equipment: EquipmentSlots): number {
  if (!equipment.frame) return 0;
  const frame = equipment.frame.item as ArmorItem;
  return frame.unitSlots ?? 0;
}

/**
 * Get all equipped units as an array
 */
export function getEquippedUnits(equipment: EquipmentSlots): InventorySlot[] {
  const units: InventorySlot[] = [];
  if (equipment.unit1) units.push(equipment.unit1);
  if (equipment.unit2) units.push(equipment.unit2);
  if (equipment.unit3) units.push(equipment.unit3);
  if (equipment.unit4) units.push(equipment.unit4);
  return units;
}

/**
 * Check if character can equip item (level and class restrictions)
 */
export function canEquip(item: GameItem, characterLevel: number, characterClass: string): { allowed: boolean; reason?: string } {
  if (item.type === 'weapon') {
    const weapon = item as WeaponItem;
    if (characterLevel < weapon.requiredLevel) {
      return { allowed: false, reason: `Requires level ${weapon.requiredLevel}` };
    }
    if (weapon.classRestrictions && !weapon.classRestrictions.includes(characterClass)) {
      return { allowed: false, reason: `Cannot be equipped by ${characterClass}` };
    }
  }

  if (item.type === 'armor') {
    const armor = item as ArmorItem;
    if (characterLevel < armor.requiredLevel) {
      return { allowed: false, reason: `Requires level ${armor.requiredLevel}` };
    }
  }

  return { allowed: true };
}

/**
 * Equip an item from inventory
 */
export function equipItem(
  inventory: InventoryState,
  itemId: string,
  characterLevel: number,
  characterClass: string,
  targetSlot?: EquipmentSlotType
): EquipResult {
  const itemIndex = findItemIndex(inventory, itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Item not found in inventory' };
  }

  const slot = inventory.items[itemIndex];
  const item = slot.item;

  // Check if item is equippable
  if (item.type !== 'weapon' && item.type !== 'armor') {
    return { success: false, message: 'Item cannot be equipped' };
  }

  // Check restrictions
  const canEquipResult = canEquip(item, characterLevel, characterClass);
  if (!canEquipResult.allowed) {
    return { success: false, message: canEquipResult.reason! };
  }

  let newItems = [...inventory.items];
  let newEquipment = { ...inventory.equipment };
  let previousItem: InventorySlot | null = null;
  const unequippedItems: InventorySlot[] = [];

  // Handle unit equipping
  if (item.type === 'armor' && (item as ArmorItem).armorSlot === 'unit') {
    // Check if frame is equipped
    if (!newEquipment.frame) {
      return { success: false, message: 'Must equip a frame before equipping units' };
    }

    // Check frame's unit slot capacity
    const frameSlots = (newEquipment.frame.item as ArmorItem).unitSlots ?? 0;
    const equippedUnits = getEquippedUnitCount(newEquipment);

    if (equippedUnits >= frameSlots) {
      return { success: false, message: `Frame only has ${frameSlots} unit slot(s)` };
    }

    // Find available unit slot (within frame's capacity)
    const availableSlot = findAvailableUnitSlot(newEquipment);
    if (!availableSlot) {
      return { success: false, message: 'No unit slots available' };
    }

    // Remove item from inventory and equip it
    newItems.splice(itemIndex, 1);
    newEquipment[availableSlot] = { ...slot, equipped: true };
  }
  // Handle frame equipping
  else if (item.type === 'armor' && (item as ArmorItem).armorSlot === 'frame') {
    // Count items we need to unequip (old frame + all units)
    const currentUnits = getEquippedUnits(newEquipment);
    let itemsToUnequip = currentUnits.length;
    if (newEquipment.frame) itemsToUnequip++;

    // We're removing one item (the new frame) from inventory, so net change is itemsToUnequip - 1
    const availableSpace = inventory.maxSlots - newItems.length;
    if (itemsToUnequip - 1 > availableSpace) {
      return { success: false, message: 'Inventory full - cannot unequip current frame and units' };
    }

    // Unequip all units first
    for (const unit of currentUnits) {
      newItems.push({ ...unit, equipped: false });
      unequippedItems.push(unit);
    }
    newEquipment.unit1 = null;
    newEquipment.unit2 = null;
    newEquipment.unit3 = null;
    newEquipment.unit4 = null;

    // Unequip current frame
    if (newEquipment.frame) {
      previousItem = newEquipment.frame;
      newItems.push({ ...newEquipment.frame, equipped: false });
    }

    // Remove new frame from inventory and equip it
    newItems.splice(itemIndex, 1);
    newEquipment.frame = { ...slot, equipped: true };
  }
  // Handle weapon equipping
  else if (item.type === 'weapon') {
    // Unequip current weapon if present
    if (newEquipment.weapon) {
      if (!hasSpace({ ...inventory, items: newItems })) {
        return { success: false, message: 'Inventory full - cannot unequip current weapon' };
      }
      previousItem = newEquipment.weapon;
      newItems.push({ ...newEquipment.weapon, equipped: false });
    }

    // Remove new weapon from inventory and equip it
    newItems.splice(itemIndex, 1);
    newEquipment.weapon = { ...slot, equipped: true };
  }
  // Handle barrier equipping
  else if (item.type === 'armor' && (item as ArmorItem).armorSlot === 'barrier') {
    // Unequip current barrier if present
    if (newEquipment.barrier) {
      if (!hasSpace({ ...inventory, items: newItems })) {
        return { success: false, message: 'Inventory full - cannot unequip current barrier' };
      }
      previousItem = newEquipment.barrier;
      newItems.push({ ...newEquipment.barrier, equipped: false });
    }

    // Remove new barrier from inventory and equip it
    newItems.splice(itemIndex, 1);
    newEquipment.barrier = { ...slot, equipped: true };
  }
  else {
    return { success: false, message: 'No valid equipment slot' };
  }

  const newInventory = { ...inventory, items: newItems, equipment: newEquipment };
  saveInventory(newInventory);

  return {
    success: true,
    message: `Equipped ${item.name}`,
    previousItem,
    unequippedItems: unequippedItems.length > 0 ? unequippedItems : undefined,
  };
}

/**
 * Unequip an item
 */
export function unequipItem(inventory: InventoryState, slot: EquipmentSlotType): EquipResult {
  const equipped = inventory.equipment[slot];
  if (!equipped) {
    return { success: false, message: 'Nothing equipped in that slot' };
  }

  if (!hasSpace(inventory)) {
    return { success: false, message: 'Inventory is full' };
  }

  const newEquipment = { ...inventory.equipment, [slot]: null };
  const newItems = [...inventory.items, { ...equipped, equipped: false }];

  const newInventory = { ...inventory, items: newItems, equipment: newEquipment };
  saveInventory(newInventory);

  return {
    success: true,
    message: `Unequipped ${equipped.item.name}`,
    previousItem: equipped,
  };
}

/**
 * Get all equipped items
 */
export function getEquippedItems(inventory: InventoryState): Partial<EquipmentSlots> {
  const equipped: Partial<EquipmentSlots> = {};

  for (const [key, value] of Object.entries(inventory.equipment)) {
    if (value !== null) {
      equipped[key as EquipmentSlotType] = value;
    }
  }

  return equipped;
}

/**
 * Get total stats from equipment
 */
export function getEquipmentStats(inventory: InventoryState): {
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
} {
  let attack = 0;
  let defense = 0;
  let accuracy = 0;
  let evasion = 0;

  const { equipment } = inventory;

  if (equipment.weapon) {
    const weapon = equipment.weapon.item as WeaponItem;
    attack += weapon.attack;
    accuracy += weapon.accuracy;
  }

  const armorSlots: EquipmentSlotType[] = ['frame', 'barrier', 'unit1', 'unit2', 'unit3', 'unit4'];
  for (const slotName of armorSlots) {
    const slot = equipment[slotName];
    if (slot && slot.item.type === 'armor') {
      const armor = slot.item as ArmorItem;
      defense += armor.defense;
      evasion += armor.evasion;
    }
  }

  return { attack, defense, accuracy, evasion };
}

/**
 * Sort inventory by type, then rarity
 */
export function sortInventory(inventory: InventoryState): InventoryState {
  const typeOrder: Record<string, number> = {
    weapon: 0,
    armor: 1,
    consumable: 2,
    material: 3,
  };

  const sortedItems = [...inventory.items].sort((a, b) => {
    // Sort by type first
    const typeA = typeOrder[a.item.type] ?? 99;
    const typeB = typeOrder[b.item.type] ?? 99;
    if (typeA !== typeB) return typeA - typeB;

    // Then by rarity (higher first)
    if (a.item.rarity !== b.item.rarity) return b.item.rarity - a.item.rarity;

    // Then by name
    return a.item.name.localeCompare(b.item.name);
  });

  const newInventory = { ...inventory, items: sortedItems };
  saveInventory(newInventory);
  return newInventory;
}

/**
 * Clear inventory (for testing)
 */
export function clearInventory(characterId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + characterId);
}

// ============================================
// SHARED STORAGE (accessed from city counter)
// ============================================

const SHARED_STORAGE_KEY = 'shared_storage';

/**
 * Get shared storage state
 */
export function getSharedStorage(): SharedStorageState {
  if (typeof localStorage === 'undefined') {
    return { items: [], maxSlots: SHARED_STORAGE_SLOTS, meseta: 0 };
  }

  const stored = localStorage.getItem(SHARED_STORAGE_KEY);
  if (!stored) {
    return { items: [], maxSlots: SHARED_STORAGE_SLOTS, meseta: 0 };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      items: parsed.items ?? [],
      maxSlots: SHARED_STORAGE_SLOTS,
      meseta: parsed.meseta ?? 0,
    };
  } catch {
    return { items: [], maxSlots: SHARED_STORAGE_SLOTS, meseta: 0 };
  }
}

/**
 * Save shared storage state
 */
function saveSharedStorage(storage: SharedStorageState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(storage));
}

/**
 * Add item to shared storage
 */
export function addToSharedStorage(item: GameItem, quantity: number = 1): InventoryResult {
  const storage = getSharedStorage();

  // Check for existing stack
  if (item.stackable) {
    const existing = storage.items.find(slot => slot.item.id === item.id);
    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > item.maxStack) {
        return { success: false, message: `Exceeds max stack of ${item.maxStack}` };
      }
      existing.quantity = newQuantity;
      saveSharedStorage(storage);
      return { success: true, message: 'Item added to storage' };
    }
  }

  // Check capacity
  if (storage.items.length >= SHARED_STORAGE_SLOTS) {
    return { success: false, message: 'Shared storage is full' };
  }

  // Add new slot
  storage.items.push({ item, quantity, equipped: false });
  saveSharedStorage(storage);
  return { success: true, message: 'Item added to storage' };
}

/**
 * Remove item from shared storage
 */
export function removeFromSharedStorage(itemId: string, quantity: number = 1): InventoryResult {
  const storage = getSharedStorage();
  const index = storage.items.findIndex(slot => slot.item.id === itemId);

  if (index === -1) {
    return { success: false, message: 'Item not found in storage' };
  }

  const slot = storage.items[index];
  if (slot.quantity < quantity) {
    return { success: false, message: `Only ${slot.quantity} in storage` };
  }

  slot.quantity -= quantity;
  if (slot.quantity <= 0) {
    storage.items.splice(index, 1);
  }

  saveSharedStorage(storage);
  return { success: true, message: 'Item removed from storage' };
}

/**
 * Transfer item from character inventory to shared storage
 */
export function depositToStorage(characterId: string, itemId: string, quantity: number = 1): InventoryResult {
  const inventory = getInventory(characterId);
  const slot = inventory.items.find(s => s.item.id === itemId);

  if (!slot) {
    return { success: false, message: 'Item not in inventory' };
  }

  if (slot.quantity < quantity) {
    return { success: false, message: `Only ${slot.quantity} in inventory` };
  }

  // Add to storage first
  const addResult = addToSharedStorage(slot.item, quantity);
  if (!addResult.success) {
    return addResult;
  }

  // Remove from inventory
  removeItem(inventory, itemId, quantity);
  return { success: true, message: `Deposited ${quantity}x ${slot.item.name} to storage` };
}

/**
 * Transfer item from shared storage to character inventory
 */
export function withdrawFromStorage(characterId: string, itemId: string, quantity: number = 1): InventoryResult {
  const storage = getSharedStorage();
  const slot = storage.items.find(s => s.item.id === itemId);

  if (!slot) {
    return { success: false, message: 'Item not in storage' };
  }

  if (slot.quantity < quantity) {
    return { success: false, message: `Only ${slot.quantity} in storage` };
  }

  const inventory = getInventory(characterId);

  // Add to inventory first
  const addResult = addItem(inventory, slot.item, quantity);
  if (!addResult.success) {
    return addResult;
  }

  // Remove from storage
  removeFromSharedStorage(itemId, quantity);
  return { success: true, message: `Withdrew ${quantity}x ${slot.item.name} from storage` };
}

/**
 * Get shared storage item count
 */
export function getSharedStorageCount(): number {
  return getSharedStorage().items.length;
}

/**
 * Clear shared storage (for testing)
 */
export function clearSharedStorage(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SHARED_STORAGE_KEY);
}

/**
 * Get shared storage meseta balance
 */
export function getSharedStorageMeseta(): number {
  return getSharedStorage().meseta;
}

/**
 * Deposit meseta from character to shared storage
 */
export function depositMesetaToStorage(characterId: string, amount: number): MesetaTransferResult {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be positive' };
  }

  const slots = getCharacterSlots();
  const character = slots.find((c: any) => c?.character_id === characterId);

  if (!character) {
    return { success: false, message: 'Character not found' };
  }

  const currentMeseta = character.meseta ?? 0;
  if (currentMeseta < amount) {
    return { success: false, message: `Not enough meseta. You have ${currentMeseta}` };
  }

  // Update character meseta
  const updatedCharacter = { ...character, meseta: currentMeseta - amount };
  updateCharacter(updatedCharacter);

  // Update shared storage meseta
  const storage = getSharedStorage();
  storage.meseta = (storage.meseta ?? 0) + amount;
  saveSharedStorage(storage);

  return {
    success: true,
    message: `Deposited ${amount} meseta to storage`,
    newBalance: storage.meseta,
  };
}

/**
 * Withdraw meseta from shared storage to character
 */
export function withdrawMesetaFromStorage(characterId: string, amount: number): MesetaTransferResult {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be positive' };
  }

  const storage = getSharedStorage();
  const storageMeseta = storage.meseta ?? 0;

  if (storageMeseta < amount) {
    return { success: false, message: `Not enough meseta in storage. Balance: ${storageMeseta}` };
  }

  const slots = getCharacterSlots();
  const character = slots.find((c: any) => c?.character_id === characterId);

  if (!character) {
    return { success: false, message: 'Character not found' };
  }

  // Update shared storage meseta
  storage.meseta = storageMeseta - amount;
  saveSharedStorage(storage);

  // Update character meseta
  const updatedCharacter = { ...character, meseta: (character.meseta ?? 0) + amount };
  updateCharacter(updatedCharacter);

  return {
    success: true,
    message: `Withdrew ${amount} meseta from storage`,
    newBalance: storage.meseta,
  };
}
