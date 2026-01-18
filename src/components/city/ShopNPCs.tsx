import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import ShopNPC, { type ShopData } from './ShopNPC';
import { useCollision } from '../../collision';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  rarity: number;
}

export interface ActiveShopState {
  shopData: ShopData;
  playerMeseta: number;
  onPurchase: (item: ShopItem, quantity: number) => void;
  onClose: () => void;
}

interface ShopPresets {
  itemShop: {
    baseItems: ShopItem[];
  };
  weaponShop: {
    presets: { name: string; weapons: any[] }[];
  };
}

const NPC_MODELS = {
  weaponShop: '/objects/special_c1/np_002_00_0.imd/np_002_00_0.glb',
  itemShop: '/objects/special_c1/np_003_00_0.imd/np_003_00_0.glb',
  customShop: '/objects/special_c1/np_004_00_0.imd/np_004_00_0.glb',
};

// Regular NPC without shop functionality (for Custom Shop until implemented)
function RegularNPC({ position, name, modelPath }: { position: [number, number, number]; name: string; modelPath: string }) {
  const { registerNPC } = useCollision();
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Register NPC with collision system
  useState(() => {
    const unregister = registerNPC({
      id: `npc-${name}`,
      name,
      position: { x: position[0], z: position[2] },
      radius: 0.5
    });
    return unregister;
  });

  return (
    <group position={position}>
      <primitive object={clonedScene} position={[0, -1, 0]} />
    </group>
  );
}

interface ShopNPCsProps {
  onActiveShopChange?: (activeShop: ActiveShopState | null) => void;
}

export default function ShopNPCs({ onActiveShopChange }: ShopNPCsProps) {
  const [shopData, setShopData] = useState<ShopPresets | null>(null);
  const [playerMeseta, setPlayerMeseta] = useState(50000);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/shop-presets.json')
      .then(res => res.json())
      .then(data => setShopData(data))
      .catch(console.error);
  }, []);

  const handleItemPurchase = useCallback((item: ShopItem, quantity: number) => {
    const total = item.price * quantity;
    setPlayerMeseta(prev => {
      if (prev >= total) {
        console.log(`Purchased ${quantity}x ${item.name} for ${total} Meseta`);
        return prev - total;
      }
      return prev;
    });
  }, []);

  const handleWeaponPurchase = useCallback((item: ShopItem, quantity: number) => {
    setPlayerMeseta(prev => {
      if (prev >= item.price) {
        console.log(`Purchased ${item.name} for ${item.price} Meseta`);
        return prev - item.price;
      }
      return prev;
    });
  }, []);

  const handleCloseShop = useCallback(() => {
    setActiveShopId(null);
  }, []);

  const handleItemShopStateChange = useCallback((isOpen: boolean, data: ShopData | null) => {
    if (isOpen && data) {
      setActiveShopId('item');
      onActiveShopChange?.({
        shopData: data,
        playerMeseta,
        onPurchase: handleItemPurchase,
        onClose: handleCloseShop,
      });
    } else if (activeShopId === 'item') {
      setActiveShopId(null);
      onActiveShopChange?.(null);
    }
  }, [playerMeseta, handleItemPurchase, handleCloseShop, onActiveShopChange, activeShopId]);

  const handleWeaponShopStateChange = useCallback((isOpen: boolean, data: ShopData | null) => {
    if (isOpen && data) {
      setActiveShopId('weapon');
      onActiveShopChange?.({
        shopData: data,
        playerMeseta,
        onPurchase: handleWeaponPurchase,
        onClose: handleCloseShop,
      });
    } else if (activeShopId === 'weapon') {
      setActiveShopId(null);
      onActiveShopChange?.(null);
    }
  }, [playerMeseta, handleWeaponPurchase, handleCloseShop, onActiveShopChange, activeShopId]);

  // Update parent when playerMeseta changes while shop is open
  useEffect(() => {
    if (activeShopId && shopData) {
      const items = activeShopId === 'item'
        ? shopData.itemShop.baseItems
        : shopData.weaponShop.presets[0].weapons.map(w => ({
            id: w.id,
            name: w.name,
            price: w.price,
            description: `${w.type} - ATP: ${w.atp}, ATA: ${w.ata}`,
            rarity: w.rarity,
          }));

      onActiveShopChange?.({
        shopData: {
          name: activeShopId === 'item' ? 'Item Shop' : 'Weapon Shop',
          shopType: activeShopId as 'item' | 'weapon',
          items,
        },
        playerMeseta,
        onPurchase: activeShopId === 'item' ? handleItemPurchase : handleWeaponPurchase,
        onClose: handleCloseShop,
      });
    }
  }, [playerMeseta, activeShopId, shopData, handleItemPurchase, handleWeaponPurchase, handleCloseShop, onActiveShopChange]);

  if (!shopData) return null;

  // Use base items for item shop
  const itemShopItems = shopData.itemShop.baseItems;

  // Use first weapon preset for demo
  const weaponShopItems = shopData.weaponShop.presets[0].weapons.map(w => ({
    id: w.id,
    name: w.name,
    price: w.price,
    description: `${w.type} - ATP: ${w.atp}, ATA: ${w.ata}`,
    rarity: w.rarity,
  }));

  return (
    <>
      <ShopNPC
        position={[-10.34, 1, 27.67]}
        name="Item Shop"
        modelPath={NPC_MODELS.itemShop}
        shopType="item"
        items={itemShopItems}
        playerMeseta={playerMeseta}
        onPurchase={handleItemPurchase}
        onShopStateChange={handleItemShopStateChange}
      />

      <ShopNPC
        position={[-6.78, 1, 21.81]}
        name="Weapon Shop"
        modelPath={NPC_MODELS.weaponShop}
        shopType="weapon"
        items={weaponShopItems}
        playerMeseta={playerMeseta}
        onPurchase={handleWeaponPurchase}
        onShopStateChange={handleWeaponShopStateChange}
      />

      {/* Custom Shop - not yet interactive */}
      <RegularNPC
        position={[6.25, 1, 23.45]}
        name="Custom Shop"
        modelPath={NPC_MODELS.customShop}
      />
    </>
  );
}

// Preload all NPC models
Object.values(NPC_MODELS).forEach(path => useGLTF.preload(path));
