/**
 * R3F Tags Type Definitions
 *
 * Each tag type has automatic collision behavior:
 * - Containers (Box, RareBox, Wall): Trigger for attack detection
 * - Barriers (Gate, KeyGate, Fence): Wall collision when active
 * - Switches: Trigger for player detection
 * - NPCs: NPC collision for proximity/facing
 * - Warps: Trigger for area transitions
 * - Keys: Trigger for collection
 */

// Base props shared by all tags
export interface BaseTagProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  collisionEnabled?: boolean; // Default: true (auto by type)
}

// Destructible container states
export type ContainerState = 'intact' | 'destroyed';

// Container props (Box, RareBox, Wall)
export interface ContainerProps extends BaseTagProps {
  state?: ContainerState;
  onDestroy?: () => void;
}

// Barrier states
export type BarrierState = 'closed' | 'open';
export type FenceState = 'active' | 'disabled';

// Gate props
export interface GateProps extends BaseTagProps {
  id: string;
  state?: BarrierState;
  blocked?: boolean; // Whether to register wall collision
}

// KeyGate props
export interface KeyGateProps extends BaseTagProps {
  id: string;
  keyId: string; // ID of the key required to open
  state?: BarrierState;
}

// Fence props
export interface FenceProps extends BaseTagProps {
  id?: string;
  state?: FenceState;
  variant?: 'default' | 'short' | 'diagonal';
}

// Switch types
export type SwitchType = 'interact' | 'step' | 'remote';
export type SwitchState = 'off' | 'on';

// Switch props
export interface SwitchProps extends BaseTagProps {
  type: SwitchType;
  targetId: string; // ID of the gate/fence this switch controls
  state?: SwitchState;
  onActivate?: () => void;
}

// NPC props
export interface NPCProps extends BaseTagProps {
  name: string;
  model: string; // Model path or model ID
  onInteract?: (npcName: string) => void;
}

// Warp types
export type WarpType = 'start' | 'area';

// Warp props
export interface WarpProps extends BaseTagProps {
  type: WarpType;
  targetArea?: string; // URL for area warp
  state?: 'active' | 'inactive';
}

// Key states
export type KeyState = 'available' | 'collected';

// Key props
export interface KeyProps extends BaseTagProps {
  keyId: string;
  state?: KeyState;
  onCollect?: (keyId: string) => void;
}

// Drop item types (no collision - visual only)
export type DropType = 'weapon' | 'armor' | 'meseta' | 'rare' | 'item';

export interface DropItemProps extends BaseTagProps {
  type: DropType;
  itemId?: string;
  state?: 'available' | 'collected';
}

// Stage context value
export interface StageContextValue {
  // State
  unlockedGates: Set<string>;
  collectedKeys: Set<string>;
  destroyedObjects: Set<string>;

  // Actions
  unlockGate: (gateId: string) => void;
  collectKey: (keyId: string) => void;
  destroyObject: (objectId: string) => void;

  // Queries
  isGateUnlocked: (gateId: string) => boolean;
  hasKey: (keyId: string) => boolean;
  isDestroyed: (objectId: string) => boolean;

  // Optional stage config
  difficulty?: 'easy' | 'normal' | 'hard';
  lootTable?: Record<string, unknown>;
}

// Stage props
export interface StageProps {
  id: string;
  children: React.ReactNode;
  difficulty?: 'easy' | 'normal' | 'hard';
  lootTable?: Record<string, unknown>;
  onComplete?: () => void;
}
