/**
 * CLI API v2
 * Refactored to use SQLite-backed API
 */

import type { GameState, CommandResult, AvailableCommand, Location, DetailedItem, EquipmentSlots } from './types';
import type { Character as SystemCharacter } from '../systems/character/types';
import type { GameItem, WeaponItem, ArmorItem, UnitItem, ConsumableItem } from '../systems/inventory/types';
import { VALID_CLASS_IDS } from '../systems/character/types';

// Import SQLite-backed API
import {
  resetDatabase,
  createCharacter as dbCreateCharacter,
  getCharacter,
  getCharacterBySlot,
  getAllCharacters,
  deleteCharacter as dbDeleteCharacter,
  updateMeseta,
  addExperience,
  getInventory,
  addItem,
  removeItem,
  getItem,
  useConsumable,
  getEquipment,
  equipWeapon,
  equipFrame,
  equipUnit,
  unequipWeapon,
  unequipFrame,
  unequipUnit,
  getStorage,
  depositMeseta,
  withdrawMeseta,
  depositItem,
  withdrawItem,
  getLocation,
  goto as dbGoto,
  getGameState,
  setSessionData,
  getPendingMission,
  setPendingMission,
  suspendSession,
  resumeSession,
  getSuspendedSession,
  enterMission,
  enterField,
  returnToCity,
  nextStage,
  addExperience as dbAddExperience,
  updateMeseta as dbUpdateMeseta,
  initCombat,
  getEnemies,
  getPlayerState,
  getDroppedItems,
  spawnEnemies,
  attack as dbAttack,
  pickupItem,
  pickupAll,
  healPlayer,
  restoreTP,
  clearCombat,
  isWaveCleared,
  getItemShopInventory,
  getWeaponShopInventory,
  refreshWeaponShopInventory,
  buyItem,
  buyEquipment,
  sellItem,
  type Character as ApiCharacter,
  type Difficulty,
} from '../api';

// Import mission data
import { getAllMissions, initializeDefaultMissions } from '../systems/mission';
import { getClassStatsAtLevel, canClassUseWeaponType } from '../data/content-loader';

// Import progression systems
import {
  getMaterialBonuses,
  getMaterialLimit,
  useMaterial,
  getActiveSetBonus,
  getSetBonusInfo,
  getEquippableWeaponTypes,
  grindWeapon,
  getGrindInfo,
} from '../api/progression';

// Import skills systems
import {
  getKnownTechniques,
  learnTechnique,
  castTechnique,
  getAvailablePhotonArts,
  usePhotonArt,
  listAllTechniques,
  listAllPhotonArts,
} from '../api/skills';

// Initialize missions on module load
initializeDefaultMissions();

const MAX_INVENTORY_SLOTS = 30;

// Current character slot (which slot is active)
let currentSlot: number | null = null;

/**
 * Convert API Character to CLI Character format
 */
function toCliCharacter(apiChar: ApiCharacter): SystemCharacter {
  return {
    character_id: apiChar.id,
    character_name: apiChar.name,
    level: apiChar.level,
    experience: apiChar.experience,
    slot: apiChar.slot,
    class_id: apiChar.class_id,
    variation_index: apiChar.variation_index,
    texture_id: apiChar.texture_id,
    created_at: apiChar.created_at,
    meseta: apiChar.meseta,
  };
}

/**
 * Get current character ID
 */
function getCurrentCharacterId(): string | null {
  if (currentSlot === null) return null;
  const char = getCharacterBySlot(currentSlot);
  return char?.id ?? null;
}

/**
 * Convert a GameItem to DetailedItem for UI display
 */
function toDetailedItem(item: GameItem, quantity: number): DetailedItem {
  const base: DetailedItem = {
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    rarity: item.rarity,
    quantity,
  };

  // Add type-specific properties
  if (item.type === 'weapon') {
    const weapon = item as WeaponItem;
    base.attack = weapon.attack;
    base.accuracy = weapon.accuracy;
    base.weaponType = weapon.weaponType;
    base.element = weapon.element ?? undefined;
    base.elementPercent = weapon.elementPercent;
    base.grindLevel = weapon.grindLevel;
    base.maxGrind = weapon.maxGrind;
    base.requiredLevel = weapon.requiredLevel;
  } else if (item.type === 'armor') {
    const armor = item as ArmorItem;
    base.defense = armor.defense;
    base.evasion = armor.evasion;
    base.unitSlots = armor.unitSlots;
    base.requiredLevel = armor.requiredLevel;
  } else if (item.type === 'unit') {
    const unit = item as UnitItem;
    base.attackBonus = unit.attackBonus;
    base.defenseBonus = unit.defenseBonus;
    base.accuracyBonus = unit.accuracyBonus;
    base.evasionBonus = unit.evasionBonus;
    base.hpBonus = unit.hpBonus;
    base.tpBonus = unit.tpBonus;
    base.requiredLevel = unit.requiredLevel;
  } else if (item.type === 'consumable') {
    const consumable = item as ConsumableItem;
    base.effect = consumable.effect;
    base.effectValue = consumable.effectValue;
  }

  return base;
}

/**
 * Get game state
 */
