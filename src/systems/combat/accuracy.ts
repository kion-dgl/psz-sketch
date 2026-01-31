/**
 * Accuracy and Hit Calculation System
 */

import {
  BASE_HIT_CHANCE,
  MAX_HIT_CHANCE,
  MIN_HIT_CHANCE,
  CRITICAL_BASE_CHANCE,
} from './types';

/**
 * Calculate hit chance based on attacker accuracy and defender evasion
 */
export function calculateHitChance(
  attackerAccuracy: number,
  defenderEvasion: number
): number {
  // Base chance modified by accuracy vs evasion difference
  // Every 10 points of net accuracy = +5% hit chance
  // Every 10 points of net evasion = -5% hit chance
  const netAccuracy = attackerAccuracy - defenderEvasion;
  const modifier = netAccuracy * 0.005; // 0.5% per point

  const hitChance = BASE_HIT_CHANCE + modifier;

  // Clamp between min and max
  return Math.min(MAX_HIT_CHANCE, Math.max(MIN_HIT_CHANCE, hitChance));
}

/**
 * Calculate critical hit chance
 */
export function calculateCriticalChance(
  attackerLuck: number = 0,
  weaponCritBonus: number = 0
): number {
  // Base crit + luck bonus + weapon bonus
  // Luck gives 0.1% per point
  const luckBonus = attackerLuck * 0.001;
  const critChance = CRITICAL_BASE_CHANCE + luckBonus + weaponCritBonus;

  // Cap at 25%
  return Math.min(0.25, Math.max(0, critChance));
}

/**
 * Roll to determine if attack hits
 */
export function rollHit(hitChance: number, seed?: number): boolean {
  const roll = seed !== undefined ? (seed % 100) / 100 : Math.random();
  return roll < hitChance;
}

/**
 * Roll to determine if attack is critical
 */
export function rollCritical(critChance: number, seed?: number): boolean {
  const roll = seed !== undefined ? (seed % 100) / 100 : Math.random();
  return roll < critChance;
}

/**
 * Get hit chance display string
 */
export function getHitChanceDisplay(hitChance: number): string {
  return `${Math.round(hitChance * 100)}%`;
}

/**
 * Calculate effective accuracy for display
 * Shows how much accuracy is "working" given enemy evasion
 */
export function getEffectiveAccuracy(
  attackerAccuracy: number,
  defenderEvasion: number
): number {
  return Math.max(0, attackerAccuracy - defenderEvasion);
}

/**
 * Check if an attack would have advantage (high hit chance)
 */
export function hasAccuracyAdvantage(hitChance: number): boolean {
  return hitChance >= 0.85;
}

/**
 * Check if an attack would have disadvantage (low hit chance)
 */
export function hasAccuracyDisadvantage(hitChance: number): boolean {
  return hitChance <= 0.45;
}

/**
 * Get accuracy comparison result
 */
export function compareAccuracy(
  attackerAccuracy: number,
  defenderEvasion: number
): 'advantage' | 'neutral' | 'disadvantage' {
  const hitChance = calculateHitChance(attackerAccuracy, defenderEvasion);

  if (hasAccuracyAdvantage(hitChance)) return 'advantage';
  if (hasAccuracyDisadvantage(hitChance)) return 'disadvantage';
  return 'neutral';
}

/**
 * Calculate required accuracy to reach a target hit chance
 */
export function requiredAccuracyFor(
  targetHitChance: number,
  defenderEvasion: number
): number {
  // Reverse the hit chance formula
  // targetHitChance = BASE_HIT_CHANCE + (accuracy - evasion) * 0.005
  // (targetHitChance - BASE_HIT_CHANCE) / 0.005 = accuracy - evasion
  const netRequired = (targetHitChance - BASE_HIT_CHANCE) / 0.005;
  return Math.ceil(netRequired + defenderEvasion);
}
