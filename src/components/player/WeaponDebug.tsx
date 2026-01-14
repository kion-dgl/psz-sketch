import { Canvas, useFrame, useGraph, createPortal } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { Suspense, useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// Fixed paths for testing
const MODEL_PATH = '/player/pc_000/pc_000/pc_000_000.glb'; // HUmar model
const TEXTURE_PATH = '/player/pc_000/textures/pc_000_000.png';
const ANIMATION_PATH = '/player/animations/saver/m/01_saver_m/pc_000_000.glb'; // Saber animations
const WEAPON_PATH = '/weapons/wsac01/wsac01/wsac01_1_o.glb'; // Saber weapon

// Weapon component that will be portaled into the bone
function WeaponAttachment() {
  const weaponGltf = useGLTF(WEAPON_PATH);
  const weaponRef = useRef<THREE.Group>(null);

  // Clone and apply normal material
  const weaponClone = useMemo(() => {
    const clone = weaponGltf.scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.computeVertexNormals();
        child.material = new THREE.MeshNormalMaterial({ flatShading: true });
      }
    });
    return clone;
  }, [weaponGltf]);

  return (
    <group ref={weaponRef}>
      <primitive object={weaponClone} />
    </group>
  );
}

function DebugModel() {
  const groupRef = useRef<THREE.Group>(null);

  // Load model
  const { scene: modelScene } = useGLTF(MODEL_PATH);
  const clone = useMemo(() => SkeletonUtils.clone(modelScene), [modelScene]);
  const { nodes } = useGraph(clone);

  // Load animations
  const animGltf = useGLTF(ANIMATION_PATH);
  const { actions } = useAnimations(animGltf.animations, groupRef);

  // Find hand bone
  const handBone = nodes['070_RArm02'] as THREE.Bone | undefined;

  // Log bone info
  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('Hand bone found:', handBone?.name);
    console.log('Hand bone type:', handBone?.type);
    console.log('Hand bone is Bone:', handBone?.isBone);
    console.log('Available nodes:', Object.keys(nodes));
    console.log('Available animations:', animGltf.animations.map(a => a.name));
  }, [handBone, nodes, animGltf.animations]);

  // Apply texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(TEXTURE_PATH, (texture) => {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      clone.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    });
  }, [clone]);

  // Play first attack animation
  useEffect(() => {
    const animName = 'binpmbn_atk1';
    if (actions[animName]) {
      actions[animName]?.reset().fadeIn(0.2).play();
      actions[animName]?.setLoop(THREE.LoopRepeat, Infinity);
      console.log('Playing animation:', animName);
    }
  }, [actions]);

  return (
    <group ref={groupRef}>
      <primitive object={clone} />
      {/* Portal the weapon into the hand bone */}
      {handBone && createPortal(<WeaponAttachment />, handBone)}
    </group>
  );
}

export default function WeaponDebug() {
  const [showAxes, setShowAxes] = useState(true);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 100,
        background: '#2d2d44',
        padding: '10px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '12px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#6b8afd' }}>Weapon Debug</h3>
        <p>Model: HUmar</p>
        <p>Animation: Saber Attack 1</p>
        <p>Weapon: Saber</p>
        <p>Target Bone: 070_RArm02</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(e) => setShowAxes(e.target.checked)}
          />
          Show Axes Helper
        </label>
        <p style={{ marginTop: '10px', color: '#888' }}>Check console for debug output</p>
      </div>

      <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <DebugModel />
        </Suspense>
        <OrbitControls />
        <gridHelper args={[10, 10, '#333', '#222']} />
        {showAxes && <axesHelper args={[2]} />}
      </Canvas>
    </div>
  );
}
