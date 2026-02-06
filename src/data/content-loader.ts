/**
 * Content Loader
 * Loads game data from src/content JSON files for runtime use
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../content');

// ============================================================================
// TYPES
// ============================================================================

export interface WeaponData {
  id: string;
  name: string;
  japaneseName?: string;
  rarity: number;
  weaponType: string;
  maxGrind: number;
  level: number;
  resaleValue?: number;
  attackBase?: number;
  attackMax?: number;
  accuracyBase: number;
  accuracyMax: number;
  element?: string;
  elementLevel?: number;
  usableBy?: string[];
  psoWorldId?: number;
}

export interface ArmorData {
  id: string;
  name: string;
  japaneseName?: string;
  type: 'Armor' | 'Frame' | 'Robe' | 'Rare';
  rarity: number;
  maxGrind: number;
  level?: number;
  resaleValue?: number;
  defenseBase: number;
  defenseMax: number;
  evasionBase: number;
  evasionMax: number;
  maxSlots: number;
  resistances?: {
    fire: number;
    ice: number;
    lightning: number;
    light: number;
    dark: number;
  };
  usableBy?: string[];
  psoWorldId?: number;
}

export interface UnitData {
  id: string;
  name: string;
  japaneseName?: string;
  rarity: number;
  category: string;
  effect: string;
  effectValue?: number;
  stackable: boolean;
  psoWorldId?: number;
}

export interface EnemyData {
  id: string;
  name: string;
  japaneseName?: string;
  element: 'Native' | 'Beast' | 'Machine' | 'Dark';
  locations: string[];
  isRare: boolean;
  isBoss: boolean;
  modelId?: string;
}

export interface ExperienceLevel {
  level: number;
  totalExp: number;
  expToNext: number | null;
}

export interface ClassData {
  id: string;
  name: string;
  race: 'Human' | 'Newman' | 'Cast';
  gender: 'Male' | 'Female';
  type: 'Hunter' | 'Ranger' | 'Force';
  bonuses: string[];
  materialLimit: number;
  stats: {
    hp: Record<number, number>;
    pp: Record<number, number>;
    attack: Record<number, number>;
    defense: Record<number, number>;
    accuracy: Record<number, number>;
    evasion: Record<number, number>;
    technique: Record<number, number>;
  };
}

export interface ShopData {
  name: string;
  description?: string;
  items: Array<{
    item: string;
    category?: string;
    cost?: number;
    notes?: string;
  }>;
}

// ============================================================================
// CACHES
// ============================================================================

let weaponsCache: Map<string, WeaponData> | null = null;
let armorsCache: Map<string, ArmorData> | null = null;
let unitsCache: Map<string, UnitData> | null = null;
let enemiesCache: Map<string, EnemyData> | null = null;
let experienceCache: ExperienceLevel[] | null = null;
let classesCache: Map<string, ClassData> | null = null;
let shopsCache: Map<string, ShopData> | null = null;

// ============================================================================
// LOADERS
// ============================================================================

function loadJsonDir<T>(dir: string): Map<string, T> {
  const result = new Map<string, T>();
  const fullPath = path.join(CONTENT_DIR, dir);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Content directory not found: ${fullPath}`);
    return result;
  }

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
      const data = JSON.parse(content) as T;
      const id = file.replace('.json', '');
      result.set(id, { ...data, id } as T);
    } catch (e) {
      console.warn(`Failed to load ${file}:`, e);
    }
  }

  return result;
}

function loadJsonFile<T>(filePath: string): T | null {
  const fullPath = path.join(CONTENT_DIR, filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Content file not found: ${fullPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (e) {
    console.warn(`Failed to load ${filePath}:`, e);
    return null;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get all weapons
 */
export function getWeapons(): Map<string, WeaponData> {
  if (!weaponsCache) {
    weaponsCache = loadJsonDir<WeaponData>('weapons');
  }
  return weaponsCache;
}

/**
 * Get a specific weapon by ID
 */
export function getWeapon(id: string): WeaponData | undefined {
  return getWeapons().get(id);
}

