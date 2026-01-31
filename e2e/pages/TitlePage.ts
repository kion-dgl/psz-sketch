import { Page } from '@playwright/test';

/**
 * Page Object Model for the Title Screen
 */
export class TitlePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/title');
    // Wait for React to hydrate
    await this.page.waitForLoadState('networkidle');
  }

  async clickStartGame() {
    await this.page.click('[data-testid="start-game"]', { force: true });
  }

  async isVisible() {
    return this.page.isVisible('[data-testid="title-screen"]');
  }
}
