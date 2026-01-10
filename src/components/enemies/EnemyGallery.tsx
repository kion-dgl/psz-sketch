import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  ENEMY_CATEGORIES,
  ALL_ENEMY_IDS,
  getEnemyCategory,
  getEnemyGlbPath,
  getEnemyInfoPath,
  getEnemyDisplayName,
  getEnemyElement,
  getBaseEnemyId,
  isEnemyBoss,
  isEnemyRare,
  type EnemyInfo,
  type EnemyCategory,
  type EnemyElement,
} from './enemyData';

interface EffectData {
  name: string;
  file: string;
}

interface AnimationData {
  name: string;
  file: string;
}

// Effect 3D Model Component
function EffectModel({
  enemyId,
  effectName,
  offset,
}: {
  enemyId: string;
  effectName: string;
  offset: number;
}) {
  const glbPath = `/enemies/${enemyId}/effects/${effectName}/${effectName}.glb`;
  const { scene } = useGLTF(glbPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();

    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        obj.geometry.computeVertexNormals();
      }
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) {
        obj.material = obj.material.clone();
        obj.material.side = THREE.FrontSide;
      }
    });

    // Position effects to the side
    clone.position.x = offset * 2;

    return clone;
  }, [scene, offset]);

  return <primitive object={clonedScene} />;
}

