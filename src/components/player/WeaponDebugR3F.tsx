/**
 * R3F Weapon Debug - Testing different approaches to bone attachment
 *
 * Approach A: No SkeletonUtils clone, use scene directly
 * Approach B: SkeletonUtils clone, find bone after primitive mounts
 * Approach C: Use primitive for weapon inside bone primitive
 */

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const MODEL_PATH = '/player/pc_000/pc_000/pc_000_000.glb';
const TEXTURE_PATH = '/player/pc_000/textures/pc_000_000.png';
const ANIMATION_PATH = '/player/animations/saver/m/01_saver_m/pc_000_000.glb';
const WEAPON_PATH = '/weapons/wsac01/wsac01/wsac01_1_o.glb';

// Approach A: No clone, direct scene manipulation after mount
function ApproachA() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const animGltf = useGLTF(ANIMATION_PATH);
  const weaponGltf = useGLTF(WEAPON_PATH);
  const { actions } = useAnimations(animGltf.animations, groupRef);

  // Clone scene once
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    // Find bone and add weapon after mount
    let handBone: THREE.Bone | null = null;
    model.traverse((child) => {
      if (child.name === '070_RArm02') {
        handBone = child as THREE.Bone;
      }
    });

    if (handBone && weaponGltf) {
      const weapon = weaponGltf.scene.clone(true);
      weapon.traverse((child: any) => {
        if (child.isMesh) {
          child.material = new THREE.MeshNormalMaterial({ flatShading: true });
        }
      });
      handBone.add(weapon);
      console.log('Approach A: Weapon added to', handBone.name);
    }
  }, [model, weaponGltf]);

  useEffect(() => {
    const anim = animGltf.animations.find(a => a.name === 'pmsa_atk1');
    if (anim && actions[anim.name]) {
      actions[anim.name]?.reset().play();
      actions[anim.name]?.setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions, animGltf.animations]);

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

// Approach B: Use SkeletonUtils, add weapon in delayed effect
function ApproachB() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const animGltf = useGLTF(ANIMATION_PATH);
  const weaponGltf = useGLTF(WEAPON_PATH);

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animGltf.animations, groupRef);

  useEffect(() => {
    // Delay to ensure everything is mounted
    const timeout = setTimeout(() => {
      let handBone: THREE.Bone | null = null;
      clone.traverse((child) => {
        if (child.name === '070_RArm02') {
          handBone = child as THREE.Bone;
        }
      });

      if (handBone && weaponGltf) {
        const weapon = weaponGltf.scene.clone(true);
        weapon.traverse((child: any) => {
          if (child.isMesh) {
            child.material = new THREE.MeshNormalMaterial({ flatShading: true });
          }
        });
        handBone.add(weapon);
        console.log('Approach B: Weapon added to', handBone.name);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [clone, weaponGltf]);

  useEffect(() => {
    const anim = animGltf.animations.find(a => a.name === 'pmsa_atk1');
    if (anim && actions[anim.name]) {
      actions[anim.name]?.reset().play();
      actions[anim.name]?.setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions, animGltf.animations]);

  return (
    <group ref={groupRef}>
      <primitive object={clone} />
    </group>
  );
}

// Approach C: Manual AnimationMixer (bypass useAnimations)
function ApproachC() {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const animGltf = useGLTF(ANIMATION_PATH);
  const weaponGltf = useGLTF(WEAPON_PATH);
  const { clock } = useThree();

  const model = useMemo(() => scene.clone(true), [scene]);

  // Setup mixer and animation manually
  useEffect(() => {
    mixerRef.current = new THREE.AnimationMixer(model);
    const anim = animGltf.animations.find(a => a.name === 'pmsa_atk1');
    if (anim) {
      const action = mixerRef.current.clipAction(anim);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      console.log('Approach C: Animation playing');
    }

    // Find bone and add weapon
    let handBone: THREE.Bone | null = null;
    model.traverse((child) => {
      if (child.name === '070_RArm02') {
        handBone = child as THREE.Bone;
      }
    });

    if (handBone && weaponGltf) {
      const weapon = weaponGltf.scene.clone(true);
      weapon.traverse((child: any) => {
        if (child.isMesh) {
          child.material = new THREE.MeshNormalMaterial({ flatShading: true });
        }
      });
      handBone.add(weapon);
      console.log('Approach C: Weapon added to', handBone.name);
    }

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [model, animGltf.animations, weaponGltf]);

  // Manual animation update
  useEffect(() => {
    let lastTime = clock.elapsedTime;
    const animate = () => {
      const currentTime = clock.elapsedTime;
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      mixerRef.current?.update(delta);
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [clock]);

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

// Approach D: Fully vanilla - add directly to Three.js scene, no <primitive>
function ApproachD() {
  const { scene: r3fScene, clock } = useThree();
  const { scene: modelScene } = useGLTF(MODEL_PATH);
  const animGltf = useGLTF(ANIMATION_PATH);
  const weaponGltf = useGLTF(WEAPON_PATH);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    // Clone model
    const model = modelScene.clone(true);
    modelRef.current = model;

    // Add directly to R3F's scene (not via primitive)
    r3fScene.add(model);
    console.log('Approach D: Model added directly to scene');

    // Setup animation mixer
    mixerRef.current = new THREE.AnimationMixer(model);
    const anim = animGltf.animations.find(a => a.name === 'pmsa_atk1');
    if (anim) {
      const action = mixerRef.current.clipAction(anim);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      console.log('Approach D: Animation playing');
    }

    // Find bone and add weapon
    let handBone: THREE.Bone | null = null;
    model.traverse((child) => {
      if (child.name === '070_RArm02') {
        handBone = child as THREE.Bone;
      }
    });

    if (handBone && weaponGltf) {
      const weapon = weaponGltf.scene.clone(true);
      weapon.traverse((child: any) => {
        if (child.isMesh) {
          child.material = new THREE.MeshNormalMaterial({ flatShading: true });
        }
      });
      handBone.add(weapon);
      console.log('Approach D: Weapon added to', handBone.name);
    }

    return () => {
      r3fScene.remove(model);
      mixerRef.current?.stopAllAction();
    };
  }, [r3fScene, modelScene, animGltf.animations, weaponGltf]);

  // Manual animation update via requestAnimationFrame
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      mixerRef.current?.update(delta);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Return null - we're managing the model imperatively
  return null;
}

type Approach = 'A' | 'B' | 'C' | 'D';

export default function WeaponDebugR3F() {
  const [approach, setApproach] = useState<Approach>('D');

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 100,
        background: '#2d2d44',
        padding: '15px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#6b8afd' }}>R3F Weapon Debug</h3>

        <div style={{ marginBottom: '15px' }}>
          <strong>Select Approach:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {(['A', 'B', 'C', 'D'] as Approach[]).map((a) => (
              <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="approach"
                  checked={approach === a}
                  onChange={() => setApproach(a)}
                />
                <span>Approach {a}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#aaa', borderTop: '1px solid #444', paddingTop: '10px' }}>
          <p><strong>A:</strong> scene.clone() + bone.add()</p>
          <p><strong>B:</strong> SkeletonUtils.clone() + delayed add</p>
          <p><strong>C:</strong> Manual AnimationMixer</p>
          <p><strong>D:</strong> Fully vanilla (scene.add, no primitive)</p>
        </div>

        <p style={{ marginTop: '10px', color: '#888' }}>Check console for logs</p>
      </div>

      <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }} key={approach}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          {approach === 'A' && <ApproachA />}
          {approach === 'B' && <ApproachB />}
          {approach === 'C' && <ApproachC />}
          {approach === 'D' && <ApproachD />}
        </Suspense>
        <OrbitControls />
        <gridHelper args={[10, 10, '#333', '#222']} />
        <axesHelper args={[2]} />
      </Canvas>
    </div>
  );
}
