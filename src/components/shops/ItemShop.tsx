import { useState } from 'react';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  rarity: number;
  techLevel?: number;
}

interface ItemShopProps {
  baseItems: ShopItem[];
  premiumItems: ShopItem[];
  playerMeseta: number;
  onPurchase?: (item: ShopItem, quantity: number) => void;
}

export default function ItemShop({
  baseItems,
  premiumItems,
  playerMeseta,
  onPurchase,
}: ItemShopProps) {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const allItems = [...baseItems, ...premiumItems];
  const hoveredItem = hoveredItemId ? allItems.find(i => i.id === hoveredItemId) : null;

  const handlePurchase = () => {
    if (selectedItem && canAfford(selectedItem)) {
      onPurchase?.(selectedItem, quantity);
      setQuantity(1);
    }
  };

  const canAfford = (item: ShopItem) => {
    return playerMeseta >= item.price * quantity;
  };

  const totalCost = selectedItem ? selectedItem.price * quantity : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.shopTitle}>
          <span style={styles.shopIcon}>🏪</span>
          <h2 style={styles.title}>Item Shop</h2>
        </div>
        <div style={styles.mesetaDisplay}>
          <span style={styles.mesetaIcon}>💰</span>
          <span style={styles.mesetaAmount}>{playerMeseta.toLocaleString()}</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Item List */}
        <div style={styles.itemList}>
          {baseItems.length > 0 && (
            <>
              <div style={styles.sectionHeader}>Standard Items</div>
              {baseItems.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  isHovered={hoveredItemId === item.id}
                  canAfford={playerMeseta >= item.price}
                  onSelect={() => {
                    setSelectedItem(item);
                    setQuantity(1);
                  }}
                  onHover={() => setHoveredItemId(item.id)}
                  onLeave={() => setHoveredItemId(null)}
                />
              ))}
            </>
          )}

          {premiumItems.length > 0 && (
            <>
              <div style={{ ...styles.sectionHeader, marginTop: '16px' }}>Special Stock</div>
              {premiumItems.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  isHovered={hoveredItemId === item.id}
                  canAfford={playerMeseta >= item.price}
                  onSelect={() => {
                    setSelectedItem(item);
                    setQuantity(1);
                  }}
                  onHover={() => setHoveredItemId(item.id)}
                  onLeave={() => setHoveredItemId(null)}
                />
              ))}
            </>
          )}
        </div>

        {/* Details Panel */}
        <div style={styles.detailsPanel}>
          {(hoveredItem || selectedItem) ? (
            <ItemDetails item={hoveredItem || selectedItem!} />
          ) : (
            <div style={styles.emptyDetails}>
              <span style={styles.emptyIcon}>🛒</span>
              <span>Select an item to view details</span>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Section */}
      {selectedItem && (
        <div style={styles.purchaseSection}>
          <div style={styles.purchaseInfo}>
            <span style={styles.purchaseName}>{selectedItem.name}</span>
            <div style={styles.quantityControl}>
              <button
                style={styles.quantityButton}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                -
              </button>
              <span style={styles.quantityValue}>{quantity}</span>
              <button
                style={styles.quantityButton}
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
              >
                +
              </button>
            </div>
          </div>
          <div style={styles.purchaseTotal}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={{
              ...styles.totalAmount,
              color: canAfford(selectedItem) ? '#4ade80' : '#f87171',
            }}>
              {totalCost.toLocaleString()} Meseta
            </span>
          </div>
          <button
            style={{
              ...styles.buyButton,
              ...(canAfford(selectedItem) ? {} : styles.buyButtonDisabled),
            }}
            onClick={handlePurchase}
            disabled={!canAfford(selectedItem)}
          >
            {canAfford(selectedItem) ? 'Purchase' : 'Not Enough Meseta'}
          </button>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  isSelected,
  isHovered,
  canAfford,
  onSelect,
  onHover,
  onLeave,
}: {
  item: ShopItem;
  isSelected: boolean;
  isHovered: boolean;
  canAfford: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const isTechDisk = item.id.startsWith('disk_');

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        ...styles.itemRow,
        ...(isHovered && !isSelected ? styles.itemRowHovered : {}),
        ...(isSelected ? styles.itemRowSelected : {}),
        ...(!canAfford ? styles.itemRowUnaffordable : {}),
      }}
    >
      <div style={styles.itemIcon}>
        {isTechDisk ? '💿' : '📦'}
      </div>
      <div style={styles.itemInfo}>
        <span style={styles.itemName}>{item.name}</span>
        <span style={styles.itemRarity}>
          {'★'.repeat(Math.min(item.rarity, 5))}
        </span>
      </div>
      <div style={styles.itemPrice}>
        {item.price.toLocaleString()}
      </div>
    </div>
  );
}

