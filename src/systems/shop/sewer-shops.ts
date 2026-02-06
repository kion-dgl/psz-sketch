/**
 * Sewer Shops System
 * Photon Collector and Enemy Collector special shops
 */

import type { GameItem, WeaponItem } from '../inventory/types';

// ============================================================================
// PHOTON COLLECTOR
// ============================================================================

export interface PhotonCollectorItem {
  itemId: string;
  itemName: string;
  category: 'Weapons' | 'Armors' | 'Mags' | 'Elements' | 'Weapon Modifiers' | 'Consumables';
  cost: number; // in Photon Drops
}

// Items available at the Photon Collector
// Based on src/content/shops/photon-collector.json
export const PHOTON_COLLECTOR_ITEMS: PhotonCollectorItem[] = [
  // Weapons
  { itemId: '8-ouncer', itemName: '8-Ouncer', category: 'Weapons', cost: 5 },
  { itemId: 'animal-hand', itemName: 'Animal Hand', category: 'Weapons', cost: 10 },
  { itemId: 'berry-ice-beam', itemName: 'Berry Ice Beam', category: 'Weapons', cost: 20 },
  { itemId: 'bloom-shower', itemName: 'Bloom Shower', category: 'Weapons', cost: 60 },
  { itemId: 'doppel-scythe', itemName: 'Doppel Scythe', category: 'Weapons', cost: 30 },
  { itemId: 'dumbbell', itemName: 'Dumbbell', category: 'Weapons', cost: 10 },
  { itemId: 'grow-shower', itemName: 'Grow Shower', category: 'Weapons', cost: 5 },
  { itemId: 'harisen', itemName: 'Harisen', category: 'Weapons', cost: 10 },
  { itemId: 'hocho', itemName: 'Hocho', category: 'Weapons', cost: 99 },
  { itemId: 'imperial-rod', itemName: 'Imperial Rod', category: 'Weapons', cost: 45 },
  { itemId: 'missouri-cx4', itemName: 'Missouri CX4', category: 'Weapons', cost: 50 },
  { itemId: 'twinkle-star', itemName: 'Twinkle Star', category: 'Weapons', cost: 40 },
  { itemId: 'witchs-broom', itemName: "Witch's Broom", category: 'Weapons', cost: 15 },

  // Armors
  { itemId: 'gardening-wear', itemName: 'Gardening Wear', category: 'Armors', cost: 35 },
  { itemId: 'miyabi-hakama', itemName: 'Miyabi Hakama', category: 'Armors', cost: 40 },

  // Mags
  { itemId: 'mag', itemName: 'Mag', category: 'Mags', cost: 5 },

  // Elements
  { itemId: 'heat-element', itemName: 'Heat Element', category: 'Elements', cost: 4 },
  { itemId: 'light-element', itemName: 'Light Element', category: 'Elements', cost: 4 },
  { itemId: 'dark-element', itemName: 'Dark Element', category: 'Elements', cost: 4 },
  { itemId: 'slow-element', itemName: 'Slow Element', category: 'Elements', cost: 4 },
  { itemId: 'stun-element', itemName: 'Stun Element', category: 'Elements', cost: 4 },
  { itemId: 'draw-element', itemName: 'Draw Element', category: 'Elements', cost: 8 },
  { itemId: 'heart-element', itemName: 'Heart Element', category: 'Elements', cost: 8 },
  { itemId: 'soul-element', itemName: 'Soul Element', category: 'Elements', cost: 8 },
  { itemId: 'zalure-element', itemName: 'Zalure Element', category: 'Elements', cost: 8 },
  { itemId: 'jell-element', itemName: 'Jell Element', category: 'Elements', cost: 8 },
  { itemId: 'meseta-element', itemName: 'Meseta Element', category: 'Elements', cost: 8 },
  { itemId: 'x-element', itemName: 'X-Element', category: 'Elements', cost: 8 },
  { itemId: 'celeb-element', itemName: 'Celeb Element', category: 'Elements', cost: 12 },
  { itemId: 'ice-element', itemName: 'Ice Element', category: 'Elements', cost: 12 },
  { itemId: 'life-element', itemName: 'Life Element', category: 'Elements', cost: 12 },
  { itemId: 'risk-element', itemName: 'Risk Element', category: 'Elements', cost: 12 },

  // Grinders
  { itemId: 'monogrinder', itemName: 'Monogrinder', category: 'Weapon Modifiers', cost: 1 },
  { itemId: 'digrinder', itemName: 'Digrinder', category: 'Weapon Modifiers', cost: 3 },
  { itemId: 'trigrinder', itemName: 'Trigrinder', category: 'Weapon Modifiers', cost: 5 },

  // Materials
  { itemId: 'hp-material', itemName: 'HP Material', category: 'Consumables', cost: 5 },
  { itemId: 'power-material', itemName: 'Power Material', category: 'Consumables', cost: 5 },
  { itemId: 'guard-material', itemName: 'Guard Material', category: 'Consumables', cost: 5 },
  { itemId: 'hit-material', itemName: 'Hit Material', category: 'Consumables', cost: 5 },
  { itemId: 'swift-material', itemName: 'Swift Material', category: 'Consumables', cost: 5 },
  { itemId: 'mind-material', itemName: 'Mind Material', category: 'Consumables', cost: 5 },
  { itemId: 'pp-material', itemName: 'PP Material', category: 'Consumables', cost: 5 },
  { itemId: 'reset-material', itemName: 'Reset Material', category: 'Consumables', cost: 5 },
  { itemId: 'scape-doll', itemName: 'Scape Doll', category: 'Consumables', cost: 5 },
];

