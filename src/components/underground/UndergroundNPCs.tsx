import { useGLTF } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';

interface NPCModelProps {
  position: [number, number, number];
  rotation?: number;
  name: string;
  modelPath: string;
}

function NPCModel({ position, rotation = 0, name, modelPath }: NPCModelProps) {
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
  enemyCollector: '/objects/special_c4/np_017_00_0.imd/np_017_00_0.glb',
  photonCollector: '/objects/special_c4/np_018_00_0.imd/np_018_00_0.glb',
};

export default function UndergroundNPCs() {
  return (
    <>
      <NPCModel
        position={[8.38, 1, -4.81]}
        name="Enemy Collector"
        modelPath={NPC_MODELS.enemyCollector}
      />
      <NPCModel
        position={[-6.32, 1, -5.35]}
        name="Photon Collector"
        modelPath={NPC_MODELS.photonCollector}
      />
    </>
  );
}

// Preload all NPC models
Object.values(NPC_MODELS).forEach(path => useGLTF.preload(path));
