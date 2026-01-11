import { useState, useEffect } from 'react';

interface ShopWeapon {
  id: string;
  name: string;
  type: string;
  atp: number;
  ata: number;
  rarity: number;
  price: number;
  grind: number;
  // Enemy type bonuses (percentage)
  native?: number;
  beast?: number;
  machine?: number;
  dark?: number;
  // Other attributes
  accuracyAdj?: number;
  element?: string;
  elementLevel?: number;
  mst?: number;
  photonArt?: string;
}

interface ShopArmor {
  id: string;
  name: string;
  type: string;
  dfp: number;
  evp: number;
  rarity: number;
  price: number;
  slots: number;
  resistances?: {
    fire: number;
    ice: number;
    thunder: number;
    light: number;
    dark: number;
  };
}

interface ShopUnit {
  id: string;
  name: string;
  effect: string;
  rarity: number;
  price: number;
}

interface WeaponShopPreset {
  name: string;
  weapons: ShopWeapon[];
  armor?: ShopArmor[];
  units?: ShopUnit[];
}

interface ShopPresets {
  weaponShop: {
    presets: WeaponShopPreset[];
  };
}

type ShopCategory = 'weapons' | 'armor' | 'units' | 'sell';

export default function WeaponShopStorybook() {
  const [shopPresets, setShopPresets] = useState<ShopPresets | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [playerMeseta, setPlayerMeseta] = useState(50000);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [category, setCategory] = useState<ShopCategory>('weapons');

  useEffect(() => {
    fetch('/data/shop-presets.json')
      .then(res => res.json())
      .then(data => setShopPresets(data))
      .catch(console.error);
  }, []);

  const logAction = (action: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action}`, ...prev.slice(0, 9)]);
  };

  const handlePurchase = (item: ShopWeapon | ShopArmor | ShopUnit) => {
    if (playerMeseta >= item.price) {
      setPlayerMeseta(prev => prev - item.price);
      logAction(`Purchased ${item.name} for ${item.price.toLocaleString()} Meseta`);
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
            <div style={styles.controlLabel}>Shop Preset (Player Level)</div>
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
              <span style={styles.mesetaValue}>{playerMeseta.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Display */}
      <div style={styles.shopContainer}>
        <div style={styles.shopPanel}>
          {/* Header */}
          <div style={styles.shopHeader}>
            <div style={styles.shopTitle}>
              <h2 style={styles.title}>Weapon Shop</h2>
            </div>
            <div style={styles.mesetaDisplay}>
              <span style={styles.mesetaAmount}>{playerMeseta.toLocaleString()}</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={styles.categoryTabs}>
            <button
              style={category === 'weapons' ? styles.categoryTabActive : styles.categoryTab}
              onClick={() => setCategory('weapons')}
            >
              Weapons
            </button>
            <button
              style={category === 'armor' ? styles.categoryTabActive : styles.categoryTab}
              onClick={() => setCategory('armor')}
            >
              Armor
            </button>
            <button
              style={category === 'units' ? styles.categoryTabActive : styles.categoryTab}
              onClick={() => setCategory('units')}
            >
              Units
            </button>
            <button
              style={category === 'sell' ? styles.categoryTabActive : styles.categoryTab}
              onClick={() => setCategory('sell')}
            >
              Sell
            </button>
          </div>

          {/* Content */}
          <div style={styles.shopContent}>
            {category === 'weapons' && (
              <WeaponList
                weapons={currentPreset.weapons}
                playerMeseta={playerMeseta}
                onPurchase={handlePurchase}
              />
            )}

            {category === 'armor' && (
              <ArmorList
                armor={currentPreset.armor || []}
                playerMeseta={playerMeseta}
                onPurchase={handlePurchase}
              />
            )}

            {category === 'units' && (
              <UnitList
                units={currentPreset.units || []}
                playerMeseta={playerMeseta}
                onPurchase={handlePurchase}
              />
            )}

            {category === 'sell' && (
              <div style={styles.sellPlaceholder}>
                <div style={styles.sellIcon}>💰</div>
                <div style={styles.sellText}>Sell functionality coming soon</div>
              </div>
            )}
          </div>
        </div>
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

function ArmorList({
  armor,
  playerMeseta,
  onPurchase,
}: {
  armor: ShopArmor[];
  playerMeseta: number;
  onPurchase: (item: ShopArmor) => void;
}) {
  const [selected, setSelected] = useState<ShopArmor | null>(armor[0] || null);

  useEffect(() => {
    if (armor.length > 0 && (!selected || !armor.find(a => a.id === selected.id))) {
      setSelected(armor[0]);
    }
  }, [armor]);

  if (armor.length === 0) {
    return <div style={styles.emptyList}>No armor available</div>;
  }

  const getRowStyle = (isSelected: boolean, isUnaffordable: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: isSelected ? '#3a3a2e' : '#2a2a3e',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: isSelected ? '#f97316' : 'transparent',
    opacity: isUnaffordable ? 0.5 : 1,
  });

  return (
    <div style={styles.listContainer}>
      <div style={styles.itemList}>
        {armor.map(item => {
          const isSelected = selected?.id === item.id;
          const isUnaffordable = playerMeseta < item.price;
          return (
            <div
              key={item.id}
              style={getRowStyle(isSelected, isUnaffordable)}
              onClick={() => setSelected(item)}
            >
              <div style={styles.itemInfo}>
                <span style={styles.itemName}>{item.name}</span>
                <span style={styles.itemType}>{item.type} - {item.slots} slots</span>
              </div>
              <div style={styles.itemStats}>
                <span style={styles.statBadge}>DFP {item.dfp}</span>
                <span style={styles.statBadge}>EVP {item.evp}</span>
              </div>
              <div style={styles.itemPrice}>{item.price.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div style={styles.detailPanel}>
        {selected && (
          <>
            <h3 style={styles.detailName}>{selected.name}</h3>
            <div style={styles.detailType}>{selected.type}</div>
            <div style={styles.detailRarity}>{'★'.repeat(selected.rarity)}</div>
            <div style={styles.detailStats}>
              <div>DFP: <span style={styles.statValueBlue}>{selected.dfp}</span></div>
              <div>EVP: <span style={styles.statValueBlue}>{selected.evp}</span></div>
              <div>Slots: <span style={styles.statValueBlue}>{selected.slots}</span></div>
            </div>
            {selected.resistances && (
              <div style={styles.resistances}>
                <div>Fire {selected.resistances.fire}%</div>
                <div>Ice {selected.resistances.ice}%</div>
                <div>Thunder {selected.resistances.thunder}%</div>
                <div>Light {selected.resistances.light}%</div>
                <div>Dark {selected.resistances.dark}%</div>
              </div>
            )}
            <button
              style={playerMeseta < selected.price ? styles.purchaseButtonDisabled : styles.purchaseButton}
              onClick={() => onPurchase(selected)}
              disabled={playerMeseta < selected.price}
            >
              Buy for {selected.price.toLocaleString()} Meseta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function UnitList({
  units,
  playerMeseta,
  onPurchase,
}: {
  units: ShopUnit[];
  playerMeseta: number;
  onPurchase: (item: ShopUnit) => void;
}) {
  const [selected, setSelected] = useState<ShopUnit | null>(units[0] || null);

  useEffect(() => {
    if (units.length > 0 && (!selected || !units.find(u => u.id === selected.id))) {
      setSelected(units[0]);
    }
  }, [units]);

  if (units.length === 0) {
    return <div style={styles.emptyList}>No units available</div>;
  }

  const getRowStyle = (isSelected: boolean, isUnaffordable: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: isSelected ? '#3a3a2e' : '#2a2a3e',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: isSelected ? '#f97316' : 'transparent',
    opacity: isUnaffordable ? 0.5 : 1,
  });

  return (
    <div style={styles.listContainer}>
      <div style={styles.itemList}>
        {units.map(item => {
          const isSelected = selected?.id === item.id;
          const isUnaffordable = playerMeseta < item.price;
          return (
            <div
              key={item.id}
              style={getRowStyle(isSelected, isUnaffordable)}
              onClick={() => setSelected(item)}
            >
              <div style={styles.itemInfo}>
                <span style={styles.itemName}>{item.name}</span>
                <span style={styles.itemEffect}>{item.effect}</span>
              </div>
              <div style={styles.itemRarity}>{'★'.repeat(item.rarity)}</div>
              <div style={styles.itemPrice}>{item.price.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div style={styles.detailPanel}>
        {selected && (
          <>
            <h3 style={styles.detailName}>{selected.name}</h3>
            <div style={styles.detailRarity}>{'★'.repeat(selected.rarity)}</div>
            <div style={styles.detailEffect}>{selected.effect}</div>
            <button
              style={playerMeseta < selected.price ? styles.purchaseButtonDisabled : styles.purchaseButton}
              onClick={() => onPurchase(selected)}
              disabled={playerMeseta < selected.price}
            >
              Buy for {selected.price.toLocaleString()} Meseta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const ELEMENT_COLORS: Record<string, string> = {
  'Native': '#22c55e',
  'Beast': '#eab308',
  'Machine': '#3b82f6',
  'Dark': '#a855f7',
  'Heat': '#ef4444',
  'Ice': '#38bdf8',
  'Stun': '#fbbf24',
  'Draw': '#c084fc',
  'Heart': '#f472b6',
};

const WEAPON_ICONS: Record<string, string> = {
  'Saber': '🗡️',
  'Sword': '⚔️',
  'Dagger': '🔪',
  'Shield': '🛡️',
  'Claw': '🐾',
  'Mech Gun': '🔫',
  'Handgun': '🔫',
  'Rifle': '🎯',
  'Laser Cannon': '💥',
  'Rod': '🪄',
  'Wand': '🪄',
};

function WeaponList({
  weapons,
  playerMeseta,
  onPurchase,
}: {
  weapons: ShopWeapon[];
  playerMeseta: number;
  onPurchase: (item: ShopWeapon) => void;
}) {
  const [selected, setSelected] = useState<ShopWeapon | null>(weapons[0] || null);

  // Update selection when weapons change
  useEffect(() => {
    if (weapons.length > 0 && (!selected || !weapons.find(w => w.id === selected.id))) {
      setSelected(weapons[0]);
    }
  }, [weapons]);

  if (weapons.length === 0) {
    return <div style={styles.emptyList}>No weapons available</div>;
  }

  const getIcon = (type: string) => WEAPON_ICONS[type] || '⚔️';

  const getRowStyle = (isSelected: boolean, isUnaffordable: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: isSelected ? '#3a3a2e' : '#2a2a3e',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: isSelected ? '#f97316' : 'transparent',
    opacity: isUnaffordable ? 0.5 : 1,
  });

  return (
    <div style={styles.listContainer}>
      <div style={styles.itemList}>
        {weapons.map(item => {
          const isSelected = selected?.id === item.id;
          const isUnaffordable = playerMeseta < item.price;
          return (
            <div
              key={item.id}
              style={getRowStyle(isSelected, isUnaffordable)}
              onClick={() => setSelected(item)}
            >
              <div style={styles.weaponIcon}>{getIcon(item.type)}</div>
              <div style={styles.itemInfo}>
                <span style={styles.itemName}>
                  {item.name}
                  {item.grind > 0 && <span style={styles.grindBadge}>+{item.grind}</span>}
                </span>
                <span style={styles.itemType}>{item.type}</span>
              </div>
              <div style={styles.itemStats}>
                <span style={styles.statBadge}>ATP {item.atp}</span>
                <span style={styles.statBadge}>ATA {item.ata}</span>
              </div>
              {item.element && (
                <span style={{
                  ...styles.elementBadge,
                  backgroundColor: ELEMENT_COLORS[item.element] || '#888',
                }}>
                  {item.element} {item.elementLevel ? `Lv${item.elementLevel}` : ''}
                </span>
              )}
              <div style={styles.itemPrice}>{item.price.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div style={styles.detailPanel}>
        {selected && (
          <>
            <div style={styles.weaponDetailHeader}>
              <span style={styles.weaponDetailIcon}>{getIcon(selected.type)}</span>
              <div>
                <h3 style={styles.detailName}>
                  {selected.name}
                  {selected.grind > 0 && <span style={styles.grindBadge}>+{selected.grind}</span>}
                </h3>
                <div style={styles.detailType}>{selected.type}</div>
              </div>
            </div>
            <div style={styles.detailRarity}>{'★'.repeat(selected.rarity)}</div>

            {/* Base Stats */}
            <div style={styles.detailStats}>
              <div>ATP: <span style={styles.statValueBlue}>{selected.atp}</span></div>
              <div>ATA: <span style={styles.statValueBlue}>{selected.ata}</span></div>
              {selected.mst !== undefined && <div>MST: <span style={styles.statValuePurple}>+{selected.mst}</span></div>}
            </div>

            {/* Weapon Attributes */}
            <div style={styles.attributesSection}>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Native</span>
                <span style={selected.native ? styles.attributeValueActive : styles.attributeValue}>{selected.native || 0}%</span>
              </div>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Beast</span>
                <span style={selected.beast ? styles.attributeValueActive : styles.attributeValue}>{selected.beast || 0}%</span>
              </div>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Machine</span>
                <span style={selected.machine ? styles.attributeValueActive : styles.attributeValue}>{selected.machine || 0}%</span>
              </div>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Dark</span>
                <span style={selected.dark ? styles.attributeValueActive : styles.attributeValue}>{selected.dark || 0}%</span>
              </div>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Accuracy Adj.</span>
                <span style={selected.accuracyAdj ? styles.attributeValueActive : styles.attributeValue}>{selected.accuracyAdj || 0}</span>
              </div>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Element</span>
                <span style={selected.element ? styles.attributeValueElement : styles.attributeValue}>
                  {selected.element ? `${selected.element}${selected.elementLevel ? ` Lv.${selected.elementLevel}` : ''}` : 'None'}
                </span>
              </div>
              <div style={styles.attributeRow}>
                <span style={styles.attributeLabel}>Photon Art</span>
                <span style={selected.photonArt ? styles.attributeValuePA : styles.attributeValue}>
                  {selected.photonArt || 'None'}
                </span>
              </div>
            </div>

            <button
              style={playerMeseta < selected.price ? styles.purchaseButtonDisabled : styles.purchaseButton}
              onClick={() => onPurchase(selected)}
              disabled={playerMeseta < selected.price}
            >
              Buy for {selected.price.toLocaleString()} Meseta
            </button>
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
    maxWidth: '800px',
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
  shopPanel: {
    width: '800px',
    background: '#1e1e2e',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  shopHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #4a3a2d 0%, #3a2a1e 100%)',
    borderBottom: '1px solid #5a4a3e',
  },
  shopTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  shopIcon: {
    fontSize: '24px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#f97316',
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#2a1a12',
    padding: '8px 14px',
    borderRadius: '8px',
  },
  mesetaIcon: {
    fontSize: '16px',
  },
  mesetaAmount: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fcd34d',
  },
  categoryTabs: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    background: '#252535',
    borderBottom: '1px solid #3a3a4e',
  },
  categoryTab: {
    padding: '10px 20px',
    background: '#2a2a3e',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
  },
  categoryTabActive: {
    padding: '10px 20px',
    background: '#3a3a2e',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#f97316',
    borderRadius: '8px',
    color: '#f97316',
    fontSize: '13px',
    cursor: 'pointer',
  },
  shopContent: {
    height: '450px',
  },
  listContainer: {
    display: 'flex',
    height: '100%',
  },
  sellPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    color: '#555',
  },
  sellIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  sellText: {
    fontSize: '14px',
  },
  itemList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#2a2a3e',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  itemRowSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#3a3a2e',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#f97316',
  },
  itemRowUnaffordable: {
    opacity: 0.5,
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#e0e0e0',
  },
  itemType: {
    fontSize: '11px',
    color: '#888',
  },
  itemEffect: {
    fontSize: '11px',
    color: '#6b8afd',
  },
  itemStats: {
    display: 'flex',
    gap: '8px',
  },
  statBadge: {
    padding: '4px 8px',
    background: '#3a3a5a',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#aaa',
  },
  itemRarity: {
    fontSize: '12px',
    color: '#fcd34d',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f97316',
  },
  detailPanel: {
    width: '240px',
    padding: '16px',
    background: '#252535',
    borderLeft: '1px solid #3a3a4e',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
  },
  detailName: {
    margin: 0,
    fontSize: '18px',
    color: '#e0e0e0',
  },
  detailType: {
    fontSize: '12px',
    color: '#888',
  },
  detailRarity: {
    fontSize: '14px',
    color: '#fcd34d',
  },
  detailStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '13px',
    color: '#6b8afd',
  },
  detailEffect: {
    fontSize: '16px',
    color: '#6b8afd',
    padding: '12px',
    background: '#2a2a3e',
    borderRadius: '8px',
    textAlign: 'center',
  },
  resistances: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    fontSize: '11px',
    color: '#aaa',
  },
  purchaseButton: {
    marginTop: 'auto',
    padding: '12px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  purchaseButtonDisabled: {
    marginTop: 'auto',
    padding: '12px',
    background: '#3a3a4e',
    border: 'none',
    borderRadius: '8px',
    color: '#666',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'not-allowed',
    flexShrink: 0,
  },
  emptyList: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#555',
    fontSize: '14px',
  },
  actionLog: {
    maxWidth: '800px',
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
  weaponIcon: {
    fontSize: '20px',
    width: '32px',
    textAlign: 'center',
  },
  grindBadge: {
    color: '#22c55e',
    marginLeft: '4px',
    fontSize: '12px',
  },
  elementBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#fff',
    fontWeight: 600,
  },
  weaponDetailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  weaponDetailIcon: {
    fontSize: '28px',
  },
  elementDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#2a2a3e',
    borderRadius: '6px',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    fontSize: '13px',
  },
  statValueBlue: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  statValuePurple: {
    color: '#a855f7',
    fontWeight: 600,
  },
  photonArt: {
    padding: '8px 12px',
    background: '#3a2a4e',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#c084fc',
    textAlign: 'center',
  },
  attributesSection: {
    background: '#2a2a3e',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  attributeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  attributeLabel: {
    color: '#888',
  },
  attributeValue: {
    color: '#555',
  },
  attributeValueActive: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  attributeValueElement: {
    color: '#ef4444',
    fontWeight: 600,
  },
  attributeValuePA: {
    color: '#c084fc',
    fontWeight: 600,
  },
};
