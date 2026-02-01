import { Page } from '@playwright/test';

/**
 * Page Object Model for the Gameplay Test Interface
 * Wraps CLI commands for Playwright testability
 */
export class GamePlayPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/gameplay');
    await this.page.waitForLoadState('networkidle');
  }

  // Game state getters
  async getCharacterName() {
    const el = this.page.locator('[data-testid="char-name"]');
    if (await el.count() === 0) return null;
    return el.textContent();
  }

  async getCharacterClass() {
    const el = this.page.locator('[data-testid="char-class"]');
    if (await el.count() === 0) return null;
    return el.textContent();
  }

  async getCharacterLevel() {
    const text = await this.page.locator('[data-testid="char-level"]').textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async getMeseta() {
    const text = await this.page.locator('[data-testid="char-meseta"]').textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async getCurrentLocation() {
    return this.page.locator('[data-testid="current-location"]').textContent();
  }

  async isInCombat() {
    const text = await this.page.locator('[data-testid="combat-section"]').textContent();
    return text?.includes('IN COMBAT') ?? false;
  }

  async hasCharacter() {
    const el = this.page.locator('[data-testid="char-name"]');
    return (await el.count()) > 0;
  }

  // Command execution
  async executeCommand(command: string) {
    await this.page.fill('[data-testid="command-input"]', command);
    await this.page.click('[data-testid="submit-command"]');
    // Wait for state to update
    await this.page.waitForTimeout(100);
  }

  async clickQuickAction(command: string) {
    const testId = `action-${command.replace(/\s+/g, '-')}`;
    await this.page.click(`[data-testid="${testId}"]`);
    await this.page.waitForTimeout(100);
  }

  // Log analysis
  async getLatestLog() {
    const logs = this.page.locator('[data-testid^="log-"]');
    const count = await logs.count();
    if (count === 0) return null;
    return logs.nth(count - 1).textContent();
  }

  async getLogsByType(type: 'info' | 'success' | 'error' | 'combat') {
    const logs = this.page.locator(`[data-testid="log-${type}"]`);
    const count = await logs.count();
    const messages: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await logs.nth(i).textContent();
      if (text) messages.push(text);
    }
    return messages;
  }

  async hasErrorLog() {
    return (await this.page.locator('[data-testid="log-error"]').count()) > 0;
  }

  async hasSuccessLog() {
    return (await this.page.locator('[data-testid="log-success"]').count()) > 0;
  }

  // Game actions via quick buttons
  async resetGame() {
    await this.page.click('[data-testid="reset-game"]');
    await this.page.waitForTimeout(100);
  }

  // Inventory inspection
  async getInventoryItems() {
    const items = this.page.locator('[data-testid^="inv-item-"]');
    const count = await items.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) result.push(text);
    }
    return result;
  }

  async hasInventoryItem(itemId: string) {
    return (await this.page.locator(`[data-testid="inv-item-${itemId}"]`).count()) > 0;
  }

  // Available commands
  async getAvailableCommands() {
    const cmds = this.page.locator('[data-testid^="cmd-"]');
    const count = await cmds.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const testId = await cmds.nth(i).getAttribute('data-testid');
      if (testId) result.push(testId.replace('cmd-', ''));
    }
    return result;
  }

  async clickCommand(commandName: string) {
    await this.page.click(`[data-testid="cmd-${commandName}"]`);
  }
}
