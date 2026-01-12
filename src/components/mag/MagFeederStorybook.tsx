import { useState, useMemo } from 'react';
import { determineForm, getLevel, type MagStats } from '../../lib/mag-evolution';

// Equipment categories
type EquipmentCategory = 'melee' | 'ranged' | 'force' | 'armor';

interface FeedEffect {
  power: number;
  guard: number;
  hit: number;
  mind: number;
}

// Consumable items from content folder
const CONSUMABLES = [
  { id: 'monomate', name: 'Monomate', effect: { power: 1, guard: 1, hit: 0, mind: 0 } },
  { id: 'dimate', name: 'Dimate', effect: { power: 2, guard: 2, hit: 0, mind: 0 } },
  { id: 'trimate', name: 'Trimate', effect: { power: 3, guard: 3, hit: 0, mind: 0 } },
  { id: 'monofluid', name: 'Monofluid', effect: { power: 0, guard: 0, hit: 1, mind: 1 } },
  { id: 'difluid', name: 'Difluid', effect: { power: 0, guard: 0, hit: 2, mind: 2 } },
  { id: 'trifluid', name: 'Trifluid', effect: { power: 0, guard: 0, hit: 3, mind: 3 } },
  { id: 'moon-atomizer', name: 'Moon Atomizer', effect: { power: 1, guard: 0, hit: 1, mind: 0 } },
  { id: 'sol-atomizer', name: 'Sol Atomizer', effect: { power: 0, guard: 1, hit: 0, mind: 1 } },
  { id: 'star-atomizer', name: 'Star Atomizer', effect: { power: 1, guard: 1, hit: 1, mind: 1 } },
];

// Feeding effects by category, tier (based on mag stage), and rarity
const EQUIPMENT_EFFECTS: Record<EquipmentCategory, Record<number, Record<number, FeedEffect>>> = {
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
};

const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; label: string; color: string }[] = [
  { id: 'melee', label: 'Melee', color: '#e74c3c' },
  { id: 'ranged', label: 'Ranged', color: '#2ecc71' },
  { id: 'force', label: 'Force', color: '#9b59b6' },
  { id: 'armor', label: 'Armor', color: '#3498db' },
];

type GaugeState = {
  power: number;
  guard: number;
  hit: number;
  mind: number;
};

type FeedRecord = {
  item: string;
  effects: FeedEffect;
  levelUps: string[];
};

type EvolutionRecord = {
  level: number;
  form: string;
  photonBlast: string | null;
};

const GAUGE_MAX = 10;
const MAX_TOTAL_POINTS = 500; // Level 100 cap

