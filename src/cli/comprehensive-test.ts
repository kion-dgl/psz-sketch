#!/usr/bin/env node
/**
 * Comprehensive TUI Test
 * Tests all 10 character classes through all game systems
 */

import { execute, getState, resetState } from './api-v2';
import { addItem, getCharacter, updateMeseta } from '../api';

const CLASSES = [
  'HUmar', 'HUmarl', 'HUcast',
  'RAmar', 'RAmarl', 'RAcast',
  'FOmar', 'FOmarl', 'FOnewm', 'FOnewearl'
];

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(color: keyof typeof COLORS, ...args: unknown[]) {
  console.log(COLORS[color], ...args, COLORS.reset);
}

interface TestResults {
  className: string;
  finalLevel: number;
  totalExp: number;
  missionsCompleted: number;
  enemiesDefeated: number;
  mesetaEarned: number;
  techniquesLearned: number;
  photonArtsUsed: number;
  itemsBought: number;
  itemsSold: number;
  grindsAttempted: number;
  errors: string[];
}

// Get starter weapon ID for a class
function getStarterWeaponId(className: string): string {
  if (className.startsWith('HU')) return 'starter_saber';
  if (className.startsWith('RA')) return 'starter_rifle';
  if (className.startsWith('FO')) return 'starter_rod';
  return 'starter_saber';
}

// Helper to run command and track errors
function runCmd(cmd: string, results: TestResults, silent = false): { success: boolean; message: string } {
  try {
    const r = execute(cmd);
    if (!r.success && !cmd.includes('attack') && !cmd.includes('grind') && !cmd.includes('next-wave') && !silent) {
      // Don't log expected failures
      results.errors.push(`[${cmd}] ${r.message}`);
    }
    return r;
  } catch (e) {
    results.errors.push(`[${cmd}] Exception: ${e}`);
    return { success: false, message: String(e) };
  }
}

// Level up a character by running missions
function levelUpCharacter(targetLevel: number, results: TestResults): void {
  let safetyCounter = 0;
  const maxIterations = 1000;

  while (getState().character!.level < targetLevel && safetyCounter < maxIterations) {
    safetyCounter++;
    const state = getState();
    const location = state.location;

    // If in city, go to guild and start mission
    if (location === 'city' || location === 'shop' || location === 'weapon-shop' ||
        location === 'storage' || location === 'teleporter') {
      runCmd('goto guild', results);
    }

    if (location === 'guild') {
      // Check for pending mission to report
      if (state.pendingMission) {
        const r = runCmd('report-mission', results);
        if (r.success) {
          results.missionsCompleted++;
          log('dim', `    Mission reported! Now level ${getState().character!.level}`);
        }
        continue;
      }

      // Check for suspended session
      if (state.suspendedSession) {
        runCmd('resume-mission', results);
        continue;
      }

      // Start a new mission
      runCmd('start-mission mayors-mission normal', results);
      continue;
    }

    // If in field, fight
    if (location === 'field') {
      const enemies = state.enemies ?? [];
      const playerCombat = state.playerCombat;

      // Heal if HP is low
      if (playerCombat && playerCombat.hp < playerCombat.maxHp * 0.4) {
        runCmd('use monomate', results, true);
      }

      if (enemies.length > 0) {
        // Attack first enemy
        const atkResult = runCmd('attack 0', results);
        if (atkResult.message.includes('defeated')) {
          results.enemiesDefeated++;
        }

        // Check if player was defeated
        if (atkResult.message.includes('lost') && atkResult.message.includes('meseta')) {
          log('yellow', `    Defeated! Returning to city...`);
          continue;
        }
      } else {
        // No enemies - check wave/stage status
        const sessionData = state.currentWave !== undefined;

        if (sessionData) {
          // Try to advance
          const waveResult = runCmd('next-wave', results);
          if (!waveResult.success) {
            // Wave failed, try next stage
            const stageResult = runCmd('next-stage', results);
            if (!stageResult.success && stageResult.message.includes('complete')) {
              // Mission complete, will report at guild
              continue;
            }
          }
        }

        // Pick up any drops
        const drops = state.droppedItems ?? [];
        if (drops.length > 0) {
          runCmd('pickup-all', results);
        }
      }
    }
  }

  if (safetyCounter >= maxIterations) {
    results.errors.push(`Safety limit reached while leveling to ${targetLevel}`);
  }
}

