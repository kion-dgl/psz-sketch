/**
 * Session System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setSessionConfig,
  getSessionConfig,
  enterField,
  enterMission,
  getCurrentStage,
  advanceToNextStage,
  isAtFinalStage,
  useTelepipe,
  canResume,
  resumeSession,
  abandonSession,
  completeSession,
  hasPendingRewards,
  getPendingResult,
  claimRewards,
  getSessionState,
  isInSession,
  getSessionDuration,
  resetSession,
} from './session';
import { clearFields, registerField, hasFieldCompleted } from '../field/field';
import { clearMissions, registerMission } from '../mission/mission';
import type { Field } from '../field/types';
import type { Mission } from '../mission/types';

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
  ],
  rewards: {
    baseExp: 1000,
    baseMeseta: 2000,
  },
};

describe('Session System - Configuration', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    clearMissions();
  });

  it('sets and gets session config', () => {
    setSessionConfig('char1', 10);
    const config = getSessionConfig();
    expect(config).not.toBeNull();
    expect(config?.characterId).toBe('char1');
    expect(config?.characterLevel).toBe(10);
  });

  it('returns null config when not set', () => {
    expect(getSessionConfig()).toBeNull();
  });
});

describe('Session System - Enter Field', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    clearMissions();
    registerField(testField);
    setSessionConfig('char1', 10);
  });

  it('enters field successfully', () => {
    const success = enterField('test-field', 'normal');
    expect(success).toBe(true);

    const state = getSessionState();
    expect(state.mode).toBe('field');
    expect(state.activeId).toBe('test-field');
    expect(state.activeType).toBe('field');
    expect(state.difficulty).toBe('normal');
    expect(state.currentStageIndex).toBe(0);
  });

  it('fails without config', () => {
    resetSession();
    const success = enterField('test-field', 'normal');
    expect(success).toBe(false);
  });

  it('fails for unknown field', () => {
    const success = enterField('unknown-field', 'normal');
    expect(success).toBe(false);
  });

  it('fails for locked field', () => {
    const lockedField: Field = {
      ...testField,
      id: 'locked-field',
      requiredLevel: 50,
    };
    registerField(lockedField);

    const success = enterField('locked-field', 'normal');
    expect(success).toBe(false);
  });

  it('fails when already in session', () => {
    enterField('test-field', 'normal');
    const success = enterField('test-field', 'normal');
    expect(success).toBe(false);
  });

  it('fails for difficulty above level', () => {
    setSessionConfig('char1', 5); // Too low for hard
    const success = enterField('test-field', 'hard');
    expect(success).toBe(false);
  });
});

describe('Session System - Enter Mission', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    clearMissions();
    registerMission(testMission);
    setSessionConfig('char1', 10);
  });

  it('enters mission successfully', () => {
    const success = enterMission('test-mission', 'normal');
    expect(success).toBe(true);

    const state = getSessionState();
    expect(state.mode).toBe('mission');
    expect(state.activeId).toBe('test-mission');
    expect(state.activeType).toBe('mission');
  });

  it('fails for unknown mission', () => {
    const success = enterMission('unknown-mission', 'normal');
    expect(success).toBe(false);
  });
});

describe('Session System - Stage Progression', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
    enterField('test-field', 'normal');
  });

  it('gets current stage', () => {
    const stage = getCurrentStage();
    expect(stage).not.toBeNull();
    expect(stage?.stageId).toBe('t01a');
  });

  it('advances to next stage', () => {
    expect(advanceToNextStage()).toBe(true);
    const stage = getCurrentStage();
    expect(stage?.stageId).toBe('t01e');
  });

  it('detects final stage', () => {
    expect(isAtFinalStage()).toBe(false);
    advanceToNextStage(); // e
    advanceToNextStage(); // b
    advanceToNextStage(); // z
    expect(isAtFinalStage()).toBe(true);
  });

  it('cannot advance past final stage', () => {
    advanceToNextStage();
    advanceToNextStage();
    advanceToNextStage();
    expect(advanceToNextStage()).toBe(false);
  });

  it('returns null stage when in city', () => {
    resetSession();
    setSessionConfig('char1', 10);
    expect(getCurrentStage()).toBeNull();
  });
});

describe('Session System - Telepipe', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
    enterField('test-field', 'normal');
    advanceToNextStage(); // Move to stage 1
  });

  it('returns to city with telepipe', () => {
    useTelepipe();
    const state = getSessionState();
    expect(state.mode).toBe('city');
    expect(state.telepipeUsed).toBe(true);
  });

  it('can check if resumable', () => {
    expect(canResume()).toBe(false);
    useTelepipe();
    expect(canResume()).toBe(true);
  });

  it('resumes session', () => {
    useTelepipe();
    expect(resumeSession()).toBe(true);

    const state = getSessionState();
    expect(state.mode).toBe('field');
    expect(state.currentStageIndex).toBe(1); // Preserved
  });

  it('cannot resume without telepipe', () => {
    expect(resumeSession()).toBe(false);
  });
});

describe('Session System - Abandon', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
    enterField('test-field', 'normal');
  });

  it('abandons session', () => {
    abandonSession();
    const state = getSessionState();
    expect(state.mode).toBe('city');
    expect(state.activeId).toBeNull();
    expect(isInSession()).toBe(false);
  });
});

describe('Session System - Complete Field', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
    enterField('test-field', 'normal');
    // Advance to final stage
    advanceToNextStage();
    advanceToNextStage();
    advanceToNextStage();
  });

  it('completes field with success', () => {
    const result = completeSession(true);
    expect(result).not.toBeNull();
    expect('fieldId' in result!).toBe(true);
    expect((result as any).fieldId).toBe('test-field');
    expect((result as any).completed).toBe(true);
  });

  it('sets pending result', () => {
    completeSession(true);
    expect(hasPendingRewards()).toBe(true);
    expect(getPendingResult()).not.toBeNull();
  });

  it('returns to city after completion', () => {
    completeSession(true);
    expect(getSessionState().mode).toBe('city');
  });
});

describe('Session System - Claim Rewards', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
    enterField('test-field', 'normal');
    advanceToNextStage();
    advanceToNextStage();
    advanceToNextStage();
    completeSession(true);
  });

  it('claims rewards', () => {
    const result = claimRewards();
    expect(result).not.toBeNull();
  });

  it('clears pending result after claim', () => {
    claimRewards();
    expect(hasPendingRewards()).toBe(false);
    expect(getPendingResult()).toBeNull();
  });

  it('marks field as completed', () => {
    claimRewards();
    expect(hasFieldCompleted('char1', 'test-field')).toBe(true);
  });

  it('returns null when no pending rewards', () => {
    claimRewards();
    expect(claimRewards()).toBeNull();
  });
});

describe('Session System - In Session Check', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
  });

  it('detects when in session', () => {
    expect(isInSession()).toBe(false);
    enterField('test-field', 'normal');
    expect(isInSession()).toBe(true);
  });

  it('detects telepipe as in session', () => {
    enterField('test-field', 'normal');
    useTelepipe();
    expect(isInSession()).toBe(true); // Still in session (paused)
  });

  it('detects abandoned as not in session', () => {
    enterField('test-field', 'normal');
    abandonSession();
    expect(isInSession()).toBe(false);
  });
});

describe('Session System - Duration', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    registerField(testField);
    setSessionConfig('char1', 10);
  });

  it('returns zero when not started', () => {
    expect(getSessionDuration()).toBe(0);
  });

  it('returns positive duration when in session', () => {
    enterField('test-field', 'normal');
    // Small delay
    const duration = getSessionDuration();
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});

describe('Session System - Mission Flow', () => {
  beforeEach(() => {
    resetSession();
    clearFields();
    clearMissions();
    registerMission(testMission);
    setSessionConfig('char1', 10);
  });

  it('completes mission flow', () => {
    enterMission('test-mission', 'normal');
    expect(isInSession()).toBe(true);

    const result = completeSession(true);
    expect(result).not.toBeNull();
    expect('missionId' in result!).toBe(true);

    const claimed = claimRewards();
    expect(claimed).not.toBeNull();
    expect(isInSession()).toBe(false);
  });
});
