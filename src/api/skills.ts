/**
 * Skills API
 * Techniques (spells) and Photon Arts (weapon skills)
 */
import { db } from '../db';
import { getCharacter } from './character';
import { getEquipment } from './equipment';
import { getGameState } from './location';
import {
  getTechnique,
  getTechniques,
  getPhotonArt,
  getPhotonArts,
  getPhotonArtsForWeapon,
  getClassStatsAtLevel,
  getClass,
  getClassByName,
  type TechniqueData,
  type PhotonArtData,
} from '../data/content-loader';
import type { WeaponItem } from '../systems/inventory/types';

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// TECHNIQUE LEVELS (per character)
// ============================================================================

interface TechniqueLevels {
  [techniqueId: string]: number;
}

/**
 * Get technique levels for a character
 */
export function getTechniqueLevels(characterId: string): TechniqueLevels {
  const row = db.prepare(`
    SELECT technique_levels FROM game_state WHERE character_id = ?
  `).get(characterId) as { technique_levels?: string } | undefined;

  if (!row?.technique_levels) {
    return {};
  }

  try {
    return JSON.parse(row.technique_levels);
  } catch {
    return {};
  }
}

/**
 * Set technique level for a character
 */
export function setTechniqueLevel(characterId: string, techniqueId: string, level: number): void {
  const levels = getTechniqueLevels(characterId);
  levels[techniqueId] = Math.max(1, Math.min(30, level));

  db.prepare(`
    UPDATE game_state SET technique_levels = ? WHERE character_id = ?
  `).run(JSON.stringify(levels), characterId);
}

/**
 * Learn a technique (set to level 1 if not known)
 */
export function learnTechnique(characterId: string, techniqueId: string): ApiResult {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  // Only Forces can learn techniques
  const classType = char.class_id.substring(0, 2).toUpperCase();
  if (classType !== 'FO') {
    return { success: false, message: 'Only Force classes can learn techniques.' };
  }

  const technique = getTechnique(techniqueId);
  if (!technique) {
    return { success: false, message: 'Unknown technique.' };
  }

  const levels = getTechniqueLevels(characterId);
  if (levels[techniqueId]) {
    return { success: false, message: `Already know ${technique.name}.` };
  }

  setTechniqueLevel(characterId, techniqueId, 1);
  return { success: true, message: `Learned ${technique.name}!` };
}

/**
 * Get all techniques known by a character
 */
export function getKnownTechniques(characterId: string): ApiResult<Array<{
  technique: TechniqueData;
  level: number;
}>> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const levels = getTechniqueLevels(characterId);
  const known: Array<{ technique: TechniqueData; level: number }> = [];

  for (const [id, level] of Object.entries(levels)) {
    const technique = getTechnique(id);
    if (technique) {
      known.push({ technique, level });
    }
  }

  return {
    success: true,
    message: `${known.length} techniques known`,
    data: known,
  };
}

// ============================================================================
// CASTING TECHNIQUES
// ============================================================================

/**
 * Cast a technique in combat
 */