// Test shop systems
function testShops(className: string, results: TestResults): void {
  log('dim', '    Testing shops...');

  const starterWeapon = getStarterWeaponId(className);

  // Item shop
  runCmd('goto shop', results);
  runCmd('list-items', results);

  const buyResult = runCmd('buy monomate 5', results);
  if (buyResult.success) results.itemsBought += 5;

  const sellResult = runCmd('sell monomate 2', results);
  if (sellResult.success) results.itemsSold += 2;

  // Weapon shop
  runCmd('goto weapon-shop', results);
  runCmd('list-items', results);

  // Try grinding the correct starter weapon
  const grindResult = runCmd(`grind ${starterWeapon}`, results);
  results.grindsAttempted++;
  if (grindResult.success) {
    log('dim', `      Grind success!`);
  }
}

// Test storage
function testStorage(results: TestResults): void {
  log('dim', '    Testing storage...');

  runCmd('goto storage', results);
  runCmd('show-storage', results);
  runCmd('deposit monomate', results);
  runCmd('show-storage', results);
  runCmd('withdraw monomate', results);
  runCmd('deposit-meseta 100', results);
  runCmd('withdraw-meseta 50', results);
}

// Test equipment
function testEquipment(className: string, results: TestResults): void {
  log('dim', '    Testing equipment...');

  const starterWeapon = getStarterWeaponId(className);

  runCmd('show-equipment', results);
  runCmd('show-inventory', results);
  runCmd('unequip weapon', results);
  runCmd(`equip ${starterWeapon}`, results);
  runCmd('unequip frame', results);
  runCmd('equip starter_frame', results);
  runCmd('weapon-types', results);
}

// Test progression systems
function testProgression(className: string, results: TestResults): void {
  log('dim', '    Testing progression...');

  const starterWeapon = getStarterWeaponId(className);

  runCmd('show-stats', results);
  runCmd('show-bonuses', results);
  runCmd('show-set-bonus', results);
  runCmd(`grind-info ${starterWeapon}`, results);
}

// Test techniques (Force classes only)
function testTechniques(className: string, results: TestResults): void {
  const isForce = className.startsWith('FO');

  log('dim', `    Testing techniques (Force: ${isForce})...`);

  runCmd('list-techniques', results);

  if (isForce) {
    // Learn all basic techniques
    const techniques = ['foie', 'barta', 'zonde', 'resta', 'anti', 'shifta', 'deband'];
    for (const tech of techniques) {
      const r = runCmd(`learn-technique ${tech}`, results);
      if (r.success) results.techniquesLearned++;
    }

    runCmd('my-techniques', results);
  } else {
    // Non-force should fail to learn
    const r = runCmd('learn-technique foie', results);
    if (!r.success && r.message.includes('Force')) {
      // Expected behavior
      results.errors.pop(); // Remove from errors since it's expected
    }
  }
}

// Test photon arts
function testPhotonArts(results: TestResults): void {
  log('dim', '    Testing photon arts...');

  runCmd('list-photon-arts', results);
  runCmd('available-arts', results);
}

// Test field exploration (non-mission)
function testFieldExploration(results: TestResults): void {
  log('dim', '    Testing field exploration...');

  runCmd('goto teleporter', results);
  const enterResult = runCmd('enter-field forest normal', results);

  if (enterResult.success) {
    // Fight a few enemies
    for (let i = 0; i < 5; i++) {
      const state = getState();
      if (state.enemies && state.enemies.length > 0) {
        const r = runCmd('attack 0', results);
        if (r.message.includes('defeated')) results.enemiesDefeated++;
      } else {
        break;
      }
    }

    // Return freely (field, not mission)
    runCmd('return', results);
  }
}

