/**
 * CLI API Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { execute, getState, getAvailableCommands, resetState } from './api';

describe('CLI API', () => {
  beforeEach(() => {
    resetState();
  });

  describe('Initial State', () => {
    it('starts with no character', () => {
      const state = getState();
      expect(state.character).toBeNull();
      expect(state.location).toBe('city');
      expect(state.inventory).toEqual([]);
    });

    it('shows create-character in available commands', () => {
      const commands = getAvailableCommands();
      expect(commands.find(c => c.name === 'create-character')).toBeDefined();
    });
  });

  describe('help command', () => {
    it('returns list of commands', () => {
      const result = execute('help');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Available commands');
      expect(result.data).toBeDefined();
    });
  });

  describe('list-classes command', () => {
    it('lists available classes', () => {
      const result = execute('list-classes');
      expect(result.success).toBe(true);
      expect(result.message).toContain('HUmar');
      expect(result.message).toContain('RAmarl');
      expect(result.message).toContain('FOmarl');
    });
  });

  describe('create-character command', () => {
    it('creates character with valid inputs', () => {
      const result = execute('create-character HUmar TestHero');
      expect(result.success).toBe(true);
      expect(result.message).toContain('HUmar character');
      expect(result.message).toContain('TestHero');
      expect(result.message).toContain('500 meseta');

      const state = getState();
      expect(state.character?.character_name).toBe('TestHero');
      expect(state.character?.class_id).toBe('HUmar');
      expect(state.character?.level).toBe(1);
      expect(state.character?.meseta).toBe(500);
    });

    it('gives starting consumables', () => {
      execute('create-character HUmar TestHero');

      const state = getState();
      expect(state.inventory.find(i => i.itemId === 'monomate')).toBeDefined();
      expect(state.inventory.find(i => i.itemId === 'monofluid')).toBeDefined();
    });

    it('fails with invalid class', () => {
      const result = execute('create-character InvalidClass Hero');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid class');
    });

    it('fails with missing name', () => {
      const result = execute('create-character HUmar');
      expect(result.success).toBe(false);
    });

    it('allows multi-word names', () => {
      const result = execute('create-character RAmarl My Cool Hero');
      expect(result.success).toBe(true);

      const state = getState();
      expect(state.character?.character_name).toBe('My Cool Hero');
    });
  });

  describe('show-stats command', () => {
    it('fails without character', () => {
      const result = execute('show-stats');
      expect(result.success).toBe(false);
      expect(result.message).toContain('No character');
    });

    it('shows character stats', () => {
      execute('create-character HUmar TestHero');
      const result = execute('show-stats');
      expect(result.success).toBe(true);
      expect(result.message).toContain('TestHero');
      expect(result.message).toContain('HUmar');
      expect(result.message).toContain('Level: 1');
    });
  });

  describe('goto command', () => {
    beforeEach(() => {
      execute('create-character HUmar TestHero');
    });

    it('moves to shop', () => {
      const result = execute('goto shop');
      expect(result.success).toBe(true);
      expect(getState().location).toBe('shop');
    });

    it('moves to missions', () => {
      const result = execute('goto missions');
      expect(result.success).toBe(true);
      expect(getState().location).toBe('missions');
    });

    it('moves to inventory', () => {
      const result = execute('goto inventory');
      expect(result.success).toBe(true);
      expect(getState().location).toBe('inventory');
    });

    it('fails for invalid location', () => {
      const result = execute('goto nowhere');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid location');
    });
  });

  describe('Shop Commands', () => {
    beforeEach(() => {
      execute('create-character HUmar TestHero');
      execute('goto shop');
    });

    it('lists shop items', () => {
      const result = execute('list-items');
      expect(result.success).toBe(true);
      expect(result.message).toContain('monomate');
    });

    it('buys item successfully', () => {
      const initialMeseta = getState().meseta;
      const result = execute('buy monomate 2');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Purchased');

      const state = getState();
      expect(state.meseta).toBeLessThan(initialMeseta);
      expect(state.inventory.find(i => i.itemId === 'monomate')).toBeDefined();
    });

    it('fails to buy non-existent item', () => {
      const result = execute('buy fake-item');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('fails to buy without enough meseta', () => {
      // Buy something expensive
      const result = execute('buy trimate 100');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Not enough meseta');
    });

    it('fails when buying quantity 0', () => {
      const result = execute('buy monomate 0');
      expect(result.success).toBe(false);
      expect(result.message).toContain('positive');
    });

    it('fails when buying with invalid quantity', () => {
      const result = execute('buy monomate abc');
      expect(result.success).toBe(false);
      expect(result.message).toContain('positive');
    });

    it('fails when buying negative quantity', () => {
      const result = execute('buy monomate -5');
      expect(result.success).toBe(false);
      expect(result.message).toContain('positive');
    });
  });

  describe('Mission Commands', () => {
    beforeEach(() => {
      execute('create-character HUmar TestHero');
      execute('goto missions');
    });

    it('lists available missions', () => {
      const result = execute('list-missions');
      expect(result.success).toBe(true);
      expect(result.message).toContain('mayors-mission');
    });

    it('starts and completes mission', () => {
      const stateBefore = getState();
      const expBefore = stateBefore.character?.experience ?? 0;
      const mesetaBefore = stateBefore.meseta;

      const result = execute('start-mission mayors-mission normal');
      expect(result.success).toBe(true);
      expect(result.message).toContain('completed');
      expect(result.message).toContain('Grade');
      expect(result.message).toContain('EXP');

      const stateAfter = getState();
      expect(stateAfter.character?.experience).toBeGreaterThan(expBefore);
      expect(stateAfter.meseta).toBeGreaterThan(mesetaBefore);
    });

    it('fails for invalid difficulty', () => {
      const result = execute('start-mission mayors-mission extreme');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid difficulty');
    });

    it('fails for non-existent mission', () => {
      const result = execute('start-mission fake-mission normal');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Inventory Commands', () => {
    beforeEach(() => {
      execute('create-character HUmar TestHero');
    });

    it('shows starting items in inventory', () => {
      execute('goto inventory');
      const result = execute('show-inventory');
      expect(result.success).toBe(true);
      expect(result.message).toContain('monomate');
      expect(result.message).toContain('monofluid');
    });

    it('shows updated quantity after buying more', () => {
      execute('goto shop');
      execute('buy monomate 3');
      execute('goto inventory');

      const result = execute('show-inventory');
      expect(result.success).toBe(true);
      expect(result.message).toContain('monomate');
      // Started with 5, bought 3 more = 8
      expect(result.message).toContain('x8');
    });
  });

  describe('Unknown Commands', () => {
    it('returns error for unknown command', () => {
      const result = execute('foobar');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });
  });

  describe('Comments and Empty Lines', () => {
    it('ignores comment lines', () => {
      const result = execute('# this is a comment');
      expect(result.success).toBe(true);
      expect(result.message).toBe('');
    });

    it('ignores empty lines', () => {
      const result = execute('   ');
      expect(result.success).toBe(true);
      expect(result.message).toBe('');
    });
  });

  describe('Case Insensitivity', () => {
    beforeEach(() => {
      execute('create-character HUmar TestHero');
    });

    it('accepts uppercase location in goto', () => {
      const result = execute('goto SHOP');
      expect(result.success).toBe(true);
      expect(getState().location).toBe('shop');
    });

    it('accepts mixed case location in goto', () => {
      const result = execute('goto Missions');
      expect(result.success).toBe(true);
      expect(getState().location).toBe('missions');
    });

    it('accepts uppercase class ID', () => {
      resetState();
      const result = execute('create-character HUMAR TestUpper');
      expect(result.success).toBe(true);
      expect(getState().character?.class_id).toBe('HUmar');
    });

    it('accepts lowercase class ID', () => {
      resetState();
      const result = execute('create-character ramarl TestLower');
      expect(result.success).toBe(true);
      expect(getState().character?.class_id).toBe('RAmarl');
    });

    it('accepts mixed case difficulty', () => {
      execute('create-character HUmar Test');
      execute('goto missions');
      const result = execute('start-mission mayors-mission NORMAL');
      expect(result.success).toBe(true);
    });
  });

  describe('Usage Messages', () => {
    beforeEach(() => {
      execute('create-character HUmar TestHero');
    });

    it('shows usage for goto without args', () => {
      const result = execute('goto');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Usage:');
    });

    it('shows usage for buy without args', () => {
      execute('goto shop');
      const result = execute('buy');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Usage:');
    });

    it('shows usage for start-mission without args', () => {
      execute('goto missions');
      const result = execute('start-mission');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Usage:');
    });

    it('shows usage for start-mission with only mission-id', () => {
      execute('goto missions');
      const result = execute('start-mission mayors-mission');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Usage:');
    });
  });

  describe('Available Commands Update', () => {
    it('updates available commands after creating character', () => {
      const beforeCommands = getAvailableCommands();
      expect(beforeCommands.find(c => c.name === 'create-character')).toBeDefined();
      expect(beforeCommands.find(c => c.name === 'goto')).toBeUndefined();

      execute('create-character HUmar TestHero');

      const afterCommands = getAvailableCommands();
      expect(afterCommands.find(c => c.name === 'create-character')).toBeUndefined();
      expect(afterCommands.find(c => c.name === 'goto')).toBeDefined();
    });

    it('updates available commands based on location', () => {
      execute('create-character HUmar TestHero');

      // In city - no shop or mission commands
      let commands = getAvailableCommands();
      expect(commands.find(c => c.name === 'list-items')).toBeUndefined();
      expect(commands.find(c => c.name === 'list-missions')).toBeUndefined();

      // Go to shop
      execute('goto shop');
      commands = getAvailableCommands();
      expect(commands.find(c => c.name === 'list-items')).toBeDefined();
      expect(commands.find(c => c.name === 'buy')).toBeDefined();

      // Go to missions
      execute('goto missions');
      commands = getAvailableCommands();
      expect(commands.find(c => c.name === 'list-missions')).toBeDefined();
      expect(commands.find(c => c.name === 'start-mission')).toBeDefined();
    });
  });
});
