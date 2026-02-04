/**
 * CLI API
 * JSON API mode for AI testing
 */

import type { GameState, CommandResult, AvailableCommand, Location, DetailedItem, EquipmentSlots } from './types';
import type { Character } from '../systems/character/types';
import type { Difficulty } from '../systems/mission/types';
import { VALID_CLASS_IDS } from '../systems/character/types';

// Import item types
import type { WeaponItem, ArmorItem, ConsumableItem, GameItem } from '../systems/inventory/types';

// Game state (in-memory for CLI)
let currentCharacter: Character | null = null;
let currentLocation: Location = 'city';

// Inventory now stores full item details
interface InventoryEntry {
  item: GameItem;
  quantity: number;
}
let inventory: Map<string, InventoryEntry> = new Map();

// Equipment state
interface EquippedItems {
  weapon: WeaponItem | null;
  frame: ArmorItem | null;
}
let equippedItems: EquippedItems = { weapon: null, frame: null };

// Combat state
interface EnemyInstance {
  id: number;
  enemyId: string;
  name: string;
  stats: CombatStats;
  element: Element;
  expValue: number;
  mesetaValue: number;
}

// Player combat state
interface PlayerCombatState {
  hp: number;
  maxHp: number;
  tp: number;
  maxTp: number;
}

let currentEnemies: EnemyInstance[] = [];
let combatLog: string[] = [];
let enemyIdCounter = 0;
let playerCombatState: PlayerCombatState | null = null;

// Wave tracking for stage progression
let currentWave = 0;
let totalWaves = 1;

// Technique definitions
interface Technique {
  id: string;
  name: string;
  tpCost: number;
  type: 'attack' | 'heal' | 'buff';
  element?: 'fire' | 'ice' | 'lightning';
  power: number;  // Base power or heal amount
  description: string;
}

const TECHNIQUES: Record<string, Technique> = {
  foie: { id: 'foie', name: 'Foie', tpCost: 10, type: 'attack', element: 'fire', power: 50, description: 'Fire attack' },
  barta: { id: 'barta', name: 'Barta', tpCost: 10, type: 'attack', element: 'ice', power: 50, description: 'Ice attack' },
  zonde: { id: 'zonde', name: 'Zonde', tpCost: 10, type: 'attack', element: 'lightning', power: 50, description: 'Lightning attack' },
  gifoie: { id: 'gifoie', name: 'Gifoie', tpCost: 20, type: 'attack', element: 'fire', power: 100, description: 'Strong fire attack' },
  gibarta: { id: 'gibarta', name: 'Gibarta', tpCost: 20, type: 'attack', element: 'ice', power: 100, description: 'Strong ice attack' },
  gizonde: { id: 'gizonde', name: 'Gizonde', tpCost: 20, type: 'attack', element: 'lightning', power: 100, description: 'Strong lightning attack' },
  resta: { id: 'resta', name: 'Resta', tpCost: 15, type: 'heal', power: 100, description: 'Restore HP' },
  shifta: { id: 'shifta', name: 'Shifta', tpCost: 10, type: 'buff', power: 20, description: 'Boost attack power' },
  deband: { id: 'deband', name: 'Deband', tpCost: 10, type: 'buff', power: 20, description: 'Boost defense' },
};

// Active buffs
interface ActiveBuff {
  type: 'shifta' | 'deband';
  turnsRemaining: number;
  power: number;
}
let activeBuffs: ActiveBuff[] = [];

// Status effects
interface StatusEffect {
  type: 'poison' | 'paralysis' | 'burn' | 'freeze';
  turnsRemaining: number;
  damagePerTurn?: number;
}

// Player status effects
let playerStatusEffects: StatusEffect[] = [];

// Enemy status effects (by enemy id)
let enemyStatusEffects: Map<number, StatusEffect[]> = new Map();

// Dropped items on the ground (not yet picked up)
interface DroppedItem {
  id: number;
  type: 'item' | 'meseta';
  item?: ConsumableItem;
  meseta?: number;
}
let droppedItems: DroppedItem[] = [];
let droppedItemIdCounter = 0;

// MAG state
import { getLevel as getMagLevel, determineForm, type MagStats } from '../lib/mag-evolution';

interface MagState {
  stats: MagStats;
  sync: number;  // 0-120 sync meter
  iq: number;    // 0-200 IQ
}
let currentMag: MagState | null = null;

// Items that can feed MAGs and their stat effects
const MAG_FEED_EFFECTS: Record<string, { power: number; guard: number; hit: number; mind: number; sync: number }> = {
  monomate: { power: 1, guard: 0, hit: 0, mind: 0, sync: 5 },
  dimate: { power: 2, guard: 0, hit: 0, mind: 0, sync: 10 },
  trimate: { power: 3, guard: 0, hit: 0, mind: 0, sync: 15 },
  monofluid: { power: 0, guard: 0, hit: 0, mind: 1, sync: 5 },
  difluid: { power: 0, guard: 0, hit: 0, mind: 2, sync: 10 },
  trifluid: { power: 0, guard: 0, hit: 0, mind: 3, sync: 15 },
};

// Import systems
import {
  createCharacter,
  validateCharacterName,
  validateClassId,
  generateCharacterId,
} from '../systems/character/character';
import {
  initializeDefaultShops,
  getShopItems,
  purchaseItem,
  removeShopItem,
  SHOP_IDS,
} from '../systems/shop';
import {
  initializeDefaultMissions,
  getAvailableMissions,
  getAllMissions,
  getMission,
  startMission,
  completeMission,
  meetsLevelForDifficulty,
  isMissionUnlocked,
} from '../systems/mission';
import { applyExpGain, getLevelForExp } from '../systems/leveling';
import { getStartingItems, STARTING_MESETA, MONOMATE, MONOFLUID, getStarterWeaponForClass, STARTER_FRAME } from '../systems/inventory/starting-items';
import {
  getSharedStorage,
  getSharedStorageMeseta,
  depositMesetaToStorage,
  withdrawMesetaFromStorage,
  addToSharedStorage,
  removeFromSharedStorage,
  clearSharedStorage,
} from '../systems/inventory/inventory';
import {
  initializeDefaultFields,
  getAllFields,
  getField,
  isFieldUnlocked,
  hasFieldCompleted,
} from '../systems/field';
import {
  setSessionConfig,
  enterField as enterFieldSession,
  enterMission as enterMissionSession,
  getSessionState,
  getCurrentStage,
  isInSession,
  isAtFinalStage,
  hasPendingRewards,
  getPendingResult,
  claimRewards as claimSessionRewards,
  useTelepipe,
  abandonSession,
  resetSession,
  advanceToNextStage,
  completeSession,
} from '../systems/session';

// Combat & Stage Content imports
import { resolveAttack, applyDamage, isDefeated } from '../systems/combat/combat';
import type { CombatStats, WeaponStats, Element } from '../systems/combat/types';
import {
  createSeededRandom,
  getEnemyPool,
  generateEnemyComposition,
  getEnemyCountRange,
  getBossForArea,
} from '../systems/stage';
import { getEnemyDisplayName, getEnemyElement } from '../components/enemies/enemyData';

// Initialize systems
initializeDefaultShops();
initializeDefaultMissions();
initializeDefaultFields();

/**
 * Convert a GameItem to DetailedItem format for the UI
 */
function toDetailedItem(item: GameItem, quantity: number): DetailedItem {
  const detailed: DetailedItem = {
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    rarity: item.rarity,
    quantity,
  };

  if (item.type === 'weapon') {
    const w = item as WeaponItem;
    detailed.attack = w.attack;
    detailed.accuracy = w.accuracy;
    detailed.weaponType = w.weaponType;
    detailed.element = w.element;
    detailed.requiredLevel = w.requiredLevel;
  } else if (item.type === 'armor') {
    const a = item as ArmorItem;
    detailed.defense = a.defense;
    detailed.evasion = a.evasion;
    detailed.armorSlot = a.armorSlot;
    detailed.unitSlots = a.unitSlots;
    detailed.requiredLevel = a.requiredLevel;
  } else if (item.type === 'consumable') {
    const c = item as ConsumableItem;
    detailed.effect = c.effect;
    detailed.effectValue = c.effectValue;
  }

  return detailed;
}

/**
 * Get current game state
 */
export function getState(): GameState {
  // Build equipment slots
  const equipment: EquipmentSlots = {
    weapon: equippedItems.weapon ? toDetailedItem(equippedItems.weapon, 1) : null,
    frame: equippedItems.frame ? toDetailedItem(equippedItems.frame, 1) : null,
    barrier: null,
    unit1: null,
    unit2: null,
    unit3: null,
    unit4: null,
  };

  // Build detailed inventory
  const detailedInventory = Array.from(inventory.values()).map(entry =>
    toDetailedItem(entry.item, entry.quantity)
  );

  // Get session state for stage info
  const session = getSessionState();
  const stage = getCurrentStage();

  // Build current stage info
  const currentStageInfo = stage && 'variant' in stage ? {
    stageId: stage.stageId,
    variant: stage.variant,
    areaId: stage.areaId,
    areaName: formatAreaName(stage.areaId),
    variantName: formatVariantName(stage.variant),
  } : undefined;

  return {
    character: currentCharacter,
    location: currentLocation,
    inventory: detailedInventory,
    equipment,
    meseta: currentCharacter?.meseta ?? 0,
    inventorySlots: getInventorySlotCount(),
    maxInventorySlots: MAX_INVENTORY_SLOTS,
    inCombat: currentEnemies.length > 0,
    enemies: currentEnemies.map(e => ({
      id: e.id,
      name: e.name,
      hp: e.stats.hp,
      maxHp: e.stats.maxHp,
    })),
    playerCombat: playerCombatState ? {
      hp: playerCombatState.hp,
      maxHp: playerCombatState.maxHp,
      tp: playerCombatState.tp,
      maxTp: playerCombatState.maxTp,
    } : undefined,
    stageIndex: session.currentStageIndex,
    isAtFinalStage: isAtFinalStage(),
    droppedItems: droppedItems.map(d => ({
      dropId: d.id,
      type: d.type,
      itemId: d.type === 'item' ? d.item?.id : undefined,
      name: d.type === 'item' ? d.item?.name : `${d.meseta} Meseta`,
      meseta: d.type === 'meseta' ? d.meseta : undefined,
    })),
    currentStage: currentStageInfo,
    currentWave,
    totalWaves,
    sessionType: session.activeType,
  };
}

/**
 * Format area ID into display name
 */
function formatAreaName(areaId: string): string {
  const names: Record<string, string> = {
    'valley': 'Valley',
    'snowfield': 'Snowfield',
    'wetlands': 'Wetlands',
    'makara': 'Makara',
    'paru': 'Paru',
    'shrine': 'Shrine',
    'arca': 'Arca',
    'tower': 'Tower',
    'city': 'City',
  };
  return names[areaId] || areaId.charAt(0).toUpperCase() + areaId.slice(1);
}

/**
 * Format stage variant into display name
 */
function formatVariantName(variant: 'a' | 'e' | 'b' | 'z'): string {
  const names: Record<string, string> = {
    'a': 'A',
    'e': 'E',
    'b': 'B',
    'z': 'Boss',
  };
  return names[variant] || variant.toUpperCase();
}

/**
 * Get available commands based on current state
 */
