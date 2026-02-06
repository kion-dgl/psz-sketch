#!/usr/bin/env node
/**
 * AI Regression Test CLI
 * Automated test runner for game flow verification
 *
 * Usage: npm run ai-test
 */

import { execute, getState, resetState } from './api-v2';
import { addItem, clearCombat, getGameState, setSessionData } from '../api';

interface TestCase {
  name: string;
  setup?: () => void;
  commands: Array<{
    cmd: string;
    expect?: {
      success?: boolean;
      messageContains?: string;
      messageNotContains?: string;
      stateCheck?: (state: ReturnType<typeof getState>) => boolean;
    };
  }>;
}

interface TestResult {
  name: string;
  passed: boolean;
  failures: string[];
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(color: keyof typeof COLORS, ...args: unknown[]) {
  console.log(COLORS[color], ...args, COLORS.reset);
}

// Telepipe item for testing
const TELEPIPE = {
  id: 'telepipe',
  name: 'Telepipe',
  description: 'Creates a portal back to the city.',
  type: 'consumable' as const,
  effect: 'telepipe',
  effectValue: 0,
  rarity: 1,
  sellPrice: 150,
  stackable: true,
  maxStack: 10,
};

// ============================================
// TEST DEFINITIONS
// ============================================

const tests: TestCase[] = [
  // ----------------------------------------
  // Character Creation
  // ----------------------------------------
  {
    name: 'Character Creation - Hunter',
    commands: [
      { cmd: 'create-character HUmar TestHunter', expect: { success: true, messageContains: 'Created' } },
      { cmd: 'show-stats', expect: { success: true, messageContains: 'TestHunter' } },
    ],
  },
  {
    name: 'Character Creation - Ranger',
    commands: [
      { cmd: 'create-character RAmar TestRanger', expect: { success: true, messageContains: 'Created' } },
    ],
  },
  {
    name: 'Character Creation - Force',
    commands: [
      { cmd: 'create-character FOmarl TestForce', expect: { success: true, messageContains: 'Created' } },
    ],
  },
  {
    name: 'Character Creation - Invalid class',
    commands: [
      { cmd: 'create-character InvalidClass Test', expect: { success: false, messageContains: 'Invalid class' } },
    ],
  },
  {
    name: 'List Characters',
    setup: () => {
      resetState();
      execute('create-character HUmar Slot0');
      execute('create-character RAmar Slot1');
    },
    commands: [
      { cmd: 'list-characters', expect: { success: true, messageContains: 'Slot 0' } },
      { cmd: 'list-characters', expect: { success: true, messageContains: 'Slot 1' } },
    ],
  },

  // ----------------------------------------
  // Equipment - Auto-equipped on creation
  // ----------------------------------------
  {
    name: 'Starter Weapon Auto-Equipped',
    commands: [
      { cmd: 'create-character HUmar EquipTest', expect: { success: true } },
      {
        cmd: 'show-equipment',
        expect: {
          success: true,
          messageContains: 'Saber',
        },
      },
    ],
  },
  {
    name: 'Starter Frame Auto-Equipped',
    commands: [
      { cmd: 'create-character HUmar FrameTest', expect: { success: true } },
      {
        cmd: 'show-equipment',
        expect: {
          success: true,
          messageContains: 'Frame',
        },
      },
    ],
  },

  // ----------------------------------------
  // Inventory
  // ----------------------------------------
  {
    name: 'Inventory shows equipped items',
    commands: [
      { cmd: 'create-character HUmar InvTest', expect: { success: true } },
      { cmd: 'show-inventory', expect: { success: true, messageContains: '[E]' } },
      { cmd: 'show-inventory', expect: { success: true, messageContains: '4/30' } }, // 2 equipped + 2 consumables
    ],
  },
  {
    name: 'Use consumable in city',
    commands: [
      { cmd: 'create-character HUmar UseTest', expect: { success: true } },
      { cmd: 'use monomate', expect: { success: true, messageContains: 'Used Monomate' } },
    ],
  },

  // ----------------------------------------
  // Combat - Damage Calculation
  // ----------------------------------------
  {
    name: 'Combat - Damage not NaN with starter weapon',
    commands: [
      { cmd: 'create-character HUmar CombatTest', expect: { success: true } },
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 0', expect: { success: true, messageNotContains: 'NaN' } },
    ],
  },
  {
    name: 'Combat - Can use consumable in field',
    commands: [
      { cmd: 'create-character HUmar FieldUseTest', expect: { success: true } },
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 0', expect: { success: true } }, // Take some damage
      { cmd: 'use monomate', expect: { success: true, messageContains: 'Healed' } },
    ],
  },
  {
    name: 'Combat - Can equip/unequip in field',
    commands: [
      { cmd: 'create-character HUmar FieldEquipTest', expect: { success: true } },
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'unequip weapon', expect: { success: true, messageContains: 'Unequipped' } },
      { cmd: 'equip starter_saber', expect: { success: true, messageContains: 'Equipped' } },
    ],
  },

