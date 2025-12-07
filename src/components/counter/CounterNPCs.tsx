import { RigidBody, CylinderCollider } from '@react-three/rapier';

// NPC positions with labels
const NPCS = [
  { x: -10.66, y: 1, z: -7.93, rotation: 4.06, name: 'Item Storage', color: '#9b59b6' }, // Purple
  { x: -8.31, y: 1, z: -10.37, rotation: 3.86, name: 'Quest Counter', color: '#e67e22' }, // Orange
];

export default function CounterNPCs() {
  return (
    <>
      {NPCS.map((npc, index) => (
        <group key={index} position={[npc.x, npc.y, npc.z]} rotation={[0, npc.rotation, 0]}>
          {/* RigidBody kept for userData, sensor to disable physical collision */}
          {/* Group 1 for NPCs, separate from walls (group 0) */}
          <RigidBody type="fixed" sensor userData={{ npcName: npc.name }} collisionGroups={0x00020002}>
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
