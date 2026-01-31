/**
 * Mission System Types
 */

export type Difficulty = 'normal' | 'hard' | 'super-hard';

export interface Mission {
  id: string;
  name: string;
  description: string;
  areaId: string;
  requiredLevel: number;
  recommendedLevel: number;
  partySize: 1 | 2 | 3 | 4;
  objectives: MissionObjective[];
  rewards: MissionReward;
  unlockRequirements?: UnlockRequirement[];
}

export interface MissionObjective {
  id: string;
  type: 'defeat' | 'collect' | 'reach' | 'protect';
  target: string;
  count?: number;
  description: string;
}

export interface MissionReward {
  baseExp: number;
  baseMeseta: number;
  items?: RewardItem[];
}

export interface RewardItem {
  itemId: string;
  quantity: number;
  chance: number; // 0-1
}

export interface UnlockRequirement {
  type: 'mission' | 'level' | 'item';
  id?: string;
  value?: number;
}

export interface MissionProgress {
  missionId: string;
  difficulty: Difficulty;
  startTime: string;
  objectives: ObjectiveProgress[];
  completed: boolean;
}

export interface ObjectiveProgress {
  objectiveId: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface MissionResult {
  missionId: string;
  difficulty: Difficulty;
  success: boolean;
  duration: number; // in seconds
  expGained: number;
  mesetaGained: number;
  itemsGained: RewardItem[];
  grade: MissionGrade;
}

export type MissionGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export const DIFFICULTY_EXP_MULTIPLIERS: Record<Difficulty, number> = {
  'normal': 1.0,
  'hard': 1.5,
  'super-hard': 2.0,
};

export const DIFFICULTY_MESETA_MULTIPLIERS: Record<Difficulty, number> = {
  'normal': 1.0,
  'hard': 2.0,
  'super-hard': 3.0,
};

export const GRADE_THRESHOLDS = {
  S: { time: 0.5, bonus: 1.5 },  // Under 50% of par time
  A: { time: 0.75, bonus: 1.25 }, // Under 75% of par time
  B: { time: 1.0, bonus: 1.0 },   // At par time
  C: { time: 1.5, bonus: 0.75 },  // Up to 150% of par time
  D: { time: Infinity, bonus: 0.5 }, // Over 150% of par time
};
