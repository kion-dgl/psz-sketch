import { useMemo, useEffect } from 'react';
import { useGLTF, Box } from '@react-three/drei';
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
    { name: 'active', label: 'Active', description: 'Fence is blocking access (laser visible)' },
    { name: 'disabled', label: 'Disabled', description: 'Fence has been deactivated (laser hidden, poles remain)' },
  ],
  defaultState: 'active',
};

// The laser texture - meshes with this texture are hidden when disabled
const LASER_TEXTURE_NAME = 'o0c_1_fence2';

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

  // Hide laser mesh when disabled, keep poles visible
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        // Check if this mesh has the laser texture
        const hasLaserTexture = materials.some((mat) => {
          if ((mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) && mat.map) {
            return mat.map.name?.includes(LASER_TEXTURE_NAME);
          }
          return false;
        });

        // Hide laser meshes when disabled
        if (hasLaserTexture) {
          child.visible = state === 'active';
        }
      }
    });
  }, [clonedScene, state]);

  // Calculate bounding box for collision indicator
  const bounds = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
  }, [clonedScene]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
      {state === 'active' && (
        <Box
          args={[bounds.size.x, bounds.size.y, bounds.size.z]}
          position={[bounds.center.x, bounds.center.y, bounds.center.z]}
        >
          <meshBasicMaterial color="yellow" wireframe />
        </Box>
      )}
    </group>
  );
}

// Preload models
useGLTF.preload('/objects/01_o01a/o0c_fence.imd/o0c_fence.glb');
