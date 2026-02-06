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
  MissionObjective,
  UnlockRequirement,
} from './types';
import {
  DIFFICULTY_EXP_MULTIPLIERS,
  DIFFICULTY_MESETA_MULTIPLIERS,
  GRADE_THRESHOLDS,
} from './types';
import { getQuestDefinitions, type QuestDefinitionData } from '../../data/content-loader';

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
 * Convert area name to area ID
 */
function areaNameToId(areaName: string): string {
  return areaName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Convert objective type from quest definition to mission objective type
 */
function convertObjectiveType(type: string): 'defeat' | 'collect' | 'reach' | 'protect' {
  switch (type) {
    case 'defeat_enemies':
    case 'defeat_boss':
      return 'defeat';
    case 'collect_items':
      return 'collect';
    case 'reach_location':
      return 'reach';
    case 'escort_npc':
      return 'protect';
    default:
      return 'defeat';
  }
}

/**
 * Convert quest definition to Mission type
 */
function questDefinitionToMission(quest: QuestDefinitionData): Mission {
  // Get normal difficulty rewards as base
  const normalDiff = quest.difficulties.find(d => d.difficulty === 'Normal');

  // Convert objectives
  const objectives: MissionObjective[] = quest.objectives.map((obj, i) => ({
    id: `obj${i + 1}`,
    type: convertObjectiveType(obj.type),
    target: obj.target ?? 'any',
    count: obj.required,
    description: obj.description,
  }));

  // Convert unlock requirements
  const unlockRequirements: UnlockRequirement[] = [];
  if (quest.requirements?.prerequisiteQuests) {
    for (const prereq of quest.requirements.prerequisiteQuests) {
      unlockRequirements.push({ type: 'mission', id: prereq });
    }
  }
  if (quest.requirements?.minLevel && quest.requirements.minLevel > 1) {
    unlockRequirements.push({ type: 'level', value: quest.requirements.minLevel });
  }

  // Convert reward items (guaranteed drops from quest rewards)
  const rewardItems: RewardItem[] = [];
  if (normalDiff?.rewards?.items) {
    for (const item of normalDiff.rewards.items) {
      rewardItems.push({
        itemId: item.itemId,
        quantity: item.quantity,
        chance: 1.0, // Quest rewards are guaranteed
      });
    }
  }

  return {
    id: quest.questId,
    name: quest.questName,
    description: quest.description,
    areaId: areaNameToId(quest.area),
    requiredLevel: quest.requirements?.minLevel ?? 1,
    recommendedLevel: normalDiff?.recommendedLevel ?? quest.requirements?.minLevel ?? 1,
    partySize: 4, // Default party size
    objectives,
    rewards: {
      baseExp: normalDiff?.rewards?.experience ?? 500,
      baseMeseta: normalDiff?.rewards?.meseta ?? 500,
      items: rewardItems.length > 0 ? rewardItems : undefined,
    },
    unlockRequirements: unlockRequirements.length > 0 ? unlockRequirements : undefined,
    missionType: quest.questType === 'story' ? 'story' : 'side',
  };
}

/**
 * Initialize missions from quest definitions
 */
export function initializeDefaultMissions(): void {
  const questDefs = getQuestDefinitions();

  for (const [_id, questDef] of questDefs) {
    const mission = questDefinitionToMission(questDef);
    registerMission(mission);
  }

  // Log loaded missions count
  console.log(`Loaded ${missions.size} missions from quest definitions`);
}

/**
 * Get story missions in order
 */
export function getStoryMissions(): Mission[] {
  return getAllMissions()
    .filter(m => m.missionType === 'story')
    .sort((a, b) => a.requiredLevel - b.requiredLevel);
}

/**
 * Get side missions
 */
export function getSideMissions(): Mission[] {
  return getAllMissions()
    .filter(m => m.missionType !== 'story');
}
