import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useEffect } from 'react';

export default function CounterEnvironment() {
  const { scene } = useGLTF('/city_e/s00e_sa2/lndmd/s00e_sa2_m.glb');

  useEffect(() => {
    // Traverse the scene and enable shadows + disable physics
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Aggressively disable Rapier auto-collision generation
        child.userData.collider = false;
      }
    });
  }, [scene]);

  return (
    <>
      {/* Counter environment model - visible but no collision */}
      <primitive object={scene} position={[0, 0, 0]} />
    </>
  );
}

// Separate ground plane component that goes inside Physics
export function CounterGroundPlane() {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]} collisionGroups={0x00030003} userData={{ type: 'ground' }}>
      {/* Explicit collider to ensure proper collision group */}
      <CuboidCollider args={[250, 0.5, 250]} />
      <mesh receiveShadow>
        <boxGeometry args={[500, 1, 500]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </RigidBody>
  );
}

// Preload the model
useGLTF.preload('/city_e/s00e_sa2/lndmd/s00e_sa2_m.glb');
