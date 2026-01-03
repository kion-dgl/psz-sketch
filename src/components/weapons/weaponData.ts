/**
 * Weapon Gallery Data
 *
 * Maps weapon IDs to categories and provides metadata.
 * Weapon IDs follow the pattern: W{TYPE}{RARITY}{NUM}
 * - TYPE: 2-letter weapon type (SW=Sword, HG=Handgun, etc.)
 * - RARITY: C=Common, H=Uncommon, N=Rare, R=Very Rare
 * - NUM: Variant number
 */

export interface WeaponInfo {
  id: string;
  name: string;
  textureCount: number;
  animationCount: number;
  variants: string[];
}

export interface WeaponCategory {
  id: string;
  label: string;
  prefix: string;
  description: string;
}

// Weapon categories derived from ID prefixes
export const WEAPON_CATEGORIES: WeaponCategory[] = [
  { id: 'sword', label: 'Sword', prefix: 'wsw', description: 'Two-handed swords with wide sweeping attacks' },
  { id: 'saber', label: 'Saber', prefix: 'wsa', description: 'One-handed blades for quick combos' },
  { id: 'dagger', label: 'Dagger', prefix: 'wda', description: 'Twin daggers for rapid strikes' },
  { id: 'claw', label: 'Claw', prefix: 'wcl', description: 'Fist weapons with slashing attacks' },
  { id: 'double-saber', label: 'Double Saber', prefix: 'wds', description: 'Staff-like weapons with blades on both ends' },
  { id: 'spear', label: 'Spear', prefix: 'wsp', description: 'Long reach polearms' },
  { id: 'slicer', label: 'Slicer', prefix: 'wsl', description: 'Thrown disc weapons' },
  { id: 'handgun', label: 'Handgun', prefix: 'whg', description: 'Single target ranged weapons' },
  { id: 'rifle', label: 'Rifle', prefix: 'wrf', description: 'Long range precision weapons' },
  { id: 'machinegun', label: 'Machinegun', prefix: 'wmg', description: 'Rapid fire ranged weapons' },
  { id: 'launcher', label: 'Launcher', prefix: 'wlc', description: 'Area of effect explosive weapons' },
  { id: 'bazooka', label: 'Bazooka', prefix: 'wba', description: 'Heavy explosive launchers' },
  { id: 'gunblade', label: 'Gunblade', prefix: 'wgb', description: 'Hybrid melee/ranged weapons' },
  { id: 'rod', label: 'Rod', prefix: 'wro', description: 'Casting weapons for techniques' },
  { id: 'wand', label: 'Wand', prefix: 'wwa', description: 'Support casting weapons' },
  { id: 'shield', label: 'Shield', prefix: 'wsh', description: 'Defensive off-hand equipment' },
  { id: 'mag', label: 'Mag', prefix: 'wma', description: 'Companion devices that provide buffs' },
];

// Rarity mapping from ID character
export const RARITY_MAP: Record<string, { label: string; color: string }> = {
  'c': { label: 'Common', color: '#888888' },
  'h': { label: 'Uncommon', color: '#4a9eff' },
  'n': { label: 'Rare', color: '#ffcc00' },
  'r': { label: 'Very Rare', color: '#ff4444' },
};

/**
 * Get weapon category from weapon ID
 */
export function getWeaponCategory(weaponId: string): WeaponCategory | null {
  const id = weaponId.toLowerCase();
  return WEAPON_CATEGORIES.find(cat => id.startsWith(cat.prefix)) || null;
}

/**
 * Get weapon rarity from weapon ID
 */
export function getWeaponRarity(weaponId: string): { label: string; color: string } {
  const id = weaponId.toLowerCase();
  // Rarity is the 4th character (after 3-letter prefix)
  const rarityChar = id.charAt(3);
  return RARITY_MAP[rarityChar] || { label: 'Unknown', color: '#666666' };
}

/**
 * Get GLB path for a weapon variant
 * GLBs are stored in: /weapons/{id}/{id}/{variant}/{variant}.glb
 */
export function getWeaponGlbPath(weaponId: string, variant: string): string {
  const id = weaponId.toLowerCase();
  return `/weapons/${id}/${id}/${variant}/${variant}.glb`;
}

