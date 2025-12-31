import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface BossSkyProps {
  position?: [number, number, number];
}

export default function BossSky({ position = [0, 0, 0] }: BossSkyProps) {
  const { scene } = useGLTF('/objects/special_02z/o0s_zsky.imd/o0s_zsky.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply texture settings
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
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene]);

  return (
    <group position={position}>
      <primitive object={clonedScene} />
    </group>
  );
}
