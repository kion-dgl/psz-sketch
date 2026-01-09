import { useState, useRef, useEffect } from 'react';
import type {
  ItemCategory,
  InventoryItem,
  PlayerState,
  ItemAction,
  ItemActionOption,
} from './inventory-types';
import {
  getItemActions,
  canPlayerEquip,
  getWeaponSortOrder,
} from './inventory-types';

interface ItemsMenuWebProps {
  inventory: InventoryItem[];
  playerState: PlayerState;
  maxItems?: number;
  onItemAction?: (item: InventoryItem, action: ItemAction) => void;
}

interface ActionMenuState {
  visible: boolean;
  x: number;
  y: number;
  item: InventoryItem | null;
  actions: ItemActionOption[];
}

const CATEGORIES: { id: ItemCategory; label: string; icon: string }[] = [
  { id: 'usable', label: 'Consumables', icon: '💊' },
  { id: 'weapon', label: 'Weapons', icon: '⚔' },
  { id: 'armor', label: 'Armor & Units', icon: '🛡' },
  { id: 'special', label: 'Special', icon: '✨' },
];

export default function ItemsMenuWeb({
  inventory,
  playerState,
  maxItems = 40,
  onItemAction,
}: ItemsMenuWebProps) {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('usable');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState>({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    actions: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close action menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenu.visible && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenu.visible]);

  // Close action menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && actionMenu.visible) {
        setActionMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [actionMenu.visible]);

  // Sort and filter items
  const filteredItems = inventory
    .filter(item => item.category === selectedCategory)
    .sort((a, b) => {
      if (selectedCategory === 'weapon') {
        return getWeaponSortOrder(a.weaponCategory) - getWeaponSortOrder(b.weaponCategory);
      }
      return 0;
    });

  // Get hovered item for preview panel
  const hoveredItem = hoveredItemId ? inventory.find(i => i.id === hoveredItemId) : null;

  const handleItemClick = (e: React.MouseEvent, item: InventoryItem) => {
    const actions = getItemActions(item, playerState);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Position menu to the right of the item, or left if not enough space
    const menuWidth = 160;
    const menuHeight = actions.length * 40 + 50;

    let x = rect.right + 8;
    let y = rect.top;

    // Adjust if menu would go off screen
    if (x + menuWidth > window.innerWidth) {
      x = rect.left - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 8;
    }
    if (y < 8) {
      y = 8;
    }

    setActionMenu({
      visible: true,
      x,
      y,
      item,
      actions,
    });
  };

  const handleActionClick = (action: ItemActionOption) => {
    if (action.disabled || !actionMenu.item) return;
    onItemAction?.(actionMenu.item, action.action);
    setActionMenu(prev => ({ ...prev, visible: false }));
  };

  const getItemStatus = (item: InventoryItem) => {
    const equipCheck = canPlayerEquip(item, playerState);
    return {
      canEquip: equipCheck.canEquip,
      reason: equipCheck.reason,
      isEquipped: item.isEquipped || false,
    };
  };

  const getCategoryCount = (category: ItemCategory) => {
    return inventory.filter(item => item.category === category).length;
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Inventory</h2>
        <span style={styles.itemCount}>{inventory.length}/{maxItems} items</span>
      </div>

      {/* Category Tabs */}
      <div style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setActionMenu(prev => ({ ...prev, visible: false }));
            }}
            style={{
              ...styles.tab,
              ...(selectedCategory === cat.id ? styles.tabActive : {}),
            }}
          >
            <span style={styles.tabIcon}>{cat.icon}</span>
            <span style={styles.tabLabel}>{cat.label}</span>
            <span style={styles.tabCount}>{getCategoryCount(cat.id)}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Item Grid */}
        <div style={styles.itemGrid}>
          {filteredItems.length === 0 ? (
            <div style={styles.emptyState}>
              No items in this category
            </div>
          ) : (
            filteredItems.map(item => {
              const status = getItemStatus(item);
              const isHovered = hoveredItemId === item.id;
              const isSelected = actionMenu.visible && actionMenu.item?.id === item.id;
              const isGrayedOut = (item.category === 'weapon' || item.category === 'armor') && !status.canEquip;

              return (
                <div
                  key={item.id}
                  onClick={(e) => handleItemClick(e, item)}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  style={{
                    ...styles.itemCard,
                    ...(isHovered && !isSelected ? styles.itemCardHovered : {}),
                    ...(isSelected ? styles.itemCardSelected : {}),
                    ...(isGrayedOut ? styles.itemCardDisabled : {}),
                  }}
                >
                  {/* Status badges */}
                  <div style={styles.badges}>
                    {status.isEquipped && (
                      <span style={styles.equippedBadge}>Equipped</span>
                    )}
                    {!status.canEquip && !status.isEquipped && (item.category === 'weapon' || item.category === 'armor') && (
                      <span style={styles.cantEquipBadge} title={status.reason}>
                        {status.reason}
                      </span>
                    )}
                  </div>

                  {/* Item icon area */}
                  <div style={styles.itemIconArea}>
                    <span style={styles.itemIcon}>
                      {item.category === 'usable' ? '💊' :
                       item.category === 'weapon' ? '⚔' :
                       item.category === 'armor' ? (item.isUnit ? '◇' : '🛡') : '✨'}
                    </span>
                    {item.quantity > 1 && (
                      <span style={styles.quantity}>x{item.quantity}</span>
                    )}
                  </div>

                  {/* Item name */}
                  <div style={styles.itemName}>{item.name}</div>

                  {/* Rarity stars */}
                  <div style={styles.rarity}>
                    {'★'.repeat(Math.min(item.rarity, 5))}
                    {'☆'.repeat(Math.max(0, 5 - item.rarity))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Hover Preview Panel */}
        <div style={styles.previewPanel}>
          {hoveredItem || actionMenu.item ? (
            (() => {
              const displayItem = actionMenu.visible ? actionMenu.item! : hoveredItem!;
              return (
                <>
                  <div style={styles.previewHeader}>
                    <span style={styles.previewName}>{displayItem.name}</span>
                    {displayItem.japaneseName && (
                      <span style={styles.previewJapanese}>{displayItem.japaneseName}</span>
                    )}
                  </div>

                  <div style={styles.previewDescription}>
                    {displayItem.description}
                  </div>

                  <div style={styles.previewStats}>
                    {displayItem.category === 'weapon' && (
                      <>
                        <div style={styles.statRow}>
                          <span>Type</span>
                          <span>{displayItem.weaponType}</span>
                        </div>
                        <div style={styles.statRow}>
                          <span>ATP</span>
                          <span style={styles.statValue}>{displayItem.atp}</span>
                        </div>
                        <div style={styles.statRow}>
                          <span>ATA</span>
                          <span style={styles.statValue}>{displayItem.ata}</span>
                        </div>
                        {displayItem.mst && (
                          <div style={styles.statRow}>
                            <span>MST</span>
                            <span style={styles.statValue}>+{displayItem.mst}</span>
                          </div>
                        )}
                      </>
                    )}

                    {displayItem.category === 'armor' && (
                      <>
                        <div style={styles.statRow}>
                          <span>DFP</span>
                          <span style={styles.statValue}>{displayItem.dfp}</span>
                        </div>
                        <div style={styles.statRow}>
                          <span>EVP</span>
                          <span style={styles.statValue}>{displayItem.evp}</span>
                        </div>
                        {displayItem.slots !== undefined && !displayItem.isUnit && (
                          <div style={styles.statRow}>
                            <span>Slots</span>
                            <span style={styles.statValue}>{displayItem.slots}</span>
                          </div>
                        )}
                      </>
                    )}

                    {displayItem.category === 'usable' && displayItem.maxStack && (
                      <div style={styles.statRow}>
                        <span>Stack</span>
                        <span style={styles.statValue}>{displayItem.quantity}/{displayItem.maxStack}</span>
                      </div>
                    )}

                    {displayItem.requiredLevel && (
                      <div style={styles.statRow}>
                        <span>Required Lv</span>
                        <span style={{
                          ...styles.statValue,
                          color: playerState.level < displayItem.requiredLevel ? '#f66' : '#6f6',
                        }}>
                          {displayItem.requiredLevel}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={styles.previewRarity}>
                    {'★'.repeat(displayItem.rarity)}
                    {'☆'.repeat(Math.max(0, 10 - displayItem.rarity))}
                  </div>
                </>
              );
            })()
          ) : (
            <div style={styles.previewEmpty}>
              <span style={styles.previewEmptyIcon}>👆</span>
              <span>Hover over an item to see details</span>
              <span style={styles.previewEmptyHint}>Click to open actions</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Menu (Popover) */}
      {actionMenu.visible && actionMenu.item && (
        <div
          ref={menuRef}
          style={{
            ...styles.actionMenu,
            left: actionMenu.x,
            top: actionMenu.y,
          }}
        >
          <div style={styles.actionMenuHeader}>
            {actionMenu.item.name}
          </div>
          <div style={styles.actionMenuBody}>
            {actionMenu.actions.map(action => (
              <button
                key={action.action}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                style={{
                  ...styles.actionMenuItem,
                  ...(action.disabled ? styles.actionMenuItemDisabled : {}),
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled) {
                    (e.target as HTMLElement).style.background = 'rgba(107, 138, 253, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={styles.actionMenuIcon}>
                  {action.action === 'use' && '✨'}
                  {action.action === 'equip' && '⬆'}
                  {action.action === 'unequip' && '⬇'}
                  {action.action === 'discard' && '🗑'}
                </span>
                <span style={styles.actionMenuLabel}>{action.label}</span>
                {action.disabled && action.disabledReason && (
                  <span style={styles.actionMenuReason}>{action.disabledReason}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActionMenu(prev => ({ ...prev, visible: false }))}
            style={styles.actionMenuCancel}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(255, 100, 100, 0.1)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'transparent';
            }}
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
    position: 'relative',
    width: '700px',
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
  itemCount: {
    fontSize: '13px',
    color: '#888',
    background: '#252535',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  tabs: {
    display: 'flex',
    background: '#252535',
    borderBottom: '1px solid #3a3a4e',
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 8px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#fff',
    borderBottomColor: '#6b8afd',
    background: 'rgba(107, 138, 253, 0.1)',
  },
  tabIcon: {
    fontSize: '14px',
  },
  tabLabel: {
    fontWeight: 500,
  },
  tabCount: {
    background: '#3a3a4e',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
  },
  content: {
    display: 'flex',
    height: '360px',
  },
  itemGrid: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    alignContent: 'start',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '14px',
  },
  itemCard: {
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
  itemCardHovered: {
    background: '#32324a',
    borderColor: '#4a4a6a',
  },
  itemCardSelected: {
    background: '#3a4a5e',
    borderColor: '#6b8afd',
    boxShadow: '0 0 0 2px rgba(107, 138, 253, 0.3)',
  },
  itemCardDisabled: {
    opacity: 0.5,
  },
  badges: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    right: '4px',
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  equippedBadge: {
    background: '#2d6a4f',
    color: '#95d5b2',
    fontSize: '9px',
    padding: '2px 5px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  cantEquipBadge: {
    background: '#6a2d2d',
    color: '#f5a5a5',
    fontSize: '9px',
    padding: '2px 5px',
    borderRadius: '4px',
  },
  itemIconArea: {
    position: 'relative',
    fontSize: '24px',
    marginTop: '8px',
  },
  itemIcon: {},
  quantity: {
    position: 'absolute',
    bottom: '-4px',
    right: '-8px',
    background: '#6b8afd',
    color: '#fff',
    fontSize: '10px',
    padding: '1px 4px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  itemName: {
    fontSize: '11px',
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.2,
    maxHeight: '26px',
    overflow: 'hidden',
  },
  rarity: {
    fontSize: '8px',
    color: '#ffd700',
    letterSpacing: '-1px',
  },
  previewPanel: {
    width: '220px',
    background: '#252535',
    borderLeft: '1px solid #3a3a4e',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  previewHeader: {
    marginBottom: '12px',
  },
  previewName: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  previewJapanese: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
  },
  previewDescription: {
    fontSize: '12px',
    color: '#aaa',
    lineHeight: 1.5,
    marginBottom: '16px',
    flex: 1,
  },
  previewStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#888',
  },
  statValue: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  previewRarity: {
    fontSize: '12px',
    color: '#ffd700',
    letterSpacing: '1px',
    textAlign: 'center',
  },
  previewEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '8px',
    color: '#555',
    fontSize: '12px',
    textAlign: 'center',
  },
  previewEmptyIcon: {
    fontSize: '32px',
    opacity: 0.5,
  },
  previewEmptyHint: {
    fontSize: '10px',
    color: '#444',
  },
  // Action Menu (Popover)
  actionMenu: {
    position: 'fixed',
    background: '#2a2a3e',
    border: '1px solid #4a4a5e',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    minWidth: '160px',
    zIndex: 1000,
    overflow: 'hidden',
  },
  actionMenuHeader: {
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    background: '#3a3a4e',
    borderBottom: '1px solid #4a4a5e',
  },
  actionMenuBody: {
    padding: '4px 0',
  },
  actionMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  actionMenuItemDisabled: {
    color: '#666',
    cursor: 'not-allowed',
  },
  actionMenuIcon: {
    fontSize: '14px',
    width: '18px',
  },
  actionMenuLabel: {
    flex: 1,
  },
  actionMenuReason: {
    fontSize: '10px',
    color: '#888',
  },
  actionMenuCancel: {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid #3a3a4e',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background 0.1s',
  },
};
