import { useState, useMemo } from 'react';
import { determineForm, getLevel, MagStats } from '../../lib/mag-evolution';

// Item categories and their stat effects
type ItemCategory = 'melee' | 'ranged' | 'force' | 'armor' | 'mate' | 'fluid';

interface FeedEffect {
  power: number;
  guard: number;
  hit: number;
  mind: number;
}

// Feeding effects by category, tier, and rarity (simplified for common tiers)
const FEED_EFFECTS: Record<ItemCategory, Record<number, Record<number, FeedEffect>>> = {
  melee: {
    1: {
      1: { power: 3, guard: -1, hit: 0, mind: 0 },
      2: { power: 4, guard: -2, hit: 0, mind: 0 },
      3: { power: 5, guard: -3, hit: 0, mind: 0 },
      4: { power: 6, guard: -4, hit: 0, mind: 0 },
      5: { power: 7, guard: -5, hit: 0, mind: 0 },
    },
    2: {
      1: { power: 2, guard: 0, hit: 0, mind: 0 },
      2: { power: 3, guard: -1, hit: 0, mind: 0 },
      3: { power: 4, guard: -2, hit: 0, mind: 0 },
      4: { power: 5, guard: -3, hit: 0, mind: 0 },
      5: { power: 6, guard: -4, hit: 0, mind: 0 },
    },
    3: {
      1: { power: 1, guard: -1, hit: 0, mind: 0 },
      2: { power: 2, guard: 0, hit: 0, mind: 0 },
      3: { power: 3, guard: -1, hit: 0, mind: 0 },
      4: { power: 4, guard: -2, hit: 0, mind: 0 },
      5: { power: 5, guard: -3, hit: 0, mind: 0 },
    },
    4: {
      1: { power: 0, guard: -2, hit: 0, mind: 0 },
      2: { power: 1, guard: -1, hit: 0, mind: 0 },
      3: { power: 2, guard: 0, hit: 0, mind: 0 },
      4: { power: 3, guard: -1, hit: 0, mind: 0 },
      5: { power: 4, guard: -2, hit: 0, mind: 0 },
    },
  },
  ranged: {
    1: {
      1: { power: 0, guard: 0, hit: 3, mind: -1 },
      2: { power: 0, guard: 0, hit: 4, mind: -2 },
      3: { power: 0, guard: 0, hit: 5, mind: -3 },
      4: { power: 0, guard: 0, hit: 6, mind: -4 },
      5: { power: 0, guard: 0, hit: 7, mind: -5 },
    },
    2: {
      1: { power: 0, guard: 0, hit: 2, mind: 0 },
      2: { power: 0, guard: 0, hit: 3, mind: -1 },
      3: { power: 0, guard: 0, hit: 4, mind: -2 },
      4: { power: 0, guard: 0, hit: 5, mind: -3 },
      5: { power: 0, guard: 0, hit: 6, mind: -4 },
    },
    3: {
      1: { power: 0, guard: 0, hit: 1, mind: -1 },
      2: { power: 0, guard: 0, hit: 2, mind: 0 },
      3: { power: 0, guard: 0, hit: 3, mind: -1 },
      4: { power: 0, guard: 0, hit: 4, mind: -2 },
      5: { power: 0, guard: 0, hit: 5, mind: -3 },
    },
    4: {
      1: { power: 0, guard: 0, hit: 0, mind: -2 },
      2: { power: 0, guard: 0, hit: 1, mind: -1 },
      3: { power: 0, guard: 0, hit: 2, mind: 0 },
      4: { power: 0, guard: 0, hit: 3, mind: -1 },
      5: { power: 0, guard: 0, hit: 4, mind: -2 },
    },
  },
  force: {
    1: {
      1: { power: -1, guard: 0, hit: 0, mind: 3 },
      2: { power: -2, guard: 0, hit: 0, mind: 4 },
      3: { power: -3, guard: 0, hit: 0, mind: 5 },
      4: { power: -4, guard: 0, hit: 0, mind: 6 },
      5: { power: -5, guard: 0, hit: 0, mind: 7 },
    },
    2: {
      1: { power: 0, guard: 0, hit: 0, mind: 2 },
      2: { power: -1, guard: 0, hit: 0, mind: 3 },
      3: { power: -2, guard: 0, hit: 0, mind: 4 },
      4: { power: -3, guard: 0, hit: 0, mind: 5 },
      5: { power: -4, guard: 0, hit: 0, mind: 6 },
    },
    3: {
      1: { power: -1, guard: 0, hit: 0, mind: 1 },
      2: { power: 0, guard: 0, hit: 0, mind: 2 },
      3: { power: -1, guard: 0, hit: 0, mind: 3 },
      4: { power: -2, guard: 0, hit: 0, mind: 4 },
      5: { power: -3, guard: 0, hit: 0, mind: 5 },
    },
    4: {
      1: { power: -2, guard: 0, hit: 0, mind: 0 },
      2: { power: -1, guard: 0, hit: 0, mind: 1 },
      3: { power: 0, guard: 0, hit: 0, mind: 2 },
      4: { power: -1, guard: 0, hit: 0, mind: 3 },
      5: { power: -2, guard: 0, hit: 0, mind: 4 },
    },
  },
  armor: {
    1: {
      1: { power: 0, guard: 3, hit: -1, mind: 0 },
      2: { power: 0, guard: 4, hit: -2, mind: 0 },
      3: { power: 0, guard: 5, hit: -3, mind: 0 },
      4: { power: 0, guard: 6, hit: -4, mind: 0 },
      5: { power: 0, guard: 7, hit: -5, mind: 0 },
    },
    2: {
      1: { power: 0, guard: 2, hit: 0, mind: 0 },
      2: { power: 0, guard: 3, hit: -1, mind: 0 },
      3: { power: 0, guard: 4, hit: -2, mind: 0 },
      4: { power: 0, guard: 5, hit: -3, mind: 0 },
      5: { power: 0, guard: 6, hit: -4, mind: 0 },
    },
    3: {
      1: { power: 0, guard: 1, hit: -1, mind: 0 },
      2: { power: 0, guard: 2, hit: 0, mind: 0 },
      3: { power: 0, guard: 3, hit: -1, mind: 0 },
      4: { power: 0, guard: 4, hit: -2, mind: 0 },
      5: { power: 0, guard: 5, hit: -3, mind: 0 },
    },
    4: {
      1: { power: 0, guard: 0, hit: -2, mind: 0 },
      2: { power: 0, guard: 1, hit: -1, mind: 0 },
      3: { power: 0, guard: 2, hit: 0, mind: 0 },
      4: { power: 0, guard: 3, hit: -1, mind: 0 },
      5: { power: 0, guard: 4, hit: -2, mind: 0 },
    },
  },
  // Simplified mate/fluid categories
  mate: {
    1: {
      1: { power: 1, guard: 1, hit: 0, mind: 0 },
      2: { power: 2, guard: 2, hit: 0, mind: 0 },
      3: { power: 3, guard: 3, hit: 0, mind: 0 },
      4: { power: 4, guard: 4, hit: 0, mind: 0 },
      5: { power: 5, guard: 5, hit: 0, mind: 0 },
    },
    2: {
      1: { power: 1, guard: 1, hit: 0, mind: 0 },
      2: { power: 2, guard: 2, hit: 0, mind: 0 },
      3: { power: 3, guard: 3, hit: 0, mind: 0 },
      4: { power: 4, guard: 4, hit: 0, mind: 0 },
      5: { power: 5, guard: 5, hit: 0, mind: 0 },
    },
    3: {
      1: { power: 1, guard: 1, hit: 0, mind: 0 },
      2: { power: 2, guard: 2, hit: 0, mind: 0 },
      3: { power: 3, guard: 3, hit: 0, mind: 0 },
      4: { power: 4, guard: 4, hit: 0, mind: 0 },
      5: { power: 5, guard: 5, hit: 0, mind: 0 },
    },
    4: {
      1: { power: 1, guard: 1, hit: 0, mind: 0 },
      2: { power: 2, guard: 2, hit: 0, mind: 0 },
      3: { power: 3, guard: 3, hit: 0, mind: 0 },
      4: { power: 4, guard: 4, hit: 0, mind: 0 },
      5: { power: 5, guard: 5, hit: 0, mind: 0 },
    },
  },
  fluid: {
    1: {
      1: { power: 0, guard: 0, hit: 1, mind: 1 },
      2: { power: 0, guard: 0, hit: 2, mind: 2 },
      3: { power: 0, guard: 0, hit: 3, mind: 3 },
      4: { power: 0, guard: 0, hit: 4, mind: 4 },
      5: { power: 0, guard: 0, hit: 5, mind: 5 },
    },
    2: {
      1: { power: 0, guard: 0, hit: 1, mind: 1 },
      2: { power: 0, guard: 0, hit: 2, mind: 2 },
      3: { power: 0, guard: 0, hit: 3, mind: 3 },
      4: { power: 0, guard: 0, hit: 4, mind: 4 },
      5: { power: 0, guard: 0, hit: 5, mind: 5 },
    },
    3: {
      1: { power: 0, guard: 0, hit: 1, mind: 1 },
      2: { power: 0, guard: 0, hit: 2, mind: 2 },
      3: { power: 0, guard: 0, hit: 3, mind: 3 },
      4: { power: 0, guard: 0, hit: 4, mind: 4 },
      5: { power: 0, guard: 0, hit: 5, mind: 5 },
    },
    4: {
      1: { power: 0, guard: 0, hit: 1, mind: 1 },
      2: { power: 0, guard: 0, hit: 2, mind: 2 },
      3: { power: 0, guard: 0, hit: 3, mind: 3 },
      4: { power: 0, guard: 0, hit: 4, mind: 4 },
      5: { power: 0, guard: 0, hit: 5, mind: 5 },
    },
  },
};

