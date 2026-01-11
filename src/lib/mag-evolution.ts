/**
 * Mag Evolution Logic
 * Based on PSO-World Mag Evolution Chart:
 * https://www.pso-world.com/sections.php?op=viewarticle&artid=2602
 */

export interface MagStats {
  power: number;
  guard: number;
  hit: number;
  mind: number;
}

export interface MagDefinition {
  name: string;
  stage: number;
  requirement?: MagRequirement;
  photonBlast: string | null;
}

export type MagRequirement =
  | { type: 'primary'; stat: StatName }
  | { type: 'pure'; stat: StatName }
  | { type: 'dual'; primary: StatName; secondary: StatName };

export type StatName = 'Power' | 'Guard' | 'Hit' | 'Mind';

// All mags with their evolution requirements and photon blasts
// Source: https://www.pso-world.com/sections.php?op=viewarticle&artid=2602
export const MAGS: Record<string, MagDefinition> = {
  // Tier 1 - Base Mag
  mag: { name: 'Mag', stage: 1, photonBlast: null },

  // Tier 2 - Evolves at Level 10
  // Requirements: Single stat > Other Stats
  yul: { name: 'Yul', stage: 2, requirement: { type: 'primary', stat: 'Power' }, photonBlast: 'Granir' },
  aio: { name: 'Aio', stage: 2, requirement: { type: 'primary', stat: 'Guard' }, photonBlast: 'Midgul' },
  yth: { name: 'Yth', stage: 2, requirement: { type: 'primary', stat: 'Hit' }, photonBlast: 'Pacifal' },
  ingh: { name: 'Ingh', stage: 2, requirement: { type: 'primary', stat: 'Mind' }, photonBlast: 'Flozir' },

  // Tier 3 - Evolves at Level 30
  // Normal: Primary stat > Other Stats
  othel: { name: 'Othel', stage: 3, requirement: { type: 'primary', stat: 'Power' }, photonBlast: 'Pacifal' },
  aiolo: { name: 'Aiolo', stage: 3, requirement: { type: 'primary', stat: 'Guard' }, photonBlast: 'Flozir' },
  peoth: { name: 'Peoth', stage: 3, requirement: { type: 'primary', stat: 'Hit' }, photonBlast: 'Granir' },
  deegh: { name: 'Deegh', stage: 3, requirement: { type: 'primary', stat: 'Mind' }, photonBlast: 'Midgul' },

  // Tier 3 - Pure: All stats but one must be 0
  thohn: { name: 'Thohn', stage: 3, requirement: { type: 'pure', stat: 'Power' }, photonBlast: 'Granir' },
  maray: { name: 'Maray', stage: 3, requirement: { type: 'pure', stat: 'Guard' }, photonBlast: 'Midgul' },
  teroo: { name: 'Teroo', stage: 3, requirement: { type: 'pure', stat: 'Hit' }, photonBlast: 'Pacifal' },
  niid: { name: 'Niid', stage: 3, requirement: { type: 'pure', stat: 'Mind' }, photonBlast: 'Flozir' },

  // Tier 4 - Evolves at Level 60
  // Requirements: Primary > Secondary > Other Stats (Will Fail if Pure)
  urado: { name: 'Urado', stage: 4, requirement: { type: 'dual', primary: 'Power', secondary: 'Guard' }, photonBlast: 'Midgul' },
  wyn: { name: 'Wyn', stage: 4, requirement: { type: 'dual', primary: 'Power', secondary: 'Hit' }, photonBlast: 'Pacifal' },
  chato_red: { name: 'Chato (Red Ears)', stage: 4, requirement: { type: 'dual', primary: 'Power', secondary: 'Mind' }, photonBlast: 'Flozir' },
  tyrna: { name: 'Tyrna', stage: 4, requirement: { type: 'dual', primary: 'Guard', secondary: 'Power' }, photonBlast: 'Granir' },
  beork: { name: 'Beork', stage: 4, requirement: { type: 'dual', primary: 'Guard', secondary: 'Hit' }, photonBlast: 'Pacifal' },
  larg: { name: 'Larg', stage: 4, requirement: { type: 'dual', primary: 'Guard', secondary: 'Mind' }, photonBlast: 'Flozir' },
  ansul: { name: 'Ansul', stage: 4, requirement: { type: 'dual', primary: 'Hit', secondary: 'Power' }, photonBlast: 'Granir' },
  hagal: { name: 'Hagal', stage: 4, requirement: { type: 'dual', primary: 'Hit', secondary: 'Guard' }, photonBlast: 'Midgul' },
  sig_white: { name: 'Sig (White Body)', stage: 4, requirement: { type: 'dual', primary: 'Hit', secondary: 'Mind' }, photonBlast: 'Flozir' },
  chato_black: { name: 'Chato (Black Body)', stage: 4, requirement: { type: 'dual', primary: 'Mind', secondary: 'Power' }, photonBlast: 'Granir' },
  feo: { name: 'Feo', stage: 4, requirement: { type: 'dual', primary: 'Mind', secondary: 'Guard' }, photonBlast: 'Midgul' },
  sig: { name: 'Sig', stage: 4, requirement: { type: 'dual', primary: 'Mind', secondary: 'Hit' }, photonBlast: 'Pacifal' },
};

