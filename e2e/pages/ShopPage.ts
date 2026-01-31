import { Page } from '@playwright/test';

/**
 * Page Object Model for the Shop Screen
 */
export class ShopPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/web/shop');
    // Wait for React to hydrate
    await this.page.waitForLoadState('networkidle');
  }

  async getMeseta() {
    const text = await this.page.locator('[data-testid="meseta-amount"]').textContent();
    return text ? parseInt(text.replace(/,/g, ''), 10) : 0;
  }

  async selectShopTab(tab: 'items' | 'weapons' | 'armor') {
    await this.page.click(`[data-testid="shop-tab-${tab}"]`, { force: true });
  }

  async selectItem(itemId: string) {
    await this.page.click(`[data-testid="shop-item-${itemId}"]`, { force: true });
  }

  async getItemPrice(itemId: string) {
    const text = await this.page.locator(`[data-testid="item-price-${itemId}"]`).textContent();
    return text ? parseInt(text.replace(/,/g, ''), 10) : 0;
  }

  async setQuantity(quantity: number) {
    await this.page.fill('[data-testid="quantity-input"]', quantity.toString());
  }

  async increaseQuantity() {
    await this.page.click('[data-testid="quantity-increase"]', { force: true });
  }

  async decreaseQuantity() {
    await this.page.click('[data-testid="quantity-decrease"]', { force: true });
  }

  async clickBuy() {
    await this.page.click('[data-testid="buy-button"]', { force: true });
  }

  async clickSell() {
    await this.page.click('[data-testid="sell-button"]', { force: true });
  }

  async isBuyButtonEnabled() {
    const button = this.page.locator('[data-testid="buy-button"]');
    return !(await button.isDisabled());
  }

  async getTotalCost() {
    const text = await this.page.locator('[data-testid="total-cost"]').textContent();
    if (!text) return 0;
    // Extract number from "Total: X,XXX Meseta" format
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  }

  async clickBack() {
    await this.page.click('[data-testid="back-button"]', { force: true });
  }
}
