import { useEffect } from 'react';
import { useCollision } from '../../collision';

// NPC positions with labels
// TODO: Add actual NPC positions for warp area
const NPCS: Array<{ x: number; y: number; z: number; rotation: number; name: string; color: string }> = [
  // Placeholder NPCs - adjust based on actual warp area layout
];

function WarpNPC({ npc }: { npc: typeof NPCS[0] }) {
  const { registerNPC } = useCollision();

  useEffect(() => {
    const unregister = registerNPC({
      id: `warp-npc-${npc.name}`,
      name: npc.name,
      position: { x: npc.x, z: npc.z },
      radius: 0.5
    });
    return unregister;
  }, [npc, registerNPC]);

  return (
    <group position={[npc.x, npc.y, npc.z]} rotation={[0, npc.rotation, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
        <meshStandardMaterial color={npc.color} />
      </mesh>
    </group>
  );
}

export default function WarpNPCs() {
  return (
    <>
      {NPCS.map((npc, index) => (
        <WarpNPC key={index} npc={npc} />
      ))}
    </>
  );
}
