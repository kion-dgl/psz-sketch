import { test, expect } from '@playwright/test';
import { TitlePage } from '../pages/TitlePage';
import { CharacterSelectPage } from '../pages/CharacterSelectPage';
import { CharacterCreatePage } from '../pages/CharacterCreatePage';
import { CityHubPage } from '../pages/CityHubPage';
import { ShopPage } from '../pages/ShopPage';
import { MissionSelectPage } from '../pages/MissionSelectPage';

test.describe('Game Flow', () => {
  test('new game: title → create → city', async ({ page }) => {
    const titlePage = new TitlePage(page);
    const characterSelectPage = new CharacterSelectPage(page);
    const characterCreatePage = new CharacterCreatePage(page);
    const cityHubPage = new CityHubPage(page);

    // Clear localStorage at start of test (before React hydrates)
    await page.goto('/web/title');
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="start-game"]');
    await titlePage.clickStartGame();

    // Should navigate to character select
    await expect(page).toHaveURL(/\/web\/character-select/);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="new-game-0"]');

    // Click new game on first slot
    await characterSelectPage.clickNewGame(0);

    // Should navigate to character create
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/web\/character-create/);

    // Wait for class selection to load
    await page.waitForSelector('[data-testid="class-HUmar"]');

    // Create a character
    await characterCreatePage.createCharacter({
      classId: 'HUmar',
      name: 'TestHero',
    });

    // Should navigate to city hub
    await expect(page).toHaveURL(/\/web\/city-hub/);
    await page.waitForSelector('[data-testid="character-name"]');
    await expect(await cityHubPage.getCharacterName()).toBe('TestHero');
  });

  test('returning player: title → select → city', async ({ page }) => {
    // Pre-seed localStorage with a character
    await page.addInitScript(() => {
      const character = {
        character_id: 'char_1',
        character_name: 'ReturningHero',
        level: 10,
        experience: 5000,
        slot: 0,
        class_id: 'RAmarl',
        variation_index: 0,
        texture_id: '0_0',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('characters', JSON.stringify([character, null, null, null]));
    });

    const titlePage = new TitlePage(page);
    const characterSelectPage = new CharacterSelectPage(page);
    const cityHubPage = new CityHubPage(page);

    // Start from title screen
    await titlePage.goto();
    await titlePage.clickStartGame();

    // Should navigate to character select
    await expect(page).toHaveURL(/\/web\/character-select/);

    // Select existing character
    await characterSelectPage.selectCharacter(0);

    // Should navigate to city hub
    await expect(page).toHaveURL(/\/web\/city-hub/);
    await expect(await cityHubPage.getCharacterName()).toBe('ReturningHero');
  });

  test('character select shows 4 slots', async ({ page }) => {
    const characterSelectPage = new CharacterSelectPage(page);
    await characterSelectPage.goto();

    const count = await characterSelectPage.getSlotCount();
    expect(count).toBe(4);
  });

  test('delete character works', async ({ page }) => {
    // Pre-seed localStorage with a character
    await page.addInitScript(() => {
      const character = {
        character_id: 'char_1',
        character_name: 'ToDelete',
        level: 5,
        experience: 1000,
        slot: 0,
        class_id: 'HUmar',
        variation_index: 0,
        texture_id: '0_0',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('characters', JSON.stringify([character, null, null, null]));
    });

    const characterSelectPage = new CharacterSelectPage(page);
    await characterSelectPage.goto();

    // Wait for page to load and verify character exists
    await page.waitForSelector('[data-testid="character-slot-0"]');
    await page.waitForSelector('[data-testid="select-character-0"]');

    // Delete character
    await characterSelectPage.clickDeleteCharacter(0);
    await characterSelectPage.confirmDelete();

    // Wait for delete to complete and verify slot is now empty
    await page.waitForSelector('[data-testid="empty-slot"]');
    const isEmpty = await characterSelectPage.isSlotEmpty(0);
    expect(isEmpty).toBe(true);
  });
});