/**
 * Get weapons by type (Saber, Sword, Dagger, etc.)
 */
export function getWeaponsByType(weaponType: string): WeaponData[] {
  return Array.from(getWeapons().values())
    .filter(w => w.weaponType.toLowerCase() === weaponType.toLowerCase());
}

/**
 * Get weapons usable by a class
 */
export function getWeaponsForClass(className: string): WeaponData[] {
  return Array.from(getWeapons().values())
    .filter(w => !w.usableBy || w.usableBy.some(c => c.includes(className)));
}

/**
 * Get all armors
 */
export function getArmors(): Map<string, ArmorData> {
  if (!armorsCache) {
    armorsCache = loadJsonDir<ArmorData>('armors');
  }
  return armorsCache;
}

/**
 * Get a specific armor by ID
 */
export function getArmor(id: string): ArmorData | undefined {
  return getArmors().get(id);
}

/**
 * Get all units
 */
export function getUnits(): Map<string, UnitData> {
  if (!unitsCache) {
    unitsCache = loadJsonDir<UnitData>('units');
  }
  return unitsCache;
}

/**
 * Get a specific unit by ID
 */
export function getUnit(id: string): UnitData | undefined {
  return getUnits().get(id);
}

/**
 * Get all enemies
 */
export function getEnemies(): Map<string, EnemyData> {
  if (!enemiesCache) {
    enemiesCache = loadJsonDir<EnemyData>('enemies');
  }
  return enemiesCache;
}

/**
 * Get a specific enemy by ID
 */
export function getEnemy(id: string): EnemyData | undefined {
  return getEnemies().get(id);
}

/**
 * Get enemies by location
 */
export function getEnemiesByLocation(location: string): EnemyData[] {
  return Array.from(getEnemies().values())
    .filter(e => e.locations.some(l => l.toLowerCase().includes(location.toLowerCase())));
}

/**
 * Get experience table
 */
export function getExperienceTable(): ExperienceLevel[] {
  if (!experienceCache) {
    const data = loadJsonFile<{ levels: ExperienceLevel[] }>('experience/experience-table.json');
    experienceCache = data?.levels ?? [];
  }
  return experienceCache;
}

/**
 * Calculate level from total experience
 */
export function calculateLevelFromExp(totalExp: number): number {
  const table = getExperienceTable();
  let level = 1;

  for (const entry of table) {
    if (totalExp >= entry.totalExp) {
      level = entry.level;
    } else {
      break;
    }
  }

  return level;
}

/**
 * Get exp needed for next level
 */
export function getExpToNextLevel(currentLevel: number): number | null {
  const table = getExperienceTable();
  const entry = table.find(e => e.level === currentLevel);
  return entry?.expToNext ?? null;
}

/**
 * Get total exp needed for a level
 */
export function getTotalExpForLevel(level: number): number {
  const table = getExperienceTable();
  const entry = table.find(e => e.level === level);
  return entry?.totalExp ?? 0;
}

/**
 * Get all classes
 */
export function getClasses(): Map<string, ClassData> {
  if (!classesCache) {
    classesCache = loadJsonDir<ClassData>('classes');
  }
  return classesCache;
}

/**
 * Get a specific class by ID
 */
export function getClass(id: string): ClassData | undefined {
  return getClasses().get(id);
}

/**
 * Get class by name (e.g., "HUmar")
 */
