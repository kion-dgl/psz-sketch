#!/usr/bin/env node
/**
 * Merge weapon-data.json (3D model info) into existing weapon collection files
 *
 * NOTE: This script was used for initial migration. The source weapon-data.json
 * has been deleted. Model data is now stored directly in the weapons content collection.
 * To re-run, first recreate weapon-data.json from the weapon model files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Read weapon-data.json
const weaponData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/weapon-data.json'), 'utf-8'));

// Build a map of weapon name -> model data
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

console.log(`Loaded ${modelDataMap.size} weapon model entries from weapon-data.json\n`);

// Read and update existing weapons from content collection
const weaponsDir = path.join(ROOT, 'src/content/weapons');
const weaponFiles = fs.readdirSync(weaponsDir).filter(f => f.endsWith('.json'));

let matchedCount = 0;
let updatedCount = 0;

for (const filename of weaponFiles) {
  const filepath = path.join(weaponsDir, filename);
  const weapon = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  const modelData = modelDataMap.get(weapon.name.toLowerCase());
  if (modelData) {
    matchedCount++;

    // Check if anything changed
    const wasUpdated =
      weapon.modelId !== modelData.modelId ||
      weapon.variantId !== modelData.variantId ||
      weapon.missingTexture !== modelData.missingTexture ||
      weapon.useModelFrom !== modelData.useModelFrom ||
      weapon.notes !== modelData.notes ||
      weapon.wikiUrl !== modelData.wikiUrl;

    if (wasUpdated) {
      weapon.modelId = modelData.modelId;
      weapon.variantId = modelData.variantId;
      if (modelData.missingTexture) weapon.missingTexture = modelData.missingTexture;
      if (modelData.useModelFrom) weapon.useModelFrom = modelData.useModelFrom;
      if (modelData.notes) weapon.notes = modelData.notes;
      if (modelData.wikiUrl) weapon.wikiUrl = modelData.wikiUrl;

      fs.writeFileSync(filepath, JSON.stringify(weapon, null, 2) + '\n');
      updatedCount++;
    }
  }
}

console.log(`Processed ${weaponFiles.length} weapons`);
console.log(`Matched ${matchedCount} with model data`);
console.log(`Updated ${updatedCount} files\n`);

// Report unmatched weapons from weapon-data.json
const unmatchedModels = [];
for (const [name] of modelDataMap) {
  const found = weaponFiles.some(f => {
    const weapon = JSON.parse(fs.readFileSync(path.join(weaponsDir, f), 'utf-8'));
    return weapon.name.toLowerCase() === name;
  });
  if (!found) {
    unmatchedModels.push(name);
  }
}

if (unmatchedModels.length > 0) {
  console.log(`Unmatched model entries (${unmatchedModels.length}):`);
  for (const name of unmatchedModels.slice(0, 10)) {
    console.log(`  - ${name}`);
  }
  if (unmatchedModels.length > 10) {
    console.log(`  ... and ${unmatchedModels.length - 10} more`);
  }
}

console.log('\nDone!');
