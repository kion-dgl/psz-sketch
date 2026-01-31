/**
 * Mission System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerMission,
  getMission,
  getAllMissions,
  isMissionUnlocked,
  getAvailableMissions,
  hasMissionCompleted,
  markMissionCompleted,
  getMissionsByArea,
  startMission,
  getActiveMission,
  updateObjective,
  calculateGrade,
  getGradeBonus,
  calculateExpReward,
  calculateMesetaReward,
  rollItemRewards,
  completeMission,
  abandonMission,
  getCompletionCount,
  getRecommendedDifficulty,
  meetsLevelForDifficulty,
  clearMissions,
  initializeDefaultMissions,
} from './mission';
import type { Mission, RewardItem } from './types';
import { GRADE_THRESHOLDS } from './types';

const testMission: Mission = {
  id: 'test-mission',
  name: 'Test Mission',
  description: 'A test mission',
  areaId: 'test-area',
  requiredLevel: 1,
  recommendedLevel: 5,
  partySize: 4,
  objectives: [
    { id: 'obj1', type: 'defeat', target: 'enemy', count: 5, description: 'Defeat 5 enemies' },
    { id: 'obj2', type: 'reach', target: 'goal', description: 'Reach the goal' },
  ],
  rewards: {
    baseExp: 1000,
    baseMeseta: 2000,
    items: [
      { itemId: 'reward1', quantity: 1, chance: 0.5 },
      { itemId: 'reward2', quantity: 3, chance: 0.25 },
    ],
  },
};

const lockedMission: Mission = {
  id: 'locked-mission',
  name: 'Locked Mission',
  description: 'A locked mission',
  areaId: 'test-area',
  requiredLevel: 10,
  recommendedLevel: 15,
  partySize: 4,
  objectives: [
    { id: 'obj1', type: 'defeat', target: 'boss', count: 1, description: 'Defeat boss' },
  ],
  rewards: {
    baseExp: 2000,
    baseMeseta: 4000,
  },
  unlockRequirements: [
    { type: 'mission', id: 'test-mission' },
  ],
};

describe('Mission System - Registration', () => {
  beforeEach(() => {
    clearMissions();
  });

  it('registers and retrieves mission', () => {
    registerMission(testMission);
    const mission = getMission('test-mission');
    expect(mission).not.toBeNull();
    expect(mission?.name).toBe('Test Mission');
  });

  it('returns null for unknown mission', () => {
    const mission = getMission('nonexistent');
    expect(mission).toBeNull();
  });

  it('gets all missions', () => {
    registerMission(testMission);
    registerMission(lockedMission);
    const all = getAllMissions();
    expect(all).toHaveLength(2);
  });

  it('gets missions by area', () => {
    registerMission(testMission);
    registerMission({ ...lockedMission, areaId: 'other-area' });
    const missions = getMissionsByArea('test-area');
    expect(missions).toHaveLength(1);
    expect(missions[0].id).toBe('test-mission');
  });
});

describe('Mission System - Unlock Requirements', () => {
  beforeEach(() => {
    clearMissions();
    registerMission(testMission);
    registerMission(lockedMission);
  });

  it('unlocks mission when level met', () => {
    expect(isMissionUnlocked('test-mission', 'char1', 1)).toBe(true);
    expect(isMissionUnlocked('test-mission', 'char1', 0)).toBe(false);
  });

  it('locks mission when prerequisite not complete', () => {
    expect(isMissionUnlocked('locked-mission', 'char1', 50)).toBe(false);
  });

  it('unlocks mission when prerequisite complete', () => {
    markMissionCompleted('char1', 'test-mission');
    expect(isMissionUnlocked('locked-mission', 'char1', 50)).toBe(true);
  });

  it('gets available missions for character', () => {
    const missions = getAvailableMissions('char1', 50);
    expect(missions).toHaveLength(1);
    expect(missions[0].id).toBe('test-mission');

    markMissionCompleted('char1', 'test-mission');
    const missionsAfter = getAvailableMissions('char1', 50);
    expect(missionsAfter).toHaveLength(2);
  });
});

describe('Mission System - Completion Tracking', () => {
  beforeEach(() => {
    clearMissions();
    registerMission(testMission);
  });

  it('tracks mission completion', () => {
    expect(hasMissionCompleted('char1', 'test-mission')).toBe(false);
    markMissionCompleted('char1', 'test-mission');
    expect(hasMissionCompleted('char1', 'test-mission')).toBe(true);
  });

  it('tracks completion count', () => {
    expect(getCompletionCount('char1')).toBe(0);
    markMissionCompleted('char1', 'test-mission');
    expect(getCompletionCount('char1')).toBe(1);
    markMissionCompleted('char1', 'another-mission');
    expect(getCompletionCount('char1')).toBe(2);
  });

  it('separates completion by character', () => {
    markMissionCompleted('char1', 'test-mission');
    expect(hasMissionCompleted('char1', 'test-mission')).toBe(true);
    expect(hasMissionCompleted('char2', 'test-mission')).toBe(false);
  });
});

describe('Mission System - Active Mission', () => {
  beforeEach(() => {
    clearMissions();
    registerMission(testMission);
  });

  it('starts mission', () => {
    const progress = startMission('test-mission', 'normal');
    expect(progress).not.toBeNull();
    expect(progress?.missionId).toBe('test-mission');
    expect(progress?.difficulty).toBe('normal');
    expect(progress?.completed).toBe(false);
  });

  it('initializes objectives', () => {
    const progress = startMission('test-mission', 'normal');
    expect(progress?.objectives).toHaveLength(2);
    expect(progress?.objectives[0].current).toBe(0);
    expect(progress?.objectives[0].target).toBe(5);
  });

  it('gets active mission', () => {
    startMission('test-mission', 'hard');
    const active = getActiveMission();
    expect(active).not.toBeNull();
    expect(active?.difficulty).toBe('hard');
  });

  it('abandons mission', () => {
    startMission('test-mission', 'normal');
    expect(getActiveMission()).not.toBeNull();
    abandonMission();
    expect(getActiveMission()).toBeNull();
  });
});

describe('Mission System - Objective Progress', () => {
  beforeEach(() => {
    clearMissions();
    registerMission(testMission);
    startMission('test-mission', 'normal');
  });

  it('updates objective progress', () => {
    updateObjective('obj1', 2);
    const active = getActiveMission();
    expect(active?.objectives[0].current).toBe(2);
    expect(active?.objectives[0].completed).toBe(false);
  });

  it('marks objective complete at target', () => {
    updateObjective('obj1', 5);
    const active = getActiveMission();
    expect(active?.objectives[0].completed).toBe(true);
  });

  it('caps progress at target', () => {
    updateObjective('obj1', 10);
    const active = getActiveMission();
    expect(active?.objectives[0].current).toBe(5);
  });

  it('marks mission complete when all objectives done', () => {
    updateObjective('obj1', 5);
    expect(getActiveMission()?.completed).toBe(false);

    updateObjective('obj2', 1);
    expect(getActiveMission()?.completed).toBe(true);
  });
});

describe('Mission System - Grade Calculation', () => {
  it('calculates S grade', () => {
    expect(calculateGrade(100, 300)).toBe('S'); // 33% of par
  });

  it('calculates A grade', () => {
    expect(calculateGrade(200, 300)).toBe('A'); // 67% of par
  });

  it('calculates B grade', () => {
    expect(calculateGrade(300, 300)).toBe('B'); // 100% of par
  });

  it('calculates C grade', () => {
    expect(calculateGrade(400, 300)).toBe('C'); // 133% of par
  });

  it('calculates D grade', () => {
    expect(calculateGrade(600, 300)).toBe('D'); // 200% of par
  });

  it('returns correct grade bonuses', () => {
    expect(getGradeBonus('S')).toBe(GRADE_THRESHOLDS.S.bonus);
    expect(getGradeBonus('A')).toBe(GRADE_THRESHOLDS.A.bonus);
    expect(getGradeBonus('B')).toBe(GRADE_THRESHOLDS.B.bonus);
    expect(getGradeBonus('C')).toBe(GRADE_THRESHOLDS.C.bonus);
    expect(getGradeBonus('D')).toBe(GRADE_THRESHOLDS.D.bonus);
  });
});

describe('Mission System - Reward Calculation', () => {
  it('calculates exp reward with difficulty and grade', () => {
    const base = 1000;

    // Normal, B grade
    expect(calculateExpReward(base, 'normal', 'B')).toBe(1000);

    // Hard, B grade
    expect(calculateExpReward(base, 'hard', 'B')).toBe(1500);

    // Super-hard, B grade
    expect(calculateExpReward(base, 'super-hard', 'B')).toBe(2000);

    // Normal, S grade
    expect(calculateExpReward(base, 'normal', 'S')).toBe(1500);
  });

  it('calculates meseta reward', () => {
    const base = 2000;

    expect(calculateMesetaReward(base, 'normal', 'B')).toBe(2000);
    expect(calculateMesetaReward(base, 'hard', 'B')).toBe(4000);
    expect(calculateMesetaReward(base, 'super-hard', 'B')).toBe(6000);
  });
});

describe('Mission System - Item Rewards', () => {
  const items: RewardItem[] = [
    { itemId: 'item1', quantity: 1, chance: 0.5 },
    { itemId: 'item2', quantity: 2, chance: 0.25 },
  ];

  it('rolls item rewards with deterministic seed', () => {
    const rewards = rollItemRewards(items, 25); // 25% chance
    // Seed 25: first roll = 25/100 = 0.25 < 0.5 (drop), second roll = (25+37)/100 = 0.62 > 0.25 (no drop)
    expect(rewards).toHaveLength(1);
    expect(rewards[0].itemId).toBe('item1');
  });

  it('returns empty for no items', () => {
    expect(rollItemRewards(undefined)).toHaveLength(0);
    expect(rollItemRewards([])).toHaveLength(0);
  });
});

describe('Mission System - Complete Mission', () => {
  beforeEach(() => {
    clearMissions();
    registerMission(testMission);
    startMission('test-mission', 'normal');
    updateObjective('obj1', 5);
    updateObjective('obj2', 1);
  });

  it('completes mission with success', () => {
    const result = completeMission('char1', true, 200, 300, 25);
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.grade).toBe('A');
    expect(result?.expGained).toBeGreaterThan(0);
    expect(result?.mesetaGained).toBeGreaterThan(0);
  });

  it('marks mission as completed on success', () => {
    completeMission('char1', true, 200, 300);
    expect(hasMissionCompleted('char1', 'test-mission')).toBe(true);
  });

  it('does not mark complete on failure', () => {
    completeMission('char1', false, 500, 300);
    expect(hasMissionCompleted('char1', 'test-mission')).toBe(false);
  });

  it('gives reduced meseta on failure', () => {
    const result = completeMission('char1', false, 500, 300);
    expect(result?.success).toBe(false);
    expect(result?.expGained).toBe(0);
    expect(result?.mesetaGained).toBe(200); // 10% of base
    expect(result?.itemsGained).toHaveLength(0);
  });

  it('clears active mission after completion', () => {
    completeMission('char1', true, 200, 300);
    expect(getActiveMission()).toBeNull();
  });
});

describe('Mission System - Difficulty', () => {
  it('recommends difficulty based on level', () => {
    expect(getRecommendedDifficulty(5, 5)).toBe('normal');
    expect(getRecommendedDifficulty(15, 5)).toBe('hard');
    expect(getRecommendedDifficulty(25, 5)).toBe('super-hard');
  });

  it('checks level requirement for difficulty', () => {
    expect(meetsLevelForDifficulty(1, 'normal')).toBe(true);
    expect(meetsLevelForDifficulty(1, 'hard')).toBe(false);
    expect(meetsLevelForDifficulty(20, 'hard')).toBe(true);
    expect(meetsLevelForDifficulty(20, 'super-hard')).toBe(false);
    expect(meetsLevelForDifficulty(50, 'super-hard')).toBe(true);
  });
});

describe('Mission System - Default Missions', () => {
  beforeEach(() => {
    clearMissions();
  });

  it('initializes default missions', () => {
    initializeDefaultMissions();
    const all = getAllMissions();
    expect(all.length).toBeGreaterThan(0);
  });

  it('includes mayors mission', () => {
    initializeDefaultMissions();
    const mission = getMission('mayors-mission');
    expect(mission).not.toBeNull();
    expect(mission?.name).toBe("Mayor's Mission");
  });

  it('sets up mission chain unlock requirements', () => {
    initializeDefaultMissions();
    const thirdDaughter = getMission('third-daughter');
    expect(thirdDaughter?.unlockRequirements).toBeDefined();
    expect(thirdDaughter?.unlockRequirements?.some(r => r.id === 'mayors-mission')).toBe(true);
  });
});
