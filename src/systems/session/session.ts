/**
 * Session System
 * Manages active field and mission gameplay sessions
 */

import type {
  SessionState,
  SessionMode,
  SessionType,
  MissionStage,
  Difficulty,
} from './types';
import type { StageDefinition, FieldResult } from '../field/types';
import type { MissionResult } from '../mission/types';
import {
  getField,
  isFieldUnlocked,
  calculateFieldResult,
  markFieldCompleted,
} from '../field/field';
import { FIELD_REWARDS } from '../field/default-fields';
import {
  getMission,
  isMissionUnlocked,
  startMission as startMissionProgress,
  completeMission as completeMissionProgress,
  abandonMission,
} from '../mission/mission';
import { meetsLevelForDifficulty } from '../mission/mission';

// Session state (module-level singleton)
let sessionState: SessionState = createEmptySession();

// Session configuration
let sessionConfig: { characterId: string; characterLevel: number } | null = null;

/**
 * Create empty session state
 */
function createEmptySession(): SessionState {
  return {
    mode: 'city',
    activeId: null,
    activeType: null,
    difficulty: 'normal',
    currentStageIndex: 0,
    startTime: 0,
    telepipeUsed: false,
    pendingResult: null,
  };
}

/**
 * Set session configuration (character info)
 */
export function setSessionConfig(characterId: string, characterLevel: number): void {
  sessionConfig = { characterId, characterLevel };
}

/**
 * Get current session configuration
 */
export function getSessionConfig(): { characterId: string; characterLevel: number } | null {
  return sessionConfig;
}

/**
 * Enter a field
 */
export function enterField(fieldId: string, difficulty: Difficulty): boolean {
  if (!sessionConfig) return false;

  const field = getField(fieldId);
  if (!field) return false;

  // Check if unlocked
  if (!isFieldUnlocked(fieldId, sessionConfig.characterId, sessionConfig.characterLevel)) {
    return false;
  }

  // Check difficulty level requirement
  if (!meetsLevelForDifficulty(sessionConfig.characterLevel, difficulty)) {
    return false;
  }

  // Can't enter if already in session
  if (sessionState.mode !== 'city') {
    return false;
  }

  sessionState = {
    mode: 'field',
    activeId: fieldId,
    activeType: 'field',
    difficulty,
    currentStageIndex: 0,
    startTime: Date.now(),
    telepipeUsed: false,
    pendingResult: null,
  };

  return true;
}

/**
 * Enter a mission
 */
export function enterMission(missionId: string, difficulty: Difficulty): boolean {
  if (!sessionConfig) return false;

  const mission = getMission(missionId);
  if (!mission) return false;

  // Check if unlocked
  if (!isMissionUnlocked(missionId, sessionConfig.characterId, sessionConfig.characterLevel)) {
    return false;
  }

  // Check difficulty level requirement
  if (!meetsLevelForDifficulty(sessionConfig.characterLevel, difficulty)) {
    return false;
  }

  // Can't enter if already in session
  if (sessionState.mode !== 'city') {
    return false;
  }

  // Start mission progress tracking
  const progress = startMissionProgress(missionId, difficulty);
  if (!progress) return false;

  sessionState = {
    mode: 'mission',
    activeId: missionId,
    activeType: 'mission',
    difficulty,
    currentStageIndex: 0,
    startTime: Date.now(),
    telepipeUsed: false,
    pendingResult: null,
  };

  return true;
}

/**
 * Get current stage
 */
export function getCurrentStage(): StageDefinition | MissionStage | null {
  if (sessionState.mode === 'city' || !sessionState.activeId) {
    return null;
  }

  if (sessionState.activeType === 'field') {
    const field = getField(sessionState.activeId);
    if (!field) return null;

    if (sessionState.currentStageIndex >= field.stageSequence.length) {
      return null; // Past end
    }

    return field.stageSequence[sessionState.currentStageIndex];
  }

  // For missions, return a mission stage (simplified for now)
  const mission = getMission(sessionState.activeId);
  if (!mission) return null;

  return {
    stageId: `${mission.id}-stage-${sessionState.currentStageIndex}`,
    areaId: mission.areaId,
  };
}

/**
 * Advance to next stage
 * Returns false if already at end or not in session
 */