// Run full test for one character class
function testCharacterClass(className: string, targetLevel: number): TestResults {
  const results: TestResults = {
    className,
    finalLevel: 1,
    totalExp: 0,
    missionsCompleted: 0,
    enemiesDefeated: 0,
    mesetaEarned: 0,
    techniquesLearned: 0,
    photonArtsUsed: 0,
    itemsBought: 0,
    itemsSold: 0,
    grindsAttempted: 0,
    errors: [],
  };

  log('cyan', `\n${'='.repeat(60)}`);
  log('bold', `  Testing ${className}`);
  log('cyan', `${'='.repeat(60)}`);

  // Reset and create character
  resetState();
  const createResult = runCmd(`create-character ${className} Test${className}`, results);
  if (!createResult.success) {
    log('red', `  Failed to create ${className}: ${createResult.message}`);
    return results;
  }

  const startMeseta = getState().character!.meseta;

  // Test basic systems first
  testEquipment(className, results);
  testProgression(className, results);
  testTechniques(className, results);
  testPhotonArts(results);
  testShops(className, results);
  testStorage(results);

  // Give extra meseta and buy supplies for leveling
  const charId = getState().character!.character_id;
  updateMeseta(charId, 50000);

  // Stock up on healing items
  runCmd('goto shop', results);
  runCmd('buy monomate 10', results);
  runCmd('buy monomate 10', results);

  // Level up through combat
  log('yellow', `  Leveling to ${targetLevel}...`);
  levelUpCharacter(targetLevel, results);

  // Test field exploration
  testFieldExploration(results);

  // Final stats
  const finalState = getState();
  results.finalLevel = finalState.character!.level;
  results.totalExp = finalState.character!.experience;
  results.mesetaEarned = finalState.character!.meseta - startMeseta;

  // Summary
  log('green', `\n  ${className} Results:`);
  log('dim', `    Level: ${results.finalLevel} (EXP: ${results.totalExp})`);
  log('dim', `    Missions: ${results.missionsCompleted}, Enemies: ${results.enemiesDefeated}`);
  log('dim', `    Techniques: ${results.techniquesLearned}, Items: +${results.itemsBought}/-${results.itemsSold}`);

  if (results.errors.length > 0) {
    log('yellow', `    Warnings: ${results.errors.length}`);
    for (const err of results.errors.slice(0, 5)) {
      log('dim', `      - ${err.substring(0, 80)}`);
    }
    if (results.errors.length > 5) {
      log('dim', `      ... and ${results.errors.length - 5} more`);
    }
  }

  return results;
}

// Main test runner
function runComprehensiveTest() {
  console.log('\n' + '='.repeat(70));
  log('magenta', '  COMPREHENSIVE TUI TEST - ALL CLASSES TO LEVEL 20');
  console.log('='.repeat(70));

  const allResults: TestResults[] = [];
  const targetLevel = 20;

  for (const className of CLASSES) {
    const results = testCharacterClass(className, targetLevel);
    allResults.push(results);
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  log('magenta', '  FINAL SUMMARY');
  console.log('='.repeat(70));

  console.log('\n| Class      | Level | EXP    | Missions | Enemies | Techs | Errors |');
  console.log('|------------|-------|--------|----------|---------|-------|--------|');

  let totalErrors = 0;
  let allReachedTarget = true;

  for (const r of allResults) {
    const levelStatus = r.finalLevel >= targetLevel ? COLORS.green : COLORS.yellow;
    console.log(
      `| ${r.className.padEnd(10)} | ${levelStatus}${String(r.finalLevel).padStart(5)}${COLORS.reset} | ${String(r.totalExp).padStart(6)} | ${String(r.missionsCompleted).padStart(8)} | ${String(r.enemiesDefeated).padStart(7)} | ${String(r.techniquesLearned).padStart(5)} | ${String(r.errors.length).padStart(6)} |`
    );
    totalErrors += r.errors.length;
    if (r.finalLevel < targetLevel) allReachedTarget = false;
  }

  console.log('\n' + '-'.repeat(70));

  const totalMissions = allResults.reduce((sum, r) => sum + r.missionsCompleted, 0);
  const totalEnemies = allResults.reduce((sum, r) => sum + r.enemiesDefeated, 0);
  const totalTechs = allResults.reduce((sum, r) => sum + r.techniquesLearned, 0);

  log('cyan', `  Total: ${totalMissions} missions, ${totalEnemies} enemies, ${totalTechs} techniques learned`);

  if (totalErrors > 0) {
    log('yellow', `  Warnings: ${totalErrors} total`);
  }

  if (allReachedTarget) {
    log('green', `\n  ALL CLASSES REACHED LEVEL ${targetLevel}`);
  } else {
    log('yellow', `\n  Some classes did not reach level ${targetLevel}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Return summary for potential CI use
  return {
    success: allReachedTarget && totalErrors < 50,
    classes: allResults.length,
    totalMissions,
    totalEnemies,
    totalErrors,
  };
}

// Run the test
const result = runComprehensiveTest();
process.exit(result.success ? 0 : 1);
