/**
 * ShopWeb - Simple shop UI that mirrors CLI commands
 * Shows items in a list with direct buy buttons
 */

import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { ShopItem } from '../../systems/shop/types';
import {
  getShopItems,
  purchaseItem,
  canAfford,
  formatPrice,
  initializeDefaultShops,
  SHOP_IDS,
} from '../../systems/shop';
import { getInventory, addItem } from '../../systems/inventory/inventory';

type ShopTab = 'items' | 'weapons';

export default function ShopWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<ShopTab>('items');
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
    return activeTab === 'weapons' ? SHOP_IDS.WEAPON_SHOP : SHOP_IDS.ITEM_SHOP;
  };

  const handleBuy = (item: ShopItem) => {
    if (!character) return;

    const meseta = character.meseta ?? 0;
    const result = purchaseItem(getShopId(), item.id, 1, meseta);

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
        id: item.id,
        name: item.name,
        description: item.description,
        type: 'consumable' as const,
        rarity: item.rarity,
        sellPrice: item.sellPrice,
        stackable: true,
        maxStack: 10,
        effect: 'heal_hp',
        effectValue: 100,
      };
      addItem(inv, gameItem, 1);

      setMessage(`Bought ${item.name}`);
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage(result.message);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (!character) {
    return <div style={styles.container}>Loading...</div>;
  }

  const items = getShopItems(getShopId());
  const meseta = character.meseta ?? 0;

  return (
    <div style={styles.container} data-testid="shop">
      {/* Header */}
      <div style={styles.header}>
        <a href="/web/city-hub" style={styles.back} data-testid="back-button">← Back</a>
        <span style={styles.title}>SHOP</span>
        <span style={styles.meseta} data-testid="meseta-amount">{formatPrice(meseta)} meseta</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'items' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('items')}
          data-testid="shop-tab-items"
        >
          Items
        </button>
        <button
          style={activeTab === 'weapons' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('weapons')}
          data-testid="shop-tab-weapons"
        >
          Weapons
        </button>
      </div>

      {/* Item List */}
      <div style={styles.list}>
        <div style={styles.listHeader}>
          <span style={styles.colId}>ID</span>
          <span style={styles.colName}>Name</span>
          <span style={styles.colPrice}>Price</span>
          <span style={styles.colAction}></span>
        </div>
        {items.map(item => {
          const affordable = canAfford(meseta, item);
          return (
            <div
              key={item.id}
              style={styles.row}
              data-testid={`shop-item-${item.id}`}
            >
              <span style={styles.colId}>{item.id}</span>
              <span style={styles.colName}>{item.name}</span>
              <span style={styles.colPrice}>{formatPrice(item.price)}</span>
              <button
                style={affordable ? styles.buyBtn : styles.buyBtnDisabled}
                onClick={() => handleBuy(item)}
                disabled={!affordable}
                data-testid={`buy-${item.id}`}
              >
                Buy
              </button>
            </div>
          );
        })}
      </div>

      {/* Message */}
      {message && (
        <div style={styles.message} data-testid="message-toast">{message}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#1a1a2e',
    fontFamily: 'monospace',
    color: '#ccc',
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  back: {
    color: '#6bf',
    textDecoration: 'none',
  },
  title: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  meseta: {
    color: '#fcd34d',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tab: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #444',
    color: '#888',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  tabActive: {
    padding: '8px 16px',
    background: '#333',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  list: {
    border: '1px solid #333',
    borderRadius: '4px',
  },
  listHeader: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 100px 60px',
    padding: '8px 12px',
    background: '#252540',
    borderBottom: '1px solid #333',
    fontSize: '12px',
    color: '#888',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 100px 60px',
    padding: '8px 12px',
    borderBottom: '1px solid #222',
    alignItems: 'center',
  },
  colId: {
    color: '#666',
    fontSize: '12px',
  },
  colName: {
    color: '#fff',
  },
  colPrice: {
    color: '#4ade80',
    textAlign: 'right',
  },
  colAction: {},
  buyBtn: {
    padding: '4px 12px',
    background: '#2d6a4a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  buyBtnDisabled: {
    padding: '4px 12px',
    background: '#333',
    border: '1px solid #555',
    color: '#555',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'not-allowed',
    borderRadius: '2px',
  },
  message: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    background: '#4ade80',
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
  },
};
