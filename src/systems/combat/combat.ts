/**
 * Combat System - Main Module
 * Combines damage and accuracy for full attack resolution
 */

import type { Element, WeaponStats, AttackResult, CombatStats } from './types';
import { calculateDamage } from './damage';
import { calculateHitChance, calculateCriticalChance, rollHit, rollCritical } from './accuracy';

export interface AttackParams {
  attacker: CombatStats & { luck?: number };
  weapon: WeaponStats & { critBonus?: number };
  defender: CombatStats & { weakness?: Element };
  seeds?: { hit?: number; crit?: number; damage?: number };
}

/**
 * Resolve a single attack
 */
export function resolveAttack(params: AttackParams): AttackResult {
  const { attacker, weapon, defender, seeds } = params;

  // Calculate hit chance
  const hitChance = calculateHitChance(attacker.accuracy, defender.evasion);
  const hit = rollHit(hitChance, seeds?.hit);

  if (!hit) {
    return {
      hit: false,
      damage: 0,
      critical: false,
      elementalDamage: 0,
      totalDamage: 0,
    };
  }

  // Calculate critical
  const critChance = calculateCriticalChance(attacker.luck, weapon.critBonus);
  const critical = rollCritical(critChance, seeds?.crit);

  // Calculate damage
  const damageResult = calculateDamage(
    { attack: attacker.attack },
    weapon,
    { defense: defender.defense, weakness: defender.weakness },
    { isCritical: critical, varianceSeed: seeds?.damage }
  );

  return {
    hit: true,
    damage: damageResult.baseDamage,
    critical,
    elementalDamage: damageResult.elementalBonus,
    totalDamage: damageResult.finalDamage,
  };
}

/**
 * Apply damage to a combatant
 */
export function applyDamage(target: CombatStats, damage: number): CombatStats {
  return {
    ...target,
    hp: Math.max(0, target.hp - damage),
  };
}

/**
 * Check if combatant is defeated
 */
export function isDefeated(combatant: CombatStats): boolean {
  return combatant.hp <= 0;
}

/**
 * Heal a combatant
 */
export function healCombatant(target: CombatStats, amount: number): CombatStats {
  return {
    ...target,
    hp: Math.min(target.maxHp, target.hp + amount),
  };
}

/**
 * Calculate HP percentage
 */
export function getHpPercent(combatant: CombatStats): number {
  if (combatant.maxHp <= 0) return 0;
  return Math.round((combatant.hp / combatant.maxHp) * 100);
}

/**
 * Get HP bar color based on percentage
 */
export function getHpBarColor(hpPercent: number): string {
  if (hpPercent > 50) return 'green';
  if (hpPercent > 25) return 'yellow';
  return 'red';
}

/**
 * Simulate multiple attacks and return average damage
 */
export function simulateAverageDamage(
  params: Omit<AttackParams, 'seeds'>,
  iterations: number = 1000
): { averageDamage: number; hitRate: number; critRate: number } {
  let totalDamage = 0;
  let hits = 0;
  let crits = 0;

  for (let i = 0; i < iterations; i++) {
    const result = resolveAttack(params);
    if (result.hit) {
      hits++;
      totalDamage += result.totalDamage;
      if (result.critical) crits++;
    }
  }

  return {
    averageDamage: hits > 0 ? Math.round(totalDamage / hits) : 0,
    hitRate: hits / iterations,
    critRate: hits > 0 ? crits / hits : 0,
  };
}

/**
 * Calculate DPS (damage per second) estimate
 */
export function estimateDps(
  params: Omit<AttackParams, 'seeds'>,
  attacksPerSecond: number
): number {
  const sim = simulateAverageDamage(params, 100);
  return Math.round(sim.averageDamage * sim.hitRate * attacksPerSecond);
}

// Re-export types and submodule functions
export * from './types';
export * from './damage';
export * from './accuracy';
