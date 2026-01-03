import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ContainerProps, ContainerState } from './types';
import { useTriggerCollision } from './useTagCollision';
import { useStage } from './StageContext';

/**
 * Box Tag
 *
 * Destructible container that drops items when destroyed.
 * Auto-registers trigger collision for attack detection.
 *
 * Usage:
 * <Box position={[5, 0, 0]} onDestroy={() => spawnLoot()} />
 * <Box position={[10, 0, 0]} state="destroyed" /> // Pre-destroyed
 */

const MODEL_PATH = '/objects/01_o01a/o01_cont.imd/o01_cont.glb';
const TRIGGER_SIZE: [number, number, number] = [1, 1.5, 1];

export default function Box({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state: propState,
  onDestroy,
  collisionEnabled = true,
}: ContainerProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Get Stage context
  const stage = useStage();
  const objectId = `box-${position.join('-')}`;

  // Local destruction state
  const [destroyed, setDestroyed] = useState(false);

  // Check if destroyed via Stage context
  const isDestroyedByStage = stage?.isDestroyed(objectId) ?? false;

  // Final state
  const state: ContainerState = propState ?? (destroyed || isDestroyedByStage ? 'destroyed' : 'intact');

  // Handle destruction (called by combat system when box is attacked)
  const _handleDestroy = useCallback(() => {
    if (destroyed) return;

    setDestroyed(true);

    // Mark as destroyed in Stage context
    if (stage) {
      stage.destroyObject(objectId);
    }

    // Call user callback
    onDestroy?.();

    console.log(`[Box] Destroyed at ${position.join(', ')}`);
  }, [destroyed, objectId, stage, onDestroy, position]);

  // Register trigger collision for attack detection
  useTriggerCollision(
    objectId,
    position,
    TRIGGER_SIZE,
    {
      enabled: collisionEnabled && state === 'intact',
      onEnter: () => {
        // Attack detection would trigger this
        // Combat system should call _handleDestroy when attack lands
        void _handleDestroy; // Reference to suppress unused warning
      },
    }
  );

  // Apply texture settings
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            if (mat.map) {
              mat.map.wrapS = THREE.MirroredRepeatWrapping;
              mat.map.wrapT = THREE.MirroredRepeatWrapping;
              mat.map.repeat.set(2, 2);
              mat.map.offset.set(0, 0);
              mat.map.needsUpdate = true;
            }
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene]);

  // Don't render if destroyed
  if (state === 'destroyed') return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);