export default function MagFeederStorybook() {
  const [stats, setStats] = useState<MagStats>({ power: 0, guard: 0, hit: 0, mind: 0 });
  const [gauges, setGauges] = useState<GaugeState>({ power: 0, guard: 0, hit: 0, mind: 0 });
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionRecord[]>([]);
  const [feedHistory, setFeedHistory] = useState<FeedRecord[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory>('melee');
  const [selectedRarity, setSelectedRarity] = useState<number>(3);

  const level = useMemo(() => getLevel(stats), [stats]);
  const currentForm = useMemo(() => determineForm(stats), [stats]);

  // Tier is based on mag stage (1-4)
  const currentTier = currentForm.mag.stage;

  const applyFeedEffect = (effect: FeedEffect, itemName: string) => {
    const oldForm = determineForm(stats);
    const levelUps: string[] = [];

    setGauges(prevGauges => {
      const newGauges = { ...prevGauges };
      const newStats = { ...stats };
      const currentTotal = stats.power + stats.guard + stats.hit + stats.mind;

      (['power', 'guard', 'hit', 'mind'] as const).forEach(stat => {
        const change = effect[stat];
        if (change !== 0) {
          newGauges[stat] = Math.max(0, newGauges[stat] + change);

          // Check for level ups (when gauge reaches GAUGE_MAX)
          while (newGauges[stat] >= GAUGE_MAX) {
            newGauges[stat] -= GAUGE_MAX;
            // Check level cap before adding points
            const newTotal = newStats.power + newStats.guard + newStats.hit + newStats.mind;
            if (newTotal < MAX_TOTAL_POINTS) {
              newStats[stat] += 5; // Add 5 points (1 level)
              levelUps.push(stat.toUpperCase());
            }
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
          }]);
        }
      }

      return newGauges;
    });

    // Add to feed history
    setFeedHistory(h => [...h.slice(-9), {
      item: itemName,
      effects: effect,
      levelUps
    }]);
  };

  const feedEquipment = () => {
    const effect = EQUIPMENT_EFFECTS[selectedCategory][currentTier]?.[selectedRarity];
    if (!effect) return;

    const categoryInfo = EQUIPMENT_CATEGORIES.find(c => c.id === selectedCategory);
    applyFeedEffect(effect, `${categoryInfo?.label} ${selectedRarity}★`);
  };

  const feedConsumable = (consumable: typeof CONSUMABLES[0]) => {
    applyFeedEffect(consumable.effect, consumable.name);
  };

  const reset = () => {
    setStats({ power: 0, guard: 0, hit: 0, mind: 0 });
    setGauges({ power: 0, guard: 0, hit: 0, mind: 0 });
    setEvolutionHistory([]);
    setFeedHistory([]);
  };

  const currentEffect = EQUIPMENT_EFFECTS[selectedCategory][currentTier]?.[selectedRarity];

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        {/* Left Column - Mag Info & Stats */}
        <div style={styles.leftColumn}>
          {/* Compact Mag Header */}
          <div style={styles.magHeader}>
            <div style={styles.magNameRow}>
              <span style={styles.magName}>{currentForm.mag.name}</span>
              <span style={styles.tierBadge}>Tier {currentTier}</span>
            </div>
            <div style={styles.magMeta}>
              <span style={styles.levelText}>Level {level}</span>
              {currentForm.mag.photonBlast && (
                <span style={styles.pbText}>PB: {currentForm.mag.photonBlast}</span>
              )}
            </div>
          </div>

          {/* Stat Gauges - Full Width */}
          <div style={styles.gaugesSection}>
            <h3 style={styles.sectionTitle}>Stats</h3>
            {(['power', 'guard', 'hit', 'mind'] as const).map(stat => {
              const statLevel = Math.floor(stats[stat] / 5);
              const gaugePercent = (gauges[stat] / GAUGE_MAX) * 100;
              const color = stat === 'power' ? '#e74c3c' :
                           stat === 'guard' ? '#3498db' :
                           stat === 'hit' ? '#2ecc71' : '#9b59b6';

              return (
                <div key={stat} style={styles.gaugeRow}>
                  <div style={styles.gaugeLabel}>
                    <span style={{ color }}>{stat.toUpperCase()}</span>
                    <span style={styles.gaugeLevelText}>Lv {statLevel}</span>
                  </div>
                  <div style={styles.gaugeBarOuter}>
                    <div
                      style={{
                        ...styles.gaugeBarFill,
                        width: `${gaugePercent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span style={styles.gaugeValueText}>{gauges[stat]}/{GAUGE_MAX}</span>
                </div>
              );
            })}
          </div>

          {/* Evolution History */}
          <div style={styles.historySection}>
            <h3 style={styles.sectionTitle}>Evolutions</h3>
            {evolutionHistory.length === 0 ? (
              <div style={styles.noHistory}>No evolutions yet</div>
            ) : (
              <div style={styles.evolutionList}>
                {evolutionHistory.map((record, i) => (
                  <div key={i} style={styles.evolutionItem}>
                    <span style={styles.evoLevel}>Lv {record.level}</span>
                    <span style={styles.evoForm}>{record.form}</span>
                    {record.photonBlast && (
                      <span style={styles.evoPB}>+{record.photonBlast}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Item Feeding */}
        <div style={styles.rightColumn}>
          {/* Equipment Section */}
          <div style={styles.feedSection}>
            <h3 style={styles.sectionTitle}>Equipment</h3>

            {/* Category Selection */}
            <div style={styles.categoryRow}>
              {EQUIPMENT_CATEGORIES.map(cat => (
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

            {/* Rarity Selection */}
            <div style={styles.rarityRow}>
              <span style={styles.rarityLabel}>Rarity:</span>
              {[1, 2, 3, 4, 5].map(rarity => (
                <button
                  key={rarity}
                  style={{
                    ...styles.rarityBtn,
                    ...(selectedRarity === rarity ? styles.rarityBtnActive : {})
                  }}
                  onClick={() => setSelectedRarity(rarity)}
                >
                  {rarity}★
                </button>
              ))}
            </div>

            {/* Effect Preview */}
            {currentEffect && (
              <div style={styles.effectPreview}>
                {(['power', 'guard', 'hit', 'mind'] as const).map(stat => {
                  const val = currentEffect[stat];
                  if (val === 0) return null;
                  const color = val > 0 ? '#2ecc71' : '#e74c3c';
                  return (
                    <span key={stat} style={{ ...styles.effectText, color }}>
                      {stat.charAt(0).toUpperCase()} {val > 0 ? '+' : ''}{val}
                    </span>
                  );
                })}
              </div>
            )}

            <button style={styles.feedBtn} onClick={feedEquipment}>
              Feed Equipment
            </button>
          </div>

          {/* Consumables Section */}
          <div style={styles.feedSection}>
            <h3 style={styles.sectionTitle}>Consumables</h3>
            <div style={styles.consumableGrid}>
              {CONSUMABLES.map(item => (
                <button
                  key={item.id}
                  style={styles.consumableBtn}
                  onClick={() => feedConsumable(item)}
                  title={`P:${item.effect.power} G:${item.effect.guard} H:${item.effect.hit} M:${item.effect.mind}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Feed History */}
          <div style={styles.feedHistorySection}>
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
                            {stat.charAt(0).toUpperCase()}{val > 0 ? '+' : ''}{val}
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

          {/* Reset Button */}
          <button style={styles.resetBtn} onClick={reset}>Reset Mag</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#fff',
  },
  layout: {
    display: 'flex',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  leftColumn: {
    flex: '0 0 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  magHeader: {
    background: 'linear-gradient(135deg, #2d3436 0%, #1a1a2e 100%)',
    borderRadius: '8px',
    padding: '12px 16px',
    border: '1px solid #4a4a6a',
  },
  magNameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  magName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6bf',
  },
  tierBadge: {
    background: '#4a4a6a',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#aaa',
  },
  magMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
  },
  levelText: {
    color: '#fff',
  },
  pbText: {
    color: '#f6b',
  },
  gaugesSection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    color: '#6b8afd',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  gaugeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  gaugeLabel: {
    width: '80px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  gaugeLevelText: {
    color: '#888',
    fontWeight: 'normal',
  },
  gaugeBarOuter: {
    flex: 1,
    height: '10px',
    background: '#0a0a1a',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  gaugeBarFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.2s ease',
  },
  gaugeValueText: {
    fontSize: '10px',
    color: '#666',
    width: '36px',
    textAlign: 'right',
  },
  historySection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
    flex: 1,
  },
  noHistory: {
    color: '#555',
    fontSize: '12px',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '12px',
  },
  evolutionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  evolutionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    background: '#1a1a2e',
    borderRadius: '4px',
    fontSize: '12px',
  },
  evoLevel: {
    color: '#888',
    minWidth: '40px',
  },
  evoForm: {
    color: '#6bf',
    fontWeight: 'bold',
    flex: 1,
  },
  evoPB: {
    color: '#f6b',
    fontSize: '10px',
    background: '#5a2d5a',
    padding: '1px 6px',
    borderRadius: '8px',
  },
  feedSection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
  },
  categoryRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '10px',
  },
  categoryBtn: {
    flex: 1,
    padding: '8px 4px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.2s',
  },
  rarityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
  },
  rarityLabel: {
    fontSize: '11px',
    color: '#888',
    marginRight: '4px',
  },
  rarityBtn: {
    padding: '6px 10px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '11px',
  },
  rarityBtnActive: {
    background: '#4a4a6a',
    color: '#fff',
    borderColor: '#6b8afd',
  },
  effectPreview: {
    display: 'flex',
    gap: '10px',
    padding: '8px',
    background: '#1a1a2e',
    borderRadius: '4px',
    marginBottom: '10px',
    justifyContent: 'center',
  },
  effectText: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  feedBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #6b8afd 0%, #4a6cf4 100%)',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  consumableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  consumableBtn: {
    padding: '8px 4px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '10px',
    transition: 'all 0.2s',
  },
  feedHistorySection: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
    flex: 1,
  },
  feedHistoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '150px',
    overflow: 'auto',
  },
  feedHistoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    background: '#1a1a2e',
    borderRadius: '4px',
    fontSize: '11px',
  },
  feedItemName: {
    color: '#aaa',
    flex: 1,
  },
  feedEffects: {
    display: 'flex',
    gap: '4px',
  },
  effectMini: {
    fontSize: '10px',
    fontWeight: 'bold',
  },
  levelUpBadge: {
    background: '#2d5a2d',
    color: '#6f6',
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 'bold',
  },
  resetBtn: {
    width: '100%',
    padding: '10px',
    background: '#c44',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
  },
};
