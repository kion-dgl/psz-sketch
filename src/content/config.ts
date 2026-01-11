import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

// ============================================================================
// ITEM COLLECTIONS
// ============================================================================

// Photon Arts collection - special weapon attacks
const photonArts = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    weaponType: z.string(),
    classType: z.enum(['Hunter', 'Ranger', 'Force']),
    attackMod: z.number().nullable(), // percentage, null for utility arts
    accuracyMod: z.number().nullable(),
    ppCost: z.number(),
    targets: z.number(), // additional targets (+X)
    range: z.string().nullable(), // e.g., "3m"
    area: z.number().nullable(), // degrees
    hits: z.number().nullable(),
    notes: z.string().nullable()
  })
});

// Shops collection - vendor data for Sewer Shop and other merchants
const shops = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    unlockCondition: z.string().optional(),
    items: z.array(z.object({
      item: z.string(),
      category: z.string().optional(),
      cost: z.number().optional(),
      currency: z.enum(['Meseta', 'Photon Drop']).optional(),
      tradeIn: z.string().optional(), // enemy part for Enemy Collector
      code: z.string().optional(), // for Password Machine
      notes: z.string().optional()
    }))
  })
});

// Set bonuses collection - armor+weapon combinations with hidden stat boosts
const setBonuses = defineCollection({
  type: 'data',
  schema: z.object({
    armor: z.string(),
    weapons: z.array(z.string()),
    bonuses: z.object({
      attack: z.number().default(0),
      mental: z.number().default(0),
      accuracy: z.number().default(0),
      defense: z.number().default(0),
      evasion: z.number().default(0)
    })
  })
});

// Armors collection - defensive equipment
const armors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string().optional(),
    type: z.enum(['Armor', 'Frame', 'Robe', 'Rare']),
    rarity: z.number().min(1).max(7),
    maxGrind: z.number().default(0),
    level: z.number().optional(), // required level to equip
    resaleValue: z.number().optional(),
    defenseBase: z.number(),
    defenseMax: z.number(),
    evasionBase: z.number(),
    evasionMax: z.number(),
    maxSlots: z.number().min(0).max(4), // max unit slots
    resistances: z.object({
      fire: z.number().default(0),
      ice: z.number().default(0),
      lightning: z.number().default(0),
      light: z.number().default(0),
      dark: z.number().default(0)
    }).optional(),
    usableBy: z.array(z.string()).optional(), // class restrictions, null = all
    setBonus: z.string().optional(), // reference to set-bonus if applicable
    details: z.string().optional(),
    psoWorldId: z.number().optional()
  })
});

// Units collection - slot items for armor
const units = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string().optional(),
    rarity: z.number().min(1).max(7),
    category: z.enum([
      'Power', 'Guard', 'Swift', 'Mind', 'Hit', 'HP', 'PP', // stat boost
      'Resistance', // elemental resistance
      'Special' // compress arts, element boost, tech boost, save, recovery, protection
    ]),
    // Effect details
    effect: z.string(), // e.g., "ATK+15", "Fire Resist +6", "Reduces charge time"
    effectValue: z.number().optional(), // numeric value of effect
    resistType: z.enum(['Heat', 'Ice', 'Stun', 'Light', 'Dark', 'All']).optional(), // for resistance units
    resistLevel: z.number().min(1).max(5).optional(), // for resistance units
    // Stacking rules
    stackable: z.boolean().default(true),
    // Drop sources
    dropSources: z.array(z.string()).optional(), // e.g., ["SH Fulnei Naked", "Title reward"]
    details: z.string().optional(),
    psoWorldId: z.number().optional()
  })
});

// Evolution requirement types for mags
const evolutionRequirementSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stat'),
    primary: z.enum(['Power', 'Guard', 'Hit', 'Mind']),
    secondary: z.enum(['Power', 'Guard', 'Hit', 'Mind']).optional()
  }),
  z.object({
    type: z.literal('pure'),
    stat: z.enum(['Power', 'Guard', 'Hit', 'Mind'])
  }),
  z.object({
    type: z.literal('soul'),
    item: z.string()
  })
]);

// Mag variant schema (for mags like Chato and Sig with color variants)
const magVariantSchema = z.object({
  name: z.string(),
  evolutionRequirement: evolutionRequirementSchema,
  photonBlast: z.enum(['Granir', 'Midgul', 'Pacifal', 'Flozir'])
});

