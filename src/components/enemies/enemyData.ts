/**
 * Enemy Gallery Data
 *
 * Maps enemy IDs to categories and provides metadata.
 */

export interface EnemyInfo {
  id: string;
  name: string;
  modelBaseName: string;
  animationCount: number;
  effectCount: number;
}

export interface EnemyCategory {
  id: string;
  label: string;
  description: string;
}

export type EnemyElement = 'Native' | 'Beast' | 'Machine' | 'Dark';

export interface EnemyMetadata {
  displayName: string;
  element?: EnemyElement;
  location?: string;
  isRare?: boolean;
}

// Enemy categories (organized by primary area)
export const ENEMY_CATEGORIES: EnemyCategory[] = [
  { id: 'gurhacia', label: 'Gurhacia Valley', description: 'Forest and grassland enemies' },
  { id: 'rioh', label: 'Rioh Snowfield', description: 'Snow and ice enemies' },
  { id: 'ozette', label: 'Ozette Wetland', description: 'Swamp and water enemies' },
  { id: 'paru', label: 'Oblivion City Paru', description: 'Ruined city enemies' },
  { id: 'makara', label: 'Makara Ruins', description: 'Cave and ruins enemies' },
  { id: 'arca', label: 'Arca Plant', description: 'Machine enemies' },
  { id: 'dark', label: 'Dark Shrine', description: 'Dark element creatures' },
  { id: 'boss', label: 'Bosses', description: 'Major boss encounters' },
  { id: 'rare', label: 'Rare', description: 'Rare spawns (Rappies & Boomas)' },
];