// Enemy 3D Preview Component with Animation Support
function EnemyModel({
  enemyId,
  modelBaseName,
  animationSourcePath,
  selectedAnimation,
  isPlaying,
  onAnimationsLoaded,
}: {
  enemyId: string;
  modelBaseName: string;
  animationSourcePath: string | null; // Path to GLB with animations (if different from model)
  selectedAnimation: string | null;
  isPlaying: boolean;
  onAnimationsLoaded?: (animationNames: string[]) => void;
}) {
  const glbPath = getEnemyGlbPath(enemyId, modelBaseName);
  const { scene, animations: modelAnimations } = useGLTF(glbPath);

  // Load animations from a different source if provided
  const animSourceGltf = useGLTF(animationSourcePath || glbPath);

  // Use animations from the source (either own model or base enemy)
  const animations = animationSourcePath ? animSourceGltf.animations : modelAnimations;

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  const clonedScene = useMemo(() => {
    // Use SkeletonUtils.clone for proper skeleton cloning
    const clone = SkeletonUtils.clone(scene);

    // Compute vertex normals for proper lighting
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        obj.geometry.computeVertexNormals();
      }
    });

    // Get bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center horizontally (X and Z), but keep Y as-is for now
    clone.position.x = -center.x;
    clone.position.z = -center.z;

    // Scale to fit in view
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 3) {
      const scale = 3 / maxDim;
      clone.scale.setScalar(scale);
    }

    // Recalculate bounding box after scaling and position the model on the ground
    const scaledBox = new THREE.Box3().setFromObject(clone);
    clone.position.y = -scaledBox.min.y; // Move up so bottom sits at y=0

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

  // Create mixer for the cloned scene
  useEffect(() => {
    mixerRef.current = new THREE.AnimationMixer(clonedScene);

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [clonedScene]);

  // Handle animation playback
  useEffect(() => {
    if (!mixerRef.current) return;

    // Stop current animation
    if (actionRef.current) {
      actionRef.current.stop();
      actionRef.current = null;
    }

    if (selectedAnimation && isPlaying) {
      // Find the animation clip by name
      const clip = animations.find((c) => c.name === selectedAnimation);
      if (clip) {
        const action = mixerRef.current.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
        actionRef.current = action;
      }
    }
  }, [selectedAnimation, isPlaying, animations]);

  // Update mixer every frame
  useFrame((_, delta) => {
    if (mixerRef.current && isPlaying) {
      mixerRef.current.update(delta);
    }
  });

  // Report available animations
  useEffect(() => {
    const animNames = animations.map((a) => a.name);
    if (animNames.length > 0) {
      console.log(`Available animations for ${enemyId}:`, animNames);
    }
    if (onAnimationsLoaded) {
      onAnimationsLoaded(animNames);
    }
  }, [animations, enemyId, onAnimationsLoaded]);

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

  // Effects and animations state
  const [effects, setEffects] = useState<EffectData[]>([]);
  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [glbAnimationNames, setGlbAnimationNames] = useState<string[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Load effects and animations when enemy changes
  useEffect(() => {
    if (!selectedEnemy) {
      setEffects([]);
      setAnimations([]);
      setGlbAnimationNames([]);
      setSelectedEffect(null);
      setSelectedAnimation(null);
      setIsPlaying(false);
      return;
    }

    async function loadEnemyData() {
      // Load effects
      try {
        const effectsRes = await fetch(`/enemies/${selectedEnemy}/effects.json`);
        const effectsData = await effectsRes.json();
        setEffects(effectsData);
      } catch (err) {
        setEffects([]);
      }

      // Load animations
      try {
        const animRes = await fetch(`/enemies/${selectedEnemy}/animations.json`);
        const animData = await animRes.json();
        setAnimations(animData);
      } catch (err) {
        setAnimations([]);
      }

      // Reset state
      setSelectedEffect(null);
      setSelectedAnimation(null);
      setIsPlaying(false);
    }

    loadEnemyData();
  }, [selectedEnemy]);

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

  // For rare variants without animations, use animations from the base enemy
  const animationSourcePath = useMemo(() => {
    if (!selectedEnemy || !selectedEnemyInfo) return null;

    // Check if this enemy has a base enemy (i.e., it's a rare variant)
    const baseEnemyId = getBaseEnemyId(selectedEnemy);
    if (!baseEnemyId) return null;

    // Get the base enemy's info to find its modelBaseName
    const baseEnemyInfo = enemyInfoMap[baseEnemyId];
    if (!baseEnemyInfo) return null;

    // Return the path to the base enemy's GLB (which contains the animations)
    return getEnemyGlbPath(baseEnemyId, baseEnemyInfo.modelBaseName);
  }, [selectedEnemy, selectedEnemyInfo, enemyInfoMap]);

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
              <span>Effects: {selectedEnemyInfo.effectCount}</span>
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
                  animationSourcePath={animationSourcePath}
                  selectedAnimation={selectedAnimation}
                  isPlaying={isPlaying}
                  onAnimationsLoaded={setGlbAnimationNames}
                />
                {/* Render selected effect */}
                {selectedEffect && (
                  <EffectModel
                    key={selectedEffect}
                    enemyId={selectedEnemy}
                    effectName={selectedEffect}
                    offset={1}
                  />
                )}
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

      {/* Right Panel - Effects & Animations */}
      {selectedEnemy && selectedEnemyInfo && (
        <div
          style={{
            width: '200px',
            flexShrink: 0,
            borderLeft: '1px solid #333',
            padding: '8px',
            overflowY: 'auto',
          }}
        >
          {/* Animations Section */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4a9eff' }}>
              Animations
              <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '4px' }}>
                ({glbAnimationNames.length})
              </span>
            </h3>

            {glbAnimationNames.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={!selectedAnimation}
                    style={{
                      padding: '4px 8px',
                      background: isPlaying ? '#ff4444' : '#4a9eff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedAnimation ? 'pointer' : 'not-allowed',
                      fontSize: '10px',
                      opacity: selectedAnimation ? 1 : 0.5,
                    }}
                  >
                    {isPlaying ? 'Stop' : 'Play'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {glbAnimationNames.map((animName) => (
                    <button
                      key={animName}
                      onClick={() => {
                        setSelectedAnimation(animName);
                        setIsPlaying(true);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '4px 8px',
                        background: selectedAnimation === animName ? '#2a3a5e' : 'transparent',
                        border: selectedAnimation === animName ? '1px solid #4a9eff' : '1px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '10px',
                        color: selectedAnimation === animName ? '#4a9eff' : '#ccc',
                      }}
                    >
                      {animName}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: '#666', fontSize: '10px' }}>No animations</div>
            )}
          </div>

          {/* Effects Section */}
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4a9eff' }}>
              Effects
              <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '4px' }}>
                ({effects.length})
              </span>
            </h3>

            {effects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: selectedEffect === null ? '#2a3a5e' : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: selectedEffect === null ? '#4a9eff' : '#ccc',
                  }}
                >
                  <input
                    type="radio"
                    name="effect"
                    checked={selectedEffect === null}
                    onChange={() => setSelectedEffect(null)}
                    style={{ margin: 0 }}
                  />
                  None
                </label>
                {effects.map((effect) => (
                  <label
                    key={effect.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      background: selectedEffect === effect.name ? '#2a3a5e' : 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      color: selectedEffect === effect.name ? '#4a9eff' : '#ccc',
                    }}
                  >
                    <input
                      type="radio"
                      name="effect"
                      checked={selectedEffect === effect.name}
                      onChange={() => setSelectedEffect(effect.name)}
                      style={{ margin: 0 }}
                    />
                    {effect.name}
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: '10px' }}>No effects</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
