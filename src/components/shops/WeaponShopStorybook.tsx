import { useState, useEffect } from 'react';
import WeaponShop from './WeaponShop';

interface ShopWeapon {
  id: string;
  name: string;
  type: string;
  atp: number;
  ata: number;
  rarity: number;
  price: number;
  grind: number;
  element: string | null;
  elementPercent: number;
  mst?: number;
}

interface WeaponShopPreset {
  name: string;
  weapons: ShopWeapon[];
}

interface ShopPresets {
  weaponShop: {
    presets: WeaponShopPreset[];
  };
}

export default function WeaponShopStorybook() {
  const [shopPresets, setShopPresets] = useState<ShopPresets | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [playerMeseta, setPlayerMeseta] = useState(50000);
  const [actionLog, setActionLog] = useState<string[]>([]);

  useEffect(() => {
    fetch('/data/shop-presets.json')
      .then(res => res.json())
      .then(data => setShopPresets(data))
      .catch(console.error);
  }, []);

  const logAction = (action: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action}`, ...prev.slice(0, 9)]);
  };

  const handlePurchase = (weapon: ShopWeapon) => {
    if (playerMeseta >= weapon.price) {
      setPlayerMeseta(prev => prev - weapon.price);
      const suffix = weapon.grind > 0 ? ` +${weapon.grind}` : '';
      const element = weapon.element ? ` (${weapon.element} ${weapon.elementPercent}%)` : '';
      logAction(`Purchased ${weapon.name}${suffix}${element} for ${weapon.price.toLocaleString()} Meseta`);
    }
  };

  if (!shopPresets) {
    return (
      <div style={styles.loading}>
        Loading shop data...
      </div>
    );
  }

  const currentPreset = shopPresets.weaponShop.presets[presetIndex];

  return (
    <div style={styles.container}>
      {/* Controls */}
      <div style={styles.controlSection}>
        <div style={styles.controlRow}>
          <div style={styles.controlGroup}>
            <div style={styles.controlLabel}>Shop Preset</div>
            <div style={styles.presetButtons}>
              {shopPresets.weaponShop.presets.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => setPresetIndex(idx)}
                  style={{
                    ...styles.presetButton,
                    ...(presetIndex === idx ? styles.presetButtonActive : {}),
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.controlGroup}>
            <div style={styles.controlLabel}>Player Meseta</div>
            <div style={styles.mesetaControl}>
              <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(5000)}>5K</button>
              <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(25000)}>25K</button>
              <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(50000)}>50K</button>
              <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(100000)}>100K</button>
              <span style={styles.mesetaValue}>💰 {playerMeseta.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Display */}
      <div style={styles.shopContainer}>
        <WeaponShop
          weapons={currentPreset.weapons}
          playerMeseta={playerMeseta}
          onPurchase={handlePurchase}
        />
      </div>

      {/* Action Log */}
      <div style={styles.actionLog}>
        <div style={styles.logTitle}>Purchase Log</div>
        <div style={styles.logContent}>
          {actionLog.length === 0 ? (
            <span style={styles.logEmpty}>Make purchases to see them logged here...</span>
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
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#888',
    fontSize: '16px',
  },
  controlSection: {
    maxWidth: '700px',
    margin: '0 auto 20px',
    background: '#2d2d44',
    padding: '16px',
    borderRadius: '8px',
  },
  controlRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  controlGroup: {
    flex: 1,
    minWidth: '200px',
  },
  controlLabel: {
    fontSize: '12px',
    color: '#f97316',
    marginBottom: '8px',
  },
  presetButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  presetButton: {
    padding: '6px 12px',
    background: '#3a3a5a',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#4a4a6a',
    borderRadius: '6px',
    color: '#aaa',
    fontSize: '11px',
    cursor: 'pointer',
  },
  presetButtonActive: {
    background: '#4a3a2d',
    borderColor: '#f97316',
    color: '#f97316',
  },
  mesetaControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  mesetaButton: {
    padding: '6px 12px',
    background: '#3a3a5a',
    border: 'none',
    borderRadius: '4px',
    color: '#aaa',
    fontSize: '11px',
    cursor: 'pointer',
  },
  mesetaValue: {
    padding: '6px 12px',
    background: '#252538',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#fcd34d',
    fontWeight: 600,
  },
  shopContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  actionLog: {
    maxWidth: '700px',
    margin: '20px auto 0',
    background: '#252538',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  logTitle: {
    padding: '10px 16px',
    background: '#2d2d44',
    fontSize: '12px',
    color: '#f97316',
    borderBottom: '1px solid #3a3a4e',
  },
  logContent: {
    padding: '12px 16px',
    maxHeight: '120px',
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
