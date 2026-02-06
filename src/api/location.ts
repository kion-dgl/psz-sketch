/**
 * Location API
 * Navigation and game state management
 */
import { db } from '../db';

export type Location = 'city' | 'shop' | 'weapon-shop' | 'guild' | 'teleporter' | 'storage' | 'field';

export interface GameStateData {
  location: Location;
  sessionData: SessionData | null;
  combatData: CombatData | null;
}

export interface SessionData {
  type: 'mission' | 'field';
  areaId: string;
  difficulty: string;
  currentStage: number;
  totalStages: number;
  currentWave: number;
  totalWaves: number;
}

export interface CombatData {
  hp: number;
  maxHp: number;
  tp: number;
  maxTp: number;
  enemies: EnemyData[];
  droppedItems: DroppedItem[];
}

export interface EnemyData {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
}

export interface DroppedItem {
  id: number;
  type: 'item' | 'meseta';
  itemId?: string;
  itemData?: string;
  meseta?: number;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

const VALID_LOCATIONS: Location[] = ['city', 'shop', 'weapon-shop', 'guild', 'teleporter', 'storage', 'field'];

/**
 * Get current game state for a character
 */
export function getGameState(characterId: string): GameStateData | null {
  const row = db.prepare(`
    SELECT location, session_data, combat_data FROM game_state WHERE character_id = ?
  `).get(characterId) as { location: string; session_data: string | null; combat_data: string | null } | undefined;

  if (!row) return null;

  return {
    location: row.location as Location,
    sessionData: row.session_data ? JSON.parse(row.session_data) : null,
    combatData: row.combat_data ? JSON.parse(row.combat_data) : null,
  };
}

/**
 * Get current location
 */
export function getLocation(characterId: string): Location {
  const state = getGameState(characterId);
  return state?.location ?? 'city';
}

/**
 * Move to a location
 */
export function goto(characterId: string, location: string): ApiResult {
  const normalizedLocation = location.toLowerCase() as Location;

  if (!VALID_LOCATIONS.includes(normalizedLocation)) {
    return { success: false, message: `Invalid location. Choose: ${VALID_LOCATIONS.join(', ')}` };
  }

  // Can't goto field directly (must use enter-field/enter-mission)
  if (normalizedLocation === 'field') {
    return { success: false, message: 'Use enter-field or enter-mission to go to field.' };
  }

  db.prepare(`
    UPDATE game_state SET location = ? WHERE character_id = ?
  `).run(normalizedLocation, characterId);

  return { success: true, message: `Moved to ${normalizedLocation}.` };
}

/**
 * Set session data (for missions/fields)
 */
export function setSessionData(characterId: string, data: SessionData | null): void {
  db.prepare(`
    UPDATE game_state SET session_data = ? WHERE character_id = ?
  `).run(data ? JSON.stringify(data) : null, characterId);
}

/**
 * Set combat data
 */
export function setCombatData(characterId: string, data: CombatData | null): void {
  db.prepare(`
    UPDATE game_state SET combat_data = ? WHERE character_id = ?
  `).run(data ? JSON.stringify(data) : null, characterId);
}

/**
 * Enter field
 */
export function enterField(characterId: string, areaId: string, difficulty: string): ApiResult {
  const currentLocation = getLocation(characterId);
  if (currentLocation !== 'teleporter') {
    return { success: false, message: 'Must be at teleporter to enter field.' };
  }

  const sessionData: SessionData = {
    type: 'field',
    areaId,
    difficulty,
    currentStage: 0,
    totalStages: 3, // TODO: Get from area config
    currentWave: 1,
    totalWaves: 1,
  };

  db.prepare(`
    UPDATE game_state SET location = 'field', session_data = ? WHERE character_id = ?
  `).run(JSON.stringify(sessionData), characterId);

  return { success: true, message: `Entered ${areaId} on ${difficulty}.`, data: sessionData };
}

/**
 * Enter mission
 */
export function enterMission(characterId: string, missionId: string, difficulty: string): ApiResult {
  const currentLocation = getLocation(characterId);
  if (currentLocation !== 'guild') {
    return { success: false, message: 'Must be at guild to start mission.' };
  }

  const sessionData: SessionData = {
    type: 'mission',
    areaId: missionId,
    difficulty,
    currentStage: 0,
    totalStages: 3, // TODO: Get from mission config
    currentWave: 1,
    totalWaves: 3,
  };

  db.prepare(`
    UPDATE game_state SET location = 'field', session_data = ? WHERE character_id = ?
  `).run(JSON.stringify(sessionData), characterId);

  return { success: true, message: `Started ${missionId} on ${difficulty}.`, data: sessionData };
}

/**
 * Return to city (telepipe or complete)
 */
export function returnToCity(characterId: string): ApiResult {
  db.prepare(`
    UPDATE game_state SET location = 'city', session_data = NULL, combat_data = NULL
    WHERE character_id = ?
  `).run(characterId);

  return { success: true, message: 'Returned to city.' };
}

/**
 * Advance to next stage
 */
export function nextStage(characterId: string): ApiResult {
  const state = getGameState(characterId);
  if (!state || state.location !== 'field' || !state.sessionData) {
    return { success: false, message: 'Not in a field/mission.' };
  }

  const session = state.sessionData;
  if (session.currentStage >= session.totalStages - 1) {
    return { success: false, message: 'Already at final stage.' };
  }

  session.currentStage++;
  session.currentWave = 1;
  setSessionData(characterId, session);

  return { success: true, message: `Advanced to stage ${session.currentStage + 1}.`, data: session };
}
