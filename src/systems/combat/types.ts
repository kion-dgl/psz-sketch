/**
 * Combat System Types
 */

export type Element = 'fire' | 'ice' | 'lightning' | 'light' | 'dark' | null;

export interface CombatStats {
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
  hp: number;
  maxHp: number;
}

export interface WeaponStats {
  attack: number;
  accuracy: number;
  element: Element;
  elementPercent: number;
  grindBonus: number;
}

export interface AttackResult {
  hit: boolean;
  damage: number;
  critical: boolean;
  elementalDamage: number;
  totalDamage: number;
}

export interface DamageCalculation {
  baseDamage: number;
  attackBonus: number;
  defenseReduction: number;
  elementalBonus: number;
  criticalMultiplier: number;
  finalDamage: number;
}

export const ELEMENT_WEAKNESS: Record<Element & string, Element & string> = {
  fire: 'ice',
  ice: 'fire',
  lightning: 'light',
  light: 'lightning',
  dark: 'light',
};

export const CRITICAL_MULTIPLIER = 1.5;
export const CRITICAL_BASE_CHANCE = 0.05; // 5%
export const BASE_HIT_CHANCE = 0.7; // 70%
export const MAX_HIT_CHANCE = 0.95; // 95%
export const MIN_HIT_CHANCE = 0.3; // 30%
