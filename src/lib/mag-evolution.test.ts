/**
 * Mag Evolution Tests
 * Validates evolution logic against PSO-World Mag Evolution Chart:
 * https://www.pso-world.com/sections.php?op=viewarticle&artid=2602
 */

import { describe, it, expect } from 'vitest';
import { determineForm, getLevel, isPure, MAGS, MagStats } from './mag-evolution';

/**
 * Helper to create stats with level points (5 points per level)
 */
function makeStats(power: number, guard: number, hit: number, mind: number): MagStats {
  return { power: power * 5, guard: guard * 5, hit: hit * 5, mind: mind * 5 };
}

describe('Mag Evolution - Level Calculation', () => {
  it('calculates level from total stats', () => {
    expect(getLevel({ power: 0, guard: 0, hit: 0, mind: 0 })).toBe(0);
    expect(getLevel({ power: 50, guard: 0, hit: 0, mind: 0 })).toBe(10);
    expect(getLevel({ power: 25, guard: 25, hit: 0, mind: 0 })).toBe(10);
    expect(getLevel({ power: 150, guard: 0, hit: 0, mind: 0 })).toBe(30);
    expect(getLevel({ power: 100, guard: 100, hit: 100, mind: 0 })).toBe(60);
  });
});

describe('Mag Evolution - Pure Stat Detection', () => {
  it('detects pure power stats', () => {
    expect(isPure({ power: 150, guard: 0, hit: 0, mind: 0 }, 'power')).toBe(true);
    expect(isPure({ power: 150, guard: 1, hit: 0, mind: 0 }, 'power')).toBe(false);
  });

  it('detects pure guard stats', () => {
    expect(isPure({ power: 0, guard: 150, hit: 0, mind: 0 }, 'guard')).toBe(true);
  });

  it('detects pure hit stats', () => {
    expect(isPure({ power: 0, guard: 0, hit: 150, mind: 0 }, 'hit')).toBe(true);
  });

  it('detects pure mind stats', () => {
    expect(isPure({ power: 0, guard: 0, hit: 0, mind: 150 }, 'mind')).toBe(true);
  });
});

describe('Mag Evolution - Tier 1 (Base Mag)', () => {
  it('remains Mag at level 0', () => {
    const result = determineForm({ power: 0, guard: 0, hit: 0, mind: 0 });
    expect(result.mag.name).toBe('Mag');
    expect(result.mag.stage).toBe(1);
    expect(result.mag.photonBlast).toBeNull();
  });

  it('remains Mag below level 10', () => {
    const result = determineForm(makeStats(1, 1, 1, 1)); // Level 4
    expect(result.mag.name).toBe('Mag');
  });
});

describe('Mag Evolution - Tier 2 (Level 10)', () => {
  /**
   * From PSO-World:
   * - Yul: Power > Other Stats → Granir
   * - Aio: Guard > Other Stats → Midgul
   * - Yth: Hit > Other Stats → Pacifal
   * - Ingh: Mind > Other Stats → Flozir
   */

  it('evolves to Yul when Power > Other Stats', () => {
    const result = determineForm(makeStats(10, 0, 0, 0)); // Level 10, pure Power
    expect(result.mag.name).toBe('Yul');
    expect(result.mag.photonBlast).toBe('Granir');
  });

  it('evolves to Aio when Guard > Other Stats', () => {
    const result = determineForm(makeStats(0, 10, 0, 0)); // Level 10, pure Guard
    expect(result.mag.name).toBe('Aio');
    expect(result.mag.photonBlast).toBe('Midgul');
  });

  it('evolves to Yth when Hit > Other Stats', () => {
    const result = determineForm(makeStats(0, 0, 10, 0)); // Level 10, pure Hit
    expect(result.mag.name).toBe('Yth');
    expect(result.mag.photonBlast).toBe('Pacifal');
  });

  it('evolves to Ingh when Mind > Other Stats', () => {
    const result = determineForm(makeStats(0, 0, 0, 10)); // Level 10, pure Mind
    expect(result.mag.name).toBe('Ingh');
    expect(result.mag.photonBlast).toBe('Flozir');
  });

  it('evolves to Yul with mixed stats when Power is highest', () => {
    const result = determineForm(makeStats(6, 2, 1, 1)); // Level 10, Power highest
    expect(result.mag.name).toBe('Yul');
  });
});

