/**
 * Damage Calculation System
 */

import type { Element, WeaponStats, DamageCalculation } from './types';
import { ELEMENT_WEAKNESS, CRITICAL_MULTIPLIER } from './types';

/**
 * Calculate base damage from attacker stats and weapon
 */
export function calculateBaseDamage(
  attackerAttack: number,
  weaponAttack: number,
  grindBonus: number = 0
): number {
  // Base damage = attacker attack + weapon attack + grind bonus
  const baseDamage = attackerAttack + weaponAttack + grindBonus;
  return Math.max(1, Math.floor(baseDamage));
}

/**
 * Calculate elemental damage bonus
 * Returns a multiplier (1.0 = no bonus, 1.5 = weakness hit)
 */
export function calculateElementalMultiplier(
  attackElement: Element,
  defenderWeakness: Element,
  elementPercent: number = 0
): number {
  if (!attackElement || !defenderWeakness) {
    return 1.0;
  }

  // Check if attack element hits weakness
  const isWeak = ELEMENT_WEAKNESS[attackElement] === defenderWeakness ||
    (attackElement === 'light' && defenderWeakness === 'dark');

  if (isWeak) {
    // Bonus scales with element percent (0-100%)
    // At 100%, weakness does 1.5x damage
    const bonus = 0.5 * (elementPercent / 100);
    return 1.0 + bonus;
  }

  return 1.0;
}

/**
 * Calculate defense reduction
 * Returns the damage after defense is applied
 *
 * Class Balance: Uses a hybrid flat + percentage reduction formula
 * that makes high defense more impactful. CASTs with high DFP become true tanks.
 *
 * Formula: damage - (defense * 0.25) - (damage * defense / 600)
 * - Flat component: defense * 0.25 (direct damage reduction)
 * - Percentage component: damage * defense / 600 (scales with incoming damage)
 *
 * This provides meaningful differentiation:
 * - 0 DEF: 100% damage taken
 * - 100 DEF: ~58% damage taken
 * - 150 DEF: ~38% damage taken
 * - 200 DEF: ~17% damage taken (CAST tank level)
 * - 250+ DEF: Approaches minimum damage
 */
export function applyDefense(damage: number, defense: number): number {
  const def = Math.max(0, defense);
  // Flat reduction: defense * 0.25
  const flatReduction = def * 0.25;
  // Percentage reduction: scales with both damage and defense
  const percentReduction = (damage * def) / 600;
  // Total damage after reduction
  const finalDamage = damage - flatReduction - percentReduction;
  return Math.max(1, Math.floor(finalDamage));
}

/**
 * Calculate critical damage
 */
export function applyCritical(damage: number, isCritical: boolean): number {
  if (isCritical) {
    return Math.floor(damage * CRITICAL_MULTIPLIER);
  }
  return damage;
}

/**
 * Calculate variance for damage (±10%)
 */
export function applyVariance(damage: number, seed?: number): number {
  // ±10% variance
  const variance = seed !== undefined
    ? (seed % 21 - 10) / 100 // Deterministic for testing
    : (Math.random() * 0.2 - 0.1); // Random ±10%

  return Math.max(1, Math.floor(damage * (1 + variance)));
}

/**
 * Full damage calculation pipeline
 */
export function calculateDamage(
  attackerStats: { attack: number },
  weapon: WeaponStats,
  defenderStats: { defense: number; weakness?: Element },
  options: {
    isCritical?: boolean;
    varianceSeed?: number;
  } = {}
): DamageCalculation {
  // Step 1: Base damage
  const baseDamage = calculateBaseDamage(
    attackerStats.attack,
    weapon.attack,
    weapon.grindBonus
  );

  // Step 2: Elemental multiplier
  const elementalMultiplier = calculateElementalMultiplier(
    weapon.element,
    defenderStats.weakness ?? null,
    weapon.elementPercent
  );
  const afterElemental = Math.floor(baseDamage * elementalMultiplier);

  // Step 3: Apply defense
  const afterDefense = applyDefense(afterElemental, defenderStats.defense);

  // Step 4: Critical hit
  const afterCritical = applyCritical(afterDefense, options.isCritical ?? false);

  // Step 5: Variance
  const finalDamage = applyVariance(afterCritical, options.varianceSeed);

  return {
    baseDamage,
    attackBonus: weapon.attack + weapon.grindBonus,
    defenseReduction: afterElemental - afterDefense,
    elementalBonus: afterElemental - baseDamage,
    criticalMultiplier: options.isCritical ? CRITICAL_MULTIPLIER : 1.0,
    finalDamage,
  };
}

/**
 * Calculate minimum possible damage for display
 */
export function getMinDamage(baseDamage: number): number {
  return Math.max(1, Math.floor(baseDamage * 0.9));
}

/**
 * Calculate maximum possible damage for display
 */
export function getMaxDamage(baseDamage: number): number {
  return Math.floor(baseDamage * 1.1);
}

/**
 * Get damage range for UI display
 */
export function getDamageRange(
  attackerAttack: number,
  weaponAttack: number,
  defenderDefense: number
): { min: number; max: number } {
  const baseDamage = calculateBaseDamage(attackerAttack, weaponAttack);
  const afterDefense = applyDefense(baseDamage, defenderDefense);

  return {
    min: getMinDamage(afterDefense),
    max: getMaxDamage(afterDefense),
  };
}
