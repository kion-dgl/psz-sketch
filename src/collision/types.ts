import * as THREE from 'three';

// 2D point for XZ plane collision
export interface Point2D {
  x: number;
  z: number;
}

// Wall as a line segment in XZ plane
export interface WallSegment {
  id: string;
  start: Point2D;
  end: Point2D;
}

// Wall definition format (matches existing WALLS arrays)
export interface WallDefinition {
  position: [number, number, number];
  length: number;
  rotation: number;
}

// Result of wall collision check
export interface WallCollisionResult {
  hit: boolean;
  wallId?: string;
  pushVector?: Point2D; // Vector to push player out of wall
  slideVector?: Point2D; // Vector for sliding along wall
}

// Trigger zone using Three.js Box3
export interface TriggerZone {
  id: string;
  bounds: THREE.Box3;
  onEnter?: () => void;
  onExit?: () => void;
}

// Trigger definition format (matches existing TRIGGERS arrays)
export interface TriggerDefinition {
  position: [number, number, number];
  size: [number, number, number];
  targetArea?: string;
  name: string;
  onEnter?: () => void;
}

// NPC data for proximity detection
export interface NPCData {
  id: string;
  name: string;
  position: Point2D;
  radius: number;
}

// Result of NPC proximity check
export interface NPCProximityResult {
  npc: NPCData;
  distance: number;
}

// Player state for collision checks
export interface PlayerState {
  position: THREE.Vector3;
  radius: number;
  facing: THREE.Vector3; // Normalized direction player is facing
}

// Collision system interface
export interface ICollisionSystem {
  // Registration
  registerWall(wall: WallSegment): () => void;
  registerTrigger(trigger: TriggerZone): () => void;
  registerNPC(npc: NPCData): () => void;
  setFloorMesh(mesh: THREE.Mesh | null): void;

  // Queries
  checkWallCollision(position: Point2D, radius: number, velocity: Point2D): WallCollisionResult;
  getFloorHeight(x: number, z: number): number | null;
  checkNPCProximity(position: Point2D, facing: Point2D, range: number): NPCProximityResult | null;

  // Trigger updates (called each frame with player position)
  updateTriggers(playerPosition: THREE.Vector3, playerRadius: number): void;
}
