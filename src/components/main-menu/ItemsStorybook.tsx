import { useState } from 'react';
import ItemsMenu, { InventoryItem } from './ItemsMenu';

// Preset inventories for different scenarios
const PRESETS: { name: string; description: string; items: InventoryItem[] }[] = [
  {
    name: 'New Player',
    description: 'Starting inventory with basic supplies',
    items: [
      { id: 'i1', name: 'Monomate', japaneseName: 'モノメイト', category: 'usable', quantity: 5, description: 'Restores a small amount of HP.', rarity: 1 },
      { id: 'i2', name: 'Monofluid', japaneseName: 'モノフルイド', category: 'usable', quantity: 3, description: 'Restores a small amount of PP.', rarity: 1 },
      { id: 'i3', name: 'Telepipe', japaneseName: 'テレパイプ', category: 'usable', quantity: 2, description: 'Creates a warp back to the city.', rarity: 2 },
      { id: 'i4', name: 'Saber', japaneseName: 'セイバー', category: 'weapon', quantity: 1, description: 'A standard one-handed sword.', rarity: 1, weaponType: 'Saber', atp: 45, ata: 30, level: 1 },
      { id: 'i5', name: 'Frame', japaneseName: 'フレーム', category: 'armor', quantity: 1, description: 'Basic body armor.', rarity: 1, dfp: 10, evp: 5, level: 1, slots: 0 },
    ],
  },
  {
    name: 'Mid-Game Hunter',
    description: 'Balanced inventory for level 30-50 hunter',
    items: [
      // Usables
      { id: 'i1', name: 'Monomate', japaneseName: 'モノメイト', category: 'usable', quantity: 10, description: 'Restores a small amount of HP.', rarity: 1 },
      { id: 'i2', name: 'Dimate', japaneseName: 'ディメイト', category: 'usable', quantity: 10, description: 'Restores a moderate amount of HP.', rarity: 2 },
      { id: 'i3', name: 'Trimate', japaneseName: 'トリメイト', category: 'usable', quantity: 5, description: 'Restores a large amount of HP.', rarity: 3 },
      { id: 'i4', name: 'Monofluid', japaneseName: 'モノフルイド', category: 'usable', quantity: 10, description: 'Restores a small amount of PP.', rarity: 1 },
      { id: 'i5', name: 'Difluid', japaneseName: 'ディフルイド', category: 'usable', quantity: 5, description: 'Restores a moderate amount of PP.', rarity: 2 },
      { id: 'i6', name: 'Sol Atomizer', japaneseName: 'ソルアトマイザー', category: 'usable', quantity: 3, description: 'Revives and restores HP to all nearby allies.', rarity: 4 },
      { id: 'i7', name: 'Moon Atomizer', japaneseName: 'ムーンアトマイザー', category: 'usable', quantity: 5, description: 'Revives a fallen ally.', rarity: 3 },
      { id: 'i8', name: 'Telepipe', japaneseName: 'テレパイプ', category: 'usable', quantity: 10, description: 'Creates a warp back to the city.', rarity: 2 },
      { id: 'i9', name: 'Scape Doll', japaneseName: 'スケープドール', category: 'usable', quantity: 2, description: 'Automatically revives you when HP reaches 0.', rarity: 5 },
      // Weapons
      { id: 'w1', name: 'Buster', japaneseName: 'バスター', category: 'weapon', quantity: 1, description: 'A reliable saber for mid-level hunters.', rarity: 3, weaponType: 'Saber', atp: 120, ata: 40, level: 12 },
      { id: 'w2', name: 'Pallasch', japaneseName: 'パラッシュ', category: 'weapon', quantity: 1, description: 'A high-quality saber.', rarity: 4, weaponType: 'Saber', atp: 180, ata: 45, level: 22 },
      { id: 'w3', name: 'Vulcan', japaneseName: 'バルカン', category: 'weapon', quantity: 1, description: 'A rapid-fire mechgun.', rarity: 4, weaponType: 'Mechgun', atp: 85, ata: 55, level: 25 },
      { id: 'w4', name: 'Blade', japaneseName: 'ブレイド', category: 'weapon', quantity: 1, description: 'A large two-handed sword.', rarity: 3, weaponType: 'Sword', atp: 200, ata: 35, level: 18 },
      // Armor
      { id: 'a1', name: 'Solid Frame', japaneseName: 'ソリッドフレーム', category: 'armor', quantity: 1, description: 'Reinforced frame armor.', rarity: 3, dfp: 50, evp: 25, level: 15, slots: 2 },
      { id: 'a2', name: 'Absorb Armor', japaneseName: 'アブソーブアーマー', category: 'armor', quantity: 1, description: 'Armor that absorbs damage.', rarity: 4, dfp: 75, evp: 35, level: 28, slots: 3 },
      // Special
      { id: 's1', name: 'Power Material', japaneseName: 'パワーマテリアル', category: 'special', quantity: 5, description: 'Permanently increases ATP by 2.', rarity: 3 },
      { id: 's2', name: 'Mind Material', japaneseName: 'マインドマテリアル', category: 'special', quantity: 3, description: 'Permanently increases MST by 2.', rarity: 3 },
      { id: 's3', name: 'Monogrinder', japaneseName: 'モノグラインダー', category: 'special', quantity: 10, description: 'Adds +1 to weapon grind.', rarity: 2 },
      { id: 's4', name: 'Digrinder', japaneseName: 'ディグラインダー', category: 'special', quantity: 5, description: 'Adds +2 to weapon grind.', rarity: 3 },
      { id: 's5', name: 'Knight/Power', japaneseName: 'ナイト/パワー', category: 'special', quantity: 1, description: 'Unit: Increases ATP.', rarity: 4 },
    ],
  },
  {
    name: 'End-Game Force',
    description: 'Maxed out Force with rare items',
    items: [
      // Usables
      { id: 'i1', name: 'Trimate', japaneseName: 'トリメイト', category: 'usable', quantity: 10, description: 'Restores a large amount of HP.', rarity: 3 },
      { id: 'i2', name: 'Trifluid', japaneseName: 'トリフルイド', category: 'usable', quantity: 10, description: 'Restores a large amount of PP.', rarity: 3 },
      { id: 'i3', name: 'Star Atomizer', japaneseName: 'スターアトマイザー', category: 'usable', quantity: 5, description: 'Fully restores HP/PP for all allies.', rarity: 5 },
      { id: 'i4', name: 'Scape Doll', japaneseName: 'スケープドール', category: 'usable', quantity: 5, description: 'Automatically revives you when HP reaches 0.', rarity: 5 },
      { id: 'i5', name: 'Telepipe', japaneseName: 'テレパイプ', category: 'usable', quantity: 10, description: 'Creates a warp back to the city.', rarity: 2 },
      // Weapons
      { id: 'w1', name: 'Psycho Wand', japaneseName: 'サイコワンド', category: 'weapon', quantity: 1, description: 'A powerful wand that boosts MST.', rarity: 7, weaponType: 'Wand', atp: 50, ata: 40, mst: 35, level: 80 },
      { id: 'w2', name: 'Magical Piece', japaneseName: 'マジカルピース', category: 'weapon', quantity: 1, description: 'Rare rod with high MST boost.', rarity: 8, weaponType: 'Rod', atp: 35, ata: 35, mst: 50, level: 100 },
      { id: 'w3', name: 'Summit Moon', japaneseName: 'サミットムーン', category: 'weapon', quantity: 1, description: 'Legendary cane of immense power.', rarity: 9, weaponType: 'Cane', atp: 25, ata: 30, mst: 65, level: 120 },
      { id: 'w4', name: 'Slicer of Fanatic', japaneseName: 'スライサーオブファナティック', category: 'weapon', quantity: 1, description: 'Throwing blade for ranged attacks.', rarity: 6, weaponType: 'Slicer', atp: 150, ata: 60, level: 70 },
      // Armor
      { id: 'a1', name: 'Crimson Coat', japaneseName: 'クリムゾンコート', category: 'armor', quantity: 1, description: 'Rare armor with high magic defense.', rarity: 8, dfp: 120, evp: 80, level: 100, slots: 4 },
      { id: 'a2', name: 'Sacred Cloth', japaneseName: 'セイクリッドクロス', category: 'armor', quantity: 1, description: 'Holy armor blessed with protection.', rarity: 9, dfp: 150, evp: 100, level: 120, slots: 4 },
      // Special
      { id: 's1', name: 'HP Material', japaneseName: 'HPマテリアル', category: 'special', quantity: 10, description: 'Permanently increases max HP by 2.', rarity: 3 },
      { id: 's2', name: 'TP Material', japaneseName: 'TPマテリアル', category: 'special', quantity: 10, description: 'Permanently increases max PP by 2.', rarity: 3 },
      { id: 's3', name: 'Mind Material', japaneseName: 'マインドマテリアル', category: 'special', quantity: 10, description: 'Permanently increases MST by 2.', rarity: 3 },
      { id: 's4', name: 'Trigrinder', japaneseName: 'トリグラインダー', category: 'special', quantity: 10, description: 'Adds +3 to weapon grind.', rarity: 4 },
      { id: 's5', name: 'Heavenly/Ability', japaneseName: 'ヘブンリー/アビリティ', category: 'special', quantity: 1, description: 'Unit: Greatly boosts all stats.', rarity: 9 },
      { id: 's6', name: 'Centurion/Ability', japaneseName: 'センチュリオン/アビリティ', category: 'special', quantity: 1, description: 'Unit: Maximum stat boost.', rarity: 10 },
      { id: 's7', name: 'V801', japaneseName: 'V801', category: 'special', quantity: 1, description: 'Unit: Combines 3 projectile attacks.', rarity: 9 },
    ],
  },
  {
    name: 'Empty',
    description: 'No items in inventory',
    items: [],
  },
];

