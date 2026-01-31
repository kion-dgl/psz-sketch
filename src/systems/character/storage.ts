/**
 * Character Storage
 * localStorage abstraction for character data persistence
 */

import type { Character, CharacterSlots } from './types';
import { MAX_SLOTS } from './types';

const STORAGE_KEY = 'characters';
const SELECTED_CHARACTER_KEY = 'selectedCharacterId';

/**
 * Get all character slots from storage
 */
export function getCharacterSlots(): CharacterSlots {
  if (typeof localStorage === 'undefined') {
    return Array(MAX_SLOTS).fill(null);
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return Array(MAX_SLOTS).fill(null);
  }

  try {
    const parsed = JSON.parse(stored);
    // Ensure we always have exactly MAX_SLOTS
    const slots: CharacterSlots = Array(MAX_SLOTS).fill(null);
    for (let i = 0; i < Math.min(parsed.length, MAX_SLOTS); i++) {
      slots[i] = parsed[i];
    }
    return slots;
  } catch {
    return Array(MAX_SLOTS).fill(null);
  }
}

/**
 * Save a character to a specific slot
 */
export function saveCharacterToSlot(character: Character, slot: number): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }

  if (slot < 0 || slot >= MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}. Must be between 0 and ${MAX_SLOTS - 1}`);
  }

  const slots = getCharacterSlots();
  slots[slot] = { ...character, slot };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

/**
 * Delete a character from a specific slot
 */
export function deleteCharacterFromSlot(slot: number): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }

  if (slot < 0 || slot >= MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}. Must be between 0 and ${MAX_SLOTS - 1}`);
  }

  const slots = getCharacterSlots();
  slots[slot] = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

/**
 * Get a character from a specific slot
 */
export function getCharacterFromSlot(slot: number): Character | null {
  if (slot < 0 || slot >= MAX_SLOTS) {
    return null;
  }
  const slots = getCharacterSlots();
  return slots[slot];
}

/**
 * Get the currently selected character ID
 */
export function getSelectedCharacterId(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(SELECTED_CHARACTER_KEY);
}

/**
 * Set the currently selected character ID
 */
export function setSelectedCharacterId(characterId: string): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }
  localStorage.setItem(SELECTED_CHARACTER_KEY, characterId);
}

/**
 * Clear the selected character
 */
export function clearSelectedCharacterId(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(SELECTED_CHARACTER_KEY);
}

/**
 * Get the selected character data
 */
export function getSelectedCharacter(): Character | null {
  const id = getSelectedCharacterId();
  if (!id) return null;

  const slots = getCharacterSlots();
  return slots.find(c => c?.character_id === id) ?? null;
}

/**
 * Update an existing character
 */
export function updateCharacter(character: Character): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }

  const slots = getCharacterSlots();
  const index = slots.findIndex(c => c?.character_id === character.character_id);

  if (index === -1) {
    throw new Error(`Character not found: ${character.character_id}`);
  }

  slots[index] = character;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

/**
 * Find an empty slot index, or -1 if all slots are full
 */
export function findEmptySlot(): number {
  const slots = getCharacterSlots();
  return slots.findIndex(s => s === null);
}

/**
 * Check if a slot is available
 */
export function isSlotAvailable(slot: number): boolean {
  if (slot < 0 || slot >= MAX_SLOTS) {
    return false;
  }
  const slots = getCharacterSlots();
  return slots[slot] === null;
}

/**
 * Count the number of characters
 */
export function getCharacterCount(): number {
  const slots = getCharacterSlots();
  return slots.filter(s => s !== null).length;
}