export function castTechnique(
  characterId: string,
  techniqueId: string,
  targetIndex?: number
): ApiResult<{
  damage?: number;
  healing?: number;
  effect?: string;
  ppUsed: number;
}> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const gameState = getGameState(characterId);
  if (!gameState || gameState.location !== 'field') {
    return { success: false, message: 'Can only cast techniques in the field.' };
  }

  const technique = getTechnique(techniqueId);
  if (!technique) {
    return { success: false, message: 'Unknown technique.' };
  }

  // Check if character knows the technique
  const levels = getTechniqueLevels(characterId);
  const techLevel = levels[techniqueId] ?? 0;

  // Forces can use techniques, others need to check
  const classType = char.class_id.substring(0, 2).toUpperCase();
  if (classType !== 'FO' && techLevel === 0) {
    return { success: false, message: `You don't know ${technique.name}.` };
  }

  // Get TP from combat state
  const combatData = gameState.combatData ? JSON.parse(gameState.combatData) : null;
  const currentTP = combatData?.player?.tp ?? 0;

  // Calculate PP cost (reduced by level)
  const ppCost = Math.max(1, technique.ppCost - Math.floor(techLevel / 5));

  if (currentTP < ppCost) {
    return { success: false, message: `Not enough TP. Need ${ppCost}, have ${currentTP}.` };
  }

  // Get class stats for technique power
  const classStats = getClassStatsAtLevel(char.class_id, char.level);
  const mst = classStats?.technique ?? 50;

  // Calculate effect
  let result: { damage?: number; healing?: number; effect?: string; ppUsed: number } = { ppUsed: ppCost };

  if (technique.type === 'attack') {
    // Damage = basePower * (1 + level/10) * (mst/100)
    const damage = Math.floor(technique.basePower * (1 + techLevel / 10) * (mst / 100));
    result.damage = damage;
    result.effect = `${technique.name} deals ${damage} ${technique.element} damage!`;
  } else if (technique.type === 'heal') {
    // Healing = basePower * (1 + level/10) * (mst/100)
    const healing = Math.floor(technique.basePower * (1 + techLevel / 10) * (mst / 100));
    result.healing = healing;
    result.effect = `${technique.name} restores ${healing} HP!`;
  } else if (technique.type === 'buff') {
    const boost = technique.basePower + techLevel;
    result.effect = `${technique.name} boosts stats by ${boost}%!`;
  } else if (technique.type === 'debuff') {
    const reduction = technique.basePower + techLevel;
    result.effect = `${technique.name} reduces enemy stats by ${reduction}%!`;
  }

  // Deduct TP (would need to integrate with combat state)
  // For now, just return the result

  return {
    success: true,
    message: result.effect ?? `Cast ${technique.name}!`,
    data: result,
  };
}

// ============================================================================
// PHOTON ARTS
// ============================================================================

/**
 * Get available photon arts for character's equipped weapon
 */
export function getAvailablePhotonArts(characterId: string): ApiResult<PhotonArtData[]> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const equipment = getEquipment(characterId);
  if (!equipment?.weapon) {
    return { success: false, message: 'No weapon equipped.' };
  }

  const weapon = equipment.weapon as WeaponItem;
  const weaponType = weapon.weaponType ?? 'Saber';

  const arts = getPhotonArtsForWeapon(weaponType);

  if (arts.length === 0) {
    return { success: true, message: `No photon arts for ${weaponType}.`, data: [] };
  }

  return {
    success: true,
    message: `${arts.length} photon arts available for ${weaponType}`,
    data: arts,
  };
}

/**
 * Use a photon art in combat
 */
export function usePhotonArt(
  characterId: string,
  artId: string,
  targetIndex: number
): ApiResult<{
  damage: number;
  hits: number;
  ppUsed: number;
}> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const gameState = getGameState(characterId);
  if (!gameState || gameState.location !== 'field') {
    return { success: false, message: 'Can only use photon arts in the field.' };
  }

  const art = getPhotonArt(artId);
  if (!art) {
    return { success: false, message: 'Unknown photon art.' };
  }

  // Check if weapon matches
  const equipment = getEquipment(characterId);
  if (!equipment?.weapon) {
    return { success: false, message: 'No weapon equipped.' };
  }

  const weapon = equipment.weapon as WeaponItem;
  const weaponType = weapon.weaponType ?? 'Saber';

  if (weaponType.toLowerCase() !== art.weaponType.toLowerCase()) {
    return { success: false, message: `${art.name} requires a ${art.weaponType}.` };
  }

  // Check PP
  const combatData = gameState.combatData ? JSON.parse(gameState.combatData) : null;
  const currentTP = combatData?.player?.tp ?? 0;

  if (currentTP < art.ppCost) {
    return { success: false, message: `Not enough PP. Need ${art.ppCost}, have ${currentTP}.` };
  }

  // Calculate damage
  const classStats = getClassStatsAtLevel(char.class_id, char.level);
  const atk = classStats?.attack ?? 50;
  const weaponAtk = weapon.attack ?? 30;
  const attackMod = art.attackMod ?? 100;
  const hits = art.hits ?? 1;

  const baseDamage = Math.floor((atk + weaponAtk) * (attackMod / 100));
  const totalDamage = baseDamage * hits;

  return {
    success: true,
    message: `${art.name}! ${hits} hit(s) for ${totalDamage} total damage!`,
    data: { damage: totalDamage, hits, ppUsed: art.ppCost },
  };
}

