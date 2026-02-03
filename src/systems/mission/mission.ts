/**
 * Mission System
 * Mission management, progress tracking, and rewards
 */

import type {
  Mission,
  MissionProgress,
  MissionResult,
  MissionGrade,
  Difficulty,
  RewardItem,
  ObjectiveProgress,
} from './types';
import {
  DIFFICULTY_EXP_MULTIPLIERS,
  DIFFICULTY_MESETA_MULTIPLIERS,
  GRADE_THRESHOLDS,
} from './types';

// Mission database (would be loaded from JSON in production)
const missions = new Map<string, Mission>();

// Completed missions tracking per character
const completedMissions = new Map<string, Set<string>>(); // characterId -> Set of missionIds

// Active mission state
let activeMission: MissionProgress | null = null;

/**
 * Register a mission
 */
export function registerMission(mission: Mission): void {
  missions.set(mission.id, mission);
}

/**
 * Get a mission by ID
 */
export function getMission(missionId: string): Mission | null {
  return missions.get(missionId) ?? null;
}

/**
 * Get all missions
 */
export function getAllMissions(): Mission[] {
  return Array.from(missions.values());
}

/**
 * Check if mission is unlocked for a character
 */
export function isMissionUnlocked(
  missionId: string,
  characterId: string,
  characterLevel: number
): boolean {
  const mission = getMission(missionId);
  if (!mission) return false;

  // Check level requirement
  if (characterLevel < mission.requiredLevel) {
    return false;
  }

  // Check unlock requirements
  if (mission.unlockRequirements) {
    for (const req of mission.unlockRequirements) {
      if (req.type === 'mission' && req.id) {
        if (!hasMissionCompleted(characterId, req.id)) {
          return false;
        }
      }
      if (req.type === 'field' && req.id) {
        // Dynamically import to avoid circular dependency
        const { hasFieldCompleted } = require('../field/field');
        if (!hasFieldCompleted(characterId, req.id)) {
          return false;
        }
      }
      if (req.type === 'level' && req.value) {
        if (characterLevel < req.value) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Get available missions for a character
 */
export function getAvailableMissions(
  characterId: string,
  characterLevel: number
): Mission[] {
  return getAllMissions().filter(mission =>
    isMissionUnlocked(mission.id, characterId, characterLevel)
  );
}

/**
 * Check if character has completed a mission
 */
export function hasMissionCompleted(characterId: string, missionId: string): boolean {
  const completed = completedMissions.get(characterId);
  return completed?.has(missionId) ?? false;
}

/**
 * Mark mission as completed
 */
export function markMissionCompleted(characterId: string, missionId: string): void {
  if (!completedMissions.has(characterId)) {
    completedMissions.set(characterId, new Set());
  }
  completedMissions.get(characterId)!.add(missionId);
}

/**
 * Get missions by area
 */
export function getMissionsByArea(areaId: string): Mission[] {
  return getAllMissions().filter(m => m.areaId === areaId);
}

/**
 * Start a mission
 */
export function startMission(missionId: string, difficulty: Difficulty): MissionProgress | null {
  const mission = getMission(missionId);
  if (!mission) return null;

  // Initialize objectives
  const objectives: ObjectiveProgress[] = mission.objectives.map(obj => ({
    objectiveId: obj.id,
    current: 0,
    target: obj.count ?? 1,
    completed: false,
  }));

  activeMission = {
    missionId,
    difficulty,
    startTime: new Date().toISOString(),
    objectives,
    completed: false,
  };

  return activeMission;
}

/**
 * Get active mission
 */
export function getActiveMission(): MissionProgress | null {
  return activeMission;
}

/**
 * Update objective progress
 */
export function updateObjective(objectiveId: string, progress: number): MissionProgress | null {
  if (!activeMission) return null;

  const objective = activeMission.objectives.find(o => o.objectiveId === objectiveId);
  if (!objective) return null;

  objective.current = Math.min(objective.current + progress, objective.target);
  objective.completed = objective.current >= objective.target;

  // Check if all objectives completed
  activeMission.completed = activeMission.objectives.every(o => o.completed);

  return activeMission;
}

/**
 * Calculate mission grade based on completion time
 */
export function calculateGrade(actualTime: number, parTime: number): MissionGrade {
  const ratio = actualTime / parTime;

  if (ratio <= GRADE_THRESHOLDS.S.time) return 'S';
  if (ratio <= GRADE_THRESHOLDS.A.time) return 'A';
  if (ratio <= GRADE_THRESHOLDS.B.time) return 'B';
  if (ratio <= GRADE_THRESHOLDS.C.time) return 'C';
  return 'D';
}

/**
 * Get grade bonus multiplier
 */
export function getGradeBonus(grade: MissionGrade): number {
  return GRADE_THRESHOLDS[grade].bonus;
}

/**
 * Calculate experience reward
 */
export function calculateExpReward(
  baseExp: number,
  difficulty: Difficulty,
  grade: MissionGrade
): number {
  const difficultyMultiplier = DIFFICULTY_EXP_MULTIPLIERS[difficulty];
  const gradeBonus = getGradeBonus(grade);
  return Math.floor(baseExp * difficultyMultiplier * gradeBonus);
}

/**
 * Calculate meseta reward
 */
export function calculateMesetaReward(
  baseMeseta: number,
  difficulty: Difficulty,
  grade: MissionGrade
): number {
  const difficultyMultiplier = DIFFICULTY_MESETA_MULTIPLIERS[difficulty];
  const gradeBonus = getGradeBonus(grade);
  return Math.floor(baseMeseta * difficultyMultiplier * gradeBonus);
}

/**
 * Roll for item rewards
 */
export function rollItemRewards(
  items: RewardItem[] | undefined,
  seed?: number
): RewardItem[] {
  if (!items || items.length === 0) return [];

  const rewards: RewardItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const roll = seed !== undefined
      ? ((seed + i * 37) % 100) / 100
      : Math.random();

    if (roll < item.chance) {
      rewards.push(item);
    }
  }

  return rewards;
}

/**
 * Complete mission and calculate rewards
 */
export function completeMission(
  characterId: string,
  success: boolean,
  duration: number,
  parTime: number = 300, // 5 minutes default
  seed?: number
): MissionResult | null {
  if (!activeMission) return null;

  const mission = getMission(activeMission.missionId);
  if (!mission) return null;

  const grade = success ? calculateGrade(duration, parTime) : 'D';

  const expGained = success
    ? calculateExpReward(mission.rewards.baseExp, activeMission.difficulty, grade)
    : 0;

  const mesetaGained = success
    ? calculateMesetaReward(mission.rewards.baseMeseta, activeMission.difficulty, grade)
    : Math.floor(mission.rewards.baseMeseta * 0.1); // 10% consolation

  const itemsGained = success
    ? rollItemRewards(mission.rewards.items, seed)
    : [];

  if (success) {
    markMissionCompleted(characterId, activeMission.missionId);
  }

  const result: MissionResult = {
    missionId: activeMission.missionId,
    difficulty: activeMission.difficulty,
    success,
    duration,
    expGained,
    mesetaGained,
    itemsGained,
    grade,
  };

  // Clear active mission
  activeMission = null;

  return result;
}

/**
 * Abandon current mission
 */
export function abandonMission(): void {
  activeMission = null;
}

/**
 * Get completion count for character
 */
export function getCompletionCount(characterId: string): number {
  const completed = completedMissions.get(characterId);
  return completed?.size ?? 0;
}

/**
 * Get all completed mission IDs for a character (for persistence)
 */
export function getCompletedMissions(characterId: string): string[] {
  const completed = completedMissions.get(characterId);
  return completed ? Array.from(completed) : [];
}

/**
 * Restore completed missions for a character (from persistence)
 */
export function restoreCompletedMissions(characterId: string, missionIds: string[]): void {
  if (!missionIds || missionIds.length === 0) return;
  if (!completedMissions.has(characterId)) {
    completedMissions.set(characterId, new Set());
  }
  const completed = completedMissions.get(characterId)!;
  for (const id of missionIds) {
    completed.add(id);
  }
}

/**
 * Get recommended difficulty based on level
 */
export function getRecommendedDifficulty(
  characterLevel: number,
  missionRecommendedLevel: number
): Difficulty {
  const diff = characterLevel - missionRecommendedLevel;

  if (diff >= 20) return 'super-hard';
  if (diff >= 10) return 'hard';
  return 'normal';
}

/**
 * Check if player meets level requirement for difficulty
 */
export function meetsLevelForDifficulty(
  characterLevel: number,
  difficulty: Difficulty
): boolean {
  switch (difficulty) {
    case 'normal':
      return true;
    case 'hard':
      return characterLevel >= 20;
    case 'super-hard':
      return characterLevel >= 50;
    default:
      return true;
  }
}

/**
 * Clear all missions (for testing)
 */
export function clearMissions(): void {
  missions.clear();
  completedMissions.clear();
  activeMission = null;
}

/**
 * Initialize default missions
 */
export function initializeDefaultMissions(): void {
  // First mission - standard introductory quest
  registerMission({
    id: 'mayors-mission',
    name: "Mayor's Mission",
    description: 'Help the Mayor investigate strange occurrences in the forest.',
    areaId: 'naura-bakery',
    requiredLevel: 1,
    recommendedLevel: 5,
    partySize: 4,
    objectives: [
      { id: 'obj1', type: 'defeat', target: 'booma', count: 10, description: 'Defeat 10 Boomas' },
      { id: 'obj2', type: 'reach', target: 'boss-area', description: 'Reach the boss area' },
      { id: 'obj3', type: 'defeat', target: 'hildebear', count: 1, description: 'Defeat Hildebear' },
    ],
    rewards: {
      baseExp: 500,
      baseMeseta: 1000,
      items: [
        { itemId: 'saber', quantity: 1, chance: 0.2 },
        { itemId: 'monomate', quantity: 5, chance: 0.8 },
      ],
    },
  });

  registerMission({
    id: 'third-daughter',
    name: 'The Third Daughter',
    description: 'Search for the missing daughter in the caves.',
    areaId: 'oberon-caves',
    requiredLevel: 10,
    recommendedLevel: 15,
    partySize: 4,
    objectives: [
      { id: 'obj1', type: 'collect', target: 'clue', count: 3, description: 'Find 3 clues' },
      { id: 'obj2', type: 'defeat', target: 'boss', count: 1, description: 'Defeat the kidnapper' },
      { id: 'obj3', type: 'protect', target: 'daughter', description: 'Protect the daughter' },
    ],
    rewards: {
      baseExp: 1500,
      baseMeseta: 3000,
      items: [
        { itemId: 'brand', quantity: 1, chance: 0.15 },
        { itemId: 'dimate', quantity: 3, chance: 0.5 },
      ],
    },
    unlockRequirements: [
      { type: 'mission', id: 'mayors-mission' },
    ],
  });

  // Third mission - the tone shift, shows the world has real stakes
  registerMission({
    id: 'fallen-hunter',
    name: 'Retrieve the Fallen',
    description: 'A hunter went missing in Gurhacia Valley three days ago. The guild has given up hope of finding them alive. Recover their belongings so we can return them to the family.',
    areaId: 'valley',
    requiredLevel: 10,
    recommendedLevel: 12,
    partySize: 1,
    objectives: [
      { id: 'obj1', type: 'reach', target: 'valley-camp', description: 'Find the abandoned camp' },
      { id: 'obj2', type: 'collect', target: 'hunter-id', count: 1, description: 'Recover hunter ID card' },
      { id: 'obj3', type: 'collect', target: 'hunter-letter', count: 1, description: 'Find the unfinished letter' },
    ],
    rewards: {
      baseExp: 200,
      baseMeseta: 300,
      items: [
        { itemId: 'monomate', quantity: 3, chance: 1.0 },
      ],
    },
    unlockRequirements: [
      { type: 'mission', id: 'third-daughter' },
    ],
    narrative: {
      intro: "The guild clerk's voice is quiet. \"Mira was... experienced. Twenty years hunting these valleys. If she couldn't make it back...\" She slides a worn photograph across the counter. A woman with kind eyes, arm around a teenage boy. \"Her son deserves to know what happened. Bring back what you can.\"",
      complete: "The clerk takes the ID card with trembling hands. She reads the half-finished letter silently, then folds it carefully. \"Thank you. I'll make sure Kai receives these.\" She pauses. \"The rescue team found her, you know. Too late. Cost them 2,000 Meseta to bring her home.\" Her eyes meet yours. \"Be careful out there. The valley doesn't care how experienced you are.\"",
    },
  });

  registerMission({
    id: 'valley-king',
    name: 'The Valley King',
    description: 'Defeat the dragon terrorizing Gurhacia Valley.',
    areaId: 'gurhacia-valley',
    requiredLevel: 30,
    recommendedLevel: 40,
    partySize: 4,
    objectives: [
      { id: 'obj1', type: 'defeat', target: 'dragon-spawn', count: 20, description: 'Clear the path' },
      { id: 'obj2', type: 'defeat', target: 'de-rol-le', count: 1, description: 'Defeat De Rol Le' },
    ],
    rewards: {
      baseExp: 5000,
      baseMeseta: 10000,
      items: [
        { itemId: 'buster', quantity: 1, chance: 0.1 },
        { itemId: 'trimate', quantity: 5, chance: 0.6 },
      ],
    },
    unlockRequirements: [
      { type: 'mission', id: 'fallen-hunter' },
      { type: 'level', value: 30 },
    ],
  });
}
