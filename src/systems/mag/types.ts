/**
 * Mag System Types
 */

export interface MagStats {
  power: number;
  guard: number;
  hit: number;
  mind: number;
}

export interface MagState {
  id: string;
  characterId: string;
  stats: MagStats;
  sync: number;      // 0-120, affects trigger activation
  iq: number;        // 0-200, affects behavior
  personality: string;
  createdAt: string;
}

export interface MagFeedEffect {
  power: number;
  guard: number;
  hit: number;
  mind: number;
  sync: number;
}

export interface MagForm {
  id: string;
  name: string;
  stage: number;
  photonBlast: string | null;
}

// Feed effects for different item types
// Based on PSZ feeding mechanics
export const MAG_FEED_EFFECTS: Record<string, MagFeedEffect> = {
  // Mates - raise Power
  monomate: { power: 1, guard: 0, hit: 0, mind: 0, sync: 5 },
  dimate: { power: 2, guard: 0, hit: 0, mind: 0, sync: 10 },
  trimate: { power: 3, guard: 0, hit: 0, mind: 0, sync: 15 },

  // Fluids - raise Mind
  monofluid: { power: 0, guard: 0, hit: 0, mind: 1, sync: 5 },
  difluid: { power: 0, guard: 0, hit: 0, mind: 2, sync: 10 },
  trifluid: { power: 0, guard: 0, hit: 0, mind: 3, sync: 15 },

  // Antidotes - raise Guard
  antidote: { power: 0, guard: 1, hit: 0, mind: 0, sync: 3 },
  antiparalysis: { power: 0, guard: 1, hit: 0, mind: 0, sync: 3 },

  // Sol Atomizer - raise Hit
  sol_atomizer: { power: 0, guard: 0, hit: 2, mind: 0, sync: 8 },

  // Moon Atomizer - mixed stats
  moon_atomizer: { power: 1, guard: 1, hit: 1, mind: 1, sync: 10 },

  // Star Atomizer - all stats
  star_atomizer: { power: 2, guard: 2, hit: 2, mind: 2, sync: 20 },
};

// Default personalities a mag can have
export const MAG_PERSONALITIES = [
  'playful',
  'anxious',
  'breezy',
  'cautious',
  'eccentric',
  'fickle',
  'healing',
  'hungry',
  'melancholy',
  'obstinate',
  'ruffian',
  'timid',
] as const;

export type MagPersonality = typeof MAG_PERSONALITIES[number];