// ============================================================================
// LIST FUNCTIONS
// ============================================================================

/**
 * List all techniques
 */
export function listAllTechniques(): ApiResult<TechniqueData[]> {
  const techniques = Array.from(getTechniques().values());
  return {
    success: true,
    message: `${techniques.length} techniques available`,
    data: techniques,
  };
}

/**
 * List all photon arts
 */
export function listAllPhotonArts(): ApiResult<PhotonArtData[]> {
  const arts = Array.from(getPhotonArts().values());
  return {
    success: true,
    message: `${arts.length} photon arts available`,
    data: arts,
  };
}

// ============================================================================
// TECHNIQUE DISKS
// ============================================================================

/**
 * Technique disk item structure
 */
export interface TechniqueDisk {
  id: string;
  type: 'disk';
  name: string;
  description: string;
  techniqueId: string;
  level: number;
  rarity: number;
  sellPrice: number;
  stackable: false;
  maxStack: 1;
}

/**
 * Map technique ID to its limit group
 */
function getTechniqueLimitGroup(techniqueId: string): string {
  const id = techniqueId.toLowerCase();

  // Basic attack techs
  if (['foie', 'gifoie', 'rafoie', 'barta', 'gibarta', 'rabarta', 'zonde', 'gizonde', 'razonde'].includes(id)) {
    return 'foieBartaZonde';
  }
  // Light attack
  if (id === 'grants') {
    return 'grants';
  }
  // Dark attack
  if (id === 'megid') {
    return 'megid';
  }
  // Healing
  if (['resta', 'reverser', 'anti'].includes(id)) {
    return 'restaReverser';
  }
  // Buffs
  if (['shifta', 'deband'].includes(id)) {
    return 'shiftaDeband';
  }
  // Debuffs
  if (['jellen', 'zalure'].includes(id)) {
    return 'jellenZalure';
  }
  // Default (ryuker, etc.)
  return 'restaReverser';
}

/**
 * Get technique level limit for a class
 */
export function getTechniqueLimit(classId: string, techniqueId: string): number | null {
  const classData = getClass(classId.toLowerCase()) ?? getClassByName(classId);

  if (!classData || !classData.techniqueLimits) {
    return null; // CASTs can't use techniques
  }

  const limitGroup = getTechniqueLimitGroup(techniqueId);
  const limit = classData.techniqueLimits[limitGroup];

  return limit ?? null;
}

/**
 * Use a technique disk to learn or upgrade a technique
 */
export function useDisk(
  characterId: string,
  disk: TechniqueDisk
): ApiResult<{ techniqueId: string; newLevel: number }> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  // Check if technique exists
  const technique = getTechnique(disk.techniqueId);
  if (!technique) {
    return { success: false, message: 'Unknown technique on disk.' };
  }

  // Check class can use techniques
  const limit = getTechniqueLimit(char.class_id, disk.techniqueId);
  if (limit === null) {
    return { success: false, message: `${char.class_id} cannot use techniques.` };
  }

  // Check disk level doesn't exceed class limit
  if (disk.level > limit) {
    return {
      success: false,
      message: `${char.class_id} can only learn ${technique.name} up to level ${limit}.`
    };
  }

  // Get current technique level
  const levels = getTechniqueLevels(characterId);
  const currentLevel = levels[disk.techniqueId] ?? 0;

  // Check if disk is useful
  if (currentLevel >= disk.level) {
    return {
      success: false,
      message: `Already know ${technique.name} at level ${currentLevel}. Disk is level ${disk.level}.`
    };
  }

  // Learn or upgrade the technique
  setTechniqueLevel(characterId, disk.techniqueId, disk.level);

  const action = currentLevel === 0 ? 'Learned' : `Upgraded to`;
  return {
    success: true,
    message: `${action} ${technique.name} Lv.${disk.level}!`,
    data: { techniqueId: disk.techniqueId, newLevel: disk.level },
  };
}

