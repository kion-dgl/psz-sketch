import { useState, useMemo } from 'react';

// Mag evolution data
const MAGS = {
  // Tier 1
  mag: { name: 'Mag', stage: 1, photonBlast: null },
  // Tier 2 (Level 10+)
  yul: { name: 'Yul', stage: 2, requirement: { primary: 'Power' }, photonBlast: 'Granir' },
  aio: { name: 'Aio', stage: 2, requirement: { primary: 'Guard' }, photonBlast: 'Midgul' },
  yth: { name: 'Yth', stage: 2, requirement: { primary: 'Hit' }, photonBlast: 'Pacifal' },
  ingh: { name: 'Ingh', stage: 2, requirement: { primary: 'Mind' }, photonBlast: 'Flozir' },
  // Tier 3 (Level 30+) - Normal
  othel: { name: 'Othel', stage: 3, requirement: { primary: 'Power' }, photonBlast: 'Pacifal' },
  aiolo: { name: 'Aiolo', stage: 3, requirement: { primary: 'Guard' }, photonBlast: 'Flozir' },
  peoth: { name: 'Peoth', stage: 3, requirement: { primary: 'Hit' }, photonBlast: 'Granir' },
  deegh: { name: 'Deegh', stage: 3, requirement: { primary: 'Mind' }, photonBlast: 'Midgul' },
  // Tier 3 (Level 30+) - Pure
  thohn: { name: 'Thohn', stage: 3, requirement: { pure: 'Power' }, photonBlast: 'Granir' },
  maray: { name: 'Maray', stage: 3, requirement: { pure: 'Guard' }, photonBlast: 'Midgul' },
  teroo: { name: 'Teroo', stage: 3, requirement: { pure: 'Hit' }, photonBlast: 'Pacifal' },
  niid: { name: 'Niid', stage: 3, requirement: { pure: 'Mind' }, photonBlast: 'Flozir' },
  // Tier 4 (Level 60+)
  urado: { name: 'Urado', stage: 4, requirement: { primary: 'Power', secondary: 'Guard' }, photonBlast: 'Midgul' },
  wyn: { name: 'Wyn', stage: 4, requirement: { primary: 'Power', secondary: 'Hit' }, photonBlast: 'Pacifal' },
  chato_red: { name: 'Chato (Red Ears)', stage: 4, requirement: { primary: 'Power', secondary: 'Mind' }, photonBlast: 'Flozir' },
  tyrna: { name: 'Tyrna', stage: 4, requirement: { primary: 'Guard', secondary: 'Power' }, photonBlast: 'Granir' },
  beork: { name: 'Beork', stage: 4, requirement: { primary: 'Guard', secondary: 'Hit' }, photonBlast: 'Pacifal' },
  larg: { name: 'Larg', stage: 4, requirement: { primary: 'Guard', secondary: 'Mind' }, photonBlast: 'Flozir' },
  ansul: { name: 'Ansul', stage: 4, requirement: { primary: 'Hit', secondary: 'Power' }, photonBlast: 'Granir' },
  hagal: { name: 'Hagal', stage: 4, requirement: { primary: 'Hit', secondary: 'Guard' }, photonBlast: 'Midgul' },
  sig_white: { name: 'Sig (White Body)', stage: 4, requirement: { primary: 'Hit', secondary: 'Mind' }, photonBlast: 'Flozir' },
  chato_black: { name: 'Chato (Black Body)', stage: 4, requirement: { primary: 'Mind', secondary: 'Power' }, photonBlast: 'Granir' },
  feo: { name: 'Feo', stage: 4, requirement: { primary: 'Mind', secondary: 'Guard' }, photonBlast: 'Midgul' },
  sig: { name: 'Sig', stage: 4, requirement: { primary: 'Mind', secondary: 'Hit' }, photonBlast: 'Pacifal' },
};

