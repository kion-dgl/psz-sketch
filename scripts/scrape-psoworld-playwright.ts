/**
 * PSO-World Weapon Scraper using Playwright
 *
 * Run with: npx tsx scripts/scrape-psoworld-playwright.ts
 *
 * This script uses Playwright to scrape weapon data from PSO-World.
 * It saves progress incrementally so you can resume if interrupted.
 */

import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const PSO_WORLD_BASE = 'https://www.pso-world.com';
const OUTPUT_FILE = 'src/data/psoworld-weapon-stats.json';
const PROGRESS_FILE = 'src/data/psoworld-scrape-progress.json';

// All weapon item IDs from the weapons category page
const WEAPON_IDS = [
  // 1-298
  ...Array.from({ length: 298 }, (_, i) => i + 1),
  // 382-427
  ...Array.from({ length: 46 }, (_, i) => i + 382),
  // 582
  582
];

interface PhotonArt {
  name: string;
  attackMod: number;
  accuracyMod: number;
  ppUsed: number;
  element: string;
}

interface WeaponStats {
  name: string;
  japaneseName: string;
  description: string;
  weaponType: string;
  rarity: number;
  level: number;
  element: string;
  elementLevel: number;
  maxGrind: number;
  resaleValue: number;
  attackBase: number;
  attackMax: number;
  accuracyBase: number;
  accuracyMax: number;
  defenseBase?: number;
  defenseMax?: number;
  photonArts: PhotonArt[];
  usableBy: string[];
  psoWorldId: number;
  psoWorldUrl: string;
}

function parseWeaponPage(html: string, itemId: number): WeaponStats | null {
  try {
    // Extract weapon name from h1
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = nameMatch?.[1]?.trim() || '';

    if (!name || name === 'Unknown') {
      return null;
    }

    // Japanese Name
    const jpMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Japanese Name:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>([^<]+)/i
    );
    const japaneseName = jpMatch?.[1]?.trim() || '';

    // Description
    const descMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Description:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>([\s\S]*?)<\/td>/i
    );
    const description = descMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

    // Weapon Type
    const typeMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Weapon Type:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>[\s\S]*?>\s*([^<]+)/i
    );
    const weaponType = typeMatch?.[1]?.trim() || '';

    // Rarity
    const rarityMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Rarity:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>\s*(\d+)/i
    );
    const rarity = parseInt(rarityMatch?.[1] || '1');

    // Level Requirement
    const levelMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Requirement:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>\s*Level\s*(\d+)/i
    );
    const level = parseInt(levelMatch?.[1] || '1');

    // Elemental Ability
    const elementMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Elemental Ability:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>([^<]+)/i
    );
    let elementStr = elementMatch?.[1]?.trim() || 'None';
    let element = 'None';
    let elementLevel = 0;

    const elemLevelMatch = elementStr.match(/Level\s*(\d+)\s*(\w+)/i);
    if (elemLevelMatch) {
      elementLevel = parseInt(elemLevelMatch[1]);
      element = elemLevelMatch[2];
    }

    // Max Grind
    const grindMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Maximum Grind:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>\s*(\d+)/i
    );
    const maxGrind = parseInt(grindMatch?.[1] || '0');

    // Resale Value
    const resaleMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Resale Value:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>\s*(\d+)/i
    );
    const resaleValue = parseInt(resaleMatch?.[1] || '0');

    // Stats
    const extractStatRow = (statName: string): [number, number] => {
      const regex = new RegExp(
        `<td[^>]*>\\s*${statName}:?\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>`,
        'i'
      );
      const match = html.match(regex);
      return match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
    };

    const [attackBase, attackMax] = extractStatRow('Attack');
    const [accuracyBase, accuracyMax] = extractStatRow('Accuracy');
    const [defenseBase, defenseMax] = extractStatRow('Defense');

    // Photon Arts
    const photonArts: PhotonArt[] = [];
    const paSection = html.match(/Photon Arts<\/td>[\s\S]*?<\/table>/i);
    if (paSection) {
      const paRowRegex = /<tr>\s*<td class="alt1"[^>]*>([^<]+)<\/td>\s*<td class="alt1"[^>]*>(\d+)%<\/td>\s*<td class="alt1"[^>]*>(\d+)%<\/td>\s*<td class="alt1"[^>]*>(\d+)<\/td>\s*<td class="alt1"[^>]*>([^<]*)<\/td>/gi;
      let paMatch;
      while ((paMatch = paRowRegex.exec(paSection[0])) !== null) {
        photonArts.push({
          name: paMatch[1].trim(),
          attackMod: parseInt(paMatch[2]),
          accuracyMod: parseInt(paMatch[3]),
          ppUsed: parseInt(paMatch[4]),
          element: paMatch[5].trim() || '-',
        });
      }
    }

    // Usable By
    const usableBy: string[] = [];
    const classOrder = [
      'Hunter Human', 'Hunter Newman', 'Hunter Cast',
      'Ranger Human', 'Ranger Cast',
      'Force Human', 'Force Newman'
    ];

    const usableSection = html.match(/Usable By[\s\S]*?<\/table>/i);
    if (usableSection) {
      const oxMatches = usableSection[0].match(/<td[^>]*class="alt1"[^>]*align="center"[^>]*>\s*([OX])\s*<\/td>/gi);
      if (oxMatches && oxMatches.length >= 7) {
        for (let i = 0; i < 7; i++) {
          const val = oxMatches[i].match(/>\s*([OX])\s*</i);
          if (val && val[1] === 'O') {
            usableBy.push(classOrder[i]);
          }
        }
      }
    }

    const result: WeaponStats = {
      name,
      japaneseName,
      description,
      weaponType,
      rarity,
      level,
      element,
      elementLevel,
      maxGrind,
      resaleValue,
      attackBase,
      attackMax,
      accuracyBase,
      accuracyMax,
      photonArts,
      usableBy,
      psoWorldId: itemId,
      psoWorldUrl: `${PSO_WORLD_BASE}/psz-items.php?item=${itemId}`,
    };

    if (defenseBase > 0 || defenseMax > 0) {
      result.defenseBase = defenseBase;
      result.defenseMax = defenseMax;
    }

    return result;
  } catch (error) {
    console.error(`Parse error for item ${itemId}:`, error);
    return null;
  }
}

