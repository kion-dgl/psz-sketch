/**
 * Combat API
 * Battle system, enemies, attacks, and combat state
 */
import { db } from '../db';
import { getCharacter, addExperience } from './character';
import { getEquipment } from './equipment';
import { getGameState, setCombatData, type CombatData, type EnemyData, type DroppedItem } from './location';
import { resolveAttack, applyDamage, isDefeated } from '../systems/combat/combat';
import { generateEnemyComposition, createSeededRandom, getRareEnemies } from '../systems/stage/enemy-pools';
import type { EnemyArea } from '../systems/stage/types';
import type { CombatStats, WeaponStats, Element } from '../systems/combat/types';
import { addItem } from './inventory';
import { MONOMATE, MONOFLUID } from '../systems/inventory/starting-items';
import { getClassStatsAtLevel, getEnemy } from '../data/content-loader';

export type Difficulty = 'normal' | 'hard' | 'super-hard';

export interface EnemyInstance {
  id: number;
  enemyId: string;
  name: string;
  stats: CombatStats;
  element: Element;
  expValue: number;
  mesetaValue: number;
}

export interface PlayerCombatState {
  hp: number;
  maxHp: number;
  tp: number;
  maxTp: number;
}

export interface AttackResultData {
  hit: boolean;
  damage: number;
  critical: boolean;
  enemyDefeated: boolean;
  enemyName: string;
  playerDamage?: number;
  playerDefeated?: boolean;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// In-memory combat state (per character, keyed by characterId)
const combatState: Map<string, {
  enemies: EnemyInstance[];
  player: PlayerCombatState;
  droppedItems: DroppedItem[];
  enemyIdCounter: number;
}> = new Map();

/**
 * Get or initialize combat state for a character
 * Uses class stats from content/classes/*.json
 */
function getCombatState(characterId: string): {
  enemies: EnemyInstance[];
  player: PlayerCombatState;
  droppedItems: DroppedItem[];
  enemyIdCounter: number;
} {
  let state = combatState.get(characterId);
  if (!state) {
    const char = getCharacter(characterId);
    const level = char?.level ?? 1;
    const classId = char?.class_id ?? 'HUmar';
    const classStats = getClassStatsAtLevel(classId, level);

    const hp = classStats?.hp ?? (100 + level * 20);
    const pp = classStats?.pp ?? (50 + level * 10);

    state = {
      enemies: [],
      player: {
        hp,
        maxHp: hp,
        tp: pp,
        maxTp: pp,
      },
      droppedItems: [],
      enemyIdCounter: 0,
    };
    combatState.set(characterId, state);
  }
  return state;
}

/**
 * Initialize player combat state
 * Uses class stats from content/classes/*.json
 */
export function initCombat(characterId: string): ApiResult<PlayerCombatState> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const level = char.level;
  const classId = char.class_id ?? 'HUmar';
  const classStats = getClassStatsAtLevel(classId, level);

  const hp = classStats?.hp ?? (100 + level * 20);
  const pp = classStats?.pp ?? (50 + level * 10);

  const state = getCombatState(characterId);

  state.player = {
    hp,
    maxHp: hp,
    tp: pp,
    maxTp: pp,
  };
  state.enemies = [];
  state.droppedItems = [];
  state.enemyIdCounter = 0;

  syncCombatToDb(characterId);

  return { success: true, message: 'Combat initialized.', data: state.player };
}

/**
 * Get current enemies
 */
export function getEnemies(characterId: string): EnemyInstance[] {
  return getCombatState(characterId).enemies;
}

/**
 * Get player combat state
 */
export function getPlayerState(characterId: string): PlayerCombatState {
  return getCombatState(characterId).player;
}

/**
 * Get dropped items
 */
export function getDroppedItems(characterId: string): DroppedItem[] {
  return getCombatState(characterId).droppedItems;
}

/**
 * Generate enemy stats based on difficulty and player level
 * Uses enemy data from content/enemies/*.json for classification
 */