// Feeding effects by item type and rarity
const FEED_EFFECTS: Record<string, Record<number, { power: number; guard: number; hit: number; mind: number }>> = {
  'Melee Weapon': {
    1: { power: 3, guard: -1, hit: 0, mind: 0 },
    2: { power: 4, guard: -2, hit: 0, mind: 0 },
    3: { power: 5, guard: -3, hit: 0, mind: 0 },
    4: { power: 6, guard: -4, hit: 0, mind: 0 },
    5: { power: 7, guard: -5, hit: 0, mind: 0 },
    6: { power: 8, guard: -6, hit: 0, mind: 0 },
    7: { power: 9, guard: -7, hit: 0, mind: 0 },
  },
  'Ranged Weapon': {
    1: { power: 0, guard: 0, hit: 3, mind: -1 },
    2: { power: 0, guard: 0, hit: 4, mind: -2 },
    3: { power: 0, guard: 0, hit: 5, mind: -3 },
    4: { power: 0, guard: 0, hit: 6, mind: -4 },
    5: { power: 0, guard: 0, hit: 7, mind: -5 },
    6: { power: 0, guard: 0, hit: 8, mind: -6 },
    7: { power: 0, guard: 0, hit: 9, mind: -7 },
  },
  'Force Weapon': {
    1: { power: -1, guard: 0, hit: 0, mind: 3 },
    2: { power: -2, guard: 0, hit: 0, mind: 4 },
    3: { power: -3, guard: 0, hit: 0, mind: 5 },
    4: { power: -4, guard: 0, hit: 0, mind: 6 },
    5: { power: -5, guard: 0, hit: 0, mind: 7 },
    6: { power: -6, guard: 0, hit: 0, mind: 8 },
    7: { power: -7, guard: 0, hit: 0, mind: 9 },
  },
  'Armor': {
    1: { power: 0, guard: 3, hit: 0, mind: -1 },
    2: { power: 0, guard: 4, hit: 0, mind: -2 },
    3: { power: 0, guard: 5, hit: 0, mind: -3 },
    4: { power: 0, guard: 6, hit: 0, mind: -4 },
    5: { power: 0, guard: 7, hit: 0, mind: -5 },
    6: { power: 0, guard: 8, hit: 0, mind: -6 },
    7: { power: 0, guard: 9, hit: 0, mind: -7 },
  },
  'Monomate': {
    1: { power: 1, guard: 1, hit: 0, mind: 0 },
  },
  'Dimate': {
    2: { power: 2, guard: 2, hit: 0, mind: 0 },
  },
  'Trimate': {
    3: { power: 3, guard: 3, hit: 0, mind: 0 },
  },
  'Monofluid': {
    1: { power: 0, guard: 0, hit: 1, mind: 1 },
  },
  'Difluid': {
    2: { power: 0, guard: 0, hit: 2, mind: 2 },
  },
  'Trifluid': {
    3: { power: 0, guard: 0, hit: 3, mind: 3 },
  },
};

type MagStats = {
  power: number;
  guard: number;
  hit: number;
  mind: number;
};

type EvolutionRecord = {
  level: number;
  form: string;
  photonBlast: string | null;
  stats: MagStats;
};

function getLevel(stats: MagStats): number {
  return Math.floor((stats.power + stats.guard + stats.hit + stats.mind) / 5);
}

function isPure(stats: MagStats, stat: keyof MagStats): boolean {
  const otherStats = (['power', 'guard', 'hit', 'mind'] as const).filter(s => s !== stat);
  return stats[stat] > 0 && otherStats.every(s => stats[s] === 0);
}

