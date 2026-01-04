import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  WEAPON_CATEGORIES,
  ALL_WEAPON_IDS,
  getWeaponCategory,
  getWeaponRarity,
  getWeaponGlbPath,
  getWeaponInfoPath,
  getWeaponTexturePath,
  type WeaponInfo,
  type WeaponCategory,
} from './weaponData';

// PSO-World weapon stats interface
interface PhotonArt {
  name: string;
  attackMod: number;
  accuracyMod: number;
  ppUsed: number;
  element: string;
}

interface PsoWorldWeaponStats {
  name: string;
  japaneseName?: string;
  rarity: number;
  weaponType: string;
  element?: string;
  elementLevel?: number;
  maxGrind: number;
  level: number;
  resaleValue: number;
  attackBase: number;
  attackMax: number;
  accuracyBase: number;
  accuracyMax: number;
  photonArts: PhotonArt[];
  usableBy: string[];
  psoWorldId: number;
}

// Comprehensive weapon data entry from weapon-data.json
interface WeaponDataEntry {
  name: string;
  rarity: number;
  level: number;
  modelId: string;
  variantId: string | null;
  notes?: string;
  missingTexture?: boolean;
  useModelFrom?: string;
}

interface WeaponDataCategory {
  category: string;
  wikiUrl: string;
  weapons: WeaponDataEntry[];
}

interface WeaponDataJson {
  [key: string]: WeaponDataCategory;
}

// Weapon variant entry (for expanded list)
interface WeaponVariant {
  weaponId: string;
  variant: string;
  displayName: string;
  rarity?: number;
  level?: number;
  notes?: string;
  missingTexture?: boolean;
  useModelFrom?: string;
  wikiUrl?: string;
}

// Weapon name metadata from weapon-names.json
interface WeaponNameInfo {
  name: string;
  notes?: string;
  missingVariants?: string[];
}

// Material mode options
type MaterialMode = 'textured' | 'normal' | 'wireframe';

// Side rendering options
type SideMode = 'front' | 'back' | 'double';

// Material settings
interface MaterialSettings {
  materialMode: MaterialMode;
  sideMode: SideMode;
  wrapS: THREE.Wrapping;
  wrapT: THREE.Wrapping;
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
}

const DEFAULT_MATERIAL_SETTINGS: MaterialSettings = {
  materialMode: 'textured',
  sideMode: 'double',
  wrapS: THREE.RepeatWrapping,
  wrapT: THREE.RepeatWrapping,
  offsetX: 0,
  offsetY: 0,
  repeatX: 1,
  repeatY: 1,
};

// Map side mode to THREE.Side
const SIDE_MAP: Record<SideMode, THREE.Side> = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide,
};

// Weapon 3D Preview Component
function WeaponModel({
  weaponId,
  variant,
  settings,
}: {
  weaponId: string;
  variant: string;
  settings: MaterialSettings;
}) {
  const glbPath = getWeaponGlbPath(weaponId, variant);
  const { scene } = useGLTF(glbPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();

    // Compute vertex normals for proper lighting
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        obj.geometry.computeVertexNormals();
      }
    });

    // Center the model
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    return clone;
  }, [scene]);

  // Apply material settings
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const side = SIDE_MAP[settings.sideMode];

        if (settings.materialMode === 'normal') {
          obj.material = new THREE.MeshNormalMaterial({
            wireframe: false,
            side,
          });
        } else if (settings.materialMode === 'wireframe') {
          obj.material = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0x00ff00,
            side,
          });
        } else {
          // Textured mode - clone original material and apply settings
          const originalMaterial = obj.userData.originalMaterial || obj.material;
          if (!obj.userData.originalMaterial) {
            obj.userData.originalMaterial = obj.material;
          }

          if (originalMaterial instanceof THREE.MeshBasicMaterial ||
              originalMaterial instanceof THREE.MeshStandardMaterial ||
              originalMaterial instanceof THREE.MeshPhongMaterial) {
            const newMaterial = originalMaterial.clone();
            newMaterial.wireframe = false;
            newMaterial.side = side;

            if (newMaterial.map) {
              newMaterial.map = newMaterial.map.clone();
              newMaterial.map.wrapS = settings.wrapS;
              newMaterial.map.wrapT = settings.wrapT;
              newMaterial.map.offset.set(settings.offsetX, settings.offsetY);
              newMaterial.map.repeat.set(settings.repeatX, settings.repeatY);
              newMaterial.map.needsUpdate = true;
            }

            obj.material = newMaterial;
          }
        }
      }
    });
  }, [clonedScene, settings]);

  return <primitive object={clonedScene} />;
}

