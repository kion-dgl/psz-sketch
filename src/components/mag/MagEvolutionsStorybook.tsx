import { useState, useMemo } from 'react';
import { determineForm, getLevel, MagStats } from '../../lib/mag-evolution';

type EvolutionRecord = {
  level: number;
  form: string;
  photonBlast: string | null;
  stats: MagStats;
};

export default function MagEvolutionsStorybook() {
  const [stats, setStats] = useState<MagStats>({ power: 0, guard: 0, hit: 0, mind: 0 });
  const [history, setHistory] = useState<EvolutionRecord[]>([]);

  const level = useMemo(() => getLevel(stats), [stats]);
  const currentForm = useMemo(() => determineForm(stats), [stats]);

  const addLevels = (stat: keyof MagStats, levels: number) => {
    const oldForm = determineForm(stats);

    setStats(prev => {
      const newStats = {
        ...prev,
        [stat]: Math.max(0, prev[stat] + (levels * 5)), // 5 points per level
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

  const setStatLevel = (stat: keyof MagStats, targetLevel: number) => {
    const oldForm = determineForm(stats);

    setStats(prev => {
      const newStats = {
        ...prev,
        [stat]: Math.max(0, targetLevel * 5),
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

  // Quick evolution path presets
  const presets = [
    { label: 'Yul Path (Power)', stats: { power: 50, guard: 0, hit: 0, mind: 0 } },
    { label: 'Aio Path (Guard)', stats: { power: 0, guard: 50, hit: 0, mind: 0 } },
    { label: 'Yth Path (Hit)', stats: { power: 0, guard: 0, hit: 50, mind: 0 } },
    { label: 'Ingh Path (Mind)', stats: { power: 0, guard: 0, hit: 0, mind: 50 } },
    { label: 'Thohn (Pure Power Lv30)', stats: { power: 150, guard: 0, hit: 0, mind: 0 } },
    { label: 'Urado (P>G Lv60)', stats: { power: 200, guard: 80, hit: 20, mind: 0 } },
    { label: 'Tyrna (G>P Lv60)', stats: { power: 80, guard: 200, hit: 20, mind: 0 } },
    { label: 'Sig (M>H Lv60)', stats: { power: 0, guard: 20, hit: 80, mind: 200 } },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mag Evolutions</h1>
      <p style={styles.subtitle}>Test evolution paths by adding levels to stats directly</p>

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

      {/* Stats with Level Controls */}
      <div style={styles.statsSection}>
        <h3 style={styles.sectionTitle}>Stat Levels</h3>
        <div style={styles.statsGrid}>
          {(['power', 'guard', 'hit', 'mind'] as const).map(stat => {
            const statLevel = Math.floor(stats[stat] / 5);
            return (
              <div key={stat} style={styles.statBox}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>{stat.toUpperCase()}</span>
                  <span style={styles.statLevel}>Lv {statLevel}</span>
                </div>
                <div style={styles.statBar}>
                  <div
                    style={{
                      ...styles.statFill,
                      width: `${Math.min(100, (statLevel / 50) * 100)}%`,
                      backgroundColor: stat === 'power' ? '#e74c3c' :
                                       stat === 'guard' ? '#3498db' :
                                       stat === 'hit' ? '#2ecc71' : '#9b59b6'
                    }}
                  />
                </div>
                <div style={styles.levelButtons}>
                  <button style={styles.lvlBtn} onClick={() => addLevels(stat, -10)}>-10</button>
                  <button style={styles.lvlBtn} onClick={() => addLevels(stat, -1)}>-1</button>
                  <button style={styles.lvlBtn} onClick={() => addLevels(stat, 1)}>+1</button>
                  <button style={styles.lvlBtn} onClick={() => addLevels(stat, 10)}>+10</button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={statLevel}
                  onChange={(e) => setStatLevel(stat, Number(e.target.value))}
                  style={styles.levelInput}
                  placeholder="Set level"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Presets */}
      <div style={styles.presetsSection}>
        <h3 style={styles.sectionTitle}>Quick Evolution Paths</h3>
        <div style={styles.presetsGrid}>
          {presets.map(preset => (
            <button
              key={preset.label}
              style={styles.presetBtn}
              onClick={() => { setStats(preset.stats); setHistory([]); }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evolution History */}
      <div style={styles.historySection}>
        <h3 style={styles.sectionTitle}>Evolution History</h3>
        {history.length === 0 ? (
          <div style={styles.noHistory}>Add levels to see evolutions and photon blast acquisitions</div>
        ) : (
          <div style={styles.historyList}>
            {history.map((record, i) => (
              <div key={i} style={styles.historyItem}>
                <span style={styles.historyLevel}>Lv {record.level}</span>
                <span style={styles.historyArrow}>→</span>
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
  statsSection: {
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  statBox: {
    background: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
  },
  statHeader: {
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
  statBar: {
    height: '8px',
    background: '#0a0a1a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  statFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.2s',
  },
  levelButtons: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
  },
  lvlBtn: {
    flex: 1,
    padding: '6px',
    fontSize: '12px',
    background: '#2d2d44',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
  },
  levelInput: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#2d2d44',
    color: '#fff',
    fontSize: '12px',
    boxSizing: 'border-box',
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
    padding: '8px 12px',
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
