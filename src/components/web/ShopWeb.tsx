import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { ShopItem, ShopCategory } from '../../systems/shop/types';
import {
  getShopItems,
  purchaseItem,
  canAfford,
  calculateTotalCost,
  formatPrice,
  initializeDefaultShops,
  SHOP_IDS,
} from '../../systems/shop';

type ShopTab = 'items' | 'weapons' | 'armor';

export default function ShopWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<ShopTab>('items');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

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
        } else {
          window.location.href = '/web/character-select';
        }
      } catch {
        window.location.href = '/web/character-select';
      }
    }
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
      setMessage(`Purchased ${quantity}x ${selectedItem.name}`);
      setQuantity(1);
    } else {
      setMessage(result.message);
    }

    setTimeout(() => setMessage(''), 3000);
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
      <div style={styles.header}>
        <a href="/web/city-hub" style={styles.backButton} data-testid="back-button">
          ← Back to City
        </a>
        <h1 style={styles.title}>SHOP</h1>
        <div style={styles.mesetaDisplay}>
          <span style={styles.mesetaIcon}>💰</span>
          <span style={styles.mesetaAmount} data-testid="meseta-amount">
            {formatPrice(meseta)}
          </span>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div style={styles.content}>
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
                  {'★'.repeat(item.rarity)}
                </span>
              </div>
              <div style={styles.itemPrice} data-testid={`item-price-${item.id}`}>
                {formatPrice(item.price)}
              </div>
            </div>
          ))}
        </div>

        {/* Details Panel */}
        <div style={styles.detailsPanel}>
          {selectedItem ? (
            <div style={styles.details}>
              <h3 style={styles.detailsName}>{selectedItem.name}</h3>
              <div style={styles.detailsRarity}>
                {'★'.repeat(selectedItem.rarity)}{'☆'.repeat(5 - selectedItem.rarity)}
              </div>
              <p style={styles.detailsDescription}>{selectedItem.description}</p>
              <div style={styles.detailsPrice}>
                Price: {formatPrice(selectedItem.price)} Meseta
              </div>
            </div>
          ) : (
            <div style={styles.emptyDetails}>
              Select an item to view details
            </div>
          )}
        </div>
      </div>

      {/* Purchase Section */}
      {selectedItem && (
        <div style={styles.purchaseSection}>
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
      )}

      {/* Message */}
      {message && (
        <div style={styles.message}>{message}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)',
    padding: '2rem',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
    color: 'white',
  },
  loading: {
    fontSize: '0.8rem',
    color: '#6bb8ff',
    textAlign: 'center',
    marginTop: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  backButton: {
    color: '#6bb8ff',
    textDecoration: 'none',
    fontSize: '0.7rem',
  },
  title: {
    fontSize: '1rem',
    color: '#4ade80',
    letterSpacing: '4px',
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(252, 211, 77, 0.1)',
    border: '2px solid #fcd34d',
    borderRadius: '4px',
  },
  mesetaIcon: {
    fontSize: '1rem',
  },
  mesetaAmount: {
    fontSize: '0.7rem',
    color: '#fcd34d',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: '#6bb8ff',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  tabActive: {
    background: 'rgba(107, 184, 255, 0.2)',
    borderColor: '#6bb8ff',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '1rem',
    marginBottom: '1rem',
  },
  itemList: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginBottom: '0.5rem',
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
    gap: '0.25rem',
  },
  itemName: {
    fontSize: '0.7rem',
  },
  itemRarity: {
    fontSize: '0.6rem',
    color: '#fcd34d',
  },
  itemPrice: {
    fontSize: '0.7rem',
    color: '#4ade80',
  },
  detailsPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1rem',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  detailsName: {
    fontSize: '0.8rem',
    color: '#ffffff',
    margin: 0,
  },
  detailsRarity: {
    fontSize: '0.7rem',
    color: '#fcd34d',
  },
  detailsDescription: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
    lineHeight: '1.5',
  },
  detailsPrice: {
    fontSize: '0.7rem',
    color: '#4ade80',
  },
  emptyDetails: {
    fontSize: '0.6rem',
    color: '#4a6a8a',
    textAlign: 'center',
    padding: '2rem',
  },
  purchaseSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    background: '#2d4a6a',
    border: '2px solid #6bb8ff',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  quantityInput: {
    width: '60px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    textAlign: 'center',
  },
  totalCost: {
    fontSize: '0.7rem',
    color: '#fcd34d',
  },
  buyButton: {
    padding: '0.75rem 2rem',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    cursor: 'pointer',
    letterSpacing: '2px',
  },
  buyButtonDisabled: {
    background: '#3a3a4e',
    borderColor: '#555',
    color: '#666',
    cursor: 'not-allowed',
  },
  message: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem 2rem',
    background: 'rgba(74, 222, 128, 0.9)',
    borderRadius: '4px',
    color: '#1a1a1a',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
};