export function getState(): GameState {
  const charId = getCurrentCharacterId();
  const char = charId ? getCharacter(charId) : null;

  // Default empty state
  if (!char || !charId) {
    return {
      character: null,
      location: 'city',
      inventory: [],
      equipment: {
        weapon: null,
        frame: null,
        barrier: null,
        unit1: null,
        unit2: null,
        unit3: null,
        unit4: null,
      },
      meseta: 0,
      inventorySlots: 0,
      maxInventorySlots: MAX_INVENTORY_SLOTS,
    };
  }

  // Get equipment
  const equip = getEquipment(charId);
  const equipment: EquipmentSlots = {
    weapon: equip.weapon ? toDetailedItem(equip.weapon, 1) : null,
    frame: equip.frame ? toDetailedItem(equip.frame, 1) : null,
    barrier: null,
    unit1: equip.unit1 ? toDetailedItem(equip.unit1, 1) : null,
    unit2: equip.unit2 ? toDetailedItem(equip.unit2, 1) : null,
    unit3: equip.unit3 ? toDetailedItem(equip.unit3, 1) : null,
    unit4: equip.unit4 ? toDetailedItem(equip.unit4, 1) : null,
  };

  // Mark equipped items
  if (equipment.weapon) equipment.weapon.equipped = true;
  if (equipment.frame) equipment.frame.equipped = true;
  if (equipment.unit1) equipment.unit1.equipped = true;
  if (equipment.unit2) equipment.unit2.equipped = true;
  if (equipment.unit3) equipment.unit3.equipped = true;
  if (equipment.unit4) equipment.unit4.equipped = true;

  // Get inventory
  const inv = getInventory(charId);
  const detailedInventory = inv.map(slot => toDetailedItem(slot.item, slot.quantity));

  // Prepend equipped items to inventory list
  const allItems: DetailedItem[] = [];
  if (equipment.weapon) allItems.push(equipment.weapon);
  if (equipment.frame) allItems.push(equipment.frame);
  if (equipment.unit1) allItems.push(equipment.unit1);
  if (equipment.unit2) allItems.push(equipment.unit2);
  if (equipment.unit3) allItems.push(equipment.unit3);
  if (equipment.unit4) allItems.push(equipment.unit4);
  allItems.push(...detailedInventory);

  // Get location and combat state
  const location = getLocation(charId) as Location;
  const gameState = getGameState(charId);
  const sessionData = gameState?.sessionData;
  const combatData = gameState?.combatData;

  // Get enemies and combat info
  const enemies = getEnemies(charId);
  const playerState = getPlayerState(charId);
  const droppedItems = getDroppedItems(charId);

  // Get storage
  const storage = getStorage();

  return {
    character: toCliCharacter(char),
    location,
    inventory: allItems,
    equipment,
    meseta: char.meseta ?? 0,
    inventorySlots: inv.length,
    maxInventorySlots: MAX_INVENTORY_SLOTS,
    inCombat: enemies.length > 0,
    enemies: enemies.map(e => ({
      id: e.id,
      name: e.name,
      hp: e.stats.hp,
      maxHp: e.stats.maxHp,
    })),
    playerCombat: playerState ? {
      hp: playerState.hp,
      maxHp: playerState.maxHp,
      tp: playerState.tp,
      maxTp: playerState.maxTp,
    } : undefined,
    stageIndex: sessionData?.currentStage,
    isAtFinalStage: sessionData ? sessionData.currentStage >= sessionData.totalStages - 1 : false,
    droppedItems: droppedItems.map(d => ({
      dropId: d.id,
      type: d.type,
      itemId: d.type === 'item' ? d.itemId : undefined,
      name: d.type === 'item' ? (d.itemData ? JSON.parse(d.itemData).name : d.itemId) : `${d.meseta} Meseta`,
      meseta: d.type === 'meseta' ? d.meseta : undefined,
    })),
    currentStage: sessionData ? {
      stageId: `${sessionData.areaId}_${sessionData.currentStage}`,
      variant: 'a' as const,
      areaId: sessionData.areaId,
      areaName: sessionData.areaId.charAt(0).toUpperCase() + sessionData.areaId.slice(1),
      variantName: 'A',
    } : undefined,
    currentWave: sessionData?.currentWave,
    totalWaves: sessionData?.totalWaves,
    sessionType: sessionData?.type ?? null,
    storage: {
      items: storage.items.map(s => ({
        id: s.item_id,
        name: s.item.name,
        quantity: s.quantity,
      })),
      meseta: storage.meseta,
    },
    pendingMission: gameState?.pendingMission ?? null,
    suspendedSession: gameState?.sessionData?.suspended ? {
      type: gameState.sessionData.type,
      areaId: gameState.sessionData.areaId,
      currentStage: gameState.sessionData.currentStage,
      currentWave: gameState.sessionData.currentWave,
      totalWaves: gameState.sessionData.totalWaves,
    } : null,
  };
}

/**
 * Get available commands based on current state
 */
