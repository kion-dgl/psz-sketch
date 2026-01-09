import { useState } from 'react';
import Tooltip, { type TooltipData } from './Tooltip';

type EnemyAttribute = 'Native' | 'A.Beast' | 'Machine' | 'Dark' | 'Unknown';

const SAMPLE_ENEMIES: Array<{ name: string; attribute: EnemyAttribute }> = [
  { name: 'Porel', attribute: 'Native' },
  { name: 'Booma', attribute: 'Native' },
  { name: 'Gobooma', attribute: 'Native' },
  { name: 'Hildebear', attribute: 'Native' },
  { name: 'Barbarous Wolf', attribute: 'A.Beast' },
  { name: 'Savage Wolf', attribute: 'A.Beast' },
  { name: 'Sinow Beat', attribute: 'Machine' },
  { name: 'Gillchic', attribute: 'Machine' },
  { name: 'Dark Belra', attribute: 'Dark' },
  { name: 'Delsaber', attribute: 'Dark' },
];

const SAMPLE_ITEMS: Array<{ name: string; rarity: number }> = [
  { name: 'Monomate', rarity: 1 },
  { name: 'Dimate', rarity: 2 },
  { name: 'Trimate', rarity: 3 },
  { name: 'Monofluid', rarity: 1 },
  { name: 'Difluid', rarity: 2 },
  { name: 'Trifluid', rarity: 3 },
  { name: 'Saber', rarity: 1 },
  { name: 'Brand', rarity: 2 },
  { name: 'Buster', rarity: 3 },
  { name: 'Pallasch', rarity: 4 },
  { name: 'Gladius', rarity: 5 },
  { name: 'DB\'s Saber', rarity: 9 },
  { name: 'Lavis Cannon', rarity: 10 },
];

const ATTRIBUTES: EnemyAttribute[] = ['Native', 'A.Beast', 'Machine', 'Dark', 'Unknown'];

export default function TooltipStorybook() {
  const [tooltipType, setTooltipType] = useState<'enemy' | 'item'>('enemy');
  const [enemyName, setEnemyName] = useState('Porel');
  const [enemyAttribute, setEnemyAttribute] = useState<EnemyAttribute>('Native');
  const [itemName, setItemName] = useState('Monomate');
  const [itemRarity, setItemRarity] = useState(1);

  const tooltipData: TooltipData = tooltipType === 'enemy'
    ? { type: 'enemy', name: enemyName, attribute: enemyAttribute }
    : { type: 'item', name: itemName, rarity: itemRarity };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tooltip</h1>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <Tooltip data={tooltipData} />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Type Toggle */}
        <div style={styles.controlGroup}>
          <label style={styles.label}>Tooltip Type</label>
          <div style={styles.toggleRow}>
            <button
              style={{
                ...styles.toggleButton,
                ...(tooltipType === 'enemy' ? styles.toggleActive : {}),
              }}
              onClick={() => setTooltipType('enemy')}
            >
              Enemy
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(tooltipType === 'item' ? styles.toggleActive : {}),
              }}
              onClick={() => setTooltipType('item')}
            >
              Item
            </button>
          </div>
        </div>

        {tooltipType === 'enemy' ? (
          <>
            {/* Enemy Controls */}
            <h3 style={styles.sectionTitle}>Enemy Settings</h3>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={enemyName}
                onChange={(e) => setEnemyName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Attribute</label>
              <select
                value={enemyAttribute}
                onChange={(e) => setEnemyAttribute(e.target.value as EnemyAttribute)}
                style={styles.select}
              >
                {ATTRIBUTES.map((attr) => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>

            {/* Sample Enemies */}
            <h3 style={styles.sectionTitle}>Sample Enemies</h3>
            <div style={styles.samplesGrid}>
              {SAMPLE_ENEMIES.map((enemy) => (
                <button
                  key={enemy.name}
                  style={styles.sampleButton}
                  onClick={() => {
                    setEnemyName(enemy.name);
                    setEnemyAttribute(enemy.attribute);
                  }}
                >
                  {enemy.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Item Controls */}
            <h3 style={styles.sectionTitle}>Item Settings</h3>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Rarity ({itemRarity} star{itemRarity !== 1 ? 's' : ''})</label>
              <input
                type="range"
                min={1}
                max={10}
                value={itemRarity}
                onChange={(e) => setItemRarity(Number(e.target.value))}
                style={styles.slider}
              />
              <div style={styles.starPreview}>
                {Array.from({ length: itemRarity }, (_, i) => (
                  <span key={i} style={{ color: '#ffd700' }}>★</span>
                ))}
              </div>
            </div>

            {/* Sample Items */}
            <h3 style={styles.sectionTitle}>Sample Items</h3>
            <div style={styles.samplesGrid}>
              {SAMPLE_ITEMS.map((item) => (
                <button
                  key={item.name}
                  style={styles.sampleButton}
                  onClick={() => {
                    setItemName(item.name);
                    setItemRarity(item.rarity);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </>
        )}
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
    padding: '60px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  controls: {
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: '#888',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
  },
  slider: {
    width: '100%',
  },
  starPreview: {
    fontSize: '14px',
    marginTop: '4px',
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    flex: 1,
    padding: '10px',
    background: '#3a3a5a',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.15s ease',
  },
  toggleActive: {
    background: '#6b8afd',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '16px 0 8px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  samplesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sampleButton: {
    padding: '6px 12px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s ease',
  },
};
