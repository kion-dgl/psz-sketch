/**
 * Stage Content Types
 * Types for stage content generation and mission structure
 */

import type { EnemyElement } from '../../components/enemies/enemyData';

// ============================================================================
// Area & Difficulty
// ============================================================================

/** Areas where enemies can spawn */
export type EnemyArea =
  | 'gurhacia'   // Gurhacia Valley
  | 'rioh'       // Rioh Snowfield
  | 'ozette'     // Ozette Wetland
  | 'paru'       // Oblivion City Paru
  | 'makara'     // Makara Ruins
  | 'arca'       // Arca Plant
  | 'dark';      // Dark Shrine

/** Stage area variants (visual theme) */
export type StageArea =
  | 'valley-a'
  | 'valley-b'
  | 'valley-e'
  | 'snowfield-a'
  | 'snowfield-b'
  | 'wetland-a'
  | 'wetland-b'
  | 'city-a'
  | 'city-b'
  | 'ruins-a'
  | 'ruins-b'
  | 'plant-a'
  | 'plant-b'
  | 'shrine-a'
  | 'shrine-b';

/** Difficulty affects enemy count, levels, and rare spawn rates */
export type ContentDifficulty = 'normal' | 'hard' | 'super-hard';

// ============================================================================
// Enemy Spawning
// ============================================================================

/** Single enemy spawn point */
export interface EnemySpawn {
  /** Enemy type ID (e.g., "snake", "hyena", "lion") */
  enemyId: string;
  /** World position [x, y, z] */
  position: [number, number, number];
  /** Y-axis rotation in radians (default: 0) */
  rotation?: number;
  /** Wave group for staged spawning (0 = immediate, 1+ = later waves) */
  waveGroup?: number;
  /** Level override (default: based on difficulty) */
  level?: number;
  /** Whether this is a rare variant spawn */
  isRare?: boolean;
}

/** Group of enemies that spawn together */
export interface EnemyWave {
  /** Wave number (0 = initial, 1+ = triggered) */
  waveNumber: number;
  /** Trigger condition for this wave */
  trigger: WaveTrigger;
  /** Enemies in this wave */
  spawns: EnemySpawn[];
}

/** How a wave gets triggered */
export type WaveTrigger =
  | { type: 'immediate' }                    // Spawn on stage enter
  | { type: 'previous-cleared' }             // Previous wave defeated
  | { type: 'player-proximity'; radius: number; position: [number, number, number] }
  | { type: 'switch-activated'; switchId: string }
  | { type: 'time-elapsed'; seconds: number };

// ============================================================================
// Interactive Elements
// ============================================================================

/** Element types that can be placed in stages */
export type ElementType =
  | 'box'           // Destructible container with drops
  | 'rare-box'      // Special container with better drops
  | 'fence'         // Barrier deactivated by switch
  | 'fence4'        // 4-post fence variant
  | 'key'           // Unlocks a key-gate
  | 'step-switch'   // Activates when stepped on
  | 'interact-switch' // Activates when interacted with
  | 'remote-switch' // Activates when hit by attack
  | 'waypoint';     // Navigation/teleport marker

/** Single element placement */
export interface ElementSpawn {
  /** Unique ID for this element instance */
  id: string;
  /** Element type */
  type: ElementType;
  /** World position [x, y, z] */
  position: [number, number, number];
  /** Y-axis rotation in radians (default: 0) */
  rotation?: number;
  /** Scale multiplier (default: 1) */
  scale?: number;
  /** ID of linked element (key→keyGate, switch→fence) */
  linkedTo?: string;
  /** Drop table ID for boxes */
  dropTable?: string;
  /** Initial state override */
  initialState?: string;
}

/** Key-gate connection */
export interface KeyGateSpawn {
  /** Unique ID for this key-gate */
  id: string;
  /** Gate direction (which edge of the grid cell) */
  direction: 'north' | 'south' | 'east' | 'west';
  /** Position offset from gate config */
  position: [number, number, number];
  /** ID of the key that unlocks this gate */
  keyId: string;
}

/** Fence-switch connection */
export interface FenceSwitchLink {
  /** Fence element ID */
  fenceId: string;
  /** Switch element ID that controls it */
  switchId: string;
  /** Switch type */
  switchType: 'step' | 'interact' | 'remote';
}

// ============================================================================
// Drop Tables
// ============================================================================

/** Item that can drop from containers */
export interface DropEntry {
  /** Item ID */
  itemId: string;
  /** Drop weight (higher = more likely) */
  weight: number;
  /** Minimum quantity */
  minQuantity?: number;
  /** Maximum quantity */
  maxQuantity?: number;
}

/** Drop table definition */
export interface DropTable {
  /** Unique table ID */
  id: string;
  /** Possible drops */
  entries: DropEntry[];
  /** Guaranteed meseta range */
  meseta?: { min: number; max: number };
  /** Number of item rolls */
  rolls?: number;
}

// ============================================================================
// Stage Content
// ============================================================================

/** Complete content definition for a single stage/grid */
export interface StageContent {
  /** Stage config ID (e.g., "s01a_ib1") */
  stageId: string;
  /** Enemy waves for this stage */
  waves: EnemyWave[];
  /** Interactive elements */
  elements: ElementSpawn[];
  /** Key-gates (separate from regular gates) */
  keyGates: KeyGateSpawn[];
  /** Fence-switch connections */
  fenceSwitchLinks: FenceSwitchLink[];
  /** Drop tables used by boxes in this stage */
  dropTables: DropTable[];
  /** Whether all enemies must be defeated to open gates */
  requiresClear?: boolean;
  /** Boss enemy ID if this is a boss stage */
  bossId?: string;
}

