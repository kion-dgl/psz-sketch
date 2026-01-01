import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SwitchProps, SwitchState } from './types';
import { useTriggerCollision } from './useTagCollision';
import { useStage } from './StageContext';

/**
 * Switch Tag
 *
 * Activatable switch that unlocks gates/fences.
 * Three variants: interact (hand), step (floor), remote (laser).
 * Auto-registers trigger collision for player detection.
 *
 * Usage:
 * <Switch type="step" targetId="gate1" position={[3, 0, 5]} />
 * <Switch type="interact" targetId="fence1" position={[0, 1, 0]} />
 */

const MODEL_PATHS = {
  step: '/objects/01_o01a/o0c_switchf.imd/o0c_switchf.glb',
  interact: '/objects/01_o01a/o0c_switchi.imd/o0c_switchi.glb',
  remote: '/objects/01_o01a/o0c_switchl.imd/o0c_switchl.glb',
};

const TRIGGER_SIZES = {
  step: [1.5, 0.5, 1.5] as [number, number, number],
  interact: [1.5, 2, 1.5] as [number, number, number],
  remote: [1.5, 2, 1.5] as [number, number, number],
};

export default function Switch({
  type,
  targetId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  state: propState,
  onActivate,
  collisionEnabled = true,
}: SwitchProps) {
  const modelPath = MODEL_PATHS[type];
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Get Stage context for unlocking gates
  const stage = useStage();

  // Local state tracking
  const [activated, setActivated] = useState(false);

  // Final state (prop overrides local)
  const state: SwitchState = propState ?? (activated ? 'on' : 'off');

  // Handle activation
  const handleActivate = useCallback(() => {
    if (activated) return; // Already activated

    setActivated(true);

    // Unlock target in Stage context
    if (stage) {
      stage.unlockGate(targetId);
    }

    // Call user callback
    onActivate?.();

    console.log(`[Switch] Activated, unlocking: ${targetId}`);
  }, [activated, targetId, stage, onActivate]);

  // Register trigger collision
  useTriggerCollision(
    `switch-${type}-${position.join('-')}`,
    position,
    TRIGGER_SIZES[type],
    {
      enabled: collisionEnabled && state === 'off',
      onEnter: handleActivate,
    }
  );

  // Apply visual state
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            // Apply texture offset based on state
            if (mat.map) {
              mat.map.offset.x = state === 'off' ? 0.5 : 0;
              mat.map.needsUpdate = true;
            }

            // Emissive glow when on
            if (mat instanceof THREE.MeshStandardMaterial) {
              if (state === 'on') {
                mat.emissive = new THREE.Color(0x44aaff);
                mat.emissiveIntensity = 0.5;
              } else {
                mat.emissive = new THREE.Color(0x000000);
                mat.emissiveIntensity = 0;
              }
            }
            mat.needsUpdate = true;
          }
        });

        // Pressed down visual for step switch
        if (type === 'step') {
          child.position.y = state === 'on' ? -0.02 : 0;
        }
      }
    });
  }, [clonedScene, state, type]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload all switch models
Object.values(MODEL_PATHS).forEach(path => useGLTF.preload(path));
