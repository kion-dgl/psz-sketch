import { Page } from '@playwright/test';

/**
 * Page Object Model for the Character Creation Screen
 */
export class CharacterCreatePage {
  constructor(private page: Page) {}

  async goto(slot: number) {
    await this.page.goto(`/web/character-create?slot=${slot}`);
    // Wait for React to hydrate
    await this.page.waitForLoadState('networkidle');
  }

  async selectClass(classId: string) {
    await this.page.click(`[data-testid="class-${classId}"]`, { force: true });
  }

  async setName(name: string) {
    await this.page.fill('[data-testid="character-name-input"]', name);
  }

  async selectVariation(index: number) {
    await this.page.click(`[data-testid="variation-${index}"]`);
  }

  async selectBodyColor(index: number) {
    await this.page.click(`[data-testid="body-color-${index}"]`);
  }

  async selectHairColor(index: number) {
    await this.page.click(`[data-testid="hair-color-${index}"]`);
  }

  async selectSkinTone(index: number) {
    await this.page.click(`[data-testid="skin-tone-${index}"]`);
  }

  async clickCreate() {
    await this.page.click('[data-testid="create-character"]', { force: true });
  }

  async clickBack() {
    await this.page.click('[data-testid="back-button"]');
  }

  async getValidationError() {
    return this.page.locator('[data-testid="validation-error"]').textContent();
  }

  async isValidationErrorVisible() {
    return this.page.locator('[data-testid="validation-error"]').isVisible();
  }

  async createCharacter(options: {
    classId: string;
    name: string;
    variationIndex?: number;
    bodyColorIndex?: number;
    hairColorIndex?: number;
    skinToneIndex?: number;
  }) {
    await this.selectClass(options.classId);
    // Wait for customization screen to appear
    await this.page.waitForSelector('[data-testid="character-name-input"]');
    await this.setName(options.name);
    if (options.variationIndex !== undefined) {
      await this.selectVariation(options.variationIndex);
    }
    if (options.bodyColorIndex !== undefined) {
      await this.selectBodyColor(options.bodyColorIndex);
    }
    if (options.hairColorIndex !== undefined) {
      await this.selectHairColor(options.hairColorIndex);
    }
    if (options.skinToneIndex !== undefined) {
      await this.selectSkinTone(options.skinToneIndex);
    }
    await this.clickCreate();
  }
}
