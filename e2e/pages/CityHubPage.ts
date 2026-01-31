import { Page } from '@playwright/test';

/**
 * Page Object Model for the City Hub Screen
 */
export class CityHubPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/city-hub');
    // Wait for React to hydrate
    await this.page.waitForLoadState('networkidle');
  }

  async getCharacterName() {
    return this.page.locator('[data-testid="character-name"]').textContent();
  }

  async getCharacterLevel() {
    return this.page.locator('[data-testid="character-level"]').textContent();
  }

  async getCharacterClass() {
    return this.page.locator('[data-testid="character-class"]').textContent();
  }

  async getMeseta() {
    const text = await this.page.locator('[data-testid="meseta-amount"]').textContent();
    return text ? parseInt(text.replace(/,/g, ''), 10) : 0;
  }

  async clickShop() {
    await this.page.click('[data-testid="nav-shop"]', { force: true });
  }

  async clickInventory() {
    await this.page.click('[data-testid="nav-inventory"]', { force: true });
  }

  async clickMissions() {
    await this.page.click('[data-testid="nav-missions"]', { force: true });
  }

  async clickStorage() {
    await this.page.click('[data-testid="nav-storage"]', { force: true });
  }

  async clickLogout() {
    await this.page.click('[data-testid="logout"]', { force: true });
  }

  async isVisible() {
    return this.page.isVisible('[data-testid="city-hub"]');
  }
}
