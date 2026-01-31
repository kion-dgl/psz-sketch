import { Page } from '@playwright/test';

/**
 * Page Object Model for the Mission Select Screen
 */
export class MissionSelectPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/mission-select');
    // Wait for React to hydrate
    await this.page.waitForLoadState('networkidle');
  }

  async getMissionCount() {
    return this.page.locator('[data-testid^="mission-"]').count();
  }

  async selectMission(missionId: string) {
    await this.page.click(`[data-testid="mission-${missionId}"]`, { force: true });
  }

  async selectDifficulty(difficulty: 'normal' | 'hard' | 'super-hard') {
    await this.page.click(`[data-testid="difficulty-${difficulty}"]`, { force: true });
  }

  async isDifficultyEnabled(difficulty: 'normal' | 'hard' | 'super-hard') {
    const button = this.page.locator(`[data-testid="difficulty-${difficulty}"]`);
    return !(await button.isDisabled());
  }

  async clickStartMission() {
    await this.page.click('[data-testid="start-mission"]', { force: true });
  }

  async clickBack() {
    await this.page.click('[data-testid="back-button"]', { force: true });
  }

  async isVisible() {
    return this.page.isVisible('[data-testid="mission-select"]');
  }
}