// Mags collection - companion creatures with evolution system
const mags = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    stage: z.union([z.number().min(1).max(4), z.literal('rare')]),
    evolutionLevel: z.number(),
    evolutionRequirement: evolutionRequirementSchema.optional(),
    photonBlast: z.enum(['Granir', 'Midgul', 'Pacifal', 'Flozir', 'inherited']).nullable(),
    variants: z.array(magVariantSchema).optional(),
    psoWorldId: z.number()
  })
});

// Mag trigger effect schema for personality behaviors
const magTriggerEffectSchema = z.object({
  effect: z.string(),
  strength: z.string().optional(),
  chance: z.union([z.number(), z.string()]).optional(),
  duration: z.union([z.number(), z.string()]).optional()
}).nullable();

// Mag personalities collection - behavior/nature system
const magPersonalities = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    japaneseName: z.string(),
    category: z.enum(['offensive', 'defensive', 'recovery', 'special']),
    tier: z.enum(['basic', 'advanced']),
    unlockLevel: z.number(),
    favoriteFood: z.string(),
    switchFrom: z.string().optional(),
    triggers: z.object({
      walking: magTriggerEffectSchema,
      lowHealth: magTriggerEffectSchema,
      statusCondition: magTriggerEffectSchema,
      bossEncounter: magTriggerEffectSchema,
      playerDeath: magTriggerEffectSchema,
      photonBlastFull: magTriggerEffectSchema
    })
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
// CHARACTER COLLECTIONS
// ============================================================================

// Stat progression schema - stats at key levels
const statProgressionSchema = z.object({
  1: z.number(),
  20: z.number(),
  40: z.number(),
  60: z.number(),
  80: z.number(),
  100: z.number()
});

// Technique limit schema
const techniqueLimitsSchema = z.object({
  foieBartaZonde: z.number().nullable(), // null if class can't use
  grants: z.number().nullable(),
  megid: z.number().nullable(),
  restaReverser: z.number().nullable(),
  shiftaDeband: z.number().nullable(),
  jellenZalure: z.number().nullable()
});

// Trap limit schema (for CAST classes)
const trapLimitsSchema = z.object({
  fire: z.array(z.number()).length(6), // limits at level ranges: 1-19, 20-39, 40-59, 60-79, 80-99, 100
  freeze: z.array(z.number()).length(6),
  confuse: z.array(z.number()).length(6),
  heal: z.array(z.number()).length(6)
});

// Classes collection - character class data
const classes = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    race: z.enum(['Human', 'Newman', 'Cast']),
    gender: z.enum(['Male', 'Female']),
    type: z.enum(['Hunter', 'Ranger', 'Force']),
    // Bonuses
    bonuses: z.array(z.string()),
    materialLimit: z.number(), // 80 or 100
    // Stats at key levels
    stats: z.object({
      hp: statProgressionSchema,
      pp: statProgressionSchema,
      attack: statProgressionSchema,
      defense: statProgressionSchema,
      accuracy: statProgressionSchema,
      evasion: statProgressionSchema,
      technique: statProgressionSchema
    }),
    // Technique limits (null for CAST classes)
    techniqueLimits: techniqueLimitsSchema.nullable(),
    // Trap limits (only for CAST classes)
    trapLimits: trapLimitsSchema.nullable()
  })
});

// Experience table collection
const experience = defineCollection({
  type: 'data',
  schema: z.object({
    levels: z.array(z.object({
      level: z.number().min(1).max(100),
      totalExp: z.number(),
      expToNext: z.number().nullable() // null for level 100
    }))
  })
});

// Mission reward schema
const missionRewardSchema = z.object({
  item: z.string(),
  quantity: z.number().default(1),
  meseta: z.number()
});

// Missions collection - individual files per mission for progress tracking
const missions = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    area: z.string(),
    main: z.boolean().default(false), // true for main story quests
    isSecret: z.boolean().default(false),
    requires: z.array(z.string()).default([]), // mission file names (without .json)
    rewards: z.object({
      normal: missionRewardSchema.optional(),
      hard: missionRewardSchema.optional(),
      superHard: missionRewardSchema.optional()
    }).optional()
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
  'photon-arts': photonArts,
  shops,
  'set-bonuses': setBonuses,
  armors,
  units,
  mags,
  'mag-personalities': magPersonalities,
  consumables,
  materials,
  modifiers,
  weapons,
  // Enemy collection
  enemies,
  // Drops collection (by difficulty)
  drops,
  // Character collections
  classes,
  experience,
  missions
};