const STAT_KEY_MAP: Record<StatName, keyof MagStats> = {
  'Power': 'power',
  'Guard': 'guard',
  'Hit': 'hit',
  'Mind': 'mind',
};

/**
 * Calculate the total level of a mag based on its stats.
 * Level = floor(total stats / 5)
 */
export function getLevel(stats: MagStats): number {
  return Math.floor((stats.power + stats.guard + stats.hit + stats.mind) / 5);
}

/**
 * Check if a mag has pure stats (only one stat has points, others are 0)
 */
export function isPure(stats: MagStats, stat: keyof MagStats): boolean {
  const otherStats = (['power', 'guard', 'hit', 'mind'] as const).filter(s => s !== stat);
  return stats[stat] > 0 && otherStats.every(s => stats[s] === 0);
}

/**
 * Get the stat with the highest value
 */
export function getHighestStat(stats: MagStats): keyof MagStats {
  const entries = Object.entries(stats) as [keyof MagStats, number][];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

/**
 * Get the stat with the second highest value (excluding a specified stat)
 */
export function getSecondHighestStat(stats: MagStats, exclude: keyof MagStats): keyof MagStats {
  const entries = (Object.entries(stats) as [keyof MagStats, number][]).filter(([k]) => k !== exclude);
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

/**
 * Determine which mag form the given stats would result in.
 * Returns the mag ID and definition.
 *
 * Evolution priority at each tier:
 * - Tier 2 (Lv10+): Primary stat > Other Stats
 * - Tier 3 (Lv30+): Primary stat > Other Stats (pure forms require special items)
 * - Tier 4 (Lv60+): Primary > Secondary > Other Stats (fails if pure)
 */
export function determineForm(stats: MagStats): { id: string; mag: MagDefinition } {
  const level = getLevel(stats);

  // Level < 10: Still base Mag
  if (level < 10) {
    return { id: 'mag', mag: MAGS.mag };
  }

  // Get primary and secondary stats
  const primaryKey = getHighestStat(stats);
  const secondaryKey = getSecondHighestStat(stats, primaryKey);
  const primaryName = (primaryKey.charAt(0).toUpperCase() + primaryKey.slice(1)) as StatName;
  const secondaryName = (secondaryKey.charAt(0).toUpperCase() + secondaryKey.slice(1)) as StatName;

  // Tier 4: Level 60+ with dual stat requirements (fails if pure - needs secondary > 0)
  if (level >= 60) {
    const secondaryValue = stats[secondaryKey];
    // Only evolve to tier 4 if secondary stat has actual points (not pure)
    if (secondaryValue > 0) {
      for (const [id, mag] of Object.entries(MAGS)) {
        if (mag.stage === 4 && mag.requirement?.type === 'dual') {
          if (mag.requirement.primary === primaryName && mag.requirement.secondary === secondaryName) {
            return { id, mag };
          }
        }
      }
    }
  }

  // Tier 3: Level 30+ with primary stat requirement
  if (level >= 30) {
    for (const [id, mag] of Object.entries(MAGS)) {
      if (mag.stage === 3 && mag.requirement?.type === 'primary') {
        if (mag.requirement.stat === primaryName) {
          return { id, mag };
        }
      }
    }
  }

  // Tier 2: Level 10-29 with primary stat requirement
  for (const [id, mag] of Object.entries(MAGS)) {
    if (mag.stage === 2 && mag.requirement?.type === 'primary') {
      if (mag.requirement.stat === primaryName) {
        return { id, mag };
      }
    }
  }

  // Fallback to base Mag (should not happen with valid stats)
  return { id: 'mag', mag: MAGS.mag };
}