test.describe('Character Creation', () => {
  test('validates character name is required', async ({ page }) => {
    const characterCreatePage = new CharacterCreatePage(page);

    // Clear localStorage before first navigation
    await page.goto('/web/character-create?slot=0');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for class selection screen
    await page.waitForSelector('[data-testid="class-HUmar"]');

    // Select class (this navigates to customization screen)
    await characterCreatePage.selectClass('HUmar');

    // Wait for customization screen with name input
    await page.waitForSelector('[data-testid="character-name-input"]');

    // Don't enter name, just click create
    await characterCreatePage.clickCreate();

    // Should show validation error
    await page.waitForSelector('[data-testid="validation-error"]');
    const error = await characterCreatePage.getValidationError();
    expect(error).toContain('name');
  });

  test('creates character with all customization options', async ({ page }) => {
    const characterCreatePage = new CharacterCreatePage(page);
    const cityHubPage = new CityHubPage(page);

    // Clear localStorage before first navigation
    await page.goto('/web/character-create?slot=0');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for class selection screen
    await page.waitForSelector('[data-testid="class-FOmarl"]');

    await characterCreatePage.createCharacter({
      classId: 'FOmarl',
      name: 'CustomChar',
      variationIndex: 2,
      bodyColorIndex: 1,
      hairColorIndex: 2,
      skinToneIndex: 1,
    });

    // Should navigate to city hub
    await expect(page).toHaveURL(/\/web\/city-hub/);
    await page.waitForSelector('[data-testid="character-name"]');
    await expect(await cityHubPage.getCharacterName()).toBe('CustomChar');
  });
});

test.describe('Shop Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-seed localStorage with a character with meseta
    await page.addInitScript(() => {
      const character = {
        character_id: 'char_shop',
        character_name: 'ShopTester',
        level: 10,
        experience: 5000,
        slot: 0,
        class_id: 'HUmar',
        variation_index: 0,
        texture_id: '0_0',
        created_at: new Date().toISOString(),
        meseta: 5000,
      };
      localStorage.setItem('characters', JSON.stringify([character, null, null, null]));
      localStorage.setItem('selectedCharacterId', character.character_id);
    });
  });

  test('shop: browse → purchase → meseta updated', async ({ page }) => {
    const shopPage = new ShopPage(page);
    await shopPage.goto();

    // Wait for shop to load
    await page.waitForSelector('[data-testid="shop"]');
    await page.waitForSelector('[data-testid="meseta-amount"]');

    // Check initial meseta
    const initialMeseta = await shopPage.getMeseta();
    expect(initialMeseta).toBe(5000);

    // Wait for shop items to load and select monomate (costs 50)
    await page.waitForSelector('[data-testid="shop-item-monomate"]');
    await shopPage.selectItem('monomate');

    // Wait for purchase section to appear
    await page.waitForSelector('[data-testid="quantity-input"]');

    // Buy 2 items
    await shopPage.setQuantity(2);

    // Wait for total to update
    await page.waitForSelector('[data-testid="total-cost"]');
    const total = await shopPage.getTotalCost();
    expect(total).toBe(100);

    // Complete purchase
    await shopPage.clickBuy();

    // Wait for meseta to update
    await page.waitForTimeout(500);
    const newMeseta = await shopPage.getMeseta();
    expect(newMeseta).toBe(4900);
  });

  test('shop: cannot buy when insufficient funds', async ({ page }) => {
    const shopPage = new ShopPage(page);
    await shopPage.goto();

    // Wait for shop to load
    await page.waitForSelector('[data-testid="shop"]');

    // Select weapons tab
    await shopPage.selectShopTab('weapons');

    // Wait for weapon items to load and select buster (costs 5000 - exactly our meseta)
    await page.waitForSelector('[data-testid="shop-item-buster"]');
    await shopPage.selectItem('buster');

    // Wait for purchase section
    await page.waitForSelector('[data-testid="buy-button"]');

    // With exactly 5000 meseta and item costing 5000, buy should be enabled
    // But if we try to buy 2, it should be disabled
    await shopPage.setQuantity(2);
    await page.waitForTimeout(100);

    // Check buy button is disabled for qty 2 (10000 meseta needed)
    const canBuy = await shopPage.isBuyButtonEnabled();
    expect(canBuy).toBe(false);
  });
});

