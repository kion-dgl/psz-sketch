/**
 * Character API
 * CRUD operations for player characters
 */
import { db } from '../db';
import { getStartingItems } from '../systems/inventory/starting-items';
import { v4 as uuid } from 'uuid';
import { calculateLevelFromExp, getExpToNextLevel, getTotalExpForLevel } from '../data/content-loader';

// Types
export interface Character {
  id: string;
  slot: number;
  name: string;
  class_id: string;
  level: number;
  experience: number;
  meseta: number;
  variation_index: number;
  texture_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// Constants
const STARTING_MESETA = 500;
const VALID_CLASS_IDS = [
  'HUmar', 'HUmarl', 'HUnewm', 'HUnewearl', 'HUcast', 'HUcaseal',
  'RAmar', 'RAmarl', 'RAcast', 'RAcaseal',
  'FOmar', 'FOmarl', 'FOnewm', 'FOnewearl',
];

/**
 * Create a new character
 */
export function createCharacter(slot: number, classId: string, name: string): ApiResult<Character> {
  // Validate slot
  if (slot < 0 || slot > 3) {
    return { success: false, message: 'Invalid slot. Choose 0-3.' };
  }

  // Validate class
  const normalizedClassId = VALID_CLASS_IDS.find(
    c => c.toLowerCase() === classId.toLowerCase()
  );
  if (!normalizedClassId) {
    return { success: false, message: `Invalid class: ${classId}` };
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    return { success: false, message: 'Name is required.' };
  }
  if (name.length > 16) {
    return { success: false, message: 'Name must be 16 characters or less.' };
  }

  // Check if slot is taken
  const existing = db.prepare('SELECT id FROM characters WHERE slot = ?').get(slot);
  if (existing) {
    return { success: false, message: `Slot ${slot} already has a character.` };
  }

  const id = uuid();
  const now = new Date().toISOString();

  try {
    // Create character
    db.prepare(`
      INSERT INTO characters (id, slot, name, class_id, level, experience, meseta, variation_index, texture_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, 0, ?, 0, '0_0', ?, ?)
    `).run(id, slot, name.trim(), normalizedClassId, STARTING_MESETA, now, now);

    // Initialize game state
    db.prepare(`
      INSERT INTO game_state (character_id, location)
      VALUES (?, 'city')
    `).run(id);

    // Add starting equipment (auto-equipped)
    const startingItems = getStartingItems(normalizedClassId);

    db.prepare(`
      INSERT INTO equipment (character_id, slot, item_data)
      VALUES (?, 'weapon', ?)
    `).run(id, JSON.stringify(startingItems.weapon));

    db.prepare(`
      INSERT INTO equipment (character_id, slot, item_data)
      VALUES (?, 'frame', ?)
    `).run(id, JSON.stringify(startingItems.frame));

    // Add starting consumables to inventory
    for (const { item, quantity } of startingItems.consumables) {
      db.prepare(`
        INSERT INTO inventory (character_id, item_id, item_data, quantity)
        VALUES (?, ?, ?, ?)
      `).run(id, item.id, JSON.stringify(item), quantity);
    }

    const character = getCharacter(id);
    return {
      success: true,
      message: `Created ${normalizedClassId} "${name}" with starting gear equipped.`,
      data: character!,
    };
  } catch (error) {
    return { success: false, message: `Failed to create character: ${error}` };
  }
}

/**
 * Get a character by ID
 */
export function getCharacter(id: string): Character | null {
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(id) as Character | undefined;
  return row ?? null;
}

/**
 * Get a character by slot
 */
export function getCharacterBySlot(slot: number): Character | null {
  const row = db.prepare('SELECT * FROM characters WHERE slot = ?').get(slot) as Character | undefined;
  return row ?? null;
}

/**
 * Get all characters
 */
export function getAllCharacters(): (Character | null)[] {
  const rows = db.prepare('SELECT * FROM characters ORDER BY slot').all() as Character[];
  const slots: (Character | null)[] = [null, null, null, null];
  for (const row of rows) {
    slots[row.slot] = row;
  }
  return slots;
}

/**
 * Delete a character
 */
export function deleteCharacter(id: string): ApiResult {
  const result = db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  if (result.changes === 0) {
    return { success: false, message: 'Character not found.' };
  }
  return { success: true, message: 'Character deleted.' };
}

/**
 * Delete a character by slot
 */
export function deleteCharacterBySlot(slot: number): ApiResult {
  const result = db.prepare('DELETE FROM characters WHERE slot = ?').run(slot);
  if (result.changes === 0) {
    return { success: false, message: 'No character in that slot.' };
  }
  return { success: true, message: 'Character deleted.' };
}

/**
 * Update character meseta
 */
export function updateMeseta(id: string, amount: number): ApiResult {
  const char = getCharacter(id);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const newAmount = char.meseta + amount;
  if (newAmount < 0) {
    return { success: false, message: 'Insufficient meseta.' };
  }

  db.prepare("UPDATE characters SET meseta = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newAmount, id);

  return { success: true, message: `Meseta updated. New balance: ${newAmount}` };
}

/**
 * Update character experience and level
 * Uses experience table from content/experience/experience-table.json
 */
export function addExperience(id: string, exp: number): ApiResult<{ level: number; experience: number; leveledUp: boolean; expToNext: number | null }> {
  const char = getCharacter(id);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const newExp = char.experience + exp;
  // Use content-based experience table (max level 100)
  const newLevel = calculateLevelFromExp(newExp);
  const leveledUp = newLevel > char.level;
  const expToNext = getExpToNextLevel(newLevel);

  db.prepare("UPDATE characters SET experience = ?, level = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newExp, newLevel, id);

  return {
    success: true,
    message: leveledUp ? `Level up! Now level ${newLevel}.` : `Gained ${exp} EXP.`,
    data: { level: newLevel, experience: newExp, leveledUp, expToNext },
  };
}

/**
 * Get experience progress for current level
 */
export function getExpProgress(id: string): { current: number; needed: number; percent: number } | null {
  const char = getCharacter(id);
  if (!char) return null;

  const levelStart = getTotalExpForLevel(char.level);
  const expToNext = getExpToNextLevel(char.level);

  if (expToNext === null) {
    // Max level
    return { current: 0, needed: 0, percent: 100 };
  }

  const currentProgress = char.experience - levelStart;
  const percent = Math.floor((currentProgress / expToNext) * 100);

  return { current: currentProgress, needed: expToNext, percent };
}