export function getAvailableCommands(): AvailableCommand[] {
  const commands: AvailableCommand[] = [];

  // Always available
  commands.push({
    name: 'help',
    description: 'Show available commands',
    usage: 'help',
    args: [],
  });

  commands.push({
    name: 'show-stats',
    description: 'Show character stats',
    usage: 'show-stats',
    args: [],
  });

  if (!currentCharacter) {
    // No character - can only create
    commands.push({
      name: 'create-character',
      description: 'Create a new character',
      usage: 'create-character <class> <name>',
      args: [
        { name: 'class', type: 'string', required: true, description: `Class ID (${VALID_CLASS_IDS.slice(0, 3).join(', ')}...)` },
        { name: 'name', type: 'string', required: true, description: 'Character name' },
      ],
    });

    commands.push({
      name: 'list-classes',
      description: 'List available classes',
      usage: 'list-classes',
      args: [],
    });
  } else {
    // Has character - can navigate and act
    commands.push({
      name: 'goto',
      description: 'Go to a location',
      usage: 'goto <location>',
      args: [
        { name: 'location', type: 'string', required: true, description: 'city, shop, missions, inventory' },
      ],
    });

    if (currentLocation === 'shop') {
      commands.push({
        name: 'list-items',
        description: 'List shop items',
        usage: 'list-items',
        args: [],
      });

      commands.push({
        name: 'buy',
        description: 'Buy an item',
        usage: 'buy <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID to buy' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity (default: 1)' },
        ],
      });

      commands.push({
        name: 'sell',
        description: 'Sell an item from inventory',
        usage: 'sell <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID to sell' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity (default: 1)' },
        ],
      });
    }

    if (currentLocation === 'missions') {
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
          { name: 'difficulty', type: 'string', required: true, description: 'normal, hard, super-hard' },
        ],
      });
    }

    if (currentLocation === 'inventory') {
      commands.push({
        name: 'show-inventory',
        description: 'Show inventory contents',
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
        description: 'Equip a weapon or armor',
        usage: 'equip <item-id>',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID to equip' },
        ],
      });

      commands.push({
        name: 'unequip',
        description: 'Unequip a slot',
        usage: 'unequip <slot>',
        args: [
          { name: 'slot', type: 'string', required: true, description: 'weapon or frame' },
        ],
      });

      commands.push({
        name: 'create-mag',
        description: 'Create a new MAG',
        usage: 'create-mag',
        args: [],
      });

      commands.push({
        name: 'show-mag',
        description: 'Show MAG status',
        usage: 'show-mag',
        args: [],
      });

      commands.push({
        name: 'feed-mag',
        description: 'Feed an item to your MAG',
        usage: 'feed-mag <item-id>',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item to feed (monomate, monofluid, etc.)' },
        ],
      });
    }

    if (currentLocation === 'storage') {
      commands.push({
        name: 'show-storage',
        description: 'Show shared storage contents',
        usage: 'show-storage',
        args: [],
      });

      commands.push({
        name: 'deposit-meseta',
        description: 'Deposit meseta to shared storage',
        usage: 'deposit-meseta <amount>',
        args: [
          { name: 'amount', type: 'number', required: true, description: 'Amount to deposit' },
        ],
      });

      commands.push({
        name: 'withdraw-meseta',
        description: 'Withdraw meseta from shared storage',
        usage: 'withdraw-meseta <amount>',
        args: [
          { name: 'amount', type: 'number', required: true, description: 'Amount to withdraw' },
        ],
      });

      commands.push({
        name: 'deposit-item',
        description: 'Deposit item to shared storage',
        usage: 'deposit-item <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item to deposit' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity (default: 1)' },
        ],
      });

      commands.push({
        name: 'withdraw-item',
        description: 'Withdraw item from shared storage',
        usage: 'withdraw-item <item-id> [quantity]',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item to withdraw' },
          { name: 'quantity', type: 'number', required: false, description: 'Quantity (default: 1)' },
        ],
      });
    }

    if (currentLocation === 'guild') {
      commands.push({
        name: 'list-fields',
        description: 'List available fields',
        usage: 'list-fields',
        args: [],
      });

      commands.push({
        name: 'list-missions',
        description: 'List available missions',
        usage: 'list-missions',
        args: [],
      });

      commands.push({
        name: 'enter-field',
        description: 'Enter a field',
        usage: 'enter-field <field-id> <difficulty>',
        args: [
          { name: 'field-id', type: 'string', required: true, description: 'Field ID' },
          { name: 'difficulty', type: 'string', required: true, description: 'normal, hard, super-hard' },
        ],
      });

      commands.push({
        name: 'enter-mission',
        description: 'Start a mission',
        usage: 'enter-mission <mission-id> <difficulty>',
        args: [
          { name: 'mission-id', type: 'string', required: true, description: 'Mission ID' },
          { name: 'difficulty', type: 'string', required: true, description: 'normal, hard, super-hard' },
        ],
      });

      commands.push({
        name: 'show-session',
        description: 'Show current session state',
        usage: 'show-session',
        args: [],
      });

      commands.push({
        name: 'claim-rewards',
        description: 'Claim pending rewards',
        usage: 'claim-rewards',
        args: [],
      });

      commands.push({
        name: 'use-item',
        description: 'Use a consumable item',
        usage: 'use-item <item-id>',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID (monomate, monofluid, etc.)' },
        ],
      });
    }

    if (currentLocation === 'field') {
      commands.push({
        name: 'spawn-enemies',
        description: 'Generate enemies for current stage',
        usage: 'spawn-enemies',
        args: [],
      });

      commands.push({
        name: 'show-enemies',
        description: 'Show current enemies',
        usage: 'show-enemies',
        args: [],
      });

      commands.push({
        name: 'attack',
        description: 'Attack an enemy',
        usage: 'attack <enemy-index>',
        args: [
          { name: 'enemy-index', type: 'number', required: true, description: 'Target enemy index (0-based)' },
        ],
      });

      commands.push({
        name: 'next-stage',
        description: 'Advance to next stage (when enemies cleared)',
        usage: 'next-stage',
        args: [],
      });

      commands.push({
        name: 'complete-field',
        description: 'Complete the field (for testing)',
        usage: 'complete-field',
        args: [],
      });

      commands.push({
        name: 'combat-log',
        description: 'Show recent combat log',
        usage: 'combat-log',
        args: [],
      });

      commands.push({
        name: 'use-telepipe',
        description: 'Return to city (preserves progress)',
        usage: 'use-telepipe',
        args: [],
      });

      commands.push({
        name: 'abandon-session',
        description: 'Abandon current session',
        usage: 'abandon-session',
        args: [],
      });

      commands.push({
        name: 'show-session',
        description: 'Show current session state',
        usage: 'show-session',
        args: [],
      });

      commands.push({
        name: 'use-item',
        description: 'Use a consumable item',
        usage: 'use-item <item-id>',
        args: [
          { name: 'item-id', type: 'string', required: true, description: 'Item ID (monomate, monofluid, etc.)' },
        ],
      });

      commands.push({
        name: 'cast',
        description: 'Cast a technique (uses TP)',
        usage: 'cast <technique> [target]',
        args: [
          { name: 'technique', type: 'string', required: true, description: 'foie, barta, zonde, resta, shifta, deband' },
          { name: 'target', type: 'number', required: false, description: 'Enemy index for attack techs' },
        ],
      });

      commands.push({
        name: 'list-techniques',
        description: 'List available techniques',
        usage: 'list-techniques',
        args: [],
      });

      commands.push({
        name: 'show-player-hp',
        description: 'Show player HP/TP status',
        usage: 'show-player-hp',
        args: [],
      });
    }
  }

  return commands;
}

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
      return executeLoadCharacter(args.join(' '));

    case 'show-stats':
      return executeShowStats();

    case 'goto':
      if (!args[0]) {
        return { success: false, message: 'Usage: goto <location> (city, shop, missions, inventory, storage, guild)' };
      }
      return executeGoto(args[0].toLowerCase() as Location);

    case 'list-items':
      return executeListItems();

    case 'buy':
      if (!args[0]) {
        return { success: false, message: 'Usage: buy <item-id> [quantity]' };
      }
      const buyQty = args[1] ? parseInt(args[1]) : 1;
      if (isNaN(buyQty) || buyQty < 1) {
        return { success: false, message: 'Quantity must be a positive number.' };
      }
      return executeBuy(args[0], buyQty);

    case 'buy-equipment':
      if (!args[0]) {
        return { success: false, message: 'Usage: buy-equipment <item-id>' };
      }
      return executeBuyEquipment(args[0]);

    case 'sell':
      if (!args[0]) {
        return { success: false, message: 'Usage: sell <item-id> [quantity]' };
      }
      const sellQty = args[1] ? parseInt(args[1]) : 1;
      if (isNaN(sellQty) || sellQty < 1) {
        return { success: false, message: 'Quantity must be a positive number.' };
      }
      return executeSell(args[0], sellQty);

    case 'list-missions':
      return executeListMissions();

    case 'start-mission':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: start-mission <mission-id> <difficulty>' };
      }
      return executeStartMission(args[0], args[1].toLowerCase() as Difficulty);

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
        return { success: false, message: 'Usage: unequip <slot> (weapon or frame)' };
      }
      return executeUnequip(args[0].toLowerCase());

    case 'create-mag':
      return executeCreateMag();

    case 'show-mag':
      return executeShowMag();

    case 'feed-mag':
      if (!args[0]) {
        return { success: false, message: 'Usage: feed-mag <item-id>' };
      }
      return executeFeedMag(args[0].toLowerCase());

    case 'show-storage':
      return executeShowStorage();

    case 'deposit-meseta':
      if (!args[0]) {
        return { success: false, message: 'Usage: deposit-meseta <amount>' };
      }
      const depositAmt = parseInt(args[0]);
      if (isNaN(depositAmt) || depositAmt < 1) {
        return { success: false, message: 'Amount must be a positive number.' };
      }
      return executeDepositMeseta(depositAmt);

    case 'withdraw-meseta':
      if (!args[0]) {
        return { success: false, message: 'Usage: withdraw-meseta <amount>' };
      }
      const withdrawAmt = parseInt(args[0]);
      if (isNaN(withdrawAmt) || withdrawAmt < 1) {
        return { success: false, message: 'Amount must be a positive number.' };
      }
      return executeWithdrawMeseta(withdrawAmt);

    case 'deposit-item':
      if (!args[0]) {
        return { success: false, message: 'Usage: deposit-item <item-id> [quantity]' };
      }
      const depositItemQty = args[1] ? parseInt(args[1]) : 1;
      if (isNaN(depositItemQty) || depositItemQty < 1) {
        return { success: false, message: 'Quantity must be a positive number.' };
      }
      return executeDepositItem(args[0], depositItemQty);

    case 'withdraw-item':
      if (!args[0]) {
        return { success: false, message: 'Usage: withdraw-item <item-id> [quantity]' };
      }
      const withdrawItemQty = args[1] ? parseInt(args[1]) : 1;
      if (isNaN(withdrawItemQty) || withdrawItemQty < 1) {
        return { success: false, message: 'Quantity must be a positive number.' };
      }
      return executeWithdrawItem(args[0], withdrawItemQty);

    case 'list-fields':
      return executeListFields();

    case 'enter-field':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: enter-field <field-id> <difficulty>' };
      }
      return executeEnterField(args[0], args[1].toLowerCase() as Difficulty);

    case 'enter-mission':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: enter-mission <mission-id> <difficulty>' };
      }
      return executeEnterMission(args[0], args[1].toLowerCase() as Difficulty);

    case 'show-session':
      return executeShowSession();

    case 'use-telepipe':
      return executeUseTelepipe();

    case 'abandon-session':
      return executeAbandonSession();

    case 'claim-rewards':
      return executeClaimRewards();

    // Combat commands
    case 'spawn-enemies':
      return executeSpawnEnemies();

    case 'show-enemies':
      return executeShowEnemies();

    case 'attack':
      if (!args[0]) {
        return { success: false, message: 'Usage: attack <enemy-index>' };
      }
      const targetIndex = parseInt(args[0]);
      if (isNaN(targetIndex)) {
        return { success: false, message: 'Enemy index must be a number.' };
      }
      return executeAttack(targetIndex);

    case 'next-stage':
      return executeNextStage();

    case 'complete-field':
      return executeCompleteField();

    case 'combat-log':
      return executeCombatLog();

    case 'use-item':
      if (!args[0]) {
        return { success: false, message: 'Usage: use-item <item-id>' };
      }
      return executeUseItem(args[0]);

    case 'pickup-item':
      if (!args[0]) {
        return { success: false, message: 'Usage: pickup-item <drop-id>' };
      }
      return executePickupItem(parseInt(args[0], 10));

    case 'pickup-all':
      return executePickupAll();

    case 'show-player-hp':
      return executeShowPlayerHp();

    case 'cast':
      if (!args[0]) {
        return { success: false, message: 'Usage: cast <technique> [target]\nTechniques: foie, barta, zonde, resta, shifta, deband' };
      }
      const techTarget = args[1] ? parseInt(args[1]) : undefined;
      return executeCastTechnique(args[0].toLowerCase(), techTarget);

    case 'list-techniques':
      return executeListTechniques();

    case 'add-item': {
      // Internal command for restoring inventory from persistence
      if (!args[0]) {
        return { success: false, message: 'Usage: add-item <item-json> [quantity]' };
      }
      // Parse the JSON item - args may have been split, so rejoin
      const jsonStr = args.join(' ');
      const qtyMatch = jsonStr.match(/\}\s+(\d+)$/);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      const itemJson = qtyMatch ? jsonStr.slice(0, jsonStr.lastIndexOf('}') + 1) : jsonStr;
      try {
        const item = JSON.parse(itemJson) as GameItem;
        inventory.set(item.id, { item, quantity });
        return { success: true, message: `Added ${item.name} x${quantity}` };
      } catch {
        return { success: false, message: 'Invalid item JSON' };
      }
    }

    case 'equip-weapon': {
      if (!args[0]) {
        return { success: false, message: 'Usage: equip-weapon <item-id>' };
      }
      return executeEquipWeapon(args[0]);
    }

    case 'equip-frame': {
      if (!args[0]) {
        return { success: false, message: 'Usage: equip-frame <item-id>' };
      }
      return executeEquipFrame(args[0]);
    }

    default:
      return {
        success: false,
        message: `Unknown command: ${command}. Type 'help' for available commands.`,
      };
  }
}

function executeHelp(): CommandResult {
  const commands = getAvailableCommands();
  const lines = commands.map(cmd => `  ${cmd.usage.padEnd(40)} - ${cmd.description}`);
  return {
    success: true,
    message: `Available commands:\n${lines.join('\n')}`,
    data: commands,
  };
}