// ============================================================================
// Grid Cell (from GridViewer export)
// ============================================================================

/** Grid cell data exported from GridViewer */
export interface GridCell {
  /** Position in grid "row,col" format */
  pos: string;
  /** Stage name without prefix (e.g., "ib1") */
  stage: string;
  /** Full stage name with prefix (e.g., "s01a_ib1") */
  fullStageName: string;
  /** Gate connections: { originalGate: "neighborPos" } */
  connections: Record<string, string>;
  /** Is this the start cell? */
  start?: boolean;
  /** Is this the end cell? */
  end?: boolean;
  /** Is this a dead-end branch? */
  branch?: boolean;
  /** Does this cell have a key? */
  key?: boolean;
  /** Key-gate direction (original gate that is locked) */
  keyGate?: string;
  /** Warp exit direction (original gate that leads to next stage) */
  warp?: string;
}

/** Mission data exported from GridViewer */
export interface MissionLayout {
  /** Area identifier (e.g., "valley-a") */
  area: StageArea;
  /** Grid cells in the mission */
  cells: GridCell[];
  /** Stage configurations for all used stages */
  stageConfigs: Record<string, StageConfig>;
}

/** Stage configuration from valley-configs.json */
export interface StageConfig {
  /** Size of the stage grid */
  gridSize: number;
  /** Position offset [x, z] */
  gridOffset: [number, number];
  /** Gate definitions */
  gates: GateConfig[];
  /** Spawn points for player entry */
  spawnPoints: SpawnPoint[];
  /** Gate exit triggers */
  triggers: GateTrigger[];
}

/** Gate configuration */
export interface GateConfig {
  /** Edge direction */
  edge: 'north' | 'south' | 'east' | 'west';
  /** X position */
  x: number;
  /** Z position */
  z: number;
  /** Scale multiplier */
  scale: number;
  /** Whether gate animates */
  animated: boolean;
}

/** Player spawn point */
export interface SpawnPoint {
  /** Position [x, y, z] */
  position: [number, number, number];
  /** Rotation in radians */
  rotation: number;
  /** Label (e.g., "North Gate") */
  label: string;
}

/** Gate trigger for stage transitions */
export interface GateTrigger {
  /** Position [x, y, z] */
  position: [number, number, number];
  /** Rotation in radians */
  rotation: number;
  /** Target URL/stage */
  targetUrl: string;
  /** Label (e.g., "North Gate") */
  label: string;
}

// ============================================================================
// Mission Content (Full Mission)
// ============================================================================

/** Complete mission with all stage content */
export interface MissionContent {
  /** Mission identifier */
  id: string;
  /** Mission display name */
  name: string;
  /** Mission description */
  description?: string;
  /** Area for enemy spawning */
  enemyArea: EnemyArea;
  /** Visual area theme */
  stageArea: StageArea;
  /** Difficulty level */
  difficulty: ContentDifficulty;
  /** Grid layout from GridViewer */
  layout: MissionLayout;
  /** Content for each stage (keyed by grid position "row,col") */
  stageContents: Record<string, StageContent>;
  /** Recommended player level */
  recommendedLevel: number;
  /** Par time in seconds (for grading) */
  parTime?: number;
  /** Is this a curated/story mission? */
  isCurated?: boolean;
}

// ============================================================================
// Generation Parameters
// ============================================================================

/** Parameters for random content generation */
export interface GenerationParams {
  /** Enemy area to draw from */
  enemyArea: EnemyArea;
  /** Difficulty level */
  difficulty: ContentDifficulty;
  /** Player level (affects enemy count/level) */
  playerLevel: number;
  /** Seed for reproducible generation (optional) */
  seed?: number;
  /** Enemy density multiplier (default: 1.0) */
  enemyDensity?: number;
  /** Box density multiplier (default: 1.0) */
  boxDensity?: number;
  /** Chance of fence+switch puzzles per stage (0-1) */
  puzzleChance?: number;
  /** Chance of rare enemy spawns (0-1) */
  rareSpawnChance?: number;
  /** Include boss in final stage? */
  includeBoss?: boolean;
  /** Boss enemy ID override */
  bossId?: string;
}

/** Result of content generation */
export interface GenerationResult {
  /** Generated mission content */
  mission: MissionContent;
  /** Generation metadata */
  metadata: {
    seed: number;
    totalEnemies: number;
    totalBoxes: number;
    totalPuzzles: number;
    generatedAt: number;
  };
}

// ============================================================================
// Enemy Pool Configuration
// ============================================================================

/** Enemy pool for an area */
export interface EnemyPool {
  /** Area this pool is for */
  area: EnemyArea;
  /** Common enemies (high spawn rate) */
  common: string[];
  /** Uncommon enemies (medium spawn rate) */
  uncommon: string[];
  /** Rare enemies (low spawn rate, special conditions) */
  rare: string[];
  /** Boss enemies for this area */
  bosses: string[];
  /** Mini-boss or elite enemies */
  elites?: string[];
}

/** Enemy composition for a stage */
export interface EnemyComposition {
  /** Total enemy count */
  count: number;
  /** Enemy type distribution */
  types: Array<{
    enemyId: string;
    count: number;
    waveGroup?: number;
  }>;
}

// ============================================================================
// Re-exports
// ============================================================================

export type { EnemyElement };
