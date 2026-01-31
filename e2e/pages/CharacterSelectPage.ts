import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for the Character Select Screen
 */
export class CharacterSelectPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/character-select');
    // Wait for React to hydrate
    await this.page.waitForLoadState('networkidle');
  }

  async getSlot(index: number) {
    return this.page.locator(`[data-testid="character-slot-${index}"]`);
  }

  async clickSlot(index: number) {
    await this.page.click(`[data-testid="character-slot-${index}"]`);
  }

  async clickNewGame(slotIndex: number) {
    await this.page.click(`[data-testid="new-game-${slotIndex}"]`, { force: true });
  }

  async clickDeleteCharacter(slotIndex: number) {
    await this.page.click(`[data-testid="delete-character-${slotIndex}"]`, { force: true });
  }

  async confirmDelete() {
    await this.page.click('[data-testid="confirm-delete"]', { force: true });
  }

  async cancelDelete() {
    await this.page.click('[data-testid="cancel-delete"]', { force: true });
  }

  async selectCharacter(slotIndex: number) {
    await this.page.click(`[data-testid="select-character-${slotIndex}"]`, { force: true });
  }

  async getCharacterInfo(slotIndex: number) {
    const slot = await this.getSlot(slotIndex);
    const name = await slot.locator('[data-testid="character-name"]').textContent();
    const level = await slot.locator('[data-testid="character-level"]').textContent();
    const classId = await slot.locator('[data-testid="character-class"]').textContent();
    return { name, level, classId };
  }

  async isSlotEmpty(slotIndex: number) {
    const slot = await this.getSlot(slotIndex);
    return slot.locator('[data-testid="empty-slot"]').isVisible();
  }

  async getSlotCount() {
    return this.page.locator('[data-testid^="character-slot-"]').count();
  }
}
