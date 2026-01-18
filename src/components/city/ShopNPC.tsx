import { useState, useEffect, useMemo, useRef } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  rarity: number;
}

export interface ShopData {
  name: string;
  shopType: 'item' | 'weapon';
  items: ShopItem[];
}

interface ShopNPCProps {
  position: [number, number, number];
  name: string;
  modelPath: string;
  shopType: 'item' | 'weapon';
  items: ShopItem[];
  playerMeseta: number;
  onPurchase?: (item: ShopItem, quantity: number) => void;
  onShopStateChange?: (isOpen: boolean, shopData: ShopData | null) => void;
}

export default function ShopNPC({
  position,
  name,
  modelPath,
  shopType,
  items,
  playerMeseta,
  onPurchase,
  onShopStateChange,
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

  // Notify parent when shop state changes
  useEffect(() => {
    if (isShopOpen) {
      onShopStateChange?.(true, { name, shopType, items });
    } else {
      onShopStateChange?.(false, null);
    }
  }, [isShopOpen, name, shopType, items, onShopStateChange]);

  // Handle E key to open shop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && isPlayerNear && !isShopOpen) {
        setIsShopOpen(true);
      } else if (e.key === 'Escape' && isShopOpen) {
        setIsShopOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerNear, isShopOpen]);

  // Public close handler (called from overlay)
  const handleClose = () => {
    setIsShopOpen(false);
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

    </group>
  );
}

// Shop UI overlay component - exported for use outside Canvas
export function ShopOverlay({
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
  // Preselect first item (Monomate for item shop)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(items[0] || null);
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
          <span style={styles.mesetaLabel}>Meseta:</span>
          <span style={styles.meseta}>{playerMeseta.toLocaleString()}</span>
        </div>
        <button onClick={onClose} style={styles.closeButton}>✕</button>
      </div>

      {/* Main content - two column layout */}
      <div style={styles.mainContent}>
        {/* Left: Item list */}
        <div style={styles.itemListColumn}>
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
        </div>

        {/* Right: Purchase panel */}
        <div style={{ ...styles.purchasePanel, borderLeftColor: `${themeColor}33` }}>
          {selectedItem ? (
            <>
              <div style={styles.selectedItemHeader}>
                <span style={{ ...styles.selectedItemName, color: themeColor }}>{selectedItem.name}</span>
                <span style={styles.selectedItemRarity}>{'★'.repeat(Math.min(selectedItem.rarity, 5))}</span>
              </div>

              <div style={styles.selectedItemDescription}>
                {selectedItem.description}
              </div>

              <div style={styles.priceRow}>
                <span style={styles.priceLabel}>Price:</span>
                <span style={{ ...styles.priceValue, color: themeColor }}>
                  {selectedItem.price.toLocaleString()}
                </span>
              </div>

              <div style={styles.quantityRow}>
                <span style={styles.quantityLabel}>Qty:</span>
                <div style={styles.quantityControl}>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >-</button>
                  <span style={styles.qtyValue}>{quantity}</span>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  >+</button>
                </div>
              </div>

              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total:</span>
                <span style={{ ...styles.totalValue, color: canAfford ? themeColor : '#f66' }}>
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
            </>
          ) : (
            <div style={styles.noSelection}>Select an item</div>
          )}
        </div>
      </div>

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
  shop: {
    position: 'relative',
    zIndex: 10,
    width: '650px',
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
    fontSize: '18px',
    fontWeight: 600,
  },
  mesetaDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
  },
  mesetaLabel: {
    color: '#999',
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
  mainContent: {
    display: 'flex',
    minHeight: '300px',
  },
  itemListColumn: {
    flex: 1,
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  itemList: {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '12px',
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
  purchasePanel: {
    width: '220px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderLeft: '1px solid',
  },
  selectedItemHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  selectedItemName: {
    fontSize: '16px',
    fontWeight: 600,
  },
  selectedItemRarity: {
    fontSize: '12px',
    color: '#fcd34d',
  },
  selectedItemDescription: {
    fontSize: '12px',
    color: '#aaa',
    lineHeight: 1.4,
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: '13px',
    color: '#888',
  },
  priceValue: {
    fontSize: '14px',
    fontWeight: 600,
  },
  quantityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: '13px',
    color: '#888',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
  qtyValue: {
    fontSize: '16px',
    fontWeight: 600,
    width: '32px',
    textAlign: 'center',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: 600,
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: 600,
  },
  buyButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: 'auto',
  },
  noSelection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    fontSize: '14px',
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
