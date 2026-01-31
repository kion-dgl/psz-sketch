/**
 * CLI API
 * JSON API mode for AI testing
 */

import type { GameState, CommandResult, AvailableCommand, Location } from './types';
import type { Character } from '../systems/character/types';
import type { Difficulty } from '../systems/mission/types';
import { VALID_CLASS_IDS } from '../systems/character/types';

// Game state (in-memory for CLI)
let currentCharacter: Character | null = null;
let currentLocation: Location = 'city';
let inventory: Map<string, { itemId: string; quantity: number }> = new Map();

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
  SHOP_IDS,
} from '../systems/shop';
import {
  initializeDefaultMissions,
  getAvailableMissions,
  getMission,
  startMission,
  completeMission,
  meetsLevelForDifficulty,
} from '../systems/mission';
import { applyExpGain, getLevelForExp } from '../systems/leveling';
import { getStartingItems, STARTING_MESETA, MONOMATE, MONOFLUID } from '../systems/inventory/starting-items';
import type { ConsumableItem } from '../systems/inventory/types';
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
  isInSession,
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
} from '../systems/stage';
import { getEnemyDisplayName, getEnemyElement } from '../components/enemies/enemyData';

// Initialize systems
initializeDefaultShops();
initializeDefaultMissions();
initializeDefaultFields();

/**
 * Get current game state
 */
export function getState(): GameState {
  return {
    character: currentCharacter,
    location: currentLocation,
    inventory: Array.from(inventory.values()).map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      equipped: false,
    })),
    meseta: currentCharacter?.meseta ?? 0,
  };
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

    case 'list-missions':
      return executeListMissions();

    case 'start-mission':
      if (!args[0] || !args[1]) {
        return { success: false, message: 'Usage: start-mission <mission-id> <difficulty>' };
      }
      return executeStartMission(args[0], args[1].toLowerCase() as Difficulty);

    case 'show-inventory':
      return executeShowInventory();

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

    case 'show-player-hp':
      return executeShowPlayerHp();

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

  // Add weapon (equipped, not in inventory items list)
  // Add frame (equipped, not in inventory items list)
  // Add consumables to inventory
  for (const { item, quantity } of startingItems.consumables) {
    inventory.set(item.id, { itemId: item.id, quantity });
  }

  return {
    success: true,
    message: `Created ${normalizedClassId} character "${name}" with ${STARTING_MESETA} meseta, starter weapon, frame, and consumables.`,
    data: currentCharacter,
  };
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

  const validLocations: Location[] = ['city', 'shop', 'missions', 'inventory', 'storage', 'guild'];
  if (!validLocations.includes(location)) {
    return {
      success: false,
      message: `Invalid location. Choose: ${validLocations.join(', ')}`,
    };
  }

  // Set session config when going to guild
  if (location === 'guild') {
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

function executeBuy(itemId: string, quantity: number): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'shop') {
    return { success: false, message: 'You must be at the shop.' };
  }

  const meseta = currentCharacter.meseta ?? 0;
  const result = purchaseItem(SHOP_IDS.ITEM_SHOP, itemId, quantity, meseta);

  if (result.success) {
    currentCharacter = {
      ...currentCharacter,
      meseta: result.remainingMeseta,
    };

    // Add to inventory
    const existing = inventory.get(itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.set(itemId, { itemId, quantity });
    }
  }

  return {
    success: result.success,
    message: result.message,
    data: result,
  };
}

