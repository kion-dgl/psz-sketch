/**
 * PSO-World Weapon Stats Scraper
 *
 * Run with: npx tsx scripts/scrape-psoworld-weapons.ts
 *
 * This script scrapes detailed weapon stats from PSO-World.com
 * You may need to run this from a browser context or add cookies
 * if the site blocks automated requests.
 */

import * as fs from 'fs';
import * as path from 'path';

const PSO_WORLD_BASE = 'https://www.pso-world.com';

interface PhotonArt {
  name: string;
  attackMod: number;
  accuracyMod: number;
  ppUsed: number;
  elementalAbility: string;
}

interface WeaponStats {
  attack: number;
  attackMax: number;
  accuracy: number;
  accuracyMax: number;
}

interface UsableBy {
  hunterHuman: boolean;
  hunterNewman: boolean;
  hunterCast: boolean;
  rangerHuman: boolean;
  rangerCast: boolean;
  forceHuman: boolean;
  forceNewman: boolean;
}

interface WeaponDetails {
  name: string;
  japaneseName: string;
  weaponType: string;
  rarity: number;
  levelRequirement: number;
  elementalAbility: string;
  maxGrind: number;
  resaleValue: number;
  stats: WeaponStats;
  photonArts: PhotonArt[];
  usableBy: UsableBy;
  description?: string;
  psoWorldItemId: number;
  psoWorldUrl: string;
}

