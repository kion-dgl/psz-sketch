import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  ENEMY_CATEGORIES,
  ALL_ENEMY_IDS,
  getEnemyCategory,
  getEnemyGlbPath,
  getEnemyInfoPath,
  getEnemyDisplayName,
  getEnemyElement,
  isEnemyBoss,
  isEnemyRare,
  type EnemyInfo,
  type EnemyCategory,
  type EnemyElement,
} from './enemyData';

// Enemy 3D Preview Component
function EnemyModel({
  enemyId,
  modelBaseName,
}: {
  enemyId: string;
  modelBaseName: string;
}) {
  const glbPath = getEnemyGlbPath(enemyId, modelBaseName);
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

    // Scale to fit in view
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 3) {
      const scale = 3 / maxDim;
      clone.scale.setScalar(scale);
    }

    // Apply front-side rendering to all materials
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.material instanceof THREE.Material) {
          obj.material = obj.material.clone();
          obj.material.side = THREE.FrontSide;
        }
      }
    });

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
  category: EnemyCategory;
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

// Element color mapping
const ELEMENT_COLORS: Record<EnemyElement, string> = {
  Native: '#4ade80',
  Beast: '#f97316',
  Machine: '#60a5fa',
  Dark: '#a855f7',
};

// Enemy list item
function EnemyItem({
  enemyId,
  selected,
  onClick,
}: {
  enemyId: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isBoss = isEnemyBoss(enemyId);
  const isRare = isEnemyRare(enemyId);
  const displayName = getEnemyDisplayName(enemyId);
  const element = getEnemyElement(enemyId);

  let color = '#ccc';
  if (isBoss) color = '#ff4444';
  else if (isRare) color = '#ffcc00';
  else if (element) color = ELEMENT_COLORS[element];

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '6px 8px',
        background: selected ? '#2a3a5e' : 'transparent',
        border: selected ? '1px solid #4a9eff' : '1px solid transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '10px',
        color: color,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>
          {isBoss && '* '}
          {displayName}
        </span>
        {isRare && (
          <span style={{ fontSize: '8px', color: '#ffcc00' }}>RARE</span>
        )}
      </div>
    </button>
  );
}

// Main Gallery Component
export default function EnemyGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('gurhacia');
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const [enemyInfoMap, setEnemyInfoMap] = useState<Record<string, EnemyInfo>>({});
  const [loading, setLoading] = useState(true);

  // Load enemy info files
  useEffect(() => {
    async function loadAllEnemies() {
      const infoMap: Record<string, EnemyInfo> = {};

      await Promise.all(
        ALL_ENEMY_IDS.map(async (enemyId) => {
          try {
            const res = await fetch(getEnemyInfoPath(enemyId));
            const info = await res.json();
            infoMap[enemyId] = {
              id: enemyId,
              name: info.name || enemyId,
              modelBaseName: info.modelBaseName,
              animationCount: info.animationCount || 0,
              effectCount: info.effectCount || 0,
            };
          } catch (err) {
            console.error(`Failed to load enemy ${enemyId}:`, err);
          }
        })
      );

      setEnemyInfoMap(infoMap);
      setLoading(false);
    }

    loadAllEnemies();
  }, []);

  // Group enemies by category
  const enemiesByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {};

    for (const cat of ENEMY_CATEGORIES) {
      grouped[cat.id] = [];
    }
    grouped['other'] = [];

    for (const enemyId of ALL_ENEMY_IDS) {
      const category = getEnemyCategory(enemyId);
      if (category) {
        grouped[category.id].push(enemyId);
      } else {
        grouped['other'].push(enemyId);
      }
    }

    return grouped;
  }, []);

  // Get enemies to display
  const displayedEnemies = useMemo(() => {
    return enemiesByCategory[selectedCategory] || [];
  }, [selectedCategory, enemiesByCategory]);

  const selectedEnemyInfo = selectedEnemy ? enemyInfoMap[selectedEnemy] : null;

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
          width: '160px',
          flexShrink: 0,
          borderRight: '1px solid #333',
          padding: '8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4a9eff' }}>
          Areas
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {ENEMY_CATEGORIES.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              count={enemiesByCategory[cat.id]?.length || 0}
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Left Panel - Enemy List */}
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
          Enemies
          <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '4px' }}>
            ({displayedEnemies.length})
          </span>
        </h3>

        {loading ? (
          <div style={{ color: '#666', fontSize: '11px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {displayedEnemies.map((enemyId) => (
              <EnemyItem
                key={enemyId}
                enemyId={enemyId}
                selected={selectedEnemy === enemyId}
                onClick={() => setSelectedEnemy(enemyId)}
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
        {selectedEnemy && selectedEnemyInfo && (
          <div
            style={{
              padding: '8px 12px',
              background: '#111',
              borderBottom: '1px solid #333',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {getEnemyDisplayName(selectedEnemy)}
              </span>
              {isEnemyBoss(selectedEnemy) && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: '#ff4444',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white',
                  }}
                >
                  BOSS
                </span>
              )}
              {isEnemyRare(selectedEnemy) && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: '#ffcc00',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'black',
                  }}
                >
                  RARE
                </span>
              )}
              {getEnemyElement(selectedEnemy) && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: ELEMENT_COLORS[getEnemyElement(selectedEnemy)!],
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white',
                  }}
                >
                  {getEnemyElement(selectedEnemy)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: '#666' }}>
              <span>Model: {selectedEnemy}</span>
              <span>Animations: {selectedEnemyInfo.animationCount}</span>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, background: '#0a0a12' }}>
          {selectedEnemy && selectedEnemyInfo ? (
            <Canvas camera={{ position: [3, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-5, -5, -5]} intensity={0.3} />
              <Suspense fallback={<LoadingSpinner />}>
                <EnemyModel
                  key={selectedEnemy}
                  enemyId={selectedEnemy}
                  modelBaseName={selectedEnemyInfo.modelBaseName}
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
              Select an enemy to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