  // ----------------------------------------
  // Mission Flow
  // ----------------------------------------
  {
    name: 'Mission - Cannot return without telepipe',
    commands: [
      { cmd: 'create-character HUmar ReturnTest', expect: { success: true } },
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'return', expect: { success: false, messageContains: 'Telepipe' } },
    ],
  },
  {
    name: 'Mission - Telepipe suspends and can resume',
    setup: () => {
      resetState();
      execute('create-character HUmar TelepipeTest');
      const charId = getState().character?.character_id;
      if (charId) addItem(charId, TELEPIPE, 1);
    },
    commands: [
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'use telepipe', expect: { success: true, messageContains: 'Telepipe activated' } },
      { cmd: 'show-stats', expect: { stateCheck: (s) => s.location === 'city' } },
      { cmd: 'show-stats', expect: { stateCheck: (s) => s.suspendedSession !== null } },
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'resume-mission', expect: { success: true, messageContains: 'Resumed' } },
      { cmd: 'show-stats', expect: { stateCheck: (s) => s.location === 'field' } },
    ],
  },
  {
    name: 'Mission - Cannot start new mission with suspended',
    setup: () => {
      resetState();
      execute('create-character HUmar SuspendTest');
      const charId = getState().character?.character_id;
      if (charId) addItem(charId, TELEPIPE, 1);
      execute('goto guild');
      execute('start-mission mayors-mission normal');
      execute('use telepipe');
    },
    commands: [
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: false } },
    ],
  },
  {
    name: 'Mission - Can abandon suspended mission',
    setup: () => {
      resetState();
      execute('create-character HUmar AbandonTest');
      const charId = getState().character?.character_id;
      if (charId) addItem(charId, TELEPIPE, 1);
      execute('goto guild');
      execute('start-mission mayors-mission normal');
      execute('use telepipe');
    },
    commands: [
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'abandon-mission', expect: { success: true, messageContains: 'Abandoned' } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
    ],
  },

  // ----------------------------------------
  // Wave/Stage Flow
  // ----------------------------------------
  {
    name: 'Wave - next-wave advances wave count',
    setup: () => {
      resetState();
      execute('create-character HUmar WaveTest');
      execute('goto guild');
      execute('start-mission mayors-mission normal');
      const charId = getState().character?.character_id;
      if (charId) clearCombat(charId);
    },
    commands: [
      { cmd: 'next-wave', expect: { success: true, messageContains: 'Wave 2' } },
    ],
  },
  {
    name: 'Wave - All waves cleared shows stage complete',
    setup: () => {
      resetState();
      execute('create-character HUmar StageTest');
      execute('goto guild');
      execute('start-mission mayors-mission normal');
      const charId = getState().character?.character_id;
      if (charId) {
        clearCombat(charId);
        // Set to wave 3 (last wave)
        const gs = getGameState(charId);
        if (gs?.sessionData) {
          gs.sessionData.currentWave = 3;
          setSessionData(charId, gs.sessionData);
        }
      }
    },
    commands: [
      { cmd: 'next-wave', expect: { success: false, messageContains: 'next-stage' } },
    ],
  },

  // ----------------------------------------
  // Field Flow
  // ----------------------------------------
  {
    name: 'Field - Can return freely (not mission)',
    commands: [
      { cmd: 'create-character HUmar FieldReturnTest', expect: { success: true } },
      { cmd: 'goto teleporter', expect: { success: true } },
      { cmd: 'enter-field forest normal', expect: { success: true } },
      { cmd: 'return', expect: { success: true, messageContains: 'Returned to city' } },
    ],
  },

  // ----------------------------------------
  // Shop Flow
  // ----------------------------------------
  {
    name: 'Shop - View items',
    commands: [
      { cmd: 'create-character HUmar ShopTest', expect: { success: true } },
      { cmd: 'goto shop', expect: { success: true } },
      { cmd: 'list-items', expect: { success: true, messageContains: 'Monomate' } },
    ],
  },
  {
    name: 'Weapon Shop - View items',
    commands: [
      { cmd: 'create-character HUmar WeaponShopTest', expect: { success: true } },
      { cmd: 'goto weapon-shop', expect: { success: true } },
      { cmd: 'list-items', expect: { success: true } },
    ],
  },

  // ----------------------------------------
  // Navigation
  // ----------------------------------------
  {
    name: 'Navigation - All city locations',
    commands: [
      { cmd: 'create-character HUmar NavTest', expect: { success: true } },
      { cmd: 'goto shop', expect: { success: true, stateCheck: (s) => s.location === 'shop' } },
      { cmd: 'goto city', expect: { success: true, stateCheck: (s) => s.location === 'city' } },
      { cmd: 'goto weapon-shop', expect: { success: true, stateCheck: (s) => s.location === 'weapon-shop' } },
      { cmd: 'goto city', expect: { success: true } },
      { cmd: 'goto guild', expect: { success: true, stateCheck: (s) => s.location === 'guild' } },
      { cmd: 'goto city', expect: { success: true } },
      { cmd: 'goto teleporter', expect: { success: true, stateCheck: (s) => s.location === 'teleporter' } },
      { cmd: 'goto storage', expect: { success: true, stateCheck: (s) => s.location === 'storage' } },
    ],
  },

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  {
    name: 'Edge - Attack invalid target',
    commands: [
      { cmd: 'create-character HUmar EdgeTest', expect: { success: true } },
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'start-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 99', expect: { success: false, messageContains: 'Invalid target' } },
    ],
  },
  {
    name: 'Edge - Equip non-existent item',
    commands: [
      { cmd: 'create-character HUmar EdgeTest2', expect: { success: true } },
      { cmd: 'equip fake_weapon_id', expect: { success: false, messageContains: 'not in inventory' } },
    ],
  },
  {
    name: 'Edge - Telepipe only works in field',
    setup: () => {
      resetState();
      execute('create-character HUmar TelepipeCityTest');
      const charId = getState().character?.character_id;
      if (charId) addItem(charId, TELEPIPE, 1);
    },
    commands: [
      { cmd: 'use telepipe', expect: { success: false, messageContains: 'only be used in the field' } },
    ],
  },
];

