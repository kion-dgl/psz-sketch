import { useState, useRef, useEffect } from 'react';
import type { InventoryItem, PlayerState, CharacterClass } from './inventory-types';
import { canPlayerEquip } from './inventory-types';

interface EquipMenuWebProps {
  inventory: InventoryItem[];
  playerState: PlayerState;
  onEquip?: (slot: EquipSlot, item: InventoryItem | null) => void;
}

type EquipSlot = 'weapon' | 'armor' | 'unit1' | 'unit2' | 'unit3' | 'unit4' | 'mag';

interface EquippedItems {
  weapon: InventoryItem | null;
  armor: InventoryItem | null;
  units: (InventoryItem | null)[];
  mag: MagData | null;
}

interface MagData {
  name: string;
  level: number;
  sync: number;
  iq: number;
  def: number;
  pow: number;
  dex: number;
  mind: number;
}

interface SlotMenuState {
  visible: boolean;
  slot: EquipSlot | null;
  x: number;
  y: number;
  items: InventoryItem[];
}

const SAMPLE_MAG: MagData = {
  name: 'Varuna',
  level: 42,
  sync: 120,
  iq: 180,
  def: 10,
  pow: 15,
  dex: 12,
  mind: 5,
};

export default function EquipMenuWeb({
  inventory,
  playerState,
  onEquip,
}: EquipMenuWebProps) {
  // Find equipped items from inventory
  const equippedWeapon = inventory.find(i => i.category === 'weapon' && i.isEquipped) || null;
  const equippedArmor = inventory.find(i => i.category === 'armor' && !i.isUnit && i.isEquipped) || null;
  const equippedUnits = inventory.filter(i => i.category === 'armor' && i.isUnit && i.isEquipped);

  const [equipped] = useState<EquippedItems>({
    weapon: equippedWeapon,
    armor: equippedArmor,
    units: [
      equippedUnits[0] || null,
      equippedUnits[1] || null,
      equippedUnits[2] || null,
      equippedUnits[3] || null,
    ],
    mag: SAMPLE_MAG,
  });

  const [hoveredSlot, setHoveredSlot] = useState<EquipSlot | null>(null);
  const [slotMenu, setSlotMenu] = useState<SlotMenuState>({
    visible: false,
    slot: null,
    x: 0,
    y: 0,
    items: [],
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Get available unit slots based on armor
  const maxUnitSlots = equipped.armor?.slots || 0;

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slotMenu.visible && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSlotMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [slotMenu.visible]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && slotMenu.visible) {
        setSlotMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [slotMenu.visible]);

  const handleSlotClick = (e: React.MouseEvent, slot: EquipSlot) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Get available items for this slot
    let items: InventoryItem[] = [];
    if (slot === 'weapon') {
      items = inventory.filter(i => i.category === 'weapon' && !i.isEquipped);
    } else if (slot === 'armor') {
      items = inventory.filter(i => i.category === 'armor' && !i.isUnit && !i.isEquipped);
    } else if (slot.startsWith('unit')) {
      items = inventory.filter(i => i.category === 'armor' && i.isUnit && !i.isEquipped);
    }

    const menuWidth = 280;
    const menuHeight = Math.min(items.length * 60 + 80, 400);

    let x = rect.right + 12;
    let y = rect.top;

    if (x + menuWidth > window.innerWidth) {
      x = rect.left - menuWidth - 12;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 12;
    }

    setSlotMenu({
      visible: true,
      slot,
      x,
      y,
      items,
    });
  };

  const handleEquipItem = (item: InventoryItem | null) => {
    if (slotMenu.slot) {
      onEquip?.(slotMenu.slot, item);
    }
    setSlotMenu(prev => ({ ...prev, visible: false }));
  };

  const getSlotContent = (slot: EquipSlot): { name: string; icon: string; item: InventoryItem | MagData | null } => {
    switch (slot) {
      case 'weapon':
        return { name: 'Weapon', icon: '⚔', item: equipped.weapon };
      case 'armor':
        return { name: 'Armor', icon: '🛡', item: equipped.armor };
      case 'unit1':
        return { name: 'Unit 1', icon: '◇', item: equipped.units[0] };
      case 'unit2':
        return { name: 'Unit 2', icon: '◇', item: equipped.units[1] };
      case 'unit3':
        return { name: 'Unit 3', icon: '◇', item: equipped.units[2] };
      case 'unit4':
        return { name: 'Unit 4', icon: '◇', item: equipped.units[3] };
      case 'mag':
        return { name: 'Mag', icon: '◎', item: equipped.mag };
      default:
        return { name: '', icon: '', item: null };
    }
  };

  const renderEquipSlot = (slot: EquipSlot, disabled = false) => {
    const { name, icon, item } = getSlotContent(slot);
    const isHovered = hoveredSlot === slot;
    const isSelected = slotMenu.visible && slotMenu.slot === slot;
    const isEmpty = !item;

    return (
      <div
        key={slot}
        onClick={(e) => !disabled && handleSlotClick(e, slot)}
        onMouseEnter={() => !disabled && setHoveredSlot(slot)}
        onMouseLeave={() => setHoveredSlot(null)}
        style={{
          ...styles.equipSlot,
          ...(isHovered && !isSelected ? styles.equipSlotHovered : {}),
          ...(isSelected ? styles.equipSlotSelected : {}),
          ...(disabled ? styles.equipSlotDisabled : {}),
        }}
      >
        <div style={styles.slotIcon}>{icon}</div>
        <div style={styles.slotContent}>
          <div style={styles.slotLabel}>{name}</div>
          <div style={{
            ...styles.slotValue,
            ...(isEmpty ? styles.slotValueEmpty : {}),
          }}>
            {item ? ('name' in item ? item.name : (item as MagData).name) : 'Empty'}
          </div>
        </div>
        {item && 'rarity' in item && (
          <div style={styles.slotRarity}>
            {'★'.repeat(Math.min((item as InventoryItem).rarity, 5))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Equipment</h2>
        <div style={styles.playerInfo}>
          <span style={styles.playerClass}>{playerState.characterClass}</span>
          <span style={styles.playerLevel}>Lv. {playerState.level}</span>
        </div>
      </div>

      {/* Equipment Layout */}
      <div style={styles.content}>
        {/* Left Column - Weapon & Mag */}
        <div style={styles.column}>
          <div style={styles.sectionTitle}>Offense</div>
          {renderEquipSlot('weapon')}

          <div style={{ ...styles.sectionTitle, marginTop: '16px' }}>Mag</div>
          {renderEquipSlot('mag')}

          {equipped.mag && (
            <div style={styles.magStats}>
              <div style={styles.magStatRow}>
                <span>Level</span>
                <span style={styles.magStatValue}>{equipped.mag.level}</span>
              </div>
              <div style={styles.magStatRow}>
                <span>Sync</span>
                <span style={styles.magStatValue}>{equipped.mag.sync}%</span>
              </div>
              <div style={styles.magStatRow}>
                <span>IQ</span>
                <span style={styles.magStatValue}>{equipped.mag.iq}</span>
              </div>
              <div style={styles.magStatGrid}>
                <div style={styles.magMiniStat}>
                  <span style={styles.magMiniLabel}>DEF</span>
                  <span>{equipped.mag.def}</span>
                </div>
                <div style={styles.magMiniStat}>
                  <span style={styles.magMiniLabel}>POW</span>
                  <span>{equipped.mag.pow}</span>
                </div>
                <div style={styles.magMiniStat}>
                  <span style={styles.magMiniLabel}>DEX</span>
                  <span>{equipped.mag.dex}</span>
                </div>
                <div style={styles.magMiniStat}>
                  <span style={styles.magMiniLabel}>MIND</span>
                  <span>{equipped.mag.mind}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Armor & Units */}
        <div style={styles.column}>
          <div style={styles.sectionTitle}>Defense</div>
          {renderEquipSlot('armor')}

          {equipped.armor && (
            <div style={styles.armorStats}>
              <div style={styles.armorStatRow}>
                <span>DFP</span>
                <span style={styles.armorStatValue}>{equipped.armor.dfp}</span>
              </div>
              <div style={styles.armorStatRow}>
                <span>EVP</span>
                <span style={styles.armorStatValue}>{equipped.armor.evp}</span>
              </div>
              <div style={styles.armorStatRow}>
                <span>Slots</span>
                <span style={styles.armorStatValue}>{equipped.armor.slots || 0}</span>
              </div>
            </div>
          )}

          <div style={{ ...styles.sectionTitle, marginTop: '16px' }}>
            Units ({maxUnitSlots} slots)
          </div>
          <div style={styles.unitGrid}>
            {renderEquipSlot('unit1', maxUnitSlots < 1)}
            {renderEquipSlot('unit2', maxUnitSlots < 2)}
            {renderEquipSlot('unit3', maxUnitSlots < 3)}
            {renderEquipSlot('unit4', maxUnitSlots < 4)}
          </div>
        </div>
      </div>

      {/* Stat Summary */}
      <div style={styles.statSummary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>ATP</span>
          <span style={styles.summaryValue}>{equipped.weapon?.atp || 0}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>DFP</span>
          <span style={styles.summaryValue}>{equipped.armor?.dfp || 0}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>ATA</span>
          <span style={styles.summaryValue}>{equipped.weapon?.ata || 0}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>EVP</span>
          <span style={styles.summaryValue}>{equipped.armor?.evp || 0}</span>
        </div>
      </div>

      {/* Equipment Selection Menu */}
      {slotMenu.visible && (
        <div
          ref={menuRef}
          style={{
            ...styles.slotMenu,
            left: slotMenu.x,
            top: slotMenu.y,
          }}
        >
          <div style={styles.menuHeader}>
            Select {slotMenu.slot === 'weapon' ? 'Weapon' :
                    slotMenu.slot === 'armor' ? 'Armor' :
                    slotMenu.slot?.startsWith('unit') ? 'Unit' : 'Equipment'}
          </div>
          <div style={styles.menuBody}>
            {slotMenu.items.length === 0 ? (
              <div style={styles.menuEmpty}>No items available</div>
            ) : (
              slotMenu.items.map(item => {
                const equipCheck = canPlayerEquip(item, playerState);
                return (
                  <button
                    key={item.id}
                    onClick={() => equipCheck.canEquip && handleEquipItem(item)}
                    disabled={!equipCheck.canEquip}
                    style={{
                      ...styles.menuItem,
                      ...(!equipCheck.canEquip ? styles.menuItemDisabled : {}),
                    }}
                  >
                    <div style={styles.menuItemMain}>
                      <span style={styles.menuItemName}>{item.name}</span>
                      <span style={styles.menuItemRarity}>
                        {'★'.repeat(Math.min(item.rarity, 5))}
                      </span>
                    </div>
                    <div style={styles.menuItemStats}>
                      {item.category === 'weapon' && (
                        <>
                          <span>ATP: {item.atp}</span>
                          <span>ATA: {item.ata}</span>
                        </>
                      )}
                      {item.category === 'armor' && !item.isUnit && (
                        <>
                          <span>DFP: {item.dfp}</span>
                          <span>EVP: {item.evp}</span>
                        </>
                      )}
                      {item.isUnit && (
                        <span style={styles.menuItemDesc}>{item.description}</span>
                      )}
                    </div>
                    {!equipCheck.canEquip && (
                      <span style={styles.menuItemReason}>{equipCheck.reason}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <button
            onClick={() => handleEquipItem(null)}
            style={styles.menuUnequip}
          >
            Unequip
          </button>
          <button
            onClick={() => setSlotMenu(prev => ({ ...prev, visible: false }))}
            style={styles.menuCancel}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '500px',
    background: '#1e1e2e',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#e0e0e0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#2a2a3e',
    borderBottom: '1px solid #3a3a4e',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  playerInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  playerClass: {
    fontSize: '12px',
    color: '#6b8afd',
    fontWeight: 600,
  },
  playerLevel: {
    fontSize: '12px',
    color: '#888',
    background: '#252535',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  content: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: '11px',
    color: '#6b8afd',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  equipSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#2a2a3e',
    borderRadius: '8px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '8px',
  },
  equipSlotHovered: {
    background: '#32324a',
    borderColor: '#4a4a6a',
  },
  equipSlotSelected: {
    background: '#3a4a5e',
    borderColor: '#6b8afd',
  },
  equipSlotDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  slotIcon: {
    width: '36px',
    height: '36px',
    background: '#3a3a4e',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  slotContent: {
    flex: 1,
    minWidth: 0,
  },
  slotLabel: {
    fontSize: '10px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  slotValue: {
    fontSize: '14px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  slotValueEmpty: {
    color: '#555',
    fontStyle: 'italic',
  },
  slotRarity: {
    fontSize: '10px',
    color: '#ffd700',
  },
  magStats: {
    background: '#252535',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
  },
  magStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },
  magStatValue: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  magStatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #3a3a4e',
  },
  magMiniStat: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#aaa',
  },
  magMiniLabel: {
    color: '#666',
  },
  armorStats: {
    background: '#252535',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
  },
  armorStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },
  armorStatValue: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  unitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  statSummary: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px 20px',
    background: '#252535',
    borderTop: '1px solid #3a3a4e',
  },
  summaryItem: {
    textAlign: 'center',
  },
  summaryLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#6b8afd',
  },
  // Slot selection menu
  slotMenu: {
    position: 'fixed',
    width: '280px',
    maxHeight: '400px',
    background: '#2a2a3e',
    border: '1px solid #4a4a5e',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    zIndex: 1000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  menuHeader: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    background: '#3a3a4e',
    borderBottom: '1px solid #4a4a5e',
  },
  menuBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  menuEmpty: {
    padding: '24px',
    textAlign: 'center',
    color: '#666',
    fontSize: '13px',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#e0e0e0',
    textAlign: 'left',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'background 0.1s',
  },
  menuItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  menuItemMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  menuItemName: {
    fontSize: '13px',
    fontWeight: 500,
  },
  menuItemRarity: {
    fontSize: '10px',
    color: '#ffd700',
  },
  menuItemStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#888',
  },
  menuItemDesc: {
    fontSize: '10px',
    color: '#666',
  },
  menuItemReason: {
    display: 'block',
    fontSize: '10px',
    color: '#f66',
    marginTop: '4px',
  },
  menuUnequip: {
    display: 'block',
    width: '100%',
    padding: '10px',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid #3a3a4e',
    color: '#f88',
    fontSize: '12px',
    cursor: 'pointer',
  },
  menuCancel: {
    display: 'block',
    width: '100%',
    padding: '10px',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid #3a3a4e',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
  },
};
