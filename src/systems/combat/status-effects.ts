/**
 * Status Effects System
 * Handles freeze, stun, poison, slow, paralysis, burn
 */

import type { Element } from './types';

export type StatusEffectType =
  | 'freeze'    // Skip turn, next hit does 1.5x, breaks on hit
  | 'stun'      // Skip turn, 1 turn duration
  | 'poison'    // DoT (5% maxHP/turn), 3 turns
  | 'slow'      // -50% evasion, 3 turns
  | 'paralysis' // 50% chance skip turn, 3 turns
  | 'burn';     // DoT + -10% defense, 3 turns

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;      // Remaining turns
  appliedBy?: string;    // Who applied it (for tracking)
}

export interface StatusEffectDefinition {
  type: StatusEffectType;
  name: string;
  description: string;
  baseDuration: number;
  element: Element;      // Which element causes this
  skipsTurn: boolean;    // Does this effect skip the victim's turn?
  dotPercent?: number;   // Damage over time as % of maxHP
  evasionMod?: number;   // Multiplier to evasion (0.5 = -50%)
  defenseMod?: number;   // Multiplier to defense (0.9 = -10%)
  damageTakenMod?: number; // Multiplier to damage taken (1.5 = +50%)
  breakOnHit?: boolean;  // Does effect break when hit?
  skipChance?: number;   // Chance to skip turn (for paralysis)
}

export const STATUS_EFFECT_DEFINITIONS: Record<StatusEffectType, StatusEffectDefinition> = {
  freeze: {
    type: 'freeze',
    name: 'Frozen',
    description: 'Cannot act. Takes 1.5x damage from next hit, then unfreezes.',
    baseDuration: 2,
    element: 'ice',
    skipsTurn: true,
    damageTakenMod: 1.5,
    breakOnHit: true,
  },
  stun: {
    type: 'stun',
    name: 'Stunned',
    description: 'Cannot act for 1 turn.',
    baseDuration: 1,
    element: 'lightning',
    skipsTurn: true,
  },
  poison: {
    type: 'poison',
    name: 'Poisoned',
    description: 'Takes 5% max HP damage each turn.',
    baseDuration: 3,
    element: 'dark',
    skipsTurn: false,
    dotPercent: 5,
  },
  slow: {
    type: 'slow',
    name: 'Slowed',
    description: 'Evasion reduced by 50%.',
    baseDuration: 3,
    element: 'ice',
    skipsTurn: false,
    evasionMod: 0.5,
  },
  paralysis: {
    type: 'paralysis',
    name: 'Paralyzed',
    description: '50% chance to be unable to act each turn.',
    baseDuration: 3,
    element: 'lightning',
    skipsTurn: false,
    skipChance: 0.5,
  },
  burn: {
    type: 'burn',
    name: 'Burning',
    description: 'Takes 3% max HP damage and -10% defense.',
    baseDuration: 3,
    element: 'fire',
    skipsTurn: false,
    dotPercent: 3,
    defenseMod: 0.9,
  },
};

/**
 * Map elements to their status effects
 * Ice can cause freeze OR slow (50/50)
 * Lightning can cause stun OR paralysis (50/50)
 */
export const ELEMENT_STATUS_MAP: Record<Element & string, StatusEffectType[]> = {
  fire: ['burn'],
  ice: ['freeze', 'slow'],
  lightning: ['stun', 'paralysis'],
  light: [], // Light does extra damage to dark, no status
  dark: ['poison'],
};

/**
 * Roll for status effect application
 * @param element Weapon element
 * @param elementPercent Weapon element % (0-100)
 * @param seed Optional seed for deterministic testing
 * @returns Status effect to apply, or null
 */
export function rollStatusEffect(
  element: Element,
  elementPercent: number,
  seed?: number
): StatusEffectType | null {
  if (!element || elementPercent <= 0) return null;

  const possibleEffects = ELEMENT_STATUS_MAP[element];
  if (!possibleEffects || possibleEffects.length === 0) return null;

  // Chance to apply = elementPercent (e.g., 30% element = 30% chance)
  const roll = seed !== undefined ? (seed % 100) : Math.floor(Math.random() * 100);
  if (roll >= elementPercent) return null;

  // If multiple possible effects, pick one randomly
  if (possibleEffects.length === 1) {
    return possibleEffects[0];
  }

  const effectRoll = seed !== undefined
    ? (seed % possibleEffects.length)
    : Math.floor(Math.random() * possibleEffects.length);
  return possibleEffects[effectRoll];
}

