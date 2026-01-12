import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Body type mapping - which classes use which animation body type
const BODY_TYPE_MAP: Record<string, string> = {
  // Male Human/Cast = m
  humar: 'm',
  hucast: 'm',
  ramar: 'm',
  racast: 'm',
  fomar: 'm',
  // Female Human/Cast = w
  humarl: 'w',
  hucaseal: 'w',
  ramarl: 'w',
  racaseal: 'w',
  fomarl: 'w',
  // Male Newman = sm
  hunewm: 'sm',
  fonewm: 'sm',
  // Female Newman = sw
  hunewearl: 'sw',
  fonewearl: 'sw',
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

// Animation categories with their folder names and display labels
const ANIMATION_CATEGORIES = [
  { id: 'common', label: 'Common', prefix: '00' },
  { id: 'sword', label: 'Sword', prefix: '02' },
  { id: 'dagger', label: 'Dagger', prefix: '03' },
  { id: 'claw', label: 'Claw', prefix: '05' },
  { id: 'spear', label: 'Spear', prefix: '06' },
  { id: 'saber', label: 'Saber', prefix: '07' },
  { id: 'slicer', label: 'Slicer', prefix: '08' },
  { id: 'handgun', label: 'Handgun', prefix: '09' },
  { id: 'machinegun', label: 'Machinegun', prefix: '10' },
  { id: 'shotgun', label: 'Shotgun', prefix: '11' },
  { id: 'grenade', label: 'Grenade', prefix: '12' },
  { id: 'rod', label: 'Rod', prefix: '13' },
  { id: 'wand', label: 'Wand', prefix: '14' },
  { id: 'shield', label: 'Shield', prefix: '15' },
];

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
  animationGlbPath,
  selectedAnimation,
  isPlaying,
  playbackSpeed,
  onAnimationsLoaded,
}: {
  animationGlbPath: string;
  selectedAnimation: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
  onAnimationsLoaded?: (animations: string[]) => void;
}) {
  const { scene, animations } = useGLTF(animationGlbPath);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);

    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        obj.geometry.computeVertexNormals();
      }
    });

    // Get bounding box and center/scale
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    clone.position.x = -center.x;
    clone.position.z = -center.z;

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 2) {
      const scale = 2 / maxDim;
      clone.scale.setScalar(scale);
    }

    const scaledBox = new THREE.Box3().setFromObject(clone);
    clone.position.y = -scaledBox.min.y;

    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) {
        obj.material = obj.material.clone();
        obj.material.side = THREE.FrontSide;
      }
    });

    return clone;
  }, [scene]);

  // Create mixer
  useEffect(() => {
    mixerRef.current = new THREE.AnimationMixer(clonedScene);
    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
    };
  }, [clonedScene]);

  // Report available animations
  useEffect(() => {
    if (animations.length > 0 && onAnimationsLoaded) {
      onAnimationsLoaded(animations.map((a) => a.name));
    }
  }, [animations, onAnimationsLoaded]);

  // Handle animation selection and playback
  useEffect(() => {
    if (!mixerRef.current || !selectedAnimation) return;

    const clip = animations.find((a) => a.name === selectedAnimation);
    if (!clip) return;

    // Stop previous animation
    if (actionRef.current) {
      actionRef.current.stop();
    }

    const action = mixerRef.current.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = true;

    if (isPlaying) {
      action.play();
    }

    actionRef.current = action;
  }, [selectedAnimation, animations, isPlaying]);

  // Update playback speed
  useEffect(() => {
    if (actionRef.current) {
      actionRef.current.timeScale = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Play/pause control
  useEffect(() => {
    if (actionRef.current) {
      actionRef.current.paused = !isPlaying;
    }
  }, [isPlaying]);

  // Animation update loop
  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={clonedScene} />;
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

  // Get body type for selected class
  const bodyType = BODY_TYPE_MAP[selectedClass] || 'm';

  // Build animation GLB path
  const category = ANIMATION_CATEGORIES.find((c) => c.id === selectedCategory);
  const animationSetId = category ? `${category.prefix}_${selectedCategory}_${bodyType}` : null;
  const animationGlbPath = animationSetId
    ? `/player/animations/${selectedCategory}/${bodyType}/${animationSetId}/pc_000_000.glb`
    : null;

  // Reset animation when category or class changes
  useEffect(() => {
    setSelectedAnimation(null);
    setAvailableAnimations([]);
    setLoadError(null);
  }, [selectedClass, selectedCategory]);

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
                <span style={styles.bodyType}>{BODY_TYPE_MAP[id]}</span>
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
                    key={animationGlbPath}
                    animationGlbPath={animationGlbPath}
                    selectedAnimation={selectedAnimation}
                    isPlaying={isPlaying}
                    playbackSpeed={playbackSpeed}
                    onAnimationsLoaded={handleAnimationsLoaded}
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
              {ANIMATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  style={{
                    ...styles.categoryBtn,
                    ...(selectedCategory === cat.id ? styles.categoryBtnActive : {}),
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
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
    borderColor: '#6b8afd',
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
    borderColor: '#6b8afd',
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
    borderColor: '#6b8afd',
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
    borderColor: '#4a4',
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
};