// Loading fallback
function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#4a9eff" wireframe />
    </mesh>
  );
}

// Category sidebar item
function CategoryItem({
  category,
  count,
  selected,
  onClick,
}: {
  category: WeaponCategory;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 8px',
        background: selected ? '#4a9eff' : 'transparent',
        color: selected ? 'white' : '#ccc',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '11px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span>{category.label}</span>
      <span style={{ opacity: 0.6, fontSize: '10px' }}>{count}</span>
    </button>
  );
}

// Rarity color mapping
const RARITY_COLORS: Record<number, string> = {
  1: '#888888',
  2: '#888888',
  3: '#4a9eff',
  4: '#4a9eff',
  5: '#ffcc00',
  6: '#ffcc00',
  7: '#ff4444',
};

// Compact weapon variant item
function WeaponVariantItem({
  weaponVariant,
  selected,
  onClick,
}: {
  weaponVariant: WeaponVariant;
  selected: boolean;
  onClick: () => void;
}) {
  const color = weaponVariant.rarity
    ? RARITY_COLORS[weaponVariant.rarity] || '#888'
    : getWeaponRarity(weaponVariant.weaponId).color;

  const stars = weaponVariant.rarity ? '★'.repeat(weaponVariant.rarity) : '';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '6px 8px',
        background: selected ? '#2a3a5e' : weaponVariant.missingTexture ? '#1a1a1a' : 'transparent',
        border: selected ? '1px solid #4a9eff' : '1px solid transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '10px',
        color: color,
        opacity: weaponVariant.missingTexture ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>
          {weaponVariant.missingTexture && '⚠ '}
          {weaponVariant.displayName}
        </span>
        {weaponVariant.level && (
          <span style={{ fontSize: '8px', color: '#666' }}>Lv{weaponVariant.level}</span>
        )}
      </div>
      {stars && (
        <div style={{ fontSize: '8px', color: color, opacity: 0.8 }}>{stars}</div>
      )}
    </button>
  );
}

// Wrap mode options
const WRAP_OPTIONS: { label: string; value: THREE.Wrapping }[] = [
  { label: 'Repeat', value: THREE.RepeatWrapping },
  { label: 'Clamp', value: THREE.ClampToEdgeWrapping },
  { label: 'Mirror', value: THREE.MirroredRepeatWrapping },
];

