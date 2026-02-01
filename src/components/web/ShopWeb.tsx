/**
 * ShopWeb - Shop interface with inventory and transaction state
 * Shows shop items, character inventory, and purchase history
 */

import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { ShopItem } from '../../systems/shop/types';
import type { InventorySlot } from '../../systems/inventory/types';
import {
  getShopItems,
  purchaseItem,
  canAfford,
  calculateTotalCost,
  formatPrice,
  initializeDefaultShops,
  SHOP_IDS,
} from '../../systems/shop';
import { getInventory, addItem, saveInventory } from '../../systems/inventory/inventory';

type ShopTab = 'items' | 'weapons' | 'armor';

interface Transaction {
  id: number;
  type: 'buy' | 'sell';
  itemName: string;
  quantity: number;
  total: number;
  timestamp: Date;
}

export default function ShopWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<ShopTab>('items');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionCounter, setTransactionCounter] = useState(0);
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [viewMode, setViewMode] = useState<'shop' | 'inventory'>('shop');

  useEffect(() => {
    initializeDefaultShops();
    loadSelectedCharacter();
  }, []);

  const loadSelectedCharacter = () => {
    const selectedId = localStorage.getItem('selectedCharacterId');
    if (!selectedId) {
      window.location.href = '/web/character-select';
      return;
    }

    const stored = localStorage.getItem('characters');
    if (stored) {
      try {
        const characters = JSON.parse(stored);
        const found = characters.find((c: Character | null) =>
          c?.character_id === selectedId
        );
        if (found) {
          setCharacter(found);
          loadInventory(found.character_id);
        } else {
          window.location.href = '/web/character-select';
        }
      } catch {
        window.location.href = '/web/character-select';
      }
    }
  };

  const loadInventory = (characterId: string) => {
    const inv = getInventory(characterId);
    setInventory(inv.items);
  };

  const getShopId = () => {
    switch (activeTab) {
      case 'items': return SHOP_IDS.ITEM_SHOP;
      case 'weapons': return SHOP_IDS.WEAPON_SHOP;
      default: return SHOP_IDS.ITEM_SHOP;
    }
  };

  const getCurrentItems = (): ShopItem[] => {
    return getShopItems(getShopId());
  };

  const addTransaction = (type: 'buy' | 'sell', itemName: string, qty: number, total: number) => {
    setTransactionCounter(prev => {
      const newId = prev + 1;
      setTransactions(txs => [...txs.slice(-20), {
        id: newId,
        type,
        itemName,
        quantity: qty,
        total,
        timestamp: new Date(),
      }]);
      return newId;
    });
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePurchase = () => {
    if (!character || !selectedItem) return;

    const meseta = character.meseta ?? 0;
    const result = purchaseItem(getShopId(), selectedItem.id, quantity, meseta);

    if (result.success) {
      // Update character's meseta
      const stored = localStorage.getItem('characters');
      if (stored) {
        const characters = JSON.parse(stored);
        const index = characters.findIndex((c: Character | null) =>
          c?.character_id === character.character_id
        );
        if (index !== -1) {
          characters[index] = {
            ...characters[index],
            meseta: result.remainingMeseta,
          };
          localStorage.setItem('characters', JSON.stringify(characters));
          setCharacter(prev => prev ? { ...prev, meseta: result.remainingMeseta } : null);
        }
      }

      // Add to inventory
      const inv = getInventory(character.character_id);
      const gameItem = {
        id: selectedItem.id,
        name: selectedItem.name,
        description: selectedItem.description,
        type: 'consumable' as const,
        rarity: selectedItem.rarity,
        sellPrice: selectedItem.sellPrice,
        stackable: true,
        maxStack: 10,
        effect: 'heal_hp',
        effectValue: 100,
      };
      addItem(inv, gameItem, quantity);
      loadInventory(character.character_id);

      addTransaction('buy', selectedItem.name, quantity, result.totalCost ?? 0);
      showMessage(`Purchased ${quantity}x ${selectedItem.name}`, 'success');
      setQuantity(1);
    } else {
      showMessage(result.message, 'error');
    }
  };

  if (!character) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  const currentItems = getCurrentItems();
  const meseta = character.meseta ?? 0;
  const totalCost = selectedItem ? calculateTotalCost(selectedItem, quantity) : 0;

  return (
    <div style={styles.container} data-testid="shop">
      {/* Header */}
      <header style={styles.header}>
        <a href="/web/city-hub" style={styles.backButton} data-testid="back-button">
          ← Back to City
        </a>
        <h1 style={styles.title}>ITEM SHOP</h1>
        <div style={styles.mesetaDisplay}>
          <span style={styles.mesetaIcon}>💰</span>
          <span style={styles.mesetaAmount} data-testid="meseta-amount">
            {formatPrice(meseta)}
          </span>
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* Left Panel - Character & Inventory */}
        <aside style={styles.leftPanel} data-testid="character-panel">
          <div style={styles.characterInfo}>
            <h3 style={styles.panelTitle}>Character</h3>
            <div style={styles.charDetails}>
              <div data-testid="char-name">{character.character_name}</div>
              <div style={styles.charClass} data-testid="char-class">{character.class_id}</div>
              <div style={styles.charLevel} data-testid="char-level">Lv. {character.level}</div>
            </div>
          </div>

          <div style={styles.inventorySection}>
            <h3 style={styles.panelTitle}>Inventory ({inventory.length})</h3>
            <div style={styles.inventoryList} data-testid="inventory-list">
              {inventory.length > 0 ? (
                inventory.map((slot, i) => (
                  <div key={i} style={styles.inventoryItem} data-testid={`inv-item-${slot.item.id}`}>
                    <span style={styles.invItemName}>{slot.item.name}</span>
                    <span style={styles.invItemQty}>x{slot.quantity}</span>
                  </div>
                ))
              ) : (
                <div style={styles.emptyInventory}>No items</div>
              )}
            </div>
          </div>
        </aside>

        {/* Center - Shop */}
        <main style={styles.shopArea}>
          {/* Category Tabs */}
          <div style={styles.tabs}>
            {(['items', 'weapons'] as ShopTab[]).map(tab => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.tabActive : {}),
                }}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedItem(null);
                }}
                data-testid={`shop-tab-${tab}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Shop Content */}
          <div style={styles.shopContent}>
            {/* Item List */}
            <div style={styles.itemList}>
              {currentItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    ...styles.itemRow,
                    ...(selectedItem?.id === item.id ? styles.itemRowSelected : {}),
                    ...(!canAfford(meseta, item) ? styles.itemRowUnaffordable : {}),
                  }}
                  onClick={() => {
                    setSelectedItem(item);
                    setQuantity(1);
                  }}
                  data-testid={`shop-item-${item.id}`}
                >
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemRarity}>
                      {'★'.repeat(item.rarity)}{'☆'.repeat(5 - item.rarity)}
                    </span>
                  </div>
                  <div style={styles.itemPrice} data-testid={`item-price-${item.id}`}>
                    {formatPrice(item.price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Item Details */}
            <div style={styles.detailsPanel}>
              {selectedItem ? (
                <div style={styles.details} data-testid="item-details">
                  <h3 style={styles.detailsName}>{selectedItem.name}</h3>
                  <div style={styles.detailsRarity}>
                    {'★'.repeat(selectedItem.rarity)}{'☆'.repeat(5 - selectedItem.rarity)}
                  </div>
                  <p style={styles.detailsDescription}>{selectedItem.description}</p>
                  <div style={styles.priceInfo}>
                    <div style={styles.priceRow}>
                      <span>Buy Price:</span>
                      <span style={styles.buyPrice}>{formatPrice(selectedItem.price)}</span>
                    </div>
                    <div style={styles.priceRow}>
                      <span>Sell Price:</span>
                      <span style={styles.sellPrice}>{formatPrice(selectedItem.sellPrice)}</span>
                    </div>
                  </div>

                  {/* Purchase Controls */}
                  <div style={styles.purchaseControls}>
                    <div style={styles.quantityControl}>
                      <button
                        style={styles.quantityButton}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        data-testid="quantity-decrease"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        style={styles.quantityInput}
                        data-testid="quantity-input"
                      />
                      <button
                        style={styles.quantityButton}
                        onClick={() => setQuantity(q => q + 1)}
                        data-testid="quantity-increase"
                      >
                        +
                      </button>
                    </div>

                    <div style={styles.totalCost} data-testid="total-cost">
                      Total: {formatPrice(totalCost)} Meseta
                    </div>

                    <button
                      style={{
                        ...styles.buyButton,
                        ...(canAfford(meseta, selectedItem, quantity) ? {} : styles.buyButtonDisabled),
                      }}
                      onClick={handlePurchase}
                      disabled={!canAfford(meseta, selectedItem, quantity)}
                      data-testid="buy-button"
                    >
                      {canAfford(meseta, selectedItem, quantity) ? 'BUY' : 'NOT ENOUGH MESETA'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyDetails}>
                  Select an item to view details
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel - Transaction History */}
        <aside style={styles.rightPanel} data-testid="transaction-panel">
          <h3 style={styles.panelTitle}>Transaction Log</h3>
          <div style={styles.transactionList}>
            {transactions.length > 0 ? (
              [...transactions].reverse().map(tx => (
                <div
                  key={tx.id}
                  style={{
                    ...styles.transaction,
                    borderLeft: `3px solid ${tx.type === 'buy' ? '#e94560' : '#4ecca3'}`,
                  }}
                  data-testid={`transaction-${tx.id}`}
                >
                  <div style={styles.txHeader}>
                    <span style={{ color: tx.type === 'buy' ? '#e94560' : '#4ecca3' }}>
                      {tx.type === 'buy' ? 'BOUGHT' : 'SOLD'}
                    </span>
                    <span style={styles.txTime}>
                      {tx.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={styles.txDetails}>
                    {tx.quantity}x {tx.itemName}
                  </div>
                  <div style={styles.txTotal}>
                    {tx.type === 'buy' ? '-' : '+'}{formatPrice(tx.total)}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noTransactions}>No transactions yet</div>
            )}
          </div>

          <div style={styles.sessionStats}>
            <h4 style={styles.statsTitle}>Session Stats</h4>
            <div style={styles.statRow}>
              <span>Items Bought:</span>
              <span data-testid="stat-items-bought">
                {transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.quantity, 0)}
              </span>
            </div>
            <div style={styles.statRow}>
              <span>Meseta Spent:</span>
              <span style={{ color: '#e94560' }} data-testid="stat-meseta-spent">
                {formatPrice(transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.total, 0))}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Message Toast */}
      {message && (
        <div
          style={{
            ...styles.message,
            background: messageType === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(248, 113, 113, 0.9)',
          }}
          data-testid="message-toast"
        >
          {message}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#1a1a2e',
    fontFamily: 'monospace',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    fontSize: '14px',
    color: '#6bb8ff',
    textAlign: 'center',
    marginTop: '32px',
  },
  header: {
    padding: '16px 24px',
    background: '#16213e',
    borderBottom: '2px solid #0f3460',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#6bb8ff',
    textDecoration: 'none',
    fontSize: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#4ade80',
    letterSpacing: '4px',
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(252, 211, 77, 0.1)',
    border: '2px solid #fcd34d',
    borderRadius: '4px',
  },
  mesetaIcon: {
    fontSize: '16px',
  },
  mesetaAmount: {
    fontSize: '14px',
    color: '#fcd34d',
    fontWeight: 'bold',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    width: '240px',
    padding: '16px',
    background: '#16213e',
    borderRight: '2px solid #0f3460',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  panelTitle: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    color: '#e94560',
    textTransform: 'uppercase',
    borderBottom: '1px solid #3a5a8a',
    paddingBottom: '8px',
  },
  characterInfo: {
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  charDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
  },
  charClass: {
    color: '#6bb8ff',
  },
  charLevel: {
    color: '#888',
    fontSize: '11px',
  },
  inventorySection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  inventoryList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inventoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '2px',
    fontSize: '11px',
  },
  invItemName: {
    color: '#aaa',
  },
  invItemQty: {
    color: '#666',
  },
  emptyInventory: {
    color: '#666',
    fontSize: '11px',
    textAlign: 'center',
    padding: '16px',
  },
  shopArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    background: '#1f4068',
    borderBottom: '1px solid #0f3460',
  },
  tab: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: '#6bb8ff',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  tabActive: {
    background: 'rgba(107, 184, 255, 0.2)',
    borderColor: '#6bb8ff',
  },
  shopContent: {
    flex: 1,
    display: 'flex',
    padding: '16px',
    gap: '16px',
    overflow: 'hidden',
  },
  itemList: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '12px',
    overflowY: 'auto',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginBottom: '8px',
    cursor: 'pointer',
    border: '2px solid transparent',
  },
  itemRowSelected: {
    borderColor: '#4ade80',
    background: 'rgba(74, 222, 128, 0.1)',
  },
  itemRowUnaffordable: {
    opacity: 0.5,
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemName: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  itemRarity: {
    fontSize: '10px',
    color: '#fcd34d',
  },
  itemPrice: {
    fontSize: '12px',
    color: '#4ade80',
    fontWeight: 'bold',
  },
  detailsPanel: {
    width: '280px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
  },
  detailsName: {
    margin: 0,
    fontSize: '14px',
    color: '#ffffff',
  },
  detailsRarity: {
    fontSize: '12px',
    color: '#fcd34d',
  },
  detailsDescription: {
    margin: 0,
    fontSize: '11px',
    color: '#a6c9ff',
    lineHeight: '1.5',
  },
  priceInfo: {
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    marginBottom: '4px',
  },
  buyPrice: {
    color: '#e94560',
  },
  sellPrice: {
    color: '#4ecca3',
  },
  purchaseControls: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    background: '#2d4a6a',
    border: '2px solid #6bb8ff',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '16px',
    cursor: 'pointer',
  },
  quantityInput: {
    width: '60px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '14px',
    textAlign: 'center',
  },
  totalCost: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#fcd34d',
  },
  buyButton: {
    padding: '12px',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  buyButtonDisabled: {
    background: '#3a3a4e',
    borderColor: '#555',
    color: '#666',
    cursor: 'not-allowed',
  },
  emptyDetails: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#4a6a8a',
  },
  rightPanel: {
    width: '260px',
    padding: '16px',
    background: '#16213e',
    borderLeft: '2px solid #0f3460',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  transactionList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  transaction: {
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  txHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    marginBottom: '4px',
  },
  txTime: {
    color: '#666',
  },
  txDetails: {
    fontSize: '11px',
    color: '#aaa',
  },
  txTotal: {
    fontSize: '11px',
    color: '#fcd34d',
    marginTop: '4px',
  },
  noTransactions: {
    color: '#666',
    fontSize: '11px',
    textAlign: 'center',
    padding: '24px',
  },
  sessionStats: {
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  statsTitle: {
    margin: '0 0 12px 0',
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    marginBottom: '8px',
  },
  message: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '4px',
    color: '#1a1a1a',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 1000,
  },
};
