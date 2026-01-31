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
import { getStartingItems, STARTING_MESETA } from '../systems/inventory/starting-items';
import {
  getSharedStorage,
  getSharedStorageMeseta,
  depositMesetaToStorage,
  withdrawMesetaFromStorage,
  addToSharedStorage,
  removeFromSharedStorage,
  clearSharedStorage,
} from '../systems/inventory/inventory';

// Initialize systems
initializeDefaultShops();
initializeDefaultMissions();

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
        return { success: false, message: 'Usage: goto <location> (city, shop, missions, inventory, storage)' };
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

  const validLocations: Location[] = ['city', 'shop', 'missions', 'inventory', 'storage'];
  if (!validLocations.includes(location)) {
    return {
      success: false,
      message: `Invalid location. Choose: ${validLocations.join(', ')}`,
    };
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

/**
 * Reset game state (for testing)
 */
export function resetState(): void {
  currentCharacter = null;
  currentLocation = 'city';
  inventory.clear();
  clearSharedStorage();
}
