/**
 * Progression API
 * Materials, Set Bonuses, Weapon Restrictions, and Grinding
 */
import { db } from '../db';
import { getCharacter } from './character';
import { getEquipment } from './equipment';
import { getItem, removeItem } from './inventory';
import {
  getMaterial,
  checkSetBonus,
  getSetBonusForArmor,
  canClassUseWeaponType,
  getUsableWeaponTypes,
  getClass,
  type MaterialData,
  type SetBonusData,
} from '../data/content-loader';
import type { WeaponItem, ArmorItem } from '../systems/inventory/types';

export interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface MaterialBonuses {
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
  hp: number;
  pp: number;
  technique: number;
  materialsUsed: number;
}

// ============================================================================
// MATERIAL SYSTEM
// ============================================================================

/**
 * Get material bonuses for a character
 */
export function getMaterialBonuses(characterId: string): MaterialBonuses {
  const row = db.prepare(`
    SELECT attack_bonus, defense_bonus, accuracy_bonus, evasion_bonus,
           hp_bonus, pp_bonus, technique_bonus, materials_used
    FROM material_bonuses
    WHERE character_id = ?
  `).get(characterId) as {
    attack_bonus: number;
    defense_bonus: number;
    accuracy_bonus: number;
    evasion_bonus: number;
    hp_bonus: number;
    pp_bonus: number;
    technique_bonus: number;
    materials_used: number;
  } | undefined;

  if (!row) {
    return {
      attack: 0,
      defense: 0,
      accuracy: 0,
      evasion: 0,
      hp: 0,
      pp: 0,
      technique: 0,
      materialsUsed: 0,
    };
  }

  return {
    attack: row.attack_bonus,
    defense: row.defense_bonus,
    accuracy: row.accuracy_bonus,
    evasion: row.evasion_bonus,
    hp: row.hp_bonus,
    pp: row.pp_bonus,
    technique: row.technique_bonus,
    materialsUsed: row.materials_used,
  };
}

/**
 * Get material limit for a class
 */
export function getMaterialLimit(classId: string): number {
  const classData = getClass(classId.toLowerCase());
  return classData?.materialLimit ?? 150;
}

/**
 * Use a material to permanently increase a stat
 */
export function useMaterial(characterId: string, materialId: string): ApiResult<MaterialBonuses> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  // Check if player has the material
  const item = getItem(characterId, materialId);
  if (!item) {
    return { success: false, message: 'Material not found in inventory.' };
  }

  // Get material data
  const material = getMaterial(materialId);
  if (!material) {
    return { success: false, message: 'Unknown material type.' };
  }

  // Check material limit
  const currentBonuses = getMaterialBonuses(characterId);
  const limit = getMaterialLimit(char.class_id);

  if (currentBonuses.materialsUsed >= limit) {
    return { success: false, message: `Material limit reached (${limit}/${limit}).` };
  }

  // Determine which stat to increase
  const statMap: Record<string, string> = {
    'attack': 'attack_bonus',
    'defense': 'defense_bonus',
    'accuracy': 'accuracy_bonus',
    'evasion': 'evasion_bonus',
    'hp': 'hp_bonus',
    'pp': 'pp_bonus',
    'technique': 'technique_bonus',
  };

  const stat = material.stat;
  if (!stat || !statMap[stat]) {
    // Reset material - special handling
    if (materialId.includes('reset')) {
      db.prepare(`DELETE FROM material_bonuses WHERE character_id = ?`).run(characterId);
      removeItem(characterId, materialId, 1);
      return {
        success: true,
        message: 'All material bonuses have been reset!',
        data: getMaterialBonuses(characterId),
      };
    }
    return { success: false, message: 'This material cannot be used.' };
  }

  const column = statMap[stat];

  // Upsert material bonuses
  db.prepare(`
    INSERT INTO material_bonuses (character_id, ${column}, materials_used)
    VALUES (?, 1, 1)
    ON CONFLICT(character_id) DO UPDATE SET
      ${column} = ${column} + 1,
      materials_used = materials_used + 1
  `).run(characterId);

  // Remove material from inventory
  removeItem(characterId, materialId, 1);

  const newBonuses = getMaterialBonuses(characterId);
  const statName = stat.charAt(0).toUpperCase() + stat.slice(1);

  return {
    success: true,
    message: `Used ${material.name}! ${statName} +1 (${newBonuses.materialsUsed}/${limit} materials used)`,
    data: newBonuses,
  };
}

// ============================================================================
// SET BONUS SYSTEM
// ============================================================================

/**
 * Get active set bonus for a character (if any)
 */
export function getActiveSetBonus(characterId: string): SetBonusData | null {
  const equipment = getEquipment(characterId);
  if (!equipment?.frame || !equipment?.weapon) {
    return null;
  }

  const armorName = (equipment.frame as ArmorItem).name;
  const weaponName = (equipment.weapon as WeaponItem).name;

  return checkSetBonus(armorName, weaponName);
}

/**
 * Get set bonus info for display
 */
export function getSetBonusInfo(characterId: string): ApiResult<{
  active: boolean;
  armorName?: string;
  weaponName?: string;
  bonuses?: SetBonusData['bonuses'];
  matchingWeapons?: string[];
}> {
  const equipment = getEquipment(characterId);
  if (!equipment?.frame) {
    return { success: true, message: 'No armor equipped.', data: { active: false } };
  }

  const armorName = (equipment.frame as ArmorItem).name;
  const weaponName = equipment.weapon ? (equipment.weapon as WeaponItem).name : undefined;

  const setBonus = checkSetBonus(armorName, weaponName ?? '');

  if (setBonus) {
    return {
      success: true,
      message: `Set bonus active: ${armorName} + ${weaponName}`,
      data: {
        active: true,
        armorName,
        weaponName,
        bonuses: setBonus.bonuses,
      },
    };
  }

  // Check if armor has a set bonus with other weapons
  const possibleSet = getSetBonusForArmor(armorName);

  if (possibleSet) {
    return {
      success: true,
      message: `${armorName} can form a set with: ${possibleSet.weapons.join(', ')}`,
      data: {
        active: false,
        armorName,
        matchingWeapons: possibleSet.weapons,
      },
    };
  }

  return { success: true, message: 'No set bonus available.', data: { active: false } };
}

