import { useState, useEffect, useMemo, useRef } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';
import { useFrame, useThree } from '@react-three/fiber';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  rarity: number;
}

interface ShopNPCProps {
  position: [number, number, number];
  name: string;
  modelPath: string;
  shopType: 'item' | 'weapon';
  items: ShopItem[];
  playerMeseta: number;
  onPurchase?: (item: ShopItem, quantity: number) => void;
  onClose?: () => void;
}

export default function ShopNPC({
  position,
  name,
  modelPath,
  shopType,
  items,
  playerMeseta,
  onPurchase,
  onClose,
}: ShopNPCProps) {
  const { registerNPC, registerTrigger } = useCollision();
  const { scene } = useGLTF(modelPath);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Clone using SkeletonUtils for skinned meshes
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Register NPC with collision system
  useEffect(() => {
    const unregister = registerNPC({
      id: `npc-${name}`,
      name,
      position: { x: position[0], z: position[2] },
      radius: 0.5
    });
    return unregister;
  }, [name, position, registerNPC]);

  // Register interaction trigger zone
  useEffect(() => {
    const center = new THREE.Vector3(position[0], position[1], position[2]);
    const size = new THREE.Vector3(4, 3, 4); // Interaction radius
    const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

    const unregister = registerTrigger({
      id: `shop-${name}`,
      bounds,
      onEnter: () => setIsPlayerNear(true),
      onExit: () => {
        setIsPlayerNear(false);
        setIsShopOpen(false);
      }
    });

    return unregister;
  }, [position, name, registerTrigger]);

  // Handle E key to open shop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && isPlayerNear && !isShopOpen) {
        setIsShopOpen(true);
      } else if (e.key === 'Escape' && isShopOpen) {
        setIsShopOpen(false);
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerNear, isShopOpen, onClose]);

  const handleClose = () => {
    setIsShopOpen(false);
    onClose?.();
  };

  return (
    <group ref={groupRef} position={position}>
      {/* NPC Model */}
      <primitive object={clonedScene} position={[0, -1, 0]} />

      {/* Interaction prompt when near */}
      {isPlayerNear && !isShopOpen && (
        <Html
          position={[0, 2.5, 0]}
          center
          sprite
          distanceFactor={6}
        >
          <div style={styles.prompt}>
            <span style={styles.promptKey}>E</span>
            <span style={styles.promptText}>{name}</span>
          </div>
        </Html>
      )}

      {/* Shop UI in 3D space */}
      {isShopOpen && (
        <Html
          position={[2, 1.5, 0]}
          center
          transform
          distanceFactor={4}
          style={{ pointerEvents: 'auto' }}
        >
          <div style={styles.shopContainer}>
            <InWorldShop
              shopType={shopType}
              name={name}
              items={items}
              playerMeseta={playerMeseta}
              onPurchase={onPurchase}
              onClose={handleClose}
            />
          </div>
        </Html>
      )}
    </group>
  );
}

