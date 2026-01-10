import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

// ============================================================================
// ITEM COLLECTIONS
// ============================================================================

// Armors collection - defensive equipment
const armors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    rarity: z.number().min(1).max(7),
    maxGrind: z.number().default(0),
    level: z.number().optional(),
    resaleValue: z.number().optional(),
    defenseBase: z.number(),
    defenseMax: z.number(),
    evasionBase: z.number(),
    evasionMax: z.number(),
    details: z.string().optional(), // e.g., "Can have a maximum of 3 slots."
    psoWorldId: z.number()
  })
});

// Units collection - slot items for armor
const units = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    rarity: z.number().min(1).max(7),
    description: z.string().optional(),
    details: z.string().optional(),
    // Stat bonuses (for stat units)
    attackBase: z.number().optional(),
    attackMax: z.number().optional(),
    defenseBase: z.number().optional(),
    defenseMax: z.number().optional(),
    evasionBase: z.number().optional(),
    evasionMax: z.number().optional(),
    psoWorldId: z.number()
  })
});

// Mags collection - companion creatures
const mags = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    rarity: z.number().optional(),
    details: z.string().optional(), // Evolution conditions, photon blast info
    psoWorldId: z.number()
  })
});

// Consumables collection - healing items, atomizers, traps, etc.
const consumables = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    rarity: z.number().min(1).max(7),
    details: z.string(), // Effect description
    psoWorldId: z.number()
  })
});

// Materials collection - stat materials, grinders
const materials = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    rarity: z.number().min(1).max(7),
    details: z.string(), // Effect description
    psoWorldId: z.number()
  })
});

// Weapon modifiers collection - elements
const modifiers = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    rarity: z.number().min(1).max(7),
    details: z.string(), // Effect description
    psoWorldId: z.number()
  })
});

// Photon Art schema (used by weapons)
const photonArtSchema = z.object({
  name: z.string(),
  attackMod: z.number(),
  accuracyMod: z.number(),
  ppUsed: z.number(),
  element: z.string()
});

// Weapons collection - all weapon types
const weapons = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string().optional(),
    rarity: z.number().min(1).max(7),
    weaponType: z.string(), // "Saber", "Sword", "Dagger", etc.
    maxGrind: z.number().default(0),
    level: z.number().default(1),
    resaleValue: z.number().optional(),
    attackBase: z.number().optional(), // Not present for tech weapons (Rods, Wands)
    attackMax: z.number().optional(),
    accuracyBase: z.number(),
    accuracyMax: z.number(),
    // Optional element
    element: z.string().optional(),
    elementLevel: z.number().optional(),
    // Photon Arts
    photonArts: z.array(photonArtSchema).optional(),
    // Class restrictions
    usableBy: z.array(z.string()).optional(),
    psoWorldId: z.number(),
    // 3D Model data (from weapon-data.json)
    modelId: z.string().optional(),
    variantId: z.string().nullable().optional(),
    missingTexture: z.boolean().optional(),
    useModelFrom: z.string().optional(),
    notes: z.string().optional(),
    wikiUrl: z.string().optional()
  })
});

// ============================================================================
// QUEST COLLECTIONS
// ============================================================================

// Quest definitions collection
const questDefinitions = defineCollection({
  type: 'data',
  schema: z.object({
    questId: z.string(),
    questName: z.string(),
    questType: z.enum(['story', 'side', 'multiplayer', 'post_game']),
    area: z.enum([
      'Gurhacia Valley',
      'Ozette Wetlands',
      'Rioh Snowfield',
      'Paru',
      'Makara',
      'Arca Plant',
      'Dark Shrine',
      'Eternal Tower',
      'Moon'
    ]),
    description: z.string(),

    // Race restriction (for story quests)
    race: z.enum(['Human', 'Newman', 'CAST']).optional(),

    // Difficulty levels with rewards
    difficulties: z.array(z.object({
      difficulty: z.enum(['Normal', 'Hard', 'Super Hard', 'Ultimate']),
      recommendedLevel: z.number().optional(),
      rewards: z.object({
        meseta: z.number().default(0),
        experience: z.number().default(0),
        items: z.array(z.object({
          itemId: z.string(),
          itemName: z.string(),
          quantity: z.number().default(1)
        })).optional()
      })
    })),

    // Requirements
    requirements: z.object({
      minLevel: z.number().default(1),
      prerequisiteQuests: z.array(z.string()).default([]),
      unlockCondition: z.string().optional() // e.g., "Find Naura Cake Shop rare block"
    }).optional(),

    // Objectives
    objectives: z.array(z.object({
      type: z.enum(['defeat_enemies', 'collect_items', 'reach_location', 'defeat_boss', 'escort_npc']),
      description: z.string(),
      target: z.string().optional(), // enemyType, itemId, locationId, bossId, npcId
      required: z.number().optional() // quantity required
    })),

    // Multiplayer settings
    multiplayerType: z.enum(['solo', 'co-op', 'boss']).optional(),

    // Special flags
    isRepeatable: z.boolean().default(false),
    isSecret: z.boolean().default(false),

    // Post-game specific (Eternal Tower)
    floors: z.number().optional(),
    bossFrequency: z.number().optional() // boss every X floors
  })
});

