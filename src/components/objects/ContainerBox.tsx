import { useGLTF } from '@react-three/drei';

interface ContainerBoxProps {
  position: [number, number, number];
}

export default function ContainerBox({ position }: ContainerBoxProps) {
  const { scene } = useGLTF('/objects/01_o01a/o01_cont.imd/o01_cont.glb');

  return (
    <primitive object={scene.clone()} position={position} />
  );
}