/**
 * Get texture path for a weapon variant
 * Textures are stored in: /weapons/{id}/{id}/{variant}/{variant}.png
 */
export function getWeaponTexturePath(weaponId: string, variant: string): string {
  const id = weaponId.toLowerCase();
  return `/weapons/${id}/${id}/${variant}/${variant}.png`;
}

/**
 * Get info.json path for a weapon
 */
export function getWeaponInfoPath(weaponId: string): string {
  const id = weaponId.toLowerCase();
  return `/weapons/${id}/info.json`;
}

/**
 * All weapon IDs (will be populated from file system scan)
 */
export const ALL_WEAPON_IDS = [
  // Bazooka
  'wbac01', 'wbac02', 'wbah01', 'wbar01', 'wbar02', 'wbar03',
  // Claw
  'wclc01', 'wclh01', 'wclh02', 'wclr01', 'wclr02', 'wclr03', 'wclr04',
  // Dagger
  'wdac01', 'wdah01', 'wdan01', 'wdar01', 'wdar02', 'wdar03',
  // Double Saber
  'wdsc01', 'wdsn01', 'wdsn02', 'wdsn03', 'wdsr01', 'wdsr02', 'wdsr03',
  // Gunblade
  'wgbc01', 'wgbh01', 'wgbn01', 'wgbr01', 'wgbr02', 'wgbr03', 'wgbr04',
  // Handgun
  'whgc01', 'whgh01', 'whgn01', 'whgn02', 'whgr01', 'whgr02', 'whgr03', 'whgr04', 'whgr05',
  // Launcher
  'wlcc01', 'wlcn01', 'wlcn02', 'wlcr01', 'wlcr02', 'wlcr03',
  // Machinegun
  'wmgc01', 'wmgh01', 'wmgh02', 'wmgr01', 'wmgr02', 'wmgr03', 'wmgr04',
  // Mag
  'wmaa1', 'wmaa2', 'wmaa3', 'wmaa4', 'wmab2', 'wmab3', 'wmab4',
  'wmac2', 'wmac3', 'wmac4', 'wmad2', 'wmad3', 'wmad4', 'wmae5',
  // Rifle (Other category)
  'wrfc01', 'wrfh01', 'wrfn01', 'wrfr01', 'wrfr02', 'wrfr03', 'wrfr04', 'wrfr05', 'wrfr06',
  // Rod
  'wroh01', 'wron01', 'wron02', 'wror01', 'wror02', 'wror03', 'wror04', 'wror05', 'wror06',
  // Saber (Other category)
  'wsac01', 'wsah01', 'wsan01', 'wsan02', 'wsar01', 'wsar02', 'wsar03', 'wsar04', 'wsar06',
  // Shield
  'wshh01', 'wshh02', 'wshn01', 'wshr01', 'wshr02', 'wshr03', 'wshr04', 'wshr05', 'wshr06', 'wshr07',
  // Slicer
  'wslc01', 'wslc02', 'wsln01', 'wslr01', 'wslr02', 'wslr03', 'wslr04', 'wslr05',
  // Spear
  'wspc01', 'wsph01', 'wsph02', 'wspr01', 'wspr02', 'wspr03', 'wspr04',
  // Sword
  'wswc01', 'wswh01', 'wswn01', 'wswr01', 'wswr02', 'wswr03', 'wswr04', 'wswr05',
  // Wand
  'wwac01', 'wwah01', 'wwan01', 'wwar01', 'wwar02', 'wwar03', 'wwar04', 'wwar05', 'wwar06',
];

/**
 * Group weapons by category
 */
export function getWeaponsByCategory(): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const category of WEAPON_CATEGORIES) {
    grouped.set(category.id, []);
  }
  grouped.set('other', []); // For weapons that don't match any category

  for (const weaponId of ALL_WEAPON_IDS) {
    const category = getWeaponCategory(weaponId);
    if (category) {
      grouped.get(category.id)?.push(weaponId);
    } else {
      grouped.get('other')?.push(weaponId);
    }
  }

  return grouped;
}
