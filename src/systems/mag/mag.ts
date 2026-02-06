/**
 * Mag System
 * Companion creatures that grow by feeding items
 */

import type { MagState, MagStats, MagForm, MagFeedEffect } from './types';
import { MAG_FEED_EFFECTS, MAG_PERSONALITIES } from './types';
import { getLevel, determineForm } from '../../lib/mag-evolution';

/**
 * Create a new mag for a character
 */
export function createMag(characterId: string): MagState {
  // Random personality
  const personality = MAG_PERSONALITIES[Math.floor(Math.random() * MAG_PERSONALITIES.length)];

  return {
    id: `mag_${characterId}_${Date.now()}`,
    characterId,
    stats: { power: 0, guard: 0, hit: 0, mind: 0 },
    sync: 0,
    iq: 0,
    personality,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get current level of a mag
 */
export function getMagLevel(mag: MagState): number {
  return getLevel(mag.stats);
}

/**
 * Get current form of a mag
 */
export function getMagForm(mag: MagState): MagForm {
  const { id, mag: form } = determineForm(mag.stats);
  return {
    id,
    name: form.name,
    stage: form.stage,
    photonBlast: form.photonBlast,
  };
}

/**
 * Check if an item can be fed to a mag
 */
export function canFeedItem(itemId: string): boolean {
  return itemId.toLowerCase() in MAG_FEED_EFFECTS;
}

/**
 * Get feed effect for an item
 */
export function getFeedEffect(itemId: string): MagFeedEffect | null {
  return MAG_FEED_EFFECTS[itemId.toLowerCase()] ?? null;
}

/**
 * Get list of feedable items
 */
export function getFeedableItems(): string[] {
  return Object.keys(MAG_FEED_EFFECTS);
}

export interface FeedResult {
  success: boolean;
  message: string;
  levelBefore: number;
  levelAfter: number;
  formBefore: MagForm;
  formAfter: MagForm;
  evolved: boolean;
  leveledUp: boolean;
}

/**
 * Feed an item to a mag
 * Returns the updated mag state and feed result
 */
export function feedMag(mag: MagState, itemId: string): { mag: MagState; result: FeedResult } {
  const feedEffect = getFeedEffect(itemId);
  if (!feedEffect) {
    const validItems = getFeedableItems().join(', ');
    return {
      mag,
      result: {
        success: false,
        message: `Cannot feed ${itemId} to MAG. Valid items: ${validItems}`,
        levelBefore: getMagLevel(mag),
        levelAfter: getMagLevel(mag),
        formBefore: getMagForm(mag),
        formAfter: getMagForm(mag),
        evolved: false,
        leveledUp: false,
      },
    };
  }

  // Get state before feeding
  const levelBefore = getMagLevel(mag);
  const formBefore = getMagForm(mag);

  // Apply feed effects (create new state, don't mutate)
  const updatedMag: MagState = {
    ...mag,
    stats: {
      power: mag.stats.power + feedEffect.power,
      guard: mag.stats.guard + feedEffect.guard,
      hit: mag.stats.hit + feedEffect.hit,
      mind: mag.stats.mind + feedEffect.mind,
    },
    sync: Math.min(120, mag.sync + feedEffect.sync),
    iq: Math.min(200, mag.iq + 1),
  };

  // Get state after feeding
  const levelAfter = getMagLevel(updatedMag);
  const formAfter = getMagForm(updatedMag);

  const leveledUp = levelAfter > levelBefore;
  const evolved = formAfter.name !== formBefore.name;

  // Build message
  const lines: string[] = [];
  lines.push(`Fed ${itemId} to MAG!`);
  lines.push(`Stats: Power +${feedEffect.power}, Guard +${feedEffect.guard}, Hit +${feedEffect.hit}, Mind +${feedEffect.mind}`);
  lines.push(`Sync: +${feedEffect.sync} (now ${updatedMag.sync}/120)`);

  if (leveledUp) {
    lines.push(`\n*** MAG leveled up! Level ${levelBefore} → ${levelAfter} ***`);
  }

  if (evolved) {
    lines.push(`\n*** MAG EVOLVED! ***`);
    lines.push(`${formBefore.name} → ${formAfter.name}`);
    if (formAfter.photonBlast) {
      lines.push(`Learned Photon Blast: ${formAfter.photonBlast}!`);
    }
  }

  return {
    mag: updatedMag,
    result: {
      success: true,
      message: lines.join('\n'),
      levelBefore,
      levelAfter,
      formBefore,
      formAfter,
      evolved,
      leveledUp,
    },
  };
}

/**
 * Format mag info for display
 */
export function formatMagInfo(mag: MagState): string {
  const level = getMagLevel(mag);
  const form = getMagForm(mag);

  const lines: string[] = [];
  lines.push(`=== ${form.name} ===`);
  lines.push(`Level: ${level} (Stage ${form.stage})`);
  lines.push(`Personality: ${mag.personality}`);
  lines.push(`Stats:`);
  lines.push(`  Power: ${mag.stats.power}`);
  lines.push(`  Guard: ${mag.stats.guard}`);
  lines.push(`  Hit:   ${mag.stats.hit}`);
  lines.push(`  Mind:  ${mag.stats.mind}`);
  lines.push(`Sync: ${mag.sync}/120`);
  lines.push(`IQ: ${mag.iq}/200`);

  if (form.photonBlast) {
    lines.push(`Photon Blast: ${form.photonBlast}`);
  }

  // Evolution hints
  if (level < 10) {
    lines.push(`\nEvolves at Level 10. Feed items to raise stats!`);
  } else if (level < 30) {
    lines.push(`\nEvolves at Level 30. Keep feeding!`);
  } else if (level < 60) {
    lines.push(`\nFinal evolution at Level 60!`);
  }

  return lines.join('\n');
}

/**
 * Calculate stat bonuses from mag to character
 * At max level (200), mag provides significant stat boosts
 */
export function getMagStatBonuses(mag: MagState): {
  attack: number;
  defense: number;
  accuracy: number;
  technique: number;
} {
  // Each mag stat point provides 2 points to the corresponding character stat
  return {
    attack: Math.floor(mag.stats.power * 2),
    defense: Math.floor(mag.stats.guard * 2),
    accuracy: Math.floor(mag.stats.hit * 2),
    technique: Math.floor(mag.stats.mind * 2),
  };
}

// Re-export types
export type { MagState, MagStats, MagForm, MagFeedEffect };
export { MAG_FEED_EFFECTS, MAG_PERSONALITIES };
