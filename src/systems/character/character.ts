/**
 * Character System
 * Core character CRUD operations and validation
 */

import type {
  Character,
  CharacterCreationParams,
  ValidationResult,
  CharacterSlots
} from './types';
import {
  MAX_SLOTS,
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
  VALID_CLASS_IDS
} from './types';
import {
  getCharacterSlots,
  saveCharacterToSlot,
  deleteCharacterFromSlot,
  getCharacterFromSlot,
  setSelectedCharacterId,
  getSelectedCharacter,
  isSlotAvailable,
  updateCharacter,
} from './storage';
import {
  createInventory,
  getInventory,
  addItem,
  equipItem,
  saveInventory,
} from '../inventory/inventory';
import {
  getStartingItems,
  STARTING_MESETA,
} from '../inventory/starting-items';

/**
 * Validate a character name
 */
export function validateCharacterName(name: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = name.trim();

  if (trimmed.length < MIN_NAME_LENGTH) {
    errors.push('Character name is required');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    errors.push(`Character name must be ${MAX_NAME_LENGTH} characters or less`);
  }

  // Check for invalid characters (allow letters, numbers, spaces, and some punctuation)
  if (!/^[\w\s\-'.]+$/i.test(trimmed) && trimmed.length > 0) {
    errors.push('Character name contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a class ID
 */
export function validateClassId(classId: string): ValidationResult {
  const errors: string[] = [];

  if (!classId) {
    errors.push('Class is required');
  } else if (!VALID_CLASS_IDS.includes(classId as any)) {
    errors.push(`Invalid class: ${classId}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a slot number
 */
export function validateSlot(slot: number): ValidationResult {
  const errors: string[] = [];

  if (typeof slot !== 'number' || isNaN(slot)) {
    errors.push('Slot must be a number');
  } else if (slot < 0 || slot >= MAX_SLOTS) {
    errors.push(`Slot must be between 0 and ${MAX_SLOTS - 1}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate character creation parameters
 */
export function validateCharacterCreation(params: CharacterCreationParams): ValidationResult {
  const allErrors: string[] = [];

  const nameResult = validateCharacterName(params.name);
  allErrors.push(...nameResult.errors);

  const classResult = validateClassId(params.classId);
  allErrors.push(...classResult.errors);

  const slotResult = validateSlot(params.slot);
  allErrors.push(...slotResult.errors);

  // Check if slot is available
  if (slotResult.valid && !isSlotAvailable(params.slot)) {
    allErrors.push('Slot is already occupied');
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Generate a unique character ID
 */
export function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate texture ID from customization options
 */
export function calculateTextureId(
  hairColorIndex: number = 0,
  skinToneIndex: number = 0,
  bodyColorIndex: number = 0
): string {
  // skinTone is: hairColorIndex * 3 + skinToneIndex (0-8)
  const actualSkinTone = hairColorIndex * 3 + skinToneIndex;
  return `${actualSkinTone}_${bodyColorIndex}`;
}

/**
 * Create a new character
 */
export function createCharacter(params: CharacterCreationParams): Character {
  const validation = validateCharacterCreation(params);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const textureId = calculateTextureId(
    params.hairColorIndex ?? 0,
    params.skinToneIndex ?? 0,
    params.bodyColorIndex ?? 0
  );

  const character: Character = {
    character_id: generateCharacterId(),
    character_name: params.name.trim(),
    level: 1,
    experience: 0,
    slot: params.slot,
    class_id: params.classId,
    variation_index: params.variationIndex ?? 0,
    texture_id: textureId,
    created_at: new Date().toISOString(),
    meseta: STARTING_MESETA,
  };

  return character;
}

/**
 * Create and save a character to storage
 */
export function createAndSaveCharacter(params: CharacterCreationParams): Character {
  const character = createCharacter(params);
  saveCharacterToSlot(character, params.slot);
  setSelectedCharacterId(character.character_id);

  // Initialize inventory with starting items
  initializeCharacterInventory(character);

  return character;
}

/**
 * Initialize a new character's inventory with starting equipment
 */
export function initializeCharacterInventory(character: Character): void {
  const startingItems = getStartingItems(character.class_id);
  let inventory = createInventory(character.character_id);

  // Add weapon to inventory and equip it
  addItem(inventory, startingItems.weapon);
  inventory = getInventory(character.character_id);
  equipItem(inventory, startingItems.weapon.id, character.level, character.class_id);

  // Add frame to inventory and equip it
  inventory = getInventory(character.character_id);
  addItem(inventory, startingItems.frame);
  inventory = getInventory(character.character_id);
  equipItem(inventory, startingItems.frame.id, character.level, character.class_id);

  // Add consumables
  inventory = getInventory(character.character_id);
  for (const { item, quantity } of startingItems.consumables) {
    addItem(inventory, item, quantity);
    inventory = getInventory(character.character_id);
  }

  saveInventory(inventory);
}

/**
 * Select a character by ID
 */
export function selectCharacter(characterId: string): Character | null {
  const slots = getCharacterSlots();
  const character = slots.find(c => c?.character_id === characterId);

  if (character) {
    setSelectedCharacterId(characterId);
    return character;
  }

  return null;
}

/**
 * Select a character by slot
 */
export function selectCharacterBySlot(slot: number): Character | null {
  const character = getCharacterFromSlot(slot);

  if (character) {
    setSelectedCharacterId(character.character_id);
    return character;
  }

  return null;
}

/**
 * Delete a character by slot
 * Also clears their inventory to prevent orphaned data
 */
export function deleteCharacter(slot: number): void {
  const validation = validateSlot(slot);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Get character ID before deletion to clear their inventory
  const character = getCharacterFromSlot(slot);
  if (character) {
    // Clear inventory for this character
    try {
      // Remove inventory from localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`inventory_${character.character_id}`);
      }
    } catch {
      // Ignore errors in cleanup
    }
  }

  deleteCharacterFromSlot(slot);
}

/**
 * Get the currently selected character
 */
export { getSelectedCharacter };

/**
 * Get all character slots
 */
export { getCharacterSlots };

/**
 * Check if a character name is already used
 */
export function isNameTaken(name: string, excludeSlot?: number): boolean {
  const trimmed = name.trim().toLowerCase();
  const slots = getCharacterSlots();

  return slots.some((c, index) =>
    c !== null &&
    c.character_name.toLowerCase() === trimmed &&
    index !== excludeSlot
  );
}

/**
 * Add meseta to a character
 */
export function addMeseta(characterId: string, amount: number): Character {
  const slots = getCharacterSlots();
  const character = slots.find(c => c?.character_id === characterId);

  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }

  const updated = {
    ...character,
    meseta: (character.meseta ?? 0) + amount,
  };

  updateCharacter(updated);
  return updated;
}

/**
 * Remove meseta from a character
 */
export function removeMeseta(characterId: string, amount: number): Character {
  const slots = getCharacterSlots();
  const character = slots.find(c => c?.character_id === characterId);

  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }

  const currentMeseta = character.meseta ?? 0;
  if (currentMeseta < amount) {
    throw new Error('Not enough meseta');
  }

  const updated = {
    ...character,
    meseta: currentMeseta - amount,
  };

  updateCharacter(updated);
  return updated;
}

/**
 * Get character info for display
 */
export function getCharacterDisplayInfo(character: Character): {
  name: string;
  level: number;
  classId: string;
  race: string;
  type: string;
} {
  const classId = character.class_id;

  // Determine race from class prefix
  let race: string;
  if (classId.includes('cast') || classId.includes('caseal')) {
    race = 'Cast';
  } else if (classId.includes('new')) {
    race = 'Newman';
  } else {
    race = 'Human';
  }

  // Determine type from class prefix
  let type: string;
  if (classId.startsWith('HU')) {
    type = 'Hunter';
  } else if (classId.startsWith('RA')) {
    type = 'Ranger';
  } else {
    type = 'Force';
  }

  return {
    name: character.character_name,
    level: character.level,
    classId: character.class_id,
    race,
    type,
  };
}
