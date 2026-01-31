/**
 * Default Fields
 * Pre-defined field definitions for the game
 */

import type { Field, FieldReward } from './types';
import { registerField } from './field';

/**
 * Field reward tables
 */
export const FIELD_REWARDS: Record<string, FieldReward> = {
  'gurhacia-valley': {
    baseExp: 500,
    baseMeseta: 1000,
    items: [
      { itemId: 'monomate', quantity: 3, chance: 0.8 },
      { itemId: 'monofluid', quantity: 2, chance: 0.6 },
      { itemId: 'saber', quantity: 1, chance: 0.1 },
    ],
  },
  'rioh-snowfield': {
    baseExp: 1200,
    baseMeseta: 2500,
    items: [
      { itemId: 'dimate', quantity: 2, chance: 0.7 },
      { itemId: 'difluid', quantity: 2, chance: 0.5 },
      { itemId: 'brand', quantity: 1, chance: 0.1 },
    ],
  },
  'ozette-wetlands': {
    baseExp: 2000,
    baseMeseta: 4000,
    items: [
      { itemId: 'trimate', quantity: 2, chance: 0.6 },
      { itemId: 'trifluid', quantity: 2, chance: 0.4 },
      { itemId: 'buster', quantity: 1, chance: 0.05 },
    ],
  },
};

/**
 * Gurhacia Valley - First field
 */
export const GURHACIA_VALLEY: Field = {
  id: 'gurhacia-valley',
  name: 'Gurhacia Valley',
  description: 'A lush valley home to many creatures. Perfect for new adventurers.',
  areaId: 'gurhacia-valley',
  requiredLevel: 1,
  recommendedLevel: 5,
  parTime: 300, // 5 minutes
  stageSequence: [
    { stageId: 's01a', variant: 'a', areaId: 'gurhacia-valley' },
    { stageId: 's01e', variant: 'e', areaId: 'gurhacia-valley' },
    { stageId: 's01b', variant: 'b', areaId: 'gurhacia-valley' },
    { stageId: 's01z', variant: 'z', areaId: 'gurhacia-valley' },
  ],
  bossId: 'de-rol-le',
};

/**
 * Rioh Snowfield - Second field
 */
export const RIOH_SNOWFIELD: Field = {
  id: 'rioh-snowfield',
  name: 'Rioh Snowfield',
  description: 'A frozen tundra filled with dangerous ice creatures.',
  areaId: 'rioh-snowfield',
  requiredLevel: 15,
  recommendedLevel: 20,
  parTime: 420, // 7 minutes
  stageSequence: [
    { stageId: 's02a', variant: 'a', areaId: 'rioh-snowfield' },
    { stageId: 's02e', variant: 'e', areaId: 'rioh-snowfield' },
    { stageId: 's02b', variant: 'b', areaId: 'rioh-snowfield' },
    { stageId: 's02z', variant: 'z', areaId: 'rioh-snowfield' },
  ],
  unlockRequirements: [
    { type: 'field', id: 'gurhacia-valley' },
  ],
  bossId: 'de-rol-le-ice',
};

/**
 * Ozette Wetlands - Third field
 */
export const OZETTE_WETLANDS: Field = {
  id: 'ozette-wetlands',
  name: 'Ozette Wetlands',
  description: 'Murky swamplands where poisonous creatures lurk.',
  areaId: 'ozette-wetlands',
  requiredLevel: 30,
  recommendedLevel: 35,
  parTime: 540, // 9 minutes
  stageSequence: [
    { stageId: 's03a', variant: 'a', areaId: 'ozette-wetlands' },
    { stageId: 's03e', variant: 'e', areaId: 'ozette-wetlands' },
    { stageId: 's03b', variant: 'b', areaId: 'ozette-wetlands' },
    { stageId: 's03z', variant: 'z', areaId: 'ozette-wetlands' },
  ],
  unlockRequirements: [
    { type: 'field', id: 'rioh-snowfield' },
  ],
  bossId: 'vol-opt',
};

/**
 * Initialize default fields
 */
export function initializeDefaultFields(): void {
  registerField(GURHACIA_VALLEY);
  registerField(RIOH_SNOWFIELD);
  registerField(OZETTE_WETLANDS);
}
