import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import type { GateProps, BarrierState } from './types';
import { useWallCollision } from './useTagCollision';
import { useStage } from './StageContext';

/**
 * Gate Tag
 *
 * Barrier that blocks passage when closed.
 * Auto-registers wall collision when state="closed" and blocked=true.
 *
 * Usage:
 * <Gate id="gate1" position={[0, 0, 10]} state="closed" blocked />
 * <Gate id="gate2" position={[0, 0, 20]} /> // state managed by Stage context
 */

const MODEL_PATH = '/objects/01_o01a/o0c_gate.imd/o0c_gate.glb';
const LASER_MESH_NAME = 'o0c_gate_3';
const WALL_LENGTH = 6;

export default function Gate({
  id,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state: propState,
  blocked = true,
  collisionEnabled = true,
}: GateProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Get state from Stage context if available
  const stage = useStage();
  const isUnlockedByStage = stage?.isGateUnlocked(id) ?? false;

  // Determine final state (prop overrides context)
  const state: BarrierState = propState ?? (isUnlockedByStage ? 'open' : 'closed');

  // Calculate rotation from position tuple
  const rotationY = Array.isArray(rotation) ? rotation[1] : 0;

  // Register wall collision when closed and blocked
  useWallCollision(
    `gate-${id}`,
    position,
    WALL_LENGTH,
    rotationY,
    collisionEnabled && blocked && state === 'closed'
  );

  // Toggle laser mesh visibility based on state
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.name === LASER_MESH_NAME) {
        child.visible = state === 'closed';
      }
    });
  }, [clonedScene, state]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);
