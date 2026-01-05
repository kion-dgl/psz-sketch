import { useState } from 'react';
import Stats from './Stats';

type CharacterType = 'Humar' | 'Hunewearl' | 'Hucast' | 'Hucaseal' |
  'Ramar' | 'Ramarl' | 'Racast' | 'Racaseal' |
  'Fomar' | 'Fomarl' | 'Fonewm' | 'Fonewearl';

const CHARACTER_TYPES: CharacterType[] = [
  'Humar', 'Hunewearl', 'Hucast', 'Hucaseal',
  'Ramar', 'Ramarl', 'Racast', 'Racaseal',
  'Fomar', 'Fomarl', 'Fonewm', 'Fonewearl',
];

// Preset characters
const PRESETS: Record<string, {
  level: number;
  characterType: CharacterType;
  expPts: number;
  toNextLv: number;
  meseta: number;
  atp: number; atpBase: number;
  dfp: number; dfpBase: number;
  ata: number; ataBase: number;
  evp: number; evpBase: number;
  mst: number; mstBase: number;
  rFire: number; rIce: number; rThunder: number; rLight: number; rDark: number;
  materialsUsed: number; materialsMax: number;
  matHP: number; matPower: number; matHit: number; matMind: number; matPP: number; matGuard: number; matSwift: number;
}> = {
  'New Humar': {
    level: 1, characterType: 'Humar', expPts: 0, toNextLv: 70, meseta: 300,
    atp: 93, atpBase: 56, dfp: 37, dfpBase: 10, ata: 203, ataBase: 110, evp: 39, evpBase: 13, mst: 33, mstBase: 33,
    rFire: 0, rIce: 0, rThunder: 0, rLight: 4, rDark: 4,
    materialsUsed: 0, materialsMax: 100, matHP: 0, matPower: 0, matHit: 0, matMind: 0, matPP: 0, matGuard: 0, matSwift: 0,
  },
  'Mid Racast': {
    level: 50, characterType: 'Racast', expPts: 125000, toNextLv: 8500, meseta: 45000,
    atp: 420, atpBase: 280, dfp: 185, dfpBase: 120, ata: 380, ataBase: 220, evp: 95, evpBase: 60, mst: 0, mstBase: 0,
    rFire: 15, rIce: 15, rThunder: 15, rLight: 10, rDark: 10,
    materialsUsed: 35, materialsMax: 100, matHP: 10, matPower: 15, matHit: 5, matMind: 0, matPP: 0, matGuard: 5, matSwift: 0,
  },
  'High Fonewearl': {
    level: 180, characterType: 'Fonewearl', expPts: 28500000, toNextLv: 350000, meseta: 999999,
    atp: 280, atpBase: 180, dfp: 220, dfpBase: 150, ata: 310, ataBase: 200, evp: 480, evpBase: 320, mst: 1850, mstBase: 1200,
    rFire: 30, rIce: 30, rThunder: 30, rLight: 25, rDark: 25,
    materialsUsed: 100, materialsMax: 100, matHP: 25, matPower: 0, matHit: 5, matMind: 45, matPP: 15, matGuard: 5, matSwift: 5,
  },
};

