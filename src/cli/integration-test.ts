#!/usr/bin/env node
/**
 * Comprehensive Integration Test
 * Tests full game flow with multiple classes, leveling, equipment, shops
 */

import { execute, getState, resetState } from './api-v2';
import { getClassStatsAtLevel } from '../data/content-loader';

console.log('='.repeat(60));
console.log('COMPREHENSIVE INTEGRATION TEST');
console.log('='.repeat(60));

// Reset for clean slate
resetState();

// ========================================
// Test 1: Create 3 different class types
// ========================================
console.log('\n--- Creating Characters ---');

const classes = ['HUmar', 'RAmar', 'FOmarl'];
for (const cls of classes) {
  resetState();
  const result = execute(`create-character ${cls} Test${cls}`);
  console.log(`Create ${cls}: ${result.success ? 'OK' : 'FAIL - ' + result.message}`);

  // Show class stats
  const classStats = getClassStatsAtLevel(cls, 1);
  if (classStats) {
    console.log(`  Level 1 Stats: HP ${classStats.hp}, ATK ${classStats.attack}, ACC ${classStats.accuracy}, DEF ${classStats.defense}, MST ${classStats.technique}`);
  }
}

// ========================================
// Test 2: Level a character to 10+
// ========================================
console.log('\n--- Leveling Test ---');
resetState();
execute('create-character HUmar LevelTest');

let missionsCompleted = 0;
let currentLevel = 1;

while (currentLevel < 10 && missionsCompleted < 5) {
  // Start mission
  execute('goto guild');
  const missionResult = execute('start-mission mayors-mission normal');
  if (!missionResult.success) {
    console.log('Failed to start mission:', missionResult.message);
    break;
  }

  // Fight through all stages
  for (let stage = 1; stage <= 3; stage++) {
    for (let wave = 1; wave <= 3; wave++) {
      // Attack until wave cleared
      let attacks = 0;
      while (attacks < 20) {
        const attackResult = execute('attack 0');
        if (!attackResult.success) break;
        attacks++;

        // Check if we need healing
        const state = getState();
        if (state.playerHP && state.maxHP) {
          const hpPercent = state.playerHP / state.maxHP;
          if (hpPercent < 0.3) {
            execute('use monomate');
          }
        }
      }

      // Try next wave
      const nextWaveResult = execute('next-wave');
      if (!nextWaveResult.success && nextWaveResult.message.includes('next-stage')) {
        break;
      }
    }

    // Next stage
    const nextStageResult = execute('next-stage');
    if (!nextStageResult.success) {
      if (nextStageResult.message.includes('completed')) {
        break;
      }
    }
  }

  missionsCompleted++;

  const char = getState().character;
  currentLevel = char?.level ?? 1;
  console.log(`After mission ${missionsCompleted}: Level ${char?.level}, EXP ${char?.experience}`);
}

const finalChar = getState().character;
console.log(`Final: Level ${finalChar?.level}, Missions: ${missionsCompleted}`);

// ========================================
// Test 3: Equipment system
// ========================================
console.log('\n--- Equipment Test ---');
resetState();
execute('create-character HUmar EquipTest');

// Show starting equipment
console.log('Starting equipment:');
const equipResult = execute('show-equipment');
console.log(equipResult.message);

// Unequip and re-equip
console.log('\nUnequip weapon:', execute('unequip weapon').message);
console.log('Equip weapon:', execute('equip starter_saber').message);

// ========================================
// Test 4: Shop flow
// ========================================
console.log('\n--- Shop Test ---');
resetState();
execute('create-character HUmar ShopTest');

// Item shop
execute('goto shop');
console.log('Buy monomate:', execute('buy monomate 5').message);

// Weapon shop
execute('goto weapon-shop');
const listResult = execute('list-items');
const lines = listResult.message.split('\n').slice(0, 3);
console.log('Weapon shop (first 3):');
lines.forEach(l => console.log('  ' + l));

// ========================================
// Test 5: Field exploration
// ========================================
console.log('\n--- Field Test ---');
resetState();
execute('create-character HUmar FieldTest');
execute('goto teleporter');
const fieldResult = execute('enter-field forest normal');
console.log('Enter field:', fieldResult.success ? 'OK' : 'FAIL');

const returnResult = execute('return');
console.log('Return to city:', returnResult.success ? 'OK' : 'FAIL');

// ========================================
// Test 6: Storage
// ========================================
console.log('\n--- Storage Test ---');
resetState();
execute('create-character HUmar StorageTest');
execute('goto storage');
console.log('Deposit:', execute('deposit monomate').message);
console.log('Withdraw:', execute('withdraw monomate').message);

// ========================================
// Test 7: Stat differences between classes
// ========================================
console.log('\n--- Class Stat Comparison at Level 10 ---');
for (const cls of ['HUmar', 'RAmar', 'FOmarl', 'HUcast', 'FOnewm']) {
  const stats = getClassStatsAtLevel(cls, 10);
  if (stats) {
    console.log(`${cls.padEnd(8)}: HP ${String(stats.hp).padStart(3)} ATK ${String(stats.attack).padStart(3)} ACC ${String(stats.accuracy).padStart(3)} DEF ${String(stats.defense).padStart(3)} MST ${String(stats.technique).padStart(3)}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('INTEGRATION TEST COMPLETE');
console.log('='.repeat(60));
