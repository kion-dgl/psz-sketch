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

interface ContextMenuState {
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
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    actions: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  // Close context menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [contextMenu.visible]);

  // Sort and filter items
  const filteredItems = inventory
    .filter(item => item.category === selectedCategory)
    .sort((a, b) => {
      if (selectedCategory === 'weapon') {
        return getWeaponSortOrder(a.weaponCategory) - getWeaponSortOrder(b.weaponCategory);
      }
      return 0;
    });

  const handleContextMenu = (e: React.MouseEvent, item: InventoryItem) => {
    e.preventDefault();
    const actions = getItemActions(item, playerState);

    // Position context menu within viewport
    const x = Math.min(e.clientX, window.innerWidth - 160);
    const y = Math.min(e.clientY, window.innerHeight - (actions.length * 36 + 20));

    setContextMenu({
      visible: true,
      x,
      y,
      item,
      actions,
    });
  };

  const handleActionClick = (action: ItemActionOption) => {
    if (action.disabled || !contextMenu.item) return;
    onItemAction?.(contextMenu.item, action.action);
    setContextMenu(prev => ({ ...prev, visible: false }));
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
            onClick={() => setSelectedCategory(cat.id)}
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
              const isHovered = hoveredItem?.id === item.id;
              const isGrayedOut = (item.category === 'weapon' || item.category === 'armor') && !status.canEquip;

              return (
                <div
                  key={item.id}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    ...styles.itemCard,
                    ...(isHovered ? styles.itemCardHovered : {}),
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

                  {/* Right-click hint */}
                  <div style={styles.contextHint}>Right-click for options</div>
                </div>
              );
            })
          )}
        </div>

        {/* Hover Preview Panel */}
        <div style={styles.previewPanel}>
          {hoveredItem ? (
            <>
              <div style={styles.previewHeader}>
                <span style={styles.previewName}>{hoveredItem.name}</span>
                {hoveredItem.japaneseName && (
                  <span style={styles.previewJapanese}>{hoveredItem.japaneseName}</span>
                )}
              </div>

              <div style={styles.previewDescription}>
                {hoveredItem.description}
              </div>

              <div style={styles.previewStats}>
                {hoveredItem.category === 'weapon' && (
                  <>
                    <div style={styles.statRow}>
                      <span>Type</span>
                      <span>{hoveredItem.weaponType}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span>ATP</span>
                      <span style={styles.statValue}>{hoveredItem.atp}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span>ATA</span>
                      <span style={styles.statValue}>{hoveredItem.ata}</span>
                    </div>
                    {hoveredItem.mst && (
                      <div style={styles.statRow}>
                        <span>MST</span>
                        <span style={styles.statValue}>+{hoveredItem.mst}</span>
                      </div>
                    )}
                  </>
                )}

                {hoveredItem.category === 'armor' && (
                  <>
                    <div style={styles.statRow}>
                      <span>DFP</span>
                      <span style={styles.statValue}>{hoveredItem.dfp}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span>EVP</span>
                      <span style={styles.statValue}>{hoveredItem.evp}</span>
                    </div>
                    {hoveredItem.slots !== undefined && !hoveredItem.isUnit && (
                      <div style={styles.statRow}>
                        <span>Slots</span>
                        <span style={styles.statValue}>{hoveredItem.slots}</span>
                      </div>
                    )}
                  </>
                )}

                {hoveredItem.category === 'usable' && hoveredItem.maxStack && (
                  <div style={styles.statRow}>
                    <span>Stack</span>
                    <span style={styles.statValue}>{hoveredItem.quantity}/{hoveredItem.maxStack}</span>
                  </div>
                )}

                {hoveredItem.requiredLevel && (
                  <div style={styles.statRow}>
                    <span>Required Lv</span>
                    <span style={{
                      ...styles.statValue,
                      color: playerState.level < hoveredItem.requiredLevel ? '#f66' : '#6f6',
                    }}>
                      {hoveredItem.requiredLevel}
                    </span>
                  </div>
                )}
              </div>

              <div style={styles.previewRarity}>
                {'★'.repeat(hoveredItem.rarity)}
                {'☆'.repeat(Math.max(0, 10 - hoveredItem.rarity))}
              </div>
            </>
          ) : (
            <div style={styles.previewEmpty}>
              <span style={styles.previewEmptyIcon}>👆</span>
              <span>Hover over an item to see details</span>
              <span style={styles.previewEmptyHint}>Right-click for actions</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.item && (
        <div
          style={{
            ...styles.contextMenu,
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.contextMenuHeader}>
            {contextMenu.item.name}
          </div>
          {contextMenu.actions.map(action => (
            <button
              key={action.action}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              style={{
                ...styles.contextMenuItem,
                ...(action.disabled ? styles.contextMenuItemDisabled : {}),
              }}
            >
              <span style={styles.contextMenuIcon}>
                {action.action === 'use' && '✨'}
                {action.action === 'equip' && '⬆'}
                {action.action === 'unequip' && '⬇'}
                {action.action === 'discard' && '🗑'}
              </span>
              <span>{action.label}</span>
              {action.disabled && action.disabledReason && (
                <span style={styles.contextMenuReason}>{action.disabledReason}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
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
    border: '1px solid #3a3a4e',
    cursor: 'context-menu',
    transition: 'all 0.15s',
  },
  itemCardHovered: {
    background: '#3a3a4e',
    borderColor: '#6b8afd',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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
  contextHint: {
    position: 'absolute',
    bottom: '4px',
    fontSize: '8px',
    color: '#555',
    opacity: 0,
    transition: 'opacity 0.2s',
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
  // Context Menu
  contextMenu: {
    position: 'fixed',
    background: '#2a2a3e',
    border: '1px solid #4a4a5e',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    minWidth: '150px',
    zIndex: 1000,
    overflow: 'hidden',
  },
  contextMenuHeader: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    background: '#3a3a4e',
    borderBottom: '1px solid #4a4a5e',
  },
  contextMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  contextMenuItemDisabled: {
    color: '#666',
    cursor: 'not-allowed',
  },
  contextMenuIcon: {
    fontSize: '14px',
  },
  contextMenuReason: {
    marginLeft: 'auto',
    fontSize: '10px',
    color: '#888',
  },
};

// Add hover effect for context menu items via CSS-in-JS workaround
const styleSheet = typeof document !== 'undefined' ? document.createElement('style') : null;
if (styleSheet) {
  styleSheet.textContent = `
    .items-menu-web-context-item:hover:not(:disabled) {
      background: rgba(107, 138, 253, 0.2) !important;
    }
    .items-menu-web-item:hover .context-hint {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