function executeListMissions(): CommandResult {
  if (!currentCharacter) {
    return { success: false, message: 'No character.' };
  }

  if (currentLocation !== 'missions') {
    return { success: false, message: 'You must be at missions. Use: goto missions' };
  }

  const missions = getAvailableMissions(currentCharacter.character_id, currentCharacter.level);
  const lines = missions.map(m =>
    `  ${m.id.padEnd(20)} ${m.name.padEnd(25)} Lv.${m.recommendedLevel}`
  );

  return {
    success: true,
    message: `Available missions:\n${lines.join('\n')}`,
    data: missions,
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

  const lines = items.map(item =>
    `  ${item.itemId.padEnd(20)} x${item.quantity}`
  );

  return {
    success: true,
    message: `Inventory:\n${lines.join('\n')}`,
    data: items,
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
  const item = inventory.get(itemId);
  if (!item) {
    return { success: false, message: `Item not found in inventory: ${itemId}` };
  }

  if (item.quantity < quantity) {
    return { success: false, message: `Only ${item.quantity} in inventory` };
  }

  // Get the item definition from starting items (simplified for CLI)
  const startingItems = getStartingItems(currentCharacter.class_id);
  const itemDef = startingItems.consumables.find(c => c.item.id === itemId)?.item;

  if (!itemDef) {
    return { success: false, message: `Cannot deposit item: ${itemId}` };
  }

  // Add to shared storage
  const result = addToSharedStorage(itemDef, quantity);
  if (!result.success) {
    return result;
  }

  // Remove from character inventory
  item.quantity -= quantity;
  if (item.quantity <= 0) {
    inventory.delete(itemId);
  }

  return {
    success: true,
    message: `Deposited ${quantity}x ${itemDef.name} to storage`,
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
    inventory.set(itemId, { itemId, quantity });
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

  if (currentLocation !== 'guild') {
    return { success: false, message: 'You must be at the guild. Use: goto guild' };
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

  if (currentLocation !== 'guild') {
    return { success: false, message: 'You must be at the guild. Use: goto guild' };
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
  return {
    success: true,
    message: `Entered ${field.name} on ${difficulty} difficulty.\nHP: ${playerCombatState.hp}/${playerCombatState.maxHp}  TP: ${playerCombatState.tp}/${playerCombatState.maxTp}`,
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
  return {
    success: true,
    message: `Started ${mission.name} on ${difficulty} difficulty.\nHP: ${playerCombatState.hp}/${playerCombatState.maxHp}  TP: ${playerCombatState.tp}/${playerCombatState.maxTp}`,
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
  currentLocation = 'guild';

  return {
    success: true,
    message: 'Used Telepipe. Returned to guild. Session paused.',
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
  currentLocation = 'guild';

  return {
    success: true,
    message: 'Session abandoned. No rewards earned.',
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
    for (const item of result.itemsGained) {
      const itemId = 'itemId' in item ? item.itemId : (item as any).itemId;
      const quantity = 'quantity' in item ? item.quantity : 1;
      lines.push(`  ${itemId} x${quantity}`);

      // Add to inventory
      const existing = inventory.get(itemId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        inventory.set(itemId, { itemId, quantity });
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
}

// ============================================================================
// Combat Commands
// ============================================================================

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
  return {
    hp: 100 + level * 20,
    maxHp: 100 + level * 20,
    attack: 15 + level * 3,
    defense: 8 + level * 2,
    accuracy: 75 + level,
    evasion: 10 + level,
    luck: 10 + Math.floor(level / 2),
  };
}

/**
 * Get player weapon stats (simplified)
 */
function getPlayerWeaponStats(): WeaponStats & { critBonus: number } {
  const level = currentCharacter?.level ?? 1;
  return {
    attack: 10 + level * 2,
    accuracy: 10,
    element: null,
    elementPercent: 0,
    grindBonus: 0,
    critBonus: 5,
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

  // Clear existing enemies
  currentEnemies = [];
  combatLog = [];

  // Get enemy area and difficulty
  const enemyArea = fieldToEnemyArea(session.activeId);
  const difficulty = session.difficulty;
  const seed = Date.now();
  const random = createSeededRandom(seed);

  // Generate enemy composition
  const composition = generateEnemyComposition(enemyArea, difficulty, random);

  // Create enemy instances
  for (const entry of composition) {
    for (let i = 0; i < entry.count; i++) {
      const stats = generateEnemyStats(entry.enemyId, difficulty, currentCharacter.level);
      const element = getEnemyElement(entry.enemyId);

      // Calculate exp/meseta values
      const diffMult = difficulty === 'normal' ? 1 : difficulty === 'hard' ? 1.5 : 2;
      const isBoss = entry.enemyId.startsWith('boss_');
      const expValue = Math.floor((isBoss ? 500 : 50) * diffMult * (1 + currentCharacter.level * 0.1));
      const mesetaValue = Math.floor((isBoss ? 1000 : 100) * diffMult);

      currentEnemies.push({
        id: ++enemyIdCounter,
        enemyId: entry.enemyId,
        name: getEnemyDisplayName(entry.enemyId),
        stats,
        element,
        expValue,
        mesetaValue,
      });
    }
  }

  const enemyList = currentEnemies.map((e, i) => `  [${i}] ${e.name} - HP: ${e.stats.hp}/${e.stats.maxHp}`);

  combatLog.push(`Spawned ${currentEnemies.length} enemies in ${enemyArea}`);

  return {
    success: true,
    message: `Enemies spawned (${enemyArea}, ${difficulty}):\n${enemyList.join('\n')}`,
    data: { enemies: currentEnemies.length, area: enemyArea, difficulty },
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
    return { success: false, message: 'You are defeated! Use telepipe to retreat or abandon-session.' };
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

  const lines: string[] = [];
  let droppedItem: { itemId: string; name: string } | null = null;

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
      lines.push(`  +${target.expValue} EXP, +${target.mesetaValue} Meseta`);

      // Roll for item drop (20% chance)
      droppedItem = rollItemDrop();
      if (droppedItem) {
        lines.push(`  Dropped: ${droppedItem.name}!`);
        combatLog.push(`DROP: ${droppedItem.name}`);

        // Add to inventory
        const existing = inventory.get(droppedItem.itemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          inventory.set(droppedItem.itemId, { itemId: droppedItem.itemId, quantity: 1 });
        }
      }

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
        lines.push('\nAll enemies defeated! Use next-stage or complete-field.');
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

      if (playerCombatState.hp <= 0) {
        lines.push('\n*** YOU HAVE BEEN DEFEATED! ***');
        lines.push('Use telepipe to retreat (lose progress) or abandon-session.');
        combatLog.push('PLAYER DEFEATED');
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

/**
 * Roll for item drop from defeated enemy
 */
function rollItemDrop(): { itemId: string; name: string } | null {
  const roll = Math.random();

  // 20% drop chance
  if (roll > 0.20) return null;

  // Drop table
  const dropRoll = Math.random();
  if (dropRoll < 0.50) {
    return { itemId: 'monomate', name: 'Monomate' };
  } else if (dropRoll < 0.75) {
    return { itemId: 'monofluid', name: 'Monofluid' };
  } else if (dropRoll < 0.90) {
    return { itemId: 'dimate', name: 'Dimate' };
  } else {
    return { itemId: 'difluid', name: 'Difluid' };
  }
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

  const advanced = advanceToNextStage();
  if (!advanced) {
    return { success: false, message: 'Cannot advance. Already at final stage or not in session.' };
  }

  const session = getSessionState();
  combatLog.push(`Advanced to stage ${session.currentStageIndex + 1}`);

  return {
    success: true,
    message: `Advanced to stage ${session.currentStageIndex + 1}. Use spawn-enemies to generate enemies.`,
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

  // Complete the session
  const result = completeSession(true);
  if (!result) {
    return { success: false, message: 'Failed to complete session.' };
  }

  currentLocation = 'guild';
  currentEnemies = [];
  combatLog.push('Field completed!');

  return {
    success: true,
    message: `Field complete! Return to guild to claim rewards.\nGrade: ${result.grade}, EXP: ${result.expGained}, Meseta: ${result.mesetaGained}`,
    data: result,
  };
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

  return {
    success: true,
    message: `Player Status:${status}
  HP: ${playerCombatState.hp.toString().padStart(4)}/${playerCombatState.maxHp} [${hpBar}] ${hpPercent}%
  TP: ${playerCombatState.tp.toString().padStart(4)}/${playerCombatState.maxTp} [${tpBar}] ${tpPercent}%`,
    data: playerCombatState,
  };
}
