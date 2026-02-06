/**
 * API Client
 * Client-side wrapper for making API calls to the server
 */

import type { Character, CharacterSlots } from '../systems/character/types';

interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Get all characters (4 slots)
 */
export async function getCharacters(): Promise<CharacterSlots> {
  const response = await fetch('/api/characters');
  if (!response.ok) {
    throw new Error('Failed to get characters');
  }
  return response.json();
}

/**
 * Get a character by ID
 */
export async function getCharacter(id: string): Promise<Character | null> {
  const response = await fetch(`/api/characters/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to get character');
  }
  return response.json();
}

/**
 * Create a new character
 */
export async function createCharacter(
  slot: number,
  classId: string,
  name: string
): Promise<ApiResult<Character>> {
  const response = await fetch('/api/characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot, classId, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, message: data.error || 'Failed to create character' };
  }

  return { success: true, message: 'Character created', data };
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string): Promise<ApiResult> {
  const response = await fetch(`/api/characters/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, message: data.error || 'Failed to delete character' };
  }

  return { success: true, message: 'Character deleted' };
}

/**
 * Get inventory for a character
 */
export async function getInventory(characterId: string): Promise<any[]> {
  const response = await fetch(`/api/characters/${characterId}/inventory`);
  if (!response.ok) {
    throw new Error('Failed to get inventory');
  }
  return response.json();
}

/**
 * Get equipment for a character
 */
export async function getEquipment(characterId: string): Promise<any> {
  const response = await fetch(`/api/characters/${characterId}/equipment`);
  if (!response.ok) {
    throw new Error('Failed to get equipment');
  }
  return response.json();
}

/**
 * Get storage (shared between all characters)
 */
export async function getStorage(): Promise<{ items: any[]; meseta: number }> {
  const response = await fetch('/api/storage');
  if (!response.ok) {
    throw new Error('Failed to get storage');
  }
  return response.json();
}

/**
 * Execute a game command
 */
export async function executeCommand(
  characterId: string,
  command: string
): Promise<ApiResult> {
  const response = await fetch('/api/game/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, command }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, message: data.error || 'Command failed' };
  }

  return data;
}

/**
 * Get current game state for a character
 */
export async function getGameState(characterId: string): Promise<any> {
  const response = await fetch(`/api/game/state?characterId=${characterId}`);
  if (!response.ok) {
    throw new Error('Failed to get game state');
  }
  return response.json();
}
