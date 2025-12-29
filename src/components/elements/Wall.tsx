import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ElementProps, StoryMeta } from './types';

export type WallState = 'intact' | 'destroyed';

interface WallProps extends ElementProps {
  state?: WallState;
}

// Story metadata for the storybook
export const wallMeta: StoryMeta = {
  title: 'Wall',
  description: 'Destructible wall obstacle. Model varies by field. (Valley variant)',
  states: [
    { name: 'intact', label: 'Intact', description: 'Wall blocks passage' },
    { name: 'destroyed', label: 'Destroyed', description: 'Wall has been destroyed' },
  ],
  defaultState: 'intact',
};

export default function Wall({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'intact',
}: WallProps) {
  // Valley variant (o01_wall)
  const { scene } = useGLTF('/objects/01_o01a/o01_wall.imd/o01_wall.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  if (state === 'destroyed') return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/objects/01_o01a/o01_wall.imd/o01_wall.glb');