async function scrapeWeapon(page: Page, itemId: number): Promise<WeaponStats | null> {
  const url = `${PSO_WORLD_BASE}/psz-items.php?item=${itemId}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500); // Small delay to be nice to the server

    const html = await page.content();
    return parseWeaponPage(html, itemId);
  } catch (error) {
    console.error(`Failed to fetch item ${itemId}:`, error);
    return null;
  }
}

function loadProgress(): { completed: number[]; weapons: WeaponStats[] } {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return data;
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return { completed: [], weapons: [] };
}

function saveProgress(completed: number[], weapons: WeaponStats[]) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed, weapons }, null, 2));
}

async function main() {
  console.log('PSO-World Weapon Scraper (Playwright)');
  console.log('=====================================\n');

  // Load any existing progress
  let { completed, weapons } = loadProgress();
  console.log(`Resuming: ${completed.length} items already scraped, ${weapons.length} weapons found\n`);

  // Filter out already completed IDs
  const remaining = WEAPON_IDS.filter(id => !completed.includes(id));
  console.log(`Remaining: ${remaining.length} items to scrape\n`);

  if (remaining.length === 0) {
    console.log('All items already scraped!');
    // Save final output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(weapons, null, 2));
    console.log(`\nSaved to: ${OUTPUT_FILE}`);
    return;
  }

  // Launch browser
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  try {
    for (let i = 0; i < remaining.length; i++) {
      const itemId = remaining[i];
      const weapon = await scrapeWeapon(page, itemId);

      completed.push(itemId);

      if (weapon) {
        weapons.push(weapon);
        successCount++;
        console.log(`[${i + 1}/${remaining.length}] ✓ ${weapon.name} (${weapon.rarity}★ ${weapon.weaponType})`);
      } else {
        failCount++;
        console.log(`[${i + 1}/${remaining.length}] ✗ Item ${itemId} - no data or error`);
      }

      // Save progress every 10 items
      if ((i + 1) % 10 === 0) {
        saveProgress(completed, weapons);
        console.log(`  [Progress saved: ${weapons.length} weapons]\n`);
      }

      // Rate limit - 1 second between requests
      await page.waitForTimeout(1000);
    }
  } finally {
    await browser.close();
  }

  // Final save
  saveProgress(completed, weapons);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(weapons, null, 2));

  console.log('\n=====================================');
  console.log(`Scraping complete!`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed/Empty: ${failCount}`);
  console.log(`  Total weapons: ${weapons.length}`);
  console.log(`\nSaved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
