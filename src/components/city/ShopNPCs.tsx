import { useState, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import ShopNPC from './ShopNPC';
import { useCollision } from '../../collision';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  rarity: number;
}

interface ShopPresets {
  itemShop: {
    baseItems: ShopItem[];
    presets: { name: string; premiumItems: ShopItem[] }[];
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

export default function ShopNPCs() {
  const [shopData, setShopData] = useState<ShopPresets | null>(null);
  const [playerMeseta, setPlayerMeseta] = useState(50000);

  useEffect(() => {
    fetch('/data/shop-presets.json')
      .then(res => res.json())
      .then(data => setShopData(data))
      .catch(console.error);
  }, []);

  const handleItemPurchase = (item: ShopItem, quantity: number) => {
    const total = item.price * quantity;
    if (playerMeseta >= total) {
      setPlayerMeseta(prev => prev - total);
      console.log(`Purchased ${quantity}x ${item.name} for ${total} Meseta`);
    }
  };

  const handleWeaponPurchase = (item: ShopItem, quantity: number) => {
    if (playerMeseta >= item.price) {
      setPlayerMeseta(prev => prev - item.price);
      console.log(`Purchased ${item.name} for ${item.price} Meseta`);
    }
  };

  if (!shopData) return null;

  // Combine base items with first premium preset for demo
  const itemShopItems = [
    ...shopData.itemShop.baseItems,
    ...shopData.itemShop.presets[2].premiumItems // "Rare Finds" preset
  ];

  // Use first weapon preset for demo
  const weaponShopItems = shopData.weaponShop.presets[1].weapons.map(w => ({
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
      />

      <ShopNPC
        position={[-6.78, 1, 21.81]}
        name="Weapon Shop"
        modelPath={NPC_MODELS.weaponShop}
        shopType="weapon"
        items={weaponShopItems}
        playerMeseta={playerMeseta}
        onPurchase={handleWeaponPurchase}
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