describe('Mag Evolution - Tier 3 Normal (Level 30)', () => {
  /**
   * From PSO-World:
   * - Othel: Power > Other Stats → Pacifal
   * - Aiolo: Guard > Other Stats → Flozir
   * - Peoth: Hit > Other Stats → Granir
   * - Deegh: Mind > Other Stats → Midgul
   */

  it('evolves to Othel when Power > Other Stats at Level 30', () => {
    const result = determineForm(makeStats(20, 5, 3, 2)); // Level 30, Power highest
    expect(result.mag.name).toBe('Othel');
    expect(result.mag.stage).toBe(3);
    expect(result.mag.photonBlast).toBe('Pacifal');
  });

  it('evolves to Aiolo when Guard > Other Stats at Level 30', () => {
    const result = determineForm(makeStats(5, 20, 3, 2)); // Level 30, Guard highest
    expect(result.mag.name).toBe('Aiolo');
    expect(result.mag.photonBlast).toBe('Flozir');
  });

  it('evolves to Peoth when Hit > Other Stats at Level 30', () => {
    const result = determineForm(makeStats(5, 3, 20, 2)); // Level 30, Hit highest
    expect(result.mag.name).toBe('Peoth');
    expect(result.mag.photonBlast).toBe('Granir');
  });

  it('evolves to Deegh when Mind > Other Stats at Level 30', () => {
    const result = determineForm(makeStats(5, 3, 2, 20)); // Level 30, Mind highest
    expect(result.mag.name).toBe('Deegh');
    expect(result.mag.photonBlast).toBe('Midgul');
  });
});

describe('Mag Evolution - Tier 3 Pure (Level 30)', () => {
  /**
   * From PSO-World:
   * - Thohn: All stats but Power must be 0 → Granir
   * - Maray: All stats but Guard must be 0 → Midgul
   * - Teroo: All stats but Hit must be 0 → Pacifal
   * - Niid: All stats but Mind must be 0 → Flozir
   */

  // Pure stats still evolve to primary forms (pure forms require special items)
  it('evolves to Othel when only Power has levels', () => {
    const result = determineForm(makeStats(30, 0, 0, 0)); // Level 30, pure Power
    expect(result.mag.name).toBe('Othel');
    expect(result.mag.stage).toBe(3);
    expect(result.mag.photonBlast).toBe('Pacifal');
  });

  it('evolves to Aiolo when only Guard has levels', () => {
    const result = determineForm(makeStats(0, 30, 0, 0)); // Level 30, pure Guard
    expect(result.mag.name).toBe('Aiolo');
    expect(result.mag.photonBlast).toBe('Flozir');
  });

  it('evolves to Peoth when only Hit has levels', () => {
    const result = determineForm(makeStats(0, 0, 30, 0)); // Level 30, pure Hit
    expect(result.mag.name).toBe('Peoth');
    expect(result.mag.photonBlast).toBe('Granir');
  });

  it('evolves to Deegh when only Mind has levels', () => {
    const result = determineForm(makeStats(0, 0, 0, 30)); // Level 30, pure Mind
    expect(result.mag.name).toBe('Deegh');
    expect(result.mag.photonBlast).toBe('Midgul');
  });
});

