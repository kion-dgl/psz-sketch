import { useState } from 'react';
import ItemsMenu from './ItemsMenu';
import ItemsMenuWeb from './ItemsMenuWeb';
import type { InventoryItem, PlayerState, ItemAction } from './inventory-types';

// Sample inventory with all interaction types
const SAMPLE_INVENTORY: InventoryItem[] = [
  // Usables with different stack limits
  { id: 'u1', name: 'Monomate', japaneseName: 'モノメイト', category: 'usable', quantity: 8, maxStack: 10, consumableType: 'mate', description: 'Restores a small amount of HP.', rarity: 1 },
  { id: 'u2', name: 'Dimate', japaneseName: 'ディメイト', category: 'usable', quantity: 10, maxStack: 10, consumableType: 'mate', description: 'Restores a moderate amount of HP.', rarity: 2 },
  { id: 'u3', name: 'Trimate', japaneseName: 'トリメイト', category: 'usable', quantity: 5, maxStack: 10, consumableType: 'mate', description: 'Restores a large amount of HP.', rarity: 3 },
  { id: 'u4', name: 'Monofluid', japaneseName: 'モノフルイド', category: 'usable', quantity: 6, maxStack: 10, consumableType: 'fluid', description: 'Restores a small amount of PP.', rarity: 1 },
  { id: 'u5', name: 'Difluid', japaneseName: 'ディフルイド', category: 'usable', quantity: 4, maxStack: 10, consumableType: 'fluid', description: 'Restores a moderate amount of PP.', rarity: 2 },
  { id: 'u6', name: 'Sol Atomizer', japaneseName: 'ソルアトマイザー', category: 'usable', quantity: 3, maxStack: 10, consumableType: 'atomizer', description: 'Revives and restores HP to all nearby allies.', rarity: 4 },
  { id: 'u7', name: 'Star Atomizer', japaneseName: 'スターアトマイザー', category: 'usable', quantity: 2, maxStack: 5, consumableType: 'atomizer', description: 'Fully restores HP/PP for all allies.', rarity: 5 },
  { id: 'u8', name: 'Telepipe', japaneseName: 'テレパイプ', category: 'usable', quantity: 5, maxStack: 10, consumableType: 'telepipe', description: 'Creates a warp back to the city.', rarity: 2 },
  { id: 'u9', name: 'Scape Doll', japaneseName: 'スケープドール', category: 'usable', quantity: 1, maxStack: 1, consumableType: 'scape_doll', description: 'Automatically revives you when HP reaches 0.', rarity: 5 },

  // Weapons - sorted melee → ranged → magic, with equipped/level/class restrictions
  { id: 'w1', name: 'Saber', japaneseName: 'セイバー', category: 'weapon', quantity: 1, description: 'A standard one-handed sword.', rarity: 1, weaponType: 'Saber', weaponCategory: 'melee', atp: 45, ata: 30, requiredLevel: 1 },
  { id: 'w2', name: 'Buster', japaneseName: 'バスター', category: 'weapon', quantity: 1, description: 'A reliable saber for mid-level hunters.', rarity: 3, weaponType: 'Saber', weaponCategory: 'melee', atp: 120, ata: 40, requiredLevel: 12, isEquipped: true },
  { id: 'w3', name: 'Durandal', japaneseName: 'デュランダル', category: 'weapon', quantity: 1, description: 'A legendary blade of immense power.', rarity: 8, weaponType: 'Sword', weaponCategory: 'melee', atp: 450, ata: 55, requiredLevel: 80 },
  { id: 'w4', name: 'Handgun', japaneseName: 'ハンドガン', category: 'weapon', quantity: 1, description: 'A basic ranged weapon.', rarity: 1, weaponType: 'Handgun', weaponCategory: 'ranged', atp: 25, ata: 45, requiredLevel: 1 },
  { id: 'w5', name: 'Vulcan', japaneseName: 'バルカン', category: 'weapon', quantity: 1, description: 'A rapid-fire mechgun.', rarity: 4, weaponType: 'Mechgun', weaponCategory: 'ranged', atp: 85, ata: 55, requiredLevel: 25 },
  { id: 'w6', name: 'Cane', japaneseName: 'ケイン', category: 'weapon', quantity: 1, description: 'A basic staff for casting techniques.', rarity: 1, weaponType: 'Cane', weaponCategory: 'magic', atp: 15, ata: 25, mst: 5, requiredLevel: 1, requiredClasses: ['FOmar', 'FOmarl', 'FOnewm', 'FOnewearl'] },
  { id: 'w7', name: 'Psycho Wand', japaneseName: 'サイコワンド', category: 'weapon', quantity: 1, description: 'A powerful wand that boosts MST.', rarity: 7, weaponType: 'Wand', weaponCategory: 'magic', atp: 50, ata: 40, mst: 35, requiredLevel: 80, requiredClasses: ['FOmar', 'FOmarl', 'FOnewm', 'FOnewearl'] },

  // Armor with equipped status and level requirements
  { id: 'a1', name: 'Frame', japaneseName: 'フレーム', category: 'armor', quantity: 1, description: 'Basic body armor.', rarity: 1, dfp: 10, evp: 5, slots: 0, requiredLevel: 1 },
  { id: 'a2', name: 'Solid Frame', japaneseName: 'ソリッドフレーム', category: 'armor', quantity: 1, description: 'Reinforced frame armor.', rarity: 3, dfp: 50, evp: 25, slots: 2, requiredLevel: 15, isEquipped: true },
  { id: 'a3', name: 'Crimson Coat', japaneseName: 'クリムゾンコート', category: 'armor', quantity: 1, description: 'Rare armor with high magic defense.', rarity: 8, dfp: 120, evp: 80, slots: 4, requiredLevel: 100 },
  // Units
  { id: 'a4', name: 'Knight/Power', japaneseName: 'ナイト/パワー', category: 'armor', quantity: 1, description: 'Unit: Increases ATP.', rarity: 4, isUnit: true, requiredLevel: 1, isEquipped: true },
  { id: 'a5', name: 'General/Battle', japaneseName: 'ジェネラル/バトル', category: 'armor', quantity: 1, description: 'Unit: Balanced combat enhancement.', rarity: 5, isUnit: true, requiredLevel: 50 },
  { id: 'a6', name: 'Centurion/Ability', japaneseName: 'センチュリオン/アビリティ', category: 'armor', quantity: 1, description: 'Unit: Maximum stat boost.', rarity: 10, isUnit: true, requiredLevel: 150 },

  // Special items - materials can be used, others cannot
  { id: 's1', name: 'Power Material', japaneseName: 'パワーマテリアル', category: 'special', quantity: 3, description: 'Permanently increases ATP by 2.', rarity: 3, specialType: 'material' },
  { id: 's2', name: 'Mind Material', japaneseName: 'マインドマテリアル', category: 'special', quantity: 2, description: 'Permanently increases MST by 2.', rarity: 3, specialType: 'material' },
  { id: 's3', name: 'HP Material', japaneseName: 'HPマテリアル', category: 'special', quantity: 5, description: 'Permanently increases max HP by 2.', rarity: 3, specialType: 'material' },
  { id: 's4', name: 'Monogrinder', japaneseName: 'モノグラインダー', category: 'special', quantity: 8, description: 'Adds +1 to weapon grind.', rarity: 2, specialType: 'grinder' },
  { id: 's5', name: 'Photon Drop', japaneseName: 'フォトンドロップ', category: 'special', quantity: 12, description: 'Trade material used by Paganini.', rarity: 4, specialType: 'photon_drop' },
  { id: 's6', name: 'Hildebear\'s Head', japaneseName: 'ヒルデベアの頭', category: 'special', quantity: 1, description: 'Enemy part from Hildebear.', rarity: 3, specialType: 'enemy_part' },
];

