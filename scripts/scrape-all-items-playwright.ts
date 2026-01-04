/**
 * PSO-World All Items Scraper (Playwright)
 * Scrapes all non-weapon items: armors, slot units, mags, consumables, weapon modifiers, unique
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Item IDs organized by category
const ITEM_IDS = {
  armors: Array.from({ length: 42 }, (_, i) => i + 483),  // 483-524
  slot_units: [
    ...Array.from({ length: 35 }, (_, i) => i + 316),    // 316-350
    ...Array.from({ length: 55 }, (_, i) => i + 428),    // 428-482
  ],
  mags: [315, ...Array.from({ length: 31 }, (_, i) => i + 351)],  // 315, 351-381
  consumables: [
    ...Array.from({ length: 16 }, (_, i) => i + 299),    // 299-314
    ...Array.from({ length: 8 }, (_, i) => i + 525),     // 525-532
  ],
  weapon_modifiers: Array.from({ length: 21 }, (_, i) => i + 533),  // 533-553
  unique: Array.from({ length: 28 }, (_, i) => i + 554),  // 554-581
};

// All item IDs in a single array for scraping
const ALL_ITEM_IDS = [
  ...ITEM_IDS.armors,
  ...ITEM_IDS.slot_units,
  ...ITEM_IDS.mags,
  ...ITEM_IDS.consumables,
  ...ITEM_IDS.weapon_modifiers,
  ...ITEM_IDS.unique,
];

interface PsoWorldItem {
  name: string;
  japaneseName?: string;
  description?: string;
  details?: string;
  category: string;
  rarity: number;
  level?: number;
  maxGrind?: number;
  resaleValue?: number;
  // Armor stats
  defenseBase?: number;
  defenseMax?: number;
  evasionBase?: number;
  evasionMax?: number;
  resistances?: {
    fire?: number;
    ice?: number;
    lightning?: number;
    dark?: number;
    light?: number;
  };
  // Slot unit stats
  attackBase?: number;
  attackMax?: number;
  accuracyBase?: number;
  accuracyMax?: number;
  // Mag stats
  ppBase?: number;
  ppMax?: number;
  // Usability
  usableBy: string[];
  // Findings
  findings?: Array<{
    difficulty: string;
    location: string;
    notes?: string;
  }>;
  psoWorldId: number;
  psoWorldUrl: string;
}

const EXTRACT_ITEM_JS = `() => {
  const item = {};

  // Name from h1
  item.name = document.querySelector('h1')?.textContent?.trim() || '';
  if (!item.name) return null;

  // Determine category from breadcrumb
  const breadcrumbs = document.querySelectorAll('.tborder li');
  for (const crumb of breadcrumbs) {
    const text = crumb.textContent?.trim() || '';
    if (text === 'Armors') item.category = 'armor';
    if (text === 'Slot Units') item.category = 'slot_unit';
    if (text === 'Mags') item.category = 'mag';
    if (text === 'Consumables') item.category = 'consumable';
    if (text === 'Weapon Modifiers') item.category = 'weapon_modifier';
    if (text === 'Unique') item.category = 'unique';
  }
  if (!item.category) item.category = 'unknown';

  // Find attribute table rows
  const allRows = document.querySelectorAll('tr');
  for (const row of allRows) {
    const labelCell = row.querySelector('td.alt2');
    const valueCell = row.querySelector('td.alt1');
    if (!labelCell || !valueCell) continue;

    const label = labelCell.textContent?.trim() || '';
    const value = valueCell.textContent?.trim() || '';

    if (label === 'Japanese Name:') item.japaneseName = value;
    if (label === 'Description:') item.description = value;
    if (label === 'Details:') item.details = value;
    if (label === 'Rarity:') item.rarity = parseInt(value) || 1;
    if (label === 'Maximum Grind:') item.maxGrind = parseInt(value) || 0;
    if (label === 'Requirement:') item.level = parseInt(value.match(/\\d+/)?.[0]) || 1;
    if (label === 'Resale Value:') item.resaleValue = parseInt(value) || 0;

    // Stats with two values (base/max)
    if (label === 'Defense:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        item.defenseBase = parseInt(cells[0]?.textContent) || 0;
        item.defenseMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
    if (label === 'Evasion:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        item.evasionBase = parseInt(cells[0]?.textContent) || 0;
        item.evasionMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
    if (label === 'Attack:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        item.attackBase = parseInt(cells[0]?.textContent) || 0;
        item.attackMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
    if (label === 'Accuracy:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        item.accuracyBase = parseInt(cells[0]?.textContent) || 0;
        item.accuracyMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
    if (label === 'PP:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        item.ppBase = parseInt(cells[0]?.textContent) || 0;
        item.ppMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
  }

  // Resistances table (for armors)
  const tables = document.querySelectorAll('table');
  for (const table of tables) {
    const headerCell = table.querySelector('td.tcat strong');
    if (headerCell?.textContent?.trim() === 'Resistances') {
      item.resistances = {};
      const rows = table.querySelectorAll('tr');
      const headerRow = rows[1];
      const valueRow = rows[2];
      if (headerRow && valueRow) {
        const headers = headerRow.querySelectorAll('td');
        const values = valueRow.querySelectorAll('td');
        const resistMap = { 'Fire': 'fire', 'Ice': 'ice', 'Lightning': 'lightning', 'Dark': 'dark', 'Light': 'light' };
        headers.forEach((h, i) => {
          const headerText = h.textContent?.trim();
          const resistKey = resistMap[headerText];
          if (resistKey && values[i]) {
            const val = values[i].textContent?.trim();
            if (val !== '-') {
              item.resistances[resistKey] = parseInt(val) || 0;
            }
          }
        });
      }
      break;
    }
  }

  // Usable By
  item.usableBy = [];
  const classOrder = ['Hunter Human', 'Hunter Newman', 'Hunter Cast', 'Ranger Human', 'Ranger Cast', 'Force Human', 'Force Newman'];
  for (const table of tables) {
    const headerCell = table.querySelector('td.tcat strong');
    if (headerCell?.textContent?.trim() === 'Usable By') {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td.alt1[align="center"]');
        if (cells.length === 7) {
          cells.forEach((cell, i) => {
            if (cell.textContent?.trim() === 'O') {
              item.usableBy.push(classOrder[i]);
            }
          });
          break;
        }
      }
      break;
    }
  }

  // Findings
  item.findings = [];
  for (const table of tables) {
    const headerCell = table.querySelector('td.tcat');
    if (headerCell?.textContent?.trim() === 'Findings') {
      const rows = table.querySelectorAll('tr');
      for (let i = 2; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td.alt1');
        if (cells.length >= 3) {
          const difficulty = cells[0]?.textContent?.trim() || '';
          const location = cells[1]?.textContent?.trim() || '';
          const notes = cells[3]?.textContent?.trim() || '';
          if (difficulty && location) {
            item.findings.push({ difficulty, location, notes: notes !== '-' ? notes : undefined });
          }
        }
      }
      break;
    }
  }

  item.psoWorldId = parseInt(new URLSearchParams(location.search).get('item')) || 0;
  item.psoWorldUrl = location.href;

  return item;
}`;

const PROGRESS_FILE = path.join(__dirname, '../src/data/psoworld-items-progress.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/psoworld-items.json');

interface Progress {
  completed: number[];
  items: PsoWorldItem[];
}

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      return data;
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }
  return { completed: [], items: [] };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function saveOutput(items: PsoWorldItem[]) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2));
}

async function main() {
  console.log('PSO-World All Items Scraper (Playwright)');
  console.log('========================================');
  console.log(`Total items to scrape: ${ALL_ITEM_IDS.length}`);
  console.log('');

  const progress = loadProgress();
  console.log(`Resuming: ${progress.completed.length} items already scraped, ${progress.items.length} items found`);

  const remaining = ALL_ITEM_IDS.filter(id => !progress.completed.includes(id));
  console.log(`Remaining: ${remaining.length} items to scrape`);
  console.log('');

  if (remaining.length === 0) {
    console.log('All items already scraped!');
    saveOutput(progress.items);
    return;
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < remaining.length; i++) {
    const itemId = remaining[i];
    const url = `https://www.pso-world.com/psz-items.php?item=${itemId}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500);

      const itemData = await page.evaluate(EXTRACT_ITEM_JS);

      if (itemData && itemData.name) {
        progress.items.push(itemData as PsoWorldItem);
        successCount++;
        console.log(`[${i + 1}/${remaining.length}] ✓ ${itemData.name} (${itemData.category || 'unknown'})`);
      } else {
        console.log(`[${i + 1}/${remaining.length}] ✗ Item ${itemId} - no data`);
        failCount++;
      }
    } catch (error) {
      console.log(`[${i + 1}/${remaining.length}] ✗ Item ${itemId} - error: ${(error as Error).message}`);
      failCount++;
    }

    progress.completed.push(itemId);

    // Save progress every 10 items
    if ((i + 1) % 10 === 0) {
      saveProgress(progress);
      console.log(`  [Progress saved: ${progress.items.length} items]`);
      console.log('');
    }

    // Small delay between requests
    await page.waitForTimeout(300);
  }

  await browser.close();

  // Final save
  saveProgress(progress);
  saveOutput(progress.items);

  console.log('');
  console.log('=== Scraping Complete ===');
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total items saved: ${progress.items.length}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
}

main().catch(console.error);