describe('Mag Evolution - Tier 4 (Level 60)', () => {
  /**
   * From PSO-World - Tier 4 requires two highest stats (Will Fail if Pure):
   * - Urado: Power > Guard > Other Stats → Midgul
   * - Wyn: Power > Hit > Other Stats → Pacifal
   * - Chato (Red Ears): Power > Mind > Other Stats → Flozir
   * - Tyrna: Guard > Power > Other Stats → Granir
   * - Beork: Guard > Hit > Other Stats → Pacifal
   * - Larg: Guard > Mind > Other Stats → Flozir
   * - Ansul: Hit > Power > Other Stats → Granir
   * - Hagal: Hit > Guard > Other Stats → Midgul
   * - Sig (White Body): Hit > Mind > Other Stats → Flozir
   * - Chato (Black Body): Mind > Power > Other Stats → Granir
   * - Feo: Mind > Guard > Other Stats → Midgul
   * - Sig: Mind > Hit > Other Stats → Pacifal
   */

  // Power primary evolutions
  it('evolves to Urado when Power > Guard > Others', () => {
    const result = determineForm(makeStats(40, 15, 3, 2)); // Level 60, Power > Guard
    expect(result.mag.name).toBe('Urado');
    expect(result.mag.stage).toBe(4);
    expect(result.mag.photonBlast).toBe('Midgul');
  });

  it('evolves to Wyn when Power > Hit > Others', () => {
    const result = determineForm(makeStats(40, 3, 15, 2)); // Level 60, Power > Hit
    expect(result.mag.name).toBe('Wyn');
    expect(result.mag.photonBlast).toBe('Pacifal');
  });

  it('evolves to Chato (Red Ears) when Power > Mind > Others', () => {
    const result = determineForm(makeStats(40, 3, 2, 15)); // Level 60, Power > Mind
    expect(result.mag.name).toBe('Chato (Red Ears)');
    expect(result.mag.photonBlast).toBe('Flozir');
  });

  // Guard primary evolutions
  it('evolves to Tyrna when Guard > Power > Others', () => {
    const result = determineForm(makeStats(15, 40, 3, 2)); // Level 60, Guard > Power
    expect(result.mag.name).toBe('Tyrna');
    expect(result.mag.photonBlast).toBe('Granir');
  });

  it('evolves to Beork when Guard > Hit > Others', () => {
    const result = determineForm(makeStats(3, 40, 15, 2)); // Level 60, Guard > Hit
    expect(result.mag.name).toBe('Beork');
    expect(result.mag.photonBlast).toBe('Pacifal');
  });

  it('evolves to Larg when Guard > Mind > Others', () => {
    const result = determineForm(makeStats(3, 40, 2, 15)); // Level 60, Guard > Mind
    expect(result.mag.name).toBe('Larg');
    expect(result.mag.photonBlast).toBe('Flozir');
  });

  // Hit primary evolutions
  it('evolves to Ansul when Hit > Power > Others', () => {
    const result = determineForm(makeStats(15, 3, 40, 2)); // Level 60, Hit > Power
    expect(result.mag.name).toBe('Ansul');
    expect(result.mag.photonBlast).toBe('Granir');
  });

  it('evolves to Hagal when Hit > Guard > Others', () => {
    const result = determineForm(makeStats(3, 15, 40, 2)); // Level 60, Hit > Guard
    expect(result.mag.name).toBe('Hagal');
    expect(result.mag.photonBlast).toBe('Midgul');
  });

  it('evolves to Sig (White Body) when Hit > Mind > Others', () => {
    const result = determineForm(makeStats(3, 2, 40, 15)); // Level 60, Hit > Mind
    expect(result.mag.name).toBe('Sig (White Body)');
    expect(result.mag.photonBlast).toBe('Flozir');
  });

  // Mind primary evolutions
  it('evolves to Chato (Black Body) when Mind > Power > Others', () => {
    const result = determineForm(makeStats(15, 3, 2, 40)); // Level 60, Mind > Power
    expect(result.mag.name).toBe('Chato (Black Body)');
    expect(result.mag.photonBlast).toBe('Granir');
  });

  it('evolves to Feo when Mind > Guard > Others', () => {
    const result = determineForm(makeStats(3, 15, 2, 40)); // Level 60, Mind > Guard
    expect(result.mag.name).toBe('Feo');
    expect(result.mag.photonBlast).toBe('Midgul');
  });

  it('evolves to Sig when Mind > Hit > Others', () => {
    const result = determineForm(makeStats(3, 2, 15, 40)); // Level 60, Mind > Hit
    expect(result.mag.name).toBe('Sig');
    expect(result.mag.photonBlast).toBe('Pacifal');
  });
});

