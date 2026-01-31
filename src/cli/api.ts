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
        return { success: false, message: 'Usage: goto <location> (city, shop, missions, inventory)' };
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

  const validLocations: Location[] = ['city', 'shop', 'missions', 'inventory'];
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

/**
 * Reset game state (for testing)
 */
export function resetState(): void {
  currentCharacter = null;
  currentLocation = 'city';
  inventory.clear();
}