// Enemy display names and metadata (modelId -> enemy name mapping)
const ENEMY_METADATA: Record<string, EnemyMetadata> = {
  // === Gurhacia Valley ===
  booma: { displayName: 'Booma Origin', element: 'Native', location: 'Gurhacia Valley', isRare: true },
  snake: { displayName: 'Garapython', element: 'Native', location: 'Gurhacia Valley' },
  snake_rare: { displayName: 'Garahadan', element: 'Native', location: 'Gurhacia Valley' },
  lizard: { displayName: 'Ghowl', element: 'Native', location: 'Gurhacia Valley' },
  hyena: { displayName: 'Grimble', element: 'Native', location: 'Gurhacia Valley' },
  hyena_rare: { displayName: 'Tormatible', element: 'Native', location: 'Gurhacia Valley', isRare: true },
  rappy: { displayName: 'Rappy', element: 'Native', location: 'Gurhacia Valley', isRare: true },
  vulture: { displayName: 'Vulkure', element: 'Native', location: 'Gurhacia Valley' },
  lion: { displayName: 'Helion', element: 'Beast', location: 'Gurhacia Valley' },
  lion_rare: { displayName: 'Blaze Helion', element: 'Beast', location: 'Gurhacia Valley', isRare: true },
  boss_dragon: { displayName: 'Reyburn', element: 'Native', location: 'Gurhacia Valley' },

  // === Rioh Snowfield ===
  wolf: { displayName: 'Reyhound', element: 'Native', location: 'Rioh Snowfield' },
  deer: { displayName: 'Stagg', element: 'Native', location: 'Rioh Snowfield' },
  rabbit: { displayName: 'Usanny', element: 'Native', location: 'Rioh Snowfield' },
  rabbit_rare: { displayName: 'Usanimere', element: 'Native', location: 'Rioh Snowfield', isRare: true },
  gorilla: { displayName: 'Hildegao', element: 'Beast', location: 'Rioh Snowfield' },
  gorilla_female: { displayName: 'Hildeghana', element: 'Beast', location: 'Rioh Snowfield' },
  gorilla_rare: { displayName: 'Hildegigas', element: 'Beast', location: 'Rioh Snowfield', isRare: true },

  // === Ozette Wetland ===
  jigobooma: { displayName: 'Gigobooma Origin', element: 'Native', location: 'Ozette Wetland', isRare: true },
  seal: { displayName: 'Hypao', element: 'Native', location: 'Ozette Wetland' },
  seal_rare: { displayName: 'Vespao', element: 'Native', location: 'Ozette Wetland' },
  frog: { displayName: 'Porel', element: 'Native', location: 'Ozette Wetland' },
  frog_rare: { displayName: 'Pomarr', element: 'Native', location: 'Ozette Wetland' },
  roc: { displayName: 'Pelcatraz', element: 'Beast', location: 'Ozette Wetland' },
  roc_rare: { displayName: 'Pelcatobur', element: 'Beast', location: 'Ozette Wetland', isRare: true },
  boss_octopus: { displayName: 'Octo Diablo', element: 'Beast', location: 'Ozette Wetland' },

  // === Oblivion City Paru ===
  rappy_blue: { displayName: 'Ar Rappy', element: 'Native', location: 'Oblivion City Paru', isRare: true },
  shrimp: { displayName: 'Bolix', element: 'Native', location: 'Oblivion City Paru' },
  shrimp_rare: { displayName: 'Goldix', element: 'Native', location: 'Oblivion City Paru', isRare: true },
  frog_bomb: { displayName: 'Pobomma', element: 'Native', location: 'Oblivion City Paru' },
  orangutan: { displayName: 'Froutang', element: 'Beast', location: 'Oblivion City Paru' },
  orangutan_rare: { displayName: 'Frunaked', element: 'Beast', location: 'Oblivion City Paru', isRare: true },
  quad: { displayName: 'Izhirak-S6', element: 'Machine', location: 'Oblivion City Paru' },
  quad_rare: { displayName: 'Azherowa-B2', element: 'Machine', location: 'Oblivion City Paru', isRare: true },
  boss_robot: { displayName: 'Chaos & Mobius', element: 'Machine', location: 'Oblivion City Paru' },
  boss_robot_cmb: { displayName: 'Chaos & Mobius (Combined)', element: 'Machine', location: 'Oblivion City Paru' },

  // === Makara Ruins ===
  bat: { displayName: 'Batt', element: 'Native', location: 'Makara Ruins' },
  bat_blue: { displayName: 'Bullbatt', element: 'Native', location: 'Makara Ruins' },
  tiger: { displayName: 'Kapantha', element: 'Native', location: 'Makara Ruins' },
  mole: { displayName: 'Rumole', element: 'Native', location: 'Makara Ruins' },
  armadillo: { displayName: 'Rohjade', element: 'Beast', location: 'Makara Ruins' },
  armadillo_rare: { displayName: 'Rohcrysta', element: 'Beast', location: 'Makara Ruins', isRare: true },

  // === Arca Plant ===
  rappy_red: { displayName: 'Rab Rappy', element: 'Native', location: 'Arca Plant', isRare: true },
  shooter: { displayName: 'Korse', element: 'Machine', location: 'Arca Plant' },
  shooter_leader: { displayName: 'Akorse', element: 'Machine', location: 'Arca Plant' },
  swordman: { displayName: 'Arkzein', element: 'Machine', location: 'Arca Plant' },
  swordman_rare: { displayName: 'Arkzein R', element: 'Machine', location: 'Arca Plant', isRare: true },
  board: { displayName: 'Finjer R', element: 'Machine', location: 'Arca Plant' },
  board_blue: { displayName: 'Finjer B', element: 'Machine', location: 'Arca Plant' },
  board_green: { displayName: 'Finjer G', element: 'Machine', location: 'Arca Plant' },
  boss_mother: { displayName: 'Humilias', element: 'Machine', location: 'Arca Plant' },
  boss_mother_piece: { displayName: 'Humilias (Core)', element: 'Machine', location: 'Arca Plant' },

  // === Dark Shrine ===
  circle: { displayName: 'Eulada', element: 'Dark', location: 'Dark Shrine' },
  circle_black: { displayName: 'Euladaveil', element: 'Dark', location: 'Dark Shrine' },
  lower: { displayName: 'Eulid', element: 'Dark', location: 'Dark Shrine' },
  lower_black: { displayName: 'Eulidveil', element: 'Dark', location: 'Dark Shrine' },
  leg: { displayName: 'Derreo', element: 'Dark', location: 'Dark Shrine' },
  leg_black: { displayName: 'Zerreo', element: 'Dark', location: 'Dark Shrine' },
  tank: { displayName: 'Phobos', element: 'Dark', location: 'Dark Shrine' },
  tank_rare: { displayName: 'Phobos Dyna', element: 'Dark', location: 'Dark Shrine', isRare: true },
  swordman_b: { displayName: 'Zaphobos', element: 'Dark', location: 'Dark Shrine' },
  swordman_rare_b: { displayName: 'Zaphobos Dyna', element: 'Dark', location: 'Dark Shrine', isRare: true },
  mother: { displayName: 'Mother Trinity', element: 'Dark', location: 'Dark Shrine' },
  boss_darkfalz: { displayName: 'Dark Falz', element: 'Dark', location: 'Dark Shrine' },

  // === Eternal Tower (Mother variants) ===
  mother_sword: { displayName: 'Blade Mother', element: 'Dark', location: 'Eternal Tower' },
  mother_gun: { displayName: 'Shot Mother', element: 'Dark', location: 'Eternal Tower' },
  mother_tech: { displayName: 'Force Mother', element: 'Native', location: 'Eternal Tower' },

};