export function advanceToNextStage(): boolean {
  if (sessionState.mode === 'city' || !sessionState.activeId) {
    return false;
  }

  if (sessionState.activeType === 'field') {
    const field = getField(sessionState.activeId);
    if (!field) return false;

    if (sessionState.currentStageIndex >= field.stageSequence.length - 1) {
      return false; // Already at last stage
    }

    sessionState.currentStageIndex++;
    return true;
  }

  // For missions, limit to 3 stages
  if (sessionState.currentStageIndex >= MISSION_STAGE_COUNT - 1) {
    return false; // Already at last stage
  }

  sessionState.currentStageIndex++;
  return true;
}

// Missions have a fixed 3-stage structure
const MISSION_STAGE_COUNT = 3;

/**
 * Check if at final stage
 */
export function isAtFinalStage(): boolean {
  if (sessionState.mode === 'city' || !sessionState.activeId) {
    return false;
  }

  if (sessionState.activeType === 'field') {
    const field = getField(sessionState.activeId);
    if (!field) return false;

    return sessionState.currentStageIndex >= field.stageSequence.length - 1;
  }

  // Missions have 3 stages (0, 1, 2) - final is index 2
  return sessionState.currentStageIndex >= MISSION_STAGE_COUNT - 1;
}

/**
 * Use telepipe to return to city
 * Preserves progress for later resume
 */
export function useTelepipe(): void {
  if (sessionState.mode === 'city') return;

  sessionState.telepipeUsed = true;
  sessionState.mode = 'city';
}

/**
 * Check if session can be resumed (used telepipe)
 */
export function canResume(): boolean {
  return sessionState.telepipeUsed && sessionState.activeId !== null;
}

/**
 * Resume session after telepipe
 */
export function resumeSession(): boolean {
  if (!canResume()) return false;

  sessionState.mode = sessionState.activeType === 'field' ? 'field' : 'mission';
  return true;
}

/**
 * Abandon session without rewards
 */
export function abandonSession(): void {
  if (sessionState.activeType === 'mission') {
    abandonMission();
  }

  sessionState = createEmptySession();
}

/**
 * Complete session and calculate rewards
 */
export function completeSession(success: boolean): FieldResult | MissionResult | null {
  if (!sessionConfig) return null;

  if (sessionState.mode === 'city' && !sessionState.telepipeUsed) {
    return null;
  }

  const duration = Date.now() - sessionState.startTime;

  if (sessionState.activeType === 'field') {
    const field = getField(sessionState.activeId!);
    if (!field) return null;

    const rewards = FIELD_REWARDS[field.id] || {
      baseExp: 500,
      baseMeseta: 1000,
    };

    const result = calculateFieldResult(
      field,
      sessionState.difficulty,
      duration,
      success ? field.stageSequence.length : sessionState.currentStageIndex,
      rewards.baseExp,
      rewards.baseMeseta,
      rewards.items
    );

    sessionState.pendingResult = result;
    sessionState.mode = 'city';
    sessionState.telepipeUsed = false;

    return result;
  }

  if (sessionState.activeType === 'mission') {
    const durationSeconds = duration / 1000;
    const result = completeMissionProgress(
      sessionConfig.characterId,
      success,
      durationSeconds,
      300 // default par time
    );

    if (result) {
      sessionState.pendingResult = result;
    }

    sessionState.mode = 'city';
    sessionState.telepipeUsed = false;

    return result;
  }

  return null;
}

/**
 * Check if there are pending rewards
 */
export function hasPendingRewards(): boolean {
  return sessionState.pendingResult !== null;
}

/**
 * Get pending result
 */
export function getPendingResult(): FieldResult | MissionResult | null {
  return sessionState.pendingResult;
}

/**
 * Claim rewards and apply to character
 * Returns the result for processing by caller
 */
export function claimRewards(): FieldResult | MissionResult | null {
  if (!sessionConfig || !sessionState.pendingResult) return null;

  const result = sessionState.pendingResult;

  // Mark completion for unlocks
  if ('fieldId' in result && result.completed) {
    markFieldCompleted(sessionConfig.characterId, result.fieldId);
  }

  // Clear pending result
  sessionState.pendingResult = null;

  // Reset to empty session
  sessionState = createEmptySession();

  return result;
}

/**
 * Get current session state (read-only copy)
 */
export function getSessionState(): SessionState {
  return { ...sessionState };
}

/**
 * Check if currently in a session (field or mission)
 */
export function isInSession(): boolean {
  return sessionState.mode !== 'city' || sessionState.telepipeUsed;
}

/**
 * Get session duration in milliseconds
 */
export function getSessionDuration(): number {
  if (sessionState.startTime === 0) return 0;
  return Date.now() - sessionState.startTime;
}

/**
 * Reset session state (for testing)
 */
export function resetSession(): void {
  sessionState = createEmptySession();
  sessionConfig = null;
}
