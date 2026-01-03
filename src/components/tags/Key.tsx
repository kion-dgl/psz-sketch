import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { KeyProps, KeyState } from './types';
import { useTriggerCollision } from './useTagCollision';
import { useStage } from './StageContext';

/**
 * Key Tag
 *
 * Collectible key that unlocks KeyGate barriers.
 * Auto-registers trigger collision for pickup.
 * Floats and bobs when available.
 *
 * Usage:
 * <Key keyId="key1" position={[10, 1, 0]} onCollect={handleCollect} />
 */

const MODEL_PATH = '/objects/01_o01a/o0c_key.imd/o0c_key.glb';
const TRIGGER_SIZE: [number, number, number] = [1, 2, 1];

// Animation config
const BOB_SPEED = 2;
const BOB_HEIGHT = 0.2;
const SPIN_SPEED = 1;

export default function Key({
  keyId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state: propState,
  onCollect,
  collisionEnabled = true,
}: KeyProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  // Get Stage context
  const stage = useStage();

  // Local collection state
  const [collected, setCollected] = useState(false);

  // Check if already collected via Stage context
  const isCollectedByStage = stage?.hasKey(keyId) ?? false;

  // Final state
  const state: KeyState = propState ?? (collected || isCollectedByStage ? 'collected' : 'available');

  // Handle collection
  const handleCollect = useCallback(() => {
    if (collected) return;

    setCollected(true);

    // Mark as collected in Stage context
    if (stage) {
      stage.collectKey(keyId);
    }

    // Call user callback
    onCollect?.(keyId);

    console.log(`[Key] Collected: ${keyId}`);
  }, [collected, keyId, stage, onCollect]);

  // Register trigger collision for pickup
  useTriggerCollision(
    `key-${keyId}`,
    position,
    TRIGGER_SIZE,
    {
      enabled: collisionEnabled && state === 'available',
      onEnter: handleCollect,
    }
  );

  // Animate bobbing and spinning
  useFrame((_, delta) => {
    if (!groupRef.current || state === 'collected') return;

    // Bob up and down
    const time = performance.now() * 0.001;
    groupRef.current.position.y = position[1] + Math.sin(time * BOB_SPEED) * BOB_HEIGHT;

    // Spin slowly
    groupRef.current.rotation.y += delta * SPIN_SPEED;
  });

  // Apply visual settings
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Add glow effect
            mat.emissive = new THREE.Color(0xffaa00);
            mat.emissiveIntensity = 0.3;
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene]);

  // Don't render if collected
  if (state === 'collected') return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);
