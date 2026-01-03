import { useGLTF } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';

interface NPCModelProps {
  position: [number, number, number];
  rotation: number;
  name: string;
  modelPath: string;
}

function NPCModel({ position, rotation, name, modelPath }: NPCModelProps) {
  const { registerNPC } = useCollision();
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Register NPC with collision system
  useEffect(() => {
    const unregister = registerNPC({
      id: `npc-${name}`,
      name,
      position: { x: position[0], z: position[2] },
      radius: 0.5
    });
    return unregister;
  }, [name, position, registerNPC]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clonedScene} position={[0, -1, 0]} />
    </group>
  );
}

const NPC_MODELS = {
  itemStorage: '/objects/special_c2/np_000_00_0.imd/np_000_00_0.glb',
  questCounter: '/objects/special_c2/np_001_00_0.imd/np_001_00_0.glb',
};

export default function CounterNPCs() {
  return (
    <>
      <NPCModel
        position={[-10.66, 1, -7.93]}
        rotation={4.06 + Math.PI}
        name="Item Storage"
        modelPath={NPC_MODELS.itemStorage}
      />
      <NPCModel
        position={[-8.31, 1, -10.37]}
        rotation={3.86 + Math.PI}
        name="Quest Counter"
        modelPath={NPC_MODELS.questCounter}
      />
    </>
  );
}

// Preload all NPC models
Object.values(NPC_MODELS).forEach(path => useGLTF.preload(path));
