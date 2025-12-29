import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ElementProps, StoryMeta } from './types';

export type SwitchState = 'off' | 'on';

interface InteractSwitchProps extends ElementProps {
  state?: SwitchState;
  onActivate?: () => void;
}

// Story metadata for the storybook
export const interactSwitchMeta: StoryMeta = {
  title: 'Interact Switch',
  description: 'Player-activated switch that disables fences. Requires interaction to toggle.',
  states: [
    { name: 'off', label: 'Off', description: 'Switch has not been activated' },
    { name: 'on', label: 'On', description: 'Switch has been activated' },
  ],
  defaultState: 'off',
};

export default function InteractSwitch({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'off',
  onActivate,
}: InteractSwitchProps) {
  // switchf = floor/interact switch, switchs = step switch
  const { scene } = useGLTF('/objects/01_o01a/o0c_switchf.imd/o0c_switchf.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply visual state (color tint based on state)
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            if (state === 'on') {
              mat.emissive = new THREE.Color(0x00ff00);
              mat.emissiveIntensity = 0.3;
            } else {
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
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

// Preload the model
useGLTF.preload('/objects/01_o01a/o0c_switchf.imd/o0c_switchf.glb');