// Player state presets
const PLAYER_PRESETS: { name: string; state: PlayerState }[] = [
  {
    name: 'New Hunter (Lv 10)',
    state: {
      level: 10,
      characterClass: 'HUmar',
      currentHP: 150,
      maxHP: 200,
      currentPP: 30,
      maxPP: 50,
    },
  },
  {
    name: 'Mid Hunter (Lv 50, Full HP)',
    state: {
      level: 50,
      characterClass: 'HUmar',
      currentHP: 1000,
      maxHP: 1000,
      currentPP: 50,
      maxPP: 100,
    },
  },
  {
    name: 'Mid Hunter (Lv 50, Damaged)',
    state: {
      level: 50,
      characterClass: 'HUmar',
      currentHP: 300,
      maxHP: 1000,
      currentPP: 20,
      maxPP: 100,
    },
  },
  {
    name: 'Force (Lv 50)',
    state: {
      level: 50,
      characterClass: 'FOnewearl',
      currentHP: 400,
      maxHP: 600,
      currentPP: 150,
      maxPP: 300,
    },
  },
  {
    name: 'End-Game (Lv 200)',
    state: {
      level: 200,
      characterClass: 'HUcast',
      currentHP: 1500,
      maxHP: 2000,
      currentPP: 0,
      maxPP: 0,
    },
  },
];

