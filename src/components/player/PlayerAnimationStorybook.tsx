import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Gender mapping - determines base animation type (m for male, w for female)
const GENDER_MAP: Record<string, 'm' | 'w'> = {
  humar: 'm', hucast: 'm', ramar: 'm', racast: 'm', fomar: 'm', hunewm: 'm', fonewm: 'm',
  humarl: 'w', hucaseal: 'w', ramarl: 'w', racaseal: 'w', fomarl: 'w', hunewearl: 'w', fonewearl: 'w',
};

// Map class IDs to their PC prefix for textures
const CLASS_TO_PC_PREFIX: Record<string, string> = {
  humar: 'pc_00', humarl: 'pc_01', ramar: 'pc_02', ramarl: 'pc_03',
  fomar: 'pc_04', fomarl: 'pc_05', hunewm: 'pc_06', hunewearl: 'pc_07',
  fonewm: 'pc_08', fonewearl: 'pc_09', hucast: 'pc_10', hucaseal: 'pc_11',
  racast: 'pc_12', racaseal: 'pc_13',
};

// Class display names
const CLASS_NAMES: Record<string, string> = {
  humar: 'HUmar', humarl: 'HUmarl', hucast: 'HUcast', hucaseal: 'HUcaseal',
  hunewm: 'HUnewm', hunewearl: 'HUnewearl', ramar: 'RAmar', ramarl: 'RAmarl',
  racast: 'RAcast', racaseal: 'RAcaseal', fomar: 'FOmar', fomarl: 'FOmarl',
  fonewm: 'FOnewm', fonewearl: 'FOnewearl',
};

// Weapon restrictions per class
const CLASS_WEAPON_RESTRICTIONS: Record<string, string[]> = {
  humar: ['rod', 'shotgun'], humarl: ['rod', 'shotgun'],
  hunewm: ['rod', 'shotgun', 'machinegun'], hunewearl: ['rod', 'shotgun', 'machinegun'],
  hucast: ['rod', 'shotgun', 'machinegun'], hucaseal: ['rod', 'shotgun', 'machinegun'],
  ramar: ['rod', 'claw', 'dagger', 'shield', 'slicer', 'sword'],
  ramarl: ['rod', 'claw', 'dagger', 'shield', 'slicer', 'sword'],
  racast: ['rod', 'claw', 'dagger', 'shield', 'sword'],
  racaseal: ['rod', 'claw', 'dagger', 'shield', 'sword'],
  fomar: ['shotgun', 'claw', 'spear', 'sword'], fomarl: ['shotgun', 'claw', 'spear', 'sword'],
  fonewm: ['shotgun', 'claw', 'dagger', 'machinegun', 'shield', 'spear', 'sword'],
  fonewearl: ['shotgun', 'claw', 'dagger', 'machinegun', 'shield', 'spear', 'sword'],
};

// Animation categories
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

// Weapon model paths
const CATEGORY_WEAPON_MAP: Record<string, string | null> = {
  common: null,
  saver: '/weapons/wsac01/wsac01/wsac01_1_o.glb',
  sword: '/weapons/wswr02/wswr02/wswr02_1_b.glb',
  dagger: '/weapons/wdah01/wdah01/wdah01_1_l.glb',
  spear: '/weapons/wsph01/wsph01/wsph01_1_b.glb',
  claw: '/weapons/wclh02/wclh02/wclh02_1_o.glb',
  shield: '/weapons/wshh01/wshh01/wshh01_1_o.glb',
  handgun: '/weapons/whgc01/whgc01/whgc01_1_o.glb',
  shotgun: '/weapons/wrfh01/wrfh01/wrfh01_1_b.glb',
  machinegun: '/weapons/wmgh01/wmgh01/wmgh01_1_l.glb',
  grenade: '/weapons/wbac02/wbac02/wbac02_1_b.glb',
  rod: '/weapons/wroh01/wroh01/wroh01_1_b.glb',
  wand: '/weapons/wwan01/wwan01/wwan01_1_o.glb',
  slicer: '/weapons/wslr03/wslr03/wslr03_1_o.glb',
};

