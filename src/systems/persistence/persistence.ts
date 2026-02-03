/**
 * Persistence System
 * Uses localForage (IndexedDB) for persistent game data storage
 */

import localforage from 'localforage';
import type { Character } from '../character/types';
import type { GameItem } from '../inventory/types';

// Configure localForage
localforage.config({
  name: 'psz-sketch',
  storeName: 'game_data',
  description: 'Phantasy Star Zero Sketch game data',
});

// Types for persisted data
export interface PersistedCharacterData {
  character: Character;
  inventory: Array<{ item: GameItem; quantity: number }>;
  equipment: {
    weapon: GameItem | null;
    frame: GameItem | null;
  };
  completedMissions: string[];
  completedFields: string[];
}

export interface PersistedGameData {
  version: number;
  characters: (PersistedCharacterData | null)[];
  sharedStorage: {
    items: Array<{ item: GameItem; quantity: number }>;
    meseta: number;
  };
  lastActiveSlot: number | null;
}

const CURRENT_VERSION = 1;
const STORAGE_KEY = 'game_save';

/**
 * Create empty game data
 */
function createEmptyGameData(): PersistedGameData {
  return {
    version: CURRENT_VERSION,
    characters: [null, null, null, null],
    sharedStorage: {
      items: [],
      meseta: 0,
    },
    lastActiveSlot: null,
  };
}

/**
 * Load game data from IndexedDB
 */
export async function loadGameData(): Promise<PersistedGameData> {
  try {
    const data = await localforage.getItem<PersistedGameData>(STORAGE_KEY);
    if (data && data.version === CURRENT_VERSION) {
      return data;
    }
    // No data or outdated version - return fresh data
    return createEmptyGameData();
  } catch (error) {
    console.error('Failed to load game data:', error);
    return createEmptyGameData();
  }
}

/**
 * Save game data to IndexedDB
 */
export async function saveGameData(data: PersistedGameData): Promise<boolean> {
  try {
    await localforage.setItem(STORAGE_KEY, data);
    return true;
  } catch (error) {
    console.error('Failed to save game data:', error);
    return false;
  }
}

/**
 * Save a single character slot
 */
export async function saveCharacterSlot(
  slot: number,
  characterData: PersistedCharacterData | null
): Promise<boolean> {
  const data = await loadGameData();
  if (slot < 0 || slot >= 4) return false;

  data.characters[slot] = characterData;
  return saveGameData(data);
}

/**
 * Load a single character slot
 */
export async function loadCharacterSlot(slot: number): Promise<PersistedCharacterData | null> {
  const data = await loadGameData();
  if (slot < 0 || slot >= 4) return null;
  return data.characters[slot];
}

/**
 * Save shared storage
 */
export async function saveSharedStorage(
  items: Array<{ item: GameItem; quantity: number }>,
  meseta: number
): Promise<boolean> {
  const data = await loadGameData();
  data.sharedStorage = { items, meseta };
  return saveGameData(data);
}

/**
 * Load shared storage
 */
export async function loadSharedStorage(): Promise<{ items: Array<{ item: GameItem; quantity: number }>; meseta: number }> {
  const data = await loadGameData();
  return data.sharedStorage;
}

/**
 * Set last active slot
 */
export async function setLastActiveSlot(slot: number | null): Promise<boolean> {
  const data = await loadGameData();
  data.lastActiveSlot = slot;
  return saveGameData(data);
}

/**
 * Get last active slot
 */
export async function getLastActiveSlot(): Promise<number | null> {
  const data = await loadGameData();
  return data.lastActiveSlot;
}

/**
 * Reset all game data
 */
export async function resetAllGameData(): Promise<boolean> {
  try {
    await localforage.removeItem(STORAGE_KEY);
    // Also clear legacy localStorage data
    localStorage.removeItem('characters');
    localStorage.removeItem('sharedStorage');
    localStorage.removeItem('sharedStorageMeseta');
    return true;
  } catch (error) {
    console.error('Failed to reset game data:', error);
    return false;
  }
}

/**
 * Check if any save data exists
 */
export async function hasSaveData(): Promise<boolean> {
  try {
    const data = await localforage.getItem<PersistedGameData>(STORAGE_KEY);
    if (!data) return false;
    return data.characters.some(c => c !== null);
  } catch {
    return false;
  }
}
