import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface NPCModelProps {
  position: [number, number, number];
  rotation: number;
  name: string;
  modelPath: string;
}

function NPCModel({ position, rotation, name, modelPath }: NPCModelProps) {
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RigidBody type="fixed" sensor userData={{ npcName: name }} collisionGroups={0x00020002}>
        <CylinderCollider args={[1, 0.5]} />
        <primitive object={clonedScene} position={[0, -1, 0]} />
      </RigidBody>
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
        rotation={4.06}
        name="Item Storage"
        modelPath={NPC_MODELS.itemStorage}
      />
      <NPCModel
        position={[-8.31, 1, -10.37]}
        rotation={3.86}
        name="Quest Counter"
        modelPath={NPC_MODELS.questCounter}
      />
    </>
  );
}

// Preload all NPC models
Object.values(NPC_MODELS).forEach(path => useGLTF.preload(path));
