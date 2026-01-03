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
  type WeaponInfo,
  type WeaponCategory,
} from './weaponData';

// Weapon 3D Preview Component
function WeaponModel({ weaponId, variant }: { weaponId: string; variant: string }) {
  const glbPath = getWeaponGlbPath(weaponId, variant);
  const { scene } = useGLTF(glbPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    // Center the model
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    return clone;
  }, [scene]);

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
        padding: '10px 12px',
        background: selected ? '#4a9eff' : 'transparent',
        color: selected ? 'white' : '#ccc',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span>{category.label}</span>
      <span style={{ opacity: 0.6, fontSize: '11px' }}>{count}</span>
    </button>
  );
}

// Weapon card in grid
function WeaponCard({
  weaponId,
  selected,
  onClick,
}: {
  weaponId: string;
  selected: boolean;
  onClick: () => void;
}) {
  const category = getWeaponCategory(weaponId);
  const rarity = getWeaponRarity(weaponId);

  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px',
        background: selected ? '#2a3a5e' : '#1a1a2e',
        border: selected ? '2px solid #4a9eff' : '2px solid transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.15s',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}
      >
        {weaponId}
      </div>
      <div style={{ fontSize: '11px', color: rarity.color }}>{rarity.label}</div>
      {category && (
        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
          {category.label}
        </div>
      )}
    </button>
  );
}

// Main Gallery Component
export default function WeaponGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);
  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Group weapons by category
  const weaponsByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {};

    for (const cat of WEAPON_CATEGORIES) {
      grouped[cat.id] = [];
    }
    grouped['other'] = [];

    for (const weaponId of ALL_WEAPON_IDS) {
      const category = getWeaponCategory(weaponId);
      if (category) {
        grouped[category.id].push(weaponId);
      } else {
        grouped['other'].push(weaponId);
      }
    }

    return grouped;
  }, []);

  // Get weapons to display
  const displayedWeapons = useMemo(() => {
    if (selectedCategory) {
      return weaponsByCategory[selectedCategory] || [];
    }
    return ALL_WEAPON_IDS;
  }, [selectedCategory, weaponsByCategory]);

  // Load weapon info when selection changes
  useEffect(() => {
    if (!selectedWeapon) {
      setWeaponInfo(null);
      setSelectedVariant(null);
      return;
    }

    fetch(getWeaponInfoPath(selectedWeapon))
      .then((res) => res.json())
      .then((info: WeaponInfo) => {
        setWeaponInfo(info);
        setSelectedVariant(info.variants[0] || null);
      })
      .catch((err) => {
        console.error('Failed to load weapon info:', err);
        setWeaponInfo(null);
      });
  }, [selectedWeapon]);

  const selectedWeaponCategory = selectedWeapon ? getWeaponCategory(selectedWeapon) : null;
  const selectedWeaponRarity = selectedWeapon ? getWeaponRarity(selectedWeapon) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a12', color: 'white' }}>
      {/* Left Sidebar - Categories */}
      <div
        style={{
          width: '200px',
          borderRight: '1px solid #333',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#4a9eff' }}>Categories</h2>

        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 12px',
            marginBottom: '8px',
            background: selectedCategory === null ? '#4a9eff' : 'transparent',
            color: selectedCategory === null ? 'white' : '#ccc',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            textAlign: 'left',
          }}
        >
          All Weapons ({ALL_WEAPON_IDS.length})
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {WEAPON_CATEGORIES.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              count={weaponsByCategory[cat.id]?.length || 0}
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Middle - Weapon Grid */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
          {selectedCategory
            ? WEAPON_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Weapons'
            : 'All Weapons'}
          <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
            ({displayedWeapons.length})
          </span>
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
          }}
        >
          {displayedWeapons.map((weaponId) => (
            <WeaponCard
              key={weaponId}
              weaponId={weaponId}
              selected={selectedWeapon === weaponId}
              onClick={() => setSelectedWeapon(weaponId)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - 3D Preview */}
      <div
        style={{
          width: '400px',
          borderLeft: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Preview Canvas */}
        <div style={{ flex: 1, background: '#111' }}>
          {selectedWeapon && selectedVariant ? (
            <Canvas camera={{ position: [2, 1, 2], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <Suspense fallback={<LoadingSpinner />}>
                <WeaponModel weaponId={selectedWeapon} variant={selectedVariant} />
              </Suspense>
              <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
              <Environment preset="studio" />
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

        {/* Info Panel */}
        <div style={{ padding: '16px', borderTop: '1px solid #333' }}>
          {selectedWeapon && weaponInfo ? (
            <>
              <h3 style={{ margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                {selectedWeapon}
              </h3>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {selectedWeaponCategory && (
                  <span
                    style={{
                      padding: '4px 8px',
                      background: '#333',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {selectedWeaponCategory.label}
                  </span>
                )}
                {selectedWeaponRarity && (
                  <span
                    style={{
                      padding: '4px 8px',
                      background: '#333',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: selectedWeaponRarity.color,
                    }}
                  >
                    {selectedWeaponRarity.label}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                <div>Textures: {weaponInfo.textureCount}</div>
                <div>Animations: {weaponInfo.animationCount}</div>
              </div>

              {/* Variant Selector */}
              {weaponInfo.variants.length > 1 && (
                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                    Variants:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {weaponInfo.variants.map((variant) => (
                      <button
                        key={variant}
                        onClick={() => setSelectedVariant(variant)}
                        style={{
                          padding: '6px 10px',
                          background: selectedVariant === variant ? '#4a9eff' : '#333',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#666', fontSize: '13px' }}>
              Select a weapon from the grid to view details and 3D preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
