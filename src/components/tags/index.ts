/**
 * R3F Tags System
 *
 * Modular game object components with automatic collision registration.
 *
 * Usage:
 * import { Stage, Box, Gate, Switch, NPC, Warp, Key } from '../tags';
 *
 * <Stage id="valley-01">
 *   <Box position={[5, 0, 0]} />
 *   <Gate id="gate1" position={[0, 0, 10]} />
 *   <Switch type="step" targetId="gate1" position={[3, 0, 5]} />
 *   <NPC name="Guide" model="weapon-shop" position={[-5, 0, 0]} />
 *   <Warp type="area" targetArea="/stage/valley-02" position={[0, 0, 50]} />
 * </Stage>
 */

// Types
export type {
  BaseTagProps,
  ContainerState,
  ContainerProps,
  BarrierState,
  FenceState,
  GateProps,
  KeyGateProps,
  FenceProps,
  SwitchType,
  SwitchState,
  SwitchProps,
  NPCProps,
  WarpType,
  WarpProps,
  KeyState,
  KeyProps,
  DropType,
  DropItemProps,
  StageContextValue,
  StageProps,
} from './types';

// Stage container and context
export { Stage, useStage, useStageRequired } from './StageContext';

// Collision hooks
export {
  useTagCollision,
  useTriggerCollision,
  useWallCollision,
  useNPCCollision,
} from './useTagCollision';

// Container tags (destructible objects)
export { default as Box } from './Box';
// TODO: export { default as RareBox } from './RareBox';
// TODO: export { default as Wall } from './Wall';

// Barrier tags (blocking objects)
export { default as Gate } from './Gate';
// TODO: export { default as KeyGate } from './KeyGate';
// TODO: export { default as Fence } from './Fence';

// Switch tags
export { default as Switch } from './Switch';

// NPC tags
export { default as NPC } from './NPC';

// Warp tags
export { default as Warp } from './Warp';

// Collectible tags
export { default as Key } from './Key';