export function getAvailableCommands(): AvailableCommand[] {
  const commands: AvailableCommand[] = [];
  const charId = getCurrentCharacterId();
  const location = charId ? getLocation(charId) : null;

  // Always available
  commands.push({
    name: 'help',
    description: 'Show available commands',
    usage: 'help',
    args: [],
  });

  // Character management
  if (!charId) {
    commands.push({
      name: 'list-classes',
      description: 'List available character classes',
      usage: 'list-classes',
      args: [],
    });
    commands.push({
      name: 'create-character',
      description: 'Create a new character',
      usage: 'create-character <class-id> <name>',
      args: [
        { name: 'class-id', type: 'string', required: true, description: 'Character class ID' },
        { name: 'name', type: 'string', required: true, description: 'Character name' },
      ],
    });
    commands.push({
      name: 'load-character',
      description: 'Load an existing character',
      usage: 'load-character <slot>',
      args: [
        { name: 'slot', type: 'number', required: true, description: 'Character slot (0-3)' },
      ],
    });
    commands.push({
      name: 'list-characters',
      description: 'List all character slots',
      usage: 'list-characters',
      args: [],
    });
  } else {
    // Navigation
    if (location !== 'field') {
      commands.push({
        name: 'goto',
        description: 'Go to a location',
        usage: 'goto <location>',
        args: [
          { name: 'location', type: 'string', required: true, description: 'city, shop, weapon-shop, guild, teleporter, storage' },
        ],
      });
    }

    // Shop commands
    if (location === 'shop') {
      commands.push({
        name: 'list-items',
        description: 'List items for sale',
        usage: 'list-items',
        args: [],
      });
      commands.push({
        name: 'buy',
        description: 'Buy an item',
        usage: 'buy <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID to buy' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity to buy' },
        ],
      });
    }

    if (location === 'weapon-shop') {
      commands.push({
        name: 'list-items',
        description: 'List equipment for sale',
        usage: 'list-items',
        args: [],
      });
      commands.push({
        name: 'buy-equipment',
        description: 'Buy equipment',
        usage: 'buy-equipment <item-id>',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Equipment ID to buy' },
        ],
      });
    }

    // Inventory commands (always available)
    commands.push({
      name: 'show-inventory',
      description: 'Show inventory',
      usage: 'show-inventory',
      args: [],
    });
    commands.push({
      name: 'show-equipment',
      description: 'Show equipped items',
      usage: 'show-equipment',
      args: [],
    });
    commands.push({
      name: 'equip',
      description: 'Equip an item',
      usage: 'equip <item-id>',
      args: [
        { name: 'item-id', type: 'string', required: true, description: 'Item ID to equip' },
      ],
    });
    commands.push({
      name: 'unequip',
      description: 'Unequip an item',
      usage: 'unequip <slot>',
      args: [
        { name: 'slot', type: 'string', required: true, description: 'weapon, frame, or unit1-4' },
      ],
    });
    commands.push({
      name: 'use',
      description: 'Use a consumable item',
      usage: 'use <item-id>',
      args: [
        { name: 'item-id', type: 'string', required: true, description: 'Item ID to use' },
      ],
    });

    // Guild/mission commands
    if (location === 'guild') {
      // Check for pending mission first (completed, needs reporting)
      const pending = getPendingMission(charId);
      // Check for suspended mission (telepipe'd out, can resume)
      const suspended = getSuspendedSession(charId);

      if (pending) {
        commands.push({
          name: 'report-mission',
          description: 'Report completed mission and claim rewards',
          usage: 'report-mission',
          args: [],
        });
      } else if (suspended) {
        commands.push({
          name: 'resume-mission',
          description: `Resume suspended ${suspended.type} (Stage ${suspended.currentStage + 1})`,
          usage: 'resume-mission',
          args: [],
        });
        // Can also abandon
        commands.push({
          name: 'abandon-mission',
          description: 'Abandon the suspended mission',
          usage: 'abandon-mission',
          args: [],
        });
      } else {
        commands.push({
          name: 'list-missions',
          description: 'List available missions',
          usage: 'list-missions',
          args: [],
        });
        commands.push({
          name: 'start-mission',
          description: 'Start a mission',
          usage: 'start-mission <mission-id> <difficulty>',
          args: [
            { name: 'mission-id', type: 'string', required: true, description: 'Mission ID' },
            { name: 'difficulty', type: 'string', required: true, description: 'normal, hard, or super' },
          ],
        });
      }
    }

    // Teleporter commands
    if (location === 'teleporter') {
      commands.push({
        name: 'enter-field',
        description: 'Enter a field area',
        usage: 'enter-field <area-id> <difficulty>',
        args: [
          { name: 'area-id', type: 'string', required: true, description: 'Field area ID' },
          { name: 'difficulty', type: 'string', required: true, description: 'normal, hard, or super' },
        ],
      });
    }

    // Field/combat commands
    if (location === 'field') {
      const enemies = getEnemies(charId);
      const droppedItems = getDroppedItems(charId);

      if (enemies.length > 0) {
        commands.push({
          name: 'attack',
          description: 'Attack an enemy',
          usage: 'attack <target>',
          args: [
            { name: 'target', type: 'number', required: true, description: 'Enemy index (0-based)' },
          ],
        });
      }

      if (droppedItems.length > 0) {
        commands.push({
          name: 'pickup',
          description: 'Pick up a dropped item',
          usage: 'pickup <drop-id>',
          args: [
            { name: 'drop-id', type: 'number', required: true, description: 'Drop ID' },
          ],
        });
        commands.push({
          name: 'pickup-all',
          description: 'Pick up all dropped items',
          usage: 'pickup-all',
          args: [],
        });
      }

      commands.push({
        name: 'next-wave',
        description: 'Spawn next wave of enemies',
        usage: 'next-wave',
        args: [],
      });
      commands.push({
        name: 'next-stage',
        description: 'Advance to next stage',
        usage: 'next-stage',
        args: [],
      });
      commands.push({
        name: 'return',
        description: 'Return to city',
        usage: 'return',
        args: [],
      });
    }

    // Storage commands
    if (location === 'storage') {
      commands.push({
        name: 'show-storage',
        description: 'Show storage contents',
        usage: 'show-storage',
        args: [],
      });
      commands.push({
        name: 'deposit',
        description: 'Deposit an item',
        usage: 'deposit <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID to deposit' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity to deposit' },
        ],
      });
      commands.push({
        name: 'withdraw',
        description: 'Withdraw an item',
        usage: 'withdraw <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID to withdraw' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity to withdraw' },
        ],
      });
      commands.push({
        name: 'deposit-meseta',
        description: 'Deposit meseta',
        usage: 'deposit-meseta <amount>',
        args: [
          { name: 'amount', type: 'number', required: true, description: 'Amount to deposit' },
        ],
      });
      commands.push({
        name: 'withdraw-meseta',
        description: 'Withdraw meseta',
        usage: 'withdraw-meseta <amount>',
        args: [
          { name: 'amount', type: 'number', required: true, description: 'Amount to withdraw' },
        ],
      });
    }

    // Show stats
    commands.push({
      name: 'show-stats',
      description: 'Show character stats',
      usage: 'show-stats',
      args: [],
    });
  }

  return commands;
}

// ============================================================================
// Command Handlers
// ============================================================================

function executeHelp(): CommandResult {
  const commands = getAvailableCommands();
  const lines = commands.map(c => `  ${c.name.padEnd(20)} - ${c.description}`);
  return {
    success: true,
    message: 'Available commands:\n' + lines.join('\n'),
  };
}

function executeListClasses(): CommandResult {
  const classes = VALID_CLASS_IDS.map(id => `  ${id}`);
  return {
    success: true,
    message: 'Available classes:\n' + classes.join('\n'),
  };
}

