import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ElementProps, StoryMeta } from './types';

export type FenceState = 'active' | 'disabled';

interface FenceProps extends ElementProps {
  state?: FenceState;
  variant?: 'default' | 'short' | 'diagonal';
}

// Story metadata for the storybook
export const fenceMeta: StoryMeta = {
  title: 'Fence',
  description: 'Blocks access to items or keys within a stage. Disabled by interact switches.',
  states: [
    { name: 'active', label: 'Active', description: 'Fence is blocking access' },
    { name: 'disabled', label: 'Disabled', description: 'Fence has been deactivated' },
  ],
  defaultState: 'active',
};

const FENCE_MODELS: Record<string, string> = {
  default: '/objects/01_o01a/o0c_fence.imd/o0c_fence.glb',
  short: '/objects/01_o01a/o0c_shfence.imd/o0c_shfence.glb',
  diagonal: '/objects/01_o01a/o0c_dgfance.imd/o0c_dgfance.glb',
};

export default function Fence({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'active',
  variant = 'default',
}: FenceProps) {
  const modelPath = FENCE_MODELS[variant] || FENCE_MODELS.default;
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply visual state
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            if (state === 'disabled') {
              mat.transparent = true;
              mat.opacity = 0.3;
            } else {
              mat.transparent = false;
              mat.opacity = 1;
            }
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene, state]);

  // Hide completely when disabled (optional - or show faded)
  const visible = true; // Could be: state !== 'disabled'

  return (
    <group position={position} rotation={rotation} scale={scale} visible={visible}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload models
useGLTF.preload('/objects/01_o01a/o0c_fence.imd/o0c_fence.glb');