/**
 * Get all Photon Collector items
 */
export function getPhotonCollectorItems(): PhotonCollectorItem[] {
  return PHOTON_COLLECTOR_ITEMS;
}

/**
 * Get items by category
 */
export function getPhotonCollectorItemsByCategory(category: string): PhotonCollectorItem[] {
  return PHOTON_COLLECTOR_ITEMS.filter(i => i.category === category);
}

// ============================================================================
// ENEMY COLLECTOR
// ============================================================================

export interface EnemyCollectorTrade {
  resultItemId: string;
  resultItemName: string;
  requiredPartId: string;
  requiredPartName: string;
  mesetaCost: number;
}

// Trades available at the Enemy Collector
// Based on src/content/shops/enemy-collector.json
export const ENEMY_COLLECTOR_TRADES: EnemyCollectorTrade[] = [
  // Common trades (500-5000 meseta)
  { resultItemId: 'helion-roar', resultItemName: 'Helion Roar', requiredPartId: 'helion_mane', requiredPartName: "Helion's Mane", mesetaCost: 500 },
  { resultItemId: 'jade-hulse', resultItemName: 'Jade Hulse', requiredPartId: 'rohjade_scales', requiredPartName: 'Rohjade Scales', mesetaCost: 2500 },
  { resultItemId: 'chaos-cannon', resultItemName: 'Chaos Cannon', requiredPartId: 'black_barrel', requiredPartName: 'Black Barrel', mesetaCost: 5000 },
  { resultItemId: 'mobius-drill', resultItemName: 'Mobius Drill', requiredPartId: 'black_drill', requiredPartName: 'Black Drill', mesetaCost: 5000 },
  { resultItemId: 'scarred-horn', resultItemName: 'Scarred Horn', requiredPartId: 'broken_horn', requiredPartName: 'Broken Horn', mesetaCost: 5000 },
  { resultItemId: 'octo-bazooka', resultItemName: 'Octo Bazooka', requiredPartId: 'slimy_tentacle', requiredPartName: 'Slimy Tentacle', mesetaCost: 5000 },

  // Uncommon trades (25000 meseta)
  { resultItemId: 'blaze-roar', resultItemName: 'Blaze Roar', requiredPartId: 'burning_mane', requiredPartName: 'Burning Mane', mesetaCost: 25000 },
  { resultItemId: 'python-bite', resultItemName: 'Python Bite', requiredPartId: 'garapython_fang', requiredPartName: 'Garapython Fang', mesetaCost: 25000 },
  { resultItemId: 'phobos-shoot', resultItemName: 'Phobos Shoot', requiredPartId: 'phobos_shard', requiredPartName: 'Phobos Shard', mesetaCost: 25000 },

  // Rare trades (50000 meseta)
  { resultItemId: 'black-phobos', resultItemName: 'Black Phobos', requiredPartId: 'black_shard', requiredPartName: 'Black Shard', mesetaCost: 50000 },
  { resultItemId: 'dragon-horn', resultItemName: 'Dragon Horn', requiredPartId: 'dragons_horn', requiredPartName: "Dragon's Horn", mesetaCost: 50000 },
  { resultItemId: 'crysta-hulse', resultItemName: 'Crysta Hulse', requiredPartId: 'rohcrysta_scales', requiredPartName: 'Rohcrysta Scales', mesetaCost: 50000 },
  { resultItemId: 'devil-bazooka', resultItemName: 'Devil Bazooka', requiredPartId: 'squirmy_tentacle', requiredPartName: 'Squirmy Tentacle', mesetaCost: 50000 },
  { resultItemId: 'hemera-drill', resultItemName: 'Hemera Drill', requiredPartId: 'white_drill', requiredPartName: 'White Drill', mesetaCost: 50000 },

  // Legendary trades (100000 meseta)
  { resultItemId: 'hadan-bite', resultItemName: 'Hadan Bite', requiredPartId: 'garahadan_fang', requiredPartName: 'Garahadan Fang', mesetaCost: 100000 },
  { resultItemId: 'tartaros-cannon', resultItemName: 'Tartaros Cannon', requiredPartId: 'white_barrel', requiredPartName: 'White Barrel', mesetaCost: 100000 },
];

