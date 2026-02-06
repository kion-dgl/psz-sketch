#!/usr/bin/env node
/**
 * CLI Game Runner
 * Interactive command-line interface for PSZ game
 */

import * as readline from 'readline';
import { execute, getState, getAvailableCommands, resetState } from './api-v2';

const VERSION = '1.0.0';

function printWelcome() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         PHANTASY STAR ZERO - CLI VERSION              ║
║                      v${VERSION}                          ║
╠═══════════════════════════════════════════════════════╣
║  Type 'help' for available commands                   ║
║  Type 'quit' or 'exit' to quit                        ║
╚═══════════════════════════════════════════════════════╝
`);
}

function printPrompt() {
  const state = getState();
  const char = state.character?.character_name ?? 'New Game';
  const loc = state.character ? state.location : 'start';
  process.stdout.write(`\n[${char}@${loc}]> `);
}

async function main() {
  // Check for JSON API mode
  if (process.argv.includes('--api')) {
    runApiMode();
    return;
  }

  // Interactive mode
  printWelcome();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printPrompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
      printPrompt();
      return;
    }

    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      console.log('\nGoodbye!');
      rl.close();
      process.exit(0);
    }

    if (input.toLowerCase() === 'state') {
      // Debug command to show full state as JSON
      console.log(JSON.stringify(getState(), null, 2));
      printPrompt();
      return;
    }

    if (input.toLowerCase() === 'reset') {
      resetState();
      console.log('Game state reset.');
      printPrompt();
      return;
    }

    const result = execute(input);
    console.log(result.message);

    printPrompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

function runApiMode() {
  // JSON API mode - reads commands from stdin, outputs JSON
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) return;

    try {
      const request = JSON.parse(input);

      let response: unknown;

      switch (request.type) {
        case 'execute':
          response = execute(request.command);
          break;
        case 'getState':
          response = getState();
          break;
        case 'getCommands':
          response = getAvailableCommands();
          break;
        case 'reset':
          resetState();
          response = { success: true, message: 'State reset' };
          break;
        default:
          response = { success: false, message: `Unknown request type: ${request.type}` };
      }

      console.log(JSON.stringify(response));
    } catch (err) {
      console.log(JSON.stringify({
        success: false,
        message: `Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}`,
      }));
    }
  });
}

main().catch(console.error);