function executeCreateCharacter(classId: string, name: string): CommandResult {
  if (!classId || !name) {
    return { success: false, message: 'Usage: create-character <class-id> <name>' };
  }

  // Find first available slot
  const chars = getAllCharacters();
  let slot = -1;
  for (let i = 0; i < 4; i++) {
    if (!chars[i]) {
      slot = i;
      break;
    }
  }

  if (slot === -1) {
    return { success: false, message: 'No available character slots.' };
  }

  const result = dbCreateCharacter(slot, classId.toUpperCase(), name);
  if (!result.success) {
    return result;
  }

  currentSlot = slot;
  return {
    success: true,
    message: `Created ${result.data?.name} the ${result.data?.class_id}! (Slot ${slot})`,
  };
}

function executeListCharacters(): CommandResult {
  const chars = getAllCharacters();
  const lines: string[] = [];

  for (let i = 0; i < 4; i++) {
    const char = chars[i];
    if (char) {
      lines.push(`  Slot ${i}: ${char.name} (Lv.${char.level} ${char.class_id})`);
    } else {
      lines.push(`  Slot ${i}: -- Empty --`);
    }
  }

  return {
    success: true,
    message: 'Character Slots:\n' + lines.join('\n'),
  };
}

function executeLoadCharacter(slotStr: string): CommandResult {
  const slot = parseInt(slotStr);
  if (isNaN(slot) || slot < 0 || slot > 3) {
    return { success: false, message: 'Slot must be 0-3.' };
  }

  const char = getCharacterBySlot(slot);
  if (!char) {
    return { success: false, message: `No character in slot ${slot}.` };
  }

  currentSlot = slot;
  return {
    success: true,
    message: `Loaded ${char.name} (Lv.${char.level} ${char.class_id})`,
  };
}

function executeShowStats(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const char = getCharacter(charId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  // Get class-based stats from content loader
  const classStats = getClassStatsAtLevel(char.class_id, char.level);

  // Get equipment for bonus stats
  const equipment = getEquipment(charId);
  let weaponAtk = 0;
  let armorDef = 0;
  let armorEva = 0;

  if (equipment?.weapon) {
    weaponAtk = (equipment.weapon as WeaponItem).attack ?? 0;
  }
  if (equipment?.frame) {
    armorDef = (equipment.frame as ArmorItem).defense ?? 0;
    armorEva = (equipment.frame as ArmorItem).evasion ?? 0;
  }

  // Get material bonuses
  const matBonuses = getMaterialBonuses(charId);

  // Get set bonus
  const setBonus = getActiveSetBonus(charId);
  let setAtk = 0, setDef = 0, setAcc = 0, setEva = 0, setMst = 0;
  if (setBonus) {
    setAtk = setBonus.bonuses.attack;
    setDef = setBonus.bonuses.defense;
    setAcc = setBonus.bonuses.accuracy;
    setEva = setBonus.bonuses.evasion;
    setMst = setBonus.bonuses.mental;
  }

  const hp = (classStats?.hp ?? (100 + char.level * 20)) + matBonuses.hp;
  const tp = (classStats?.pp ?? (50 + char.level * 10)) + matBonuses.pp;
  const atk = (classStats?.attack ?? (15 + char.level * 3)) + weaponAtk + matBonuses.attack + setAtk;
  const def = (classStats?.defense ?? (10 + char.level * 2)) + armorDef + matBonuses.defense + setDef;
  const acc = (classStats?.accuracy ?? (100 + char.level * 2)) + matBonuses.accuracy + setAcc;
  const eva = (classStats?.evasion ?? (50 + char.level)) + armorEva + matBonuses.evasion + setEva;
  const mst = (classStats?.technique ?? (10 + char.level)) + matBonuses.technique + setMst;

  const lines = [
    `Name: ${char.name}`,
    `Class: ${char.class_id}`,
    `Level: ${char.level}`,
    `EXP: ${char.experience}`,
    `Meseta: ${char.meseta}`,
    `HP: ${hp} | TP: ${tp}`,
    `ATK: ${atk} | DEF: ${def}`,
    `ACC: ${acc} | EVA: ${eva}`,
    `MST: ${mst}`,
  ];

  if (setBonus) {
    lines.push(`[Set Bonus: ${setBonus.armor}]`);
  }

  return {
    success: true,
    message: lines.join('\n'),
  };
}

function executeGoto(location: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = dbGoto(charId, location);
  return result;
}

function executeListItems(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const location = getLocation(charId);

  if (location === 'shop') {
    const items = getItemShopInventory();
    const lines = items.map(i => `  ${i.id.padEnd(15)} ${i.name.padEnd(20)} ${i.price} meseta`);
    return {
      success: true,
      message: 'Item Shop:\n' + lines.join('\n'),
    };
  }

  if (location === 'weapon-shop') {
    const items = getWeaponShopInventory();
    const lines = items.map(i => `  ${i.id.padEnd(15)} ${i.name.padEnd(20)} ${i.price} meseta`);
    return {
      success: true,
      message: 'Weapon Shop:\n' + lines.join('\n'),
    };
  }

  return { success: false, message: 'Must be at a shop.' };
}

function executeBuy(itemId: string, quantity: number): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return buyItem(charId, itemId, quantity);
}

function executeBuyEquipment(itemId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return buyEquipment(charId, itemId);
}

function executeSell(itemId: string, quantity: number): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return sellItem(charId, itemId, quantity);
}