export default function ItemsStorybook() {
  const [selectedPreset, setSelectedPreset] = useState(0);

  const preset = PRESETS[selectedPreset];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Items Menu</h1>
      <p style={styles.subtitle}>Player inventory with category tabs and item details</p>

      {/* Preset Selector */}
      <div style={styles.presetSection}>
        <h3 style={styles.sectionTitle}>Inventory Presets</h3>
        <div style={styles.presetButtons}>
          {PRESETS.map((p, index) => (
            <button
              key={p.name}
              onClick={() => setSelectedPreset(index)}
              style={{
                ...styles.presetButton,
                ...(selectedPreset === index ? styles.presetButtonActive : {}),
              }}
            >
              <span style={styles.presetName}>{p.name}</span>
              <span style={styles.presetDesc}>{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.previewBg}>
          <ItemsMenu
            inventory={preset.items}
            maxItems={40}
            showBackButton={false}
          />
        </div>
      </div>

      {/* Info */}
      <div style={styles.info}>
        <h3 style={styles.infoTitle}>Inventory Structure</h3>
        <div style={styles.infoContent}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Items:</span>
            <span style={styles.infoValue}>{preset.items.length} / 40</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Usable:</span>
            <span style={styles.infoValue}>{preset.items.filter(i => i.category === 'usable').length}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Weapons:</span>
            <span style={styles.infoValue}>{preset.items.filter(i => i.category === 'weapon').length}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Armor:</span>
            <span style={styles.infoValue}>{preset.items.filter(i => i.category === 'armor').length}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Special:</span>
            <span style={styles.infoValue}>{preset.items.filter(i => i.category === 'special').length}</span>
          </div>
        </div>

        <h3 style={styles.infoTitle}>JSON Structure</h3>
        <pre style={styles.jsonPreview}>
{`{
  "version": 1,
  "maxItems": 40,
  "items": [
    {
      "id": "inv_001",
      "itemId": "monomate",
      "name": "Monomate",
      "japaneseName": "モノメイト",
      "category": "usable",
      "quantity": 10,
      "description": "Restores HP",
      "rarity": 1
    }
  ]
}`}
        </pre>
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
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '20px',
  },
  presetSection: {
    maxWidth: '600px',
    margin: '0 auto 20px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    marginBottom: '12px',
  },
  presetButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  presetButton: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '12px',
    background: '#2d2d44',
    border: '2px solid #3a3a5a',
    borderRadius: '8px',
    color: '#aaa',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  presetButtonActive: {
    background: '#3a4a6a',
    borderColor: '#6b8afd',
    color: '#fff',
  },
  presetName: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  presetDesc: {
    fontSize: '11px',
    color: '#888',
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
  info: {
    maxWidth: '600px',
    margin: '0 auto',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  infoTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '0 0 12px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  infoContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 10px',
    background: '#252538',
    borderRadius: '4px',
  },
  infoLabel: {
    color: '#888',
    fontSize: '12px',
  },
  infoValue: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  jsonPreview: {
    background: '#1a1a2a',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#8a8',
    overflow: 'auto',
    maxHeight: '200px',
    margin: 0,
  },
};
