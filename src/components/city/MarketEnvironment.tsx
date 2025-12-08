import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useEffect } from 'react';

export default function MarketEnvironment() {
  const { scene } = useGLTF('/city_e/market/s00e_sa1_m.glb');

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
      {/* Large transparent ground plane with collision at Y=0 - extends far enough for the market */}
      <RigidBody type="fixed" position={[0, -0.5, 0]} collisionGroups={0x00030003} userData={{ type: 'ground' }}>
        {/* Explicit collider to ensure proper collision group */}
        <CuboidCollider args={[250, 0.5, 250]} />
        <mesh receiveShadow>
          <boxGeometry args={[500, 1, 500]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Market environment - visible but no collision for now */}
      <primitive object={scene} position={[0, 0, 0]} />
    </>
  );
}

// Preload the model
useGLTF.preload('/city_e/market/s00e_sa1_m.glb');
