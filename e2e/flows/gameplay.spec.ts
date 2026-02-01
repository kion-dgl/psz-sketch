import { test, expect } from '@playwright/test';
import { GamePlayPage } from '../pages/GamePlayPage';

test.describe('Gameplay Interface', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
  });

  test('initializes with welcome message', async () => {
    const hasWelcome = await gamePlayPage.hasLogContaining('welcome');
    expect(hasWelcome).toBe(true);
  });

  test('shows no character initially', async () => {
    const hasChar = await gamePlayPage.hasCharacter();
    expect(hasChar).toBe(false);
  });

  test('reset game clears state', async () => {
    // Create a character first
    await gamePlayPage.clickCreateClass('HUmar');
    expect(await gamePlayPage.hasCharacter()).toBe(true);

    // Reset
    await gamePlayPage.resetGame();

    // Should be cleared
    expect(await gamePlayPage.hasCharacter()).toBe(false);
  });
});

test.describe('Character Creation', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
  });

  test('creates HUmar via UI button', async () => {
    await gamePlayPage.clickCreateClass('HUmar');

    expect(await gamePlayPage.hasCharacter()).toBe(true);
    expect(await gamePlayPage.getCharacterClass()).toBe('HUmar');
  });

  test('creates character via command input', async () => {
    await gamePlayPage.executeCommand('create-character ramarl RangerGirl');

    expect(await gamePlayPage.hasCharacter()).toBe(true);
    expect(await gamePlayPage.getCharacterName()).toBe('RangerGirl');
    expect(await gamePlayPage.getCharacterClass()).toBe('RAmarl');
  });

  test('character starts at level 1', async () => {
    await gamePlayPage.executeCommand('create-character fomarl MagicUser');

    const level = await gamePlayPage.getCharacterLevel();
    expect(level).toBe(1);
  });

  test('shows error for invalid class', async () => {
    await gamePlayPage.executeCommand('create-character invalidclass Name');

    const hasError = await gamePlayPage.hasLogContaining('invalid');
    expect(hasError).toBe(true);
  });
});

test.describe('Location Navigation', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.clickCreateClass('HUmar');
  });

  test('starts in city location', async () => {
    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('city');
  });

  test('navigates to shop via button', async () => {
    await gamePlayPage.clickGotoShop();

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('shop');
  });

  test('navigates to guild via button', async () => {
    await gamePlayPage.clickGotoGuild();

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('guild');
  });

  test('returns to city from shop', async () => {
    await gamePlayPage.clickGotoShop();
    await gamePlayPage.executeCommand('goto city');

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('city');
  });
});

test.describe('Shop Interactions', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.clickCreateClass('HUmar');
    await gamePlayPage.clickGotoShop();
  });

  test('shop shows items', async ({ page }) => {
    // Should see monomate in shop
    const monomate = page.locator('[data-testid="shop-item-monomate"]');
    expect(await monomate.count()).toBeGreaterThan(0);
  });

  test('can buy monomate', async () => {
    const initialMeseta = await gamePlayPage.getMeseta();
    await gamePlayPage.clickBuyItem('monomate');

    // Meseta should decrease
    const newMeseta = await gamePlayPage.getMeseta();
    expect(newMeseta).toBeLessThan(initialMeseta ?? 0);
  });

  test('monomate appears in inventory after purchase', async () => {
    await gamePlayPage.clickBuyItem('monomate');

    const hasItem = await gamePlayPage.hasInventoryItem('monomate');
    expect(hasItem).toBe(true);
  });
});

test.describe('Teleporter & Field Entry', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.clickCreateClass('HUmar');
    await gamePlayPage.clickGotoTeleporter();
  });

  test('teleporter shows fields', async ({ page }) => {
    const field = page.locator('[data-testid="field-gurhacia-valley"]');
    expect(await field.count()).toBeGreaterThan(0);
  });

  test('can enter field', async () => {
    await gamePlayPage.clickEnterField('gurhacia-valley');

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('field');
  });

  test('can use telepipe to return', async ({ page }) => {
    await gamePlayPage.clickEnterField('gurhacia-valley');
    await page.waitForTimeout(200);

    await gamePlayPage.clickTelepipe();

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).not.toContain('field');
  });
});

test.describe('Stats Display', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.clickCreateClass('HUmar');
  });

  test('shows character stats in sidebar', async ({ page }) => {
    // Stats panel should show character info
    const statsPanel = page.locator('[data-testid="stats-panel"]');
    const text = await statsPanel.textContent();
    expect(text).toContain('Level');
    expect(text).toContain('Meseta');
  });

  test('shows inventory in sidebar', async ({ page }) => {
    const invPanel = page.locator('[data-testid="inventory-panel"]');
    expect(await invPanel.count()).toBe(1);
  });

  test('shows equipment in sidebar', async ({ page }) => {
    const weaponSlot = page.locator('[data-testid="equip-slot-weapon"]');
    expect(await weaponSlot.count()).toBe(1);
  });
});

test.describe('Full Game Loop', () => {
  test('complete loop: create → shop → teleporter → field → return', async ({ page }) => {
    const gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();

    // 1. Create character via UI
    await gamePlayPage.clickCreateClass('HUmar');
    expect(await gamePlayPage.hasCharacter()).toBe(true);

    // 2. Go to shop and buy item
    await gamePlayPage.clickGotoShop();
    await gamePlayPage.clickBuyItem('monomate');
    expect(await gamePlayPage.hasInventoryItem('monomate')).toBe(true);

    // 3. Return to city
    await gamePlayPage.executeCommand('goto city');
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).toContain('city');

    // 4. Go to teleporter
    await gamePlayPage.clickGotoTeleporter();
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).toContain('teleporter');

    // 5. Enter field
    await gamePlayPage.clickEnterField('gurhacia-valley');
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).toContain('field');

    // 6. Use telepipe to return
    await gamePlayPage.clickTelepipe();
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).not.toContain('field');
  });
});
