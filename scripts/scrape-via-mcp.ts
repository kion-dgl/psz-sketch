/**
 * PSO-World Scraper - MCP Browser Version
 *
 * This script generates commands to run in the MCP browser context.
 * Run this to get the item IDs, then use the MCP browser to scrape each one.
 */

// All weapon item IDs from the weapons category page
export const WEAPON_IDS = [
  // 1-298
  ...Array.from({ length: 298 }, (_, i) => i + 1),
  // 382-427
  ...Array.from({ length: 46 }, (_, i) => i + 382),
  // 582
  582
];

// The extraction function to run in browser context
export const EXTRACT_WEAPON_JS = `() => {
  const weapon = {};

  // Name from h1
  weapon.name = document.querySelector('h1')?.textContent?.trim() || '';
  if (!weapon.name) return null;

  // Find attribute table rows
  const allRows = document.querySelectorAll('tr');
  for (const row of allRows) {
    const labelCell = row.querySelector('td.alt2');
    const valueCell = row.querySelector('td.alt1');
    if (!labelCell || !valueCell) continue;

    const label = labelCell.textContent?.trim() || '';
    const value = valueCell.textContent?.trim() || '';

    if (label === 'Japanese Name:') weapon.japaneseName = value;
    if (label === 'Description:') weapon.description = value;
    if (label === 'Rarity:') weapon.rarity = parseInt(value) || 1;
    if (label === 'Weapon Type:') weapon.weaponType = value.replace(/^\\s+/, '');
    if (label === 'Elemental Ability:') {
      const match = value.match(/Level\\s*(\\d+)\\s*(\\w+)/);
      if (match) {
        weapon.elementLevel = parseInt(match[1]);
        weapon.element = match[2];
      } else {
        weapon.element = value;
        weapon.elementLevel = 0;
      }
    }
    if (label === 'Maximum Grind:') weapon.maxGrind = parseInt(value) || 0;
    if (label === 'Requirement:') weapon.level = parseInt(value.match(/\\d+/)?.[0]) || 1;
    if (label === 'Resale Value:') weapon.resaleValue = parseInt(value) || 0;

    // Stats with two values
    if (label === 'Attack:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        weapon.attackBase = parseInt(cells[0]?.textContent) || 0;
        weapon.attackMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
    if (label === 'Accuracy:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        weapon.accuracyBase = parseInt(cells[0]?.textContent) || 0;
        weapon.accuracyMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
    if (label === 'Defense:') {
      const cells = row.querySelectorAll('td.alt1');
      if (cells.length >= 2) {
        weapon.defenseBase = parseInt(cells[0]?.textContent) || 0;
        weapon.defenseMax = parseInt(cells[1]?.textContent) || 0;
      }
    }
  }

  // Photon Arts - find the specific table
  weapon.photonArts = [];
  const tables = document.querySelectorAll('table');
  for (const table of tables) {
    const headerRow = table.querySelector('tr td.tcat');
    if (headerRow?.textContent?.trim() === 'Photon Arts') {
      const rows = table.querySelectorAll('tr');
      for (let i = 2; i < rows.length; i++) { // Skip header rows
        const cells = rows[i].querySelectorAll('td.alt1');
        if (cells.length === 5) {
          const name = cells[0]?.textContent?.trim();
          if (name && !name.includes('\\n')) {
            weapon.photonArts.push({
              name,
              attackMod: parseInt(cells[1]?.textContent) || 0,
              accuracyMod: parseInt(cells[2]?.textContent) || 0,
              ppUsed: parseInt(cells[3]?.textContent) || 0,
              element: cells[4]?.textContent?.trim() || '-'
            });
          }
        }
      }
      break;
    }
  }

  // Usable By
  weapon.usableBy = [];
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
              weapon.usableBy.push(classOrder[i]);
            }
          });
          break;
        }
      }
      break;
    }
  }

  weapon.psoWorldId = parseInt(new URLSearchParams(location.search).get('item')) || 0;
  weapon.psoWorldUrl = location.href;

  return weapon;
}`;

console.log('Weapon IDs to scrape:', WEAPON_IDS.length);
console.log('First 10:', WEAPON_IDS.slice(0, 10));
console.log('Last 10:', WEAPON_IDS.slice(-10));
console.log('\nExtraction function saved.');
console.log('\nTo scrape, use MCP browser tools:');
console.log('1. Navigate to each URL');
console.log('2. Run the extraction function');
console.log('3. Save results');