// Map enemy IDs to categories (based on primary area)
const ENEMY_CATEGORY_MAP: Record<string, string> = {
  // Bosses
  boss_darkfalz: 'boss',
  boss_dragon: 'boss',
  boss_mother: 'boss',
  boss_mother_piece: 'boss',
  boss_octopus: 'boss',
  boss_robot: 'boss',
  boss_robot_cmb: 'boss',

  // Gurhacia Valley
  snake: 'gurhacia',
  snake_rare: 'gurhacia',
  lizard: 'gurhacia',
  hyena: 'gurhacia',
  hyena_rare: 'gurhacia',
  vulture: 'gurhacia',
  lion: 'gurhacia',
  lion_rare: 'gurhacia',

  // Rioh Snowfield
  wolf: 'rioh',
  deer: 'rioh',
  rabbit: 'rioh',
  rabbit_rare: 'rioh',
  gorilla: 'rioh',
  gorilla_female: 'rioh',
  gorilla_rare: 'rioh',

  // Ozette Wetland
  seal: 'ozette',
  frog: 'ozette',
  frog_rare: 'ozette',
  seal_rare: 'ozette',
  roc: 'ozette',
  roc_rare: 'ozette',

  // Oblivion City Paru
  shrimp: 'paru',
  shrimp_rare: 'paru',
  frog_bomb: 'paru',
  orangutan: 'paru',
  orangutan_rare: 'paru',
  quad: 'paru',
  quad_rare: 'paru',

  // Makara Ruins
  bat: 'makara',
  bat_blue: 'makara',
  tiger: 'makara',
  mole: 'makara',
  armadillo: 'makara',
  armadillo_rare: 'makara',

  // Arca Plant
  shooter: 'arca',
  shooter_leader: 'arca',
  swordman: 'arca',
  swordman_rare: 'arca',
  board: 'arca',
  board_blue: 'arca',
  board_green: 'arca',

  // Dark Shrine
  circle: 'dark',
  circle_black: 'dark',
  leg: 'dark',
  leg_black: 'dark',
  lower: 'dark',
  lower_black: 'dark',
  tank: 'dark',
  tank_rare: 'dark',
  swordman_b: 'dark',
  swordman_rare_b: 'dark',
  mother: 'dark',
  mother_gun: 'dark',
  mother_sword: 'dark',
  mother_tech: 'dark',

  // Rare spawns (Rappies & Boomas)
  booma: 'rare',
  jigobooma: 'rare',
  rappy: 'rare',
  rappy_blue: 'rare',
  rappy_red: 'rare',
};

// All enemy IDs (populated from /public/enemies directory)
export const ALL_ENEMY_IDS = [
  'armadillo', 'armadillo_rare',
  'bat', 'bat_blue',
  'board', 'board_blue', 'board_green',
  'booma',
  'boss_darkfalz', 'boss_dragon', 'boss_mother', 'boss_mother_piece', 'boss_octopus', 'boss_robot', 'boss_robot_cmb',
  'circle', 'circle_black',
  'deer',
  'frog', 'frog_bomb', 'frog_rare',
  'gorilla', 'gorilla_female', 'gorilla_rare',
  'hyena', 'hyena_rare',
  'jigobooma',
  'leg', 'leg_black',
  'lion', 'lion_rare',
  'lizard',
  'lower', 'lower_black',
  'mole',
  'mother', 'mother_gun', 'mother_sword', 'mother_tech',
  'orangutan', 'orangutan_rare',
  'quad', 'quad_rare',
  'rabbit', 'rabbit_rare',
  'rappy', 'rappy_blue', 'rappy_red',
  'roc', 'roc_rare',
  'seal', 'seal_rare',
  'shooter', 'shooter_leader',
  'shrimp', 'shrimp_rare',
  'snake', 'snake_rare',
  'swordman', 'swordman_b', 'swordman_rare', 'swordman_rare_b',
  'tank', 'tank_rare',
  'tiger',
  'vulture',
  'wolf',
];

