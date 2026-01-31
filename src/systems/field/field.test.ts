/**
 * Field System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerField,
  getField,
  getAllFields,
  isFieldUnlocked,
  getAvailableFields,
  hasFieldCompleted,
  markFieldCompleted,
  getFieldsByArea,
  getFieldCompletionCount,
  calculateFieldGrade,
  getFieldGradeBonus,
  calculateFieldExpReward,
  calculateFieldMesetaReward,
  rollFieldItemDrops,
  calculateFieldResult,
  clearFields,
} from './field';
import { initializeDefaultFields, FIELD_REWARDS } from './default-fields';
import type { Field, FieldDropTable } from './types';
import { GRADE_THRESHOLDS } from '../mission/types';

const testField: Field = {
  id: 'test-field',
  name: 'Test Field',
  description: 'A test field',
  areaId: 'test-area',
  requiredLevel: 1,
  recommendedLevel: 5,
  parTime: 300,
  stageSequence: [
    { stageId: 't01a', variant: 'a', areaId: 'test-area' },
    { stageId: 't01e', variant: 'e', areaId: 'test-area' },
    { stageId: 't01b', variant: 'b', areaId: 'test-area' },
    { stageId: 't01z', variant: 'z', areaId: 'test-area' },
  ],
  bossId: 'test-boss',
};

const lockedField: Field = {
  id: 'locked-field',
  name: 'Locked Field',
  description: 'A locked field',
  areaId: 'test-area',
  requiredLevel: 10,
  recommendedLevel: 15,
  parTime: 420,
  stageSequence: [
    { stageId: 'l01a', variant: 'a', areaId: 'test-area' },
    { stageId: 'l01z', variant: 'z', areaId: 'test-area' },
  ],
  unlockRequirements: [
    { type: 'field', id: 'test-field' },
  ],
};

describe('Field System - Registration', () => {
  beforeEach(() => {
    clearFields();
  });

  it('registers and retrieves field', () => {
    registerField(testField);
    const field = getField('test-field');
    expect(field).not.toBeNull();
    expect(field?.name).toBe('Test Field');
  });

  it('returns null for unknown field', () => {
    const field = getField('nonexistent');
    expect(field).toBeNull();
  });

  it('gets all fields', () => {
    registerField(testField);
    registerField(lockedField);
    const all = getAllFields();
    expect(all).toHaveLength(2);
  });

  it('gets fields by area', () => {
    registerField(testField);
    registerField({ ...lockedField, areaId: 'other-area' });
    const fields = getFieldsByArea('test-area');
    expect(fields).toHaveLength(1);
    expect(fields[0].id).toBe('test-field');
  });
});

describe('Field System - Unlock Requirements', () => {
  beforeEach(() => {
    clearFields();
    registerField(testField);
    registerField(lockedField);
  });

  it('unlocks field when level met', () => {
    expect(isFieldUnlocked('test-field', 'char1', 1)).toBe(true);
    expect(isFieldUnlocked('test-field', 'char1', 0)).toBe(false);
  });

  it('locks field when prerequisite not complete', () => {
    expect(isFieldUnlocked('locked-field', 'char1', 50)).toBe(false);
  });

  it('unlocks field when prerequisite complete', () => {
    markFieldCompleted('char1', 'test-field');
    expect(isFieldUnlocked('locked-field', 'char1', 50)).toBe(true);
  });

  it('requires both level and prerequisite', () => {
    markFieldCompleted('char1', 'test-field');
    expect(isFieldUnlocked('locked-field', 'char1', 5)).toBe(false); // Level too low
    expect(isFieldUnlocked('locked-field', 'char1', 10)).toBe(true);
  });

  it('gets available fields for character', () => {
    const fields = getAvailableFields('char1', 50);
    expect(fields).toHaveLength(1);
    expect(fields[0].id).toBe('test-field');

    markFieldCompleted('char1', 'test-field');
    const fieldsAfter = getAvailableFields('char1', 50);
    expect(fieldsAfter).toHaveLength(2);
  });
});

describe('Field System - Completion Tracking', () => {
  beforeEach(() => {
    clearFields();
    registerField(testField);
  });

  it('tracks field completion', () => {
    expect(hasFieldCompleted('char1', 'test-field')).toBe(false);
    markFieldCompleted('char1', 'test-field');
    expect(hasFieldCompleted('char1', 'test-field')).toBe(true);
  });

  it('tracks completion count', () => {
    expect(getFieldCompletionCount('char1')).toBe(0);
    markFieldCompleted('char1', 'test-field');
    expect(getFieldCompletionCount('char1')).toBe(1);
    markFieldCompleted('char1', 'another-field');
    expect(getFieldCompletionCount('char1')).toBe(2);
  });

  it('separates completion by character', () => {
    markFieldCompleted('char1', 'test-field');
    expect(hasFieldCompleted('char1', 'test-field')).toBe(true);
    expect(hasFieldCompleted('char2', 'test-field')).toBe(false);
  });
});

describe('Field System - Grade Calculation', () => {
  it('calculates S grade', () => {
    expect(calculateFieldGrade(100, 300)).toBe('S'); // 33% of par
  });

  it('calculates A grade', () => {
    expect(calculateFieldGrade(200, 300)).toBe('A'); // 67% of par
  });

  it('calculates B grade', () => {
    expect(calculateFieldGrade(300, 300)).toBe('B'); // 100% of par
  });

  it('calculates C grade', () => {
    expect(calculateFieldGrade(400, 300)).toBe('C'); // 133% of par
  });

  it('calculates D grade', () => {
    expect(calculateFieldGrade(600, 300)).toBe('D'); // 200% of par
  });

  it('returns correct grade bonuses', () => {
    expect(getFieldGradeBonus('S')).toBe(GRADE_THRESHOLDS.S.bonus);
    expect(getFieldGradeBonus('A')).toBe(GRADE_THRESHOLDS.A.bonus);
    expect(getFieldGradeBonus('B')).toBe(GRADE_THRESHOLDS.B.bonus);
    expect(getFieldGradeBonus('C')).toBe(GRADE_THRESHOLDS.C.bonus);
    expect(getFieldGradeBonus('D')).toBe(GRADE_THRESHOLDS.D.bonus);
  });
});

describe('Field System - Reward Calculation', () => {
  it('calculates exp reward with difficulty and grade', () => {
    const base = 1000;

    // Normal, B grade
    expect(calculateFieldExpReward(base, 'normal', 'B')).toBe(1000);

    // Hard, B grade
    expect(calculateFieldExpReward(base, 'hard', 'B')).toBe(1500);

    // Super-hard, B grade
    expect(calculateFieldExpReward(base, 'super-hard', 'B')).toBe(2000);

    // Normal, S grade
    expect(calculateFieldExpReward(base, 'normal', 'S')).toBe(1500);
  });

  it('calculates meseta reward', () => {
    const base = 2000;

    expect(calculateFieldMesetaReward(base, 'normal', 'B')).toBe(2000);
    expect(calculateFieldMesetaReward(base, 'hard', 'B')).toBe(4000);
    expect(calculateFieldMesetaReward(base, 'super-hard', 'B')).toBe(6000);
  });
});

describe('Field System - Item Drops', () => {
  const items: FieldDropTable[] = [
    { itemId: 'item1', quantity: 1, chance: 0.5 },
    { itemId: 'item2', quantity: 2, chance: 0.25 },
  ];

  it('rolls item drops with deterministic seed', () => {
    const drops = rollFieldItemDrops(items, 25);
    // Seed 25: first roll = 25/100 = 0.25 < 0.5 (drop), second roll = (25+37)/100 = 0.62 > 0.25 (no drop)
    expect(drops).toHaveLength(1);
    expect(drops[0].itemId).toBe('item1');
  });

  it('returns empty for no items', () => {
    expect(rollFieldItemDrops(undefined)).toHaveLength(0);
    expect(rollFieldItemDrops([])).toHaveLength(0);
  });
});

describe('Field System - Calculate Result', () => {
  beforeEach(() => {
    clearFields();
    registerField(testField);
  });

  it('calculates result for completed field', () => {
    const result = calculateFieldResult(
      testField,
      'normal',
      180000, // 180 seconds (3 minutes)
      4, // All 4 stages
      500,
      1000,
      [{ itemId: 'monomate', quantity: 3, chance: 1.0 }],
      50
    );

    expect(result.completed).toBe(true);
    expect(result.grade).toBe('A'); // 60% of par time
    expect(result.expGained).toBeGreaterThan(0);
    expect(result.mesetaGained).toBeGreaterThan(0);
    expect(result.itemsGained).toHaveLength(1);
  });

  it('calculates result for incomplete field', () => {
    const result = calculateFieldResult(
      testField,
      'normal',
      60000,
      2, // Only 2 stages
      500,
      1000
    );

    expect(result.completed).toBe(false);
    expect(result.grade).toBe('D');
    expect(result.expGained).toBe(0);
    expect(result.mesetaGained).toBe(100); // 10% consolation
    expect(result.itemsGained).toHaveLength(0);
  });
});

describe('Field System - Default Fields', () => {
  beforeEach(() => {
    clearFields();
  });

  it('initializes default fields', () => {
    initializeDefaultFields();
    const all = getAllFields();
    expect(all.length).toBeGreaterThan(0);
  });

  it('includes gurhacia valley', () => {
    initializeDefaultFields();
    const field = getField('gurhacia-valley');
    expect(field).not.toBeNull();
    expect(field?.name).toBe('Gurhacia Valley');
  });

  it('sets up field chain unlock requirements', () => {
    initializeDefaultFields();
    const rioh = getField('rioh-snowfield');
    expect(rioh?.unlockRequirements).toBeDefined();
    expect(rioh?.unlockRequirements?.some(r => r.id === 'gurhacia-valley')).toBe(true);
  });

  it('has stage sequence with all variants', () => {
    initializeDefaultFields();
    const field = getField('gurhacia-valley');
    expect(field?.stageSequence).toHaveLength(4);
    expect(field?.stageSequence.map(s => s.variant)).toEqual(['a', 'e', 'b', 'z']);
  });

  it('has rewards defined for each field', () => {
    expect(FIELD_REWARDS['gurhacia-valley']).toBeDefined();
    expect(FIELD_REWARDS['rioh-snowfield']).toBeDefined();
    expect(FIELD_REWARDS['ozette-wetlands']).toBeDefined();
  });
});