export function getClassByName(name: string): ClassData | undefined {
  return Array.from(getClasses().values())
    .find(c => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Interpolate a stat value between key levels
 * Class stats are defined at levels 1, 20, 40, 60, 80, 100
 */
function interpolateStat(statMap: Record<number, number>, level: number): number {
  const keyLevels = [1, 20, 40, 60, 80, 100];

  // Clamp level to valid range
  level = Math.max(1, Math.min(100, level));

  // Find the two key levels we're between
  let lowerKey = 1;
  let upperKey = 20;

  for (let i = 0; i < keyLevels.length - 1; i++) {
    if (level >= keyLevels[i] && level <= keyLevels[i + 1]) {
      lowerKey = keyLevels[i];
      upperKey = keyLevels[i + 1];
      break;
    }
  }

  // Handle exact key level matches
  if (level === lowerKey) return statMap[lowerKey] ?? 0;
  if (level === upperKey) return statMap[upperKey] ?? 0;

  // Linear interpolation between key levels
  const lowerVal = statMap[lowerKey] ?? 0;
  const upperVal = statMap[upperKey] ?? 0;
  const progress = (level - lowerKey) / (upperKey - lowerKey);

  return Math.floor(lowerVal + (upperVal - lowerVal) * progress);
}

/**
 * Get all stats for a class at a specific level
 */
export function getClassStatsAtLevel(classId: string, level: number): {
  hp: number;
  pp: number;
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
  technique: number;
} | null {
  const classData = getClass(classId.toLowerCase()) ?? getClassByName(classId);
  if (!classData) return null;

  return {
    hp: interpolateStat(classData.stats.hp, level),
    pp: interpolateStat(classData.stats.pp, level),
    attack: interpolateStat(classData.stats.attack, level),
    defense: interpolateStat(classData.stats.defense, level),
    accuracy: interpolateStat(classData.stats.accuracy, level),
    evasion: interpolateStat(classData.stats.evasion, level),
    technique: interpolateStat(classData.stats.technique, level),
  };
}

/**
 * Get a single stat for a class at a specific level
 */
export function getClassStat(classId: string, stat: 'hp' | 'pp' | 'attack' | 'defense' | 'accuracy' | 'evasion' | 'technique', level: number): number {
  const classData = getClass(classId.toLowerCase()) ?? getClassByName(classId);
  if (!classData) return 0;

  return interpolateStat(classData.stats[stat], level);
}

/**
 * Get all shops
 */
export function getShops(): Map<string, ShopData> {
  if (!shopsCache) {
    shopsCache = loadJsonDir<ShopData>('shops');
  }
  return shopsCache;
}

/**
 * Get a specific shop by ID
 */
export function getShop(id: string): ShopData | undefined {
  return getShops().get(id);
}

// ============================================================================
// DROP TABLES
// ============================================================================

export interface DropTable {
  [location: string]: {
    [enemyName: string]: string[];
  };
}

let dropTablesCache: Map<string, DropTable> | null = null;

/**
 * Get drop tables for a difficulty
 */
export function getDropTables(): Map<string, DropTable> {
  if (!dropTablesCache) {
    dropTablesCache = new Map();
    for (const difficulty of ['normal', 'hard', 'super-hard']) {
      const data = loadJsonFile<DropTable>(`drops/${difficulty}.json`);
      if (data) {
        dropTablesCache.set(difficulty, data);
      }
    }
  }
  return dropTablesCache;
}

/**
 * Get drop table for a specific difficulty
 */
export function getDropTable(difficulty: string): DropTable | undefined {
  return getDropTables().get(difficulty);
}

/**
 * Get possible drops for an enemy in a location
 */
export function getEnemyDrops(difficulty: string, location: string, enemyName: string): string[] {
  const table = getDropTable(difficulty);
  if (!table) return [];

  const locationDrops = table[location];
  if (!locationDrops) return [];

  return locationDrops[enemyName] ?? [];
}

// ============================================================================
// MISSIONS
// ============================================================================

export interface MissionData {
  id: string;
  name: string;
  area: string;
  main: boolean;
  requires: string[];
  rewards: {
    normal: { item: string; quantity: number; meseta: number };
    hard: { item: string; quantity: number; meseta: number };
    superHard: { item: string; quantity: number; meseta: number };
  };
}

let missionsCache: Map<string, MissionData> | null = null;

/**
 * Get all missions
 */
export function getMissions(): Map<string, MissionData> {
  if (!missionsCache) {
    missionsCache = loadJsonDir<MissionData>('missions');
  }
  return missionsCache;
}

/**
 * Get a specific mission by ID
 */
export function getMission(id: string): MissionData | undefined {
  return getMissions().get(id);
}

/**
 * Get missions for an area
 */
export function getMissionsForArea(area: string): MissionData[] {
  return Array.from(getMissions().values())
    .filter(m => m.area.toLowerCase().includes(area.toLowerCase()));
}

// ============================================================================
// MATERIALS
// ============================================================================

export interface MaterialData {
  id: string;
  name: string;
  japaneseName?: string;
  details: string;
  rarity: number;
  stat?: 'attack' | 'defense' | 'accuracy' | 'evasion' | 'hp' | 'pp' | 'technique';
  psoWorldId?: number;
}

let materialsCache: Map<string, MaterialData> | null = null;

/**
 * Get all materials
 */
export function getMaterials(): Map<string, MaterialData> {
  if (!materialsCache) {
    materialsCache = loadJsonDir<MaterialData>('materials');
    // Add stat mapping based on material name
    for (const [id, mat] of materialsCache) {
      if (id.includes('power')) mat.stat = 'attack';
      else if (id.includes('guard')) mat.stat = 'defense';
      else if (id.includes('hit')) mat.stat = 'accuracy';
      else if (id.includes('swift')) mat.stat = 'evasion';
      else if (id.includes('hp')) mat.stat = 'hp';
      else if (id.includes('pp')) mat.stat = 'pp';
      else if (id.includes('mind')) mat.stat = 'technique';
    }
  }
  return materialsCache;
}

/**
 * Get a specific material by ID
 */
export function getMaterial(id: string): MaterialData | undefined {
  return getMaterials().get(id);
}

// ============================================================================
// SET BONUSES
// ============================================================================

export interface SetBonusData {
  id: string;
  armor: string;
  weapons: string[];
  bonuses: {
    attack: number;
    mental: number;
    accuracy: number;
    defense: number;
    evasion: number;
  };
}

let setBonusesCache: Map<string, SetBonusData> | null = null;

/**
 * Get all set bonuses
 */
export function getSetBonuses(): Map<string, SetBonusData> {
  if (!setBonusesCache) {
    setBonusesCache = loadJsonDir<SetBonusData>('set-bonuses');
  }
  return setBonusesCache;
}

/**
 * Get set bonus for an armor
 */
export function getSetBonusForArmor(armorName: string): SetBonusData | undefined {
  for (const [id, bonus] of getSetBonuses()) {
    if (bonus.armor.toLowerCase() === armorName.toLowerCase()) {
      return bonus;
    }
  }
  return undefined;
}

/**
 * Check if weapon completes a set with armor
 */
export function checkSetBonus(armorName: string, weaponName: string): SetBonusData | null {
  const setBonus = getSetBonusForArmor(armorName);
  if (!setBonus) return null;

  const hasWeapon = setBonus.weapons.some(w =>
    w.toLowerCase() === weaponName.toLowerCase()
  );

  return hasWeapon ? setBonus : null;
}

// ============================================================================
// WEAPON RESTRICTIONS
// ============================================================================

export interface WeaponRestrictionsData {
  classMapping: Record<string, string[]>;
  weaponTypes: Record<string, {
    label: string;
    usableBy: string[];
  }>;
}

let weaponRestrictionsCache: WeaponRestrictionsData | null = null;

/**
 * Get weapon restrictions data
 */
export function getWeaponRestrictions(): WeaponRestrictionsData | null {
  if (!weaponRestrictionsCache) {
    weaponRestrictionsCache = loadJsonFile<WeaponRestrictionsData>('class-weapon-restrictions.json');
  }
  return weaponRestrictionsCache;
}

/**
 * Check if a class can use a weapon type
 */
export function canClassUseWeaponType(classId: string, weaponType: string): boolean {
  const restrictions = getWeaponRestrictions();
  if (!restrictions) return true; // Allow if no restrictions loaded

  const weaponData = restrictions.weaponTypes[weaponType.toLowerCase()];
  if (!weaponData) return true; // Allow unknown weapon types

  // Find which class group this class belongs to
  const classLower = classId.toLowerCase();
  for (const [groupName, classes] of Object.entries(restrictions.classMapping)) {
    if (classes.includes(classLower)) {
      return weaponData.usableBy.includes(groupName);
    }
  }

  return false;
}

/**
 * Get all weapon types usable by a class
 */
export function getUsableWeaponTypes(classId: string): string[] {
  const restrictions = getWeaponRestrictions();
  if (!restrictions) return [];

  const classLower = classId.toLowerCase();
  let classGroup: string | null = null;

  for (const [groupName, classes] of Object.entries(restrictions.classMapping)) {
    if (classes.includes(classLower)) {
      classGroup = groupName;
      break;
    }
  }

  if (!classGroup) return [];

  const usable: string[] = [];
  for (const [type, data] of Object.entries(restrictions.weaponTypes)) {
    if (data.usableBy.includes(classGroup)) {
      usable.push(type);
    }
  }

  return usable;
}

// ============================================================================
// PHOTON ARTS
// ============================================================================

export interface PhotonArtData {
  id: string;
  name: string;
  weaponType: string;
  classType: 'Hunter' | 'Ranger' | 'Force';
  attackMod: number | null;
  accuracyMod?: number;
  ppCost: number;
  targets?: number;
  range?: string;
  area?: number;
  hits?: number;
  notes?: string;
}

let photonArtsCache: Map<string, PhotonArtData> | null = null;

/**
 * Get all photon arts
 */
export function getPhotonArts(): Map<string, PhotonArtData> {
  if (!photonArtsCache) {
    photonArtsCache = loadJsonDir<PhotonArtData>('photon-arts');
  }
  return photonArtsCache;
}

/**
 * Get a specific photon art
 */
export function getPhotonArt(id: string): PhotonArtData | undefined {
  return getPhotonArts().get(id);
}

/**
 * Get photon arts for a weapon type
 */
export function getPhotonArtsForWeapon(weaponType: string): PhotonArtData[] {
  return Array.from(getPhotonArts().values())
    .filter(pa => pa.weaponType.toLowerCase() === weaponType.toLowerCase());
}

/**
 * Get photon arts for a class type
 */
export function getPhotonArtsForClass(classType: string): PhotonArtData[] {
  const type = classType.toLowerCase();
  let category: string;
  if (type.startsWith('hu')) category = 'Hunter';
  else if (type.startsWith('ra')) category = 'Ranger';
  else if (type.startsWith('fo')) category = 'Force';
  else return [];

  return Array.from(getPhotonArts().values())
    .filter(pa => pa.classType === category);
}

// ============================================================================
// QUEST DEFINITIONS (Detailed quest data)
// ============================================================================

export interface QuestDifficultyData {
  difficulty: 'Normal' | 'Hard' | 'Super Hard' | 'Ultimate';
  recommendedLevel?: number;
  rewards: {
    meseta: number;
    experience: number;
    items?: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
    }>;
  };
}

export interface QuestObjectiveData {
  type: 'defeat_enemies' | 'collect_items' | 'reach_location' | 'defeat_boss' | 'escort_npc';
  description: string;
  target?: string;
  required?: number;
}

export interface QuestDefinitionData {
  id: string;
  questId: string;
  questName: string;
  questType: 'story' | 'side' | 'multiplayer' | 'post_game';
  area: string;
  description: string;
  race?: 'Human' | 'Newman' | 'CAST';
  difficulties: QuestDifficultyData[];
  requirements?: {
    minLevel: number;
    prerequisiteQuests: string[];
    unlockCondition?: string;
  };
  objectives: QuestObjectiveData[];
  multiplayerType?: 'solo' | 'co-op' | 'boss';
  isRepeatable: boolean;
  isSecret: boolean;
  floors?: number;
  bossFrequency?: number;
}

let questDefinitionsCache: Map<string, QuestDefinitionData> | null = null;

/**
 * Get all quest definitions
 */
export function getQuestDefinitions(): Map<string, QuestDefinitionData> {
  if (!questDefinitionsCache) {
    questDefinitionsCache = loadJsonDir<QuestDefinitionData>('quest-definitions');
  }
  return questDefinitionsCache;
}

/**
 * Get a specific quest definition by ID
 */
export function getQuestDefinition(id: string): QuestDefinitionData | undefined {
  return getQuestDefinitions().get(id);
}

/**
 * Get quest definitions by type (story, side, etc.)
 */
export function getQuestsByType(questType: string): QuestDefinitionData[] {
  return Array.from(getQuestDefinitions().values())
    .filter(q => q.questType === questType);
}

/**
 * Get story quests in order (by chapter/prerequisite chain)
 */
export function getStoryQuests(): QuestDefinitionData[] {
  const storyQuests = getQuestsByType('story');

  // Sort by prerequisite chain - quests with no prerequisites come first
  const sorted: QuestDefinitionData[] = [];
  const remaining = [...storyQuests];
  const addedIds = new Set<string>();

  // Keep adding quests whose prerequisites are all satisfied
  while (remaining.length > 0) {
    const canAdd = remaining.filter(q => {
      const prereqs = q.requirements?.prerequisiteQuests ?? [];
      return prereqs.every(p => addedIds.has(p));
    });

    if (canAdd.length === 0) {
      // No more can be added (circular dependency or missing prereq)
      sorted.push(...remaining);
      break;
    }

    // Sort by minLevel among those that can be added
    canAdd.sort((a, b) => (a.requirements?.minLevel ?? 1) - (b.requirements?.minLevel ?? 1));

    for (const q of canAdd) {
      sorted.push(q);
      addedIds.add(q.questId);
      remaining.splice(remaining.indexOf(q), 1);
    }
  }

  return sorted;
}

/**
 * Get side quests available after completing a story quest
 */
export function getSideQuestsUnlockedBy(storyQuestId: string): QuestDefinitionData[] {
  return getQuestsByType('side')
    .filter(q => q.requirements?.prerequisiteQuests?.includes(storyQuestId));
}

/**
 * Get quests for a specific area
 */
export function getQuestsForArea(area: string): QuestDefinitionData[] {
  return Array.from(getQuestDefinitions().values())
    .filter(q => q.area.toLowerCase().includes(area.toLowerCase()));
}

// ============================================================================
// TECHNIQUES (Spells)
// ============================================================================

export interface TechniqueData {
  id: string;
  name: string;
  element: 'fire' | 'ice' | 'lightning' | 'light' | 'dark' | 'support';
  type: 'attack' | 'heal' | 'buff' | 'debuff';
  basePower: number;
  ppCost: number;
  range: 'single' | 'area' | 'self' | 'party';
  description: string;
  maxLevel: number;
}

// Hardcoded techniques (classic PSO spells)
const TECHNIQUES: TechniqueData[] = [
  // Fire
  { id: 'foie', name: 'Foie', element: 'fire', type: 'attack', basePower: 50, ppCost: 5, range: 'single', description: 'Fire attack', maxLevel: 30 },
  { id: 'gifoie', name: 'Gifoie', element: 'fire', type: 'attack', basePower: 120, ppCost: 20, range: 'area', description: 'Fire explosion', maxLevel: 30 },
  { id: 'rafoie', name: 'Rafoie', element: 'fire', type: 'attack', basePower: 200, ppCost: 30, range: 'area', description: 'Fire storm', maxLevel: 30 },
  // Ice
  { id: 'barta', name: 'Barta', element: 'ice', type: 'attack', basePower: 55, ppCost: 6, range: 'single', description: 'Ice attack', maxLevel: 30 },
  { id: 'gibarta', name: 'Gibarta', element: 'ice', type: 'attack', basePower: 130, ppCost: 22, range: 'area', description: 'Ice wave', maxLevel: 30 },
  { id: 'rabarta', name: 'Rabarta', element: 'ice', type: 'attack', basePower: 220, ppCost: 35, range: 'area', description: 'Blizzard', maxLevel: 30 },
  // Lightning
  { id: 'zonde', name: 'Zonde', element: 'lightning', type: 'attack', basePower: 45, ppCost: 4, range: 'single', description: 'Lightning bolt', maxLevel: 30 },
  { id: 'gizonde', name: 'Gizonde', element: 'lightning', type: 'attack', basePower: 110, ppCost: 18, range: 'area', description: 'Chain lightning', maxLevel: 30 },
  { id: 'razonde', name: 'Razonde', element: 'lightning', type: 'attack', basePower: 180, ppCost: 28, range: 'area', description: 'Thunder storm', maxLevel: 30 },
  // Light
  { id: 'grants', name: 'Grants', element: 'light', type: 'attack', basePower: 300, ppCost: 50, range: 'single', description: 'Holy light', maxLevel: 30 },
  // Dark
  { id: 'megid', name: 'Megid', element: 'dark', type: 'attack', basePower: 0, ppCost: 40, range: 'single', description: 'Instant death (30% chance)', maxLevel: 30 },
  // Support
  { id: 'resta', name: 'Resta', element: 'support', type: 'heal', basePower: 100, ppCost: 10, range: 'party', description: 'Heal HP', maxLevel: 30 },
  { id: 'anti', name: 'Anti', element: 'support', type: 'heal', basePower: 0, ppCost: 8, range: 'single', description: 'Cure status', maxLevel: 30 },
  { id: 'reverser', name: 'Reverser', element: 'support', type: 'heal', basePower: 0, ppCost: 20, range: 'single', description: 'Revive ally', maxLevel: 30 },
  { id: 'shifta', name: 'Shifta', element: 'support', type: 'buff', basePower: 10, ppCost: 15, range: 'party', description: 'Boost ATK', maxLevel: 30 },
  { id: 'deband', name: 'Deband', element: 'support', type: 'buff', basePower: 10, ppCost: 15, range: 'party', description: 'Boost DEF', maxLevel: 30 },
  { id: 'jellen', name: 'Jellen', element: 'support', type: 'debuff', basePower: 10, ppCost: 12, range: 'area', description: 'Lower enemy ATK', maxLevel: 30 },
  { id: 'zalure', name: 'Zalure', element: 'support', type: 'debuff', basePower: 10, ppCost: 12, range: 'area', description: 'Lower enemy DEF', maxLevel: 30 },
  { id: 'ryuker', name: 'Ryuker', element: 'support', type: 'buff', basePower: 0, ppCost: 30, range: 'self', description: 'Create telepipe', maxLevel: 1 },
];

let techniquesCache: Map<string, TechniqueData> | null = null;

/**
 * Get all techniques
 */
export function getTechniques(): Map<string, TechniqueData> {
  if (!techniquesCache) {
    techniquesCache = new Map();
    for (const tech of TECHNIQUES) {
      techniquesCache.set(tech.id, tech);
    }
  }
  return techniquesCache;
}

/**
 * Get a specific technique
 */
export function getTechnique(id: string): TechniqueData | undefined {
  return getTechniques().get(id);
}

/**
 * Get techniques by element
 */
export function getTechniquesByElement(element: string): TechniqueData[] {
  return Array.from(getTechniques().values())
    .filter(t => t.element === element.toLowerCase());
}

/**
 * Clear all caches (for testing)
 */
export function clearContentCaches(): void {
  weaponsCache = null;
  armorsCache = null;
  unitsCache = null;
  enemiesCache = null;
  experienceCache = null;
  classesCache = null;
  shopsCache = null;
  dropTablesCache = null;
  missionsCache = null;
  materialsCache = null;
  setBonusesCache = null;
  weaponRestrictionsCache = null;
  photonArtsCache = null;
  techniquesCache = null;
  questDefinitionsCache = null;
}

/**
 * Preload all content (optional, for faster subsequent access)
 */
export function preloadContent(): void {
  getWeapons();
  getArmors();
  getUnits();
  getEnemies();
  getExperienceTable();
  getClasses();
  getShops();
  getDropTables();
  getMissions();
  getQuestDefinitions();
}
