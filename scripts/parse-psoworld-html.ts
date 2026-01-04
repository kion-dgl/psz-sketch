/**
 * Parse PSO-World weapon HTML
 *
 * Usage: npx tsx scripts/parse-psoworld-html.ts docs/weapon.html
 */

import * as fs from 'fs';

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
  psoWorldId?: number;
}

function extractTableValue(html: string, label: string): string {
  // Pattern: <td class="alt2">Label:</td> <td class="alt1">Value</td>
  const regex = new RegExp(
    `<td[^>]*class="alt2"[^>]*>\\s*${label}:?\\s*</td>\\s*<td[^>]*class="alt1"[^>]*>([^<]+)`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1]?.trim() || '';
}

function extractStatRow(html: string, statName: string): [number, number] {
  // Pattern: <td>Attack:</td> <td>123</td> <td>223</td>
  const regex = new RegExp(
    `<td[^>]*>\\s*${statName}:?\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>\\s*<td[^>]*>\\s*(\\d+)\\s*</td>`,
    'i'
  );
  const match = html.match(regex);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])];
  }
  return [0, 0];
}

function parseWeaponHtml(html: string): WeaponStats | null {
  try {
    // Extract weapon name from h1
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = nameMatch?.[1]?.trim() || 'Unknown';

    // Japanese Name
    const japaneseName = extractTableValue(html, 'Japanese Name');

    // Description
    const descMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Description:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>([\s\S]*?)<\/td>/i
    );
    const description = descMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

    // Weapon Type - extract text after the image
    const typeMatch = html.match(
      /<td[^>]*class="alt2"[^>]*>\s*Weapon Type:\s*<\/td>\s*<td[^>]*class="alt1"[^>]*>[\s\S]*?>\s*([^<]+)/i
    );
    const weaponType = typeMatch?.[1]?.trim() || '';

    // Rarity - get number before the star image
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
    const [attackBase, attackMax] = extractStatRow(html, 'Attack');
    const [accuracyBase, accuracyMax] = extractStatRow(html, 'Accuracy');
    const [defenseBase, defenseMax] = extractStatRow(html, 'Defense');

    // Photon Arts - find the table section
    const photonArts: PhotonArt[] = [];
    const paSection = html.match(/Photon Arts<\/td>[\s\S]*?<\/table>/i);
    if (paSection) {
      // Find data rows (skip header rows)
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

    // Usable By - find the row with O/X values
    const usableBy: string[] = [];
    const classOrder = [
      'Hunter Human', 'Hunter Newman', 'Hunter Cast',
      'Ranger Human', 'Ranger Cast',
      'Force Human', 'Force Newman'
    ];

    const usableSection = html.match(/Usable By[\s\S]*?<\/table>/i);
    if (usableSection) {
      // Extract all O/X cells - they appear after the header rows
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

    // PSO-World item ID from URL
    const idMatch = html.match(/item=(\d+)/);
    const psoWorldId = idMatch ? parseInt(idMatch[1]) : undefined;

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
      psoWorldId,
    };

    // Only add defense if present (shields have it)
    if (defenseBase > 0 || defenseMax > 0) {
      result.defenseBase = defenseBase;
      result.defenseMax = defenseMax;
    }

    return result;
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: npx tsx scripts/parse-psoworld-html.ts <file.html>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const weapon = parseWeaponHtml(html);

  if (weapon) {
    console.log(JSON.stringify(weapon, null, 2));
  } else {
    console.error('Failed to parse weapon data');
    process.exit(1);
  }
}

main().catch(console.error);

export { parseWeaponHtml, WeaponStats };
