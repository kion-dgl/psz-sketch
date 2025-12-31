import { useMemo, useEffect } from 'react';
import { useGLTF, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { ElementProps, StoryMeta } from './types';

export type GateState = 'closed' | 'open';

interface GateProps extends ElementProps {
  state?: GateState;
}

// Story metadata for the storybook
export const gateMeta: StoryMeta = {
  title: 'Gate',
  description: 'Blocks passage between stages. Opens when all enemies are defeated.',
  states: [
    { name: 'closed', label: 'Closed', description: 'Gate is blocking the path (laser visible)' },
    { name: 'open', label: 'Open', description: 'Gate is open (laser hidden)' },
  ],
  defaultState: 'closed',
};

// The laser/beam mesh that gets hidden when open
const LASER_MESH_NAME = 'o0c_gate_3';

// Texture config for proper display
const TEXTURE_CONFIG = {
  'o0c_0_gatet.png': {
    offsetX: 0.56,
    offsetY: 0.8,
    repeatX: 1,
    repeatY: 2,
  },
};

export default function Gate({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'closed',
}: GateProps) {
  const { scene } = useGLTF('/objects/01_o01a/o0c_gate.imd/o0c_gate.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Toggle laser mesh visibility and apply texture settings
  useEffect(() => {
    clonedScene.traverse((child) => {
      // Hide/show laser mesh based on state
      if (child.name === LASER_MESH_NAME) {
        child.visible = state === 'closed';
      }

      // Apply texture settings
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if ((mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) && mat.map) {
            const texName = mat.map.name || '';
            const config = TEXTURE_CONFIG[texName as keyof typeof TEXTURE_CONFIG];
            if (config) {
              mat.map.offset.set(config.offsetX, config.offsetY);
              mat.map.repeat.set(config.repeatX, config.repeatY);
              mat.map.wrapS = THREE.RepeatWrapping;
              mat.map.wrapT = THREE.RepeatWrapping;
              mat.map.needsUpdate = true;
            }
          }
        });
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
      {state === 'closed' && (
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

// Preload the model
useGLTF.preload('/objects/01_o01a/o0c_gate.imd/o0c_gate.glb');
