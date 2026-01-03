/**
 * Script to scrape weapon names from PSO-World and create mapping to internal IDs
 *
 * Run with: npx tsx scripts/scrape-weapon-names.ts
 *
 * Strategy:
 * 1. Fetch each category page from PSO-World
 * 2. Extract weapon names and star ratings
 * 3. Group by category and rarity
 * 4. Match to internal IDs based on ordering
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PSO-World category IDs
const CATEGORY_URLS: Record<string, { url: string; prefix: string }> = {
  'Bazooka': { url: 'https://www.pso-world.com/psz-items.php?cat=1', prefix: 'ba' },
  'Claw': { url: 'https://www.pso-world.com/psz-items.php?cat=2', prefix: 'cl' },
  'Daggers': { url: 'https://www.pso-world.com/psz-items.php?cat=3', prefix: 'da' },
  'Double Saber': { url: 'https://www.pso-world.com/psz-items.php?cat=4', prefix: 'ds' },
  'Gun': { url: 'https://www.pso-world.com/psz-items.php?cat=5', prefix: 'gu' },
  'Partisan': { url: 'https://www.pso-world.com/psz-items.php?cat=6', prefix: 'pa' },
  'Rifle': { url: 'https://www.pso-world.com/psz-items.php?cat=7', prefix: 'ri' },
  'Rod': { url: 'https://www.pso-world.com/psz-items.php?cat=8', prefix: 'ro' },
  'Saber': { url: 'https://www.pso-world.com/psz-items.php?cat=9', prefix: 'sw' },
  'Slicer': { url: 'https://www.pso-world.com/psz-items.php?cat=10', prefix: 'sl' },
  'Tech-Mag': { url: 'https://www.pso-world.com/psz-items.php?cat=11', prefix: 'tm' },
  'Wand': { url: 'https://www.pso-world.com/psz-items.php?cat=12', prefix: 'ma' },
  'Bow': { url: 'https://www.pso-world.com/psz-items.php?cat=13', prefix: 'bo' },
};

// Star rating to rarity letter
function starsToRarity(stars: number): string {
  if (stars <= 2) return 'c';  // Common
  if (stars <= 4) return 'h';  // Uncommon
  if (stars <= 6) return 'n';  // Rare
  return 'r';                   // Very Rare
}

interface WeaponEntry {
  name: string;
  stars: number;
  rarity: string;
  level: number;
}

interface WeaponMapping {
  [internalId: string]: {
    name: string;
    stars: number;
    category: string;
  };
}

async function fetchCategoryWeapons(categoryName: string, url: string): Promise<WeaponEntry[]> {
  console.log(`Fetching ${categoryName} from ${url}...`);

  const response = await fetch(url);
  const html = await response.text();

  const weapons: WeaponEntry[] = [];

  // Parse the HTML table - PSO-World uses tables with weapon info
  // Each row has: Name | Stats | Rarity (stars) | Level | etc.

  // Simple regex-based extraction (could use cheerio for more robust parsing)
  // Look for patterns like weapon names followed by star ratings

  // The table structure on PSO-World:
  // <tr><td>Weapon Name</td><td>stats...</td><td><img src="star.gif">x3</td>...</tr>

  // Count star images or look for star text patterns
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowRegex) || [];

  for (const row of rows) {
    // Skip header rows
    if (row.includes('<th')) continue;

    // Extract weapon name (usually first td with a link)
    const nameMatch = row.match(/<td[^>]*>[\s\n]*<a[^>]*>([^<]+)<\/a>/i);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim();

    // Count star images
    const starCount = (row.match(/star\.gif/gi) || []).length;

    // Extract level requirement if present
    const levelMatch = row.match(/Lv\.?\s*(\d+)/i);
    const level = levelMatch ? parseInt(levelMatch[1]) : 0;

    if (name && starCount > 0) {
      weapons.push({
        name,
        stars: starCount,
        rarity: starsToRarity(starCount),
        level,
      });
    }
  }

  return weapons;
}

function generateInternalId(prefix: string, rarity: string, index: number): string {
  return `w${prefix}${rarity}${String(index).padStart(2, '0')}`;
}

async function main() {
  const mapping: WeaponMapping = {};

  // Read existing weapon IDs from the public/weapons directory
  const weaponsDir = path.join(__dirname, '..', 'public', 'weapons');
  const existingIds = fs.readdirSync(weaponsDir).filter(f =>
    fs.statSync(path.join(weaponsDir, f)).isDirectory()
  );

  console.log(`Found ${existingIds.length} existing weapon directories`);

  // Group existing IDs by prefix and rarity
  const existingByGroup: Record<string, string[]> = {};
  for (const id of existingIds) {
    // Parse: w + prefix(2) + rarity(1) + number(2)
    const prefix = id.slice(1, 3);
    const rarity = id.slice(3, 4);
    const key = `${prefix}-${rarity}`;
    if (!existingByGroup[key]) existingByGroup[key] = [];
    existingByGroup[key].push(id);
  }

  // Sort each group by the numeric suffix
  for (const key of Object.keys(existingByGroup)) {
    existingByGroup[key].sort((a, b) => {
      const numA = parseInt(a.slice(4));
      const numB = parseInt(b.slice(4));
      return numA - numB;
    });
  }

  console.log('\nExisting weapons by group:');
  for (const [key, ids] of Object.entries(existingByGroup)) {
    console.log(`  ${key}: ${ids.length} weapons`);
  }

  // For now, create a template mapping based on existing IDs
  // This can be manually filled in or enhanced with web scraping

  const templateMapping: Record<string, string | null> = {};
  for (const id of existingIds) {
    templateMapping[id] = null; // null = name not yet mapped
  }

  // Save template for manual mapping
  const templatePath = path.join(__dirname, '..', 'src', 'data', 'weapon-names-template.json');
  fs.mkdirSync(path.dirname(templatePath), { recursive: true });
  fs.writeFileSync(templatePath, JSON.stringify(templateMapping, null, 2));
  console.log(`\nSaved template to ${templatePath}`);

  // Also save category info for reference
  const categoryInfo = {
    prefixes: Object.fromEntries(
      Object.entries(CATEGORY_URLS).map(([name, { prefix }]) => [prefix, name])
    ),
    rarities: {
      'c': 'Common (1-2★)',
      'h': 'Uncommon (3-4★)',
      'n': 'Rare (5-6★)',
      'r': 'Very Rare (7★)',
    },
    idFormat: 'w + prefix(2) + rarity(1) + number(2)',
    example: 'wbac01 = weapon + bazooka + common + 01',
  };

  const infoPath = path.join(__dirname, '..', 'src', 'data', 'weapon-id-format.json');
  fs.writeFileSync(infoPath, JSON.stringify(categoryInfo, null, 2));
  console.log(`Saved ID format info to ${infoPath}`);
}

main().catch(console.error);
