/**
 * Field System
 * Field registration, unlocking, and completion tracking
 */

import type {
  Field,
  FieldResult,
  FieldGrade,
  FieldItemDrop,
  FieldDropTable,
} from './types';
import type { Difficulty } from '../mission/types';
import {
  DIFFICULTY_EXP_MULTIPLIERS,
  DIFFICULTY_MESETA_MULTIPLIERS,
  GRADE_THRESHOLDS,
} from '../mission/types';

// Field database
const fields = new Map<string, Field>();

// Completed fields tracking per character
const completedFields = new Map<string, Set<string>>(); // characterId -> Set of fieldIds

/**
 * Register a field
 */
export function registerField(field: Field): void {
  fields.set(field.id, field);
}

/**
 * Get a field by ID
 */
export function getField(fieldId: string): Field | null {
  return fields.get(fieldId) ?? null;
}

/**
 * Get all fields
 */
export function getAllFields(): Field[] {
  return Array.from(fields.values());
}

/**
 * Check if field is unlocked for a character
 */
export function isFieldUnlocked(
  fieldId: string,
  characterId: string,
  characterLevel: number
): boolean {
  const field = getField(fieldId);
  if (!field) return false;

  // Check level requirement
  if (characterLevel < field.requiredLevel) {
    return false;
  }

  // Check unlock requirements
  if (field.unlockRequirements) {
    for (const req of field.unlockRequirements) {
      if (req.type === 'field' && req.id) {
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
 * Get available fields for a character
 */
export function getAvailableFields(
  characterId: string,
  characterLevel: number
): Field[] {
  return getAllFields().filter(field =>
    isFieldUnlocked(field.id, characterId, characterLevel)
  );
}

/**
 * Check if character has completed a field
 */
export function hasFieldCompleted(characterId: string, fieldId: string): boolean {
  const completed = completedFields.get(characterId);
  return completed?.has(fieldId) ?? false;
}

/**
 * Mark field as completed
 */
export function markFieldCompleted(characterId: string, fieldId: string): void {
  if (!completedFields.has(characterId)) {
    completedFields.set(characterId, new Set());
  }
  completedFields.get(characterId)!.add(fieldId);
}

/**
 * Get fields by area
 */
export function getFieldsByArea(areaId: string): Field[] {
  return getAllFields().filter(f => f.areaId === areaId);
}

/**
 * Get completion count for character
 */
export function getFieldCompletionCount(characterId: string): number {
  const completed = completedFields.get(characterId);
  return completed?.size ?? 0;
}

/**
 * Get all completed field IDs for a character (for persistence)
 */
export function getCompletedFields(characterId: string): string[] {
  const completed = completedFields.get(characterId);
  return completed ? Array.from(completed) : [];
}

/**
 * Restore completed fields for a character (from persistence)
 */
export function restoreCompletedFields(characterId: string, fieldIds: string[]): void {
  if (!fieldIds || fieldIds.length === 0) return;
  if (!completedFields.has(characterId)) {
    completedFields.set(characterId, new Set());
  }
  const completed = completedFields.get(characterId)!;
  for (const id of fieldIds) {
    completed.add(id);
  }
}

/**
 * Calculate field grade based on completion time
 */
export function calculateFieldGrade(actualTime: number, parTime: number): FieldGrade {
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
export function getFieldGradeBonus(grade: FieldGrade): number {
  return GRADE_THRESHOLDS[grade].bonus;
}

/**
 * Calculate experience reward for field
 */
export function calculateFieldExpReward(
  baseExp: number,
  difficulty: Difficulty,
  grade: FieldGrade
): number {
  const difficultyMultiplier = DIFFICULTY_EXP_MULTIPLIERS[difficulty];
  const gradeBonus = getFieldGradeBonus(grade);
  return Math.floor(baseExp * difficultyMultiplier * gradeBonus);
}

/**
 * Calculate meseta reward for field
 */
export function calculateFieldMesetaReward(
  baseMeseta: number,
  difficulty: Difficulty,
  grade: FieldGrade
): number {
  const difficultyMultiplier = DIFFICULTY_MESETA_MULTIPLIERS[difficulty];
  const gradeBonus = getFieldGradeBonus(grade);
  return Math.floor(baseMeseta * difficultyMultiplier * gradeBonus);
}

/**
 * Roll for item drops
 */
export function rollFieldItemDrops(
  items: FieldDropTable[] | undefined,
  seed?: number
): FieldItemDrop[] {
  if (!items || items.length === 0) return [];

  const drops: FieldItemDrop[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const roll = seed !== undefined
      ? ((seed + i * 37) % 100) / 100
      : Math.random();

    if (roll < item.chance) {
      drops.push({ itemId: item.itemId, quantity: item.quantity });
    }
  }

  return drops;
}

/**
 * Calculate field result
 */
export function calculateFieldResult(
  field: Field,
  difficulty: Difficulty,
  duration: number,
  stagesCompleted: number,
  baseExp: number,
  baseMeseta: number,
  dropTable?: FieldDropTable[],
  seed?: number
): FieldResult {
  const completed = stagesCompleted >= field.stageSequence.length;
  const durationSeconds = duration / 1000;
  const grade = completed ? calculateFieldGrade(durationSeconds, field.parTime) : 'D';

  const expGained = completed
    ? calculateFieldExpReward(baseExp, difficulty, grade)
    : 0;

  const mesetaGained = completed
    ? calculateFieldMesetaReward(baseMeseta, difficulty, grade)
    : Math.floor(baseMeseta * 0.1); // 10% consolation

  const itemsGained = completed
    ? rollFieldItemDrops(dropTable, seed)
    : [];

  return {
    fieldId: field.id,
    difficulty,
    completed,
    duration,
    stagesCompleted,
    expGained,
    mesetaGained,
    itemsGained,
    grade,
  };
}

/**
 * Clear all fields (for testing)
 */
export function clearFields(): void {
  fields.clear();
  completedFields.clear();
}