// Compact shop UI designed for in-world display
function InWorldShop({
  shopType,
  name,
  items,
  playerMeseta,
  onPurchase,
  onClose,
}: {
  shopType: 'item' | 'weapon';
  name: string;
  items: ShopItem[];
  playerMeseta: number;
  onPurchase?: (item: ShopItem, quantity: number) => void;
  onClose: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const themeColor = shopType === 'item' ? '#4ade80' : '#f97316';
  const themeBg = shopType === 'item'
    ? 'linear-gradient(135deg, #1a2f23 0%, #0f1f17 100%)'
    : 'linear-gradient(135deg, #2f1a0f 0%, #1f0f07 100%)';

  const handlePurchase = () => {
    if (selectedItem && playerMeseta >= selectedItem.price * quantity) {
      onPurchase?.(selectedItem, quantity);
      setQuantity(1);
    }
  };

  const canAfford = selectedItem ? playerMeseta >= selectedItem.price * quantity : false;

  return (
    <div style={{ ...styles.shop, background: themeBg }}>
      {/* Header */}
      <div style={{ ...styles.header, borderBottomColor: themeColor }}>
        <span style={{ ...styles.title, color: themeColor }}>{name}</span>
        <div style={styles.mesetaDisplay}>
          <span>💰</span>
          <span style={styles.meseta}>{playerMeseta.toLocaleString()}</span>
        </div>
        <button onClick={onClose} style={styles.closeButton}>✕</button>
      </div>

      {/* Item list */}
      <div style={styles.itemList}>
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedItem(item);
              setQuantity(1);
            }}
            style={{
              ...styles.item,
              ...(selectedItem?.id === item.id ? { ...styles.itemSelected, borderColor: themeColor } : {}),
              ...(playerMeseta < item.price ? styles.itemUnaffordable : {}),
            }}
          >
            <div style={styles.itemInfo}>
              <span style={styles.itemName}>{item.name}</span>
              <span style={styles.itemRarity}>{'★'.repeat(Math.min(item.rarity, 5))}</span>
            </div>
            <span style={{ ...styles.itemPrice, color: themeColor }}>
              {item.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Purchase section */}
      {selectedItem && (
        <div style={styles.purchaseSection}>
          <div style={styles.purchaseInfo}>
            <span style={styles.purchaseName}>{selectedItem.name}</span>
            <div style={styles.quantityControl}>
              <button
                style={styles.qtyBtn}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >-</button>
              <span style={styles.qtyValue}>{quantity}</span>
              <button
                style={styles.qtyBtn}
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
              >+</button>
            </div>
          </div>
          <div style={styles.purchaseTotal}>
            <span style={{ color: canAfford ? themeColor : '#f66' }}>
              {(selectedItem.price * quantity).toLocaleString()}
            </span>
          </div>
          <button
            onClick={handlePurchase}
            disabled={!canAfford}
            style={{
              ...styles.buyButton,
              background: canAfford ? themeColor : '#444',
              cursor: canAfford ? 'pointer' : 'not-allowed',
            }}
          >
            Buy
          </button>
        </div>
      )}

      {/* Footer hint */}
      <div style={styles.footer}>
        <span style={styles.hint}>ESC to close</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  prompt: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
  },
  promptKey: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: '#6b8afd',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  promptText: {
    color: '#fff',
    fontSize: '14px',
  },
  shopContainer: {
    transform: 'scale(0.6)',
    transformOrigin: 'center center',
  },
  shop: {
    width: '380px',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#e0e0e0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid',
  },
  title: {
    flex: 1,
    fontSize: '16px',
    fontWeight: 600,
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
  },
  meseta: {
    color: '#fcd34d',
    fontWeight: 600,
  },
  closeButton: {
    width: '28px',
    height: '28px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
  },
  itemList: {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '8px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '6px',
    marginBottom: '4px',
    cursor: 'pointer',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transition: 'all 0.15s',
  },
  itemSelected: {
    background: 'rgba(255,255,255,0.1)',
  },
  itemUnaffordable: {
    opacity: 0.5,
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    fontSize: '13px',
    fontWeight: 500,
  },
  itemRarity: {
    fontSize: '10px',
    color: '#fcd34d',
  },
  itemPrice: {
    fontSize: '13px',
    fontWeight: 600,
  },
  purchaseSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.2)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  purchaseInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  purchaseName: {
    fontSize: '12px',
    fontWeight: 500,
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  qtyValue: {
    fontSize: '14px',
    fontWeight: 600,
    width: '24px',
    textAlign: 'center',
  },
  purchaseTotal: {
    fontSize: '16px',
    fontWeight: 600,
  },
  buyButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '13px',
    fontWeight: 600,
  },
  footer: {
    padding: '8px 16px',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  hint: {
    fontSize: '11px',
    color: '#666',
  },
};