test.describe('Mission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const character = {
        character_id: 'char_mission',
        character_name: 'MissionTester',
        level: 30,
        experience: 50000,
        slot: 0,
        class_id: 'RAmarl',
        variation_index: 0,
        texture_id: '0_0',
        created_at: new Date().toISOString(),
        meseta: 10000,
      };
      localStorage.setItem('characters', JSON.stringify([character, null, null, null]));
      localStorage.setItem('selectedCharacterId', character.character_id);
    });
  });

  test('mission: select → difficulty → start', async ({ page }) => {
    const missionSelectPage = new MissionSelectPage(page);
    await missionSelectPage.goto();

    // Wait for mission page to load
    await page.waitForSelector('[data-testid="mission-select"]');

    // Wait for missions to load (may take a moment)
    await page.waitForSelector('[data-testid^="mission-"]', { timeout: 5000 });

    // Should have available missions
    const count = await missionSelectPage.getMissionCount();
    expect(count).toBeGreaterThan(0);

    // Select a mission
    await missionSelectPage.selectMission('mayors-mission');

    // Wait for difficulty buttons to appear
    await page.waitForSelector('[data-testid="difficulty-hard"]');

    // Select difficulty (level 30 can do hard)
    await missionSelectPage.selectDifficulty('hard');

    // Setup dialog handler before clicking
    page.on('dialog', dialog => dialog.accept());

    // Start mission
    await missionSelectPage.clickStartMission();
  });

  test('mission: difficulty restrictions based on level', async ({ page }) => {
    // Use a lower level character
    await page.addInitScript(() => {
      const character = {
        character_id: 'char_low',
        character_name: 'LowLevel',
        level: 10,
        experience: 3000,
        slot: 0,
        class_id: 'HUmar',
        variation_index: 0,
        texture_id: '0_0',
        created_at: new Date().toISOString(),
        meseta: 1000,
      };
      localStorage.setItem('characters', JSON.stringify([character, null, null, null]));
      localStorage.setItem('selectedCharacterId', character.character_id);
    });

    const missionSelectPage = new MissionSelectPage(page);
    await missionSelectPage.goto();

    // Wait for page and missions to load
    await page.waitForSelector('[data-testid="mission-select"]');
    await page.waitForSelector('[data-testid^="mission-"]', { timeout: 5000 });

    await missionSelectPage.selectMission('mayors-mission');

    // Wait for difficulty buttons
    await page.waitForSelector('[data-testid="difficulty-normal"]');

    // Normal should be enabled
    expect(await missionSelectPage.isDifficultyEnabled('normal')).toBe(true);

    // Hard requires level 20, should be disabled for level 10
    expect(await missionSelectPage.isDifficultyEnabled('hard')).toBe(false);

    // Super-hard requires level 50
    expect(await missionSelectPage.isDifficultyEnabled('super-hard')).toBe(false);
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const character = {
        character_id: 'char_nav',
        character_name: 'NavTester',
        level: 50,
        experience: 300000,
        slot: 0,
        class_id: 'FOmarl',
        variation_index: 0,
        texture_id: '0_0',
        created_at: new Date().toISOString(),
        meseta: 50000,
      };
      localStorage.setItem('characters', JSON.stringify([character, null, null, null]));
      localStorage.setItem('selectedCharacterId', character.character_id);
    });
  });

  test('city hub navigation works', async ({ page }) => {
    const cityHubPage = new CityHubPage(page);
    await cityHubPage.goto();

    // Navigate to shop
    await cityHubPage.clickShop();
    await expect(page).toHaveURL(/\/web\/shop/);

    // Go back
    const shopPage = new ShopPage(page);
    await shopPage.clickBack();
    await expect(page).toHaveURL(/\/web\/city-hub/);

    // Navigate to missions
    await cityHubPage.clickMissions();
    await expect(page).toHaveURL(/\/web\/mission-select/);
  });

  test('logout returns to character select', async ({ page }) => {
    const cityHubPage = new CityHubPage(page);
    await cityHubPage.goto();

    await cityHubPage.clickLogout();
    await expect(page).toHaveURL(/\/web\/character-select/);
  });
});
