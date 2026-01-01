import { createContext, useContext, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { WallCollisionManager, wallDefinitionToSegment } from './WallCollision';
import { FloorCollisionManager } from './FloorCollision';
import { TriggerManager, NPCManager } from './TriggerSystem';
import type {
  WallSegment,
  WallDefinition,
  WallCollisionResult,
  TriggerZone,
  TriggerDefinition,
  NPCData,
  NPCProximityResult,
  Point2D
} from './types';

/**
 * Collision system API exposed via context
 */
export interface CollisionContextValue {
  // Wall registration
  registerWall: (wall: WallSegment) => () => void;
  registerWallFromDefinition: (def: WallDefinition, id: string) => () => void;

  // Floor registration
  setFloorMesh: (id: string, mesh: THREE.Mesh) => () => void;

  // Trigger registration
  registerTrigger: (trigger: TriggerZone) => () => void;
  registerTriggerFromDefinition: (def: TriggerDefinition) => () => void;

  // NPC registration
  registerNPC: (npc: NPCData) => () => void;

  // Collision queries
  checkWallCollision: (position: Point2D, radius: number, velocity: Point2D) => WallCollisionResult;
  resolveWallCollision: (position: Point2D, radius: number, velocity: Point2D) => {
    position: Point2D;
    velocity: Point2D;
    hitWall: boolean;
  };
  getFloorHeight: (x: number, z: number) => number | null;
  hasFloor: (x: number, z: number) => boolean;

  // NPC queries
  checkNPCProximity: (position: Point2D, facing: Point2D, range: number) => NPCProximityResult | null;

  // Trigger updates (call each frame)
  updateTriggers: (playerPosition: THREE.Vector3, playerRadius?: number) => void;
  getActiveTriggers: () => string[];
}

const CollisionContext = createContext<CollisionContextValue | null>(null);

/**
 * Hook to access collision system
 */
export function useCollision(): CollisionContextValue {
  const context = useContext(CollisionContext);
  if (!context) {
    throw new Error('useCollision must be used within a CollisionProvider');
  }
  return context;
}

interface CollisionProviderProps {
  children: ReactNode;
}

/**
 * Collision system provider
 * Wraps your 3D scene to provide collision detection
 */
export function CollisionProvider({ children }: CollisionProviderProps) {
  // Create collision managers (stable across re-renders)
  const wallManager = useMemo(() => new WallCollisionManager(), []);
  const floorManager = useMemo(() => new FloorCollisionManager(), []);
  const triggerManager = useMemo(() => new TriggerManager(), []);
  const npcManager = useMemo(() => new NPCManager(), []);

  // Create stable context value
  const value = useMemo<CollisionContextValue>(() => ({
    // Wall registration
    registerWall: (wall: WallSegment) => wallManager.register(wall),
    registerWallFromDefinition: (def: WallDefinition, id: string) => {
      const segment = wallDefinitionToSegment(def, id);
      return wallManager.register(segment);
    },

    // Floor registration
    setFloorMesh: (id: string, mesh: THREE.Mesh) => floorManager.setFloorMesh(id, mesh),

    // Trigger registration
    registerTrigger: (trigger: TriggerZone) => triggerManager.register(trigger),
    registerTriggerFromDefinition: (def: TriggerDefinition) =>
      triggerManager.registerFromDefinition(def),

    // NPC registration
    registerNPC: (npc: NPCData) => npcManager.register(npc),

    // Wall collision
    checkWallCollision: (position: Point2D, radius: number, velocity: Point2D) =>
      wallManager.checkCollision(position, radius, velocity),
    resolveWallCollision: (position: Point2D, radius: number, velocity: Point2D) =>
      wallManager.resolvePosition(position, radius, velocity),

    // Floor collision
    getFloorHeight: (x: number, z: number) => floorManager.getHeight(x, z),
    hasFloor: (x: number, z: number) => floorManager.hasFloor(x, z),

    // NPC proximity
    checkNPCProximity: (position: Point2D, facing: Point2D, range: number) =>
      npcManager.checkProximity(position, facing, range),

    // Trigger updates
    updateTriggers: (playerPosition: THREE.Vector3, playerRadius?: number) =>
      triggerManager.update(playerPosition, playerRadius),
    getActiveTriggers: () => triggerManager.getActiveTriggers()
  }), [wallManager, floorManager, triggerManager, npcManager]);

  return (
    <CollisionContext.Provider value={value}>
      {children}
    </CollisionContext.Provider>
  );
}
