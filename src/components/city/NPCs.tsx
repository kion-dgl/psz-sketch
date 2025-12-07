import { RigidBody, CylinderCollider } from '@react-three/rapier';

// NPC positions with labels
const NPCS = [
  { x: -6.78, y: 1, z: 21.81, name: 'Weapon Shop', color: '#e74c3c' },
  { x: -10.34, y: 1, z: 27.67, name: 'Item Shop', color: '#3498db' },
  { x: 6.25, y: 1, z: 23.45, name: 'Custom Shop', color: '#2ecc71' },
];

export default function NPCs() {
  return (
    <>
      {NPCS.map((npc, index) => (
        <group key={index} position={[npc.x, npc.y, npc.z]}>
          <RigidBody type="fixed">
            <CylinderCollider args={[1, 0.5]} />
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
              <meshStandardMaterial color={npc.color} />
            </mesh>
          </RigidBody>
          {/* Label above NPC */}
          {/* TODO: Add text label using troika-three-text or sprite */}
        </group>
      ))}
    </>
  );
}
