#!/usr/bin/env node
/**
 * Split psoworld-items.json and psoworld-weapon-stats.json into Content Collection files
 *
 * NOTE: This script was used for initial migration. The source JSON files have been deleted.
 * To regenerate, first run the scraper scripts to create the JSON files, then run this script.
 *
 * Source files needed (in src/data/):
 * - psoworld-items.json (from scrape-all-items-playwright.ts)
 * - psoworld-weapon-stats.json (from scrape-psoworld-weapons.ts)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Helper to slugify names
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper to write JSON file
function writeItem(collection, item, filename = null) {
  const dir = path.join(ROOT, 'src/content', collection);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fname = filename || `${slugify(item.name)}.json`;
  const filepath = path.join(dir, fname);

  fs.writeFileSync(filepath, JSON.stringify(item, null, 2) + '\n');
  return fname;
}

// ============================================================================
// ITEMS (psoworld-items.json)
// ============================================================================

console.log('Processing psoworld-items.json...\n');

const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/psoworld-items.json'), 'utf-8'));

// Categorize items
const categories = {
  armors: [],
  units: [],
  mags: [],
  consumables: [],
  materials: [],
  modifiers: []
};

// Item names for categorization
const magNames = [
  'Mag', 'Yul', 'Aio', 'Yth', 'Ingh', 'Othel', 'Aiolo', 'Peoth', 'Deegh',
  'Thohn', 'Maray', 'Teroo', 'Niid', 'Urado', 'Wyn', 'Chato', 'Tyrna',
  'Beork', 'Larg', 'Ansul', 'Hagal', 'Sig', 'Feo', 'Rappy', 'Puyo',
  'Lassi', 'Toppi', 'Soniti', 'Arkharz', 'Femini', 'Radam'
];

const consumableNames = [
  'Monomate', 'Dimate', 'Trimate', 'Monofluid', 'Difluid', 'Trifluid',
  'Sol Atomizer', 'Moon Atomizer', 'Star Atomizer', 'Trap Vision',
  'Scape Doll', 'Telepipe', 'Heat Trap', 'Ice Trap', 'Light Trap', 'Heal Trap'
];

const materialNames = [
  'Reset Material', 'HP Material', 'PP Material', 'Power Material',
  'Guard Material', 'Hit Material', 'Swift Material', 'Mind Material'
];

const grinderNames = ['Monogrinder', 'Digrinder', 'Trigrinder'];

for (const item of items) {
  const name = item.name;

  // Check if it's a mag
  if (magNames.some(m => name === m || name.startsWith(m + ' '))) {
    categories.mags.push(item);
  }
  // Check if it's a consumable
  else if (consumableNames.includes(name)) {
    categories.consumables.push(item);
  }
  // Check if it's a material
  else if (materialNames.includes(name)) {
    categories.materials.push(item);
  }
  // Check if it's a grinder or element (modifier)
  else if (grinderNames.includes(name) || name.includes('Element')) {
    categories.modifiers.push(item);
  }
  // Check if it's armor (has defenseBase/evasionBase and high values)
  else if (item.defenseBase !== undefined && item.evasionBase !== undefined &&
           (item.defenseBase > 10 || item.evasionBase > 10)) {
    categories.armors.push(item);
  }
  // Everything else is a unit
  else {
    categories.units.push(item);
  }
}

// Write all items
let totalFiles = 0;

for (const [collection, itemList] of Object.entries(categories)) {
  console.log(`${collection}: ${itemList.length} items`);

  for (const item of itemList) {
    writeItem(collection, item);
    totalFiles++;
  }
}

console.log(`\nItems subtotal: ${totalFiles} files\n`);

// ============================================================================
// WEAPONS (content/weapons/*.json + weapon-data.json)
// ============================================================================

console.log('Processing weapons collection + weapon-data.json...\n');

// Read existing weapons from content collection
const weaponsDir = path.join(ROOT, 'src/content/weapons');
const weaponFiles = fs.readdirSync(weaponsDir).filter(f => f.endsWith('.json'));
const weapons = weaponFiles.map(f => {
  const data = JSON.parse(fs.readFileSync(path.join(weaponsDir, f), 'utf-8'));
  data._filename = f; // Keep track of original filename
  return data;
});

console.log(`Loaded ${weapons.length} weapons from content collection`);

const weaponData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/weapon-data.json'), 'utf-8'));

// Build a map of weapon name -> model data from weapon-data.json
const modelDataMap = new Map();
for (const [categoryKey, categoryData] of Object.entries(weaponData)) {
  const wikiUrl = categoryData.wikiUrl;
  for (const weapon of categoryData.weapons) {
    const key = weapon.name.toLowerCase();
    modelDataMap.set(key, {
      modelId: weapon.modelId,
      variantId: weapon.variantId,
      missingTexture: weapon.missingTexture || undefined,
      useModelFrom: weapon.useModelFrom || undefined,
      notes: weapon.notes || undefined,
      wikiUrl: wikiUrl
    });
  }
}

console.log(`Loaded ${modelDataMap.size} weapon model entries from weapon-data.json`);

let matchedCount = 0;
let weaponCount = 0;

for (const weapon of weapons) {
  const filename = weapon._filename;
  delete weapon._filename; // Remove internal tracking field

  // Merge model data if available
  const modelData = modelDataMap.get(weapon.name.toLowerCase());
  if (modelData) {
    matchedCount++;
    weapon.modelId = modelData.modelId;
    weapon.variantId = modelData.variantId;
    if (modelData.missingTexture) weapon.missingTexture = modelData.missingTexture;
    if (modelData.useModelFrom) weapon.useModelFrom = modelData.useModelFrom;
    if (modelData.notes) weapon.notes = modelData.notes;
    if (modelData.wikiUrl) weapon.wikiUrl = modelData.wikiUrl;
  }

  writeItem('weapons', weapon, filename);
  weaponCount++;
}

console.log(`weapons: ${weaponCount} items (${matchedCount} with 3D model data)\n`);

totalFiles += weaponCount;

console.log(`Total: ${totalFiles} files created`);
console.log('\nDone! Collections created in src/content/');
