import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { NPCProps } from './types';
import { useNPCCollision } from './useTagCollision';

/**
 * NPC Tag
 *
 * Interactable non-player character.
 * Auto-registers NPC collision for proximity/facing detection.
 *
 * Usage:
 * <NPC name="Weapon Shop" model="/npcs/weapon-shop.glb" position={[0, 0, 5]} onInteract={openShop} />
 * <NPC name="Guide" model="guide" position={[-5, 0, 0]} />
 */

// Built-in NPC models
const BUILTIN_MODELS: Record<string, string> = {
  'weapon-shop': '/objects/special_c4/np_000_00_0.imd/np_000_00_0.glb',
  'item-shop': '/objects/special_c4/np_001_00_0.imd/np_001_00_0.glb',
  'custom-shop': '/objects/special_c4/np_002_00_0.imd/np_002_00_0.glb',
  'enemy-collector': '/objects/special_c4/np_017_00_0.imd/np_017_00_0.glb',
  'photon-collector': '/objects/special_c4/np_018_00_0.imd/np_018_00_0.glb',
};

export default function NPC({
  name,
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onInteract,
  collisionEnabled = true,
}: NPCProps) {
  // Resolve model path (builtin name or full path)
  const modelPath = BUILTIN_MODELS[model] ?? model;

  const { scene } = useGLTF(modelPath);

  // Clone scene for proper instancing (use SkeletonUtils for skinned meshes)
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Register NPC collision
  useNPCCollision(
    `npc-${name}`,
    name,
    position,
    0.5,
    collisionEnabled
  );

  // Log when NPC is mounted
  useEffect(() => {
    console.log(`[NPC] Registered: ${name} at ${position.join(', ')}`);
  }, [name, position]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} position={[0, -1, 0]} />
    </group>
  );
}

// Preload builtin models
Object.values(BUILTIN_MODELS).forEach(path => useGLTF.preload(path));
