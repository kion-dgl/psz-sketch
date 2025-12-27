import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// NPC model component for weapon shop owner
function WeaponShopNPC({ position, name }: { position: [number, number, number]; name: string }) {
  const { scene } = useGLTF('/objects/special_c1/np_002_00_0.imd/np_002_00_0.glb');

  // Clone using SkeletonUtils for skinned meshes
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  return (
    <group position={position}>
      <RigidBody type="fixed" sensor userData={{ npcName: name }} collisionGroups={0x00020002}>
        <CylinderCollider args={[1, 0.5]} />
        {/* NPC Model - texture is embedded in GLB */}
        <primitive object={clonedScene} position={[0, -1, 0]} />
      </RigidBody>
    </group>
  );
}

// Placeholder NPC component (cylinder)
function PlaceholderNPC({ position, name, color }: { position: [number, number, number]; name: string; color: string }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" sensor userData={{ npcName: name }} collisionGroups={0x00020002}>
        <CylinderCollider args={[1, 0.5]} />
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </RigidBody>
    </group>
  );
}

export default function NPCs() {
  return (
    <>
      {/* Weapon Shop - uses actual NPC model */}
      <WeaponShopNPC position={[-6.78, 1, 21.81]} name="Weapon Shop" />

      {/* Item Shop - placeholder */}
      <PlaceholderNPC position={[-10.34, 1, 27.67]} name="Item Shop" color="#3498db" />

      {/* Custom Shop - placeholder */}
      <PlaceholderNPC position={[6.25, 1, 23.45]} name="Custom Shop" color="#2ecc71" />
    </>
  );
}

// Preload the NPC model
useGLTF.preload('/objects/special_c1/np_002_00_0.imd/np_002_00_0.glb');