function executeListClasses(): CommandResult {
  const classes = VALID_CLASS_IDS;
  return {
    success: true,
    message: `Available classes:\n  ${classes.join('\n  ')}`,
    data: classes,
  };
}

function executeCreateCharacter(classId: string, name: string): CommandResult {
  if (!classId || !name) {
    return {
      success: false,
      message: 'Usage: create-character <class> <name>',
    };
  }

  const nameValidation = validateCharacterName(name);
  if (!nameValidation.valid) {
    return {
      success: false,
      message: nameValidation.errors.join(', '),
    };
  }

  // Normalize class ID (case-insensitive match)
  const normalizedClassId = VALID_CLASS_IDS.find(
    c => c.toLowerCase() === classId.toLowerCase()
  );
  if (!normalizedClassId) {
    return {
      success: false,
      message: `Invalid class: ${classId}. Use 'list-classes' to see valid options.`,
    };
  }

  currentCharacter = {
    character_id: generateCharacterId(),
    character_name: name.trim(),
    level: 1,
    experience: 0,
    slot: 0,
    class_id: normalizedClassId,
    variation_index: 0,
    texture_id: '0_0',
    created_at: new Date().toISOString(),
    meseta: STARTING_MESETA,
  };

  // Add starting items to inventory
  const startingItems = getStartingItems(normalizedClassId);
  inventory.clear();

  // Equip starting weapon and frame
  equippedItems = {
    weapon: startingItems.weapon,
    frame: startingItems.frame,
  };

  // Add consumables to inventory
  for (const { item, quantity } of startingItems.consumables) {
    inventory.set(item.id, { item, quantity });
  }

  return {
    success: true,
    message: `Created ${normalizedClassId} character "${name}" with ${STARTING_MESETA} meseta.\nEquipped: ${startingItems.weapon.name}, ${startingItems.frame.name}`,
    data: currentCharacter,
  };
}

function executeLoadCharacter(jsonString: string): CommandResult {
  if (!jsonString) {
    return {
      success: false,
      message: 'Usage: load-character <character-json>',
    };
  }

  try {
    const character = JSON.parse(jsonString);

    // Validate required fields
    if (!character.character_id || !character.class_id || !character.character_name) {
      return {
        success: false,
        message: 'Invalid character data: missing required fields',
      };
    }

    // Validate class ID
    const normalizedClassId = VALID_CLASS_IDS.find(
      c => c.toLowerCase() === character.class_id.toLowerCase()
    );
    if (!normalizedClassId) {
      return {
        success: false,
        message: `Invalid class: ${character.class_id}`,
      };
    }

    // Load the character
    currentCharacter = {
      character_id: character.character_id,
      character_name: character.character_name,
      level: character.level ?? 1,
      experience: character.experience ?? 0,
      slot: character.slot ?? 0,
      class_id: normalizedClassId,
      variation_index: character.variation_index ?? 0,
      texture_id: character.texture_id ?? '0_0',
      created_at: character.created_at ?? new Date().toISOString(),
      meseta: character.meseta ?? STARTING_MESETA,
    };

    // Reset game state for loaded character
    currentLocation = 'city';
    inventory.clear();
    currentEnemies = [];
    playerCombatState = null;

    // Set up starting equipment based on class
    const startingItems = getStartingItems(normalizedClassId);
    equippedItems = {
      weapon: startingItems.weapon,
      frame: startingItems.frame,
    };

    // Add consumables to inventory
    for (const { item, quantity } of startingItems.consumables) {
      inventory.set(item.id, { item, quantity });
    }

    return {
      success: true,
      message: `Loaded character "${currentCharacter.character_name}" (${normalizedClassId} Lv.${currentCharacter.level})`,
      data: currentCharacter,
    };
  } catch (e) {
    return {
      success: false,
      message: `Failed to parse character data: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

function executeShowStats(): CommandResult {
  if (!currentCharacter) {
    return {
      success: false,
      message: 'No character. Create one first with: create-character <class> <name>',
    };
  }

  const stats = `
Character: ${currentCharacter.character_name}
Class: ${currentCharacter.class_id}
Level: ${currentCharacter.level}
Experience: ${currentCharacter.experience}
Meseta: ${currentCharacter.meseta ?? 0}
Location: ${currentLocation}
`.trim();

  return {
    success: true,
    message: stats,
    data: currentCharacter,
  };
}

function executeGoto(location: Location): CommandResult {
  if (!currentCharacter) {
    return {
      success: false,
      message: 'No character selected.',
    };
  }

  const validLocations: Location[] = ['city', 'shop', 'weapon-shop', 'missions', 'inventory', 'storage', 'guild', 'teleporter'];
  if (!validLocations.includes(location)) {
    return {
      success: false,
      message: `Invalid location. Choose: ${validLocations.join(', ')}`,
    };
  }

  // Set session config when going to guild or teleporter
  if (location === 'guild' || location === 'teleporter') {
    setSessionConfig(currentCharacter.character_id, currentCharacter.level);
  }

  currentLocation = location;
  return {
    success: true,
    message: `Moved to ${location}.`,
    data: { location },
  };
}

function executeListItems(): CommandResult {
  if (currentLocation !== 'shop') {
    return {
      success: false,
      message: 'You must be at the shop. Use: goto shop',
    };
  }

  const items = getShopItems(SHOP_IDS.ITEM_SHOP);
  const lines = items.map(item =>
    `  ${item.id.padEnd(20)} ${item.name.padEnd(15)} ${item.price.toString().padStart(6)} meseta`
  );

  return {
    success: true,
    message: `Shop items:\n${lines.join('\n')}`,
    data: items,
  };
}

// Stack limits for consumables (from content data)
const CONSUMABLE_STACK_LIMITS: Record<string, number> = {
  monomate: 10,
  dimate: 10,
  trimate: 10,
  monofluid: 10,
  difluid: 10,
  trifluid: 10,
  'sol-atomizer': 10,
  'moon-atomizer': 10,
  'star-atomizer': 5,
  'scape-doll': 1,
  telepipe: 10,
  'photon-drop': 99,
  'heal-trap': 10,
  'heat-trap': 10,
  'ice-trap': 10,
  'light-trap': 10,
  'trap-vision': 10,
};

function getMaxStack(itemId: string): number {
  return CONSUMABLE_STACK_LIMITS[itemId] ?? 10;
}

// Maximum inventory slots (each item stack or equipment piece takes 1 slot)
const MAX_INVENTORY_SLOTS = 40;

function getInventorySlotCount(): number {
  let count = inventory.size;
  // Equipped items also take inventory slots
  if (equippedItems.weapon) count++;
  if (equippedItems.frame) count++;
  return count;
}

function isInventoryFull(): boolean {
  return getInventorySlotCount() >= MAX_INVENTORY_SLOTS;
}

function executeBuy(itemId: string, quantity: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'shop') {
    return { success: false, message: 'You must be at the shop.' };
  }

  // Check stack limit before purchase
  const maxStack = getMaxStack(itemId);
  const existing = inventory.get(itemId);
  const currentQty = existing?.quantity ?? 0;

  if (currentQty + quantity > maxStack) {
    const canBuy = maxStack - currentQty;
    if (canBuy <= 0) {
      return { success: false, message: `Cannot carry more ${itemId}. (Max: ${maxStack})` };
    }
    return { success: false, message: `Can only buy ${canBuy} more ${itemId}. (Max: ${maxStack}, Have: ${currentQty})` };
  }

  const meseta = currentCharacter.meseta ?? 0;
  const result = purchaseItem(SHOP_IDS.ITEM_SHOP, itemId, quantity, meseta);

  if (result.success && result.item) {
    currentCharacter = {
      ...currentCharacter,
      meseta: result.remainingMeseta,
    };

    // Convert ShopItem to GameItem (consumable) and add to inventory
    const gameItem: ConsumableItem = {
      id: result.item.id,
      name: result.item.name,
      description: result.item.description,
      type: 'consumable',
      rarity: result.item.rarity,
      sellPrice: result.item.sellPrice,
      stackable: true,
      maxStack: maxStack,
      effect: 'heal_hp', // Default effect for shop items
      effectValue: 100,
    };

    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.set(itemId, { item: gameItem, quantity });
    }
  }

  return {
    success: result.success,
    message: result.message,
    data: result,
  };
}

function executeBuyEquipment(itemId: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'weapon-shop') {
    return { success: false, message: 'You must be at the weapon shop.' };
  }

  // Check if inventory is full
  if (isInventoryFull()) {
    return { success: false, message: `Inventory full. (${MAX_INVENTORY_SLOTS}/${MAX_INVENTORY_SLOTS} slots)` };
  }

  const meseta = currentCharacter.meseta ?? 0;
  const result = purchaseItem(SHOP_IDS.ARMOR_SHOP, itemId, 1, meseta);

  if (result.success && result.item) {
    currentCharacter = {
      ...currentCharacter,
      meseta: result.remainingMeseta,
    };

    const shopItem = result.item as any; // EquipmentShopItem

    // Convert to appropriate game item type based on category
    if (shopItem.category === 'weapon') {
      const weaponItem: WeaponItem = {
        id: shopItem.id,
        name: shopItem.name,
        description: shopItem.description,
        type: 'weapon',
        rarity: shopItem.rarity,
        sellPrice: shopItem.sellPrice,
        stackable: false,
        maxStack: 1,
        attack: shopItem.attack ?? 0,
        accuracy: 90,
        weaponType: 'sword',
        element: shopItem.element,
        elementPercent: shopItem.elementPercent,
        grindLevel: 0,
        maxGrind: 10,
        requiredLevel: shopItem.requiredLevel ?? 1,
      };
      inventory.set(shopItem.id, { item: weaponItem, quantity: 1 });
    } else if (shopItem.category === 'armor') {
      const armorItem: ArmorItem = {
        id: shopItem.id,
        name: shopItem.name,
        description: shopItem.description,
        type: 'armor',
        rarity: shopItem.rarity,
        sellPrice: shopItem.sellPrice,
        stackable: false,
        maxStack: 1,
        defense: shopItem.defense ?? 0,
        evasion: shopItem.evasion ?? 0,
        armorSlot: 'frame',
        unitSlots: shopItem.slots ?? 0,
        requiredLevel: shopItem.requiredLevel ?? 1,
      };
      inventory.set(shopItem.id, { item: armorItem, quantity: 1 });
    } else if (shopItem.category === 'unit') {
      const unitItem: ArmorItem = {
        id: shopItem.id,
        name: shopItem.name,
        description: shopItem.description,
        type: 'armor',
        rarity: shopItem.rarity,
        sellPrice: shopItem.sellPrice,
        stackable: false,
        maxStack: 1,
        defense: 0,
        evasion: 0,
        armorSlot: 'unit',
        requiredLevel: shopItem.requiredLevel ?? 1,
      };
      inventory.set(shopItem.id, { item: unitItem, quantity: 1 });
    }

    // Remove item from shop (equipment is one-time purchase like PSO)
    removeShopItem(SHOP_IDS.ARMOR_SHOP, itemId);
  }

  return {
    success: result.success,
    message: result.message,
    data: result,
  };
}

// Sell prices for items (50% of buy price)
const SELL_PRICES: Record<string, number> = {
  monomate: 25,
  dimate: 75,
  trimate: 300,
  monofluid: 75,
  difluid: 150,
  trifluid: 400,
};

function executeSell(itemId: string, quantity: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'shop') {
    return { success: false, message: 'You must be at the shop.' };
  }

  // Check if item is in inventory
  const item = inventory.get(itemId.toLowerCase());
  if (!item || item.quantity <= 0) {
    return { success: false, message: `No ${itemId} in inventory.` };
  }

  if (item.quantity < quantity) {
    return { success: false, message: `Only have ${item.quantity} ${itemId}.` };
  }

  // Get sell price
  const sellPrice = SELL_PRICES[itemId.toLowerCase()];
  if (!sellPrice) {
    return { success: false, message: `Cannot sell ${itemId}.` };
  }

  const totalPrice = sellPrice * quantity;

  // Remove from inventory
  item.quantity -= quantity;
  if (item.quantity <= 0) {
    inventory.delete(itemId.toLowerCase());
  }

  // Add meseta
  currentCharacter = {
    ...currentCharacter,
    meseta: (currentCharacter.meseta ?? 0) + totalPrice,
  };

  return {
    success: true,
    message: `Sold ${quantity}x ${itemId} for ${totalPrice} meseta.\nMeseta: ${currentCharacter.meseta}`,
    data: { itemId, quantity, totalPrice, meseta: currentCharacter.meseta },
  };
}

function executeListMissions(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'missions' && currentLocation !== 'guild') {
    return { success: false, message: 'You must be at the guild. Use: goto guild' };
  }

  const allMissions = getAllMissions();
  const missionsWithStatus = allMissions.map(m => ({
    ...m,
    unlocked: isMissionUnlocked(m.id, currentCharacter!.character_id, currentCharacter!.level),
  }));

  const lines = missionsWithStatus.map(m => {
    const status = m.unlocked ? ' ' : '🔒';
    return `  ${status} ${m.id.padEnd(20)} ${m.name.padEnd(25)} Lv.${m.recommendedLevel}`;
  });

  return {
    success: true,
    message: `Available missions:\n${lines.join('\n')}`,
    data: missionsWithStatus,
  };
}

function executeStartMission(missionId: string, difficulty: Difficulty): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'missions') {
    return { success: false, message: 'You must be at missions.' };
  }

  const mission = getMission(missionId);
  if (!mission) {
    return { success: false, message: `Mission not found: ${missionId}` };
  }

  const validDifficulties: Difficulty[] = ['normal', 'hard', 'super-hard'];
  if (!validDifficulties.includes(difficulty)) {
    return { success: false, message: `Invalid difficulty. Choose: ${validDifficulties.join(', ')}` };
  }

  if (!meetsLevelForDifficulty(currentCharacter.level, difficulty)) {
    return { success: false, message: `Level too low for ${difficulty} difficulty.` };
  }

  // Start and immediately complete the mission (simplified for CLI)
  const progress = startMission(missionId, difficulty);
  if (!progress) {
    return { success: false, message: 'Failed to start mission.' };
  }

  // Simulate completion (success, 180 seconds, 300 par time)
  const result = completeMission(currentCharacter.character_id, true, 180, 300);
  if (!result) {
    return { success: false, message: 'Failed to complete mission.' };
  }

  // Apply rewards
  currentCharacter = {
    ...currentCharacter,
    experience: currentCharacter.experience + result.expGained,
    level: getLevelForExp(currentCharacter.experience + result.expGained),
    meseta: (currentCharacter.meseta ?? 0) + result.mesetaGained,
  };

  return {
    success: true,
    message: `Mission completed!\nGrade: ${result.grade}\nEXP: +${result.expGained}\nMeseta: +${result.mesetaGained}`,
    data: result,
  };
}

function executeShowInventory(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  const items = Array.from(inventory.values());
  if (items.length === 0) {
    return {
      success: true,
      message: 'Inventory is empty.',
      data: [],
    };
  }

  const lines = items.map(entry =>
    `  ${entry.item.name.padEnd(20)} x${entry.quantity}`
  );

  return {
    success: true,
    message: `Inventory:\n${lines.join('\n')}`,
    data: items.map(entry => ({ itemId: entry.item.id, quantity: entry.quantity })),
  };
}

function executeShowEquipment(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  const lines: string[] = ['Equipment:'];

  if (equippedItems.weapon) {
    const w = equippedItems.weapon;
    const grindStr = w.grindLevel > 0 ? ` +${w.grindLevel}` : '';
    const elemStr = w.element ? ` [${w.element} ${w.elementPercent}%]` : '';
    lines.push(`  Weapon: ${w.name}${grindStr}${elemStr} (ATK: ${w.attack}, ACC: ${w.accuracy})`);
  } else {
    lines.push('  Weapon: (none)');
  }

  if (equippedItems.frame) {
    const f = equippedItems.frame;
    lines.push(`  Frame:  ${f.name} (DEF: ${f.defense}, EVA: ${f.evasion})`);
  } else {
    lines.push('  Frame:  (none)');
  }

  return {
    success: true,
    message: lines.join('\n'),
    data: equippedItems,
  };
}

function executeEquip(itemId: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'inventory') {
    return { success: false, message: 'You must be in inventory. Use: goto inventory' };
  }

  // Check if item is in inventory (for weapons/armor that could be stored)
  // For now, just provide feedback about what's equipped
  // In a full implementation, this would swap items in/out of inventory

  return {
    success: false,
    message: `Cannot equip "${itemId}" - item swapping not yet implemented. Use show-equipment to see current gear.`,
  };
}

function executeUnequip(slot: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'inventory') {
    return { success: false, message: 'You must be in inventory. Use: goto inventory' };
  }

  if (slot !== 'weapon' && slot !== 'frame') {
    return { success: false, message: 'Invalid slot. Choose: weapon, frame' };
  }

  if (slot === 'weapon') {
    if (!equippedItems.weapon) {
      return { success: false, message: 'No weapon equipped.' };
    }
    const weapon = equippedItems.weapon;
    equippedItems.weapon = null;
    return {
      success: true,
      message: `Unequipped ${weapon.name}. You are now unarmed!`,
    };
  } else {
    if (!equippedItems.frame) {
      return { success: false, message: 'No frame equipped.' };
    }
    const frame = equippedItems.frame;
    equippedItems.frame = null;
    return {
      success: true,
      message: `Unequipped ${frame.name}. You have no armor!`,
    };
  }
}

function executeEquipWeapon(itemId: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  // Find the weapon in inventory
  const entry = inventory.get(itemId);
  if (!entry) {
    return { success: false, message: `Item "${itemId}" not found in inventory.` };
  }

  if (entry.item.type !== 'weapon') {
    return { success: false, message: `${entry.item.name} is not a weapon.` };
  }

  const weapon = entry.item as WeaponItem;

  // If there's already a weapon equipped, put it back in inventory
  if (equippedItems.weapon) {
    inventory.set(equippedItems.weapon.id, { item: equippedItems.weapon, quantity: 1 });
  }

  // Equip the new weapon and remove from inventory
  equippedItems.weapon = weapon;
  inventory.delete(itemId);

  return {
    success: true,
    message: `Equipped ${weapon.name}.`,
    data: { equipped: weapon },
  };
}

function executeEquipFrame(itemId: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  // Find the armor in inventory
  const entry = inventory.get(itemId);
  if (!entry) {
    return { success: false, message: `Item "${itemId}" not found in inventory.` };
  }

  if (entry.item.type !== 'armor') {
    return { success: false, message: `${entry.item.name} is not armor.` };
  }

  const armor = entry.item as ArmorItem;

  // If there's already armor equipped, put it back in inventory
  if (equippedItems.frame) {
    inventory.set(equippedItems.frame.id, { item: equippedItems.frame, quantity: 1 });
  }

  // Equip the new armor and remove from inventory
  equippedItems.frame = armor;
  inventory.delete(itemId);

  return {
    success: true,
    message: `Equipped ${armor.name}.`,
    data: { equipped: armor },
  };
}

function executeCreateMag(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentMag) {
    return { success: false, message: 'You already have a MAG!' };
  }

  currentMag = {
    stats: { power: 0, guard: 0, hit: 0, mind: 0 },
    sync: 0,
    iq: 0,
  };

  return {
    success: true,
    message: 'Created a new MAG! It is a baby Mag at Level 0.\nFeed it items to raise its stats and watch it evolve!',
    data: { mag: currentMag },
  };
}

function executeShowMag(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (!currentMag) {
    return { success: false, message: 'You have no MAG. Use: create-mag' };
  }

  const level = getMagLevel(currentMag.stats);
  const { id, mag } = determineForm(currentMag.stats);

  const lines: string[] = [];
  lines.push(`=== ${mag.name} ===`);
  lines.push(`Level: ${level} (Stage ${mag.stage})`);
  lines.push(`Stats:`);
  lines.push(`  Power: ${currentMag.stats.power}`);
  lines.push(`  Guard: ${currentMag.stats.guard}`);
  lines.push(`  Hit:   ${currentMag.stats.hit}`);
  lines.push(`  Mind:  ${currentMag.stats.mind}`);
  lines.push(`Sync: ${currentMag.sync}/120`);
  lines.push(`IQ: ${currentMag.iq}/200`);
  if (mag.photonBlast) {
    lines.push(`Photon Blast: ${mag.photonBlast}`);
  }

  // Show evolution hints
  if (level < 10) {
    lines.push(`\nEvolves at Level 10. Feed items to raise stats!`);
  } else if (level < 30) {
    lines.push(`\nEvolves at Level 30. Keep feeding!`);
  } else if (level < 60) {
    lines.push(`\nFinal evolution at Level 60!`);
  }

  return {
    success: true,
    message: lines.join('\n'),
    data: { mag: currentMag, form: id, level },
  };
}

function executeFeedMag(itemId: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (!currentMag) {
    return { success: false, message: 'You have no MAG. Use: create-mag' };
  }

  // Check if item can feed mags
  const feedEffect = MAG_FEED_EFFECTS[itemId];
  if (!feedEffect) {
    const validItems = Object.keys(MAG_FEED_EFFECTS).join(', ');
    return { success: false, message: `Cannot feed ${itemId} to MAG. Valid items: ${validItems}` };
  }

  // Check if player has the item
  const invItem = inventory.get(itemId);
  if (!invItem || invItem.quantity <= 0) {
    return { success: false, message: `You don't have any ${itemId}.` };
  }

  // Get level before feeding
  const levelBefore = getMagLevel(currentMag.stats);
  const { mag: formBefore } = determineForm(currentMag.stats);

  // Apply feed effects
  currentMag.stats.power += feedEffect.power;
  currentMag.stats.guard += feedEffect.guard;
  currentMag.stats.hit += feedEffect.hit;
  currentMag.stats.mind += feedEffect.mind;
  currentMag.sync = Math.min(120, currentMag.sync + feedEffect.sync);
  currentMag.iq = Math.min(200, currentMag.iq + 1);

  // Consume the item
  invItem.quantity -= 1;
  if (invItem.quantity <= 0) {
    inventory.delete(itemId);
  }

  // Get level after feeding
  const levelAfter = getMagLevel(currentMag.stats);
  const { mag: formAfter } = determineForm(currentMag.stats);

  const lines: string[] = [];
  lines.push(`Fed ${itemId} to MAG!`);
  lines.push(`Stats: Power +${feedEffect.power}, Guard +${feedEffect.guard}, Hit +${feedEffect.hit}, Mind +${feedEffect.mind}`);
  lines.push(`Sync: +${feedEffect.sync} (now ${currentMag.sync}/120)`);

  // Check for level up
  if (levelAfter > levelBefore) {
    lines.push(`\n*** MAG leveled up! Level ${levelBefore} → ${levelAfter} ***`);
  }

  // Check for evolution
  if (formAfter.name !== formBefore.name) {
    lines.push(`\n*** MAG EVOLVED! ***`);
    lines.push(`${formBefore.name} → ${formAfter.name}`);
    if (formAfter.photonBlast) {
      lines.push(`Learned Photon Blast: ${formAfter.photonBlast}!`);
    }
  }

  return {
    success: true,
    message: lines.join('\n'),
    data: { mag: currentMag, levelUp: levelAfter > levelBefore, evolved: formAfter.name !== formBefore.name },
  };
}

function executeShowStorage(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'storage') {
    return { success: false, message: 'You must be at storage. Use: goto storage' };
  }

  const storage = getSharedStorage();
  const lines: string[] = [];

  lines.push(`Meseta: ${storage.meseta}`);
  lines.push(`Items (${storage.items.length}/${storage.maxSlots}):`);

  if (storage.items.length === 0) {
    lines.push('  (empty)');
  } else {
    for (const slot of storage.items) {
      lines.push(`  ${slot.item.name.padEnd(20)} x${slot.quantity}`);
    }
  }

  return {
    success: true,
    message: `Shared Storage:\n${lines.join('\n')}`,
    data: storage,
  };
}