/**
 * Create a technique disk item
 */
export function createTechniqueDisk(techniqueId: string, level: number): TechniqueDisk {
  const technique = getTechnique(techniqueId);
  const name = technique?.name ?? techniqueId;

  // Rarity based on technique tier and level
  const isAdvanced = ['gifoie', 'gibarta', 'gizonde', 'rafoie', 'rabarta', 'razonde', 'grants', 'megid'].includes(techniqueId);
  const baseRarity = isAdvanced ? 3 : 2;
  const levelRarity = Math.floor(level / 10);
  const rarity = Math.min(5, baseRarity + levelRarity);

  // Unique ID with timestamp to allow multiple disks of same type
  const uniqueId = `disk_${techniqueId}_${level}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  return {
    id: uniqueId,
    type: 'disk',
    name: `Disk: ${name} Lv.${level}`,
    description: technique?.description ?? `${name} technique disk`,
    techniqueId,
    level,
    rarity,
    sellPrice: 50 * level * (isAdvanced ? 3 : 1),
    stackable: false,
    maxStack: 1,
  };
}

/**
 * Generate a random technique disk based on area and difficulty
 */
export function generateRandomDisk(
  areaId: string,
  difficulty: 'normal' | 'hard' | 'super-hard',
  isBoss: boolean = false,
  isRare: boolean = false
): TechniqueDisk {
  // Base level range by difficulty
  const levelRanges: Record<string, { min: number; max: number }> = {
    'normal': { min: 1, max: 10 },
    'hard': { min: 8, max: 20 },
    'super-hard': { min: 15, max: 30 },
  };

  // Bonus for boss/rare enemies
  const range = levelRanges[difficulty] || levelRanges['normal'];
  let minLevel = range.min;
  let maxLevel = range.max;

  if (isBoss) {
    minLevel += 5;
    maxLevel += 5;
  } else if (isRare) {
    minLevel += 3;
    maxLevel += 3;
  }

  // Cap at 30
  maxLevel = Math.min(30, maxLevel);
  minLevel = Math.min(minLevel, maxLevel);

  // Random level within range
  const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

  // Select technique based on area theme
  const areaTechniques: Record<string, string[]> = {
    'gurhacia': ['foie', 'barta', 'zonde', 'resta'],
    'rioh': ['barta', 'gibarta', 'rabarta', 'deband'],
    'ozette': ['zonde', 'gizonde', 'razonde', 'jellen'],
    'paru': ['foie', 'gifoie', 'rafoie', 'shifta'],
    'arca': ['zonde', 'barta', 'anti', 'zalure'],
    'dark': ['megid', 'grants', 'reverser', 'resta'],
  };

  // Default techniques if area not found
  const basicTechniques = ['foie', 'barta', 'zonde', 'resta', 'anti', 'shifta', 'deband'];
  const advancedTechniques = ['gifoie', 'gibarta', 'gizonde', 'rafoie', 'rabarta', 'razonde', 'grants', 'megid'];

  let pool = areaTechniques[areaId] ?? basicTechniques;

  // Boss/rare enemies can drop advanced techniques
  if ((isBoss || isRare) && difficulty !== 'normal') {
    pool = [...pool, ...advancedTechniques.slice(0, 3)];
  }

  // Super-hard can drop any technique
  if (difficulty === 'super-hard') {
    pool = [...new Set([...pool, ...advancedTechniques])];
  }

  const techniqueId = pool[Math.floor(Math.random() * pool.length)];

  return createTechniqueDisk(techniqueId, level);
}
