import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ElementProps, StoryMeta } from './types';

export type RareBoxState = 'intact' | 'destroyed';

interface RareBoxProps extends ElementProps {
  state?: RareBoxState;
}

// Story metadata for the storybook
export const rareBoxMeta: StoryMeta = {
  title: 'Rare Box',
  description: 'Container that drops valuable items. Model varies by field. (Valley variant)',
  states: [
    { name: 'intact', label: 'Intact', description: 'Rare box can be destroyed' },
    { name: 'destroyed', label: 'Destroyed', description: 'Rare box has been destroyed' },
  ],
  defaultState: 'intact',
};

export default function RareBox({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state = 'intact',
}: RareBoxProps) {
  // Valley variant (o0c_recont)
  const { scene } = useGLTF('/objects/01_o01a/o0c_recont.imd/o0c_recont.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  if (state === 'destroyed') return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/objects/01_o01a/o0c_recont.imd/o0c_recont.glb');