function generateEnemyStats(enemyId: string, difficulty: Difficulty, playerLevel: number): CombatStats {
  const difficultyMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;
  const levelMult = 1 + (playerLevel - 1) * 0.1;

  // Get enemy data from content files
  const enemyData = getEnemy(enemyId);
  const isRare = enemyData?.isRare ?? false;
  const isBoss = enemyData?.isBoss ?? (enemyId.includes('falz') || enemyId.includes('mother') || enemyId.includes('chaos'));

  // Elite enemies: bosses, rare enemies, and certain types
  const isElite = isBoss || isRare ||
    enemyId.includes('helion') || enemyId.includes('hildegigas') ||
    enemyId.includes('pelcatobur') || enemyId.includes('rohcrysta') ||
    enemyId.includes('frunaked') || enemyId.includes('derreo');

  const baseHp = isBoss ? 500 : isElite ? 100 : 50;
  const baseAtk = isBoss ? 50 : isElite ? 25 : 15;
  const baseDef = isBoss ? 30 : isElite ? 15 : 8;

  return {
    hp: Math.floor(baseHp * difficultyMult * levelMult),
    maxHp: Math.floor(baseHp * difficultyMult * levelMult),
    attack: Math.floor(baseAtk * difficultyMult * levelMult),
    defense: Math.floor(baseDef * difficultyMult * levelMult),
    accuracy: 70 + (difficulty === 'super-hard' ? 10 : 0),
    evasion: 10 + (isElite ? 10 : 0),
  };
}

/**
 * Format enemy ID to display name
 * Uses enemy data from content/enemies/*.json for proper names
 */
function formatEnemyName(enemyId: string): string {
  // Look up proper name from content
  const enemyData = getEnemy(enemyId);
  if (enemyData?.name) {
    return enemyData.name;
  }

  // Fallback: format the ID as a name
  return enemyId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get enemy element from content files
 */
function getEnemyElement(enemyId: string): Element {
  const enemyData = getEnemy(enemyId);
  if (enemyData?.element) {
    // Map content element names to combat element types
    const elementMap: Record<string, Element> = {
      'Native': 'native',
      'Beast': 'beast',
      'Machine': 'machine',
      'Dark': 'dark',
    };
    return elementMap[enemyData.element] ?? null;
  }
  return null;
}

/**
 * Spawn enemies for a wave
 */
export function spawnEnemies(
  characterId: string,
  areaId: string,
  difficulty: Difficulty,
  seed?: number
): ApiResult<{ enemies: EnemyInstance[]; wave: number }> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const gameState = getGameState(characterId);
  if (!gameState || gameState.location !== 'field') {
    return { success: false, message: 'Must be in field.' };
  }

  const state = getCombatState(characterId);
  const random = createSeededRandom(seed ?? Date.now());

  // Map areaId to enemy pool area
  const areaMapping: Record<string, string> = {
    'gurhacia-valley': 'gurhacia',
    'rioh-snowfield': 'rioh',
    'ozette-wetland': 'ozette',
    'paru-ruins': 'paru',
    'arca-plant': 'arca',
    'dark-shrine': 'dark',
    'mayors-mission': 'gurhacia', // Mission areas
  };
  const enemyArea = areaMapping[areaId] || 'gurhacia';

  const composition = generateEnemyComposition(enemyArea as any, difficulty, random);

  state.enemies = [];
  for (const entry of composition) {
    for (let i = 0; i < entry.count; i++) {
      const stats = generateEnemyStats(entry.enemyId, difficulty, char.level);
      state.enemies.push({
        id: state.enemyIdCounter++,
        enemyId: entry.enemyId,
        name: formatEnemyName(entry.enemyId),
        stats,
        element: getEnemyElement(entry.enemyId),
        expValue: Math.floor(stats.maxHp * 0.5),
        mesetaValue: Math.floor(stats.maxHp * 0.3),
      });
    }
  }

  syncCombatToDb(characterId);

  const wave = gameState.sessionData?.currentWave ?? 1;
  return {
    success: true,
    message: `Wave ${wave}: ${state.enemies.length} enemies spawned!`,
    data: { enemies: state.enemies, wave },
  };
}

/**
 * Spawn rare enemies only (for rare spawn stages)
 * Rare enemies give 3x EXP and better drops
 */