function executeDepositMeseta(amount: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'storage') {
    return { success: false, message: 'You must be at storage. Use: goto storage' };
  }

  const charMeseta = currentCharacter.meseta ?? 0;
  if (charMeseta < amount) {
    return { success: false, message: `Not enough meseta. You have ${charMeseta}` };
  }

  // Update shared storage meseta directly
  const storage = getSharedStorage();
  const newStorageBalance = (storage.meseta ?? 0) + amount;

  // Save to storage (using localStorage directly since CLI doesn't use the full character system)
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('shared_storage');
    const data = stored ? JSON.parse(stored) : { items: [], meseta: 0 };
    data.meseta = newStorageBalance;
    localStorage.setItem('shared_storage', JSON.stringify(data));
  }

  // Update in-memory character meseta
  currentCharacter = {
    ...currentCharacter,
    meseta: charMeseta - amount,
  };

  return {
    success: true,
    message: `Deposited ${amount} meseta to storage`,
    data: { newStorageBalance, characterMeseta: currentCharacter.meseta },
  };
}

function executeWithdrawMeseta(amount: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'storage') {
    return { success: false, message: 'You must be at storage. Use: goto storage' };
  }

  const storage = getSharedStorage();
  const storageMeseta = storage.meseta ?? 0;

  if (storageMeseta < amount) {
    return { success: false, message: `Not enough meseta in storage. Balance: ${storageMeseta}` };
  }

  // Update shared storage meseta directly
  const newStorageBalance = storageMeseta - amount;

  // Save to storage
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('shared_storage');
    const data = stored ? JSON.parse(stored) : { items: [], meseta: 0 };
    data.meseta = newStorageBalance;
    localStorage.setItem('shared_storage', JSON.stringify(data));
  }

  // Update in-memory character meseta
  currentCharacter = {
    ...currentCharacter,
    meseta: (currentCharacter.meseta ?? 0) + amount,
  };

  return {
    success: true,
    message: `Withdrew ${amount} meseta from storage`,
    data: { newStorageBalance, characterMeseta: currentCharacter.meseta },
  };
}

