import { useState, useEffect } from 'react';
import type {
  ItemCategory,
  InventoryItem,
  PlayerInventory,
  PlayerState,
  ItemAction,
  ItemActionOption,
} from './inventory-types';
import {
  getItemActions,
  canPlayerEquip,
  getWeaponSortOrder,
} from './inventory-types';

export type { ItemCategory, InventoryItem, PlayerInventory, PlayerState };

interface ItemsMenuProps {
  onBack?: () => void;
  inventory?: InventoryItem[];
  playerState?: PlayerState;
  maxItems?: number;
  showBackButton?: boolean;
  onItemAction?: (item: InventoryItem, action: ItemAction) => void;
}

// Default player state for storybook/testing
const DEFAULT_PLAYER_STATE: PlayerState = {
  level: 50,
  characterClass: 'HUmar',
  currentHP: 800,
  maxHP: 1000,
  currentPP: 50,
  maxPP: 100,
};

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'usable', label: 'Usable' },
  { id: 'weapon', label: 'Weapon' },
  { id: 'armor', label: 'Armor' },
  { id: 'special', label: 'Special' },
];

export default function ItemsMenu({
  onBack,
  inventory: externalInventory,
  playerState = DEFAULT_PLAYER_STATE,
  maxItems = 40,
  showBackButton = true,
  onItemAction,
}: ItemsMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('usable');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>(externalInventory || []);
  const [loading, setLoading] = useState(!externalInventory);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuIndex, setActionMenuIndex] = useState(0);

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

  // Sort and filter items
  const filteredItems = inventory
    .filter(item => item.category === selectedCategory)
    .sort((a, b) => {
      // Sort weapons by category: melee → ranged → magic
      if (selectedCategory === 'weapon') {
        return getWeaponSortOrder(a.weaponCategory) - getWeaponSortOrder(b.weaponCategory);
      }
      return 0;
    });

  const selectedItem = filteredItems[selectedIndex];
  const totalItems = inventory.length;
  const totalPages = Math.ceil(filteredItems.length / 10) || 1;

  // Get actions for selected item
  const itemActions = selectedItem ? getItemActions(selectedItem, playerState) : [];

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
    setShowActionMenu(false);
  };

  const handleItemSelect = (index: number) => {
    setSelectedIndex(index);
    setShowActionMenu(true);
    setActionMenuIndex(0);
  };

  const handleActionSelect = (action: ItemActionOption) => {
    if (action.disabled || !selectedItem) return;

    onItemAction?.(selectedItem, action.action);
    setShowActionMenu(false);
  };

  // Check if item can be equipped by player
  const getItemStatus = (item: InventoryItem): { canEquip: boolean; isEquipped: boolean } => {
    const equipCheck = canPlayerEquip(item, playerState);
    return {
      canEquip: equipCheck.canEquip,
      isEquipped: item.isEquipped || false,
    };
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
              onClick={() => { setSelectedCategory(cat.id); setSelectedIndex(0); setPage(1); setShowActionMenu(false); }}
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
            const status = getItemStatus(item);
            const isSelected = selectedIndex === globalIndex;
            const isGrayedOut = (item.category === 'weapon' || item.category === 'armor') && !status.canEquip;

            return (
              <button
                key={item.id}
                onClick={() => handleItemSelect(globalIndex)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
                style={{
                  ...styles.itemRow,
                  ...(isSelected ? styles.itemRowSelected : {}),
                  ...(isGrayedOut ? styles.itemRowDisabled : {}),
                }}
              >
                {/* Status icon */}
                <span style={styles.statusIcon}>
                  {status.isEquipped && <span style={styles.equippedIcon}>E</span>}
                  {!status.canEquip && !status.isEquipped && (item.category === 'weapon' || item.category === 'armor') && (
                    <span style={styles.cantEquipIcon}>✕</span>
                  )}
                </span>

                {/* Item icon */}
                <span style={styles.itemIcon}>
                  {item.category === 'usable' ? '💊' :
                   item.category === 'weapon' ? '⚔' :
                   item.category === 'armor' ? (item.isUnit ? '◇' : '🛡') : '✨'}
                </span>

                <span style={{
                  ...styles.itemName,
                  ...(isGrayedOut ? styles.itemNameDisabled : {}),
                }}>
                  {item.name}
                </span>

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
            <span style={styles.buttonHint}>A</span> Select
          </span>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>B</span> Back
          </span>
        </div>
      </div>

      {/* Right Panel - Details or Action Menu */}
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

        {showActionMenu && selectedItem ? (
          // Action Menu
          <div style={styles.actionMenu}>
            <div style={styles.actionMenuTitle}>{selectedItem.name}</div>
            <div style={styles.actionList}>
              {itemActions.map((action, index) => (
                <button
                  key={action.action}
                  onClick={() => handleActionSelect(action)}
                  onMouseEnter={() => setActionMenuIndex(index)}
                  style={{
                    ...styles.actionButton,
                    ...(actionMenuIndex === index ? styles.actionButtonSelected : {}),
                    ...(action.disabled ? styles.actionButtonDisabled : {}),
                  }}
                  disabled={action.disabled}
                >
                  {action.label}
                  {action.disabled && action.disabledReason && (
                    <span style={styles.disabledReason}>({action.disabledReason})</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowActionMenu(false)}
                onMouseEnter={() => setActionMenuIndex(itemActions.length)}
                style={{
                  ...styles.actionButton,
                  ...(actionMenuIndex === itemActions.length ? styles.actionButtonSelected : {}),
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedItem ? (
          // Item Details
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
                {selectedItem.slots !== undefined && !selectedItem.isUnit && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Slots</span>
                    <span style={styles.detailValue}>{selectedItem.slots}</span>
                  </div>
                )}
              </>
            )}

            {selectedItem.requiredLevel && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Lv Required</span>
                <span style={{
                  ...styles.detailValue,
                  ...(playerState.level < selectedItem.requiredLevel ? styles.levelTooLow : {}),
                }}>
                  {selectedItem.requiredLevel}
                </span>
              </div>
            )}

            {/* Max stack for consumables */}
            {selectedItem.category === 'usable' && selectedItem.maxStack && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Max</span>
                <span style={styles.detailValue}>{selectedItem.quantity}/{selectedItem.maxStack}</span>
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
    gap: '4px',
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
  itemRowDisabled: {
    opacity: 0.6,
  },
  statusIcon: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
  },
  equippedIcon: {
    background: '#4a8',
    color: '#fff',
    padding: '1px 3px',
    borderRadius: '2px',
    fontSize: '9px',
    fontWeight: 'bold',
  },
  cantEquipIcon: {
    color: '#c44',
    fontSize: '12px',
    fontWeight: 'bold',
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
  itemNameDisabled: {
    color: '#5a7a8a',
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
  // Action Menu styles
  actionMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionMenuTitle: {
    color: '#1a3a5a',
    fontSize: '12px',
    fontWeight: 'bold',
    borderBottom: '1px solid #3a7aa8',
    paddingBottom: '6px',
    marginBottom: '4px',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#1a3a5a',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'left',
  },
  actionButtonSelected: {
    background: '#f0a020',
    color: '#1a1a1a',
  },
  actionButtonDisabled: {
    color: '#7a9aaa',
    cursor: 'not-allowed',
  },
  disabledReason: {
    fontSize: '10px',
    fontWeight: 'normal',
    color: '#8a6a5a',
  },
  // Details styles
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
  levelTooLow: {
    color: '#c44',
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