// Quest areas collection
const questAreas = defineCollection({
  type: 'data',
  schema: z.object({
    areaId: z.string(),
    areaName: z.string(),
    description: z.string(),
    unlockCondition: z.string().optional(),
    recommendedLevel: z.number().optional(),
    environment: z.string(), // "grasslands", "swamp", "snow", etc.
    questCount: z.number().optional()
  })
});

// ============================================================================
// ENEMY COLLECTIONS
// ============================================================================

// Area enum for drop locations
const areaEnum = z.enum([
  'gurhacia-valley',
  'rioh-snowfield',
  'ozette-wetland',
  'oblivion-city-paru',
  'makara-ruins',
  'arca-plant',
  'dark-shrine',
  'eternal-tower'
]);

// Enemy name enum for drops validation
const enemyNameEnum = z.enum([
  'Ghowl', 'Vulkure', 'Usanny', 'Usanimere', 'Porel', 'Pomarr', 'Pobomma',
  'Bolix', 'Goldix', 'Batt', 'Bullbatt', 'Rappy', 'Ar Rappy', 'Rab Rappy',
  'Booma Origin', 'Gigobooma Origin', 'Garapython', 'Garahadan', 'Grimble',
  'Tormatible', 'Reyhound', 'Stagg', 'Hypao', 'Vespao', 'Rumole', 'Kapantha',
  'Helion', 'Blaze Helion', 'Hildegao', 'Hildeghana', 'Hildegigas',
  'Pelcatraz', 'Pelcatobur', 'Froutang', 'Frunaked', 'Rohjade', 'Rohcrysta',
  'Korse', 'Akorse', 'Izhirak-S6', 'Azherowa-B2', 'Finjer R', 'Finjer G', 'Finjer B',
  'Arkzein', 'Arkzein R', 'Derreo', 'Zerreo', 'Eulada', 'Euladaveil',
  'Eulid', 'Eulidveil', 'Phobos', 'Phobos Dyna', 'Zaphobos', 'Zaphobos Dyna',
  'Blade Mother', 'Force Mother', 'Shot Mother'
]);

// Drops collection - organized by difficulty level
// Each file (normal.json, hard.json, super-hard.json) contains drops by area and enemy
const drops = defineCollection({
  type: 'data',
  schema: z.record(
    areaEnum,
    z.record(
      enemyNameEnum,
      z.array(z.string()) // Array of item names that drop from this enemy
    )
  )
});

// Drop table entry schema
const dropEntrySchema = z.object({
  itemName: z.string(),
  dropRate: z.string().optional(), // e.g., "1/128", "Common", etc.
  difficulty: z.enum(['Normal', 'Hard', 'Super Hard', 'Ultimate']).optional()
});

// Enemies collection
const enemies = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string().optional(),
    description: z.string().optional(),
    element: z.enum(['Native', 'Beast', 'Machine', 'Dark']),
    locations: z.array(z.enum([
      'Gurhacia Valley',
      'Rioh Snowfield',
      'Ozette Wetland',
      'Oblivion City Paru',
      'Makara Ruins',
      'Arca Plant',
      'Dark Shrine',
      'Eternal Tower'
    ])),
    isRare: z.boolean().default(false),
    isBoss: z.boolean().default(false),
    // PSO-World reference
    psoWorldId: z.number().optional(),
    // 3D Model reference (folder name in /public/enemies/)
    modelId: z.string().optional(),
    // Drop tables by difficulty
    drops: z.object({
      normal: z.array(dropEntrySchema).optional(),
      hard: z.array(dropEntrySchema).optional(),
      superHard: z.array(dropEntrySchema).optional(),
      ultimate: z.array(dropEntrySchema).optional()
    }).optional()
  })
});

export const collections = {
  docs: defineCollection({ schema: docsSchema() }),
  'quest-definitions': questDefinitions,
  'quest-areas': questAreas,
  // Item collections
  armors,
  units,
  mags,
  consumables,
  materials,
  modifiers,
  weapons,
  // Enemy collection
  enemies,
  // Drops collection (by difficulty)
  drops
};
