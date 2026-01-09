import { useState } from 'react';

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

interface WeaponShopProps {
  weapons: ShopWeapon[];
  playerMeseta: number;
  onPurchase?: (weapon: ShopWeapon) => void;
}

const ELEMENT_COLORS: Record<string, string> = {
  'Native': '#22c55e',
  'A.Beast': '#eab308',
  'Machine': '#3b82f6',
  'Dark': '#a855f7',
  'Hit': '#ef4444',
};

const WEAPON_ICONS: Record<string, string> = {
  'Saber': '🗡',
  'Sword': '⚔',
  'Dagger': '🔪',
  'Partisan': '🔱',
  'Twin Saber': '⚔',
  'Handgun': '🔫',
  'Rifle': '🎯',
  'Shot': '💥',
  'Mechgun': '🔫',
  'Cane': '🪄',
  'Staff': '🪄',
  'Rod': '🪄',
  'Wand': '🪄',
};

export default function WeaponShop({
  weapons,
  playerMeseta,
  onPurchase,
}: WeaponShopProps) {
  const [selectedWeapon, setSelectedWeapon] = useState<ShopWeapon | null>(null);
  const [hoveredWeaponId, setHoveredWeaponId] = useState<string | null>(null);

  const hoveredWeapon = hoveredWeaponId ? weapons.find(w => w.id === hoveredWeaponId) : null;

  const handlePurchase = () => {
    if (selectedWeapon && canAfford(selectedWeapon)) {
      onPurchase?.(selectedWeapon);
    }
  };

  const canAfford = (weapon: ShopWeapon) => {
    return playerMeseta >= weapon.price;
  };

  const getWeaponIcon = (type: string) => {
    return WEAPON_ICONS[type] || '⚔';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.shopTitle}>
          <span style={styles.shopIcon}>⚔</span>
          <h2 style={styles.title}>Weapon Shop</h2>
        </div>
        <div style={styles.mesetaDisplay}>
          <span style={styles.mesetaIcon}>💰</span>
          <span style={styles.mesetaAmount}>{playerMeseta.toLocaleString()}</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Weapon Grid */}
        <div style={styles.weaponGrid}>
          {weapons.map(weapon => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              isSelected={selectedWeapon?.id === weapon.id}
              isHovered={hoveredWeaponId === weapon.id}
              canAfford={playerMeseta >= weapon.price}
              onSelect={() => setSelectedWeapon(weapon)}
              onHover={() => setHoveredWeaponId(weapon.id)}
              onLeave={() => setHoveredWeaponId(null)}
              getIcon={getWeaponIcon}
            />
          ))}
        </div>

        {/* Details Panel */}
        <div style={styles.detailsPanel}>
          {(hoveredWeapon || selectedWeapon) ? (
            <WeaponDetails weapon={hoveredWeapon || selectedWeapon!} getIcon={getWeaponIcon} />
          ) : (
            <div style={styles.emptyDetails}>
              <span style={styles.emptyIcon}>⚔</span>
              <span>Select a weapon to view details</span>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Section */}
      {selectedWeapon && (
        <div style={styles.purchaseSection}>
          <div style={styles.purchaseInfo}>
            <span style={styles.purchaseIcon}>{getWeaponIcon(selectedWeapon.type)}</span>
            <div style={styles.purchaseDetails}>
              <span style={styles.purchaseName}>
                {selectedWeapon.name}
                {selectedWeapon.grind > 0 && <span style={styles.grindBadge}>+{selectedWeapon.grind}</span>}
              </span>
              {selectedWeapon.element && (
                <span style={{
                  ...styles.purchaseElement,
                  color: ELEMENT_COLORS[selectedWeapon.element] || '#888',
                }}>
                  {selectedWeapon.element} {selectedWeapon.elementPercent}%
                </span>
              )}
            </div>
          </div>
          <div style={styles.purchaseTotal}>
            <span style={{
              ...styles.totalAmount,
              color: canAfford(selectedWeapon) ? '#f97316' : '#f87171',
            }}>
              {selectedWeapon.price.toLocaleString()} Meseta
            </span>
          </div>
          <button
            style={{
              ...styles.buyButton,
              ...(canAfford(selectedWeapon) ? {} : styles.buyButtonDisabled),
            }}
            onClick={handlePurchase}
            disabled={!canAfford(selectedWeapon)}
          >
            {canAfford(selectedWeapon) ? 'Purchase' : 'Not Enough Meseta'}
          </button>
        </div>
      )}
    </div>
  );
}

function WeaponCard({
  weapon,
  isSelected,
  isHovered,
  canAfford,
  onSelect,
  onHover,
  onLeave,
  getIcon,
}: {
  weapon: ShopWeapon;
  isSelected: boolean;
  isHovered: boolean;
  canAfford: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
  getIcon: (type: string) => string;
}) {
  return (
    <div
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        ...styles.weaponCard,
        ...(isHovered && !isSelected ? styles.weaponCardHovered : {}),
        ...(isSelected ? styles.weaponCardSelected : {}),
        ...(!canAfford ? styles.weaponCardUnaffordable : {}),
      }}
    >
      {/* Badges */}
      <div style={styles.cardBadges}>
        {weapon.grind > 0 && (
          <span style={styles.grindBadgeCard}>+{weapon.grind}</span>
        )}
        {weapon.element && (
          <span style={{
            ...styles.elementBadge,
            background: ELEMENT_COLORS[weapon.element] || '#888',
          }}>
            {weapon.elementPercent}%
          </span>
        )}
      </div>

      <div style={styles.cardIcon}>{getIcon(weapon.type)}</div>
      <div style={styles.cardName}>{weapon.name}</div>
      <div style={styles.cardType}>{weapon.type}</div>
      <div style={styles.cardRarity}>
        {'★'.repeat(Math.min(weapon.rarity, 4))}
      </div>
      <div style={styles.cardPrice}>{weapon.price.toLocaleString()}</div>
    </div>
  );
}

