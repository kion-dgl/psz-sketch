import { useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../collision';

/**
 * Collision type for tags
 */
export type TagCollisionType = 'trigger' | 'wall' | 'npc' | 'none';

/**
 * Options for tag collision registration
 */
interface TagCollisionOptions {
  // Common
  id: string;
  position: [number, number, number];
  enabled?: boolean;

  // For triggers (Box, Switch, Warp, Key)
  triggerSize?: [number, number, number]; // Width, height, depth
  onEnter?: () => void;
  onExit?: () => void;

  // For walls (Gate, Fence)
  wallLength?: number;
  wallRotation?: number;

  // For NPCs
  npcName?: string;
  npcRadius?: number;
}

/**
 * Hook for registering tag collision based on type
 *
 * Automatically handles registration and cleanup.
 * Returns collision check utilities if needed.
 */
export function useTagCollision(
  type: TagCollisionType,
  options: TagCollisionOptions
) {
  const collision = useCollision();

  const {
    id,
    position,
    enabled = true,
    triggerSize = [1, 2, 1],
    onEnter,
    onExit,
    wallLength = 6,
    wallRotation = 0,
    npcName = '',
    npcRadius = 0.5,
  } = options;

  // Register trigger collision (Box, Switch, Warp, Key)
  useEffect(() => {
    if (type !== 'trigger' || !enabled) return;

    const center = new THREE.Vector3(position[0], position[1], position[2]);
    const size = new THREE.Vector3(triggerSize[0], triggerSize[1], triggerSize[2]);
    const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

    const unregister = collision.registerTrigger({
      id,
      bounds,
      onEnter,
      onExit,
    });

    return unregister;
  }, [type, id, position, enabled, triggerSize, onEnter, onExit, collision]);

  // Register wall collision (Gate, Fence)
  useEffect(() => {
    if (type !== 'wall' || !enabled) return;

    const unregister = collision.registerWallFromDefinition({
      position: [position[0], 1.5, position[2]], // Wall center height
      length: wallLength,
      rotation: wallRotation,
    }, id);

    return unregister;
  }, [type, id, position, enabled, wallLength, wallRotation, collision]);

  // Register NPC collision
  useEffect(() => {
    if (type !== 'npc' || !enabled) return;

    const unregister = collision.registerNPC({
      id,
      name: npcName,
      position: { x: position[0], z: position[2] },
      radius: npcRadius,
    });

    return unregister;
  }, [type, id, position, enabled, npcName, npcRadius, collision]);

  // Return collision utilities
  return {
    collision,
  };
}

/**
 * Hook for trigger collision (simplified)
 */
export function useTriggerCollision(
  id: string,
  position: [number, number, number],
  size: [number, number, number],
  options: {
    enabled?: boolean;
    onEnter?: () => void;
    onExit?: () => void;
  } = {}
) {
  return useTagCollision('trigger', {
    id,
    position,
    triggerSize: size,
    enabled: options.enabled,
    onEnter: options.onEnter,
    onExit: options.onExit,
  });
}

/**
 * Hook for wall collision (simplified)
 */
export function useWallCollision(
  id: string,
  position: [number, number, number],
  length: number,
  rotation: number,
  enabled: boolean = true
) {
  return useTagCollision('wall', {
    id,
    position,
    wallLength: length,
    wallRotation: rotation,
    enabled,
  });
}

/**
 * Hook for NPC collision (simplified)
 */
export function useNPCCollision(
  id: string,
  name: string,
  position: [number, number, number],
  radius: number = 0.5,
  enabled: boolean = true
) {
  return useTagCollision('npc', {
    id,
    position,
    npcName: name,
    npcRadius: radius,
    enabled,
  });
}

export default useTagCollision;