function executeShowInventory(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const inv = getInventory(charId);
  const equip = getEquipment(charId);

  const lines: string[] = [];

  // Count equipped items
  let equippedCount = 0;
  if (equip.weapon) {
    lines.push(`  ${equip.weapon.id.padEnd(15)} ${equip.weapon.name} [E]`);
    equippedCount++;
  }
  if (equip.frame) {
    lines.push(`  ${equip.frame.id.padEnd(15)} ${equip.frame.name} [E]`);
    equippedCount++;
  }
  if (equip.unit1) {
    lines.push(`  ${equip.unit1.id.padEnd(15)} ${equip.unit1.name} [E]`);
    equippedCount++;
  }
  if (equip.unit2) {
    lines.push(`  ${equip.unit2.id.padEnd(15)} ${equip.unit2.name} [E]`);
    equippedCount++;
  }
  if (equip.unit3) {
    lines.push(`  ${equip.unit3.id.padEnd(15)} ${equip.unit3.name} [E]`);
    equippedCount++;
  }
  if (equip.unit4) {
    lines.push(`  ${equip.unit4.id.padEnd(15)} ${equip.unit4.name} [E]`);
    equippedCount++;
  }

  // Add unequipped items
  for (const slot of inv) {
    const qty = slot.quantity > 1 ? ` x${slot.quantity}` : '';
    lines.push(`  ${slot.item.id.padEnd(15)} ${slot.item.name}${qty}`);
  }

  const totalSlots = equippedCount + inv.length;

  if (totalSlots === 0) {
    return { success: true, message: 'Inventory is empty.' };
  }

  return {
    success: true,
    message: `Inventory (${totalSlots}/${MAX_INVENTORY_SLOTS}):\n` + lines.join('\n'),
  };
}

function executeShowEquipment(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const equip = getEquipment(charId);

  const lines = [
    `Weapon: ${equip.weapon?.name ?? '(none)'}`,
    `Frame:  ${equip.frame?.name ?? '(none)'}`,
    `Unit 1: ${equip.unit1?.name ?? '(none)'}`,
    `Unit 2: ${equip.unit2?.name ?? '(none)'}`,
    `Unit 3: ${equip.unit3?.name ?? '(none)'}`,
    `Unit 4: ${equip.unit4?.name ?? '(none)'}`,
  ];

  return {
    success: true,
    message: 'Equipment:\n' + lines.join('\n'),
  };
}

