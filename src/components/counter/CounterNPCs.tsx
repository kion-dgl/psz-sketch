import { RigidBody, CylinderCollider } from '@react-three/rapier';

// NPC positions with labels
const NPCS = [
  { x: -11.28, y: 1, z: -8.03, name: 'Item Storage', color: '#9b59b6' }, // Purple
  { x: -8.80, y: 1, z: -10.75, name: 'Quest Counter', color: '#e67e22' }, // Orange
];

export default function CounterNPCs() {
  return (
    <>
      {NPCS.map((npc, index) => (
        <group key={index} position={[npc.x, npc.y, npc.z]}>
          <RigidBody type="fixed" userData={{ npcName: npc.name }}>
            <CylinderCollider args={[1, 0.5]} />
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
              <meshStandardMaterial color={npc.color} />
            </mesh>
          </RigidBody>
        </group>
      ))}
    </>
  );
}
