import { useState, useEffect } from 'react';
import type { ItemCategory, InventoryItem, PlayerInventory } from './inventory-types';

export type { ItemCategory, InventoryItem, PlayerInventory };

interface ItemsMenuProps {
  onBack?: () => void;
  inventory?: InventoryItem[];
  maxItems?: number;
  showBackButton?: boolean;
}

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'usable', label: 'Usable' },
  { id: 'weapon', label: 'Weapon' },
  { id: 'armor', label: 'Armor' },
  { id: 'special', label: 'Special' },
];

export default function ItemsMenu({
  onBack,
  inventory: externalInventory,
  maxItems = 40,
  showBackButton = true
}: ItemsMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('usable');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>(externalInventory || []);
  const [loading, setLoading] = useState(!externalInventory);

  // Load items from player-inventory.json if no external inventory provided
  useEffect(() => {
    if (externalInventory) {
      setInventory(externalInventory);
      setLoading(false);
      return;
    }

    async function loadInventory() {
      try {
        const response = await fetch('/data/player-inventory.json');
        if (response.ok) {
          const data: PlayerInventory = await response.json();
          setInventory(data.items);
        }
      } catch (error) {
        console.error('Failed to load inventory:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, [externalInventory]);

  const filteredItems = inventory.filter(item => item.category === selectedCategory);
  const selectedItem = filteredItems[selectedIndex];
  const totalItems = inventory.length;
  const totalPages = Math.ceil(filteredItems.length / 10) || 1;

  const handleCategoryChange = (direction: 'prev' | 'next') => {
    const currentIndex = CATEGORIES.findIndex(c => c.id === selectedCategory);
    if (direction === 'prev') {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : CATEGORIES.length - 1;
      setSelectedCategory(CATEGORIES[newIndex].id);
    } else {
      const newIndex = currentIndex < CATEGORIES.length - 1 ? currentIndex + 1 : 0;
      setSelectedCategory(CATEGORIES[newIndex].id);
    }
    setSelectedIndex(0);
    setPage(1);
  };

  // Paginate items
  const pageItems = filteredItems.slice((page - 1) * 10, page * 10);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading items...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        {/* Category Tabs */}
        <div style={styles.tabBar}>
          <button style={styles.tabArrow} onClick={() => handleCategoryChange('prev')}>◀</button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedIndex(0); setPage(1); }}
              style={{
                ...styles.tab,
                ...(selectedCategory === cat.id ? styles.tabActive : {}),
              }}
            >
              {cat.label}
            </button>
          ))}
          <button style={styles.tabArrow} onClick={() => handleCategoryChange('next')}>▶</button>
        </div>

        {/* Item List */}
        <div style={styles.itemList}>
          {pageItems.map((item, index) => {
            const globalIndex = (page - 1) * 10 + index;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIndex(globalIndex)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
                style={{
                  ...styles.itemRow,
                  ...(selectedIndex === globalIndex ? styles.itemRowSelected : {}),
                }}
              >
                <span style={styles.itemIcon}>
                  {item.category === 'usable' ? '💊' :
                   item.category === 'weapon' ? '⚔' :
                   item.category === 'armor' ? '🛡' : '✨'}
                </span>
                <span style={styles.itemName}>{item.name}</span>
                {item.quantity > 1 && (
                  <span style={styles.itemQuantity}>x{item.quantity}</span>
                )}
              </button>
            );
          })}
          {pageItems.length === 0 && (
            <div style={styles.emptyMessage}>No items</div>
          )}
        </div>

        {/* Item Pack Counter */}
        <div style={styles.itemPackBar}>
          <span style={styles.itemPackLabel}>Item Pack</span>
          <span style={styles.itemPackCount}>{Math.min(totalItems, maxItems)}/{maxItems}</span>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>START</span> Close
          </span>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>Y</span> Info
          </span>
        </div>
      </div>

      {/* Right Panel - Details */}
      <div style={styles.rightPanel}>
        <div style={styles.pageNav}>
          <button
            style={styles.navArrow}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >◀</button>
          <span style={styles.pageIndicator}>
            <span style={styles.lrHint}>L</span>
            {page}/{totalPages}
            <span style={styles.lrHint}>R</span>
          </span>
          <button
            style={styles.navArrow}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >▶</button>
        </div>

        {selectedItem ? (
          <div style={styles.detailsContent}>
            {/* Japanese name */}
            {selectedItem.japaneseName && (
              <div style={styles.japaneseName}>{selectedItem.japaneseName}</div>
            )}

            {/* Description */}
            <div style={styles.descriptionText}>
              {selectedItem.description || 'No description'}
            </div>

            <div style={styles.spacer} />

            {/* Stats based on category */}
            {selectedItem.category === 'weapon' && (
              <>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Type</span>
                  <span style={styles.detailValue}>{selectedItem.weaponType}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>ATP</span>
                  <span style={styles.detailValue}>{selectedItem.atp}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>ATA</span>
                  <span style={styles.detailValue}>{selectedItem.ata}</span>
                </div>
                {selectedItem.mst && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>MST</span>
                    <span style={styles.detailValue}>+{selectedItem.mst}</span>
                  </div>
                )}
              </>
            )}

            {selectedItem.category === 'armor' && (
              <>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>DFP</span>
                  <span style={styles.detailValue}>{selectedItem.dfp}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>EVP</span>
                  <span style={styles.detailValue}>{selectedItem.evp}</span>
                </div>
                {selectedItem.slots !== undefined && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Slots</span>
                    <span style={styles.detailValue}>{selectedItem.slots}</span>
                  </div>
                )}
              </>
            )}

            {selectedItem.level && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Lv Required</span>
                <span style={styles.detailValue}>{selectedItem.level}</span>
              </div>
            )}

            {/* Rarity stars */}
            <div style={styles.rarityRow}>
              {Array.from({ length: selectedItem.rarity }, (_, i) => (
                <span key={i} style={styles.starFilled}>★</span>
              ))}
              {Array.from({ length: Math.max(0, 10 - selectedItem.rarity) }, (_, i) => (
                <span key={i} style={styles.starEmpty}>★</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.emptyDetails}>Select an item</div>
        )}
      </div>

      {/* Back button overlay */}
      {showBackButton && onBack && (
        <button onClick={onBack} style={styles.backButton}>← Back</button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '4px',
    position: 'relative',
  },
  loading: {
    padding: '40px',
    color: '#1a3a5a',
    fontSize: '14px',
  },
  leftPanel: {
    width: '320px',
    background: 'linear-gradient(180deg, #7cb8d8 0%, #5a9cc8 100%)',
    border: '3px solid #2a5a7a',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  rightPanel: {
    width: '180px',
    background: 'linear-gradient(180deg, #7cb8d8 0%, #5a9cc8 100%)',
    border: '3px solid #2a5a7a',
    borderRadius: '8px',
    overflow: 'hidden',
    padding: '8px',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    padding: '4px',
    borderBottom: '2px solid #2a5a7a',
  },
  tabArrow: {
    background: 'transparent',
    color: '#4f8',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    fontSize: '10px',
  },
  tab: {
    flex: 1,
    padding: '6px 4px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '3px',
    color: '#1a3a5a',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  tabActive: {
    background: '#ffffff',
    border: '1px solid #2a5a7a',
  },
  itemList: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minHeight: '150px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#1a3a5a',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  itemRowSelected: {
    background: '#f0a020',
    color: '#1a1a1a',
  },
  itemIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  itemName: {
    flex: 1,
    fontWeight: 'bold',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemQuantity: {
    fontSize: '12px',
    color: '#1a3a5a',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6a8a9a',
    padding: '20px',
    fontSize: '12px',
  },
  itemPackBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #5a9cc8 0%, #4a8cb8 100%)',
    borderTop: '1px solid #3a7aa8',
    borderBottom: '1px solid #3a7aa8',
  },
  itemPackLabel: {
    color: '#1a3a5a',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  itemPackCount: {
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  footer: {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
  },
  footerHint: {
    fontSize: '11px',
    color: '#ffffff',
  },
  buttonHint: {
    display: 'inline-block',
    background: '#2a5a7a',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '3px',
    marginRight: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  pageNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  navArrow: {
    background: '#2a5a7a',
    color: '#4f8',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  pageIndicator: {
    color: '#1a3a5a',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  lrHint: {
    display: 'inline-block',
    background: '#1a3a5a',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '3px',
    margin: '0 4px',
    fontSize: '10px',
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  japaneseName: {
    color: '#3a5a7a',
    fontSize: '11px',
    marginBottom: '4px',
  },
  descriptionText: {
    color: '#1a3a5a',
    fontSize: '11px',
    lineHeight: 1.4,
    maxHeight: '60px',
    overflow: 'hidden',
  },
  spacer: {
    height: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#1a3a5a',
    fontSize: '11px',
  },
  detailValue: {
    color: '#1a1a1a',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  rarityRow: {
    marginTop: '8px',
  },
  starFilled: {
    color: '#f0d020',
    fontSize: '11px',
  },
  starEmpty: {
    color: '#1a3a5a',
    fontSize: '11px',
  },
  emptyDetails: {
    color: '#6a8a9a',
    fontSize: '12px',
    textAlign: 'center',
    padding: '20px',
  },
  backButton: {
    position: 'absolute',
    top: '-30px',
    left: '0',
    padding: '4px 12px',
    background: '#2a5a7a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