type ViewMode = 'game' | 'web';

export default function ItemsStorybook() {
  const [viewMode, setViewMode] = useState<ViewMode>('web');
  const [selectedPreset, setSelectedPreset] = useState(2);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const playerState = PLAYER_PRESETS[selectedPreset].state;

  const handleItemAction = (item: InventoryItem, action: ItemAction) => {
    const message = `${action.toUpperCase()}: ${item.name}`;
    setActionLog(prev => [message, ...prev.slice(0, 4)]);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Items Menu</h1>
      <p style={styles.subtitle}>Compare game-style vs web-style inventory interfaces</p>

      {/* View Mode Toggle */}
      <div style={styles.modeToggle}>
        <button
          onClick={() => setViewMode('game')}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'game' ? styles.modeButtonActive : {}),
          }}
        >
          <span style={styles.modeIcon}>🎮</span>
          Game Style
          <span style={styles.modeDesc}>D-pad navigation, select/back buttons</span>
        </button>
        <button
          onClick={() => setViewMode('web')}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'web' ? styles.modeButtonActive : {}),
          }}
        >
          <span style={styles.modeIcon}>🖱</span>
          Web Style
          <span style={styles.modeDesc}>Hover preview, right-click context menu</span>
        </button>
      </div>

      {/* Player State Selector */}
      <div style={styles.controlSection}>
        <h3 style={styles.sectionTitle}>Player State</h3>
        <div style={styles.presetButtons}>
          {PLAYER_PRESETS.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(index)}
              style={{
                ...styles.presetButton,
                ...(selectedPreset === index ? styles.presetButtonActive : {}),
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div style={styles.statsRow}>
          <span style={styles.stat}>Lv {playerState.level}</span>
          <span style={{
            ...styles.stat,
            color: playerState.currentHP < playerState.maxHP ? '#f88' : '#8f8',
          }}>
            HP: {playerState.currentHP}/{playerState.maxHP}
          </span>
          <span style={{
            ...styles.stat,
            color: playerState.currentPP < playerState.maxPP ? '#88f' : '#8f8',
          }}>
            PP: {playerState.currentPP}/{playerState.maxPP}
          </span>
          <span style={styles.stat}>{playerState.characterClass}</span>
        </div>
      </div>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        {viewMode === 'game' ? (
          <div style={styles.gamePreviewBg}>
            <ItemsMenu
              inventory={SAMPLE_INVENTORY}
              playerState={playerState}
              maxItems={40}
              showBackButton={false}
              onItemAction={handleItemAction}
            />
          </div>
        ) : (
          <ItemsMenuWeb
            inventory={SAMPLE_INVENTORY}
            playerState={playerState}
            maxItems={40}
            onItemAction={handleItemAction}
          />
        )}
      </div>

      {/* Action Log */}
      <div style={styles.logSection}>
        <h3 style={styles.sectionTitle}>Action Log</h3>
        <div style={styles.log}>
          {actionLog.length === 0 ? (
            <div style={styles.logEmpty}>
              {viewMode === 'game'
                ? 'Click an item, then select an action...'
                : 'Right-click an item to see the context menu...'}
            </div>
          ) : (
            actionLog.map((msg, i) => (
              <div key={i} style={styles.logEntry}>{msg}</div>
            ))
          )}
        </div>
      </div>

      {/* Comparison Info */}
      <div style={styles.info}>
        <h3 style={styles.infoTitle}>Interface Comparison</h3>
        <div style={styles.comparisonGrid}>
          <div style={styles.comparisonCard}>
            <h4 style={styles.comparisonTitle}>🎮 Game Style</h4>
            <ul style={styles.comparisonList}>
              <li>Click item to open action menu</li>
              <li>Navigate with keyboard arrows</li>
              <li>A = Select, B = Back</li>
              <li>Compact list view</li>
              <li>Details panel on right</li>
              <li>Faithful to original PSO UI</li>
            </ul>
          </div>
          <div style={styles.comparisonCard}>
            <h4 style={styles.comparisonTitle}>🖱 Web Style</h4>
            <ul style={styles.comparisonList}>
              <li>Right-click for context menu</li>
              <li>Hover to preview item details</li>
              <li>Grid layout with cards</li>
              <li>Visual badges for status</li>
              <li>Modern, discoverable UI</li>
              <li>Better for mouse/touch</li>
            </ul>
          </div>
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
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '20px',
  },
  modeToggle: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  modeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 24px',
    background: '#2d2d44',
    border: '2px solid #3a3a5a',
    borderRadius: '12px',
    color: '#888',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '180px',
  },
  modeButtonActive: {
    background: '#3a4a6a',
    borderColor: '#6b8afd',
    color: '#fff',
  },
  modeIcon: {
    fontSize: '24px',
  },
  modeDesc: {
    fontSize: '10px',
    fontWeight: 400,
    color: '#666',
  },
  controlSection: {
    maxWidth: '750px',
    margin: '0 auto 20px',
    background: '#2d2d44',
    padding: '16px',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    marginBottom: '12px',
  },
  presetButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  presetButton: {
    padding: '8px 12px',
    background: '#3a3a5a',
    border: '2px solid #4a4a6a',
    borderRadius: '6px',
    color: '#aaa',
    fontSize: '12px',
    cursor: 'pointer',
  },
  presetButtonActive: {
    background: '#4a5a7a',
    borderColor: '#6b8afd',
    color: '#fff',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  stat: {
    padding: '4px 10px',
    background: '#252538',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#8af',
  },
  previewArea: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  gamePreviewBg: {
    background: 'linear-gradient(135deg, #2d3436 0%, #000000 100%)',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  logSection: {
    maxWidth: '750px',
    margin: '0 auto 20px',
    background: '#2d2d44',
    padding: '16px',
    borderRadius: '8px',
  },
  log: {
    background: '#1a1a2a',
    padding: '12px',
    borderRadius: '4px',
    minHeight: '80px',
  },
  logEmpty: {
    color: '#666',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  logEntry: {
    color: '#8f8',
    fontSize: '12px',
    padding: '4px 0',
    borderBottom: '1px solid #333',
  },
  info: {
    maxWidth: '750px',
    margin: '0 auto',
    background: '#2d2d44',
    padding: '20px',
    borderRadius: '8px',
  },
  infoTitle: {
    fontSize: '14px',
    color: '#6b8afd',
    margin: '0 0 16px 0',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '8px',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  comparisonCard: {
    background: '#252538',
    padding: '16px',
    borderRadius: '8px',
  },
  comparisonTitle: {
    fontSize: '14px',
    color: '#fff',
    margin: '0 0 12px 0',
  },
  comparisonList: {
    margin: 0,
    padding: '0 0 0 20px',
    fontSize: '12px',
    color: '#aaa',
    lineHeight: 1.8,
  },
};
