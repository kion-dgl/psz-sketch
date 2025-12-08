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
        className="absolute inset-0 w-screen h-screen bg-black/40 z-[2000] flex items-center justify-center"
      >
        {/* Shop panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1e1428]/95 text-white p-8 rounded-xl font-mono min-w-[500px] max-w-[700px] max-h-[80vh] overflow-auto border-2 border-yellow-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="text-2xl font-bold mb-6 border-b-2 border-yellow-500/30 pb-3 flex justify-between items-center">
            <span>{activeShopNPC}</span>
            <button
              onClick={closeShop}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2 rounded cursor-pointer text-sm font-mono transition-colors"
            >
              Close
            </button>
          </div>

          {/* Gold display */}
          <div className="bg-yellow-500/10 p-3 rounded-md mb-6 border border-yellow-500/30 text-base font-bold text-yellow-400">
            Gold: 1000 {/* TODO: Get from player inventory */}
          </div>

          {/* Items list */}
          <div className="flex flex-col gap-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                No items available
              </div>
            ) : (
              items.map((item, index) => (
                <ShopItemRow key={index} item={item} onBuy={handleBuy} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/20 text-xs text-gray-500 text-center">
            Press ESC to close
          </div>
        </div>
      </div>
    </>
  );
}

function ShopItemRow({ item, onBuy }: { item: ShopItem; onBuy: (item: ShopItem) => void }) {
  return (
    <div className="bg-white/5 p-4 rounded-md border border-white/10 flex justify-between items-center gap-4">
      {/* Item info */}
      <div className="flex-1">
        <div className="text-base font-bold text-yellow-400 mb-1">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 mb-2">
          {item.description}
        </div>
        <div className="text-sm text-orange-500 font-bold">
          {item.price} Gold
        </div>
      </div>

      {/* Buy button */}
      <button
        onClick={() => onBuy(item)}
        className="bg-green-500/80 hover:bg-green-500 text-white border-none px-6 py-3 rounded-md cursor-pointer text-sm font-mono font-bold whitespace-nowrap transition-colors"
      >
        Buy
      </button>
    </div>
  );
}
