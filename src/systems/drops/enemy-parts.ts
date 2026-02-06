/**
 * Enemy Parts Drop System
 * Maps enemies to their droppable parts for the Enemy Collector
 */

import type { GameItem } from '../inventory/types';

export interface EnemyPartDrop {
  partId: string;
  partName: string;
  dropChance: number; // 0-1
  enemyNames: string[]; // Enemy names that can drop this part
}

// Enemy parts that can be traded at the Enemy Collector
// Based on src/content/shops/enemy-collector.json
export const ENEMY_PARTS: EnemyPartDrop[] = [
  // Common drops (10-15% chance)
  {
    partId: 'helion_mane',
    partName: "Helion's Mane",
    dropChance: 0.15,
    enemyNames: ['helion', 'Helion'],
  },
  {
    partId: 'rohjade_scales',
    partName: 'Rohjade Scales',
    dropChance: 0.12,
    enemyNames: ['rohjade', 'Rohjade'],
  },
  {
    partId: 'black_barrel',
    partName: 'Black Barrel',
    dropChance: 0.10,
    enemyNames: ['chaos-mobius', 'Chaos Mobius', 'chaos_mobius'],
  },
  {
    partId: 'black_drill',
    partName: 'Black Drill',
    dropChance: 0.10,
    enemyNames: ['chaos-mobius', 'Chaos Mobius', 'chaos_mobius'],
  },
  {
    partId: 'broken_horn',
    partName: 'Broken Horn',
    dropChance: 0.10,
    enemyNames: ['reyburn', 'Reyburn', 'reyhound', 'Reyhound'],
  },
  {
    partId: 'slimy_tentacle',
    partName: 'Slimy Tentacle',
    dropChance: 0.10,
    enemyNames: ['octo-diablo', 'Octo Diablo', 'octo_diablo'],
  },

  // Uncommon drops (5-8% chance) - from rare/stronger enemies
  {
    partId: 'burning_mane',
    partName: 'Burning Mane',
    dropChance: 0.08,
    enemyNames: ['blaze-helion', 'Blaze Helion', 'blaze_helion'],
  },
  {
    partId: 'garapython_fang',
    partName: 'Garapython Fang',
    dropChance: 0.08,
    enemyNames: ['garapython', 'Garapython'],
  },
  {
    partId: 'phobos_shard',
    partName: 'Phobos Shard',
    dropChance: 0.08,
    enemyNames: ['phobos', 'Phobos', 'phobos-dyna', 'Phobos Dyna'],
  },

  // Rare drops (3-5% chance) - from bosses/rare enemies
  {
    partId: 'black_shard',
    partName: 'Black Shard',
    dropChance: 0.05,
    enemyNames: ['zaphobos', 'Zaphobos', 'zaphobos-dyna', 'Zaphobos Dyna'],
  },
  {
    partId: 'dragons_horn',
    partName: "Dragon's Horn",
    dropChance: 0.05,
    enemyNames: ['de-rol-le', 'De Rol Le', 'dragon', 'Dragon'],
  },
  {
    partId: 'rohcrysta_scales',
    partName: 'Rohcrysta Scales',
    dropChance: 0.05,
    enemyNames: ['rohcrysta', 'Rohcrysta'],
  },
  {
    partId: 'squirmy_tentacle',
    partName: 'Squirmy Tentacle',
    dropChance: 0.05,
    enemyNames: ['octo-diablo', 'Octo Diablo', 'octo_diablo'],
  },
  {
    partId: 'white_drill',
    partName: 'White Drill',
    dropChance: 0.05,
    enemyNames: ['chaos-mobius', 'Chaos Mobius', 'chaos_mobius'],
  },
  {
    partId: 'garahadan_fang',
    partName: 'Garahadan Fang',
    dropChance: 0.03,
    enemyNames: ['garahadan', 'Garahadan'],
  },
  {
    partId: 'white_barrel',
    partName: 'White Barrel',
    dropChance: 0.03,
    enemyNames: ['chaos-mobius', 'Chaos Mobius', 'chaos_mobius'],
  },
];

/**
 * Photon Drop - rare currency drop from any enemy
 */
export const PHOTON_DROP_CHANCE = 0.05; // 5% from any enemy
export const PHOTON_DROP_RARE_CHANCE = 0.15; // 15% from rare enemies
export const PHOTON_DROP_BOSS_CHANCE = 0.30; // 30% from bosses

/**
 * Get droppable parts for an enemy
 */
export function getEnemyParts(enemyName: string): EnemyPartDrop[] {
  const normalizedName = enemyName.toLowerCase();
  return ENEMY_PARTS.filter(part =>
    part.enemyNames.some(name => name.toLowerCase() === normalizedName)
  );
}

/**
 * Roll for enemy part drops
 */
export function rollEnemyPartDrops(enemyName: string, seed?: number): GameItem[] {
  const drops: GameItem[] = [];
  const parts = getEnemyParts(enemyName);

  for (const part of parts) {
    const roll = seed !== undefined ? ((seed * 31 + parts.indexOf(part) * 17) % 1000) / 1000 : Math.random();
    if (roll < part.dropChance) {
      drops.push(createPartItem(part));
    }
  }

  return drops;
}

/**
 * Roll for Photon Drop
 */
export function rollPhotonDrop(isRare: boolean, isBoss: boolean, seed?: number): boolean {
  const chance = isBoss ? PHOTON_DROP_BOSS_CHANCE : isRare ? PHOTON_DROP_RARE_CHANCE : PHOTON_DROP_CHANCE;
  const roll = seed !== undefined ? ((seed * 43) % 1000) / 1000 : Math.random();
  return roll < chance;
}

/**
 * Create a GameItem for an enemy part
 */
export function createPartItem(part: EnemyPartDrop): GameItem {
  return {
    id: part.partId,
    name: part.partName,
    type: 'consumable', // Treated as consumable for inventory purposes
    rarity: 3, // Uncommon rarity
    description: `A part dropped by monsters. Can be traded at the Enemy Collector.`,
    stackable: true,
    maxStack: 99,
  };
}

/**
 * Create a Photon Drop item
 */
export function createPhotonDrop(): GameItem {
  return {
    id: 'photon_drop',
    name: 'Photon Drop',
    type: 'consumable',
    rarity: 4, // Rare
    description: 'A crystallized photon. Currency for the Photon Collector.',
    stackable: true,
    maxStack: 999,
  };
}