export function spawnRareEnemies(
  characterId: string,
  areaId: string,
  difficulty: Difficulty,
  seed?: number
): ApiResult<{ enemies: EnemyInstance[]; wave: number }> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const gameState = getGameState(characterId);
  if (!gameState || gameState.location !== 'field') {
    return { success: false, message: 'Must be in field.' };
  }

  const state = getCombatState(characterId);
  const random = createSeededRandom(seed ?? Date.now());

  // Map areaId to enemy pool area
  const areaMapping: Record<string, EnemyArea> = {
    'gurhacia-valley': 'gurhacia',
    'gurhacia': 'gurhacia',
    'rioh-snowfield': 'rioh',
    'rioh': 'rioh',
    'ozette-wetland': 'ozette',
    'ozette': 'ozette',
    'paru-ruins': 'paru',
    'paru': 'paru',
    'arca-plant': 'arca',
    'arca': 'arca',
    'dark-shrine': 'dark',
    'dark': 'dark',
    'makara-ruins': 'makara',
    'makara': 'makara',
  };
  const enemyArea = areaMapping[areaId] || 'gurhacia';

  // Get rare enemies for this area
  const rareEnemies = getRareEnemies(enemyArea);

  if (rareEnemies.length === 0) {
    return { success: false, message: 'No rare enemies available for this area.' };
  }

  // Spawn 2-4 rare enemies (fewer than normal but all rare)
  const enemyCount = 2 + Math.floor(random() * 3); // 2-4 enemies

  state.enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const enemyId = rareEnemies[Math.floor(random() * rareEnemies.length)];
    const stats = generateEnemyStats(enemyId, difficulty, char.level);

    // Rare enemies give 3x EXP and meseta
    const expMultiplier = 3;
    const mesetaMultiplier = 3;

    state.enemies.push({
      id: state.enemyIdCounter++,
      enemyId,
      name: formatEnemyName(enemyId),
      stats,
      element: getEnemyElement(enemyId),
      expValue: Math.floor(stats.maxHp * 0.5 * expMultiplier),
      mesetaValue: Math.floor(stats.maxHp * 0.3 * mesetaMultiplier),
    });
  }

  syncCombatToDb(characterId);

  const wave = gameState.sessionData?.currentWave ?? 1;
  return {
    success: true,
    message: `RARE SPAWN! Wave ${wave}: ${state.enemies.length} rare enemies appeared!`,
    data: { enemies: state.enemies, wave },
  };
}

/**
 * Get player combat stats from character class and equipment
 * Uses class stats from content/classes/*.json
 */
function getPlayerCombatStats(characterId: string): CombatStats & { luck: number } {
  const char = getCharacter(characterId);
  const equipment = getEquipment(characterId);
  const level = char?.level ?? 1;
  const classId = char?.class_id ?? 'HUmar';

  // Get base stats from class data
  const classStats = getClassStatsAtLevel(classId, level);

  // Fallback stats if class not found
  let hp = classStats?.hp ?? (100 + level * 20);
  let attack = classStats?.attack ?? (15 + level * 3);
  let defense = classStats?.defense ?? (8 + level * 2);
  let accuracy = classStats?.accuracy ?? (75 + level);
  let evasion = classStats?.evasion ?? (10 + level);

  // Add equipment bonuses
  if (equipment.frame) {
    defense += equipment.frame.defense ?? 0;
    evasion += equipment.frame.evasion ?? 0;
  }

  // Add unit bonuses
  const unitSlots = ['unit1', 'unit2', 'unit3', 'unit4'] as const;
  for (const slot of unitSlots) {
    const unit = equipment[slot];
    if (unit) {
      attack += unit.attackBonus ?? 0;
      defense += unit.defenseBonus ?? 0;
      accuracy += unit.accuracyBonus ?? 0;
      evasion += unit.evasionBonus ?? 0;
      hp += unit.hpBonus ?? 0;
    }
  }

  return {
    hp,
    maxHp: hp,
    attack,
    defense,
    accuracy,
    evasion,
    luck: 10 + Math.floor(level / 2),
  };
}

/**
 * Get weapon stats from equipped weapon
 */
