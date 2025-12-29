// Element components for traversal
export { default as Gate, gateMeta, type GateState } from './Gate';
export { default as KeyGate, keyGateMeta, type KeyGateState } from './KeyGate';
export { default as Fence, fenceMeta, type FenceState } from './Fence';
export { default as Key, keyMeta, type KeyState } from './Key';
export { default as InteractSwitch, interactSwitchMeta, type SwitchState } from './InteractSwitch';
export { default as StepSwitch, stepSwitchMeta, type StepSwitchState } from './StepSwitch';
export { default as Waypoint, waypointMeta, type WaypointState } from './Waypoint';

export type { ElementProps, StoryMeta } from './types';
