import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../collision';

export default function MarketEnvironment() {
  const { setFloorMesh } = useCollision();
  const meshRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF('/stages/city_e/market/s00e_sa1_m.glb');

  useEffect(() => {
    // Traverse the scene and enable shadows
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Register floor mesh with collision system
  useEffect(() => {
    if (meshRef.current) {
      const unregister = setFloorMesh('market-ground', meshRef.current);
      return unregister;
    }
  }, [setFloorMesh]);

  return (
    <>
      {/* Large ground plane at Y=0 */}
      <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial />
      </mesh>

      {/* Market environment */}
      <primitive object={scene} position={[0, 0, 0]} />
    </>
  );
}

// Preload the model
useGLTF.preload('/stages/city_e/market/s00e_sa1_m.glb');
