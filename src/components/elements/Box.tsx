import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ElementProps, StoryMeta } from './types';

export type BoxState = 'intact' | 'destroyed';

interface BoxProps extends ElementProps {
  state?: BoxState;
}

// Story metadata for the storybook
export const boxMeta: StoryMeta = {
  title: 'Box',
  description: 'Destructible container. Model varies by field. (Valley variant)',
  states: [
    { name: 'intact', label: 'Intact', description: 'Box can be destroyed' },
    { name: 'destroyed', label: 'Destroyed', description: 'Box has been destroyed' },
  ],
  defaultState: 'intact',
};

export default function Box({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'intact',
}: BoxProps) {
  // Valley variant (o01_cont)
  const { scene } = useGLTF('/objects/01_o01a/o01_cont.imd/o01_cont.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  if (state === 'destroyed') return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/objects/01_o01a/o01_cont.imd/o01_cont.glb');