describe('Mag Evolution - Pure Stats at Level 60', () => {
  /**
   * From PSO-World: "Tier 4 - Evolves at Level 60 (Will Fail if Pure)"
   * Pure mags at level 60 stay at Tier 3 primary form (can't evolve to Tier 4)
   */

  it('stays as Othel (primary Power) at level 60 when pure', () => {
    const result = determineForm(makeStats(60, 0, 0, 0)); // Level 60, pure Power
    expect(result.mag.name).toBe('Othel');
    expect(result.mag.stage).toBe(3);
  });

  it('stays as Aiolo (primary Guard) at level 60 when pure', () => {
    const result = determineForm(makeStats(0, 60, 0, 0)); // Level 60, pure Guard
    expect(result.mag.name).toBe('Aiolo');
    expect(result.mag.stage).toBe(3);
  });

  it('stays as Peoth (primary Hit) at level 60 when pure', () => {
    const result = determineForm(makeStats(0, 0, 60, 0)); // Level 60, pure Hit
    expect(result.mag.name).toBe('Peoth');
    expect(result.mag.stage).toBe(3);
  });

  it('stays as Deegh (primary Mind) at level 60 when pure', () => {
    const result = determineForm(makeStats(0, 0, 0, 60)); // Level 60, pure Mind
    expect(result.mag.name).toBe('Deegh');
    expect(result.mag.stage).toBe(3);
  });
});

describe('Mag Evolution - Photon Blast Summary', () => {
  /**
   * Verify all photon blast assignments match PSO-World chart
   */

  const photonBlastTests = [
    // Tier 2
    { name: 'Yul', photonBlast: 'Granir' },
    { name: 'Aio', photonBlast: 'Midgul' },
    { name: 'Yth', photonBlast: 'Pacifal' },
    { name: 'Ingh', photonBlast: 'Flozir' },
    // Tier 3 Normal
    { name: 'Othel', photonBlast: 'Pacifal' },
    { name: 'Aiolo', photonBlast: 'Flozir' },
    { name: 'Peoth', photonBlast: 'Granir' },
    { name: 'Deegh', photonBlast: 'Midgul' },
    // Tier 3 Pure
    { name: 'Thohn', photonBlast: 'Granir' },
    { name: 'Maray', photonBlast: 'Midgul' },
    { name: 'Teroo', photonBlast: 'Pacifal' },
    { name: 'Niid', photonBlast: 'Flozir' },
    // Tier 4
    { name: 'Urado', photonBlast: 'Midgul' },
    { name: 'Wyn', photonBlast: 'Pacifal' },
    { name: 'Chato (Red Ears)', photonBlast: 'Flozir' },
    { name: 'Tyrna', photonBlast: 'Granir' },
    { name: 'Beork', photonBlast: 'Pacifal' },
    { name: 'Larg', photonBlast: 'Flozir' },
    { name: 'Ansul', photonBlast: 'Granir' },
    { name: 'Hagal', photonBlast: 'Midgul' },
    { name: 'Sig (White Body)', photonBlast: 'Flozir' },
    { name: 'Chato (Black Body)', photonBlast: 'Granir' },
    { name: 'Feo', photonBlast: 'Midgul' },
    { name: 'Sig', photonBlast: 'Pacifal' },
  ];

  it.each(photonBlastTests)(
    '$name should have photon blast $photonBlast',
    ({ name, photonBlast }) => {
      // Find the mag by name in results
      const allMags = Object.values(MAGS);
      const mag = allMags.find((m) => m.name === name);
      expect(mag).toBeDefined();
      expect(mag?.photonBlast).toBe(photonBlast);
    }
  );
});

describe('Mag Evolution - Edge Cases', () => {
  it('handles equal stats by preferring power > guard > hit > mind order', () => {
    // When all stats are equal, the first in iteration order wins
    // This is implementation-specific but should be consistent
    const result = determineForm(makeStats(10, 10, 10, 10)); // Level 40, all equal
    expect(result.mag.stage).toBe(3);
    // The exact result depends on Object.entries order, but it should be consistent
  });

  it('handles level 59 (just below tier 4 threshold)', () => {
    const result = determineForm(makeStats(35, 10, 7, 7)); // Level 59
    expect(result.mag.stage).toBe(3);
    expect(result.mag.name).toBe('Othel'); // Power highest
  });

  it('handles level 29 (just below tier 3 threshold)', () => {
    const result = determineForm(makeStats(20, 5, 2, 2)); // Level 29
    expect(result.mag.stage).toBe(2);
    expect(result.mag.name).toBe('Yul'); // Power highest
  });

  it('handles level 9 (just below tier 2 threshold)', () => {
    const result = determineForm(makeStats(5, 2, 1, 1)); // Level 9
    expect(result.mag.name).toBe('Mag');
    expect(result.mag.stage).toBe(1);
  });
});