// ============================================================================
// WEAPON RESTRICTIONS
// ============================================================================

/**
 * Check if a character can equip a weapon
 */
export function canEquipWeapon(characterId: string, weaponType: string): ApiResult {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const canUse = canClassUseWeaponType(char.class_id, weaponType);

  if (canUse) {
    return { success: true, message: `${char.class_id} can use ${weaponType}.` };
  } else {
    return { success: false, message: `${char.class_id} cannot use ${weaponType}.` };
  }
}

/**
 * Get list of weapon types a character can use
 */
export function getEquippableWeaponTypes(characterId: string): ApiResult<string[]> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const types = getUsableWeaponTypes(char.class_id);

  return {
    success: true,
    message: `${char.class_id} can use: ${types.join(', ')}`,
    data: types,
  };
}

// ============================================================================
// WEAPON GRINDING
// ============================================================================

/**
 * Grind cost scales with current grind level
 */
function getGrindCost(currentGrind: number): number {
  return 500 + currentGrind * 200;
}

/**
 * Grind success rate decreases at higher levels
 */
function getGrindSuccessRate(currentGrind: number): number {
  if (currentGrind < 3) return 100;
  if (currentGrind < 5) return 90;
  if (currentGrind < 7) return 75;
  if (currentGrind < 9) return 60;
  return 50;
}

/**
 * Grind a weapon to increase its attack power
 */
export function grindWeapon(characterId: string, weaponItemId: string): ApiResult<{
  success: boolean;
  newGrind?: number;
  attackBonus?: number;
}> {
  const char = getCharacter(characterId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  // Get the weapon from inventory or equipment
  const equipment = getEquipment(characterId);
  let weapon: WeaponItem | null = null;
  let isEquipped = false;

  if (equipment?.weapon && (equipment.weapon as WeaponItem).id === weaponItemId) {
    weapon = equipment.weapon as WeaponItem;
    isEquipped = true;
  } else {
    const item = getItem(characterId, weaponItemId);
    if (item?.item) {
      weapon = item.item as WeaponItem;
    }
  }

  if (!weapon) {
    return { success: false, message: 'Weapon not found.' };
  }

  const currentGrind = weapon.grind ?? 0;
  const maxGrind = weapon.maxGrind ?? 10;

  if (currentGrind >= maxGrind) {
    return { success: false, message: `Weapon is already at max grind (+${maxGrind}).` };
  }

  const cost = getGrindCost(currentGrind);
  if (char.meseta < cost) {
    return { success: false, message: `Not enough meseta. Need ${cost}, have ${char.meseta}.` };
  }

  const successRate = getGrindSuccessRate(currentGrind);
  const roll = Math.random() * 100;
  const succeeded = roll < successRate;

  // Deduct cost
  db.prepare("UPDATE characters SET meseta = meseta - ?, updated_at = datetime('now') WHERE id = ?")
    .run(cost, characterId);

  if (!succeeded) {
    return {
      success: false,
      message: `Grinding failed! (${successRate}% chance) Lost ${cost} meseta.`,
      data: { success: false },
    };
  }

  // Increase grind level
  const newGrind = currentGrind + 1;
  weapon.grind = newGrind;

  // Update attack based on grind
  const attackPerGrind = 2;
  weapon.attack = (weapon.attack ?? 0) + attackPerGrind;

  // Save updated weapon
  if (isEquipped) {
    db.prepare(`UPDATE equipment SET item_data = ? WHERE character_id = ? AND slot = 'weapon'`)
      .run(JSON.stringify(weapon), characterId);
  } else {
    db.prepare(`UPDATE inventory SET item_data = ? WHERE character_id = ? AND item_id = ?`)
      .run(JSON.stringify(weapon), characterId, weaponItemId);
  }

  return {
    success: true,
    message: `Grinding successful! Weapon is now +${newGrind}. ATK +${attackPerGrind}. Cost: ${cost} meseta.`,
    data: { success: true, newGrind, attackBonus: attackPerGrind },
  };
}

/**
 * Get grind info for a weapon
 */
export function getGrindInfo(characterId: string, weaponItemId: string): ApiResult<{
  currentGrind: number;
  maxGrind: number;
  cost: number;
  successRate: number;
}> {
  const equipment = getEquipment(characterId);
  let weapon: WeaponItem | null = null;

  if (equipment?.weapon && (equipment.weapon as WeaponItem).id === weaponItemId) {
    weapon = equipment.weapon as WeaponItem;
  } else {
    const item = getItem(characterId, weaponItemId);
    if (item?.item) {
      weapon = item.item as WeaponItem;
    }
  }

  if (!weapon) {
    return { success: false, message: 'Weapon not found.' };
  }

  const currentGrind = weapon.grind ?? 0;
  const maxGrind = weapon.maxGrind ?? 10;
  const cost = getGrindCost(currentGrind);
  const successRate = getGrindSuccessRate(currentGrind);

  return {
    success: true,
    message: `${weapon.name} +${currentGrind}/${maxGrind}. Next grind: ${cost} meseta (${successRate}% success)`,
    data: { currentGrind, maxGrind, cost, successRate },
  };
}
