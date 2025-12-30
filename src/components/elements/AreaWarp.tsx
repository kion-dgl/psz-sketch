import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ElementProps, StoryMeta } from './types';

export type AreaWarpState = 'active' | 'inactive';

interface AreaWarpProps extends ElementProps {
  state?: AreaWarpState;
}

// Story metadata for the storybook
export const areaWarpMeta: StoryMeta = {
  title: 'Area Warp',
  description: 'Warp gate to the next area. Players pass through this to advance to the next section.',
  states: [
    { name: 'active', label: 'Active', description: 'Warp gate is active and usable' },
    { name: 'inactive', label: 'Inactive', description: 'Warp gate is inactive' },
  ],
  defaultState: 'active',
};

export default function AreaWarp({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'active',
}: AreaWarpProps) {
  const { scene } = useGLTF('/objects/special_z/o0s_warpm.imd/o0s_warpm.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply texture settings and state-based effects
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
            // Dim the material when inactive
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

useGLTF.preload('/objects/special_z/o0s_warpm.imd/o0s_warpm.glb');