// Weapon name to PSO-World item ID mapping
// This needs to be populated - you can find IDs by browsing the site
const WEAPON_IDS: Record<string, number> = {
  // Example - add more as discovered
  'Cannon Bleu': 256,
  // Will need to populate this from browsing PSO-World
};

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.pso-world.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function parseWeaponDetails(html: string, itemId: number): WeaponDetails | null {
  try {
    // Extract weapon name from title/header
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                      html.match(/# ([^\n]+)\n/);
    const name = nameMatch?.[1]?.trim() || 'Unknown';

    // Japanese name
    const jpNameMatch = html.match(/Japanese Name:<\/td>\s*<td[^>]*>([^<]+)/i);
    const japaneseName = jpNameMatch?.[1]?.trim() || '';

    // Rarity (look for star count)
    const rarityMatch = html.match(/Rarity:<\/td>\s*<td[^>]*>\s*(\d+)/i);
    const rarity = parseInt(rarityMatch?.[1] || '1');

    // Weapon Type
    const typeMatch = html.match(/Weapon Type:<\/td>\s*<td[^>]*>[^<]*<\/[^>]+>\s*([^<]+)/i);
    const weaponType = typeMatch?.[1]?.trim() || '';

    // Elemental Ability
    const elementMatch = html.match(/Elemental Ability:<\/td>\s*<td[^>]*>([^<]+)/i);
    const elementalAbility = elementMatch?.[1]?.trim() || 'None';

    // Max Grind
    const grindMatch = html.match(/Maximum Grind:<\/td>\s*<td[^>]*>(\d+)/i);
    const maxGrind = parseInt(grindMatch?.[1] || '0');

    // Level Requirement
    const levelMatch = html.match(/Requirement:<\/td>\s*<td[^>]*>Level\s*(\d+)/i);
    const levelRequirement = parseInt(levelMatch?.[1] || '1');

    // Resale Value
    const resaleMatch = html.match(/Resale Value:<\/td>\s*<td[^>]*>(\d+)/i);
    const resaleValue = parseInt(resaleMatch?.[1] || '0');

    // Stats - Attack and Accuracy
    const attackMatch = html.match(/Attack:<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)/i);
    const accuracyMatch = html.match(/Accuracy:<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)/i);

    const stats: WeaponStats = {
      attack: parseInt(attackMatch?.[1] || '0'),
      attackMax: parseInt(attackMatch?.[2] || '0'),
      accuracy: parseInt(accuracyMatch?.[1] || '0'),
      accuracyMax: parseInt(accuracyMatch?.[2] || '0'),
    };

    // Photon Arts - parse table rows
    const photonArts: PhotonArt[] = [];
    const paTableMatch = html.match(/Photon Arts[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (paTableMatch) {
      const paRows = paTableMatch[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      for (const row of paRows) {
        // Skip header row
        if (row.includes('<th') || row.includes('Name')) continue;

        const cells = row.match(/<td[^>]*>([^<]*)<\/td>/gi) || [];
        if (cells.length >= 5) {
          const extractText = (cell: string) => cell.replace(/<[^>]+>/g, '').trim();
          photonArts.push({
            name: extractText(cells[0]),
            attackMod: parseInt(extractText(cells[1]).replace('%', '')) || 0,
            accuracyMod: parseInt(extractText(cells[2]).replace('%', '')) || 0,
            ppUsed: parseInt(extractText(cells[3])) || 0,
            elementalAbility: extractText(cells[4]) || '-',
          });
        }
      }
    }

    // Usable By - parse the class table
    const usableBy: UsableBy = {
      hunterHuman: false,
      hunterNewman: false,
      hunterCast: false,
      rangerHuman: false,
      rangerCast: false,
      forceHuman: false,
      forceNewman: false,
    };

    // Look for O markers in the usable by section
    const usableMatch = html.match(/Usable By[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
    if (usableMatch) {
      const usableHtml = usableMatch[1];
      // The order is: HunterHuman, HunterNewman, HunterCast, RangerHuman, RangerCast, ForceHuman, ForceNewman
      const oMarkers = usableHtml.match(/>\s*O\s*</gi) || [];
      const xMarkers = usableHtml.match(/>\s*X\s*</gi) || [];

      // Parse the actual row data
      const dataRow = usableHtml.match(/<tr[^>]*>(?!.*?<th)[\s\S]*?<\/tr>/gi);
      if (dataRow && dataRow.length > 0) {
        const lastRow = dataRow[dataRow.length - 1];
        const cells = lastRow.match(/<td[^>]*>([^<]*)<\/td>/gi) || [];
        const values = cells.map(c => c.replace(/<[^>]+>/g, '').trim());

        if (values.length >= 7) {
          usableBy.hunterHuman = values[0] === 'O';
          usableBy.hunterNewman = values[1] === 'O';
          usableBy.hunterCast = values[2] === 'O';
          usableBy.rangerHuman = values[3] === 'O';
          usableBy.rangerCast = values[4] === 'O';
          usableBy.forceHuman = values[5] === 'O';
          usableBy.forceNewman = values[6] === 'O';
        }
      }
    }

    return {
      name,
      japaneseName,
      weaponType,
      rarity,
      levelRequirement,
      elementalAbility,
      maxGrind,
      resaleValue,
      stats,
      photonArts,
      usableBy,
      psoWorldItemId: itemId,
      psoWorldUrl: `${PSO_WORLD_BASE}/psz-items.php?item=${itemId}`,
    };
  } catch (error) {
    console.error(`Error parsing weapon details:`, error);
    return null;
  }
}

async function scrapeWeaponById(itemId: number): Promise<WeaponDetails | null> {
  const url = `${PSO_WORLD_BASE}/psz-items.php?item=${itemId}`;
  console.log(`Fetching ${url}...`);

  try {
    const html = await fetchPage(url);
    return parseWeaponDetails(html, itemId);
  } catch (error) {
    console.error(`Failed to scrape item ${itemId}:`, error);
    return null;
  }
}

async function scrapeWeaponList(): Promise<number[]> {
  // Try to get the weapons list to find all item IDs
  const url = `${PSO_WORLD_BASE}/psz-items.php?cat=1`;
  console.log(`Fetching weapons list from ${url}...`);

  try {
    const html = await fetchPage(url);

    // Extract all item IDs from links
    const itemIdMatches = html.matchAll(/psz-items\.php\?item=(\d+)/g);
    const ids = new Set<number>();

    for (const match of itemIdMatches) {
      ids.add(parseInt(match[1]));
    }

    return Array.from(ids).sort((a, b) => a - b);
  } catch (error) {
    console.error('Failed to fetch weapons list:', error);
    return [];
  }
}

async function main() {
  console.log('PSO-World Weapon Stats Scraper');
  console.log('==============================\n');

  // First try to get the list of all weapon IDs
  console.log('Step 1: Fetching weapon list...');
  const weaponIds = await scrapeWeaponList();

  if (weaponIds.length === 0) {
    console.log('\nCould not fetch weapon list automatically.');
    console.log('Using manual item ID range scan (1-500)...\n');

    // Fall back to scanning a range
    for (let i = 1; i <= 500; i++) {
      weaponIds.push(i);
    }
  } else {
    console.log(`Found ${weaponIds.length} weapon IDs\n`);
  }

  // Scrape each weapon
  const weapons: WeaponDetails[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const itemId of weaponIds) {
    const weapon = await scrapeWeaponById(itemId);

    if (weapon && weapon.name !== 'Unknown') {
      weapons.push(weapon);
      successCount++;
      console.log(`  ✓ ${weapon.name} (${weapon.rarity}★)`);
    } else {
      failCount++;
    }

    // Rate limit - be nice to the server
    await new Promise(resolve => setTimeout(resolve, 500));

    // Progress update every 50 items
    if ((successCount + failCount) % 50 === 0) {
      console.log(`\nProgress: ${successCount} weapons found, ${failCount} failed/skipped\n`);
    }
  }

  console.log(`\n\nScraping complete!`);
  console.log(`Successfully scraped: ${successCount} weapons`);
  console.log(`Failed/skipped: ${failCount}`);

  // Save to file
  const outputPath = path.join(__dirname, '../src/data/psoworld-weapon-stats.json');
  fs.writeFileSync(outputPath, JSON.stringify(weapons, null, 2));
  console.log(`\nSaved to: ${outputPath}`);
}

// Alternative: Parse from saved HTML files
// If PSO-World blocks automated requests, you can:
// 1. Save the HTML pages manually
// 2. Run this function to parse them

async function parseLocalHtmlFiles(directory: string) {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.html'));
  const weapons: WeaponDetails[] = [];

  for (const file of files) {
    const html = fs.readFileSync(path.join(directory, file), 'utf-8');
    const itemIdMatch = file.match(/(\d+)/);
    const itemId = itemIdMatch ? parseInt(itemIdMatch[1]) : 0;

    const weapon = parseWeaponDetails(html, itemId);
    if (weapon) {
      weapons.push(weapon);
      console.log(`Parsed: ${weapon.name}`);
    }
  }

  return weapons;
}

// Run if called directly
main().catch(console.error);

export { scrapeWeaponById, parseWeaponDetails, WeaponDetails };