// ============================================
// TEST RUNNER
// ============================================

function runTest(test: TestCase): TestResult {
  const failures: string[] = [];

  // Reset state before each test
  resetState();

  // Run setup if provided
  if (test.setup) {
    test.setup();
  }

  for (const step of test.commands) {
    const result = execute(step.cmd);
    const state = getState();

    if (step.expect) {
      // Check success
      if (step.expect.success !== undefined && result.success !== step.expect.success) {
        failures.push(`[${step.cmd}] Expected success=${step.expect.success}, got ${result.success}: ${result.message}`);
        continue;
      }

      // Check message contains
      if (step.expect.messageContains && !result.message.includes(step.expect.messageContains)) {
        failures.push(`[${step.cmd}] Expected message to contain "${step.expect.messageContains}", got: ${result.message}`);
      }

      // Check message NOT contains
      if (step.expect.messageNotContains && result.message.includes(step.expect.messageNotContains)) {
        failures.push(`[${step.cmd}] Expected message NOT to contain "${step.expect.messageNotContains}", got: ${result.message}`);
      }

      // Check state
      if (step.expect.stateCheck && !step.expect.stateCheck(state)) {
        failures.push(`[${step.cmd}] State check failed. State: ${JSON.stringify({ location: state.location, suspendedSession: state.suspendedSession })}`);
      }
    }
  }

  return {
    name: test.name,
    passed: failures.length === 0,
    failures,
  };
}

function runAllTests(): void {
  console.log('\n' + '='.repeat(60));
  log('cyan', '  AI REGRESSION TEST SUITE');
  console.log('='.repeat(60) + '\n');

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = runTest(test);
    results.push(result);

    if (result.passed) {
      passed++;
      log('green', `  ✓ ${result.name}`);
    } else {
      failed++;
      log('red', `  ✗ ${result.name}`);
      for (const failure of result.failures) {
        log('dim', `      ${failure}`);
      }
    }
  }

  // Summary
  console.log('\n' + '-'.repeat(60));
  console.log(`\n  Total: ${tests.length} tests`);
  log('green', `  Passed: ${passed}`);
  if (failed > 0) {
    log('red', `  Failed: ${failed}`);
  }
  console.log('\n' + '='.repeat(60) + '\n');

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