/**
 * Get all Enemy Collector trades
 */
export function getEnemyCollectorTrades(): EnemyCollectorTrade[] {
  return ENEMY_COLLECTOR_TRADES;
}

/**
 * Get trade for a specific part
 */
export function getTradeForPart(partId: string): EnemyCollectorTrade | undefined {
  return ENEMY_COLLECTOR_TRADES.find(t => t.requiredPartId === partId);
}

/**
 * Create a weapon from Enemy Collector trade
 * Weapon attributes are somewhat randomized
 */
export function createTradeResultWeapon(trade: EnemyCollectorTrade): WeaponItem {
  // Random element (70% chance of having one)
  const elements = ['fire', 'ice', 'lightning', 'light', 'dark'];
  const hasElement = Math.random() < 0.7;
  const element = hasElement ? elements[Math.floor(Math.random() * elements.length)] : undefined;
  const elementPercent = hasElement ? Math.floor(Math.random() * 30) + 10 : undefined; // 10-40%

  // Base stats vary by weapon tier
  let attackBase = 100;
  let accuracyBase = 100;
  let rarity = 4;
  let requiredLevel = 1;
  let sellPrice = 1000;

  if (trade.mesetaCost >= 100000) {
    attackBase = 300 + Math.floor(Math.random() * 100);
    accuracyBase = 150 + Math.floor(Math.random() * 50);
    rarity = 7;
    requiredLevel = 80;
    sellPrice = 25000;
  } else if (trade.mesetaCost >= 50000) {
    attackBase = 200 + Math.floor(Math.random() * 80);
    accuracyBase = 130 + Math.floor(Math.random() * 40);
    rarity = 6;
    requiredLevel = 50;
    sellPrice = 12500;
  } else if (trade.mesetaCost >= 25000) {
    attackBase = 150 + Math.floor(Math.random() * 60);
    accuracyBase = 120 + Math.floor(Math.random() * 30);
    rarity = 5;
    requiredLevel = 30;
    sellPrice = 6250;
  } else {
    attackBase = 100 + Math.floor(Math.random() * 40);
    accuracyBase = 100 + Math.floor(Math.random() * 20);
    rarity = 4;
    requiredLevel = 10;
    sellPrice = 1250;
  }

  return {
    id: `${trade.resultItemId}-${Date.now()}`,
    name: trade.resultItemName,
    type: 'weapon',
    weaponType: guessWeaponType(trade.resultItemName),
    rarity,
    description: `A weapon crafted from ${trade.requiredPartName}.`,
    sellPrice,
    stackable: false,
    maxStack: 1,
    attack: attackBase,
    accuracy: accuracyBase,
    grindLevel: 0,
    maxGrind: 10,
    requiredLevel,
    element,
    elementPercent,
  };
}

/**
 * Guess weapon type from name (simple heuristic)
 */
function guessWeaponType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('cannon') || lower.includes('bazooka') || lower.includes('shoot')) return 'launcher';
  if (lower.includes('drill')) return 'partisan';
  if (lower.includes('roar') || lower.includes('bite')) return 'claw';
  if (lower.includes('horn')) return 'sword';
  if (lower.includes('hulse')) return 'rifle';
  if (lower.includes('phobos')) return 'handgun';
  return 'sword';
}