const ITEM_CATEGORIES: { id: ItemCategory; label: string; color: string }[] = [
  { id: 'melee', label: 'Melee Weapon', color: '#e74c3c' },
  { id: 'ranged', label: 'Ranged Weapon', color: '#2ecc71' },
  { id: 'force', label: 'Force Weapon', color: '#9b59b6' },
  { id: 'armor', label: 'Armor', color: '#3498db' },
  { id: 'mate', label: 'Mate', color: '#e67e22' },
  { id: 'fluid', label: 'Fluid', color: '#1abc9c' },
];

type GaugeState = {
  power: number;
  guard: number;
  hit: number;
  mind: number;
};

type FeedRecord = {
  item: string;
  tier: number;
  rarity: number;
  effects: FeedEffect;
  levelUps: string[];
};

type EvolutionRecord = {
  level: number;
  form: string;
  photonBlast: string | null;
  stats: MagStats;
};

const GAUGE_MAX = 100;

export default function MagFeederStorybook() {
  const [stats, setStats] = useState<MagStats>({ power: 0, guard: 0, hit: 0, mind: 0 });
  const [gauges, setGauges] = useState<GaugeState>({ power: 0, guard: 0, hit: 0, mind: 0 });
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionRecord[]>([]);
  const [feedHistory, setFeedHistory] = useState<FeedRecord[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('melee');
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [selectedRarity, setSelectedRarity] = useState<number>(3);

  const level = useMemo(() => getLevel(stats), [stats]);
  const currentForm = useMemo(() => determineForm(stats), [stats]);

  const feedItem = () => {
    const effect = FEED_EFFECTS[selectedCategory][selectedTier][selectedRarity];
    if (!effect) return;

    const oldForm = determineForm(stats);
    const levelUps: string[] = [];

    // Apply gauge changes and check for level ups
    setGauges(prevGauges => {
      const newGauges = { ...prevGauges };
      const newStats = { ...stats };

      (['power', 'guard', 'hit', 'mind'] as const).forEach(stat => {
        const change = effect[stat];
        if (change !== 0) {
          newGauges[stat] = Math.max(0, newGauges[stat] + change);

          // Check for level ups (when gauge reaches 100)
          while (newGauges[stat] >= GAUGE_MAX) {
            newGauges[stat] -= GAUGE_MAX;
            newStats[stat] += 5; // Add 5 points (1 level)
            levelUps.push(stat.toUpperCase());
          }
        }
      });

      // Update stats if any level ups occurred
      if (levelUps.length > 0) {
        setStats(newStats);

        const newForm = determineForm(newStats);
        if (oldForm.id !== newForm.id) {
          setEvolutionHistory(h => [...h, {
            level: getLevel(newStats),
            form: newForm.mag.name,
            photonBlast: newForm.mag.photonBlast,
            stats: { ...newStats }
          }]);
        }
      }

      return newGauges;
    });

    // Add to feed history
    const categoryInfo = ITEM_CATEGORIES.find(c => c.id === selectedCategory);
    setFeedHistory(h => [...h.slice(-9), {
      item: `${categoryInfo?.label} T${selectedTier} ${selectedRarity}★`,
      tier: selectedTier,
      rarity: selectedRarity,
      effects: effect,
      levelUps
    }]);
  };

  const reset = () => {
    setStats({ power: 0, guard: 0, hit: 0, mind: 0 });
    setGauges({ power: 0, guard: 0, hit: 0, mind: 0 });
    setEvolutionHistory([]);
    setFeedHistory([]);
  };

  const currentEffect = FEED_EFFECTS[selectedCategory][selectedTier][selectedRarity];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mag Feeder</h1>
      <p style={styles.subtitle}>Emulate the game's feeding system with gauges</p>

      {/* Current Mag Display */}
      <div style={styles.magDisplay}>
        <div style={styles.magName}>{currentForm.mag.name}</div>
        <div style={styles.magInfo}>
          <span style={styles.stageBadge}>Stage {currentForm.mag.stage}</span>
          <span style={styles.levelBadge}>Level {level}</span>
          {currentForm.mag.photonBlast && (
            <span style={styles.pbBadge}>PB: {currentForm.mag.photonBlast}</span>
          )}
        </div>
      </div>

      {/* Stat Gauges */}
      <div style={styles.gaugesSection}>
        <h3 style={styles.sectionTitle}>Stat Gauges</h3>
        <div style={styles.gaugesGrid}>
          {(['power', 'guard', 'hit', 'mind'] as const).map(stat => {
            const statLevel = Math.floor(stats[stat] / 5);
            const gaugePercent = (gauges[stat] / GAUGE_MAX) * 100;
            const color = stat === 'power' ? '#e74c3c' :
                         stat === 'guard' ? '#3498db' :
                         stat === 'hit' ? '#2ecc71' : '#9b59b6';

            return (
              <div key={stat} style={styles.gaugeBox}>
                <div style={styles.gaugeHeader}>
                  <span style={styles.statLabel}>{stat.toUpperCase()}</span>
                  <span style={styles.statLevel}>Lv {statLevel}</span>
                </div>
                <div style={styles.gaugeBarContainer}>
                  <div style={styles.gaugeBar}>
                    <div
                      style={{
                        ...styles.gaugeFill,
                        width: `${gaugePercent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span style={styles.gaugeValue}>{gauges[stat]}/{GAUGE_MAX}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Selection */}
      <div style={styles.itemSection}>
        <h3 style={styles.sectionTitle}>Feed Item</h3>

        {/* Category Selection */}
        <div style={styles.categoryGrid}>
          {ITEM_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              style={{
                ...styles.categoryBtn,
                ...(selectedCategory === cat.id ? {
                  background: cat.color,
                  color: '#fff',
                  borderColor: cat.color
                } : {})
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tier and Rarity Selection */}
        <div style={styles.tierRarityRow}>
          <div style={styles.selectGroup}>
            <label style={styles.selectLabel}>Tier</label>
            <div style={styles.tierBtns}>
              {[1, 2, 3, 4].map(tier => (
                <button
                  key={tier}
                  style={{
                    ...styles.tierBtn,
                    ...(selectedTier === tier ? styles.tierBtnActive : {})
                  }}
                  onClick={() => setSelectedTier(tier)}
                >
                  T{tier}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.selectGroup}>
            <label style={styles.selectLabel}>Rarity</label>
            <div style={styles.tierBtns}>
              {[1, 2, 3, 4, 5].map(rarity => (
                <button
                  key={rarity}
                  style={{
                    ...styles.tierBtn,
                    ...(selectedRarity === rarity ? styles.tierBtnActive : {})
                  }}
                  onClick={() => setSelectedRarity(rarity)}
                >
                  {rarity}★
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Effect Preview */}
        {currentEffect && (
          <div style={styles.effectPreview}>
            <span style={styles.effectLabel}>Effect:</span>
            {(['power', 'guard', 'hit', 'mind'] as const).map(stat => {
              const val = currentEffect[stat];
              if (val === 0) return null;
              const color = val > 0 ? '#2ecc71' : '#e74c3c';
              return (
                <span key={stat} style={{ ...styles.effectStat, color }}>
                  {stat.toUpperCase()} {val > 0 ? '+' : ''}{val}
                </span>
              );
            })}
          </div>
        )}

        {/* Feed Button */}
        <button style={styles.feedBtn} onClick={feedItem}>
          Feed Item
        </button>
      </div>

      {/* Feed History */}
      <div style={styles.historySection}>
        <h3 style={styles.sectionTitle}>Feed History</h3>
        {feedHistory.length === 0 ? (
          <div style={styles.noHistory}>Feed items to see history</div>
        ) : (
          <div style={styles.feedHistoryList}>
            {feedHistory.slice().reverse().map((record, i) => (
              <div key={i} style={styles.feedHistoryItem}>
                <span style={styles.feedItemName}>{record.item}</span>
                <div style={styles.feedEffects}>
                  {(['power', 'guard', 'hit', 'mind'] as const).map(stat => {
                    const val = record.effects[stat];
                    if (val === 0) return null;
                    const color = val > 0 ? '#2ecc71' : '#e74c3c';
                    return (
                      <span key={stat} style={{ ...styles.effectMini, color }}>
                        {stat.charAt(0).toUpperCase()} {val > 0 ? '+' : ''}{val}
                      </span>
                    );
                  })}
                </div>
                {record.levelUps.length > 0 && (
                  <span style={styles.levelUpBadge}>+{record.levelUps.join(', ')}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evolution History */}
      <div style={styles.historySection}>
        <h3 style={styles.sectionTitle}>Evolution History</h3>
        {evolutionHistory.length === 0 ? (
          <div style={styles.noHistory}>Feed items to trigger evolutions</div>
        ) : (
          <div style={styles.historyList}>
            {evolutionHistory.map((record, i) => (
              <div key={i} style={styles.historyItem}>
                <span style={styles.historyLevel}>Lv {record.level}</span>
                <span style={styles.historyArrow}>&rarr;</span>
                <span style={styles.historyForm}>{record.form}</span>
                {record.photonBlast && (
                  <span style={styles.historyPB}>+{record.photonBlast}</span>
                )}
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
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '24px',
    marginBottom: '4px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '24px',
  },
  magDisplay: {
    background: 'linear-gradient(135deg, #2d3436 0%, #1a1a2e 100%)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '24px',
    border: '2px solid #4a4a6a',
  },
  magName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#6bf',
    marginBottom: '12px',
  },
  magInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  stageBadge: {
    background: '#2d2d44',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#aaa',
  },
  levelBadge: {
    background: '#2d2d44',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#fff',
  },
  pbBadge: {
    background: '#5a2d5a',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#f6b',
    fontWeight: 'bold',
  },
  gaugesSection: {
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
  gaugesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  gaugeBox: {
    background: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
  },
  gaugeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    fontWeight: 'bold',
  },
  statLevel: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: 'bold',
  },
  gaugeBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  gaugeBar: {
    flex: 1,
    height: '12px',
    background: '#0a0a1a',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
  },
  gaugeValue: {
    fontSize: '11px',
    color: '#666',
    minWidth: '50px',
    textAlign: 'right',
  },
  itemSection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  categoryBtn: {
    padding: '10px 8px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  tierRarityRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  selectGroup: {
    flex: 1,
  },
  selectLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px',
  },
  tierBtns: {
    display: 'flex',
    gap: '4px',
  },
  tierBtn: {
    flex: 1,
    padding: '8px 4px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
  },
  tierBtnActive: {
    background: '#4a4a6a',
    color: '#fff',
    borderColor: '#6b8afd',
  },
  effectPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    background: '#1a1a2e',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  effectLabel: {
    fontSize: '12px',
    color: '#888',
  },
  effectStat: {
    fontSize: '13px',
    fontWeight: 'bold',
  },
  feedBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6b8afd 0%, #4a6cf4 100%)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
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
  feedHistoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  feedHistoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: '#1a1a2e',
    borderRadius: '4px',
    fontSize: '12px',
  },
  feedItemName: {
    color: '#aaa',
    flex: 1,
  },
  feedEffects: {
    display: 'flex',
    gap: '6px',
  },
  effectMini: {
    fontSize: '11px',
    fontWeight: 'bold',
  },
  levelUpBadge: {
    background: '#2d5a2d',
    color: '#6f6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
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
    padding: '10px 14px',
    background: '#1a1a2e',
    borderRadius: '6px',
  },
  historyLevel: {
    color: '#888',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '50px',
  },
  historyArrow: {
    color: '#444',
  },
  historyForm: {
    color: '#6bf',
    fontWeight: 'bold',
    flex: 1,
  },
  historyPB: {
    color: '#f6b',
    fontSize: '12px',
    fontWeight: 'bold',
    background: '#5a2d5a',
    padding: '2px 8px',
    borderRadius: '10px',
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