function executeDepositItem(itemId: string, quantity: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'storage') {
    return { success: false, message: 'You must be at storage. Use: goto storage' };
  }

  // Check if item is in character inventory
  const invEntry = inventory.get(itemId);
  if (!invEntry) {
    return { success: false, message: `Item not found in inventory: ${itemId}` };
  }

  if (invEntry.quantity < quantity) {
    return { success: false, message: `Only ${invEntry.quantity} in inventory` };
  }

  // Add to shared storage using the stored item definition
  const result = addToSharedStorage(invEntry.item, quantity);
  if (!result.success) {
    return result;
  }

  // Remove from character inventory
  invEntry.quantity -= quantity;
  if (invEntry.quantity <= 0) {
    inventory.delete(itemId);
  }

  return {
    success: true,
    message: `Deposited ${quantity}x ${invEntry.item.name} to storage`,
    data: { itemId, quantity },
  };
}

function executeWithdrawItem(itemId: string, quantity: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'storage') {
    return { success: false, message: 'You must be at storage. Use: goto storage' };
  }

  // Check if item is in shared storage
  const storage = getSharedStorage();
  const storageSlot = storage.items.find(s => s.item.id === itemId);

  if (!storageSlot) {
    return { success: false, message: `Item not found in storage: ${itemId}` };
  }

  if (storageSlot.quantity < quantity) {
    return { success: false, message: `Only ${storageSlot.quantity} in storage` };
  }

  // Remove from shared storage
  const result = removeFromSharedStorage(itemId, quantity);
  if (!result.success) {
    return result;
  }

  // Add to character inventory
  const existing = inventory.get(itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    inventory.set(itemId, { item: storageSlot.item, quantity });
  }

  return {
    success: true,
    message: `Withdrew ${quantity}x ${storageSlot.item.name} from storage`,
    data: { itemId, quantity },
  };
}

function executeListFields(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'teleporter' && currentLocation !== 'guild') {
    return { success: false, message: 'You must be at the teleporter. Use: goto teleporter' };
  }

  const fields = getAllFields();
  const lines = fields.map(f => {
    const unlocked = isFieldUnlocked(f.id, currentCharacter!.character_id, currentCharacter!.level);
    const completed = hasFieldCompleted(currentCharacter!.character_id, f.id);
    const status = completed ? '✓' : (unlocked ? ' ' : '🔒');
    return `  ${status} ${f.id.padEnd(20)} ${f.name.padEnd(20)} Lv.${f.recommendedLevel}`;
  });

  return {
    success: true,
    message: `Available fields:\n${lines.join('\n')}`,
    data: fields,
  };
}

function executeEnterField(fieldId: string, difficulty: Difficulty): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'teleporter') {
    return { success: false, message: 'You must be at the teleporter. Use: goto teleporter' };
  }

  const validDifficulties: Difficulty[] = ['normal', 'hard', 'super-hard'];
  if (!validDifficulties.includes(difficulty)) {
    return { success: false, message: `Invalid difficulty. Choose: ${validDifficulties.join(', ')}` };
  }

  const field = getField(fieldId);
  if (!field) {
    return { success: false, message: `Field not found: ${fieldId}` };
  }

  if (!meetsLevelForDifficulty(currentCharacter.level, difficulty)) {
    return { success: false, message: `Level too low for ${difficulty} difficulty.` };
  }

  const success = enterFieldSession(fieldId, difficulty);
  if (!success) {
    return { success: false, message: 'Cannot enter field. Check if it is unlocked.' };
  }

  // Initialize player combat state
  const level = currentCharacter.level;
  playerCombatState = {
    hp: 100 + level * 20,
    maxHp: 100 + level * 20,
    tp: 50 + level * 10,
    maxTp: 50 + level * 10,
  };

  currentLocation = 'field';

  // Clear any previous dropped items and enemies
  droppedItems = [];
  currentEnemies = [];

  // Reset wave tracking for new stage
  currentWave = 0;
  totalWaves = 1;

  // Auto-spawn enemies for the first stage
  const spawnResult = executeSpawnEnemies();

  return {
    success: true,
    message: `Entered ${field.name} on ${difficulty} difficulty.\nHP: ${playerCombatState.hp}/${playerCombatState.maxHp}  TP: ${playerCombatState.tp}/${playerCombatState.maxTp}\n${spawnResult.message}`,
    data: { fieldId, difficulty },
  };
}

function executeEnterMission(missionId: string, difficulty: Difficulty): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'guild') {
    return { success: false, message: 'You must be at the guild. Use: goto guild' };
  }

  const validDifficulties: Difficulty[] = ['normal', 'hard', 'super-hard'];
  if (!validDifficulties.includes(difficulty)) {
    return { success: false, message: `Invalid difficulty. Choose: ${validDifficulties.join(', ')}` };
  }

  const mission = getMission(missionId);
  if (!mission) {
    return { success: false, message: `Mission not found: ${missionId}` };
  }

  if (!meetsLevelForDifficulty(currentCharacter.level, difficulty)) {
    return { success: false, message: `Level too low for ${difficulty} difficulty.` };
  }

  const success = enterMissionSession(missionId, difficulty);
  if (!success) {
    return { success: false, message: 'Cannot start mission. Check if it is unlocked.' };
  }

  // Initialize player combat state
  const level = currentCharacter.level;
  playerCombatState = {
    hp: 100 + level * 20,
    maxHp: 100 + level * 20,
    tp: 50 + level * 10,
    maxTp: 50 + level * 10,
  };

  currentLocation = 'field';

  // Clear any previous dropped items and enemies
  droppedItems = [];
  currentEnemies = [];

  // Reset wave tracking for new stage
  currentWave = 0;
  totalWaves = 1;

  // Auto-spawn enemies for the first stage
  const spawnResult = executeSpawnEnemies();

  return {
    success: true,
    message: `Started ${mission.name} on ${difficulty} difficulty.\nHP: ${playerCombatState.hp}/${playerCombatState.maxHp}  TP: ${playerCombatState.tp}/${playerCombatState.maxTp}\n${spawnResult.message}`,
    data: { missionId, difficulty },
  };
}

function executeShowSession(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  const state = getSessionState();

  if (!isInSession()) {
    return {
      success: true,
      message: 'No active session.',
      data: state,
    };
  }

  const lines = [
    `Mode: ${state.mode}`,
    `Type: ${state.activeType ?? 'none'}`,
    `Location: ${state.activeId ?? 'none'}`,
    `Difficulty: ${state.difficulty}`,
    `Stage: ${state.currentStageIndex + 1}`,
    `Telepipe Used: ${state.telepipeUsed}`,
    `Pending Rewards: ${hasPendingRewards()}`,
  ];

  return {
    success: true,
    message: `Session State:\n  ${lines.join('\n  ')}`,
    data: state,
  };
}

function executeUseTelepipe(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field to use telepipe.' };
  }

  useTelepipe();
  currentLocation = 'city';

  // Clear dropped items when leaving field
  droppedItems = [];
  currentEnemies = [];

  return {
    success: true,
    message: 'Used Telepipe. Returned to city. Session paused.',
  };
}

function executeAbandonSession(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (!isInSession()) {
    return { success: false, message: 'No active session to abandon.' };
  }

  abandonSession();
  currentLocation = 'city';

  // Clear dropped items and enemies when abandoning
  droppedItems = [];
  currentEnemies = [];

  return {
    success: true,
    message: 'Session abandoned. Returned to city.',
  };
}

function executeClaimRewards(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'guild') {
    return { success: false, message: 'You must be at the guild. Use: goto guild' };
  }

  if (!hasPendingRewards()) {
    return { success: false, message: 'No pending rewards to claim.' };
  }

  const result = claimSessionRewards();
  if (!result) {
    return { success: false, message: 'Failed to claim rewards.' };
  }

  // Apply rewards to character
  currentCharacter = {
    ...currentCharacter,
    experience: currentCharacter.experience + result.expGained,
    level: getLevelForExp(currentCharacter.experience + result.expGained),
    meseta: (currentCharacter.meseta ?? 0) + result.mesetaGained,
  };

  const lines = [
    `Grade: ${result.grade}`,
    `EXP: +${result.expGained}`,
    `Meseta: +${result.mesetaGained}`,
  ];

  // Add items to inventory
  if (result.itemsGained && result.itemsGained.length > 0) {
    lines.push('Items:');
    for (const rewardItem of result.itemsGained) {
      const itemId = 'itemId' in rewardItem ? rewardItem.itemId : (rewardItem as any).itemId;
      const quantity = 'quantity' in rewardItem ? rewardItem.quantity : 1;
      lines.push(`  ${itemId} x${quantity}`);

      // Add to inventory - create a consumable item for rewards
      const existing = inventory.get(itemId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        const gameItem: ConsumableItem = {
          id: itemId,
          name: itemId.charAt(0).toUpperCase() + itemId.slice(1),
          description: `Reward item: ${itemId}`,
          type: 'consumable',
          rarity: 1,
          sellPrice: 50,
          stackable: true,
          maxStack: 10,
          effect: 'misc',
        };
        inventory.set(itemId, { item: gameItem, quantity });
      }
    }
  }

  return {
    success: true,
    message: `Rewards claimed!\n${lines.join('\n')}`,
    data: result,
  };
}

/**
 * Reset game state (for testing)
 */
export function resetState(): void {
  currentCharacter = null;
  currentLocation = 'city';
  inventory.clear();
  clearSharedStorage();
  resetSession();
  currentEnemies = [];
  combatLog = [];
  enemyIdCounter = 0;
  playerCombatState = null;
  equippedItems = { weapon: null, frame: null };
  activeBuffs = [];
  playerStatusEffects = [];
  enemyStatusEffects.clear();
  currentMag = null;
  currentWave = 0;
  totalWaves = 1;
}

// ============================================================================
// Combat Commands
// ============================================================================

/**
 * Handle player defeat - return to city, abandon session, pay rescue fee
 */
function handlePlayerDefeat(): string {
  // Calculate rescue fee (half of meseta)
  const currentMeseta = currentCharacter?.meseta ?? 0;
  const rescueFee = Math.floor(currentMeseta / 2);

  // Deduct rescue fee
  if (currentCharacter && rescueFee > 0) {
    currentCharacter = {
      ...currentCharacter,
      meseta: currentMeseta - rescueFee,
    };
  }

  // Abandon the session
  abandonSession();

  // Return to city
  currentLocation = 'city';

  // Clear combat state
  currentEnemies = [];
  droppedItems = [];
  currentWave = 0;
  totalWaves = 1;
  playerStatusEffects = [];
  enemyStatusEffects.clear();

  // Don't clear playerCombatState - let them see their HP was 0

  const feeMessage = rescueFee > 0
    ? `The rescue team charged ${rescueFee.toLocaleString()} Meseta for their services.`
    : `The rescue team waived their fee since you had no Meseta.`;

  return `
*** YOU HAVE BEEN DEFEATED! ***

A rescue team found you unconscious and brought you back to Dairon City.
${feeMessage}
Your wounds have been treated, but you lost all progress in the field.

You wake up in the city, ready to try again.`;
}

/**
 * Map field area to enemy area
 */
function fieldToEnemyArea(fieldId: string): 'gurhacia' | 'rioh' | 'ozette' | 'paru' | 'makara' | 'arca' | 'dark' {
  if (fieldId.includes('gurhacia') || fieldId.includes('valley')) return 'gurhacia';
  if (fieldId.includes('rioh') || fieldId.includes('snow')) return 'rioh';
  if (fieldId.includes('ozette') || fieldId.includes('wetland')) return 'ozette';
  if (fieldId.includes('paru') || fieldId.includes('city')) return 'paru';
  if (fieldId.includes('makara') || fieldId.includes('ruins')) return 'makara';
  if (fieldId.includes('arca') || fieldId.includes('plant')) return 'arca';
  if (fieldId.includes('dark') || fieldId.includes('shrine')) return 'dark';
  return 'gurhacia';
}

/**
 * Generate enemy stats based on difficulty and level
 */
function generateEnemyStats(enemyId: string, difficulty: Difficulty, playerLevel: number): CombatStats {
  const difficultyMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;
  const levelMult = 1 + (playerLevel - 1) * 0.1;

  // Base stats vary by enemy type (simplified)
  const isElite = enemyId.includes('lion') || enemyId.includes('gorilla') || enemyId.includes('boss');
  const isBoss = enemyId.startsWith('boss_');
  const baseHp = isBoss ? 500 : isElite ? 100 : 50;
  const baseAtk = isBoss ? 50 : isElite ? 25 : 15;
  const baseDef = isBoss ? 30 : isElite ? 15 : 8;

  return {
    hp: Math.floor(baseHp * difficultyMult * levelMult),
    maxHp: Math.floor(baseHp * difficultyMult * levelMult),
    attack: Math.floor(baseAtk * difficultyMult * levelMult),
    defense: Math.floor(baseDef * difficultyMult * levelMult),
    accuracy: 70 + (difficulty === 'super-hard' ? 10 : 0),
    evasion: 10 + (isElite ? 10 : 0),
  };
}