// Default weapon position offsets per category
const WEAPON_OFFSETS: Record<string, { x: number; y: number; z: number }> = {
  saver: { x: 0.310, y: 0.000, z: 0.000 },
  spear: { x: 0.300, y: -0.030, z: 0.000 },
  handgun: { x: 0.310, y: 0.000, z: 0.000 },
  wand: { x: 0.320, y: 0.000, z: 0.000 },
  grenade: { x: 0.300, y: 0.000, z: 0.000 },
  shield: { x: 0.300, y: 0.000, z: 0.000 },
  claw: { x: 0.300, y: 0.000, z: 0.000 },
  shotgun: { x: 0.210, y: 0.000, z: 0.000 },
  sword: { x: 0.330, y: -0.020, z: 0.070 },
  slicer: { x: 0.300, y: 0.000, z: 0.000 },
  rod: { x: 0.310, y: 0.000, z: 0.000 },
  dagger: { x: 0.300, y: 0.000, z: 0.000 },
  machinegun: { x: 0.300, y: -0.060, z: 0.000 },
};

// Animation labels
const ANIMATION_LABELS: Record<string, string> = {
  'pmsa_wait': 'Idle', 'pmsa_run': 'Run', 'pmsa_esc_f': 'Escape Forward',
  'pmsa_chg': 'Charge', 'pmsa_stp_fb': 'Step F/B', 'pmsa_stp_lr': 'Step L/R',
  'pmsa_dam_n': 'Damage Normal', 'pmsa_dam_h': 'Damage Heavy',
  'pmsa_dam_d': 'Damage Down', 'pmsa_dam_d_lp': 'Damage Down Loop',
  'pmsa_dam_d_wa': 'Damage Down Wake', 'pmsa_slp': 'Sleep',
  'pmsa_atk1': 'Attack 1', 'pmsa_atk2': 'Attack 2', 'pmsa_atk3': 'Attack 3',
  'pmsa_pa1': 'Photon Art 1', 'pmsa_pa2': 'Photon Art 2', 'pmsa_pa3': 'Photon Art 3',
  'pmsa_tec': 'Technique', 'pmbn_pb': 'Photon Blast', 'pmbn_pb_lp': 'Photon Blast Loop',
};

