import { useMemo, useEffect, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { WarpProps, WarpType } from './types';
import { useTriggerCollision } from './useTagCollision';

/**
 * Warp Tag
 *
 * Area transition point.
 * Two variants: start (spawn point) and area (exit to next area).
 * Auto-registers trigger collision for area warps.
 *
 * Usage:
 * <Warp type="start" position={[0, 0, 0]} />
 * <Warp type="area" position={[0, 0, 50]} targetArea="/stage/valley-02" />
 */

const MODEL_PATHS = {
  start: '/objects/special_z/o0s_warps.imd/o0s_warps.glb',
  area: '/objects/special_z/o0s_warpm.imd/o0s_warpm.glb',
};

const TRIGGER_SIZE: [number, number, number] = [2, 3, 2];

export default function Warp({
  type,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  targetArea,
  state = 'active',
  collisionEnabled = true,
}: WarpProps) {
  const modelPath = MODEL_PATHS[type];
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Handle warp activation (for area warps)
  const handleEnterWarp = useCallback(() => {
    if (type === 'area' && targetArea) {
      console.log(`[Warp] Transitioning to: ${targetArea}`);
      window.location.href = targetArea;
    }
  }, [type, targetArea]);

  // Register trigger collision for area warps
  useTriggerCollision(
    `warp-${type}-${position.join('-')}`,
    position,
    TRIGGER_SIZE,
    {
      enabled: collisionEnabled && type === 'area' && state === 'active',
      onEnter: handleEnterWarp,
    }
  );

  // Apply visual state
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            if (mat.map) {
              mat.map.wrapS = THREE.MirroredRepeatWrapping;
              mat.map.wrapT = THREE.MirroredRepeatWrapping;
              mat.map.needsUpdate = true;
            }

            // Dim when inactive
            if (state === 'inactive') {
              mat.opacity = 0.5;
              mat.transparent = true;
            } else {
              mat.opacity = 1;
              mat.transparent = false;
            }
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene, state]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload all warp models
Object.values(MODEL_PATHS).forEach(path => useGLTF.preload(path));