function executeEquip(itemId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const char = getCharacter(charId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const item = getItem(charId, itemId);
  if (!item) {
    return { success: false, message: 'Item not in inventory.' };
  }

  const itemType = item.item.type;

  if (itemType === 'weapon') {
    // Check weapon restriction
    const weapon = item.item as WeaponItem;
    const weaponType = weapon.weaponType?.toLowerCase() ?? 'saber';
    if (!canClassUseWeaponType(char.class_id, weaponType)) {
      return { success: false, message: `${char.class_id} cannot equip ${weaponType} weapons.` };
    }
    return equipWeapon(charId, itemId);
  } else if (itemType === 'armor') {
    return equipFrame(charId, itemId);
  } else if (itemType === 'unit') {
    return equipUnit(charId, itemId);
  }

  return { success: false, message: 'Cannot equip this item type.' };
}

function executeUnequip(slot: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  if (slot === 'weapon') {
    return unequipWeapon(charId);
  } else if (slot === 'frame') {
    return unequipFrame(charId);
  } else if (slot.startsWith('unit')) {
    const slotNum = parseInt(slot.replace('unit', ''));
    if (slotNum >= 1 && slotNum <= 4) {
      return unequipUnit(charId, slotNum - 1);
    }
  }

  return { success: false, message: 'Invalid slot. Use: weapon, frame, unit1, unit2, unit3, unit4' };
}

function executeUseItem(itemId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  // Special handling for telepipe - check if in field first
  if (itemId === 'telepipe') {
    const location = getLocation(charId);
    if (location !== 'field') {
      return { success: false, message: 'Telepipe can only be used in the field.' };
    }

    // Consume the telepipe
    const consumeResult = useConsumable(charId, itemId);
    if (!consumeResult.success) {
      return consumeResult;
    }

    // Suspend the session and return to city
    const suspendResult = suspendSession(charId);
    return suspendResult;
  }

  const result = useConsumable(charId, itemId);
  if (!result.success || !result.data) {
    return result;
  }

  // Apply the effect
  const { effect, value } = result.data;
  if (effect === 'heal' || effect === 'heal_hp') {
    const healResult = healPlayer(charId, value);
    return { success: true, message: `${result.message} ${healResult.message}` };
  } else if (effect === 'restore_tp' || effect === 'restore') {
    const tpResult = restoreTP(charId, value);
    return { success: true, message: `${result.message} ${tpResult.message}` };
  }

  return result;
}

function executeListMissions(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const location = getLocation(charId);
  if (location !== 'guild') {
    return { success: false, message: 'Must be at guild to view missions.' };
  }

  // Check for pending mission
  const pending = getPendingMission(charId);
  if (pending) {
    return {
      success: true,
      message: `You have a completed mission to report!\nUse 'report-mission' to claim your rewards.`,
    };
  }

  const missions = getAllMissions();
  const lines = missions.map(m => `  ${m.id.padEnd(20)} ${m.name}`);
  return {
    success: true,
    message: 'Available Missions:\n' + lines.join('\n'),
  };
}

function executeReportMission(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const location = getLocation(charId);
  if (location !== 'guild') {
    return { success: false, message: 'Must be at guild to report mission.' };
  }

  const pending = getPendingMission(charId);
  if (!pending) {
    return { success: false, message: 'No mission to report.' };
  }

  // Award rewards
  const char = getCharacter(charId);
  if (char) {
    dbAddExperience(charId, pending.expReward);
    dbUpdateMeseta(charId, char.meseta + pending.mesetaReward);
  }

  // Clear pending mission
  setPendingMission(charId, null);

  const lines = [
    `Mission "${pending.missionId}" reported!`,
    `Grade: ${pending.grade}`,
    `EXP: +${pending.expReward}`,
    `Meseta: +${pending.mesetaReward}`,
  ];

  return {
    success: true,
    message: lines.join('\n'),
  };
}

function executeResumeMission(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const location = getLocation(charId);
  if (location !== 'guild') {
    return { success: false, message: 'Must be at guild to resume mission.' };
  }

  const suspended = getSuspendedSession(charId);
  if (!suspended) {
    return { success: false, message: 'No suspended mission to resume.' };
  }

  // Resume returns to field with saved state
  const result = resumeSession(charId);
  if (result.success) {
    // Respawn enemies for current wave if needed
    const enemies = getEnemies(charId);
    if (enemies.length === 0) {
      spawnEnemies(charId, suspended.areaId, suspended.difficulty as Difficulty, Date.now());
    }
  }

  return result;
}

function executeAbandonMission(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const suspended = getSuspendedSession(charId);
  if (!suspended) {
    return { success: false, message: 'No suspended mission to abandon.' };
  }

  // Clear the session data
  setSessionData(charId, null);
  clearCombat(charId);

  return { success: true, message: `Abandoned ${suspended.type}: ${suspended.areaId}` };
}

function executeStartMission(missionId: string, difficulty: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = enterMission(charId, missionId, difficulty);
  if (result.success) {
    // Initialize combat state and spawn first wave
    initCombat(charId);
    const spawnResult = spawnEnemies(charId, missionId, difficulty as Difficulty, Date.now());
    return {
      success: true,
      message: `${result.message}\n${spawnResult.message}`,
    };
  }
  return result;
}

function executeEnterField(areaId: string, difficulty: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = enterField(charId, areaId, difficulty);
  if (result.success) {
    // Initialize combat state and spawn first wave
    initCombat(charId);
    const spawnResult = spawnEnemies(charId, areaId, difficulty as Difficulty, Date.now());
    return {
      success: true,
      message: `${result.message}\n${spawnResult.message}`,
    };
  }
  return result;
}

function executeNextWave(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const gameState = getGameState(charId);
  if (!gameState?.sessionData) {
    return { success: false, message: 'Not in a mission or field.' };
  }

  const session = gameState.sessionData;

  // Check if current wave is cleared
  if (!isWaveCleared(charId)) {
    return { success: false, message: 'Defeat all enemies first.' };
  }

  // Check if all waves in this stage are done
  if (session.currentWave >= session.totalWaves) {
    return {
      success: false,
      message: `Stage ${session.currentStage + 1} complete! Use 'next-stage' to advance.`
    };
  }

  // Increment wave and spawn enemies
  session.currentWave++;
  setSessionData(charId, session);

  const difficulty = session.difficulty as Difficulty;
  const result = spawnEnemies(charId, session.areaId, difficulty, Date.now());

  return {
    success: true,
    message: `Wave ${session.currentWave}/${session.totalWaves}: ${result.message}`,
  };
}

function executeNextStage(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const gameState = getGameState(charId);
  if (!gameState?.sessionData) {
    return { success: false, message: 'Not in a mission or field.' };
  }

  const session = gameState.sessionData;

  // Check if all waves in current stage are cleared
  if (!isWaveCleared(charId)) {
    return { success: false, message: 'Defeat all enemies first.' };
  }

  if (session.currentWave < session.totalWaves) {
    return { success: false, message: `Complete all waves first (${session.currentWave}/${session.totalWaves}).` };
  }

  // Check if this is the final stage
  if (session.currentStage >= session.totalStages - 1) {
    // Mission/field complete!
    if (session.type === 'mission') {
      // Calculate rewards based on difficulty
      const diffMultiplier = session.difficulty === 'normal' ? 1 : session.difficulty === 'hard' ? 1.5 : 2;
      const baseExp = 500;
      const baseMeseta = 1000;

      const expReward = Math.floor(baseExp * diffMultiplier);
      const mesetaReward = Math.floor(baseMeseta * diffMultiplier);

      // Store pending mission for reporting
      setPendingMission(charId, {
        missionId: session.areaId,
        difficulty: session.difficulty,
        completed: true,
        expReward,
        mesetaReward,
        grade: 'A',
      });

      returnToCity(charId);
      return {
        success: true,
        message: `Mission complete! Return to the Guild to report and claim your rewards.`,
      };
    } else {
      // Field complete - just return to city
      returnToCity(charId);
      return {
        success: true,
        message: `Field exploration complete! Returned to city.`,
      };
    }
  }

  // Advance to next stage
  const result = nextStage(charId);
  if (!result.success) {
    return result;
  }

  // Spawn first wave of new stage
  const difficulty = session.difficulty as Difficulty;
  const spawnResult = spawnEnemies(charId, session.areaId, difficulty, Date.now());

  return {
    success: true,
    message: `Advanced to Stage ${session.currentStage + 2}!\n${spawnResult.message}`,
  };
}

function executeReturn(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const gameState = getGameState(charId);
  const session = gameState?.sessionData;

  if (!session) {
    return { success: false, message: 'Not in a field or mission.' };
  }

  // Check if mission is completed (all stages and waves done)
  if (session.type === 'mission') {
    const isFinalStage = session.currentStage >= session.totalStages - 1;
    const allWavesCleared = session.currentWave >= session.totalWaves && isWaveCleared(charId);

    if (isFinalStage && allWavesCleared) {
      // Calculate rewards based on difficulty
      const diffMultiplier = session.difficulty === 'normal' ? 1 : session.difficulty === 'hard' ? 1.5 : 2;
      const baseExp = 500;
      const baseMeseta = 1000;

      const expReward = Math.floor(baseExp * diffMultiplier);
      const mesetaReward = Math.floor(baseMeseta * diffMultiplier);

      // Store pending mission for reporting
      setPendingMission(charId, {
        missionId: session.areaId,
        difficulty: session.difficulty,
        completed: true,
        expReward,
        mesetaReward,
        grade: 'A', // TODO: Calculate based on time/performance
      });

      returnToCity(charId);
      return {
        success: true,
        message: `Mission complete! Return to the Guild to report and claim your rewards.`,
      };
    }

    // Mission not complete - can't just return, need telepipe
    return {
      success: false,
      message: 'Cannot abandon mission in progress. Use a Telepipe to return to city.',
    };
  }

  // Field (not mission) - can return freely
  returnToCity(charId);
  return { success: true, message: 'Returned to city.' };
}

function executeAttack(targetStr: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const targetIndex = parseInt(targetStr);
  if (isNaN(targetIndex)) {
    return { success: false, message: 'Target must be a number.' };
  }

  const result = dbAttack(charId, targetIndex);

  // Check if player was defeated
  if (result.data?.playerDefeated) {
    // Lose half meseta
    const char = getCharacter(charId);
    if (char) {
      const mesetaLost = Math.floor(char.meseta / 2);
      dbUpdateMeseta(charId, char.meseta - mesetaLost);

      // Clear mission/combat and return to city
      returnToCity(charId);
      clearCombat(charId);

      return {
        success: false,
        message: `${result.message}\n\nYou lost ${mesetaLost} meseta. Returned to city.`,
      };
    }
  }

  return result;
}

function executePickup(dropIdStr: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const dropId = parseInt(dropIdStr);
  if (isNaN(dropId)) {
    return { success: false, message: 'Drop ID must be a number.' };
  }

  return pickupItem(charId, dropId);
}

function executePickupAll(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return pickupAll(charId);
}

function executeShowStorage(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const storage = getStorage();

  const lines = [`Meseta: ${storage.meseta}`];

  if (storage.items.length === 0) {
    lines.push('Items: (empty)');
  } else {
    lines.push('Items:');
    for (const storageItem of storage.items) {
      const qty = storageItem.quantity > 1 ? ` x${storageItem.quantity}` : '';
      lines.push(`  ${storageItem.item_id.padEnd(15)} ${storageItem.item.name}${qty}`);
    }
  }

  return {
    success: true,
    message: 'Storage:\n' + lines.join('\n'),
  };
}

function executeDeposit(itemId: string, quantity: number): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return depositItem(charId, itemId, quantity);
}