export default function PlayerAnimationStorybook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    mixer: THREE.AnimationMixer | null;
    model: THREE.Object3D | null;
    weaponRight: THREE.Object3D | null;
    weaponLeft: THREE.Object3D | null;
    animations: THREE.AnimationClip[];
    currentAction: THREE.AnimationAction | null;
  } | null>(null);

  const [selectedClass, setSelectedClass] = useState('humar');
  const [selectedCategory, setSelectedCategory] = useState('common');
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [useSpecialAnimation, setUseSpecialAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Weapon position offset
  const [weaponOffset, setWeaponOffset] = useState({ x: 0, y: 0, z: 0 });

  const gender = GENDER_MAP[selectedClass] || 'm';
  const bodyType = useSpecialAnimation ? (gender === 'm' ? 'sm' : 'sw') : gender;
  const restrictions = CLASS_WEAPON_RESTRICTIONS[selectedClass] || [];

  // Build paths
  const category = ANIMATION_CATEGORIES.find((c) => c.id === selectedCategory);
  const animationSetId = category ? `${category.prefix}_${selectedCategory}_${bodyType}` : null;
  const animationGlbPath = animationSetId
    ? `/player/animations/${selectedCategory}/${bodyType}/${animationSetId}/pc_000_000.glb`
    : null;
  const pcPrefix = CLASS_TO_PC_PREFIX[selectedClass] || 'pc_00';
  const variation = `${pcPrefix}0`;
  const modelGlbPath = `/player/${variation}/${variation}/${variation}_000.glb`;
  const textureUrl = `/player/${variation}/textures/${variation}_000.png`;
  const weaponGlbPath = CATEGORY_WEAPON_MAP[selectedCategory] || null;

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x0a0a1a);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Grid
    const grid = new THREE.GridHelper(10, 10, 0x333333, 0x222222);
    scene.add(grid);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    sceneRef.current = {
      scene, camera, renderer, controls,
      mixer: null, model: null, weaponRight: null, weaponLeft: null,
      animations: [], currentAction: null,
    };

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (sceneRef.current?.mixer) {
        sceneRef.current.mixer.update(delta);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Load model, animations, and weapon
  useEffect(() => {
    if (!sceneRef.current || !animationGlbPath) return;

    const { scene } = sceneRef.current;
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    setIsLoading(true);

    // Clear previous model and weapon
    if (sceneRef.current.model) {
      scene.remove(sceneRef.current.model);
      sceneRef.current.model = null;
    }
    if (sceneRef.current.weapon) {
      sceneRef.current.weapon = null;
    }
    sceneRef.current.mixer = null;
    sceneRef.current.currentAction = null;

    // Load model
    loader.load(modelGlbPath, (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      sceneRef.current!.model = model;

      // Apply texture
      textureLoader.load(textureUrl, (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        });
      });

      // Load animations
      loader.load(animationGlbPath, (animGltf) => {
        const mixer = new THREE.AnimationMixer(model);
        sceneRef.current!.mixer = mixer;
        sceneRef.current!.animations = animGltf.animations;

        const animNames = animGltf.animations.map((a) => a.name);
        setAvailableAnimations(animNames);

        // Auto-select first animation
        if (animNames.length > 0) {
          setSelectedAnimation(animNames[0]);
        }

        // Load weapon if applicable
        if (weaponGlbPath) {
          // Capture category for closure
          const currentCategory = selectedCategory;

          // Find hand bones first
          let rightHand: THREE.Bone | null = null;
          let leftHand: THREE.Bone | null = null;
          model.traverse((child) => {
            if (child.name === '070_RArm02') {
              rightHand = child as THREE.Bone;
            }
            if (child.name === '040_LArm02') {
              leftHand = child as THREE.Bone;
            }
          });

          const isDualWield = currentCategory === 'dagger' || currentCategory === 'machinegun';

          // Helper to prepare weapon
          const prepareWeapon = (scene: THREE.Group) => {
            scene.traverse((child: any) => {
              if (child.isMesh) {
                child.geometry?.computeVertexNormals();
                child.material = new THREE.MeshNormalMaterial({
                  flatShading: true,
                  side: THREE.DoubleSide,
                });
              }
            });
            return scene;
          };

          // Get default offset for this category
          const defaultOffset = WEAPON_OFFSETS[currentCategory] || { x: 0, y: 0, z: 0 };

          // Load weapon for right hand
          loader.load(weaponGlbPath, (weaponGltf) => {
            const weaponRight = prepareWeapon(weaponGltf.scene);
            if (rightHand) {
              weaponRight.position.set(defaultOffset.x, defaultOffset.y, defaultOffset.z);
              rightHand.add(weaponRight);
              sceneRef.current!.weaponRight = weaponRight;
              console.log('Added weapon to right hand with offset:', defaultOffset);
            }

            // Load again for left hand if dual wield
            if (isDualWield && leftHand) {
              loader.load(weaponGlbPath, (weaponGltf2) => {
                const weaponLeft = prepareWeapon(weaponGltf2.scene);
                weaponLeft.position.set(defaultOffset.x, defaultOffset.y, defaultOffset.z);
                // Rotate dual-wield weapons 180 degrees for left hand
                if (currentCategory === 'machinegun' || currentCategory === 'dagger') {
                  weaponLeft.rotation.x = Math.PI;
                }
                leftHand.add(weaponLeft);
                sceneRef.current!.weaponLeft = weaponLeft;
                console.log('Added weapon to left hand with offset:', defaultOffset);
                setIsLoading(false);
              });
            } else {
              sceneRef.current!.weaponLeft = null;
              setIsLoading(false);
            }
          });
        } else {
          setIsLoading(false);
        }
      });
    });
  }, [modelGlbPath, animationGlbPath, textureUrl, weaponGlbPath, selectedCategory]);

  // Play selected animation
  useEffect(() => {
    if (!sceneRef.current?.mixer || !selectedAnimation) return;

    const { mixer, animations, currentAction } = sceneRef.current;

    // Stop current animation
    if (currentAction) {
      currentAction.fadeOut(0.2);
    }

    // Find and play new animation
    const clip = animations.find((a) => a.name === selectedAnimation);
    if (clip) {
      const action = mixer.clipAction(clip);
      action.reset().fadeIn(0.2).play();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = playbackSpeed;
      action.paused = !isPlaying;
      sceneRef.current.currentAction = action;
    }
  }, [selectedAnimation]);

  // Update playback speed
  useEffect(() => {
    if (sceneRef.current?.currentAction) {
      sceneRef.current.currentAction.timeScale = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Play/pause
  useEffect(() => {
    if (sceneRef.current?.currentAction) {
      sceneRef.current.currentAction.paused = !isPlaying;
    }
  }, [isPlaying]);

  // Reset animation when category/class changes
  useEffect(() => {
    setSelectedAnimation(null);
    setAvailableAnimations([]);
    if (restrictions.includes(selectedCategory)) {
      setSelectedCategory('common');
    }
    // Apply default offset for this category
    const defaultOffset = WEAPON_OFFSETS[selectedCategory] || { x: 0, y: 0, z: 0 };
    setWeaponOffset(defaultOffset);
  }, [selectedClass, selectedCategory, useSpecialAnimation]);

  // Apply weapon offset
  useEffect(() => {
    if (sceneRef.current?.weaponRight) {
      sceneRef.current.weaponRight.position.set(weaponOffset.x, weaponOffset.y, weaponOffset.z);
    }
    if (sceneRef.current?.weaponLeft) {
      sceneRef.current.weaponLeft.position.set(weaponOffset.x, weaponOffset.y, weaponOffset.z);
    }
  }, [weaponOffset]);

  // Copy offset to clipboard
  const copyOffset = () => {
    const str = `{ x: ${weaponOffset.x.toFixed(3)}, y: ${weaponOffset.y.toFixed(3)}, z: ${weaponOffset.z.toFixed(3)} }`;
    navigator.clipboard.writeText(str);
    console.log('Copied:', str);
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
            <span style={styles.headerSubtext}>
              Body Type: {bodyType} {isLoading && '(Loading...)'}
            </span>
          </div>
          <div style={styles.canvasContainer} ref={containerRef} />
        </div>

        {/* Right Panel - Controls */}
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
          </div>

          {/* Animation List */}
          <div style={styles.section}>
            <h3 style={styles.panelTitle}>Animations ({availableAnimations.length})</h3>
            <div style={styles.animationList}>
              {availableAnimations.length === 0 ? (
                <div style={styles.noAnimations}>Loading...</div>
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

          {/* Weapon Position Offset */}
          {weaponGlbPath && (
            <div style={styles.section}>
              <h3 style={styles.panelTitle}>Weapon Offset</h3>
              <div style={styles.offsetControls}>
                <div style={styles.offsetRow}>
                  <label style={styles.offsetLabel}>X: {weaponOffset.x.toFixed(2)}</label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={weaponOffset.x}
                    onChange={(e) => setWeaponOffset(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                    style={styles.offsetSlider}
                  />
                </div>
                <div style={styles.offsetRow}>
                  <label style={styles.offsetLabel}>Y: {weaponOffset.y.toFixed(2)}</label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={weaponOffset.y}
                    onChange={(e) => setWeaponOffset(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                    style={styles.offsetSlider}
                  />
                </div>
                <div style={styles.offsetRow}>
                  <label style={styles.offsetLabel}>Z: {weaponOffset.z.toFixed(2)}</label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={weaponOffset.z}
                    onChange={(e) => setWeaponOffset(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
                    style={styles.offsetSlider}
                  />
                </div>
                <button style={styles.copyBtn} onClick={copyOffset}>
                  Copy Offset
                </button>
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
  className: { fontWeight: 'bold' },
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
  headerText: { fontSize: '14px', fontWeight: 'bold', color: '#6bf' },
  headerSubtext: { fontSize: '12px', color: '#888' },
  canvasContainer: {
    flex: 1,
    background: '#0a0a1a',
    borderRadius: '8px',
    overflow: 'hidden',
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
  animName: { flex: 1 },
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
  speedLabel: { fontSize: '11px', color: '#888' },
  speedSlider: { width: '100%' },
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
  toggleCheckbox: { width: '16px', height: '16px', cursor: 'pointer' },
  toggleLabel: { fontSize: '12px', color: '#aaa' },
  offsetControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  offsetRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  offsetLabel: {
    fontSize: '11px',
    color: '#888',
  },
  offsetSlider: {
    width: '100%',
  },
  copyBtn: {
    padding: '8px 12px',
    background: '#4a4a6a',
    border: '1px solid #6b8afd',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '4px',
  },
};