/**
 * Get player combat stats (simplified)
 */
function getPlayerCombatStats(): CombatStats & { luck: number } {
  if (!currentCharacter) {
    return { hp: 100, maxHp: 100, attack: 20, defense: 10, accuracy: 80, evasion: 15, luck: 10 };
  }

  const level = currentCharacter.level;

  // Base stats from level
  let defense = 8 + level * 2;
  let evasion = 10 + level;

  // Add equipment bonuses
  if (equippedItems.frame) {
    defense += equippedItems.frame.defense;
    evasion += equippedItems.frame.evasion;
  }

  return {
    hp: 100 + level * 20,
    maxHp: 100 + level * 20,
    attack: 15 + level * 3,
    defense,
    accuracy: 75 + level,
    evasion,
    luck: 10 + Math.floor(level / 2),
  };
}

/**
 * Get player weapon stats from equipped weapon
 */
function getPlayerWeaponStats(): WeaponStats & { critBonus: number } {
  const weapon = equippedItems.weapon;

  if (!weapon) {
    // Unarmed stats
    return {
      attack: 5,
      accuracy: 5,
      element: null,
      elementPercent: 0,
      grindBonus: 0,
      critBonus: 3,
    };
  }

  return {
    attack: weapon.attack + (weapon.grindLevel * 2),
    accuracy: weapon.accuracy,
    element: weapon.element as Element | null,
    elementPercent: weapon.elementPercent || 0,
    grindBonus: weapon.grindLevel * 2,
    critBonus: 5 + Math.floor(weapon.attack / 20),
  };
}

function executeSpawnEnemies(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field. Use enter-field first.' };
  }

  const session = getSessionState();
  if (!session.activeId) {
    return { success: false, message: 'No active session.' };
  }

  // Get current stage info
  const stage = getCurrentStage();
  const variant = stage && 'variant' in stage ? stage.variant : 'a';

  // Clear existing enemies
  currentEnemies = [];
  combatLog = [];

  // Get enemy area and difficulty
  const enemyArea = fieldToEnemyArea(session.activeId);
  const difficulty = session.difficulty;
  const seed = Date.now() + currentWave; // Different seed for each wave
  const random = createSeededRandom(seed);

  // Set total waves based on stage variant (only on first spawn of stage)
  // Fields: a: 5 waves, e: 1 wave (transition), b: 5 waves, z: boss only
  // Missions: 3 waves per stage (shorter, more focused experience)
  if (currentWave === 0) {
    const isMission = session.activeType === 'mission';
    if (isMission) {
      totalWaves = 3; // Missions have 3 waves per stage
    } else {
      totalWaves = variant === 'e' ? 1 : variant === 'z' ? 1 : 5;
    }
    currentWave = 1;
  }

  if (variant === 'z') {
    // Boss stage - spawn the area boss
    const bossId = getBossForArea(enemyArea);
    if (bossId) {
      const stats = generateBossStats(bossId, difficulty, currentCharacter.level);
      const element = getEnemyElement(bossId);
      const diffMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;

      currentEnemies.push({
        id: ++enemyIdCounter,
        enemyId: bossId,
        name: getEnemyDisplayName(bossId),
        stats,
        element,
        expValue: Math.floor(2000 * diffMult * (1 + currentCharacter.level * 0.1)),
        mesetaValue: Math.floor(5000 * diffMult),
      });
    }

    const enemyList = currentEnemies.map((e, i) => `  [${i}] ${e.name} - HP: ${e.stats.hp}/${e.stats.maxHp}`);
    combatLog.push(`BOSS BATTLE! ${currentEnemies[0]?.name || 'Unknown'}`);

    return {
      success: true,
      message: `BOSS BATTLE!\n${enemyList.join('\n')}`,
      data: { enemies: currentEnemies.length, area: enemyArea, difficulty, isBoss: true, wave: 1, totalWaves: 1 },
    };
  }

  // Spawn one wave of enemies (3 enemies per wave)
  const composition = generateEnemyComposition(enemyArea, difficulty, random);

  let enemiesThisWave = 0;
  for (const entry of composition) {
    if (enemiesThisWave >= 3) break; // Max 3 enemies per wave
    for (let i = 0; i < Math.min(entry.count, 2); i++) {
      const stats = generateEnemyStats(entry.enemyId, difficulty, currentCharacter.level);
      const element = getEnemyElement(entry.enemyId);

      const diffMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;
      const expValue = Math.floor(50 * diffMult * (1 + currentCharacter.level * 0.1));
      const mesetaValue = Math.floor(100 * diffMult);

      currentEnemies.push({
        id: ++enemyIdCounter,
        enemyId: entry.enemyId,
        name: getEnemyDisplayName(entry.enemyId),
        stats,
        element,
        expValue,
        mesetaValue,
      });
      enemiesThisWave++;
      if (enemiesThisWave >= 3) break;
    }
  }

  const enemyList = currentEnemies.map((e, i) => `  [${i}] ${e.name} - HP: ${e.stats.hp}/${e.stats.maxHp}`);
  combatLog.push(`Wave ${currentWave}/${totalWaves} - ${currentEnemies.length} enemies`);

  return {
    success: true,
    message: `Wave ${currentWave}/${totalWaves} (${enemyArea}, ${difficulty}):\n${enemyList.join('\n')}`,
    data: { enemies: currentEnemies.length, area: enemyArea, difficulty, wave: currentWave, totalWaves },
  };
}

/**
 * Spawn enemies for the current wave (used when auto-spawning next wave)
 */
function spawnWaveEnemies(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  const session = getSessionState();
  if (!session.activeId) {
    return { success: false, message: 'No active session.' };
  }

  const enemyArea = fieldToEnemyArea(session.activeId);
  const difficulty = session.difficulty;
  const seed = Date.now() + currentWave;
  const random = createSeededRandom(seed);

  // Clear existing enemies but keep drops
  currentEnemies = [];

  // Spawn one wave of enemies (3 enemies per wave)
  const composition = generateEnemyComposition(enemyArea, difficulty, random);

  let enemiesThisWave = 0;
  for (const entry of composition) {
    if (enemiesThisWave >= 3) break;
    for (let i = 0; i < Math.min(entry.count, 2); i++) {
      const stats = generateEnemyStats(entry.enemyId, difficulty, currentCharacter.level);
      const element = getEnemyElement(entry.enemyId);

      const diffMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;
      const expValue = Math.floor(50 * diffMult * (1 + currentCharacter.level * 0.1));
      const mesetaValue = Math.floor(100 * diffMult);

      currentEnemies.push({
        id: ++enemyIdCounter,
        enemyId: entry.enemyId,
        name: getEnemyDisplayName(entry.enemyId),
        stats,
        element,
        expValue,
        mesetaValue,
      });
      enemiesThisWave++;
      if (enemiesThisWave >= 3) break;
    }
  }

  const enemyList = currentEnemies.map((e, i) => `  [${i}] ${e.name} - HP: ${e.stats.hp}/${e.stats.maxHp}`);
  combatLog.push(`Wave ${currentWave}/${totalWaves} spawned`);

  return {
    success: true,
    message: `\nWave ${currentWave}/${totalWaves}:\n${enemyList.join('\n')}`,
    data: { enemies: currentEnemies.length, area: enemyArea, difficulty, wave: currentWave, totalWaves },
  };
}

/**
 * Generate boss stats (stronger than regular enemies)
 */
function generateBossStats(bossId: string, difficulty: Difficulty, playerLevel: number): CombatStats {
  const difficultyMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;
  const levelMult = 1 + (playerLevel - 1) * 0.1;

  // Base boss stats (much higher than regular enemies)
  const baseHp = 500;
  const baseAtk = 80;
  const baseDef = 40;

  return {
    hp: Math.floor(baseHp * difficultyMult * levelMult),
    maxHp: Math.floor(baseHp * difficultyMult * levelMult),
    attack: Math.floor(baseAtk * difficultyMult * levelMult),
    defense: Math.floor(baseDef * difficultyMult * levelMult),
    accuracy: 90,
    evasion: 15,
    critRate: 10,
    critDamage: 1.5,
    attackSpeed: 1.0,
  };
}

function executeShowEnemies(): CommandResult {
  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field.' };
  }

  if (currentEnemies.length === 0) {
    return {
      success: true,
      message: 'No enemies in the area. All cleared!',
      data: { enemies: [] },
    };
  }

  const enemyList = currentEnemies.map((e, i) => {
    const hpPercent = Math.floor((e.stats.hp / e.stats.maxHp) * 100);
    const healthBar = hpPercent > 50 ? '█' : hpPercent > 25 ? '▓' : '░';
    return `  [${i}] ${e.name.padEnd(20)} HP: ${e.stats.hp.toString().padStart(4)}/${e.stats.maxHp} ${healthBar.repeat(Math.ceil(hpPercent / 10))}`;
  });

  return {
    success: true,
    message: `Enemies (${currentEnemies.length}):\n${enemyList.join('\n')}`,
    data: { enemies: currentEnemies },
  };
}

function executeAttack(targetIndex: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field.' };
  }

  if (!playerCombatState) {
    return { success: false, message: 'Combat state not initialized.' };
  }

  if (playerCombatState.hp <= 0) {
    const defeatMessage = handlePlayerDefeat();
    return { success: true, message: defeatMessage };
  }

  // Process status effects at start of turn
  const statusResult = processPlayerStatusEffects();
  const statusMessages = statusResult.messages;

  // Apply status damage
  if (statusResult.damage > 0) {
    playerCombatState.hp = Math.max(0, playerCombatState.hp - statusResult.damage);
    if (playerCombatState.hp <= 0) {
      combatLog.push('PLAYER DEFEATED (status)');
      const defeatMessage = handlePlayerDefeat();
      statusMessages.push(defeatMessage);
      return {
        success: true,
        message: statusMessages.join('\n'),
        data: { playerHp: 0, defeated: true },
      };
    }
  }

  // Check if can act (paralysis/freeze)
  if (!statusResult.canAct) {
    statusMessages.push(`Your HP: ${playerCombatState.hp}/${playerCombatState.maxHp}`);
    return {
      success: true,
      message: statusMessages.join('\n'),
      data: { playerHp: playerCombatState.hp, canAct: false },
    };
  }

  if (currentEnemies.length === 0) {
    return { success: false, message: 'No enemies to attack. Use spawn-enemies first.' };
  }

  if (targetIndex < 0 || targetIndex >= currentEnemies.length) {
    return { success: false, message: `Invalid target. Choose 0-${currentEnemies.length - 1}.` };
  }

  const target = currentEnemies[targetIndex];
  const playerStats = getPlayerCombatStats();
  const weaponStats = getPlayerWeaponStats();

  // Resolve attack
  const result = resolveAttack({
    attacker: playerStats,
    weapon: weaponStats,
    defender: { ...target.stats, weakness: target.element },
  });

  const lines: string[] = [...statusMessages]; // Include status effect messages
  let droppedItem: ConsumableItem | null = null;

  if (!result.hit) {
    lines.push(`Attack missed ${target.name}!`);
    combatLog.push(`MISS: ${target.name}`);
  } else {
    // Apply damage
    target.stats = applyDamage(target.stats, result.totalDamage);

    const critText = result.critical ? ' CRITICAL!' : '';
    lines.push(`Hit ${target.name} for ${result.totalDamage} damage!${critText}`);
    combatLog.push(`HIT: ${target.name} for ${result.totalDamage}${critText}`);

    if (isDefeated(target.stats)) {
      lines.push(`${target.name} defeated!`);
      lines.push(`  +${target.expValue} EXP`);

      // Drop meseta on ground
      if (target.mesetaValue > 0) {
        droppedItems.push({
          id: ++droppedItemIdCounter,
          type: 'meseta',
          meseta: target.mesetaValue,
        });
        lines.push(`  Dropped: ${target.mesetaValue} Meseta!`);
        combatLog.push(`DROP: ${target.mesetaValue} Meseta`);
      }

      // Roll for item drop (20% chance)
      droppedItem = rollItemDrop();
      if (droppedItem) {
        lines.push(`  Dropped: ${droppedItem.name}!`);
        combatLog.push(`DROP: ${droppedItem.name}`);

        // Add to dropped items on ground (not inventory)
        droppedItems.push({
          id: ++droppedItemIdCounter,
          type: 'item',
          item: droppedItem,
        });
      }

      // Award exp only (meseta must be picked up)
      const oldLevel = currentCharacter.level;
      currentCharacter = {
        ...currentCharacter,
        experience: currentCharacter.experience + target.expValue,
        level: getLevelForExp(currentCharacter.experience + target.expValue),
      };

      if (currentCharacter.level > oldLevel) {
        lines.push(`  LEVEL UP! Now level ${currentCharacter.level}!`);
        combatLog.push(`LEVEL UP: ${oldLevel} → ${currentCharacter.level}`);

        // Restore HP/TP on level up
        playerCombatState.maxHp = 100 + currentCharacter.level * 20;
        playerCombatState.maxTp = 50 + currentCharacter.level * 10;
        playerCombatState.hp = playerCombatState.maxHp;
        playerCombatState.tp = playerCombatState.maxTp;
      }

      combatLog.push(`KILL: ${target.name} (+${target.expValue} EXP, +${target.mesetaValue} Meseta)`);

      // Remove defeated enemy
      currentEnemies.splice(targetIndex, 1);

      if (currentEnemies.length === 0) {
        // Check if there are more waves
        if (currentWave < totalWaves) {
          lines.push(`\nWave ${currentWave}/${totalWaves} cleared!`);
          // Auto-spawn next wave
          currentWave++;
          const spawnResult = spawnWaveEnemies();
          lines.push(spawnResult.message);
        } else {
          lines.push('\nAll waves cleared! Use next-stage to continue or complete-field to finish.');
        }
      }
    } else {
      lines.push(`  ${target.name} HP: ${target.stats.hp}/${target.stats.maxHp}`);
    }
  }

  // Enemy counter-attack (if any enemies remain and player didn't kill)
  if (currentEnemies.length > 0 && playerCombatState.hp > 0) {
    // Random enemy attacks back
    const attacker = currentEnemies[Math.floor(Math.random() * currentEnemies.length)];

    // Simple attack calculation
    const enemyDamage = Math.max(1, Math.floor(attacker.stats.attack * (0.8 + Math.random() * 0.4) - playerStats.defense * 0.5));
    const hitChance = Math.random() * 100;

    if (hitChance < attacker.stats.accuracy) {
      playerCombatState.hp = Math.max(0, playerCombatState.hp - enemyDamage);
      lines.push(`\n${attacker.name} counter-attacks for ${enemyDamage} damage!`);
      lines.push(`  Your HP: ${playerCombatState.hp}/${playerCombatState.maxHp}`);
      combatLog.push(`ENEMY HIT: ${attacker.name} deals ${enemyDamage}`);

      // Maybe apply status effect from enemy element
      const statusApplied = maybeApplyStatusEffect(attacker.element);
      if (statusApplied) {
        lines.push(`  ${statusApplied}`);
        combatLog.push(`STATUS: ${statusApplied}`);
      }

      if (playerCombatState.hp <= 0) {
        combatLog.push('PLAYER DEFEATED');
        const defeatMessage = handlePlayerDefeat();
        lines.push(defeatMessage);
      }
    } else {
      lines.push(`\n${attacker.name} attacks but misses!`);
      combatLog.push(`ENEMY MISS: ${attacker.name}`);
    }
  }

  return {
    success: true,
    message: lines.join('\n'),
    data: {
      result,
      targetHp: target.stats.hp,
      enemiesRemaining: currentEnemies.length,
      playerHp: playerCombatState.hp,
      droppedItem,
    },
  };
}