function WeaponDetails({
  weapon,
  getIcon,
}: {
  weapon: ShopWeapon;
  getIcon: (type: string) => string;
}) {
  return (
    <div style={styles.detailsContent}>
      <div style={styles.detailsHeader}>
        <span style={styles.detailsIcon}>{getIcon(weapon.type)}</span>
        <div>
          <span style={styles.detailsName}>
            {weapon.name}
            {weapon.grind > 0 && <span style={styles.detailsGrind}>+{weapon.grind}</span>}
          </span>
          <span style={styles.detailsType}>{weapon.type}</span>
        </div>
      </div>

      <div style={styles.detailsRarity}>
        {'★'.repeat(weapon.rarity)}{'☆'.repeat(Math.max(0, 10 - weapon.rarity))}
      </div>

      {weapon.element && (
        <div style={{
          ...styles.detailsElement,
          borderColor: ELEMENT_COLORS[weapon.element] || '#888',
        }}>
          <span style={{
            color: ELEMENT_COLORS[weapon.element] || '#888',
            fontWeight: 600,
          }}>
            {weapon.element}
          </span>
          <span style={styles.elementValue}>{weapon.elementPercent}%</span>
        </div>
      )}

      <div style={styles.statsSection}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>ATP</span>
          <span style={styles.statValue}>{weapon.atp}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>ATA</span>
          <span style={styles.statValue}>{weapon.ata}</span>
        </div>
        {weapon.mst && (
          <div style={styles.statRow}>
            <span style={styles.statLabel}>MST</span>
            <span style={{ ...styles.statValue, color: '#a855f7' }}>+{weapon.mst}</span>
          </div>
        )}
        {weapon.grind > 0 && (
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Grind</span>
            <span style={{ ...styles.statValue, color: '#22c55e' }}>+{weapon.grind}</span>
          </div>
        )}
      </div>

      <div style={styles.detailsPrice}>
        <span style={styles.priceLabel}>Price:</span>
        <span style={styles.priceValue}>{weapon.price.toLocaleString()} Meseta</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '650px',
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
  content: {
    display: 'flex',
    height: '360px',
  },
  weaponGrid: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    alignContent: 'start',
  },
  weaponCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px 8px',
    background: '#2a2a3e',
    borderRadius: '8px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  weaponCardHovered: {
    background: '#32324a',
    borderColor: '#4a4a6a',
  },
  weaponCardSelected: {
    background: '#3a3a2e',
    borderColor: '#f97316',
  },
  weaponCardUnaffordable: {
    opacity: 0.5,
  },
  cardBadges: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    right: '4px',
    display: 'flex',
    gap: '4px',
  },
  grindBadgeCard: {
    background: '#22c55e',
    color: '#fff',
    fontSize: '9px',
    padding: '2px 5px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  elementBadge: {
    color: '#fff',
    fontSize: '9px',
    padding: '2px 5px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  cardIcon: {
    fontSize: '24px',
    marginTop: '8px',
  },
  cardName: {
    fontSize: '11px',
    fontWeight: 500,
    textAlign: 'center',
  },
  cardType: {
    fontSize: '9px',
    color: '#888',
  },
  cardRarity: {
    fontSize: '8px',
    color: '#fcd34d',
    letterSpacing: '-1px',
  },
  cardPrice: {
    fontSize: '11px',
    color: '#f97316',
    fontWeight: 600,
  },
  detailsPanel: {
    width: '220px',
    background: '#252535',
    borderLeft: '1px solid #3a3a4e',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
    color: '#555',
    fontSize: '12px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '32px',
    opacity: 0.5,
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  detailsIcon: {
    fontSize: '28px',
  },
  detailsName: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
  },
  detailsGrind: {
    color: '#22c55e',
    marginLeft: '4px',
  },
  detailsType: {
    display: 'block',
    fontSize: '11px',
    color: '#888',
  },
  detailsRarity: {
    fontSize: '12px',
    color: '#fcd34d',
    letterSpacing: '1px',
  },
  detailsElement: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#2a2a3e',
    borderRadius: '6px',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
  },
  elementValue: {
    color: '#fff',
    fontWeight: 600,
  },
  statsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  statLabel: {
    color: '#888',
  },
  statValue: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  detailsPrice: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    paddingTop: '12px',
    borderTop: '1px solid #3a3a4e',
  },
  priceLabel: {
    color: '#888',
  },
  priceValue: {
    color: '#f97316',
    fontWeight: 600,
  },
  purchaseSection: {
    padding: '16px 20px',
    background: '#252535',
    borderTop: '1px solid #3a3a4e',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  purchaseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  purchaseIcon: {
    fontSize: '24px',
  },
  purchaseDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  purchaseName: {
    fontSize: '14px',
    fontWeight: 500,
  },
  grindBadge: {
    color: '#22c55e',
    marginLeft: '4px',
  },
  purchaseElement: {
    fontSize: '11px',
  },
  purchaseTotal: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  totalAmount: {
    fontSize: '16px',
    fontWeight: 600,
  },
  buyButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buyButtonDisabled: {
    background: '#3a3a4e',
    color: '#666',
    cursor: 'not-allowed',
  },
};
