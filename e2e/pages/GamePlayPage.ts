import { Page } from '@playwright/test';

/**
 * Page Object Model for the Integrated Gameplay Interface
 */
export class GamePlayPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/gameplay');
    await this.page.waitForLoadState('networkidle');
  }

  // Character state
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
    if (!text) return null;
    const match = text.replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async getCurrentLocation() {
    return this.page.locator('[data-testid="current-location"]').textContent();
  }

  async hasCharacter() {
    const el = this.page.locator('[data-testid="char-name"]');
    return (await el.count()) > 0;
  }

  // Command execution
  async executeCommand(command: string) {
    await this.page.fill('[data-testid="command-input"]', command);
    await this.page.click('[data-testid="submit-command"]');
    await this.page.waitForTimeout(100);
  }

  // UI button clicks
  async clickCreateClass(classId: string) {
    await this.page.click(`[data-testid="create-${classId}"]`);
    await this.page.waitForTimeout(100);
  }

  async clickGotoShop() {
    await this.page.click('[data-testid="goto-shop"]');
    await this.page.waitForTimeout(100);
  }

  async clickGotoGuild() {
    await this.page.click('[data-testid="goto-guild"]');
    await this.page.waitForTimeout(100);
  }

  async clickGotoInventory() {
    await this.page.click('[data-testid="goto-inventory"]');
    await this.page.waitForTimeout(100);
  }

  async clickBuyItem(itemId: string) {
    await this.page.click(`[data-testid="buy-${itemId}"]`);
    await this.page.waitForTimeout(100);
  }

  async clickEnterField(fieldId: string) {
    await this.page.click(`[data-testid="enter-field-${fieldId}"]`);
    await this.page.waitForTimeout(100);
  }

  async clickTelepipe() {
    await this.page.click('[data-testid="use-telepipe"]');
    await this.page.waitForTimeout(100);
  }

  async resetGame() {
    await this.page.click('[data-testid="reset-game"]');
    await this.page.waitForTimeout(100);
  }

  // Log inspection
  async getLogContent() {
    return this.page.locator('[data-testid="game-log"]').textContent();
  }

  async hasLogContaining(text: string) {
    const content = await this.getLogContent();
    return content?.toLowerCase().includes(text.toLowerCase()) ?? false;
  }

  // Inventory (sidebar)
  async getInventoryItems() {
    const items = this.page.locator('[data-testid^="sidebar-inv-"]');
    const count = await items.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) result.push(text);
    }
    return result;
  }

  async hasInventoryItem(itemId: string) {
    // Check sidebar inventory
    const sidebarItem = this.page.locator(`[data-testid="sidebar-inv-${itemId}"]`);
    if (await sidebarItem.count() > 0) return true;
    // Also check location-based inventory view
    const invItem = this.page.locator(`[data-testid="inv-item-${itemId}"]`);
    return (await invItem.count()) > 0;
  }

  // Wait helpers
  async waitForLocation(location: string) {
    await this.page.waitForFunction(
      (loc) => document.querySelector('[data-testid="current-location"]')?.textContent?.toLowerCase().includes(loc),
      location.toLowerCase()
    );
  }
}