function getPlayerWeaponStats(characterId: string): WeaponStats & { critBonus: number } {
  const equipment = getEquipment(characterId);
  const weapon = equipment.weapon;

  if (!weapon) {
    return {
      attack: 5,
      accuracy: 5,
      element: null,
      elementPercent: 0,
      grindBonus: 0,
      critBonus: 3,
    };
  }

  const grindLevel = weapon.grindLevel ?? 0;

  return {
    attack: weapon.attack + (grindLevel * 2),
    accuracy: weapon.accuracy,
    element: weapon.element as Element | null,
    elementPercent: weapon.elementPercent ?? 0,
    grindBonus: grindLevel * 2,
    critBonus: 5 + Math.floor(weapon.attack / 20),
  };
}

/**
 * Attack an enemy
 */
export function attack(characterId: string, targetIndex: number): ApiResult<AttackResultData> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const state = getCombatState(characterId);

  if (state.player.hp <= 0) {
    return { success: false, message: 'You are defeated!' };
  }

  if (state.enemies.length === 0) {
    return { success: false, message: 'No enemies to attack.' };
  }

  if (targetIndex < 0 || targetIndex >= state.enemies.length) {
    return { success: false, message: `Invalid target. Choose 0-${state.enemies.length - 1}.` };
  }

  const enemy = state.enemies[targetIndex];
  const playerStats = getPlayerCombatStats(characterId);
  const weaponStats = getPlayerWeaponStats(characterId);

  // Resolve player attack
  const result = resolveAttack({
    attacker: playerStats,
    weapon: weaponStats,
    defender: enemy.stats,
  });

  let message = '';
  let enemyDefeated = false;

  if (result.hit) {
    enemy.stats = applyDamage(enemy.stats, result.totalDamage);
    message = result.critical
      ? `Critical hit! ${result.totalDamage} damage to ${enemy.name}!`
      : `Hit ${enemy.name} for ${result.totalDamage} damage!`;

    if (isDefeated(enemy.stats)) {
      enemyDefeated = true;

      // Grant EXP
      const expResult = addExperience(characterId, enemy.expValue);
      if (expResult.data?.leveledUp) {
        message += ` ${enemy.name} defeated! +${enemy.expValue} EXP. LEVEL UP to ${expResult.data.level}!`;
      } else {
        message += ` ${enemy.name} defeated! +${enemy.expValue} EXP.`;
      }

      // Generate drops
      generateDrops(characterId, enemy);

      // Remove defeated enemy
      state.enemies.splice(targetIndex, 1);
    }
  } else {
    message = `Attack missed!`;
  }

  // Enemy counter-attack if alive and player attacked
  let playerDamage = 0;
  let playerDefeated = false;

  if (state.enemies.length > 0 && result.hit) {
    // Random enemy counter-attacks (50% chance)
    if (Math.random() < 0.5) {
      const attacker = state.enemies[Math.floor(Math.random() * state.enemies.length)];
      const counterResult = resolveAttack({
        attacker: attacker.stats,
        // Enemy attack stat is their total power - no weapon bonus
        weapon: { attack: 0, accuracy: 60, element: attacker.element, elementPercent: 0, grindBonus: 0 },
        defender: playerStats,
      });

      if (counterResult.hit) {
        playerDamage = counterResult.totalDamage;
        state.player.hp = Math.max(0, state.player.hp - playerDamage);
        message += ` ${attacker.name} counter-attacks for ${playerDamage} damage!`;

        if (state.player.hp <= 0) {
          playerDefeated = true;
          message += ' You have been defeated!';
        }
      }
    }
  }

  syncCombatToDb(characterId);

  return {
    success: true,
    message,
    data: {
      hit: result.hit,
      damage: result.totalDamage,
      critical: result.critical,
      enemyDefeated,
      enemyName: enemy.name,
      playerDamage,
      playerDefeated,
    },
  };
}

/**
 * Generate drops from a defeated enemy
 */
function generateDrops(characterId: string, enemy: EnemyInstance): void {
  const state = getCombatState(characterId);
  const dropId = state.droppedItems.length;

  // Always drop meseta
  if (enemy.mesetaValue > 0) {
    state.droppedItems.push({
      id: dropId,
      type: 'meseta',
      meseta: enemy.mesetaValue,
    });
  }

  // Random item drop (10% chance)
  if (Math.random() < 0.1) {
    // Simple random drop - could be expanded
    const items = ['monomate', 'monofluid'];
    const itemId = items[Math.floor(Math.random() * items.length)];
    state.droppedItems.push({
      id: dropId + 1,
      type: 'item',
      itemId,
    });
  }
}

