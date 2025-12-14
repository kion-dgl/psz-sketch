import { RigidBody, CylinderCollider } from '@react-three/rapier';

// NPC positions with labels
// TODO: Add actual NPC positions for warp area
const NPCS: Array<{ x: number; y: number; z: number; rotation: number; name: string; color: string }> = [
  // Placeholder NPCs - adjust based on actual warp area layout
];

export default function WarpNPCs() {
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