/**
 * Get enemy category from enemy ID
 */
export function getEnemyCategory(enemyId: string): EnemyCategory | null {
  const categoryId = ENEMY_CATEGORY_MAP[enemyId] || 'native';
  return ENEMY_CATEGORIES.find(cat => cat.id === categoryId) || null;
}

/**
 * Get GLB path for an enemy
 */
export function getEnemyGlbPath(enemyId: string, modelBaseName: string): string {
  return `/enemies/${enemyId}/${modelBaseName}/${modelBaseName}.glb`;
}

/**
 * Get texture path for an enemy
 */
export function getEnemyTexturePath(enemyId: string, modelBaseName: string, textureName: string): string {
  return `/enemies/${enemyId}/${modelBaseName}/${textureName}`;
}

/**
 * Get info.json path for an enemy
 */
export function getEnemyInfoPath(enemyId: string): string {
  return `/enemies/${enemyId}/info.json`;
}

/**
 * Get animations.json path for an enemy
 */
export function getEnemyAnimationsPath(enemyId: string): string {
  return `/enemies/${enemyId}/animations.json`;
}

/**
 * Get enemy metadata
 */
export function getEnemyMetadata(enemyId: string): EnemyMetadata | null {
  return ENEMY_METADATA[enemyId] || null;
}

/**
 * Get enemy display name
 */
export function getEnemyDisplayName(enemyId: string): string {
  const metadata = ENEMY_METADATA[enemyId];
  if (metadata) {
    return metadata.displayName;
  }
  // Fallback: convert snake_case to Title Case
  return enemyId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format enemy name for display (convert snake_case to Title Case)
 * @deprecated Use getEnemyDisplayName instead
 */
export function formatEnemyName(enemyId: string): string {
  return getEnemyDisplayName(enemyId);
}

/**
 * Check if enemy is a boss
 */
export function isEnemyBoss(enemyId: string): boolean {
  return enemyId.startsWith('boss_');
}

/**
 * Check if enemy is a rare variant
 */
export function isEnemyRare(enemyId: string): boolean {
  const metadata = ENEMY_METADATA[enemyId];
  if (metadata?.isRare !== undefined) {
    return metadata.isRare;
  }
  return enemyId.endsWith('_rare');
}

/**
 * Get enemy element
 */
export function getEnemyElement(enemyId: string): EnemyElement | null {
  return ENEMY_METADATA[enemyId]?.element || null;
}

/**
 * Get the base enemy ID for a rare variant
 * e.g., 'snake_rare' -> 'snake', 'hyena_rare' -> 'hyena'
 * Returns null if not a rare variant or base doesn't exist
 */
export function getBaseEnemyId(enemyId: string): string | null {
  if (!enemyId.endsWith('_rare')) {
    return null;
  }
  const baseId = enemyId.replace(/_rare$/, '');
  // Check if the base enemy exists in ALL_ENEMY_IDS
  if (ALL_ENEMY_IDS.includes(baseId)) {
    return baseId;
  }
  return null;
}

/**
 * Get enemy location
 */
export function getEnemyLocation(enemyId: string): string | null {
  return ENEMY_METADATA[enemyId]?.location || null;
}

/**
 * Group enemies by category
 */
export function getEnemiesByCategory(): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const category of ENEMY_CATEGORIES) {
    grouped.set(category.id, []);
  }
  grouped.set('other', []);

  for (const enemyId of ALL_ENEMY_IDS) {
    const categoryId = ENEMY_CATEGORY_MAP[enemyId];
    if (categoryId && grouped.has(categoryId)) {
      grouped.get(categoryId)?.push(enemyId);
    } else {
      grouped.get('other')?.push(enemyId);
    }
  }

  return grouped;
}
