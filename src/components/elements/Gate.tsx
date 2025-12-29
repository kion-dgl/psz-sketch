import { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ElementProps, StoryMeta } from './types';

export type GateState = 'closed' | 'open' | 'opening';

interface GateProps extends ElementProps {
  state?: GateState;
  onOpenComplete?: () => void;
}

// Story metadata for the storybook
export const gateMeta: StoryMeta = {
  title: 'Gate',
  description: 'Blocks passage between stages. Opens when all enemies are defeated.',
  states: [
    { name: 'closed', label: 'Closed', description: 'Gate is blocking the path' },
    { name: 'opening', label: 'Opening', description: 'Gate is animating open' },
    { name: 'open', label: 'Open', description: 'Gate is fully open' },
  ],
  defaultState: 'closed',
};

// Animation config
const ANIMATION = {
  meshName: 'o0c_gate_3',
  speed: 0.8,
  closedY: -0.55,
  openY: 0.25,
};

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
  onOpenComplete,
}: GateProps) {
  const { scene } = useGLTF('/objects/01_o01a/o0c_gate.imd/o0c_gate.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const animatedMeshRef = useRef<THREE.Object3D | null>(null);
  const animationProgressRef = useRef(state === 'open' ? 1 : 0);

  // Find the animated mesh and apply texture settings
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.name === ANIMATION.meshName) {
        animatedMeshRef.current = child;
        // Set initial position based on state
        child.position.y = state === 'open' ? ANIMATION.openY : ANIMATION.closedY;
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

  // Animation frame
  useFrame((_, delta) => {
    if (!animatedMeshRef.current) return;

    if (state === 'opening') {
      animationProgressRef.current += delta * ANIMATION.speed;
      if (animationProgressRef.current >= 1) {
        animationProgressRef.current = 1;
        onOpenComplete?.();
      }
    } else if (state === 'open') {
      animationProgressRef.current = 1;
    } else {
      animationProgressRef.current = 0;
    }

    const targetY = ANIMATION.closedY + (ANIMATION.openY - ANIMATION.closedY) * animationProgressRef.current;
    animatedMeshRef.current.position.y = targetY;
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/objects/01_o01a/o0c_gate.imd/o0c_gate.glb');
