/**
 * Shop Menu Component
 *
 * Displays when interacting with shop NPCs. Shows items available for
 * purchase/sale. Overlays the game without blocking the view entirely.
 */

import { useEffect } from 'react';
import { useGameState } from '../../stores/gameStateStore';

// Mock shop inventory - will be replaced with real data later
const SHOP_INVENTORY: Record<string, ShopItem[]> = {
  'Item Storage': [
    { name: 'Health Potion', price: 50, description: 'Restores 50 HP' },
    { name: 'Mana Potion', price: 40, description: 'Restores 30 MP' },
    { name: 'Antidote', price: 30, description: 'Cures poison' },
  ],
  'Quest Counter': [
    { name: 'Iron Sword', price: 200, description: 'ATK +10' },
    { name: 'Leather Armor', price: 150, description: 'DEF +8' },
    { name: 'Magic Ring', price: 300, description: 'MP +20' },
  ],
  'Weapon Shop': [
    { name: 'Steel Sword', price: 500, description: 'ATK +20' },
    { name: 'Battle Axe', price: 600, description: 'ATK +25, SPD -5' },
    { name: 'Magic Staff', price: 550, description: 'MATK +22' },
  ],
};

interface ShopItem {
  name: string;
  price: number;
  description: string;
}

export default function ShopMenu() {
  const { activeShopNPC, closeShop } = useGameState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeShopNPC) {
        e.preventDefault();
        closeShop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeShopNPC, closeShop]);

  if (!activeShopNPC) return null;

  const items = SHOP_INVENTORY[activeShopNPC] || [];

  const handleBuy = (item: ShopItem) => {
    // TODO: Implement actual purchase logic
  };

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        onClick={closeShop}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Shop panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(30, 20, 40, 0.95)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            fontFamily: 'monospace',
            minWidth: '500px',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            borderBottom: '2px solid rgba(255, 215, 0, 0.3)',
            paddingBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{activeShopNPC}</span>
            <button
              onClick={closeShop}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              Close
            </button>
          </div>

          {/* Gold display */}
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ffd700'
          }}>
            Gold: 1000 {/* TODO: Get from player inventory */}
          </div>

          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                No items available
              </div>
            ) : (
              items.map((item, index) => (
                <ShopItemRow key={index} item={item} onBuy={handleBuy} />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
            color: '#888',
            textAlign: 'center'
          }}>
            Press ESC to close
          </div>
        </div>
      </div>
    </>
  );
}

function ShopItemRow({ item, onBuy }: { item: ShopItem; onBuy: (item: ShopItem) => void }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '1rem',
      borderRadius: '6px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem'
    }}>
      {/* Item info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ffd700',
          marginBottom: '4px'
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
          {item.description}
        </div>
        <div style={{ fontSize: '14px', color: '#f39c12', fontWeight: 'bold' }}>
          {item.price} Gold
        </div>
      </div>

      {/* Buy button */}
      <button
        onClick={() => onBuy(item)}
        style={{
          background: 'rgba(46, 204, 113, 0.8)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(46, 204, 113, 1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(46, 204, 113, 0.8)'}
      >
        Buy
      </button>
    </div>
  );
}
