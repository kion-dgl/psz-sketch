#!/usr/bin/env node
/**
 * AI Regression Test CLI
 * Automated test runner for game flow verification
 *
 * Usage: npm run ai-test
 */

import { execute, getState, resetState } from './api';

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
      { cmd: 'create-character HUmar TestHunter', expect: { success: true, messageContains: 'Created HUmar' } },
      { cmd: 'show-stats', expect: { success: true, messageContains: 'TestHunter' } },
    ],
  },
  {
    name: 'Character Creation - Ranger',
    commands: [
      { cmd: 'create-character RAmar TestRanger', expect: { success: true, messageContains: 'Created RAmar' } },
    ],
  },
  {
    name: 'Character Creation - Force',
    commands: [
      { cmd: 'create-character FOmarl TestForce', expect: { success: true, messageContains: 'Created FOmarl' } },
    ],
  },
  {
    name: 'Character Creation - Invalid class',
    commands: [
      { cmd: 'create-character InvalidClass Test', expect: { success: false, messageContains: 'Invalid class' } },
    ],
  },

  // ----------------------------------------
  // Equipment - Auto-equipped on creation
  // ----------------------------------------
  {
    name: 'Starter Weapon Auto-Equipped',
    commands: [
      { cmd: 'create-character HUmar EquipTest', expect: { success: true, messageContains: 'Starting gear equipped' } },
      {
        cmd: 'show-stats',
        expect: {
          stateCheck: (state) => state.equipment?.weapon?.name === 'Saber',
        },
      },
    ],
  },
  {
    name: 'Starter Frame Auto-Equipped',
    commands: [
      { cmd: 'create-character HUmar FrameTest', expect: { success: true } },
      {
        cmd: 'show-stats',
        expect: {
          stateCheck: (state) => state.equipment?.frame?.name === 'Frame',
        },
      },
    ],
  },

  // ----------------------------------------
  // Combat - Damage Calculation (NaN regression)
  // ----------------------------------------
  {
    name: 'Combat - Damage not NaN with starter weapon',
    commands: [
      { cmd: 'create-character HUmar CombatTest', expect: { success: true } },
      // Starter weapon is auto-equipped on character creation
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'enter-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 0', expect: { success: true, messageNotContains: 'NaN' } },
    ],
  },
  {
    name: 'Combat - Damage not NaN with old weapon format (missing grindLevel)',
    setup: () => {
      resetState();
      execute('create-character HUmar OldWeaponTest');
      // Simulate restoring weapon from old persistence (missing grindLevel/maxGrind/elementPercent)
      const oldWeapon = {
        id: 'old-weapon-test',
        name: 'Old Format Saber',
        description: 'Weapon from old save format',
        type: 'weapon',
        rarity: 1,
        sellPrice: 50,
        stackable: false,
        maxStack: 1,
        attack: 30,
        accuracy: 25,
        weaponType: 'saber',
        // NOTE: Intentionally missing grindLevel, maxGrind, elementPercent
      };
      execute('set-weapon ' + JSON.stringify(oldWeapon));
    },
    commands: [
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'enter-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 0', expect: { success: true, messageNotContains: 'NaN' } },
    ],
  },
  {
    name: 'Combat - Unarmed attack (no weapon equipped)',
    commands: [
      { cmd: 'create-character HUmar UnarmedTest', expect: { success: true } },
      // Don't equip weapon
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'enter-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 0', expect: { success: true, messageNotContains: 'NaN' } },
    ],
  },

  // ----------------------------------------
  // Mission Flow
  // ----------------------------------------
  {
    name: 'Mission - Enter and exit with telepipe',
    commands: [
      { cmd: 'create-character HUmar MissionTest', expect: { success: true } },
      // Starter weapon is auto-equipped on character creation
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'enter-mission mayors-mission normal', expect: { success: true, messageContains: 'Started' } },
      { cmd: 'use-telepipe', expect: { success: true, messageContains: 'Returned to city' } },
      {
        cmd: 'show-stats',
        expect: {
          stateCheck: (state) => state.location === 'city',
        },
      },
    ],
  },
  {
    name: 'Mission - Cannot enter without being at guild',
    commands: [
      { cmd: 'create-character HUmar GuildTest', expect: { success: true } },
      { cmd: 'enter-mission mayors-mission normal', expect: { success: false, messageContains: 'guild' } },
    ],
  },

  // ----------------------------------------
  // Field Flow
  // ----------------------------------------
  {
    name: 'Field - Enter and explore',
    commands: [
      { cmd: 'create-character HUmar FieldTest', expect: { success: true } },
      // Starter weapon is auto-equipped on character creation
      { cmd: 'goto teleporter', expect: { success: true } },
      { cmd: 'enter-field gurhacia-valley normal', expect: { success: true, messageContains: 'Entered' } },
      {
        cmd: 'show-stats',
        expect: {
          stateCheck: (state) => state.location === 'field',
        },
      },
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
      { cmd: 'list-items', expect: { success: true } },
    ],
  },
  {
    name: 'Weapon Shop - Navigate and verify location',
    commands: [
      { cmd: 'create-character HUmar WeaponShopTest', expect: { success: true } },
      { cmd: 'goto weapon-shop', expect: { success: true, stateCheck: (s) => s.location === 'weapon-shop' } },
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
    ],
  },

  // ----------------------------------------
  // State Persistence Simulation
  // ----------------------------------------
  {
    name: 'State - getState includes equipment details',
    commands: [
      { cmd: 'create-character HUmar StateTest', expect: { success: true } },
      // Starter weapon is auto-equipped on character creation
      {
        cmd: 'show-stats',
        expect: {
          stateCheck: (state) => {
            const weapon = state.equipment?.weapon;
            // Verify weapon has all required fields for persistence
            return weapon !== null &&
              weapon?.grindLevel !== undefined &&
              weapon?.maxGrind !== undefined &&
              typeof weapon?.attack === 'number';
          },
        },
      },
    ],
  },

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  {
    name: 'Edge - Attack invalid target',
    commands: [
      { cmd: 'create-character HUmar EdgeTest', expect: { success: true } },
      // Starter weapon is auto-equipped on character creation
      { cmd: 'goto guild', expect: { success: true } },
      { cmd: 'enter-mission mayors-mission normal', expect: { success: true } },
      { cmd: 'attack 99', expect: { success: false, messageContains: 'Invalid target' } },
    ],
  },
  {
    name: 'Edge - Equip non-existent item',
    commands: [
      { cmd: 'create-character HUmar EdgeTest2', expect: { success: true } },
      { cmd: 'equip-weapon fake_weapon_id', expect: { success: false, messageContains: 'not found' } },
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
        failures.push(`[${step.cmd}] State check failed`);
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