export default function StatsStorybook() {
  const [stats, setStats] = useState(PRESETS['New Humar']);

  const updateStat = <K extends keyof typeof stats>(key: K, value: typeof stats[K]) => {
    setStats(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Stats</h1>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <Stats {...stats} />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Presets */}
        <h3 style={styles.sectionTitle}>Presets</h3>
        <div style={styles.presetsRow}>
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              style={styles.presetButton}
              onClick={() => setStats(PRESETS[name])}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Tab 1 - Basic */}
        <h3 style={styles.sectionTitle}>Basic Info (Tab 1)</h3>
        <div style={styles.grid}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Level</label>
            <input
              type="number"
              min={1}
              max={200}
              value={stats.level}
              onChange={(e) => updateStat('level', Number(e.target.value))}
              style={styles.input}
            />
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Type</label>
            <select
              value={stats.characterType}
              onChange={(e) => updateStat('characterType', e.target.value as CharacterType)}
              style={styles.select}
            >
              {CHARACTER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Meseta</label>
            <input
              type="number"
              min={0}
              value={stats.meseta}
              onChange={(e) => updateStat('meseta', Number(e.target.value))}
              style={styles.input}
            />
          </div>
        </div>

        {/* Tab 2 - Combat Stats */}
        <h3 style={styles.sectionTitle}>Combat Stats (Tab 2)</h3>
        <div style={styles.grid}>
          {(['atp', 'dfp', 'ata', 'evp', 'mst'] as const).map((stat) => (
            <div key={stat} style={styles.controlGroup}>
              <label style={styles.label}>{stat.toUpperCase()}</label>
              <div style={styles.dualInput}>
                <input
                  type="number"
                  value={stats[stat]}
                  onChange={(e) => updateStat(stat, Number(e.target.value))}
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Total"
                />
                <input
                  type="number"
                  value={stats[`${stat}Base` as keyof typeof stats] as number}
                  onChange={(e) => updateStat(`${stat}Base` as keyof typeof stats, Number(e.target.value) as any)}
                  style={{ ...styles.input, flex: 1, background: '#252540' }}
                  placeholder="Base"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tab 3 - Resistances */}
        <h3 style={styles.sectionTitle}>Resistances (Tab 3)</h3>
        <div style={styles.grid}>
          {[
            { key: 'rFire', label: 'R-Fire' },
            { key: 'rIce', label: 'R-Ice' },
            { key: 'rThunder', label: 'R-Thunder' },
            { key: 'rLight', label: 'R-Light' },
            { key: 'rDark', label: 'R-Dark' },
          ].map(({ key, label }) => (
            <div key={key} style={styles.controlGroup}>
              <label style={styles.label}>{label}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={stats[key as keyof typeof stats] as number}
                onChange={(e) => updateStat(key as keyof typeof stats, Number(e.target.value) as any)}
                style={styles.input}
              />
            </div>
          ))}
        </div>

        {/* Tab 4 - Materials */}
        <h3 style={styles.sectionTitle}>Materials (Tab 4)</h3>
        <div style={styles.grid}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Used / Max</label>
            <div style={styles.dualInput}>
              <input
                type="number"
                min={0}
                value={stats.materialsUsed}
                onChange={(e) => updateStat('materialsUsed', Number(e.target.value))}
                style={{ ...styles.input, flex: 1 }}
              />
              <input
                type="number"
                min={0}
                value={stats.materialsMax}
                onChange={(e) => updateStat('materialsMax', Number(e.target.value))}
                style={{ ...styles.input, flex: 1, background: '#252540' }}
              />
            </div>
          </div>
          {[
            { key: 'matHP', label: 'HP' },
            { key: 'matPower', label: 'Power' },
            { key: 'matHit', label: 'Hit' },
            { key: 'matMind', label: 'Mind' },
            { key: 'matPP', label: 'PP' },
            { key: 'matGuard', label: 'Guard' },
            { key: 'matSwift', label: 'Swift' },
          ].map(({ key, label }) => (
            <div key={key} style={styles.controlGroup}>
              <label style={styles.label}>{label}</label>
              <input
                type="number"
                min={0}
                value={stats[key as keyof typeof stats] as number}
                onChange={(e) => updateStat(key as keyof typeof stats, Number(e.target.value) as any)}
                style={styles.input}
              />
            </div>
          ))}
        </div>
      </div>
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
  previewArea: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  previewBg: {
    background: 'linear-gradient(135deg, #2d3436 0%, #000000 100%)',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  controls: {
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '12px 0 8px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  presetsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  presetButton: {
    padding: '8px 16px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    color: '#888',
  },
  input: {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '12px',
  },
  dualInput: {
    display: 'flex',
    gap: '4px',
  },
};
