/**
 * Session System Types
 * Types for active gameplay sessions (fields and missions)
 */

import type { FieldResult, StageDefinition } from '../field/types';
import type { MissionResult, Difficulty } from '../mission/types';

export type SessionMode = 'city' | 'field' | 'mission';
export type SessionType = 'field' | 'mission';

export interface MissionStage {
  stageId: string;
  areaId: string;
  objectiveIds?: string[];
}

export interface SessionState {
  mode: SessionMode;
  activeId: string | null;        // field or mission ID
  activeType: SessionType | null;
  difficulty: Difficulty;
  currentStageIndex: number;
  startTime: number;              // timestamp in ms
  telepipeUsed: boolean;
  pendingResult: FieldResult | MissionResult | null;
}

export interface SessionConfig {
  characterId: string;
  characterLevel: number;
}

export type { Difficulty };
