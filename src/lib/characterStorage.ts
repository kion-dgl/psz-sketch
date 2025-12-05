/**
 * Character Storage Module
 * 
 * Uses IndexedDB (via localForage) to persist character data between sessions.
 */

import localforage from 'localforage';

export interface CharacterData {
  character_id: string;
  character_name: string;
  level: number;
  experience: number;
  slot: number;
  class_id: string;
  texture_id: string;
  created_at: string;
  last_played?: string;
  play_time?: number; // in seconds
}

// Configure localForage instance for characters
const characterStore = localforage.createInstance({
  name: 'psz-sketch',
  storeName: 'characters',
  description: 'Character save slots'
});

/**
 * Get all character slots (0-3)
 * Returns array with 4 elements, null for empty slots
 */
export async function getAllCharacters(): Promise<(CharacterData | null)[]> {
  try {
    const characters: (CharacterData | null)[] = [];
    
    for (let slot = 0; slot < 4; slot++) {
      const char = await characterStore.getItem<CharacterData>(`slot_${slot}`);
      characters.push(char);
    }
    
    return characters;
  } catch (error) {
    console.error('Error loading characters:', error);
    throw error;
  }
}

/**
 * Get character by slot number (0-3)
 */
export async function getCharacterBySlot(slot: number): Promise<CharacterData | null> {
  if (slot < 0 || slot > 3) {
    throw new Error('Invalid slot number. Must be 0-3.');
  }
  
  try {
    return await characterStore.getItem<CharacterData>(`slot_${slot}`);
  } catch (error) {
    console.error(`Error loading character from slot ${slot}:`, error);
    throw error;
  }
}

/**
 * Get character by ID
 */
export async function getCharacterById(characterId: string): Promise<CharacterData | null> {
  try {
    const characters = await getAllCharacters();
    return characters.find(c => c?.character_id === characterId) || null;
  } catch (error) {
    console.error(`Error finding character ${characterId}:`, error);
    throw error;
  }
}

/**
 * Save character to a specific slot
 */
export async function saveCharacter(character: CharacterData): Promise<void> {
  const { slot } = character;
  
  if (slot < 0 || slot > 3) {
    throw new Error('Invalid slot number. Must be 0-3.');
  }
  
  try {
    await characterStore.setItem(`slot_${slot}`, character);
  } catch (error) {
    console.error(`Error saving character to slot ${slot}:`, error);
    throw error;
  }
}

/**
 * Delete character from a specific slot
 */
export async function deleteCharacter(slot: number): Promise<void> {
  if (slot < 0 || slot > 3) {
    throw new Error('Invalid slot number. Must be 0-3.');
  }
  
  try {
    await characterStore.removeItem(`slot_${slot}`);
  } catch (error) {
    console.error(`Error deleting character from slot ${slot}:`, error);
    throw error;
  }
}

/**
 * Update character's last played time and play time
 */
export async function updateCharacterPlayTime(slot: number, additionalSeconds: number = 0): Promise<void> {
  try {
    const character = await getCharacterBySlot(slot);
    if (!character) {
      throw new Error(`No character found in slot ${slot}`);
    }
    
    character.last_played = new Date().toISOString();
    character.play_time = (character.play_time || 0) + additionalSeconds;
    
    await saveCharacter(character);
  } catch (error) {
    console.error(`Error updating play time for slot ${slot}:`, error);
    throw error;
  }
}

/**
 * Check if a slot is occupied
 */
export async function isSlotOccupied(slot: number): Promise<boolean> {
  try {
    const character = await getCharacterBySlot(slot);
    return character !== null;
  } catch (error) {
    console.error(`Error checking slot ${slot}:`, error);
    return false;
  }
}