function getHighestStat(stats: MagStats): keyof MagStats {
  const entries = Object.entries(stats) as [keyof MagStats, number][];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function getSecondHighestStat(stats: MagStats, exclude: keyof MagStats): keyof MagStats {
  const entries = (Object.entries(stats) as [keyof MagStats, number][]).filter(([k]) => k !== exclude);
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function determineForm(stats: MagStats): { id: string; mag: typeof MAGS[keyof typeof MAGS] } {
  const level = getLevel(stats);
  const statNames: Record<string, keyof MagStats> = {
    'Power': 'power',
    'Guard': 'guard',
    'Hit': 'hit',
    'Mind': 'mind'
  };

  // Stage 1: Level 0-9
  if (level < 10) {
    return { id: 'mag', mag: MAGS.mag };
  }

  // Check for pure stats first (for Tier 3 pure forms)
  if (level >= 30) {
    for (const [id, mag] of Object.entries(MAGS)) {
      if (mag.stage === 3 && 'pure' in (mag.requirement || {})) {
        const req = mag.requirement as { pure: string };
        const statKey = statNames[req.pure];
        if (isPure(stats, statKey)) {
          return { id, mag };
        }
      }
    }
  }

  const primary = getHighestStat(stats);
  const secondary = getSecondHighestStat(stats, primary);

  const primaryName = primary.charAt(0).toUpperCase() + primary.slice(1);
  const secondaryName = secondary.charAt(0).toUpperCase() + secondary.slice(1);

  // Stage 4: Level 60+
  if (level >= 60) {
    for (const [id, mag] of Object.entries(MAGS)) {
      if (mag.stage === 4) {
        const req = mag.requirement as { primary: string; secondary: string };
        if (req.primary === primaryName && req.secondary === secondaryName) {
          return { id, mag };
        }
      }
    }
  }

  // Stage 3: Level 30-59
  if (level >= 30) {
    for (const [id, mag] of Object.entries(MAGS)) {
      if (mag.stage === 3 && !('pure' in (mag.requirement || {}))) {
        const req = mag.requirement as { primary: string };
        if (req.primary === primaryName) {
          return { id, mag };
        }
      }
    }
  }

  // Stage 2: Level 10-29
  for (const [id, mag] of Object.entries(MAGS)) {
    if (mag.stage === 2) {
      const req = mag.requirement as { primary: string };
      if (req.primary === primaryName) {
        return { id, mag };
      }
    }
  }

  return { id: 'mag', mag: MAGS.mag };
}

export default function MagSimulatorStorybook() {
  const [stats, setStats] = useState<MagStats>({ power: 0, guard: 0, hit: 0, mind: 0 });
  const [history, setHistory] = useState<EvolutionRecord[]>([]);
  const [feedItem, setFeedItem] = useState<string>('Melee Weapon');
  const [feedRarity, setFeedRarity] = useState<number>(3);

  const level = useMemo(() => getLevel(stats), [stats]);
  const currentForm = useMemo(() => determineForm(stats), [stats]);

  const feed = (itemType: string, rarity: number) => {
    const effect = FEED_EFFECTS[itemType]?.[rarity];
    if (!effect) return;

    const oldForm = determineForm(stats);

    setStats(prev => {
      const newStats = {
        power: Math.max(0, prev.power + effect.power),
        guard: Math.max(0, prev.guard + effect.guard),
        hit: Math.max(0, prev.hit + effect.hit),
        mind: Math.max(0, prev.mind + effect.mind),
      };

      const newForm = determineForm(newStats);

      // Record evolution if form changed
      if (oldForm.id !== newForm.id) {
        setHistory(h => [...h, {
          level: getLevel(newStats),
          form: newForm.mag.name,
          photonBlast: newForm.mag.photonBlast,
          stats: { ...newStats }
        }]);
      }

      return newStats;
    });
  };

  const addStat = (stat: keyof MagStats, amount: number) => {
    const oldForm = determineForm(stats);

    setStats(prev => {
      const newStats = {
        ...prev,
        [stat]: Math.max(0, prev[stat] + amount),
      };

      const newForm = determineForm(newStats);

      if (oldForm.id !== newForm.id) {
        setHistory(h => [...h, {
          level: getLevel(newStats),
          form: newForm.mag.name,
          photonBlast: newForm.mag.photonBlast,
          stats: { ...newStats }
        }]);
      }

      return newStats;
    });
  };

  const reset = () => {
    setStats({ power: 0, guard: 0, hit: 0, mind: 0 });
    setHistory([]);
  };

  const feedItems = Object.keys(FEED_EFFECTS);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mag Simulator</h1>

      {/* Current Mag Display */}
      <div style={styles.magDisplay}>
        <div style={styles.magName}>{currentForm.mag.name}</div>
        <div style={styles.magInfo}>
          <span>Stage {currentForm.mag.stage}</span>
          <span>Level {level}</span>
          {currentForm.mag.photonBlast && (
            <span style={styles.photonBlast}>PB: {currentForm.mag.photonBlast}</span>
          )}
        </div>
      </div>

      {/* Stats Display */}
      <div style={styles.statsGrid}>
        {(['power', 'guard', 'hit', 'mind'] as const).map(stat => (
          <div key={stat} style={styles.statBox}>
            <div style={styles.statLabel}>{stat.toUpperCase()}</div>
            <div style={styles.statValue}>{stats[stat]}</div>
            <div style={styles.statButtons}>
              <button style={styles.smallBtn} onClick={() => addStat(stat, -5)}>-5</button>
              <button style={styles.smallBtn} onClick={() => addStat(stat, -1)}>-1</button>
              <button style={styles.smallBtn} onClick={() => addStat(stat, 1)}>+1</button>
              <button style={styles.smallBtn} onClick={() => addStat(stat, 5)}>+5</button>
              <button style={styles.smallBtn} onClick={() => addStat(stat, 25)}>+25</button>
            </div>
          </div>
        ))}
      </div>

      {/* Feeding Controls */}
      <div style={styles.feedSection}>
        <h3 style={styles.sectionTitle}>Feed Item</h3>
        <div style={styles.feedControls}>
          <select
            value={feedItem}
            onChange={e => setFeedItem(e.target.value)}
            style={styles.select}
          >
            {feedItems.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={feedRarity}
            onChange={e => setFeedRarity(Number(e.target.value))}
            style={styles.select}
          >
            {[1, 2, 3, 4, 5, 6, 7].filter(r => FEED_EFFECTS[feedItem]?.[r]).map(r => (
              <option key={r} value={r}>{r}*</option>
            ))}
          </select>
          <button style={styles.feedBtn} onClick={() => feed(feedItem, feedRarity)}>
            Feed
          </button>
          <button style={styles.feedBtn} onClick={() => { for(let i = 0; i < 10; i++) feed(feedItem, feedRarity); }}>
            Feed x10
          </button>
        </div>
        {FEED_EFFECTS[feedItem]?.[feedRarity] && (
          <div style={styles.feedPreview}>
            Effect:
            {Object.entries(FEED_EFFECTS[feedItem][feedRarity]).map(([stat, val]) =>
              val !== 0 && <span key={stat} style={{ color: val > 0 ? '#4f4' : '#f44', marginLeft: 8 }}>
                {stat.toUpperCase()} {val > 0 ? '+' : ''}{val}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div style={styles.presetsSection}>
        <h3 style={styles.sectionTitle}>Quick Presets</h3>
        <div style={styles.presetsGrid}>
          <button style={styles.presetBtn} onClick={() => { setStats({ power: 50, guard: 0, hit: 0, mind: 0 }); setHistory([]); }}>
            Pure Power (Lv10)
          </button>
          <button style={styles.presetBtn} onClick={() => { setStats({ power: 150, guard: 0, hit: 0, mind: 0 }); setHistory([]); }}>
            Pure Power (Lv30)
          </button>
          <button style={styles.presetBtn} onClick={() => { setStats({ power: 150, guard: 100, hit: 50, mind: 0 }); setHistory([]); }}>
            Power &gt; Guard (Lv60)
          </button>
          <button style={styles.presetBtn} onClick={() => { setStats({ power: 0, guard: 0, hit: 0, mind: 150 }); setHistory([]); }}>
            Pure Mind (Lv30)
          </button>
        </div>
      </div>

      {/* Evolution History */}
      <div style={styles.historySection}>
        <h3 style={styles.sectionTitle}>Evolution History</h3>
        {history.length === 0 ? (
          <div style={styles.noHistory}>No evolutions yet. Feed your Mag to see it evolve!</div>
        ) : (
          <div style={styles.historyList}>
            {history.map((record, i) => (
              <div key={i} style={styles.historyItem}>
                <span style={styles.historyLevel}>Lv{record.level}</span>
                <span style={styles.historyForm}>{record.form}</span>
                {record.photonBlast && (
                  <span style={styles.historyPB}>+ {record.photonBlast}</span>
                )}
                <span style={styles.historyStats}>
                  (P:{record.stats.power} G:{record.stats.guard} H:{record.stats.hit} M:{record.stats.mind})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Button */}
      <button style={styles.resetBtn} onClick={reset}>Reset Mag</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#fff',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  magDisplay: {
    background: 'linear-gradient(135deg, #2d3436 0%, #1a1a2e 100%)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '20px',
    border: '2px solid #4a4a6a',
  },
  magName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#6bf',
    marginBottom: '8px',
  },
  magInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    color: '#aaa',
    fontSize: '14px',
  },
  photonBlast: {
    color: '#f6b',
    fontWeight: 'bold',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px',
  },
  statButtons: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  smallBtn: {
    padding: '4px 8px',
    fontSize: '11px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
  },
  feedSection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '0 0 12px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  feedControls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
  },
  feedBtn: {
    padding: '8px 16px',
    background: '#4a6cf7',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  feedPreview: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#888',
  },
  presetsSection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  presetsGrid: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  presetBtn: {
    padding: '8px 16px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
  },
  historySection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  noHistory: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: '#1a1a2e',
    borderRadius: '4px',
  },
  historyLevel: {
    color: '#888',
    fontSize: '12px',
    minWidth: '40px',
  },
  historyForm: {
    color: '#6bf',
    fontWeight: 'bold',
    minWidth: '120px',
  },
  historyPB: {
    color: '#f6b',
    fontSize: '12px',
  },
  historyStats: {
    color: '#666',
    fontSize: '11px',
    marginLeft: 'auto',
  },
  resetBtn: {
    width: '100%',
    padding: '12px',
    background: '#c44',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
