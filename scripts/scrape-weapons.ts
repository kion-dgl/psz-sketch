/**
 * Weapon Data Scraper for PSZ Wiki
 *
 * Run with: npx tsx scripts/scrape-weapons.ts
 *
 * Scrapes weapon data from Phantasy Star Wiki and outputs JSON.
 * Can be extended to scrape PSO-World if access is available.
 */

const WIKI_BASE = 'https://phantasystar.fandom.com/wiki';

const WEAPON_PAGES = {
  swords: 'Swords_(Phantasy_Star_Zero)',
  sabers: 'Sabers_(Phantasy_Star_Zero)',
  daggers: 'Daggers_(Phantasy_Star_Zero)',
  claws: 'Claws_(Phantasy_Star_Zero)',
  doubleSabers: 'Double_Sabers_(Phantasy_Star_Zero)',
  spears: 'Spears_(Phantasy_Star_Zero)',
  slicers: 'Slicers_(Phantasy_Star_Zero)',
  handguns: 'Handguns_(Phantasy_Star_Zero)',
  rifles: 'Rifles_(Phantasy_Star_Zero)',
  machineguns: 'Mech_Guns_(Phantasy_Star_Zero)',
  launchers: 'Laser_Cannons_(Phantasy_Star_Zero)',
  bazookas: 'Bazookas_(Phantasy_Star_Zero)',
  gunblades: 'Gun_Blades_(Phantasy_Star_Zero)',
  rods: 'Rods_(Phantasy_Star_Zero)',
  wands: 'Wands_(Phantasy_Star_Zero)',
  shields: 'Shields_(Phantasy_Star_Zero)',
};

interface WeaponEntry {
  name: string;
  rarity: number;
  level: number;
  atp?: number;
  ata?: number;
  mst?: number;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function parseWeaponTable(html: string): WeaponEntry[] {
  const weapons: WeaponEntry[] = [];

  // Simple regex-based parsing for wiki tables
  // Look for table rows with weapon data
  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const linkRegex = /<a[^>]*>([^<]+)<\/a>/i;

  let rowMatch;
  while ((rowMatch = tableRowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cells: string[] = [];

    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      // Strip HTML tags and get text content
      let cellText = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .trim();

      // Check for links and extract text
      const linkMatch = cellMatch[1].match(linkRegex);
      if (linkMatch) {
        cellText = linkMatch[1].trim();
      }

      cells.push(cellText);
    }

    // Typical wiki format: Name, Rarity, Level, ATP, ATA, MST, etc.
    if (cells.length >= 3 && cells[0] && !cells[0].includes('Name')) {
      const weapon: WeaponEntry = {
        name: cells[0],
        rarity: parseInt(cells[1]) || 1,
        level: parseInt(cells[2]) || 1,
      };

      if (cells[3] && cells[3] !== 'X') {
        weapon.atp = parseInt(cells[3]);
      }
      if (cells[4] && cells[4] !== 'X') {
        weapon.ata = parseInt(cells[4]);
      }
      if (cells[5] && cells[5] !== 'X') {
        weapon.mst = parseInt(cells[5]);
      }

      weapons.push(weapon);
    }
  }

  return weapons;
}

async function scrapeWeaponCategory(category: string, pageName: string) {
  console.log(`Scraping ${category}...`);
  const url = `${WIKI_BASE}/${pageName}`;

  try {
    const html = await fetchPage(url);
    const weapons = parseWeaponTable(html);
    console.log(`  Found ${weapons.length} weapons`);
    return {
      category,
      wikiUrl: url,
      weapons,
    };
  } catch (error) {
    console.error(`  Error scraping ${category}:`, error);
    return {
      category,
      wikiUrl: url,
      weapons: [],
      error: String(error),
    };
  }
}

async function main() {
  console.log('PSZ Weapon Scraper');
  console.log('==================\n');

  const results: Record<string, unknown> = {};

  for (const [category, pageName] of Object.entries(WEAPON_PAGES)) {
    results[category] = await scrapeWeaponCategory(category, pageName);
    // Be polite to the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Output as JSON
  console.log('\n\nJSON Output:');
  console.log('============');
  console.log(JSON.stringify(results, null, 2));

  // Also write to file
  const fs = await import('fs');
  fs.writeFileSync(
    'src/data/scraped-weapons.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\nWritten to src/data/scraped-weapons.json');
}

main().catch(console.error);