/**
 * Create a new status effect instance
 */
export function createStatusEffect(
  type: StatusEffectType,
  appliedBy?: string
): StatusEffect {
  const def = STATUS_EFFECT_DEFINITIONS[type];
  return {
    type,
    duration: def.baseDuration,
    appliedBy,
  };
}

/**
 * Check if target should skip their turn due to status
 */
export function shouldSkipTurn(effects: StatusEffect[], seed?: number): boolean {
  for (const effect of effects) {
    const def = STATUS_EFFECT_DEFINITIONS[effect.type];

    if (def.skipsTurn) {
      return true;
    }

    if (def.skipChance) {
      const roll = seed !== undefined ? (seed % 100) / 100 : Math.random();
      if (roll < def.skipChance) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculate DoT damage from status effects
 */
export function calculateDotDamage(effects: StatusEffect[], maxHp: number): number {
  let totalDamage = 0;

  for (const effect of effects) {
    const def = STATUS_EFFECT_DEFINITIONS[effect.type];
    if (def.dotPercent) {
      totalDamage += Math.floor(maxHp * def.dotPercent / 100);
    }
  }

  return totalDamage;
}

/**
 * Get evasion modifier from status effects
 */
export function getEvasionModifier(effects: StatusEffect[]): number {
  let modifier = 1.0;

  for (const effect of effects) {
    const def = STATUS_EFFECT_DEFINITIONS[effect.type];
    if (def.evasionMod) {
      modifier *= def.evasionMod;
    }
  }

  return modifier;
}

/**
 * Get defense modifier from status effects
 */
export function getDefenseModifier(effects: StatusEffect[]): number {
  let modifier = 1.0;

  for (const effect of effects) {
    const def = STATUS_EFFECT_DEFINITIONS[effect.type];
    if (def.defenseMod) {
      modifier *= def.defenseMod;
    }
  }

  return modifier;
}

/**
 * Get damage taken modifier (for frozen targets)
 */
export function getDamageTakenModifier(effects: StatusEffect[]): number {
  let modifier = 1.0;

  for (const effect of effects) {
    const def = STATUS_EFFECT_DEFINITIONS[effect.type];
    if (def.damageTakenMod) {
      modifier *= def.damageTakenMod;
    }
  }

  return modifier;
}

/**
 * Process effects that break on hit
 * Returns updated effects array with broken effects removed
 */
export function processBreakOnHit(effects: StatusEffect[]): StatusEffect[] {
  return effects.filter(effect => {
    const def = STATUS_EFFECT_DEFINITIONS[effect.type];
    return !def.breakOnHit;
  });
}

/**
 * Tick status effects at end of turn
 * Decrements duration and removes expired effects
 */
export function tickStatusEffects(effects: StatusEffect[]): StatusEffect[] {
  return effects
    .map(effect => ({ ...effect, duration: effect.duration - 1 }))
    .filter(effect => effect.duration > 0);
}

/**
 * Check if target has a specific status effect
 */
export function hasStatusEffect(
  effects: StatusEffect[],
  type: StatusEffectType
): boolean {
  return effects.some(e => e.type === type);
}

/**
 * Get status effect display text
 */
export function getStatusEffectDisplay(effects: StatusEffect[]): string {
  if (effects.length === 0) return '';

  return effects
    .map(e => {
      const def = STATUS_EFFECT_DEFINITIONS[e.type];
      return `${def.name}(${e.duration})`;
    })
    .join(', ');
}

/**
 * Check if a status can be applied (no stacking same type)
 */
export function canApplyStatus(
  effects: StatusEffect[],
  type: StatusEffectType
): boolean {
  return !hasStatusEffect(effects, type);
}

/**
 * Apply a status effect if possible
 * Returns new effects array
 */
export function applyStatusEffect(
  effects: StatusEffect[],
  type: StatusEffectType,
  appliedBy?: string
): StatusEffect[] {
  if (!canApplyStatus(effects, type)) {
    return effects;
  }

  return [...effects, createStatusEffect(type, appliedBy)];
}
