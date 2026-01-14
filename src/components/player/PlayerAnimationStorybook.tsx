import { Canvas, useGraph, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// Gender mapping - determines base animation type (m for male, w for female)
const GENDER_MAP: Record<string, 'm' | 'w'> = {
  // Male classes
  humar: 'm',
  hucast: 'm',
  ramar: 'm',
  racast: 'm',
  fomar: 'm',
  hunewm: 'm',
  fonewm: 'm',
  // Female classes
  humarl: 'w',
  hucaseal: 'w',
  ramarl: 'w',
  racaseal: 'w',
  fomarl: 'w',
  hunewearl: 'w',
  fonewearl: 'w',
};

// Map class IDs to their PC prefix for textures
const CLASS_TO_PC_PREFIX: Record<string, string> = {
  humar: 'pc_00',
  humarl: 'pc_01',
  ramar: 'pc_02',
  ramarl: 'pc_03',
  fomar: 'pc_04',
  fomarl: 'pc_05',
  hunewm: 'pc_06',
  hunewearl: 'pc_07',
  fonewm: 'pc_08',
  fonewearl: 'pc_09',
  hucast: 'pc_10',
  hucaseal: 'pc_11',
  racast: 'pc_12',
  racaseal: 'pc_13',
};

// Class display names
const CLASS_NAMES: Record<string, string> = {
  humar: 'HUmar',
  humarl: 'HUmarl',
  hucast: 'HUcast',
  hucaseal: 'HUcaseal',
  hunewm: 'HUnewm',
  hunewearl: 'HUnewearl',
  ramar: 'RAmar',
  ramarl: 'RAmarl',
  racast: 'RAcast',
  racaseal: 'RAcaseal',
  fomar: 'FOmar',
  fomarl: 'FOmarl',
  fonewm: 'FOnewm',
  fonewearl: 'FOnewearl',
};

// Weapons each class CANNOT equip (based on weapon usableBy data)
// Hunter Human = humar, humarl | Hunter Newman = hunewm, hunewearl | Hunter Cast = hucast, hucaseal
// Ranger Human = ramar, ramarl | Ranger Cast = racast, racaseal
// Force Human = fomar, fomarl | Force Newman = fonewm, fonewearl
const CLASS_WEAPON_RESTRICTIONS: Record<string, string[]> = {
  // Hunter Human
  humar: ['rod', 'shotgun'],
  humarl: ['rod', 'shotgun'],
  // Hunter Newman
  hunewm: ['rod', 'shotgun', 'machinegun'],
  hunewearl: ['rod', 'shotgun', 'machinegun'],
  // Hunter Cast
  hucast: ['rod', 'shotgun', 'machinegun'],
  hucaseal: ['rod', 'shotgun', 'machinegun'],
  // Ranger Human
  ramar: ['rod', 'claw', 'dagger', 'shield', 'slicer', 'sword'],
  ramarl: ['rod', 'claw', 'dagger', 'shield', 'slicer', 'sword'],
  // Ranger Cast
  racast: ['rod', 'claw', 'dagger', 'shield', 'sword'],
  racaseal: ['rod', 'claw', 'dagger', 'shield', 'sword'],
  // Force Human
  fomar: ['shotgun', 'claw', 'spear', 'sword'],
  fomarl: ['shotgun', 'claw', 'spear', 'sword'],
  // Force Newman
  fonewm: ['shotgun', 'claw', 'dagger', 'machinegun', 'shield', 'spear', 'sword'],
  fonewearl: ['shotgun', 'claw', 'dagger', 'machinegun', 'shield', 'spear', 'sword'],
};

// Animation categories with their folder names and display labels
const ANIMATION_CATEGORIES = [
  { id: 'common', label: 'Common', prefix: '00' },
  { id: 'saver', label: 'Saber', prefix: '01' },
  { id: 'sword', label: 'Sword', prefix: '02' },
  { id: 'dagger', label: 'Dagger', prefix: '03' },
  { id: 'spear', label: 'Spear', prefix: '04' },
  { id: 'claw', label: 'Claw', prefix: '05' },
  { id: 'shield', label: 'Shield', prefix: '06' },
  { id: 'handgun', label: 'Handgun', prefix: '08' },
  { id: 'shotgun', label: 'Rifle', prefix: '10' },
  { id: 'machinegun', label: 'Machinegun', prefix: '11' },
  { id: 'grenade', label: 'Grenade', prefix: '12' },
  { id: 'rod', label: 'Rod', prefix: '14' },
  { id: 'wand', label: 'Wand', prefix: '15' },
  { id: 'slicer', label: 'Slicer', prefix: '16' },
];

// Weapon model mapping for each animation category
// Maps category ID to weapon GLB path (most basic/lowest rarity weapon for each type)
const CATEGORY_WEAPON_MAP: Record<string, string | null> = {
  common: null, // No weapon for common animations
  saver: '/weapons/wsac01/wsac01/wsac01_1_o.glb', // Saber (rarity 1)
  sword: '/weapons/wswr01/wswr01/wswr01_1_b.glb', // Sword (rarity 4 - lowest available)
  dagger: '/weapons/wdah01/wdah01/wdah01_1_l.glb', // Daggers (rarity 1)
  spear: '/weapons/wsph01/wsph01/wsph01_1_b.glb', // Spear (rarity 2 - lowest available)
  claw: '/weapons/wclh02/wclh02/wclh02_1_o.glb', // Claw (rarity 2 - lowest available)
  shield: '/weapons/wshh01/wshh01/wshh01_1_o.glb', // Shield (rarity 1)
  handgun: '/weapons/whgc01/whgc01/whgc01_1_o.glb', // Handgun (rarity 1)
  shotgun: '/weapons/wrfh01/wrfh01/wrfh01_1_b.glb', // Rifle (rarity 1)
  machinegun: '/weapons/wmgh01/wmgh01/wmgh01_1_l.glb', // Machinegun (rarity 1)
  grenade: '/weapons/wbac02/wbac02/wbac02_1_b.glb', // Bazooka (rarity 1)
  rod: '/weapons/wroh01/wroh01/wroh01_1_b.glb', // Rod (rarity 1)
  wand: '/weapons/wwan01/wwan01/wwan01_1_o.glb', // Wand (rarity 1)
  slicer: '/weapons/wslc02/wslc02/wslc02_1_o.glb', // Slicer (rarity 3 - lowest available)
};

// Standard animation names in each 22-animation set
const ANIMATION_LABELS: Record<string, string> = {
  'binpmbn_wait': 'Idle',
  'bindummy1': 'Dummy 1',
  'binpmsa_run': 'Run',
  'binpmsa_esc_f': 'Escape Forward',
  'binpmsa_chg': 'Charge',
  'binpmsa_stp_fb': 'Step F/B',
  'binpmsa_stp_lr': 'Step L/R',
  'binpmbn_dam_n': 'Damage Normal',
  'binpmbn_dam_h': 'Damage Heavy',
  'binpmbn_dam_d': 'Damage Down',
  'binpmbn_dam_d_lp': 'Damage Down Loop',
  'binpmbn_dam_d_wa': 'Damage Down Wake',
  'bindummy2': 'Dummy 2',
  'binpmsa_slp': 'Sleep',
  'binpmbn_atk1': 'Attack 1',
  'binpmbn_atk2': 'Attack 2',
  'binpmbn_atk3': 'Attack 3',
  'binpmbn_pa1': 'Photon Art 1',
  'binpmbn_pa2': 'Photon Art 2',
  'binpmbn_pa3': 'Photon Art 3',
  'binpmbn_tec': 'Technique',
  'binpmbn_pb': 'Photon Blast',
  'binpmbn_pb_lp': 'Photon Blast Loop',
  'bindummy4': 'Dummy 4',
};

// Player model component with animation support
function PlayerModel({
  modelGlbPath,
  animationGlbPath,
  textureUrl,
  weaponGlbPath,
  selectedAnimation,
  isPlaying,
  playbackSpeed,
  showSkeleton,
  onAnimationsLoaded,
  onBonesFound,
}: {
  modelGlbPath: string;
  animationGlbPath: string;
  textureUrl: string;
  weaponGlbPath: string | null;
  selectedAnimation: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
  showSkeleton: boolean;
  onAnimationsLoaded?: (animations: string[]) => void;
  onBonesFound?: (bones: string[]) => void;
}) {
  const group = useRef<Group>(null);
  const weaponRef = useRef<THREE.Object3D | null>(null);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);

  // Load character model and clone it for proper skeleton handling
  const { scene } = useGLTF(modelGlbPath);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);

  // Load animations from animation GLB
  const animGltf = useGLTF(animationGlbPath);

  // Load weapon if specified
  const weaponGltf = weaponGlbPath ? useGLTF(weaponGlbPath) : null;

  // Use animations from the animation GLB, bound to the model's group
  const { actions } = useAnimations(animGltf.animations, group);

  // Find the hand bone from the nodes
  const handBone = nodes['070_RArm02'] as THREE.Bone | undefined;

  // Report available bones
  useEffect(() => {
    if (onBonesFound) {
      const boneNames = Object.keys(nodes).filter(
        (name) => (nodes[name] as any)?.isBone
      );
      if (boneNames.length > 0) {
        onBonesFound(boneNames);
      }
    }
  }, [nodes, onBonesFound]);

  // Report available animations
  useEffect(() => {
    if (animGltf.animations.length > 0 && onAnimationsLoaded) {
      onAnimationsLoaded(animGltf.animations.map((a) => a.name));
    }
  }, [animGltf.animations, onAnimationsLoaded]);

  // Handle animation selection and playback
  useEffect(() => {
    if (!selectedAnimation || !actions[selectedAnimation]) return;

    // Stop all animations
    Object.values(actions).forEach((action) => action?.stop());

    // Play selected animation
    const action = actions[selectedAnimation];
    if (action) {
      action.reset().fadeIn(0.2).play();
      action.setLoop(THREE.LoopRepeat, Infinity);
    }

    return () => {
      if (actions[selectedAnimation]) {
        actions[selectedAnimation]?.fadeOut(0.2);
      }
    };
  }, [selectedAnimation, actions]);

  // Update playback speed
  useEffect(() => {
    if (selectedAnimation && actions[selectedAnimation]) {
      actions[selectedAnimation]!.timeScale = playbackSpeed;
    }
  }, [playbackSpeed, selectedAnimation, actions]);

  // Play/pause control
  useEffect(() => {
    if (selectedAnimation && actions[selectedAnimation]) {
      actions[selectedAnimation]!.paused = !isPlaying;
    }
  }, [isPlaying, selectedAnimation, actions]);

  // Load and apply texture
  useEffect(() => {
    if (!textureUrl || !clone) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      textureUrl,
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        clone.traverse((child: any) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => {
                mat.map = texture;
                mat.needsUpdate = true;
              });
            } else {
              child.material.map = texture;
              child.material.needsUpdate = true;
            }
          }
        });
      },
      undefined,
      (error) => console.error('Error loading texture:', error)
    );
  }, [textureUrl, clone]);

  // Create weapon mesh (added to group, not bone, for proper rendering)
  useEffect(() => {
    if (!weaponGltf || !group.current) return;

    // Remove previous weapon
    if (weaponRef.current) {
      weaponRef.current.removeFromParent();
      weaponRef.current = null;
    }

    // Clone and prepare weapon
    const weaponClone = weaponGltf.scene.clone(true);
    weaponClone.traverse((child: any) => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.computeVertexNormals();
        }
        child.material = new THREE.MeshNormalMaterial({
          flatShading: true,
        });
      }
    });

    // Add weapon to the main group (not the bone)
    // We'll sync its transform to the bone in useFrame
    group.current.add(weaponClone);
    weaponRef.current = weaponClone;

    console.log('Weapon created, will sync to bone:', handBone?.name);

    return () => {
      if (weaponRef.current) {
        weaponRef.current.removeFromParent();
        weaponRef.current = null;
      }
    };
  }, [weaponGltf, weaponGlbPath]);

  // Sync weapon transform to hand bone every frame
  useFrame(() => {
    if (!weaponRef.current || !handBone) return;

    // Update the bone's world matrix
    handBone.updateWorldMatrix(true, false);

    // Copy the bone's world position and rotation to the weapon
    weaponRef.current.position.setFromMatrixPosition(handBone.matrixWorld);
    weaponRef.current.quaternion.setFromRotationMatrix(handBone.matrixWorld);
  });

  // Skeleton helper for debugging bone positions
  useEffect(() => {
    if (!clone || !group.current) return;

    // Create or remove skeleton helper based on showSkeleton prop
    if (showSkeleton) {
      const helper = new THREE.SkeletonHelper(clone);
      (helper.material as THREE.LineBasicMaterial).linewidth = 2;
      group.current.add(helper);
      skeletonHelperRef.current = helper;
    }

    return () => {
      if (skeletonHelperRef.current && group.current) {
        group.current.remove(skeletonHelperRef.current);
        skeletonHelperRef.current = null;
      }
    };
  }, [clone, showSkeleton]);

  return (
    <group ref={group}>
      <primitive object={clone} />
    </group>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial color="#444" wireframe />
    </mesh>
  );
}