// Main Gallery Component
export default function WeaponGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<WeaponVariant | null>(null);
  const [allVariants, setAllVariants] = useState<WeaponVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [weaponInfoMap, setWeaponInfoMap] = useState<Record<string, WeaponInfo>>({});
  const [weaponData, setWeaponData] = useState<WeaponDataJson | null>(null);
  const [materialSettings, setMaterialSettings] = useState<MaterialSettings>(DEFAULT_MATERIAL_SETTINGS);
  const [psoWorldStats, setPsoWorldStats] = useState<Map<string, PsoWorldWeaponStats>>(new Map());

  // Load all weapon info on mount to get all variants
  useEffect(() => {
    async function loadAllWeapons() {
      const variants: WeaponVariant[] = [];
      const infoMap: Record<string, WeaponInfo> = {};

      // Load comprehensive weapon data
      let weaponDataJson: WeaponDataJson = {};
      try {
        const dataRes = await fetch('/src/data/weapon-data.json');
        weaponDataJson = await dataRes.json();
        setWeaponData(weaponDataJson);
      } catch (err) {
        console.warn('Could not load weapon data:', err);
      }

      // Load PSO-World weapon stats
      try {
        const statsRes = await fetch('/src/data/psoworld-weapon-stats.json');
        const statsArray: PsoWorldWeaponStats[] = await statsRes.json();
        const statsMap = new Map<string, PsoWorldWeaponStats>();
        for (const stat of statsArray) {
          // Index by lowercase name for case-insensitive matching
          statsMap.set(stat.name.toLowerCase(), stat);
        }
        setPsoWorldStats(statsMap);
      } catch (err) {
        console.warn('Could not load PSO-World stats:', err);
      }

      // Create a map of weapons from comprehensive data
      const weaponDataMap: Map<string, WeaponDataEntry & { wikiUrl: string }> = new Map();
      for (const [, categoryData] of Object.entries(weaponDataJson)) {
        for (const weapon of categoryData.weapons) {
          // Key by variant if available, otherwise by name
          const key = weapon.variantId || weapon.name.toLowerCase().replace(/\s+/g, '_');
          weaponDataMap.set(key, { ...weapon, wikiUrl: categoryData.wikiUrl });
        }
      }

      // Load info for each weapon model
      await Promise.all(
        ALL_WEAPON_IDS.map(async (weaponId) => {
          try {
            const res = await fetch(getWeaponInfoPath(weaponId));
            const info: WeaponInfo = await res.json();
            infoMap[weaponId] = info;

            for (const variant of info.variants) {
              // Check if we have comprehensive data for this variant
              const weaponEntry = weaponDataMap.get(variant);
              variants.push({
                weaponId,
                variant,
                displayName: weaponEntry?.name || variant,
                rarity: weaponEntry?.rarity,
                level: weaponEntry?.level,
                notes: weaponEntry?.notes,
                wikiUrl: weaponEntry?.wikiUrl,
              });
            }
          } catch (err) {
            console.error(`Failed to load weapon ${weaponId}:`, err);
          }
        })
      );

      // Add missing texture weapons from comprehensive data
      for (const [, categoryData] of Object.entries(weaponDataJson)) {
        for (const weapon of categoryData.weapons) {
          if (weapon.missingTexture && weapon.useModelFrom) {
            // Find the model's base weaponId
            const baseVariant = variants.find(v => v.variant === weapon.useModelFrom);
            if (baseVariant) {
              variants.push({
                weaponId: baseVariant.weaponId,
                variant: weapon.useModelFrom, // Use the model from this variant
                displayName: weapon.name,
                rarity: weapon.rarity,
                level: weapon.level,
                notes: weapon.notes,
                missingTexture: true,
                useModelFrom: weapon.useModelFrom,
                wikiUrl: categoryData.wikiUrl,
              });
            }
          }
        }
      }

      // Sort by rarity (ascending) then by name
      variants.sort((a, b) => {
        // Sort by rarity first (lower rarity first)
        const rarityA = a.rarity || 0;
        const rarityB = b.rarity || 0;
        if (rarityA !== rarityB) return rarityA - rarityB;
        // Then by name
        return a.displayName.localeCompare(b.displayName);
      });

      setAllVariants(variants);
      setWeaponInfoMap(infoMap);
      setLoading(false);
    }

    loadAllWeapons();
  }, []);

  // Group variants by category
  const variantsByCategory = useMemo(() => {
    const grouped: Record<string, WeaponVariant[]> = {};

    for (const cat of WEAPON_CATEGORIES) {
      grouped[cat.id] = [];
    }
    grouped['other'] = [];

    for (const wv of allVariants) {
      const category = getWeaponCategory(wv.weaponId);
      if (category) {
        grouped[category.id].push(wv);
      } else {
        grouped['other'].push(wv);
      }
    }

    return grouped;
  }, [allVariants]);

  // Get variants to display
  const displayedVariants = useMemo(() => {
    if (selectedCategory) {
      return variantsByCategory[selectedCategory] || [];
    }
    return allVariants;
  }, [selectedCategory, variantsByCategory, allVariants]);

  const selectedWeaponCategory = selectedVariant
    ? getWeaponCategory(selectedVariant.weaponId)
    : null;
  const selectedWeaponRarity = selectedVariant
    ? getWeaponRarity(selectedVariant.weaponId)
    : null;
  const selectedWeaponInfo = selectedVariant
    ? weaponInfoMap[selectedVariant.weaponId]
    : null;

  // Get PSO-World stats for selected weapon
  const selectedWeaponStats = useMemo(() => {
    if (!selectedVariant) return null;
    return psoWorldStats.get(selectedVariant.displayName.toLowerCase()) || null;
  }, [selectedVariant, psoWorldStats]);

  const updateSetting = <K extends keyof MaterialSettings>(key: K, value: MaterialSettings[K]) => {
    setMaterialSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a12',
        color: 'white',
        display: 'flex',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel - Categories */}
      <div
        style={{
          width: '140px',
          flexShrink: 0,
          borderRight: '1px solid #333',
          padding: '8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4a9eff' }}>
          Categories
        </h3>

        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            display: 'block',
            width: '100%',
            padding: '6px 8px',
            marginBottom: '4px',
            background: selectedCategory === null ? '#4a9eff' : 'transparent',
            color: selectedCategory === null ? 'white' : '#ccc',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            textAlign: 'left',
          }}
        >
          All ({allVariants.length})
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {WEAPON_CATEGORIES.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              count={variantsByCategory[cat.id]?.length || 0}
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Left Panel - Weapon List */}
      <div
        style={{
          width: '180px',
          flexShrink: 0,
          borderRight: '1px solid #333',
          padding: '8px',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
          Weapons
          <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '4px' }}>
            ({displayedVariants.length})
          </span>
        </h3>

        {loading ? (
          <div style={{ color: '#666', fontSize: '11px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {displayedVariants.map((wv, idx) => (
              <WeaponVariantItem
                key={`${wv.weaponId}-${wv.variant}-${wv.displayName}-${idx}`}
                weaponVariant={wv}
                selected={
                  selectedVariant?.displayName === wv.displayName &&
                  selectedVariant?.variant === wv.variant
                }
                onClick={() => setSelectedVariant(wv)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Center - 3D Preview */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Info Bar */}
        {selectedVariant && (
          <div
            style={{
              padding: '8px 12px',
              background: '#111',
              borderBottom: '1px solid #333',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {selectedVariant.displayName}
              </span>
              {selectedVariant.rarity && (
                <span
                  style={{
                    color: RARITY_COLORS[selectedVariant.rarity] || '#888',
                    fontSize: '12px',
                  }}
                >
                  {'★'.repeat(selectedVariant.rarity)}
                </span>
              )}
              {selectedWeaponCategory && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: '#333',
                    borderRadius: '4px',
                    fontSize: '10px',
                  }}
                >
                  {selectedWeaponCategory.label}
                </span>
              )}
              {selectedVariant.level && (
                <span style={{ fontSize: '10px', color: '#888' }}>
                  Lv.{selectedVariant.level}
                </span>
              )}
              {selectedVariant.wikiUrl && (
                <a
                  href={selectedVariant.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '10px',
                    color: '#4a9eff',
                    textDecoration: 'none',
                  }}
                >
                  Wiki →
                </a>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: '#666' }}>
              <span>Model: {selectedVariant.variant}</span>
              <span>ID: {selectedVariant.weaponId.toUpperCase()}</span>
              {selectedVariant.missingTexture && (
                <span style={{ color: '#ff9900' }}>
                  ⚠ Missing texture (using {selectedVariant.useModelFrom})
                </span>
              )}
              {selectedVariant.notes && !selectedVariant.missingTexture && (
                <span style={{ color: '#888' }}>{selectedVariant.notes}</span>
              )}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, background: '#0a0a12' }}>
          {selectedVariant ? (
            <Canvas camera={{ position: [2, 1, 2], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-5, -5, -5]} intensity={0.3} />
              <Suspense fallback={<LoadingSpinner />}>
                <WeaponModel
                  key={`${selectedVariant.weaponId}-${selectedVariant.variant}-${JSON.stringify(materialSettings)}`}
                  weaponId={selectedVariant.weaponId}
                  variant={selectedVariant.variant}
                  settings={materialSettings}
                />
              </Suspense>
              <OrbitControls makeDefault />
              <Environment preset="studio" />
              <gridHelper args={[10, 10, '#333', '#222']} />
            </Canvas>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
              }}
            >
              Select a weapon to preview
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Controls & Texture */}
      <div
        style={{
          width: '280px',
          flexShrink: 0,
          borderLeft: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Material Controls */}
        <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#4a9eff' }}>
            Material Mode
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="materialMode"
              checked={materialSettings.materialMode === 'textured'}
              onChange={() => updateSetting('materialMode', 'textured')}
            />
            Textured
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="materialMode"
              checked={materialSettings.materialMode === 'normal'}
              onChange={() => updateSetting('materialMode', 'normal')}
            />
            Normal Material
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="materialMode"
              checked={materialSettings.materialMode === 'wireframe'}
              onChange={() => updateSetting('materialMode', 'wireframe')}
            />
            Wireframe
          </label>

          <h3 style={{ margin: '12px 0 8px 0', fontSize: '12px', color: '#4a9eff' }}>
            Face Culling
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="sideMode"
              checked={materialSettings.sideMode === 'front'}
              onChange={() => updateSetting('sideMode', 'front')}
            />
            Front Side
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="sideMode"
              checked={materialSettings.sideMode === 'back'}
              onChange={() => updateSetting('sideMode', 'back')}
            />
            Back Side
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="sideMode"
              checked={materialSettings.sideMode === 'double'}
              onChange={() => updateSetting('sideMode', 'double')}
            />
            Double Sided
          </label>
        </div>

        {/* Texture Controls */}
        <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#4a9eff' }}>
            Texture
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>
              Wrap S
            </label>
            <select
              value={materialSettings.wrapS}
              onChange={(e) => updateSetting('wrapS', parseInt(e.target.value) as THREE.Wrapping)}
              style={{
                width: '100%',
                padding: '4px',
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
              }}
            >
              {WRAP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>
              Wrap T
            </label>
            <select
              value={materialSettings.wrapT}
              onChange={(e) => updateSetting('wrapT', parseInt(e.target.value) as THREE.Wrapping)}
              style={{
                width: '100%',
                padding: '4px',
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
              }}
            >
              {WRAP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>
                Offset X
              </label>
              <input
                type="number"
                step="0.1"
                value={materialSettings.offsetX}
                onChange={(e) => updateSetting('offsetX', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '4px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>
                Offset Y
              </label>
              <input
                type="number"
                step="0.1"
                value={materialSettings.offsetY}
                onChange={(e) => updateSetting('offsetY', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '4px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>
                Repeat X
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={materialSettings.repeatX}
                onChange={(e) => updateSetting('repeatX', parseFloat(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '4px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>
                Repeat Y
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={materialSettings.repeatY}
                onChange={(e) => updateSetting('repeatY', parseFloat(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '4px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                }}
              />
            </div>
          </div>

          <button
            onClick={() => setMaterialSettings(DEFAULT_MATERIAL_SETTINGS)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '6px',
              background: '#333',
              border: 'none',
              borderRadius: '4px',
              color: '#ccc',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Reset to Defaults
          </button>
        </div>

        {/* Weapon Stats Panel */}
        {selectedWeaponStats && (
          <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#4a9eff' }}>
              Weapon Stats
            </h3>

            {/* Japanese Name */}
            {selectedWeaponStats.japaneseName && (
              <div style={{ marginBottom: '8px', fontSize: '11px', color: '#888' }}>
                {selectedWeaponStats.japaneseName}
              </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#1a1a2e', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#888', marginBottom: '2px' }}>Attack</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {selectedWeaponStats.attackBase}
                  <span style={{ color: '#4a9eff' }}> → {selectedWeaponStats.attackMax}</span>
                </div>
              </div>
              <div style={{ background: '#1a1a2e', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#888', marginBottom: '2px' }}>Accuracy</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {selectedWeaponStats.accuracyBase}
                  {selectedWeaponStats.accuracyBase !== selectedWeaponStats.accuracyMax && (
                    <span style={{ color: '#4a9eff' }}> → {selectedWeaponStats.accuracyMax}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px', marginBottom: '12px' }}>
              <div style={{ color: '#888' }}>Max Grind:</div>
              <div>+{selectedWeaponStats.maxGrind}</div>
              <div style={{ color: '#888' }}>Sell Price:</div>
              <div>{selectedWeaponStats.resaleValue} Meseta</div>
              {selectedWeaponStats.element && (
                <>
                  <div style={{ color: '#888' }}>Element:</div>
                  <div style={{ color: '#ff9900' }}>
                    Lv{selectedWeaponStats.elementLevel} {selectedWeaponStats.element}
                  </div>
                </>
              )}
            </div>

            {/* Photon Arts */}
            {selectedWeaponStats.photonArts.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Photon Arts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedWeaponStats.photonArts.map((pa, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#1a1a2e',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{pa.name}</div>
                      <div style={{ color: '#888', display: 'flex', gap: '8px' }}>
                        <span>ATK {pa.attackMod}%</span>
                        <span>ACC {pa.accuracyMod}%</span>
                        <span>PP {pa.ppUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usable By */}
            {selectedWeaponStats.usableBy.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Usable By</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedWeaponStats.usableBy.map((cls, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#333',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                      }}
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Stats Message */}
        {selectedVariant && !selectedWeaponStats && (
          <div style={{ padding: '12px', borderBottom: '1px solid #333', color: '#666', fontSize: '11px' }}>
            No detailed stats available for this weapon.
          </div>
        )}

        {/* Texture Preview - Show all variant textures + potential extras */}
        {selectedVariant && selectedWeaponInfo && (
          <div style={{ padding: '12px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#4a9eff' }}>
              Textures ({selectedWeaponInfo.variants.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedWeaponInfo.variants.map((variantName) => (
                <div key={variantName}>
                  <div style={{ fontSize: '9px', color: '#888', marginBottom: '4px' }}>
                    {variantName}
                  </div>
                  <img
                    src={getWeaponTexturePath(selectedVariant.weaponId, variantName)}
                    alt={`${variantName} texture`}
                    style={{
                      width: '100%',
                      border: variantName === selectedVariant.variant ? '2px solid #4a9eff' : '1px solid #333',
                      borderRadius: '4px',
                      background: '#000',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
              <div>Texture Count: {selectedWeaponInfo.textureCount}</div>
              <div>Animations: {selectedWeaponInfo.animationCount}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