function ItemDetails({ item }: { item: ShopItem }) {
  const isTechDisk = item.id.startsWith('disk_');

  return (
    <div style={styles.detailsContent}>
      <div style={styles.detailsHeader}>
        <span style={styles.detailsIcon}>{isTechDisk ? '💿' : '📦'}</span>
        <span style={styles.detailsName}>{item.name}</span>
      </div>
      <div style={styles.detailsRarity}>
        {'★'.repeat(item.rarity)}{'☆'.repeat(Math.max(0, 5 - item.rarity))}
      </div>
      <div style={styles.detailsDescription}>
        {item.description}
      </div>
      {item.techLevel && (
        <div style={styles.detailsTech}>
          Technique Level: {item.techLevel}
        </div>
      )}
      <div style={styles.detailsPrice}>
        <span style={styles.priceLabel}>Price:</span>
        <span style={styles.priceValue}>{item.price.toLocaleString()} Meseta</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '600px',
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
    background: 'linear-gradient(135deg, #2d4a3e 0%, #1e3a2f 100%)',
    borderBottom: '1px solid #3a5a4e',
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
    color: '#4ade80',
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1a2a22',
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
    height: '320px',
  },
  itemList: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
  },
  sectionHeader: {
    fontSize: '11px',
    color: '#4ade80',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 12px',
    background: '#252535',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: '#2a2a3e',
    borderRadius: '6px',
    marginBottom: '4px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transition: 'all 0.15s',
  },
  itemRowHovered: {
    background: '#32324a',
    borderColor: '#4a4a6a',
  },
  itemRowSelected: {
    background: '#2d4a3e',
    borderColor: '#4ade80',
  },
  itemRowUnaffordable: {
    opacity: 0.5,
  },
  itemIcon: {
    fontSize: '18px',
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    fontSize: '13px',
    fontWeight: 500,
  },
  itemRarity: {
    fontSize: '10px',
    color: '#fcd34d',
  },
  itemPrice: {
    fontSize: '13px',
    color: '#4ade80',
    fontWeight: 600,
  },
  detailsPanel: {
    width: '200px',
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
    fontSize: '24px',
  },
  detailsName: {
    fontSize: '16px',
    fontWeight: 600,
  },
  detailsRarity: {
    fontSize: '12px',
    color: '#fcd34d',
    letterSpacing: '1px',
  },
  detailsDescription: {
    fontSize: '12px',
    color: '#aaa',
    lineHeight: 1.5,
    flex: 1,
  },
  detailsTech: {
    fontSize: '11px',
    color: '#6b8afd',
    background: '#2a2a3e',
    padding: '6px 10px',
    borderRadius: '4px',
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
    color: '#4ade80',
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
    gap: '16px',
  },
  purchaseName: {
    fontSize: '14px',
    fontWeight: 500,
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#2a2a3e',
    padding: '4px',
    borderRadius: '6px',
  },
  quantityButton: {
    width: '28px',
    height: '28px',
    background: '#3a3a4e',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
  quantityValue: {
    width: '32px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  purchaseTotal: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  totalLabel: {
    fontSize: '12px',
    color: '#888',
  },
  totalAmount: {
    fontSize: '16px',
    fontWeight: 600,
  },
  buyButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
    border: 'none',
    borderRadius: '6px',
    color: '#1a1a1a',
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