/**
 * Pickup a dropped item
 */
export function pickupItem(characterId: string, dropId: number): ApiResult {
  const state = getCombatState(characterId);
  const dropIndex = state.droppedItems.findIndex(d => d.id === dropId);

  if (dropIndex === -1) {
    return { success: false, message: 'Drop not found.' };
  }

  const drop = state.droppedItems[dropIndex];

  if (drop.type === 'meseta') {
    // Add meseta to character
    const char = getCharacter(characterId);
    if (char) {
      db.prepare('UPDATE characters SET meseta = meseta + ? WHERE id = ?')
        .run(drop.meseta, characterId);
    }
    state.droppedItems.splice(dropIndex, 1);
    syncCombatToDb(characterId);
    return { success: true, message: `Picked up ${drop.meseta} meseta!` };
  }

  if (drop.type === 'item' && drop.itemId) {
    // Add item to inventory
    const items: Record<string, any> = { monomate: MONOMATE, monofluid: MONOFLUID };
    const item = items[drop.itemId];

    if (item) {
      const result = addItem(characterId, item, 1);
      if (result.success) {
        state.droppedItems.splice(dropIndex, 1);
        syncCombatToDb(characterId);
        return { success: true, message: `Picked up ${item.name}!` };
      }
      return result;
    }
  }

  return { success: false, message: 'Could not pick up item.' };
}

/**
 * Pickup all dropped items
 */
export function pickupAll(characterId: string): ApiResult<{ picked: number; failed: number }> {
  const state = getCombatState(characterId);
  let picked = 0;
  let failed = 0;

  // Process in reverse to avoid index issues
  for (let i = state.droppedItems.length - 1; i >= 0; i--) {
    const result = pickupItem(characterId, state.droppedItems[i].id);
    if (result.success) {
      picked++;
    } else {
      failed++;
    }
  }

  return {
    success: true,
    message: `Picked up ${picked} item(s).${failed > 0 ? ` ${failed} failed.` : ''}`,
    data: { picked, failed },
  };
}

/**
 * Heal player
 */
export function healPlayer(characterId: string, amount: number): ApiResult {
  const state = getCombatState(characterId);
  const oldHp = state.player.hp;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
  const healed = state.player.hp - oldHp;

  syncCombatToDb(characterId);

  return { success: true, message: `Healed ${healed} HP. Now at ${state.player.hp}/${state.player.maxHp}.` };
}

/**
 * Restore player TP
 */
export function restoreTP(characterId: string, amount: number): ApiResult {
  const state = getCombatState(characterId);
  const oldTp = state.player.tp;
  state.player.tp = Math.min(state.player.maxTp, state.player.tp + amount);
  const restored = state.player.tp - oldTp;

  syncCombatToDb(characterId);

  return { success: true, message: `Restored ${restored} TP. Now at ${state.player.tp}/${state.player.maxTp}.` };
}

/**
 * Clear combat state
 */
export function clearCombat(characterId: string): void {
  combatState.delete(characterId);
  setCombatData(characterId, null);
}

/**
 * Sync combat state to database
 */
function syncCombatToDb(characterId: string): void {
  const state = getCombatState(characterId);
  const combatData: CombatData = {
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    tp: state.player.tp,
    maxTp: state.player.maxTp,
    enemies: state.enemies.map(e => ({
      id: e.id,
      name: e.name,
      hp: e.stats.hp,
      maxHp: e.stats.maxHp,
    })),
    droppedItems: state.droppedItems,
  };
  setCombatData(characterId, combatData);
}

/**
 * Check if all enemies are defeated
 */
export function isWaveCleared(characterId: string): boolean {
  return getCombatState(characterId).enemies.length === 0;
}

/**
 * Get total EXP from defeated enemies in current wave
 */
export function getWaveExp(characterId: string): number {
  // This would need to track defeated enemies - simplified for now
  return 0;
}