// Drop table items
const DROP_TABLE: ConsumableItem[] = [
  { id: 'monomate', name: 'Monomate', description: 'Restores a small amount of HP.', type: 'consumable', effect: 'heal_hp', effectValue: 100, rarity: 1, sellPrice: 25, stackable: true, maxStack: 10 },
  { id: 'monofluid', name: 'Monofluid', description: 'Restores a small amount of TP.', type: 'consumable', effect: 'heal_tp', effectValue: 50, rarity: 1, sellPrice: 50, stackable: true, maxStack: 10 },
  { id: 'dimate', name: 'Dimate', description: 'Restores a moderate amount of HP.', type: 'consumable', effect: 'heal_hp', effectValue: 200, rarity: 2, sellPrice: 75, stackable: true, maxStack: 10 },
  { id: 'difluid', name: 'Difluid', description: 'Restores a moderate amount of TP.', type: 'consumable', effect: 'heal_tp', effectValue: 100, rarity: 2, sellPrice: 100, stackable: true, maxStack: 10 },
];

/**
 * Roll for item drop from defeated enemy
 */
function rollItemDrop(): ConsumableItem | null {
  const roll = Math.random();

  // 20% drop chance
  if (roll > 0.20) return null;

  // Drop table
  const dropRoll = Math.random();
  if (dropRoll < 0.50) {
    return DROP_TABLE[0]; // monomate
  } else if (dropRoll < 0.75) {
    return DROP_TABLE[1]; // monofluid
  } else if (dropRoll < 0.90) {
    return DROP_TABLE[2]; // dimate
  } else {
    return DROP_TABLE[3]; // difluid
  }
}

/**
 * Process player status effects at start of turn
 * Returns messages about what happened and whether player can act
 */
function processPlayerStatusEffects(): { messages: string[]; canAct: boolean; damage: number } {
  const messages: string[] = [];
  let canAct = true;
  let totalDamage = 0;

  for (let i = playerStatusEffects.length - 1; i >= 0; i--) {
    const effect = playerStatusEffects[i];

    switch (effect.type) {
      case 'poison':
        const poisonDmg = effect.damagePerTurn || 10;
        totalDamage += poisonDmg;
        messages.push(`Poison deals ${poisonDmg} damage!`);
        break;

      case 'burn':
        const burnDmg = effect.damagePerTurn || 15;
        totalDamage += burnDmg;
        messages.push(`Burn deals ${burnDmg} damage!`);
        break;

      case 'paralysis':
        if (Math.random() < 0.5) {
          canAct = false;
          messages.push(`Paralyzed! Cannot move!`);
        }
        break;

      case 'freeze':
        canAct = false;
        messages.push(`Frozen solid! Cannot move!`);
        break;
    }

    // Decrement duration
    effect.turnsRemaining--;
    if (effect.turnsRemaining <= 0) {
      const effectNames: Record<string, string> = {
        poison: 'Poison', paralysis: 'Paralysis', burn: 'Burn', freeze: 'Freeze'
      };
      messages.push(`${effectNames[effect.type]} wore off.`);
      playerStatusEffects.splice(i, 1);
    }
  }

  return { messages, canAct, damage: totalDamage };
}

/**
 * Maybe apply a status effect from an enemy attack
 */
function maybeApplyStatusEffect(enemyElement: Element | null): string | null {
  // 15% chance to apply status based on enemy element
  if (Math.random() > 0.15) return null;

  let effect: StatusEffect | null = null;

  if (enemyElement === 'fire') {
    effect = { type: 'burn', turnsRemaining: 3, damagePerTurn: 15 };
  } else if (enemyElement === 'ice') {
    effect = { type: 'freeze', turnsRemaining: 2 };
  } else if (enemyElement === 'lightning') {
    effect = { type: 'paralysis', turnsRemaining: 3 };
  } else {
    // Generic enemies can poison
    if (Math.random() < 0.5) {
      effect = { type: 'poison', turnsRemaining: 4, damagePerTurn: 10 };
    }
  }

  if (effect) {
    // Check if already has this effect
    const existing = playerStatusEffects.find(e => e.type === effect!.type);
    if (!existing) {
      playerStatusEffects.push(effect);
      const effectNames: Record<string, string> = {
        poison: 'Poisoned!', paralysis: 'Paralyzed!', burn: 'Burning!', freeze: 'Frozen!'
      };
      return effectNames[effect.type];
    }
  }

  return null;
}

function executeNextStage(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field.' };
  }

  if (currentEnemies.length > 0) {
    return { success: false, message: `Defeat all enemies first (${currentEnemies.length} remaining).` };
  }

  // Check if there are more waves in the current stage
  if (currentWave < totalWaves) {
    return { success: false, message: `Clear all waves first (${currentWave}/${totalWaves}).` };
  }

  const advanced = advanceToNextStage();
  if (!advanced) {
    return { success: false, message: 'Cannot advance. Already at final stage or not in session.' };
  }

  // Clear dropped items from previous stage
  droppedItems = [];

  // Reset wave tracking for new stage
  currentWave = 0;
  totalWaves = 1;

  const session = getSessionState();
  combatLog.push(`Advanced to stage ${session.currentStageIndex + 1}`);

  // Auto-spawn enemies for the new stage
  const spawnResult = executeSpawnEnemies();

  return {
    success: true,
    message: `Advanced to stage ${session.currentStageIndex + 1}.\n${spawnResult.message}`,
    data: { stage: session.currentStageIndex + 1 },
  };
}

function executeCompleteField(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field.' };
  }

  if (!isInSession()) {
    return { success: false, message: 'No active session.' };
  }

  // Check if this is a mission or field
  const session = getSessionState();
  const isMission = session.activeType === 'mission';

  // Complete the session
  const result = completeSession(true);
  if (!result) {
    return { success: false, message: 'Failed to complete session.' };
  }

  currentEnemies = [];

  if (isMission) {
    // Missions return to guild for reward claiming
    currentLocation = 'guild';
    combatLog.push('Mission completed!');
    return {
      success: true,
      message: `═══════════════════════════════════════\n        MISSION COMPLETE!\n═══════════════════════════════════════\n\nGrade: ${result.grade}\nEXP Earned: ${result.expGained.toLocaleString()}\nMeseta Earned: ${result.mesetaGained.toLocaleString()}\n\nRewards have been added to your inventory.`,
      data: result,
    };
  } else {
    // Fields return to city
    currentLocation = 'city';
    combatLog.push('Field completed!');
    return {
      success: true,
      message: `Field complete! Rewards collected.\nGrade: ${result.grade}, EXP: ${result.expGained}, Meseta: ${result.mesetaGained}`,
      data: result,
    };
  }
}

function executeCombatLog(): CommandResult {
  if (combatLog.length === 0) {
    return {
      success: true,
      message: 'Combat log is empty.',
      data: { log: [] },
    };
  }

  const recent = combatLog.slice(-20);
  return {
    success: true,
    message: `Combat Log (last ${recent.length}):\n  ${recent.join('\n  ')}`,
    data: { log: recent },
  };
}

/**
 * Use a consumable item
 */
function executeUseItem(itemId: string): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (!playerCombatState) {
    return { success: false, message: 'Not in combat. Enter a field first.' };
  }

  // Check if item is in inventory
  const item = inventory.get(itemId.toLowerCase());
  if (!item || item.quantity <= 0) {
    return { success: false, message: `No ${itemId} in inventory.` };
  }

  // Item effects
  const itemEffects: Record<string, { type: 'hp' | 'tp'; value: number; name: string }> = {
    'monomate': { type: 'hp', value: 100, name: 'Monomate' },
    'dimate': { type: 'hp', value: 200, name: 'Dimate' },
    'trimate': { type: 'hp', value: 500, name: 'Trimate' },
    'monofluid': { type: 'tp', value: 50, name: 'Monofluid' },
    'difluid': { type: 'tp', value: 100, name: 'Difluid' },
    'trifluid': { type: 'tp', value: 200, name: 'Trifluid' },
  };

  const effect = itemEffects[itemId.toLowerCase()];
  if (!effect) {
    return { success: false, message: `Cannot use ${itemId} - not a usable item.` };
  }

  // Apply effect
  let healed = 0;
  if (effect.type === 'hp') {
    const oldHp = playerCombatState.hp;
    playerCombatState.hp = Math.min(playerCombatState.maxHp, playerCombatState.hp + effect.value);
    healed = playerCombatState.hp - oldHp;
  } else {
    const oldTp = playerCombatState.tp;
    playerCombatState.tp = Math.min(playerCombatState.maxTp, playerCombatState.tp + effect.value);
    healed = playerCombatState.tp - oldTp;
  }

  // Consume item
  item.quantity -= 1;
  if (item.quantity <= 0) {
    inventory.delete(itemId.toLowerCase());
  }

  const statName = effect.type === 'hp' ? 'HP' : 'TP';
  const current = effect.type === 'hp' ? playerCombatState.hp : playerCombatState.tp;
  const max = effect.type === 'hp' ? playerCombatState.maxHp : playerCombatState.maxTp;

  combatLog.push(`USED: ${effect.name} (+${healed} ${statName})`);

  return {
    success: true,
    message: `Used ${effect.name}. Restored ${healed} ${statName}.\n${statName}: ${current}/${max}`,
    data: { itemId, healed, hp: playerCombatState.hp, tp: playerCombatState.tp },
  };
}

/**
 * Pick up a dropped item from the ground
 */