function executeWithdraw(itemId: string, quantity: number): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return withdrawItem(charId, itemId, quantity);
}

function executeDepositMeseta(amountStr: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: 'Amount must be a positive number.' };
  }

  return depositMeseta(charId, amount);
}

function executeWithdrawMeseta(amountStr: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: 'Amount must be a positive number.' };
  }

  return withdrawMeseta(charId, amount);
}

// ============================================================================
// Main Command Dispatcher
// ============================================================================

/**
 * Execute a command
 */
export function execute(commandLine: string): CommandResult {
  const trimmed = commandLine.trim();

  // Ignore comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) {
    return { success: true, message: '' };
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return executeHelp();

    case 'list-classes':
      return executeListClasses();

    case 'create-character':
      return executeCreateCharacter(args[0], args.slice(1).join(' '));

    case 'load-character':
      return executeLoadCharacter(args[0]);

    case 'list-characters':
      return executeListCharacters();

    case 'show-stats':
      return executeShowStats();

    case 'goto':
      if (!args[0]) {
        return { success: false, message: 'Usage: goto <location>' };
      }
      return executeGoto(args[0].toLowerCase());

    case 'list-items':
      return executeListItems();

    case 'buy':
      if (!args[0]) {
        return { success: false, message: 'Usage: buy <item-id> [quantity]' };
      }
      return executeBuy(args[0], args[1] ? parseInt(args[1]) : 1);

    case 'buy-equipment':
      if (!args[0]) {
        return { success: false, message: 'Usage: buy-equipment <item-id>' };
      }
      return executeBuyEquipment(args[0]);

    case 'sell':
      if (!args[0]) {
        return { success: false, message: 'Usage: sell <item-id> [quantity]' };
      }
      return executeSell(args[0], args[1] ? parseInt(args[1]) : 1);

    case 'show-inventory':
      return executeShowInventory();

    case 'show-equipment':
      return executeShowEquipment();

    case 'equip':
      if (!args[0]) {
        return { success: false, message: 'Usage: equip <item-id>' };
      }
      return executeEquip(args[0]);

    case 'unequip':
      if (!args[0]) {
        return { success: false, message: 'Usage: unequip <slot>' };
      }
      return executeUnequip(args[0].toLowerCase());

    case 'use':
      if (!args[0]) {
        return { success: false, message: 'Usage: use <item-id>' };
      }
      return executeUseItem(args[0]);

    case 'list-missions':
      return executeListMissions();

    case 'report-mission':
      return executeReportMission();

    case 'resume-mission':
      return executeResumeMission();

    case 'abandon-mission':
      return executeAbandonMission();

    case 'start-mission':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: start-mission <mission-id> <difficulty>' };
      }
      return executeStartMission(args[0], args[1].toLowerCase());

    case 'enter-field':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: enter-field <area-id> <difficulty>' };
      }
      return executeEnterField(args[0], args[1].toLowerCase());

    case 'next-wave':
      return executeNextWave();

    case 'next-stage':
      return executeNextStage();

    case 'return':
      return executeReturn();

    case 'attack':
      if (!args[0]) {
        return { success: false, message: 'Usage: attack <target-index>' };
      }
      return executeAttack(args[0]);

    case 'pickup':
      if (!args[0]) {
        return { success: false, message: 'Usage: pickup <drop-id>' };
      }
      return executePickup(args[0]);

    case 'pickup-all':
      return executePickupAll();

    case 'show-storage':
      return executeShowStorage();

    case 'deposit':
      if (!args[0]) {
        return { success: false, message: 'Usage: deposit <item-id> [quantity]' };
      }
      return executeDeposit(args[0], args[1] ? parseInt(args[1]) : 1);

    case 'withdraw':
      if (!args[0]) {
        return { success: false, message: 'Usage: withdraw <item-id> [quantity]' };
      }
      return executeWithdraw(args[0], args[1] ? parseInt(args[1]) : 1);

    case 'deposit-meseta':
      if (!args[0]) {
        return { success: false, message: 'Usage: deposit-meseta <amount>' };
      }
      return executeDepositMeseta(args[0]);

    case 'withdraw-meseta':
      if (!args[0]) {
        return { success: false, message: 'Usage: withdraw-meseta <amount>' };
      }
      return executeWithdrawMeseta(args[0]);

    // Progression commands
    case 'use-material':
      if (!args[0]) {
        return { success: false, message: 'Usage: use-material <material-id>' };
      }
      return executeUseMaterial(args[0]);

    case 'show-bonuses':
      return executeShowBonuses();

    case 'show-set-bonus':
      return executeShowSetBonus();

    case 'grind':
      if (!args[0]) {
        return { success: false, message: 'Usage: grind <weapon-id>' };
      }
      return executeGrind(args[0]);

    case 'grind-info':
      if (!args[0]) {
        return { success: false, message: 'Usage: grind-info <weapon-id>' };
      }
      return executeGrindInfo(args[0]);

    case 'weapon-types':
      return executeWeaponTypes();

    // Skills commands
    case 'list-techniques':
      return executeListTechniques();

    case 'list-photon-arts':
      return executeListPhotonArts();

    case 'my-techniques':
      return executeMyTechniques();

    case 'learn-technique':
      if (!args[0]) {
        return { success: false, message: 'Usage: learn-technique <technique-id>' };
      }
      return executeLearnTechnique(args[0]);

    case 'cast':
      if (!args[0]) {
        return { success: false, message: 'Usage: cast <technique-id> [target]' };
      }
      return executeCast(args[0], args[1] ? parseInt(args[1]) : undefined);

    case 'photon-art':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: photon-art <art-id> <target>' };
      }
      return executePhotonArt(args[0], parseInt(args[1]));

    case 'available-arts':
      return executeAvailableArts();

    default:
      return { success: false, message: `Unknown command: ${command}. Type 'help' for available commands.` };
  }
}

