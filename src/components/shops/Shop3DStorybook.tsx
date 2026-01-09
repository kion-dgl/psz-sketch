import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

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
}

const NPC_MODELS = {
  itemShop: '/objects/special_c1/np_003_00_0.imd/np_003_00_0.glb',
};

export default function Shop3DStorybook() {
  const [shopData, setShopData] = useState<ShopPresets | null>(null);
  const [playerMeseta, setPlayerMeseta] = useState(50000);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  useEffect(() => {
    fetch('/data/shop-presets.json')
      .then(res => res.json())
      .then(data => setShopData(data))
      .catch(console.error);
  }, []);

  const logAction = (action: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action}`, ...prev.slice(0, 9)]);
  };

  const handlePurchase = (item: ShopItem, quantity: number) => {
    const total = item.price * quantity;
    if (playerMeseta >= total) {
      setPlayerMeseta(prev => prev - total);
      logAction(`Purchased ${quantity}x ${item.name} for ${total.toLocaleString()} Meseta`);
    }
  };

  if (!shopData) {
    return <div style={styles.loading}>Loading shop data...</div>;
  }

  const itemShopItems = [
    ...shopData.itemShop.baseItems,
    ...shopData.itemShop.presets[2].premiumItems
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>3D Shop Demo</h2>
        <p style={styles.subtitle}>Click on the NPC to open the shop (simulates player interaction)</p>
      </div>

      <div style={styles.controls}>
        <div style={styles.mesetaControl}>
          <span style={styles.controlLabel}>Player Meseta:</span>
          <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(5000)}>5K</button>
          <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(25000)}>25K</button>
          <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(50000)}>50K</button>
          <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(100000)}>100K</button>
          <span style={styles.mesetaValue}>💰 {playerMeseta.toLocaleString()}</span>
        </div>
      </div>

      <div style={styles.canvasContainer}>
        <Canvas
          camera={{ position: [0, 2, 5], fov: 50 }}
          style={{ background: '#1a1a2e' }}
        >
          <Suspense fallback={null}>
            <SceneContent
              items={itemShopItems}
              playerMeseta={playerMeseta}
              onPurchase={handlePurchase}
              isShopOpen={isShopOpen}
              setIsShopOpen={setIsShopOpen}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Action Log */}
      <div style={styles.actionLog}>
        <div style={styles.logTitle}>Purchase Log</div>
        <div style={styles.logContent}>
          {actionLog.length === 0 ? (
            <span style={styles.logEmpty}>Click on the NPC to open the shop...</span>
          ) : (
            actionLog.map((log, idx) => (
              <div key={idx} style={styles.logEntry}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Scene content with camera control
function SceneContent({
  items,
  playerMeseta,
  onPurchase,
  isShopOpen,
  setIsShopOpen,
}: {
  items: ShopItem[];
  playerMeseta: number;
  onPurchase: (item: ShopItem, quantity: number) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
}) {
  const { camera } = useThree();

  // Fixed camera position when shop is open
  useEffect(() => {
    if (isShopOpen) {
      // Position camera to frame NPC on left, menu on right
      // NPC is at x=-1.5, menu at x=2 (relative 3.5), center at x=0.25
      camera.position.set(0.25, 1.5, 5);
      camera.lookAt(0.25, 1, 0);
    } else {
      // Default position - centered on NPC
      camera.position.set(-1.5, 2, 5);
      camera.lookAt(-1.5, 1, 0);
    }
  }, [isShopOpen, camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a3a4a" />
      </mesh>

      {/* Item Shop NPC - positioned on left side */}
      <ClickableShopNPC
        position={[-1.5, 0, 0]}
        name="Item Shop"
        modelPath={NPC_MODELS.itemShop}
        shopType="item"
        items={items}
        playerMeseta={playerMeseta}
        onPurchase={onPurchase}
        isShopOpen={isShopOpen}
        setIsShopOpen={setIsShopOpen}
      />
    </>
  );
}

function ClickableShopNPC({
  position,
  name,
  modelPath,
  shopType,
  items,
  playerMeseta,
  onPurchase,
  isShopOpen,
  setIsShopOpen,
}: {
  position: [number, number, number];
  name: string;
  modelPath: string;
  shopType: 'item' | 'weapon';
  items: ShopItem[];
  playerMeseta: number;
  onPurchase: (item: ShopItem, quantity: number) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setIsShopOpen(true);
  };

  return (
    <group position={position}>
      {/* Clickable area */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        position={[0, 1, 0]}
      >
        <cylinderGeometry args={[0.8, 0.8, 2, 16]} />
        <meshStandardMaterial
          color={isHovered ? "#6b8afd" : "#4a5a6a"}
          transparent
          opacity={isHovered ? 0.3 : 0}
        />
      </mesh>

      {/* NPC Model - positioned so feet are on the floor */}
      <primitive object={clonedScene} position={[0, 0, 0]} />

      {/* Name label when hovered */}
      {isHovered && !isShopOpen && (
        <Html position={[0, 2.5, 0]} center sprite>
          <div style={labelStyles.label}>
            <span style={labelStyles.text}>{name}</span>
            <span style={labelStyles.hint}>Click to open</span>
          </div>
        </Html>
      )}

      {/* Shop UI - positioned to the right of NPC */}
      {isShopOpen && (
        <Html
          position={[3.5, 1.5, 0]}
          center
          transform
          distanceFactor={5}
          style={{ pointerEvents: 'auto' }}
        >
          <div style={{ transform: 'scale(0.6)', transformOrigin: 'center center' }}>
            <InWorldShop
              shopType={shopType}
              name={name}
              items={items}
              playerMeseta={playerMeseta}
              onPurchase={onPurchase}
              onClose={() => setIsShopOpen(false)}
            />
          </div>
        </Html>
      )}
    </group>
  );
}

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
  onPurchase: (item: ShopItem, quantity: number) => void;
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
      onPurchase(selectedItem, quantity);
      setQuantity(1);
    }
  };

  const canAfford = selectedItem ? playerMeseta >= selectedItem.price * quantity : false;

  return (
    <div style={{ ...shopStyles.shop, background: themeBg }}>
      <div style={{ ...shopStyles.header, borderBottomColor: themeColor }}>
        <span style={{ ...shopStyles.title, color: themeColor }}>{name}</span>
        <div style={shopStyles.mesetaDisplay}>
          <span>💰</span>
          <span style={shopStyles.meseta}>{playerMeseta.toLocaleString()}</span>
        </div>
        <button onClick={onClose} style={shopStyles.closeButton}>✕</button>
      </div>

      <div style={shopStyles.itemList}>
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedItem(item);
              setQuantity(1);
            }}
            style={{
              ...shopStyles.item,
              ...(selectedItem?.id === item.id ? { ...shopStyles.itemSelected, borderColor: themeColor } : {}),
              ...(playerMeseta < item.price ? shopStyles.itemUnaffordable : {}),
            }}
          >
            <div style={shopStyles.itemInfo}>
              <span style={shopStyles.itemName}>{item.name}</span>
              <span style={shopStyles.itemRarity}>{'★'.repeat(Math.min(item.rarity, 5))}</span>
            </div>
            <span style={{ ...shopStyles.itemPrice, color: themeColor }}>
              {item.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div style={shopStyles.purchaseSection}>
          <div style={shopStyles.purchaseInfo}>
            <span style={shopStyles.purchaseName}>{selectedItem.name}</span>
            <div style={shopStyles.quantityControl}>
              <button style={shopStyles.qtyBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
              <span style={shopStyles.qtyValue}>{quantity}</span>
              <button style={shopStyles.qtyBtn} onClick={() => setQuantity(q => Math.min(10, q + 1))}>+</button>
            </div>
          </div>
          <div style={shopStyles.purchaseTotal}>
            <span style={{ color: canAfford ? themeColor : '#f66' }}>
              {(selectedItem.price * quantity).toLocaleString()}
            </span>
          </div>
          <button
            onClick={handlePurchase}
            disabled={!canAfford}
            style={{
              ...shopStyles.buyButton,
              background: canAfford ? themeColor : '#444',
              cursor: canAfford ? 'pointer' : 'not-allowed',
            }}
          >
            Buy
          </button>
        </div>
      )}
    </div>
  );
}

// Preload models
Object.values(NPC_MODELS).forEach(path => useGLTF.preload(path));

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    background: '#1a1a2e',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#888',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#6b8afd',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#888',
  },
  controls: {
    maxWidth: '600px',
    margin: '0 auto 16px',
    background: '#2d2d44',
    padding: '12px 16px',
    borderRadius: '8px',
  },
  mesetaControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  controlLabel: {
    fontSize: '12px',
    color: '#888',
  },
  mesetaButton: {
    padding: '6px 12px',
    background: '#3a3a5a',
    border: 'none',
    borderRadius: '4px',
    color: '#aaa',
    fontSize: '11px',
    cursor: 'pointer',
  },
  mesetaValue: {
    marginLeft: 'auto',
    padding: '6px 12px',
    background: '#252538',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#fcd34d',
    fontWeight: 600,
  },
  canvasContainer: {
    maxWidth: '800px',
    height: '450px',
    margin: '0 auto',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #3a3a4e',
  },
  actionLog: {
    maxWidth: '600px',
    margin: '20px auto 0',
    background: '#252538',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  logTitle: {
    padding: '10px 16px',
    background: '#2d2d44',
    fontSize: '12px',
    color: '#6b8afd',
    borderBottom: '1px solid #3a3a4e',
  },
  logContent: {
    padding: '12px 16px',
    maxHeight: '100px',
    overflowY: 'auto',
  },
  logEmpty: {
    color: '#555',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  logEntry: {
    fontSize: '11px',
    color: '#888',
    padding: '4px 0',
    borderBottom: '1px solid #2a2a3a',
  },
};

const labelStyles: Record<string, React.CSSProperties> = {
  label: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
  },
  text: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
  },
  hint: {
    color: '#888',
    fontSize: '11px',
  },
};

const shopStyles: Record<string, React.CSSProperties> = {
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
};