function executePickupItem(dropId: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  const dropIndex = droppedItems.findIndex(d => d.id === dropId);
  if (dropIndex === -1) {
    return { success: false, message: 'Item not found on ground.' };
  }

  const drop = droppedItems[dropIndex];

  if (drop.type === 'meseta' && drop.meseta) {
    // Add meseta to character
    currentCharacter = {
      ...currentCharacter,
      meseta: (currentCharacter.meseta ?? 0) + drop.meseta,
    };

    // Remove from ground
    droppedItems.splice(dropIndex, 1);

    combatLog.push(`PICKUP: ${drop.meseta} Meseta`);

    return {
      success: true,
      message: `Picked up ${drop.meseta} Meseta!`,
      data: { meseta: drop.meseta },
    };
  } else if (drop.type === 'item' && drop.item) {
    // Check stack limit for consumables
    const existing = inventory.get(drop.item.id);
    const isConsumable = drop.item.type === 'consumable';
    const maxStack = getMaxStack(drop.item.id);

    if (isConsumable && existing && existing.quantity >= maxStack) {
      return {
        success: false,
        message: `Cannot carry more ${drop.item.name}. (Max: ${maxStack})`,
      };
    }

    // Add to inventory
    if (existing) {
      existing.quantity += 1;
    } else {
      inventory.set(drop.item.id, { item: drop.item, quantity: 1 });
    }

    // Remove from ground
    droppedItems.splice(dropIndex, 1);

    combatLog.push(`PICKUP: ${drop.item.name}`);

    return {
      success: true,
      message: `Picked up ${drop.item.name}!`,
      data: { itemId: drop.item.id },
    };
  }

  return { success: false, message: 'Invalid drop.' };
}

/**
 * Pick up all dropped items from the ground
 */
function executePickupAll(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (droppedItems.length === 0) {
    return { success: false, message: 'No items on ground.' };
  }

  const pickedUp: string[] = [];
  const leftOnGround: typeof droppedItems = [];
  let totalMeseta = 0;

  for (const drop of droppedItems) {
    if (drop.type === 'meseta' && drop.meseta) {
      totalMeseta += drop.meseta;
      combatLog.push(`PICKUP: ${drop.meseta} Meseta`);
    } else if (drop.type === 'item' && drop.item) {
      const existing = inventory.get(drop.item.id);
      const isConsumable = drop.item.type === 'consumable';
      const maxStack = getMaxStack(drop.item.id);

      // Check stack limit for consumables
      if (isConsumable && existing && existing.quantity >= maxStack) {
        leftOnGround.push(drop);
        continue;
      }

      if (existing) {
        existing.quantity += 1;
      } else {
        inventory.set(drop.item.id, { item: drop.item, quantity: 1 });
      }
      pickedUp.push(drop.item.name);
      combatLog.push(`PICKUP: ${drop.item.name}`);
    }
  }

  // Add collected meseta
  if (totalMeseta > 0) {
    currentCharacter = {
      ...currentCharacter,
      meseta: (currentCharacter.meseta ?? 0) + totalMeseta,
    };
    pickedUp.push(`${totalMeseta} Meseta`);
  }

  // Keep items that couldn't be picked up on ground
  droppedItems = leftOnGround;

  if (pickedUp.length === 0) {
    return {
      success: false,
      message: 'Cannot pick up any more items. Inventory full.',
    };
  }

  const leftMessage = leftOnGround.length > 0
    ? `\n(${leftOnGround.length} item(s) left on ground - stack full)`
    : '';

  return {
    success: true,
    message: `Picked up: ${pickedUp.join(', ')}${leftMessage}`,
    data: { items: pickedUp, meseta: totalMeseta, leftOnGround: leftOnGround.length },
  };
}

/**
 * Show player HP/TP status
 */
function executeShowPlayerHp(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (!playerCombatState) {
    return { success: false, message: 'Not in combat. Enter a field first.' };
  }

  const hpPercent = Math.floor((playerCombatState.hp / playerCombatState.maxHp) * 100);
  const tpPercent = Math.floor((playerCombatState.tp / playerCombatState.maxTp) * 100);

  const hpBar = '█'.repeat(Math.ceil(hpPercent / 10)) + '░'.repeat(10 - Math.ceil(hpPercent / 10));
  const tpBar = '█'.repeat(Math.ceil(tpPercent / 10)) + '░'.repeat(10 - Math.ceil(tpPercent / 10));

  const status = playerCombatState.hp <= 0 ? ' *** DEFEATED ***' : '';

  // Show active buffs
  const buffLines: string[] = [];
  for (const buff of activeBuffs) {
    buffLines.push(`  ${buff.type === 'shifta' ? 'Shifta' : 'Deband'}: +${buff.power}% (${buff.turnsRemaining} turns)`);
  }
  const buffStr = buffLines.length > 0 ? `\nBuffs:\n${buffLines.join('\n')}` : '';

  // Show status effects
  const statusLines: string[] = [];
  for (const effect of playerStatusEffects) {
    const effectNames: Record<string, string> = {
      poison: '🟢 Poison',
      paralysis: '⚡ Paralysis',
      burn: '🔥 Burn',
      freeze: '❄️ Freeze',
    };
    statusLines.push(`  ${effectNames[effect.type]} (${effect.turnsRemaining} turns)`);
  }
  const statusStr = statusLines.length > 0 ? `\nStatus:\n${statusLines.join('\n')}` : '';

  return {
    success: true,
    message: `Player Status:${status}
  HP: ${playerCombatState.hp.toString().padStart(4)}/${playerCombatState.maxHp} [${hpBar}] ${hpPercent}%
  TP: ${playerCombatState.tp.toString().padStart(4)}/${playerCombatState.maxTp} [${tpBar}] ${tpPercent}%${buffStr}${statusStr}`,
    data: playerCombatState,
  };
}

/**
 * List available techniques
 */
function executeListTechniques(): CommandResult {
  const lines = ['Available Techniques:'];

  for (const tech of Object.values(TECHNIQUES)) {
    const typeStr = tech.type === 'attack' ? `[${tech.element?.toUpperCase()}]` : `[${tech.type.toUpperCase()}]`;
    lines.push(`  ${tech.name.padEnd(10)} ${typeStr.padEnd(12)} TP: ${tech.tpCost.toString().padStart(2)}  ${tech.description}`);
  }

  return {
    success: true,
    message: lines.join('\n'),
    data: TECHNIQUES,
  };
}

/**
 * Cast a technique
 */
function executeCastTechnique(techId: string, targetIndex?: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'field') {
    return { success: false, message: 'You must be in a field.' };
  }

  if (!playerCombatState) {
    return { success: false, message: 'Combat state not initialized.' };
  }

  if (playerCombatState.hp <= 0) {
    return { success: false, message: 'You are defeated!' };
  }

  const tech = TECHNIQUES[techId];
  if (!tech) {
    return { success: false, message: `Unknown technique: ${techId}. Use list-techniques to see options.` };
  }

  if (playerCombatState.tp < tech.tpCost) {
    return { success: false, message: `Not enough TP! Need ${tech.tpCost}, have ${playerCombatState.tp}.` };
  }

  // Consume TP
  playerCombatState.tp -= tech.tpCost;
  const lines: string[] = [];

  if (tech.type === 'attack') {
    // Attack technique - requires target
    if (currentEnemies.length === 0) {
      playerCombatState.tp += tech.tpCost; // Refund
      return { success: false, message: 'No enemies to target.' };
    }

    const actualTarget = targetIndex ?? 0;
    if (actualTarget < 0 || actualTarget >= currentEnemies.length) {
      playerCombatState.tp += tech.tpCost; // Refund
      return { success: false, message: `Invalid target. Choose 0-${currentEnemies.length - 1}.` };
    }

    const target = currentEnemies[actualTarget];

    // Calculate technique damage (base power + level scaling)
    const level = currentCharacter.level;
    let damage = tech.power + level * 5;

    // Apply shifta buff
    const shiftaBuff = activeBuffs.find(b => b.type === 'shifta');
    if (shiftaBuff) {
      damage = Math.floor(damage * (1 + shiftaBuff.power / 100));
    }

    // Check for elemental weakness (simplified)
    const weaknessBonus = 1.5;
    let isWeak = false;
    if (tech.element === 'fire' && target.element === 'ice') isWeak = true;
    if (tech.element === 'ice' && target.element === 'fire') isWeak = true;
    if (tech.element === 'lightning') isWeak = true; // Lightning is broadly effective

    if (isWeak) {
      damage = Math.floor(damage * weaknessBonus);
      lines.push(`${tech.name} hits ${target.name} for ${damage} damage! WEAKNESS!`);
    } else {
      lines.push(`${tech.name} hits ${target.name} for ${damage} damage!`);
    }

    target.stats = applyDamage(target.stats, damage);
    combatLog.push(`TECH: ${tech.name} → ${target.name} for ${damage}`);

    if (isDefeated(target.stats)) {
      lines.push(`${target.name} defeated!`);
      lines.push(`  +${target.expValue} EXP, +${target.mesetaValue} Meseta`);

      // Award exp and meseta
      const oldLevel = currentCharacter.level;
      currentCharacter = {
        ...currentCharacter,
        experience: currentCharacter.experience + target.expValue,
        level: getLevelForExp(currentCharacter.experience + target.expValue),
        meseta: (currentCharacter.meseta ?? 0) + target.mesetaValue,
      };

      if (currentCharacter.level > oldLevel) {
        lines.push(`  LEVEL UP! Now level ${currentCharacter.level}!`);
        playerCombatState.maxHp = 100 + currentCharacter.level * 20;
        playerCombatState.maxTp = 50 + currentCharacter.level * 10;
        playerCombatState.hp = playerCombatState.maxHp;
        playerCombatState.tp = playerCombatState.maxTp;
      }

      combatLog.push(`KILL: ${target.name}`);
      currentEnemies.splice(actualTarget, 1);

      if (currentEnemies.length === 0) {
        // Check if there are more waves
        if (currentWave < totalWaves) {
          lines.push(`\nWave ${currentWave}/${totalWaves} cleared!`);
          // Auto-spawn next wave
          currentWave++;
          const spawnResult = spawnWaveEnemies();
          lines.push(spawnResult.message);
        } else {
          lines.push('\nAll waves cleared! Use next-stage to continue or complete-field to finish.');
        }
      }
    } else {
      lines.push(`  ${target.name} HP: ${target.stats.hp}/${target.stats.maxHp}`);
    }

  } else if (tech.type === 'heal') {
    // Healing technique
    const healAmount = tech.power + currentCharacter.level * 10;
    const oldHp = playerCombatState.hp;
    playerCombatState.hp = Math.min(playerCombatState.maxHp, playerCombatState.hp + healAmount);
    const healed = playerCombatState.hp - oldHp;

    lines.push(`${tech.name} restores ${healed} HP!`);
    lines.push(`  HP: ${playerCombatState.hp}/${playerCombatState.maxHp}`);
    combatLog.push(`HEAL: ${tech.name} +${healed} HP`);

  } else if (tech.type === 'buff') {
    // Buff technique
    const buffType = techId === 'shifta' ? 'shifta' : 'deband';
    const existing = activeBuffs.find(b => b.type === buffType);

    if (existing) {
      existing.turnsRemaining = 5;
      existing.power = tech.power + Math.floor(currentCharacter.level / 2);
      lines.push(`${tech.name} refreshed! +${existing.power}% ${buffType === 'shifta' ? 'ATK' : 'DEF'} for 5 turns.`);
    } else {
      const power = tech.power + Math.floor(currentCharacter.level / 2);
      activeBuffs.push({ type: buffType, turnsRemaining: 5, power });
      lines.push(`${tech.name} cast! +${power}% ${buffType === 'shifta' ? 'ATK' : 'DEF'} for 5 turns.`);
    }
    combatLog.push(`BUFF: ${tech.name}`);
  }

  lines.push(`  TP: ${playerCombatState.tp}/${playerCombatState.maxTp}`);

  // Decrement buff durations
  for (let i = activeBuffs.length - 1; i >= 0; i--) {
    activeBuffs[i].turnsRemaining--;
    if (activeBuffs[i].turnsRemaining <= 0) {
      const expiredBuff = activeBuffs.splice(i, 1)[0];
      lines.push(`  ${expiredBuff.type === 'shifta' ? 'Shifta' : 'Deband'} wore off!`);
    }
  }

  // Enemy counter-attack
  if (currentEnemies.length > 0 && playerCombatState.hp > 0) {
    const attacker = currentEnemies[Math.floor(Math.random() * currentEnemies.length)];
    const playerStats = getPlayerCombatStats();

    let defense = playerStats.defense;
    const debandBuff = activeBuffs.find(b => b.type === 'deband');
    if (debandBuff) {
      defense = Math.floor(defense * (1 + debandBuff.power / 100));
    }

    const enemyDamage = Math.max(1, Math.floor(attacker.stats.attack * (0.8 + Math.random() * 0.4) - defense * 0.5));
    const hitChance = Math.random() * 100;

    if (hitChance < attacker.stats.accuracy) {
      playerCombatState.hp = Math.max(0, playerCombatState.hp - enemyDamage);
      lines.push(`\n${attacker.name} counter-attacks for ${enemyDamage} damage!`);
      lines.push(`  Your HP: ${playerCombatState.hp}/${playerCombatState.maxHp}`);

      if (playerCombatState.hp <= 0) {
        combatLog.push('PLAYER DEFEATED');
        const defeatMessage = handlePlayerDefeat();
        lines.push(defeatMessage);
      }
    } else {
      lines.push(`\n${attacker.name} attacks but misses!`);
    }
  }

  return {
    success: true,
    message: lines.join('\n'),
    data: { techId, tp: playerCombatState.tp, defeated: playerCombatState.hp <= 0 },
  };
}
