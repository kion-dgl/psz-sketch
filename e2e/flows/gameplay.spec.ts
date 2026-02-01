import { test, expect } from '@playwright/test';
import { GamePlayPage } from '../pages/GamePlayPage';

test.describe('Gameplay CLI Interface', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
  });

  test('initializes with welcome message', async () => {
    const log = await gamePlayPage.getLatestLog();
    expect(log).toContain('Game initialized');
  });

  test('shows no character initially', async () => {
    const hasChar = await gamePlayPage.hasCharacter();
    expect(hasChar).toBe(false);
  });

  test('reset game clears state', async () => {
    // Create a character first
    await gamePlayPage.clickQuickAction('create-character humar TestHunter');
    expect(await gamePlayPage.hasCharacter()).toBe(true);

    // Reset
    await gamePlayPage.resetGame();

    // Should be cleared
    expect(await gamePlayPage.hasCharacter()).toBe(false);
  });
});

test.describe('Character Creation via CLI', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
  });

  test('creates HUmar character', async () => {
    await gamePlayPage.clickQuickAction('create-character humar TestHunter');

    expect(await gamePlayPage.hasCharacter()).toBe(true);
    expect(await gamePlayPage.getCharacterName()).toBe('TestHunter');
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

    const hasError = await gamePlayPage.hasErrorLog();
    expect(hasError).toBe(true);
  });
});

test.describe('Location Navigation', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    // Create character to enable navigation
    await gamePlayPage.executeCommand('create-character humar TestNav');
  });

  test('starts in city location', async () => {
    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('city');
  });

  test('navigates to shop', async () => {
    await gamePlayPage.clickQuickAction('goto shop');

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('shop');
  });

  test('navigates to guild', async () => {
    await gamePlayPage.clickQuickAction('goto guild');

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('guild');
  });

  test('returns to city from shop', async () => {
    await gamePlayPage.executeCommand('goto shop');
    await gamePlayPage.clickQuickAction('goto city');

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('city');
  });
});

test.describe('Shop Interactions', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.executeCommand('create-character humar ShopTest');
    await gamePlayPage.executeCommand('goto shop');
  });

  test('can list items in shop', async () => {
    await gamePlayPage.clickQuickAction('list-items');

    const log = await gamePlayPage.getLatestLog();
    expect(log).toContain('monomate');
  });

  test('can buy monomate', async () => {
    const initialMeseta = await gamePlayPage.getMeseta();
    await gamePlayPage.clickQuickAction('buy monomate');

    // Check success log
    const hasSuccess = await gamePlayPage.hasSuccessLog();
    expect(hasSuccess).toBe(true);

    // Meseta should decrease
    const newMeseta = await gamePlayPage.getMeseta();
    expect(newMeseta).toBeLessThan(initialMeseta ?? 0);
  });

  test('monomate appears in inventory after purchase', async () => {
    await gamePlayPage.executeCommand('buy monomate');

    const items = await gamePlayPage.getInventoryItems();
    expect(items.some(item => item.includes('monomate'))).toBe(true);
  });
});

test.describe('Guild & Field Entry', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.executeCommand('create-character humar FieldTest');
    await gamePlayPage.executeCommand('goto guild');
  });

  test('can list available fields', async () => {
    await gamePlayPage.clickQuickAction('list-fields');

    const log = await gamePlayPage.getLatestLog();
    expect(log?.toLowerCase()).toContain('gurhacia');
  });

  test('can enter field', async () => {
    await gamePlayPage.clickQuickAction('enter-field gurhacia-valley normal');

    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).toContain('field');
  });

  test('can use telepipe to return', async ({ page }) => {
    await gamePlayPage.executeCommand('enter-field gurhacia-valley normal');

    // Wait for field entry
    await page.waitForTimeout(200);

    await gamePlayPage.clickQuickAction('use-telepipe');

    // Should be back in guild or city area
    const location = await gamePlayPage.getCurrentLocation();
    expect(location?.toLowerCase()).not.toContain('field');
  });
});

test.describe('Stats & Equipment Display', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
    await gamePlayPage.executeCommand('create-character humar StatsTest');
  });

  test('show-stats displays character info', async () => {
    await gamePlayPage.clickQuickAction('show-stats');

    const log = await gamePlayPage.getLatestLog();
    // Should show HP, ATP, or other stats
    expect(log).toMatch(/HP|ATP|DFP|Level/i);
  });

  test('show-inventory displays items', async () => {
    await gamePlayPage.clickQuickAction('show-inventory');

    const log = await gamePlayPage.getLatestLog();
    expect(log).toBeDefined();
  });

  test('show-equipment displays equipment slots', async () => {
    await gamePlayPage.clickQuickAction('show-equipment');

    const log = await gamePlayPage.getLatestLog();
    // Should mention weapon, armor, or equipment slots
    expect(log).toMatch(/weapon|armor|equipment|slot/i);
  });
});

test.describe('Command System', () => {
  let gamePlayPage: GamePlayPage;

  test.beforeEach(async ({ page }) => {
    gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();
  });

  test('shows available commands in sidebar', async () => {
    const commands = await gamePlayPage.getAvailableCommands();
    expect(commands.length).toBeGreaterThan(0);
  });

  test('clicking command populates input', async ({ page }) => {
    await gamePlayPage.clickCommand('create-character');

    const input = page.locator('[data-testid="command-input"]');
    const value = await input.inputValue();
    expect(value).toContain('create-character');
  });
});

test.describe('Full Game Loop', () => {
  test('complete loop: create → shop → guild → field → return', async ({ page }) => {
    const gamePlayPage = new GamePlayPage(page);
    await gamePlayPage.goto();

    // 1. Create character
    await gamePlayPage.executeCommand('create-character humar LoopTest');
    expect(await gamePlayPage.hasCharacter()).toBe(true);

    // 2. Go to shop and buy item
    await gamePlayPage.executeCommand('goto shop');
    await gamePlayPage.executeCommand('buy monomate');
    expect(await gamePlayPage.hasInventoryItem('monomate')).toBe(true);

    // 3. Return to city
    await gamePlayPage.executeCommand('goto city');
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).toContain('city');

    // 4. Go to guild
    await gamePlayPage.executeCommand('goto guild');
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).toContain('guild');

    // 5. Enter field
    await gamePlayPage.executeCommand('enter-field gurhacia-valley normal');
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).toContain('field');

    // 6. Use telepipe to return
    await gamePlayPage.executeCommand('use-telepipe');
    expect((await gamePlayPage.getCurrentLocation())?.toLowerCase()).not.toContain('field');
  });
});
