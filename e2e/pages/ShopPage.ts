import { Page } from '@playwright/test';

/**
 * Page Object Model for the Shop Screen
 * Simplified to match CLI-style UI
 */
export class ShopPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/shop');
    await this.page.waitForLoadState('networkidle');
  }

  async getMeseta() {
    const text = await this.page.locator('[data-testid="meseta-amount"]').textContent();
    // Parse "1,000 meseta" format
    if (!text) return 0;
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  }

  async selectShopTab(tab: 'items' | 'weapons') {
    await this.page.click(`[data-testid="shop-tab-${tab}"]`, { force: true });
  }

  async buyItem(itemId: string) {
    await this.page.click(`[data-testid="buy-${itemId}"]`, { force: true });
  }

  async isBuyButtonEnabled(itemId: string) {
    const button = this.page.locator(`[data-testid="buy-${itemId}"]`);
    return !(await button.isDisabled());
  }

  async clickBack() {
    await this.page.click('[data-testid="back-button"]', { force: true });
  }

  async waitForItem(itemId: string) {
    await this.page.waitForSelector(`[data-testid="shop-item-${itemId}"]`);
  }
}
