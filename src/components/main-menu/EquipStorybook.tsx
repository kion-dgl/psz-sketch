import { useState, useEffect } from 'react';
import EquipMenu from './EquipMenu';
import EquipMenuWeb from './EquipMenuWeb';
import type { InventoryItem, PlayerState, CharacterClass } from './inventory-types';

type ViewMode = 'game' | 'web';

interface PlayerPreset {
  name: string;
  state: PlayerState;
}

const PLAYER_PRESETS: PlayerPreset[] = [
  {
    name: 'HUmar Lv 15',
    state: {
      level: 15,
      characterClass: 'HUmar' as CharacterClass,
      currentHP: 180,
      maxHP: 200,
      currentPP: 40,
      maxPP: 50,
    },
  },
  {
    name: 'RAmarl Lv 30',
    state: {
      level: 30,
      characterClass: 'RAmarl' as CharacterClass,
      currentHP: 280,
      maxHP: 320,
      currentPP: 80,
      maxPP: 100,
    },
  },
  {
    name: 'FOnewearl Lv 50',
    state: {
      level: 50,
      characterClass: 'FOnewearl' as CharacterClass,
      currentHP: 200,
      maxHP: 250,
      currentPP: 180,
      maxPP: 200,
    },
  },
];

export default function EquipStorybook() {
  const [viewMode, setViewMode] = useState<ViewMode>('web');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const playerState = PLAYER_PRESETS[selectedPreset].state;

  useEffect(() => {
    fetch('/data/player-inventory.json')
      .then(res => res.json())
      .then(data => {
        // Mark some items as equipped for demo
        const items = data.items.map((item: InventoryItem, idx: number) => ({
          ...item,
          isEquipped: item.id === 'inv_012' || item.id === 'inv_019', // Buster + Giga Frame
          isUnit: item.itemId?.includes('resist') || item.itemId?.includes('knight') || item.itemId?.includes('general'),
        }));
        setInventory(items);
      })
      .catch(console.error);
  }, []);

  const handleBack = () => {
    logAction('Back button clicked');
  };

  const handleEquip = (slot: string, item: InventoryItem | null) => {
    logAction(`Equip ${slot}: ${item?.name || 'Unequipped'}`);
  };

  const logAction = (action: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action}`, ...prev.slice(0, 9)]);
  };

  return (
    <div style={styles.container}>
      {/* Mode Toggle */}
      <div style={styles.modeToggle}>
        <button
          onClick={() => setViewMode('game')}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'game' ? styles.modeButtonActive : {}),
          }}
        >
          <span style={styles.modeIcon}>🎮</span>
          <span>Game Style</span>
          <span style={styles.modeDesc}>Controller-friendly</span>
        </button>
        <button
          onClick={() => setViewMode('web')}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'web' ? styles.modeButtonActive : {}),
          }}
        >
          <span style={styles.modeIcon}>🖱</span>
          <span>Web Style</span>
          <span style={styles.modeDesc}>Mouse-friendly</span>
        </button>
      </div>

      {/* Controls */}
      <div style={styles.controlSection}>
        <div style={styles.sectionTitle}>Player Preset</div>
        <div style={styles.presetButtons}>
          {PLAYER_PRESETS.map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(idx)}
              style={{
                ...styles.presetButton,
                ...(selectedPreset === idx ? styles.presetButtonActive : {}),
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div style={styles.statsRow}>
          <span style={styles.stat}>Class: {playerState.characterClass}</span>
          <span style={styles.stat}>Level: {playerState.level}</span>
          <span style={styles.stat}>HP: {playerState.currentHP}/{playerState.maxHP}</span>
          <span style={styles.stat}>PP: {playerState.currentPP}/{playerState.maxPP}</span>
        </div>
      </div>

      {/* Menu Display */}
      <div style={styles.menuContainer}>
        {viewMode === 'game' ? (
          <EquipMenu onBack={handleBack} />
        ) : (
          <EquipMenuWeb
            inventory={inventory}
            playerState={playerState}
            onEquip={handleEquip}
          />
        )}
      </div>

      {/* Action Log */}
      <div style={styles.actionLog}>
        <div style={styles.logTitle}>Action Log</div>
        <div style={styles.logContent}>
          {actionLog.length === 0 ? (
            <span style={styles.logEmpty}>Interact with the menu to see actions...</span>
          ) : (
            actionLog.map((log, idx) => (
              <div key={idx} style={styles.logEntry}>{log}</div>
            ))
          )}
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
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#3a3a5a',
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
    maxWidth: '550px',
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
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#4a4a6a',
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
    color: '#aaa',
  },
  menuContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  actionLog: {
    maxWidth: '550px',
    margin: '20px auto 0',
    background: '#252538',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  logTitle: {
    padding: '10px 16px',
    background: '#2d2d44',
    fontSize: '12px',
    color: '#6b8afd',
    borderBottom: '1px solid #3a3a4e',
  },
  logContent: {
    padding: '12px 16px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  logEmpty: {
    color: '#555',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  logEntry: {
    fontSize: '11px',
    color: '#888',
    padding: '4px 0',
    borderBottom: '1px solid #2a2a3a',
  },
};
