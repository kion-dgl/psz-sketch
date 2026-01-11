import { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface ShopWeapon {
  id: string;
  name: string;
  type: string;
  atp: number;
  ata: number;
  rarity: number;
  price: number;
  grind: number;
  native?: number;
  beast?: number;
  machine?: number;
  dark?: number;
  accuracyAdj?: number;
  element?: string;
  elementLevel?: number;
  mst?: number;
  photonArt?: string;
}

interface ShopArmor {
  id: string;
  name: string;
  type: string;
  dfp: number;
  evp: number;
  rarity: number;
  price: number;
  slots: number;
}

interface ShopUnit {
  id: string;
  name: string;
  effect: string;
  rarity: number;
  price: number;
}

interface WeaponShopPreset {
  name: string;
  weapons: ShopWeapon[];
  armor?: ShopArmor[];
  units?: ShopUnit[];
}

interface ShopPresets {
  weaponShop: {
    presets: WeaponShopPreset[];
  };
}

type ShopCategory = 'weapons' | 'armor' | 'units';

const NPC_MODEL = '/objects/special_c1/np_002_00_0.imd/np_002_00_0.glb';

export default function WeaponShop3DStorybook() {
  const [shopData, setShopData] = useState<ShopPresets | null>(null);
  const [playerMeseta, setPlayerMeseta] = useState(50000);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [presetIndex, setPresetIndex] = useState(0);

  useEffect(() => {
    fetch('/data/shop-presets.json')
      .then(res => res.json())
      .then(data => setShopData(data))
      .catch(console.error);
  }, []);

  const logAction = (action: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action}`, ...prev.slice(0, 9)]);
  };

  const handlePurchase = (item: ShopWeapon | ShopArmor | ShopUnit) => {
    if (playerMeseta >= item.price) {
      setPlayerMeseta(prev => prev - item.price);
      logAction(`Purchased ${item.name} for ${item.price.toLocaleString()} Meseta`);
    }
  };

  if (!shopData) {
    return <div style={styles.loading}>Loading shop data...</div>;
  }

  const currentPreset = shopData.weaponShop.presets[presetIndex];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>3D Weapon Shop Demo</h2>
        <p style={styles.subtitle}>Click on the NPC to open the weapon shop</p>
      </div>

      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <div style={styles.presetControl}>
            <span style={styles.controlLabel}>Shop Level:</span>
            {shopData.weaponShop.presets.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => setPresetIndex(idx)}
                style={presetIndex === idx ? styles.presetButtonActive : styles.presetButton}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div style={styles.mesetaControl}>
            <span style={styles.controlLabel}>Meseta:</span>
            <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(5000)}>5K</button>
            <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(25000)}>25K</button>
            <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(50000)}>50K</button>
            <button style={styles.mesetaButton} onClick={() => setPlayerMeseta(100000)}>100K</button>
            <span style={styles.mesetaValue}>{playerMeseta.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={styles.canvasContainer}>
        <Canvas
          camera={{ position: [0, 2, 5], fov: 50 }}
          style={{ background: '#1a1a2e' }}
        >
          <Suspense fallback={null}>
            <SceneContent
              preset={currentPreset}
              playerMeseta={playerMeseta}
              onPurchase={handlePurchase}
              isShopOpen={isShopOpen}
              setIsShopOpen={setIsShopOpen}
            />
          </Suspense>
        </Canvas>
      </div>

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

function SceneContent({
  preset,
  playerMeseta,
  onPurchase,
  isShopOpen,
  setIsShopOpen,
}: {
  preset: WeaponShopPreset;
  playerMeseta: number;
  onPurchase: (item: ShopWeapon | ShopArmor | ShopUnit) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (isShopOpen) {
      camera.position.set(0.25, 1.5, 5);
      camera.lookAt(0.25, 1, 0);
    } else {
      camera.position.set(-1.5, 2, 5);
      camera.lookAt(-1.5, 1, 0);
    }
  }, [isShopOpen, camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a3a4a" />
      </mesh>

      <WeaponShopNPC
        position={[-1.5, 0, 0]}
        preset={preset}
        playerMeseta={playerMeseta}
        onPurchase={onPurchase}
        isShopOpen={isShopOpen}
        setIsShopOpen={setIsShopOpen}
      />
    </>
  );
}

function WeaponShopNPC({
  position,
  preset,
  playerMeseta,
  onPurchase,
  isShopOpen,
  setIsShopOpen,
}: {
  position: [number, number, number];
  preset: WeaponShopPreset;
  playerMeseta: number;
  onPurchase: (item: ShopWeapon | ShopArmor | ShopUnit) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { scene } = useGLTF(NPC_MODEL);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setIsShopOpen(true);
  };

  return (
    <group position={position}>
      <mesh
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        position={[0, 1, 0]}
      >
        <cylinderGeometry args={[0.8, 0.8, 2, 16]} />
        <meshStandardMaterial
          color={isHovered ? "#f97316" : "#4a5a6a"}
          transparent
          opacity={isHovered ? 0.3 : 0}
        />
      </mesh>

      <primitive object={clonedScene} position={[0, 0, 0]} />

      {isHovered && !isShopOpen && (
        <Html position={[0, 2.5, 0]} center sprite>
          <div style={labelStyles.label}>
            <span style={labelStyles.text}>Weapon Shop</span>
            <span style={labelStyles.hint}>Click to open</span>
          </div>
        </Html>
      )}

      {isShopOpen && (
        <Html
          position={[3.5, 1.5, 0]}
          center
          transform
          distanceFactor={5}
          style={{ pointerEvents: 'auto' }}
        >
          <div style={{ transform: 'scale(0.6)', transformOrigin: 'center center' }}>
            <InWorldWeaponShop
              preset={preset}
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

function InWorldWeaponShop({
  preset,
  playerMeseta,
  onPurchase,
  onClose,
}: {
  preset: WeaponShopPreset;
  playerMeseta: number;
  onPurchase: (item: ShopWeapon | ShopArmor | ShopUnit) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<ShopCategory>('weapons');
  const [selectedWeapon, setSelectedWeapon] = useState<ShopWeapon | null>(preset.weapons[0] || null);
  const [selectedArmor, setSelectedArmor] = useState<ShopArmor | null>(preset.armor?.[0] || null);
  const [selectedUnit, setSelectedUnit] = useState<ShopUnit | null>(preset.units?.[0] || null);

  const themeColor = '#f97316';

  const handlePurchase = () => {
    if (category === 'weapons' && selectedWeapon && playerMeseta >= selectedWeapon.price) {
      onPurchase(selectedWeapon);
    } else if (category === 'armor' && selectedArmor && playerMeseta >= selectedArmor.price) {
      onPurchase(selectedArmor);
    } else if (category === 'units' && selectedUnit && playerMeseta >= selectedUnit.price) {
      onPurchase(selectedUnit);
    }
  };

  const getCurrentSelected = () => {
    if (category === 'weapons') return selectedWeapon;
    if (category === 'armor') return selectedArmor;
    return selectedUnit;
  };

  const currentSelected = getCurrentSelected();
  const canAfford = currentSelected ? playerMeseta >= currentSelected.price : false;

  return (
    <div style={shopStyles.shop}>
      <div style={shopStyles.header}>
        <span style={shopStyles.title}>Weapon Shop</span>
        <div style={shopStyles.mesetaDisplay}>
          <span style={shopStyles.meseta}>{playerMeseta.toLocaleString()}</span>
        </div>
        <button onClick={onClose} style={shopStyles.closeButton}>X</button>
      </div>

      <div style={shopStyles.categoryTabs}>
        <button
          onClick={() => setCategory('weapons')}
          style={category === 'weapons' ? shopStyles.tabActive : shopStyles.tab}
        >
          Weapons
        </button>
        <button
          onClick={() => setCategory('armor')}
          style={category === 'armor' ? shopStyles.tabActive : shopStyles.tab}
        >
          Armor
        </button>
        <button
          onClick={() => setCategory('units')}
          style={category === 'units' ? shopStyles.tabActive : shopStyles.tab}
        >
          Units
        </button>
      </div>

      <div style={shopStyles.content}>
        <div style={shopStyles.itemList}>
          {category === 'weapons' && preset.weapons.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedWeapon(item)}
              style={getItemStyle(selectedWeapon?.id === item.id, playerMeseta < item.price)}
            >
              <div style={shopStyles.itemInfo}>
                <span style={shopStyles.itemName}>{item.name}</span>
                <span style={shopStyles.itemType}>{item.type}</span>
              </div>
              <span style={shopStyles.itemPrice}>{item.price.toLocaleString()}</span>
            </div>
          ))}
          {category === 'armor' && preset.armor?.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedArmor(item)}
              style={getItemStyle(selectedArmor?.id === item.id, playerMeseta < item.price)}
            >
              <div style={shopStyles.itemInfo}>
                <span style={shopStyles.itemName}>{item.name}</span>
                <span style={shopStyles.itemType}>{item.type}</span>
              </div>
              <span style={shopStyles.itemPrice}>{item.price.toLocaleString()}</span>
            </div>
          ))}
          {category === 'units' && preset.units?.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedUnit(item)}
              style={getItemStyle(selectedUnit?.id === item.id, playerMeseta < item.price)}
            >
              <div style={shopStyles.itemInfo}>
                <span style={shopStyles.itemName}>{item.name}</span>
                <span style={shopStyles.itemEffect}>{item.effect}</span>
              </div>
              <span style={shopStyles.itemPrice}>{item.price.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div style={shopStyles.detailPanel}>
          {category === 'weapons' && selectedWeapon && (
            <WeaponDetails weapon={selectedWeapon} />
          )}
          {category === 'armor' && selectedArmor && (
            <ArmorDetails armor={selectedArmor} />
          )}
          {category === 'units' && selectedUnit && (
            <UnitDetails unit={selectedUnit} />
          )}
        </div>
      </div>

      {currentSelected && (
        <div style={shopStyles.purchaseSection}>
          <span style={shopStyles.purchaseName}>{currentSelected.name}</span>
          <span style={{ ...shopStyles.purchasePrice, color: canAfford ? themeColor : '#f66' }}>
            {currentSelected.price.toLocaleString()}
          </span>
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

function WeaponDetails({ weapon }: { weapon: ShopWeapon }) {
  return (
    <div style={shopStyles.details}>
      <div style={shopStyles.detailRarity}>{'*'.repeat(weapon.rarity)}</div>
      <div style={shopStyles.detailRow}>
        <span>ATP</span><span style={shopStyles.detailValue}>{weapon.atp}</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>ATA</span><span style={shopStyles.detailValue}>{weapon.ata}</span>
      </div>
      {weapon.mst && (
        <div style={shopStyles.detailRow}>
          <span>MST</span><span style={shopStyles.detailValuePurple}>+{weapon.mst}</span>
        </div>
      )}
      <div style={shopStyles.detailDivider} />
      <div style={shopStyles.detailRow}>
        <span>Native</span><span style={weapon.native ? shopStyles.detailValue : shopStyles.detailValueDim}>{weapon.native || 0}%</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>Beast</span><span style={weapon.beast ? shopStyles.detailValue : shopStyles.detailValueDim}>{weapon.beast || 0}%</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>Machine</span><span style={weapon.machine ? shopStyles.detailValue : shopStyles.detailValueDim}>{weapon.machine || 0}%</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>Dark</span><span style={weapon.dark ? shopStyles.detailValue : shopStyles.detailValueDim}>{weapon.dark || 0}%</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>Element</span>
        <span style={weapon.element ? shopStyles.detailValueRed : shopStyles.detailValueDim}>
          {weapon.element ? `${weapon.element}${weapon.elementLevel ? ` Lv.${weapon.elementLevel}` : ''}` : 'None'}
        </span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>Photon Art</span>
        <span style={weapon.photonArt ? shopStyles.detailValuePurple : shopStyles.detailValueDim}>
          {weapon.photonArt || 'None'}
        </span>
      </div>
    </div>
  );
}

function ArmorDetails({ armor }: { armor: ShopArmor }) {
  return (
    <div style={shopStyles.details}>
      <div style={shopStyles.detailRarity}>{'*'.repeat(armor.rarity)}</div>
      <div style={shopStyles.detailRow}>
        <span>DFP</span><span style={shopStyles.detailValue}>{armor.dfp}</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>EVP</span><span style={shopStyles.detailValue}>{armor.evp}</span>
      </div>
      <div style={shopStyles.detailRow}>
        <span>Slots</span><span style={shopStyles.detailValue}>{armor.slots}</span>
      </div>
    </div>
  );
}

function UnitDetails({ unit }: { unit: ShopUnit }) {
  return (
    <div style={shopStyles.details}>
      <div style={shopStyles.detailRarity}>{'*'.repeat(unit.rarity)}</div>
      <div style={shopStyles.detailEffect}>{unit.effect}</div>
    </div>
  );
}

function getItemStyle(isSelected: boolean, isUnaffordable: boolean): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    marginBottom: '4px',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: isSelected ? '#f97316' : 'transparent',
    opacity: isUnaffordable ? 0.5 : 1,
  };
}

useGLTF.preload(NPC_MODEL);

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
    color: '#f97316',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#888',
  },
  controls: {
    maxWidth: '800px',
    margin: '0 auto 16px',
    background: '#2d2d44',
    padding: '12px 16px',
    borderRadius: '8px',
  },
  controlRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  presetControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlLabel: {
    fontSize: '12px',
    color: '#888',
  },
  presetButton: {
    padding: '6px 12px',
    background: '#3a3a5a',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#4a4a6a',
    borderRadius: '4px',
    color: '#aaa',
    fontSize: '11px',
    cursor: 'pointer',
  },
  presetButtonActive: {
    padding: '6px 12px',
    background: '#4a3a2d',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#f97316',
    borderRadius: '4px',
    color: '#f97316',
    fontSize: '11px',
    cursor: 'pointer',
  },
  mesetaControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
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
    maxWidth: '800px',
    margin: '20px auto 0',
    background: '#252538',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  logTitle: {
    padding: '10px 16px',
    background: '#2d2d44',
    fontSize: '12px',
    color: '#f97316',
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
    color: '#f97316',
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
    width: '500px',
    background: 'linear-gradient(135deg, #2f1a0f 0%, #1f0f07 100%)',
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
    borderBottom: '1px solid #f97316',
  },
  title: {
    flex: 1,
    fontSize: '16px',
    fontWeight: 600,
    color: '#f97316',
  },
  mesetaDisplay: {
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
  categoryTabs: {
    display: 'flex',
    gap: '4px',
    padding: '8px',
    background: 'rgba(0,0,0,0.2)',
  },
  tab: {
    flex: 1,
    padding: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
  },
  tabActive: {
    flex: 1,
    padding: '8px',
    background: '#f97316',
    border: 'none',
    borderRadius: '4px',
    color: '#000',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    height: '220px',
  },
  itemList: {
    flex: 1,
    padding: '8px',
    overflowY: 'auto',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    fontSize: '12px',
    fontWeight: 500,
  },
  itemType: {
    fontSize: '10px',
    color: '#888',
  },
  itemEffect: {
    fontSize: '10px',
    color: '#6b8afd',
  },
  itemPrice: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#f97316',
  },
  detailPanel: {
    width: '160px',
    padding: '8px',
    background: 'rgba(0,0,0,0.2)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    overflowY: 'auto',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailRarity: {
    fontSize: '12px',
    color: '#fcd34d',
    marginBottom: '4px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#888',
  },
  detailValue: {
    color: '#6b8afd',
    fontWeight: 600,
  },
  detailValueDim: {
    color: '#555',
  },
  detailValueRed: {
    color: '#ef4444',
    fontWeight: 600,
  },
  detailValuePurple: {
    color: '#a855f7',
    fontWeight: 600,
  },
  detailDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    margin: '4px 0',
  },
  detailEffect: {
    fontSize: '14px',
    color: '#6b8afd',
    textAlign: 'center',
    padding: '8px',
    background: 'rgba(107, 138, 253, 0.1)',
    borderRadius: '4px',
  },
  purchaseSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  purchaseName: {
    flex: 1,
    fontSize: '12px',
    fontWeight: 500,
  },
  purchasePrice: {
    fontSize: '14px',
    fontWeight: 600,
  },
  buyButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '12px',
    fontWeight: 600,
  },
};
