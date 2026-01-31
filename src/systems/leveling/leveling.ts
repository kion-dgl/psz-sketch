/**
 * Leveling System
 * Experience and level progression logic
 */

import experienceTable from '../../content/experience/experience-table.json';

interface LevelEntry {
  level: number;
  totalExp: number;
  expToNext: number | null;
}

interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  currentExp: number;
  expToNextLevel: number | null;
  didLevelUp: boolean;
}

const levels: LevelEntry[] = experienceTable.levels;
const MAX_LEVEL = 100;
const MIN_LEVEL = 1;

/**
 * Get the level for a given total experience value
 */
export function getLevelForExp(totalExp: number): number {
  if (totalExp < 0) return MIN_LEVEL;

  // Find the highest level whose totalExp we've reached
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalExp >= levels[i].totalExp) {
      return levels[i].level;
    }
  }

  return MIN_LEVEL;
}

/**
 * Get the total experience required to reach a specific level
 */
export function getExpForLevel(level: number): number {
  if (level < MIN_LEVEL) return 0;
  if (level > MAX_LEVEL) return levels[MAX_LEVEL - 1].totalExp;

  const entry = levels.find(l => l.level === level);
  return entry?.totalExp ?? 0;
}

/**
 * Get the experience required to reach the next level from current exp
 */
export function getExpToNextLevel(currentExp: number): number | null {
  const currentLevel = getLevelForExp(currentExp);

  if (currentLevel >= MAX_LEVEL) {
    return null; // Max level reached
  }

  const nextLevelExp = getExpForLevel(currentLevel + 1);
  return nextLevelExp - currentExp;
}

/**
 * Get the experience required for the next level (from level start)
 */
export function getExpRequiredForLevel(level: number): number | null {
  if (level < MIN_LEVEL || level >= MAX_LEVEL) return null;

  const entry = levels.find(l => l.level === level);
  return entry?.expToNext ?? null;
}

/**
 * Calculate progress percentage to next level
 */
export function getLevelProgress(currentExp: number): number {
  const currentLevel = getLevelForExp(currentExp);

  if (currentLevel >= MAX_LEVEL) {
    return 100;
  }

  const levelStartExp = getExpForLevel(currentLevel);
  const levelEndExp = getExpForLevel(currentLevel + 1);
  const expInLevel = currentExp - levelStartExp;
  const expForLevel = levelEndExp - levelStartExp;

  return Math.floor((expInLevel / expForLevel) * 100);
}

/**
 * Apply experience gain to a character's current exp
 * Returns the result including any level ups
 */
export function applyExpGain(currentExp: number, expGained: number): LevelUpResult {
  if (expGained < 0) {
    throw new Error('Experience gain cannot be negative');
  }

  const previousLevel = getLevelForExp(currentExp);
  const newExp = currentExp + expGained;
  const newLevel = getLevelForExp(newExp);

  return {
    previousLevel,
    newLevel,
    levelsGained: newLevel - previousLevel,
    currentExp: newExp,
    expToNextLevel: getExpToNextLevel(newExp),
    didLevelUp: newLevel > previousLevel,
  };
}

/**
 * Get experience info for a character
 */
export function getExpInfo(currentExp: number): {
  level: number;
  currentExp: number;
  expToNextLevel: number | null;
  levelProgress: number;
  isMaxLevel: boolean;
} {
  const level = getLevelForExp(currentExp);

  return {
    level,
    currentExp,
    expToNextLevel: getExpToNextLevel(currentExp),
    levelProgress: getLevelProgress(currentExp),
    isMaxLevel: level >= MAX_LEVEL,
  };
}

/**
 * Calculate experience multiplier based on difficulty
 */
export function getExpMultiplier(difficulty: 'normal' | 'hard' | 'super-hard'): number {
  switch (difficulty) {
    case 'normal':
      return 1.0;
    case 'hard':
      return 1.5;
    case 'super-hard':
      return 2.0;
    default:
      return 1.0;
  }
}

/**
 * Calculate total exp with difficulty multiplier
 */
export function calculateTotalExp(
  baseExp: number,
  difficulty: 'normal' | 'hard' | 'super-hard'
): number {
  return Math.floor(baseExp * getExpMultiplier(difficulty));
}

/**
 * Get level cap for difficulty
 */
export function getLevelCap(difficulty: 'normal' | 'hard' | 'super-hard'): number {
  switch (difficulty) {
    case 'normal':
      return 50;
    case 'hard':
      return 80;
    case 'super-hard':
      return MAX_LEVEL;
    default:
      return 50;
  }
}

/**
 * Check if player meets level requirement for difficulty
 */
export function meetsLevelRequirement(
  level: number,
  difficulty: 'normal' | 'hard' | 'super-hard'
): boolean {
  switch (difficulty) {
    case 'normal':
      return level >= 1;
    case 'hard':
      return level >= 20;
    case 'super-hard':
      return level >= 50;
    default:
      return true;
  }
}

export { MAX_LEVEL, MIN_LEVEL };
