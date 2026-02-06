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
}
