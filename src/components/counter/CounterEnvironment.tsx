import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useEffect } from 'react';

export default function CounterEnvironment() {
  const { scene } = useGLTF('/city_e/s00e_sa2/lndmd/s00e_sa2_m.glb');

  useEffect(() => {
    // Traverse the scene and enable shadows
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <>
      {/* Large debug ground plane with collision at Y=0 */}
      <RigidBody type="fixed">
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[500, 1, 500]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
      </RigidBody>

      {/* Counter environment - visible but no collision for now */}
      <primitive object={scene} position={[0, 0, 0]} />
    </>
  );
}

// Preload the model
useGLTF.preload('/city_e/s00e_sa2/lndmd/s00e_sa2_m.glb');