export default function PlayerAnimationStorybook() {
  const [selectedClass, setSelectedClass] = useState<string>('humar');
  const [selectedCategory, setSelectedCategory] = useState<string>('common');
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useSpecialAnimation, setUseSpecialAnimation] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [boneList, setBoneList] = useState<string[]>([]);

  // Get gender for selected class (m or w)
  const gender = GENDER_MAP[selectedClass] || 'm';
  // Apply special animation toggle: m -> sm, w -> sw
  const bodyType = useSpecialAnimation ? (gender === 'm' ? 'sm' : 'sw') : gender;

  // Get weapon restrictions for the selected class
  const restrictions = CLASS_WEAPON_RESTRICTIONS[selectedClass] || [];

  // Build animation GLB path
  const category = ANIMATION_CATEGORIES.find((c) => c.id === selectedCategory);
  const animationSetId = category ? `${category.prefix}_${selectedCategory}_${bodyType}` : null;
  const animationGlbPath = animationSetId
    ? `/player/animations/${selectedCategory}/${bodyType}/${animationSetId}/pc_000_000.glb`
    : null;

  // Build character model path and texture URL
  const pcPrefix = CLASS_TO_PC_PREFIX[selectedClass] || 'pc_00';
  const variation = `${pcPrefix}0`; // e.g., pc_000, pc_010, etc.
  const modelGlbPath = `/player/${variation}/${variation}/${variation}_000.glb`;
  const textureUrl = `/player/${variation}/textures/${variation}_000.png`;

  // Get weapon model path for current category
  const weaponGlbPath = CATEGORY_WEAPON_MAP[selectedCategory] || null;

  // Reset animation when category, class, or special toggle changes
  useEffect(() => {
    setSelectedAnimation(null);
    setAvailableAnimations([]);
    setLoadError(null);
    // Reset to common if current category is restricted for this class
    const classRestrictions = CLASS_WEAPON_RESTRICTIONS[selectedClass] || [];
    if (classRestrictions.includes(selectedCategory)) {
      setSelectedCategory('common');
    }
  }, [selectedClass, selectedCategory, useSpecialAnimation]);

  const handleAnimationsLoaded = (animations: string[]) => {
    setAvailableAnimations(animations);
    if (animations.length > 0 && !selectedAnimation) {
      setSelectedAnimation(animations[0]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        {/* Left Panel - Class Selection */}
        <div style={styles.leftPanel}>
          <h3 style={styles.panelTitle}>Class</h3>
          <div style={styles.classList}>
            {Object.entries(CLASS_NAMES).map(([id, name]) => (
              <button
                key={id}
                style={{
                  ...styles.classBtn,
                  ...(selectedClass === id ? styles.classBtnActive : {}),
                }}
                onClick={() => setSelectedClass(id)}
              >
                <span style={styles.className}>{name}</span>
                <span style={styles.bodyType}>{GENDER_MAP[id] === 'm' ? 'M' : 'F'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center - 3D Canvas */}
        <div style={styles.centerPanel}>
          <div style={styles.canvasHeader}>
            <span style={styles.headerText}>
              {CLASS_NAMES[selectedClass]} - {category?.label || selectedCategory}
            </span>
            <span style={styles.headerSubtext}>Body Type: {bodyType}</span>
          </div>
          <div style={styles.canvasContainer}>
            <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <directionalLight position={[-5, 3, -5]} intensity={0.4} />
              <Suspense fallback={<LoadingFallback />}>
                {animationGlbPath && (
                  <PlayerModel
                    key={`${modelGlbPath}-${animationGlbPath}-${weaponGlbPath}`}
                    modelGlbPath={modelGlbPath}
                    animationGlbPath={animationGlbPath}
                    textureUrl={textureUrl}
                    weaponGlbPath={weaponGlbPath}
                    selectedAnimation={selectedAnimation}
                    isPlaying={isPlaying}
                    playbackSpeed={playbackSpeed}
                    showSkeleton={showSkeleton}
                    onAnimationsLoaded={handleAnimationsLoaded}
                    onBonesFound={setBoneList}
                  />
                )}
              </Suspense>
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                minDistance={1}
                maxDistance={10}
              />
              <gridHelper args={[10, 10, '#333', '#222']} />
            </Canvas>
          </div>
          {loadError && <div style={styles.errorText}>{loadError}</div>}
        </div>

        {/* Right Panel - Animation Controls */}
        <div style={styles.rightPanel}>
          {/* Category Selection */}
          <div style={styles.section}>
            <h3 style={styles.panelTitle}>Weapon / Category</h3>
            <div style={styles.categoryList}>
              {ANIMATION_CATEGORIES.map((cat) => {
                const isRestricted = restrictions.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    style={{
                      ...styles.categoryBtn,
                      ...(selectedCategory === cat.id ? styles.categoryBtnActive : {}),
                      ...(isRestricted ? styles.categoryBtnDisabled : {}),
                    }}
                    onClick={() => !isRestricted && setSelectedCategory(cat.id)}
                    disabled={isRestricted}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Animation Toggle */}
          <div style={styles.section}>
            <h3 style={styles.panelTitle}>Animation Type</h3>
            <label style={styles.toggleContainer}>
              <input
                type="checkbox"
                checked={useSpecialAnimation}
                onChange={(e) => setUseSpecialAnimation(e.target.checked)}
                style={styles.toggleCheckbox}
              />
              <span style={styles.toggleLabel}>
                Special ({gender === 'm' ? 'sm' : 'sw'})
              </span>
            </label>
            <div style={styles.toggleInfo}>
              Current: <strong>{bodyType}</strong>
            </div>
          </div>

          {/* Animation List */}
          <div style={styles.section}>
            <h3 style={styles.panelTitle}>
              Animations ({availableAnimations.length})
            </h3>
            <div style={styles.animationList}>
              {availableAnimations.length === 0 ? (
                <div style={styles.noAnimations}>Loading animations...</div>
              ) : (
                availableAnimations.map((anim, index) => (
                  <button
                    key={anim}
                    style={{
                      ...styles.animationBtn,
                      ...(selectedAnimation === anim ? styles.animationBtnActive : {}),
                    }}
                    onClick={() => setSelectedAnimation(anim)}
                  >
                    <span style={styles.animIndex}>{index}</span>
                    <span style={styles.animName}>
                      {ANIMATION_LABELS[anim] || anim}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div style={styles.section}>
            <h3 style={styles.panelTitle}>Playback</h3>
            <div style={styles.playbackControls}>
              <button
                style={{
                  ...styles.playBtn,
                  ...(isPlaying ? styles.playBtnActive : {}),
                }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <div style={styles.speedControl}>
                <label style={styles.speedLabel}>Speed: {playbackSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  style={styles.speedSlider}
                />
              </div>
            </div>
          </div>

          {/* Skeleton Debug */}
          <div style={styles.section}>
            <h3 style={styles.panelTitle}>Skeleton Debug</h3>
            <label style={styles.toggleContainer}>
              <input
                type="checkbox"
                checked={showSkeleton}
                onChange={(e) => setShowSkeleton(e.target.checked)}
                style={styles.toggleCheckbox}
              />
              <span style={styles.toggleLabel}>Show Skeleton</span>
            </label>
            {showSkeleton && boneList.length > 0 && (
              <div style={styles.boneList}>
                <div style={styles.boneListHeader}>Bones ({boneList.length}):</div>
                {boneList.map((bone, i) => (
                  <div key={bone} style={styles.boneItem}>
                    <span style={styles.boneIndex}>{i}</span>
                    <span style={styles.boneName}>{bone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Animation Info */}
          {selectedAnimation && (
            <div style={styles.section}>
              <h3 style={styles.panelTitle}>Current Animation</h3>
              <div style={styles.animInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Name:</span>
                  <span style={styles.infoValue}>{selectedAnimation}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Label:</span>
                  <span style={styles.infoValue}>
                    {ANIMATION_LABELS[selectedAnimation] || 'Unknown'}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>GLB Path:</span>
                  <span style={styles.infoValueSmall}>{animationGlbPath}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1a1a2e',
    minHeight: '100vh',
    color: '#fff',
    padding: '16px',
  },
  layout: {
    display: 'flex',
    gap: '16px',
    height: 'calc(100vh - 32px)',
  },
  leftPanel: {
    width: '180px',
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
    overflowY: 'auto',
  },
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rightPanel: {
    width: '280px',
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  panelTitle: {
    fontSize: '12px',
    color: '#6b8afd',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  classBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
  },
  classBtnActive: {
    background: '#4a4a6a',
    color: '#fff',
    border: '1px solid #6b8afd',
  },
  className: {
    fontWeight: 'bold',
  },
  bodyType: {
    fontSize: '10px',
    color: '#888',
    background: '#333',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  canvasHeader: {
    background: '#2d2d44',
    borderRadius: '8px',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#6bf',
  },
  headerSubtext: {
    fontSize: '12px',
    color: '#888',
  },
  canvasContainer: {
    flex: 1,
    background: '#0a0a1a',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  errorText: {
    color: '#f66',
    fontSize: '12px',
    textAlign: 'center',
    padding: '8px',
  },
  section: {
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '12px',
  },
  categoryList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '4px',
  },
  categoryBtn: {
    padding: '6px 8px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '10px',
  },
  categoryBtnActive: {
    background: '#4a4a6a',
    color: '#fff',
    border: '1px solid #6b8afd',
  },
  categoryBtnDisabled: {
    background: '#151520',
    color: '#555',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  animationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  noAnimations: {
    color: '#666',
    fontSize: '12px',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '16px',
  },
  animationBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '11px',
    textAlign: 'left',
  },
  animationBtnActive: {
    background: '#4a4a6a',
    color: '#fff',
    border: '1px solid #6b8afd',
  },
  animIndex: {
    fontSize: '10px',
    color: '#666',
    background: '#333',
    padding: '2px 5px',
    borderRadius: '3px',
    minWidth: '20px',
    textAlign: 'center',
  },
  animName: {
    flex: 1,
  },
  playbackControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  playBtn: {
    padding: '10px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  playBtnActive: {
    background: '#2d5a2d',
    color: '#6f6',
    border: '1px solid #4a4',
  },
  speedControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  speedLabel: {
    fontSize: '11px',
    color: '#888',
  },
  speedSlider: {
    width: '100%',
  },
  animInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: '#1a1a2e',
    borderRadius: '4px',
    padding: '10px',
  },
  infoRow: {
    display: 'flex',
    gap: '8px',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#888',
    minWidth: '50px',
  },
  infoValue: {
    fontSize: '11px',
    color: '#fff',
    wordBreak: 'break-all',
  },
  infoValueSmall: {
    fontSize: '9px',
    color: '#666',
    wordBreak: 'break-all',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px 10px',
    background: '#1a1a2e',
    borderRadius: '4px',
    border: '1px solid #444',
  },
  toggleCheckbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  toggleLabel: {
    fontSize: '12px',
    color: '#aaa',
  },
  toggleInfo: {
    fontSize: '11px',
    color: '#888',
    marginTop: '6px',
    padding: '4px 8px',
  },
  boneList: {
    marginTop: '8px',
    background: '#1a1a2e',
    borderRadius: '4px',
    padding: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  boneListHeader: {
    fontSize: '11px',
    color: '#6b8afd',
    marginBottom: '6px',
  },
  boneItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '3px 0',
    borderBottom: '1px solid #2a2a3a',
  },
  boneIndex: {
    fontSize: '10px',
    color: '#666',
    background: '#333',
    padding: '1px 4px',
    borderRadius: '3px',
    minWidth: '18px',
    textAlign: 'center',
  },
  boneName: {
    fontSize: '11px',
    color: '#ccc',
    fontFamily: 'monospace',
  },
};
