import { useGLTF } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';

interface NPCModelProps {
  position: [number, number, number];
  name: string;
  modelPath: string;
}

function NPCModel({ position, name, modelPath }: NPCModelProps) {
  const { registerNPC } = useCollision();
  const { scene } = useGLTF(modelPath);

  // Clone using SkeletonUtils for skinned meshes
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
    <group position={position}>
      <primitive object={clonedScene} position={[0, -1, 0]} />
    </group>
  );
}

const NPC_MODELS = {
  weaponShop: '/objects/special_c1/np_002_00_0.imd/np_002_00_0.glb',
  itemShop: '/objects/special_c1/np_003_00_0.imd/np_003_00_0.glb',
  customShop: '/objects/special_c1/np_004_00_0.imd/np_004_00_0.glb',
};

export default function NPCs() {
  return (
    <>
      <NPCModel position={[-6.78, 1, 21.81]} name="Weapon Shop" modelPath={NPC_MODELS.weaponShop} />
      <NPCModel position={[-10.34, 1, 27.67]} name="Item Shop" modelPath={NPC_MODELS.itemShop} />
      <NPCModel position={[6.25, 1, 23.45]} name="Custom Shop" modelPath={NPC_MODELS.customShop} />
    </>
  );
}

// Preload all NPC models
Object.values(NPC_MODELS).forEach(path => useGLTF.preload(path));
