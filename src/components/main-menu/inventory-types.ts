export type ItemCategory = 'usable' | 'weapon' | 'armor' | 'special';

// Weapon categories for sorting: melee → ranged → magic
export type WeaponCategory = 'melee' | 'ranged' | 'magic';

// Consumable types for use restrictions
export type ConsumableType = 'mate' | 'fluid' | 'atomizer' | 'telepipe' | 'trap' | 'scape_doll' | 'other';

// Special item types
export type SpecialType = 'material' | 'grinder' | 'photon_drop' | 'enemy_part' | 'unit' | 'other';

// Character classes
export type CharacterClass =
  | 'HUmar' | 'HUnewearl' | 'HUcast' | 'HUcaseal'
  | 'RAmar' | 'RAmarl' | 'RAcast' | 'RAcaseal'
  | 'FOmar' | 'FOmarl' | 'FOnewm' | 'FOnewearl';

export interface InventoryItem {
  id: string;
  itemId?: string;
  name: string;
  japaneseName?: string;
  category: ItemCategory;
  quantity: number;
  description: string;
  rarity: number;

  // Equipment status
  isEquipped?: boolean;

  // Level/class requirements
  requiredLevel?: number;
  requiredClasses?: CharacterClass[];

  // For consumables
  consumableType?: ConsumableType;
  maxStack?: number;  // Max quantity (default 10, star atomizer 5, scape doll 1)

  // For armor
  dfp?: number;
  evp?: number;
  slots?: number;
  isUnit?: boolean;  // True for slot units, false for armor

  // For weapons
  atp?: number;
  ata?: number;
  mst?: number;
  weaponType?: string;
  weaponCategory?: WeaponCategory;  // For sorting

  // For special items
  specialType?: SpecialType;
  canUse?: boolean;  // Whether item can be used from menu (materials = true)
}

export interface PlayerInventory {
  version: number;
  maxItems: number;
  items: InventoryItem[];
}

// Player state for determining what can be used/equipped
export interface PlayerState {
  level: number;
  characterClass: CharacterClass;
  currentHP: number;
  maxHP: number;
  currentPP: number;
  maxPP: number;
  equippedWeaponId?: string;
  equippedArmorId?: string;
  equippedUnitIds?: string[];  // Up to 4 units
}

// Item action types
export type ItemAction = 'use' | 'equip' | 'unequip' | 'discard';

export interface ItemActionOption {
  action: ItemAction;
  label: string;
  disabled: boolean;
  disabledReason?: string;
}

// Helper to get max stack for consumable types
export function getMaxStack(consumableType?: ConsumableType): number {
  switch (consumableType) {
    case 'scape_doll':
      return 1;
    case 'atomizer':
      return 5;  // Star atomizer specifically
    default:
      return 10;
  }
}

// Helper to get weapon sort order
export function getWeaponSortOrder(category?: WeaponCategory): number {
  switch (category) {
    case 'melee': return 0;
    case 'ranged': return 1;
    case 'magic': return 2;
    default: return 3;
  }
}

// Helper to check if player can equip item
export function canPlayerEquip(item: InventoryItem, player: PlayerState): { canEquip: boolean; reason?: string } {
  // Check level requirement
  if (item.requiredLevel && player.level < item.requiredLevel) {
    return { canEquip: false, reason: `Requires Lv ${item.requiredLevel}` };
  }

  // Check class requirement
  if (item.requiredClasses && item.requiredClasses.length > 0) {
    if (!item.requiredClasses.includes(player.characterClass)) {
      return { canEquip: false, reason: 'Class cannot equip' };
    }
  }

  return { canEquip: true };
}

// Helper to check if consumable can be used
export function canUseConsumable(item: InventoryItem, player: PlayerState): { canUse: boolean; reason?: string } {
  if (item.category !== 'usable') {
    return { canUse: false, reason: 'Not usable' };
  }

  switch (item.consumableType) {
    case 'mate':
      if (player.currentHP >= player.maxHP) {
        return { canUse: false, reason: 'HP is full' };
      }
      break;
    case 'fluid':
      if (player.currentPP >= player.maxPP) {
        return { canUse: false, reason: 'PP is full' };
      }
      break;
  }

  return { canUse: true };
}

// Get available actions for an item
export function getItemActions(item: InventoryItem, player: PlayerState): ItemActionOption[] {
  const actions: ItemActionOption[] = [];

  switch (item.category) {
    case 'usable': {
      const useCheck = canUseConsumable(item, player);
      actions.push({
        action: 'use',
        label: 'Use',
        disabled: !useCheck.canUse,
        disabledReason: useCheck.reason,
      });
      actions.push({
        action: 'discard',
        label: 'Discard',
        disabled: false,
      });
      break;
    }

    case 'weapon':
    case 'armor': {
      const equipCheck = canPlayerEquip(item, player);

      if (item.isEquipped) {
        actions.push({
          action: 'unequip',
          label: 'Unequip',
          disabled: false,
        });
      } else {
        actions.push({
          action: 'equip',
          label: 'Equip',
          disabled: !equipCheck.canEquip,
          disabledReason: equipCheck.reason,
        });
      }
      actions.push({
        action: 'discard',
        label: 'Discard',
        disabled: false,
      });
      break;
    }

    case 'special': {
      // Only materials can be used
      if (item.specialType === 'material') {
        actions.push({
          action: 'use',
          label: 'Use',
          disabled: false,
        });
      }
      actions.push({
        action: 'discard',
        label: 'Discard',
        disabled: false,
      });
      break;
    }
  }

  return actions;
}