// ============================================================================
// PROGRESSION COMMANDS
// ============================================================================

function executeUseMaterial(materialId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return useMaterial(charId, materialId);
}

function executeShowBonuses(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const char = getCharacter(charId);
  if (!char) {
    return { success: false, message: 'Character not found.' };
  }

  const bonuses = getMaterialBonuses(charId);
  const limit = getMaterialLimit(char.class_id);

  const lines = [
    `Material Bonuses (${bonuses.materialsUsed}/${limit} used):`,
    `  ATK: +${bonuses.attack}`,
    `  DEF: +${bonuses.defense}`,
    `  ACC: +${bonuses.accuracy}`,
    `  EVA: +${bonuses.evasion}`,
    `  HP:  +${bonuses.hp}`,
    `  PP:  +${bonuses.pp}`,
    `  MST: +${bonuses.technique}`,
  ];

  return { success: true, message: lines.join('\n') };
}

function executeShowSetBonus(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = getSetBonusInfo(charId);
  if (!result.success) {
    return result;
  }

  const data = result.data!;
  if (data.active && data.bonuses) {
    const lines = [
      `Set Bonus Active: ${data.armorName} + ${data.weaponName}`,
      `  ATK: +${data.bonuses.attack}`,
      `  DEF: +${data.bonuses.defense}`,
      `  ACC: +${data.bonuses.accuracy}`,
      `  EVA: +${data.bonuses.evasion}`,
      `  MST: +${data.bonuses.mental}`,
    ];
    return { success: true, message: lines.join('\n') };
  } else if (data.matchingWeapons) {
    return {
      success: true,
      message: `${data.armorName} can form a set with:\n  ${data.matchingWeapons.join('\n  ')}`,
    };
  }

  return { success: true, message: 'No set bonus available for current equipment.' };
}

function executeGrind(weaponId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const location = getLocation(charId);
  if (location !== 'weapon-shop') {
    return { success: false, message: 'Must be at weapon shop to grind weapons.' };
  }

  return grindWeapon(charId, weaponId);
}

function executeGrindInfo(weaponId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return getGrindInfo(charId, weaponId);
}

function executeWeaponTypes(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = getEquippableWeaponTypes(charId);
  if (!result.success) {
    return result;
  }

  const types = result.data!;
  return {
    success: true,
    message: `Usable weapon types:\n  ${types.join(', ')}`,
  };
}

// ============================================================================
// SKILLS COMMANDS
// ============================================================================

function executeListTechniques(): CommandResult {
  const result = listAllTechniques();
  if (!result.success || !result.data) {
    return result;
  }

  const lines = result.data.map(t =>
    `  ${t.id.padEnd(12)} ${t.name.padEnd(10)} (${t.element}) - ${t.type}, ${t.ppCost} PP`
  );

  return {
    success: true,
    message: `Available Techniques:\n${lines.join('\n')}`,
  };
}

function executeListPhotonArts(): CommandResult {
  const result = listAllPhotonArts();
  if (!result.success || !result.data) {
    return result;
  }

  const lines = result.data.map(a =>
    `  ${a.id.padEnd(15)} ${a.name.padEnd(15)} (${a.weaponType}) - ${a.ppCost} PP`
  );

  return {
    success: true,
    message: `Available Photon Arts:\n${lines.join('\n')}`,
  };
}

function executeMyTechniques(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = getKnownTechniques(charId);
  if (!result.success || !result.data) {
    return result;
  }

  if (result.data.length === 0) {
    return { success: true, message: 'No techniques learned yet.' };
  }

  const lines = result.data.map(t =>
    `  ${t.technique.name} Lv.${t.level} (${t.technique.element})`
  );

  return {
    success: true,
    message: `Known Techniques:\n${lines.join('\n')}`,
  };
}

function executeLearnTechnique(techniqueId: string): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return learnTechnique(charId, techniqueId);
}

function executeCast(techniqueId: string, target?: number): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = castTechnique(charId, techniqueId, target);
  return result;
}

function executePhotonArt(artId: string, target: number): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  return usePhotonArt(charId, artId, target);
}

function executeAvailableArts(): CommandResult {
  const charId = getCurrentCharacterId();
  if (!charId) {
    return { success: false, message: 'No character loaded.' };
  }

  const result = getAvailablePhotonArts(charId);
  if (!result.success || !result.data) {
    return result;
  }

  if (result.data.length === 0) {
    return { success: true, message: 'No photon arts available for your weapon.' };
  }

  const lines = result.data.map(a =>
    `  ${a.id.padEnd(15)} ${a.name} - ${a.ppCost} PP`
  );

  return {
    success: true,
    message: `Available Photon Arts:\n${lines.join('\n')}`,
  };
}

/**
 * Reset game state (for testing)
 */
export function resetState(): void {
  currentSlot = null;
  resetDatabase();
}
