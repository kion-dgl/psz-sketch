/**
 * Location API
 * Navigation and game state management
 */
import { db } from '../db';

export type Location = 'city' | 'shop' | 'weapon-shop' | 'guild' | 'teleporter' | 'storage' | 'sewer' | 'field';

export interface GameStateData {
  location: Location;
  sessionData: SessionData | null;
  combatData: CombatData | null;
  pendingMission: PendingMission | null;
}

export interface PendingMission {
  missionId: string;
  difficulty: string;
  completed: boolean;
  expReward: number;
  mesetaReward: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface SessionData {
  type: 'mission' | 'field' | 'rare-field';
  areaId: string;
  difficulty: string;
  currentStage: number;
  totalStages: number;
  currentWave: number;
  totalWaves: number;
  suspended?: boolean;  // True when player used telepipe
  isRareSpawn?: boolean;  // True for rare enemy spawn stages
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

const VALID_LOCATIONS: Location[] = ['city', 'shop', 'weapon-shop', 'guild', 'teleporter', 'storage', 'sewer', 'field'];

/**
 * Get current game state for a character
 */
export function getGameState(characterId: string): GameStateData | null {
  const row = db.prepare(`
    SELECT location, session_data, combat_data, pending_mission FROM game_state WHERE character_id = ?
  `).get(characterId) as { location: string; session_data: string | null; combat_data: string | null; pending_mission: string | null } | undefined;

  if (!row) return null;

  return {
    location: row.location as Location,
    sessionData: row.session_data ? JSON.parse(row.session_data) : null,
    combatData: row.combat_data ? JSON.parse(row.combat_data) : null,
    pendingMission: row.pending_mission ? JSON.parse(row.pending_mission) : null,
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
 * Get pending mission
 */
export function getPendingMission(characterId: string): PendingMission | null {
  const state = getGameState(characterId);
  return state?.pendingMission ?? null;
}

/**
 * Set pending mission
 */
export function setPendingMission(characterId: string, data: PendingMission | null): void {
  db.prepare(`
    UPDATE game_state SET pending_mission = ? WHERE character_id = ?
  `).run(data ? JSON.stringify(data) : null, characterId);
}

/**
 * Suspend current session (telepipe) - returns to city but keeps session
 */
export function suspendSession(characterId: string): ApiResult {
  const state = getGameState(characterId);
  if (!state || state.location !== 'field' || !state.sessionData) {
    return { success: false, message: 'Not in a mission or field.' };
  }

  // Mark session as suspended
  const session = { ...state.sessionData, suspended: true };

  db.prepare(`
    UPDATE game_state SET location = 'city', session_data = ? WHERE character_id = ?
  `).run(JSON.stringify(session), characterId);

  return { success: true, message: 'Telepipe activated! Returned to city. Go to Guild to resume.' };
}

/**
 * Resume suspended session
 */
export function resumeSession(characterId: string): ApiResult {
  const state = getGameState(characterId);
  if (!state?.sessionData?.suspended) {
    return { success: false, message: 'No suspended mission to resume.' };
  }

  // Un-suspend and return to field
  const session = { ...state.sessionData, suspended: false };

  db.prepare(`
    UPDATE game_state SET location = 'field', session_data = ? WHERE character_id = ?
  `).run(JSON.stringify(session), characterId);

  const stageNum = session.currentStage + 1;
  return {
    success: true,
    message: `Resumed ${session.type}! Stage ${stageNum}, Wave ${session.currentWave}/${session.totalWaves}`,
    data: session,
  };
}

/**
 * Get suspended session info
 */
export function getSuspendedSession(characterId: string): SessionData | null {
  const state = getGameState(characterId);
  if (state?.sessionData?.suspended) {
    return state.sessionData;
  }
  return null;
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
 * Enter rare enemy field (special rare spawn stage)
 * Only 1-2 waves of rare enemies with better rewards
 */
export function enterRareField(characterId: string, areaId: string, difficulty: string): ApiResult {
  const currentLocation = getLocation(characterId);
  if (currentLocation !== 'teleporter') {
    return { success: false, message: 'Must be at teleporter to enter rare field.' };
  }

  const sessionData: SessionData = {
    type: 'rare-field',
    areaId,
    difficulty,
    currentStage: 0,
    totalStages: 1, // Rare fields are single stage
    currentWave: 1,
    totalWaves: 2, // 2 waves of rare enemies
    isRareSpawn: true,
  };

  db.prepare(`
    UPDATE game_state SET location = 'field', session_data = ? WHERE character_id = ?
  `).run(JSON.stringify(sessionData), characterId);

  return { success: true, message: `RARE SPAWN DETECTED! Entered ${areaId} rare field on ${difficulty}.`, data: sessionData };
}

/**
 * Enter mission
 */
export function enterMission(characterId: string, missionId: string, difficulty: string): ApiResult {
  const currentLocation = getLocation(characterId);
  if (currentLocation !== 'guild') {
    return { success: false, message: 'Must be at guild to start mission.' };
  }

  // Check for pending mission
  const pending = getPendingMission(characterId);
  if (pending) {
    return { success: false, message: 'You must report your completed mission first.' };
  }

  // Check for suspended session
  const suspended = getSuspendedSession(characterId);
  if (suspended) {
    return { success: false, message: 'You have a suspended mission. Resume or abandon it first.' };
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
