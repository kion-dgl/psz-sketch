import * as THREE from 'three';
import type { TriggerZone, TriggerDefinition, NPCData, NPCProximityResult, Point2D } from './types';

/**
 * Trigger system manager
 * Tracks trigger zones and fires callbacks when player enters/exits
 */
export class TriggerManager {
  private triggers: Map<string, TriggerZone> = new Map();
  private activeTriggers: Set<string> = new Set(); // Triggers player is currently inside

  /**
   * Register a trigger zone
   * @returns Unregister function
   */
  register(trigger: TriggerZone): () => void {
    this.triggers.set(trigger.id, trigger);

    return () => {
      this.triggers.delete(trigger.id);
      this.activeTriggers.delete(trigger.id);
    };
  }

  /**
   * Register a trigger from definition format
   * @returns Unregister function
   */
  registerFromDefinition(def: TriggerDefinition): () => void {
    const center = new THREE.Vector3(def.position[0], def.position[1], def.position[2]);
    const size = new THREE.Vector3(def.size[0], def.size[1], def.size[2]);

    const bounds = new THREE.Box3();
    bounds.setFromCenterAndSize(center, size);

    const trigger: TriggerZone = {
      id: def.name,
      bounds,
      onEnter: def.onEnter
    };

    return this.register(trigger);
  }

  /**
   * Update triggers based on player position
   * Call this each frame to check for enter/exit events
   */
  update(playerPosition: THREE.Vector3, playerRadius: number = 0.5): void {
    // Create a sphere representing the player
    const playerSphere = new THREE.Sphere(playerPosition, playerRadius);

    for (const [id, trigger] of this.triggers) {
      const wasInside = this.activeTriggers.has(id);
      const isInside = trigger.bounds.intersectsSphere(playerSphere);

      if (isInside && !wasInside) {
        // Player entered trigger
        this.activeTriggers.add(id);
        trigger.onEnter?.();
      } else if (!isInside && wasInside) {
        // Player exited trigger
        this.activeTriggers.delete(id);
        trigger.onExit?.();
      }
    }
  }

  /**
   * Check if player is inside a specific trigger
   */
  isInsideTrigger(triggerId: string): boolean {
    return this.activeTriggers.has(triggerId);
  }

  /**
   * Get all triggers player is currently inside
   */
  getActiveTriggers(): string[] {
    return Array.from(this.activeTriggers);
  }

  /**
   * Clear all triggers
   */
  clear(): void {
    this.triggers.clear();
    this.activeTriggers.clear();
  }

  /**
   * Get trigger count
   */
  get count(): number {
    return this.triggers.size;
  }
}

/**
 * NPC proximity manager
 * Tracks NPCs and checks for proximity/facing detection
 */
export class NPCManager {
  private npcs: Map<string, NPCData> = new Map();

  /**
   * Register an NPC
   * @returns Unregister function
   */
  register(npc: NPCData): () => void {
    this.npcs.set(npc.id, npc);

    return () => {
      this.npcs.delete(npc.id);
    };
  }

  /**
   * Check for NPC in front of player within range
   * @param position Player position in XZ
   * @param facing Player facing direction (normalized)
   * @param range Maximum detection range
   * @param fovDot Minimum dot product for facing check (default 0.5 = 60 degree cone)
   */
  checkProximity(
    position: Point2D,
    facing: Point2D,
    range: number,
    fovDot: number = 0.5
  ): NPCProximityResult | null {
    let closestNPC: NPCProximityResult | null = null;
    let closestDistance = Infinity;

    for (const npc of this.npcs.values()) {
      // Calculate distance to NPC
      const dx = npc.position.x - position.x;
      const dz = npc.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Skip if too far
      if (distance > range + npc.radius) {
        continue;
      }

      // Calculate direction to NPC
      const dirX = dx / distance;
      const dirZ = dz / distance;

      // Check if NPC is in front of player (within FOV cone)
      const dot = facing.x * dirX + facing.z * dirZ;
      if (dot < fovDot) {
        continue; // NPC is behind or to the side
      }

      // Track closest NPC
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNPC = { npc, distance };
      }
    }

    return closestNPC;
  }

  /**
   * Get NPC by ID
   */
  getNPC(id: string): NPCData | undefined {
    return this.npcs.get(id);
  }

  /**
   * Clear all NPCs
   */
  clear(): void {
    this.npcs.clear();
  }

  /**
   * Get NPC count
   */
  get count(): number {
    return this.npcs.size;
  }
}
