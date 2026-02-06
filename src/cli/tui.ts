#!/usr/bin/env node
/**
 * Interactive TUI for PSZ game
 * Menu-driven interface with selectable options
 */

import { select, input } from '@inquirer/prompts';
import { execute, getState, getAvailableCommands, resetState } from './api-v2';
import type { AvailableCommand } from './types';

const VERSION = '1.0.0';

function clearScreen() {
  console.clear();
}

function printHeader() {
  const state = getState();
  const char = state.character;

  console.log('═══════════════════════════════════════════════════════');
  console.log('         PHANTASY STAR ZERO - INTERACTIVE TUI          ');
  console.log('═══════════════════════════════════════════════════════');

  if (char) {
    console.log(`  ${char.character_name} | Lv.${char.level} ${char.class_id} | ${state.meseta} Meseta`);

    if (state.location === 'field' && state.currentStage !== undefined) {
      const stageNum = (state.stageIndex ?? 0) + 1;
      const totalStages = 3; // TODO: get from session
      console.log(`  Location: ${state.sessionType === 'mission' ? 'Mission' : 'Field'} - Stage ${stageNum}/${totalStages} | Wave ${state.currentWave ?? 1}/${state.totalWaves ?? 3}`);
    } else {
      console.log(`  Location: ${state.location}`);
    }

    if (state.playerCombat) {
      console.log(`  HP: ${state.playerCombat.hp}/${state.playerCombat.maxHp} | TP: ${state.playerCombat.tp}/${state.playerCombat.maxTp}`);
    }

    if (state.enemies && state.enemies.length > 0) {
      console.log('  ─────────────────────────────────────────────────────');
      console.log('  Enemies:');
      state.enemies.forEach((e, i) => {
        const hpBar = makeHpBar(e.hp, e.maxHp, 15);
        console.log(`    [${i}] ${e.name} ${hpBar} ${e.hp}/${e.maxHp}`);
      });
    }

    if (state.droppedItems && state.droppedItems.length > 0) {
      console.log('  ─────────────────────────────────────────────────────');
      console.log('  Dropped Items:');
      state.droppedItems.forEach(d => {
        console.log(`    [${d.dropId}] ${d.name}`);
      });
    }

    if (state.pendingMission) {
      console.log('  ─────────────────────────────────────────────────────');
      console.log('  ★ MISSION COMPLETE - Report at Guild for rewards! ★');
    }

    if (state.suspendedSession) {
      console.log('  ─────────────────────────────────────────────────────');
      console.log(`  ⏸ MISSION SUSPENDED - Stage ${state.suspendedSession.currentStage + 1}, Wave ${state.suspendedSession.currentWave}/${state.suspendedSession.totalWaves}`);
      console.log('  Go to Guild to resume or abandon.');
    }
  } else {
    console.log('  No character loaded');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

function makeHpBar(current: number, max: number, width: number): string {
  const filled = Math.round((current / max) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Build menu choices from available commands
 */
function buildMenuChoices(commands: AvailableCommand[]) {
  const choices: { name: string; value: string; description?: string }[] = [];

  // Group commands by category
  const categories: Record<string, AvailableCommand[]> = {
    'Character': [],
    'Navigation': [],
    'Combat': [],
    'Shop': [],
    'Inventory': [],
    'Storage': [],
    'Other': [],
  };

  for (const cmd of commands) {
    if (['create-character', 'load-character', 'list-characters', 'list-classes', 'show-stats'].includes(cmd.name)) {
      categories['Character'].push(cmd);
    } else if (['goto', 'list-missions', 'start-mission', 'enter-field', 'return'].includes(cmd.name)) {
      categories['Navigation'].push(cmd);
    } else if (['attack', 'next-wave', 'next-stage', 'pickup', 'pickup-all'].includes(cmd.name)) {
      categories['Combat'].push(cmd);
    } else if (['list-items', 'buy', 'buy-equipment', 'sell'].includes(cmd.name)) {
      categories['Shop'].push(cmd);
    } else if (['show-inventory', 'show-equipment', 'equip', 'unequip', 'use'].includes(cmd.name)) {
      categories['Inventory'].push(cmd);
    } else if (['show-storage', 'deposit', 'withdraw', 'deposit-meseta', 'withdraw-meseta'].includes(cmd.name)) {
      categories['Storage'].push(cmd);
    } else {
      categories['Other'].push(cmd);
    }
  }

  // Build choices with separators
  for (const [category, cmds] of Object.entries(categories)) {
    if (cmds.length > 0) {
      for (const cmd of cmds) {
        choices.push({
          name: `${cmd.name.padEnd(20)} ${cmd.description}`,
          value: cmd.name,
        });
      }
    }
  }

  // Add system commands
  choices.push({ name: '─'.repeat(50), value: '_separator', description: '' });
  choices.push({ name: 'Quit', value: '_quit' });

  return choices;
}

/**
 * Get argument value - either from list selection or text input
 */
async function getArgumentValue(cmd: AvailableCommand, argIndex: number): Promise<string | null> {
  const arg = cmd.args[argIndex];
  const argName = arg.name;

  // Provide select options for known argument types
  if (argName === 'class-id') {
    const result = await select({
      message: 'Select class:',
      choices: [
        { name: 'HUmar (Hunter - Male)', value: 'HUmar' },
        { name: 'HUnewearl (Hunter - Female Newman)', value: 'HUnewearl' },
        { name: 'HUcast (Hunter - Male Android)', value: 'HUcast' },
        { name: 'HUcaseal (Hunter - Female Android)', value: 'HUcaseal' },
        { name: 'RAmar (Ranger - Male)', value: 'RAmar' },
        { name: 'RAmarl (Ranger - Female)', value: 'RAmarl' },
        { name: 'RAcast (Ranger - Male Android)', value: 'RAcast' },
        { name: 'RAcaseal (Ranger - Female Android)', value: 'RAcaseal' },
        { name: 'FOmar (Force - Male)', value: 'FOmar' },
        { name: 'FOmarl (Force - Female)', value: 'FOmarl' },
        { name: 'FOnewm (Force - Male Newman)', value: 'FOnewm' },
        { name: 'FOnewearl (Force - Female Newman)', value: 'FOnewearl' },
        { name: '← Back', value: '_back' },
      ],
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'slot') {
    const chars = [];
    const state = getState();
    // We need to check all slots - run list-characters
    const listResult = execute('list-characters');
    const lines = listResult.message.split('\n').slice(1); // skip header

    const choices = lines.map((line, i) => {
      const match = line.match(/Slot (\d): (.+)/);
      if (match) {
        return { name: line.trim(), value: match[1] };
      }
      return { name: `Slot ${i}: Unknown`, value: String(i) };
    });
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select character slot:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'location') {
    const result = await select({
      message: 'Select location:',
      choices: [
        { name: 'City (Hub)', value: 'city' },
        { name: 'Item Shop', value: 'shop' },
        { name: 'Weapon Shop', value: 'weapon-shop' },
        { name: 'Guild (Missions)', value: 'guild' },
        { name: 'Teleporter (Fields)', value: 'teleporter' },
        { name: 'Storage', value: 'storage' },
        { name: '← Back', value: '_back' },
      ],
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'difficulty') {
    const result = await select({
      message: 'Select difficulty:',
      choices: [
        { name: 'Normal', value: 'normal' },
        { name: 'Hard', value: 'hard' },
        { name: 'Super', value: 'super' },
        { name: '← Back', value: '_back' },
      ],
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'mission-id') {
    const missionsResult = execute('list-missions');
    if (!missionsResult.success) {
      console.log(missionsResult.message);
      return null;
    }

    const lines = missionsResult.message.split('\n').slice(1);
    const choices = lines.map(line => {
      const match = line.trim().match(/^(\S+)\s+(.+)$/);
      if (match) {
        return { name: `${match[1]} - ${match[2]}`, value: match[1] };
      }
      return { name: line.trim(), value: line.trim() };
    });
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select mission:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'area-id') {
    const result = await select({
      message: 'Select area:',
      choices: [
        { name: 'Forest', value: 'forest' },
        { name: 'Caves', value: 'caves' },
        { name: 'Mines', value: 'mines' },
        { name: 'Ruins', value: 'ruins' },
        { name: '← Back', value: '_back' },
      ],
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'target') {
    const state = getState();
    if (!state.enemies || state.enemies.length === 0) {
      console.log('No enemies to target.');
      return null;
    }

    const choices = state.enemies.map((e, i) => ({
      name: `[${i}] ${e.name} (${e.hp}/${e.maxHp} HP)`,
      value: String(i),
    }));
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select target:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'drop-id') {
    const state = getState();
    if (!state.droppedItems || state.droppedItems.length === 0) {
      console.log('No items to pick up.');
      return null;
    }

    const choices = state.droppedItems.map(d => ({
      name: `[${d.dropId}] ${d.name}`,
      value: String(d.dropId),
    }));
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select item to pick up:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'item-id' && cmd.name === 'equip') {
    const state = getState();
    const equipable = state.inventory.filter(i =>
      i.type === 'weapon' || i.type === 'armor' || i.type === 'unit'
    );

    if (equipable.length === 0) {
      console.log('No equipable items in inventory.');
      return null;
    }

    const choices = equipable.map(i => ({
      name: `${i.name} (${i.type})`,
      value: i.id,
    }));
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select item to equip:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'slot' && cmd.name === 'unequip') {
    const state = getState();
    const equipped: { name: string; value: string }[] = [];

    if (state.equipment.weapon) equipped.push({ name: `Weapon: ${state.equipment.weapon.name}`, value: 'weapon' });
    if (state.equipment.frame) equipped.push({ name: `Frame: ${state.equipment.frame.name}`, value: 'frame' });
    if (state.equipment.unit1) equipped.push({ name: `Unit 1: ${state.equipment.unit1.name}`, value: 'unit1' });
    if (state.equipment.unit2) equipped.push({ name: `Unit 2: ${state.equipment.unit2.name}`, value: 'unit2' });
    if (state.equipment.unit3) equipped.push({ name: `Unit 3: ${state.equipment.unit3.name}`, value: 'unit3' });
    if (state.equipment.unit4) equipped.push({ name: `Unit 4: ${state.equipment.unit4.name}`, value: 'unit4' });

    if (equipped.length === 0) {
      console.log('No items equipped.');
      return null;
    }

    equipped.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select slot to unequip:',
      choices: equipped,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'item-id' && cmd.name === 'use') {
    const state = getState();
    const consumables = state.inventory.filter(i => i.type === 'consumable');

    if (consumables.length === 0) {
      console.log('No consumable items in inventory.');
      return null;
    }

    const choices = consumables.map(i => ({
      name: `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`,
      value: i.id,
    }));
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select item to use:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'item-id' && (cmd.name === 'buy' || cmd.name === 'buy-equipment')) {
    const listResult = execute('list-items');
    if (!listResult.success) {
      console.log(listResult.message);
      return null;
    }

    const lines = listResult.message.split('\n').slice(1);
    const choices = lines.map(line => {
      const match = line.trim().match(/^(\S+)\s+(.+?)\s+(\d+)\s+meseta$/);
      if (match) {
        return { name: `${match[2]} (${match[3]} meseta)`, value: match[1] };
      }
      return { name: line.trim(), value: line.trim().split(/\s+/)[0] };
    });
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select item to buy:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'item-id' && cmd.name === 'deposit') {
    const state = getState();
    const depositable = state.inventory.filter(i => !i.equipped);

    if (depositable.length === 0) {
      console.log('No items to deposit.');
      return null;
    }

    const choices = depositable.map(i => ({
      name: `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`,
      value: i.id,
    }));
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select item to deposit:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  if (argName === 'item-id' && cmd.name === 'withdraw') {
    const state = getState();
    if (!state.storage || state.storage.items.length === 0) {
      console.log('Storage is empty.');
      return null;
    }

    const choices = state.storage.items.map(i => ({
      name: `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`,
      value: i.id,
    }));
    choices.push({ name: '← Back', value: '_back' });

    const result = await select({
      message: 'Select item to withdraw:',
      choices,
    });
    return result === '_back' ? null : result;
  }

  // Fallback to text input
  const required = arg.required ? ' (required)' : ' (optional, press Enter to skip)';
  const result = await input({
    message: `Enter ${argName}${required}:`,
  });

  return result || (arg.required ? null : '');
}

/**
 * Execute a command with interactive argument collection
 */
async function executeInteractive(cmdName: string): Promise<boolean> {
  const commands = getAvailableCommands();
  const cmd = commands.find(c => c.name === cmdName);

  if (!cmd) {
    console.log(`Unknown command: ${cmdName}`);
    return true;
  }

  // Collect arguments
  const args: string[] = [];

  for (let i = 0; i < cmd.args.length; i++) {
    const arg = cmd.args[i];
    const value = await getArgumentValue(cmd, i);

    if (value === null && arg.required) {
      // User cancelled
      return true;
    }

    if (value) {
      args.push(value);
    }
  }

  // Build and execute command
  const fullCommand = [cmdName, ...args].join(' ');
  const result = execute(fullCommand);

  console.log('\n' + result.message);

  // Wait for user to read result
  await input({ message: 'Press Enter to continue...' });

  return true;
}

async function mainLoop() {
  while (true) {
    clearScreen();
    printHeader();

    const commands = getAvailableCommands();
    const choices = buildMenuChoices(commands);

    try {
      const selected = await select({
        message: 'Select action:',
        choices,
        pageSize: 15,
      });

      if (selected === '_quit') {
        console.log('\nGoodbye!');
        break;
      }

      if (selected === '_separator') {
        continue;
      }

      await executeInteractive(selected);
    } catch (err) {
      // Handle Ctrl+C
      if ((err as Error).message?.includes('User force closed')) {
        console.log('\nGoodbye!');
        break;
      }
      throw err;
    }
  }
}

async function main() {
  clearScreen();
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         PHANTASY STAR ZERO - INTERACTIVE TUI          ║
║                      v${VERSION}                          ║
╚═══════════════════════════════════════════════════════╝
`);

  await mainLoop();
}

main().catch(console.error);
