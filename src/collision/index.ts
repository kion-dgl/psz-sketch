// Types
export type {
  Point2D,
  WallSegment,
  WallDefinition,
  WallCollisionResult,
  TriggerZone,
  TriggerDefinition,
  NPCData,
  NPCProximityResult,
  PlayerState,
  ICollisionSystem
} from './types';

// Wall collision
export {
  WallCollisionManager,
  wallDefinitionToSegment,
  checkCircleLineCollision
} from './WallCollision';

// Floor collision
export { FloorCollisionManager } from './FloorCollision';

// Trigger and NPC systems
export { TriggerManager, NPCManager } from './TriggerSystem';

// React context and provider
export {
  CollisionProvider,
  useCollision,
  type CollisionContextValue
} from './CollisionContext';
