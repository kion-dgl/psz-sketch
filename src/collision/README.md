# Custom Collision System

This collision system replaces `@react-three/rapier` with lightweight Three.js-based collision detection optimized for PSO-style RPG gameplay.

## Architecture Overview

```
src/collision/
├── index.ts              # Exports
├── types.ts              # TypeScript interfaces
├── CollisionContext.tsx  # React context + provider
├── WallCollision.ts      # 2D circle-line collision
├── FloorCollision.ts     # Raycaster-based height detection
├── TriggerSystem.ts      # AABB trigger + NPC proximity
└── README.md             # This file
```

## Collision Methods by Interaction Type

| Interaction | Method | Algorithm | Description |
|-------------|--------|-----------|-------------|
| **Walls** | Circle-Line 2D | Closest point projection | Player slides along walls, not blocked |
| **Floors** | Raycast | THREE.Raycaster downward | Get floor height at any XZ position |
| **Triggers** | Sphere-AABB | THREE.Box3.intersectsSphere | Area transitions, switches, warps |
| **NPCs** | Distance + Dot Product | Euclidean distance + FOV cone | Proximity detection with facing check |

---

## Wall Collision (Circle-Line 2D)

**File:** `WallCollision.ts`

**Method:** 2D circle-line segment collision with slide response

**Algorithm:**
1. Convert wall definition (position/length/rotation) to line segment in XZ plane
2. Find closest point on segment to player circle center
3. If distance < player radius, calculate:
   - **Push vector**: Direction from wall to push player out
   - **Slide vector**: Velocity projected onto wall tangent

**Usage:**
```tsx
const { resolveWallCollision } = useCollision();

// In movement loop
const result = resolveWallCollision(
  { x: playerX, z: playerZ },
  playerRadius,
  { x: velocityX, z: velocityZ }
);

// Apply resolved position (player slides along wall)
setPosition({ x: result.position.x, z: result.position.z });
```

**Why Circle-Line?**
- Player is treated as a circle in 2D (XZ plane)
- Walls are line segments (no thickness needed)
- Slide response feels natural for RPG movement
- Simple math, fast collision checks

---

## Floor Collision (Raycast)

**File:** `FloorCollision.ts`

**Method:** THREE.Raycaster casting downward from high above

**Algorithm:**
1. Register floor mesh(es) with the collision system
2. Cast ray from (x, 100, z) pointing down
3. Return Y-coordinate of first intersection

**Usage:**
```tsx
const { setFloorMesh, getFloorHeight } = useCollision();

// Register floor in useEffect
useEffect(() => {
  if (meshRef.current) {
    return setFloorMesh('floor-id', meshRef.current);
  }
}, []);

// In movement loop
const floorY = getFloorHeight(playerX, playerZ);
if (floorY !== null) {
  setPlayerY(floorY + playerHeight);
}
```

**Why Raycast?**
- Handles complex terrain geometry (slopes, stairs)
- Works with runtime-extracted floor meshes
- Supports multiple overlapping floor areas
- Cache optimization reduces repeated lookups

---

## Trigger System (Sphere-AABB)

**File:** `TriggerSystem.ts`

**Method:** Player sphere vs trigger box intersection

**Algorithm:**
1. Create THREE.Box3 for each trigger zone
2. Each frame, check `box.intersectsSphere(playerSphere)`
3. Track enter/exit state to fire callbacks once

**Usage:**
```tsx
const { registerTrigger, updateTriggers } = useCollision();

// Register trigger
useEffect(() => {
  const center = new THREE.Vector3(x, y, z);
  const size = new THREE.Vector3(width, height, depth);
  const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

  return registerTrigger({
    id: 'area-warp',
    bounds,
    onEnter: () => navigate('/next-area'),
    onExit: () => console.log('Left trigger')
  });
}, []);

// Call each frame (handled by PlayerCharacter)
updateTriggers(playerPosition, playerRadius);
```

**Why Sphere-AABB?**
- Fast intersection test (Three.js optimized)
- Player sphere matches their collision volume
- Box triggers easy to define and visualize
- Supports multiple overlapping triggers

---

## NPC Proximity (Distance + Facing)

**File:** `TriggerSystem.ts` (NPCManager class)

**Method:** Euclidean distance + dot product for facing check

**Algorithm:**
1. Calculate distance from player to each NPC
2. Filter NPCs outside interaction range
3. Check if NPC is within player's facing cone (dot product > 0.5)
4. Return closest NPC that passes both checks

**Usage:**
```tsx
const { registerNPC, checkNPCProximity } = useCollision();

// Register NPC
useEffect(() => {
  return registerNPC({
    id: 'shop-keeper',
    name: 'Shop Keeper',
    position: { x: npcX, z: npcZ },
    radius: 0.5
  });
}, []);

// Check for interaction
const nearbyNPC = checkNPCProximity(
  { x: playerX, z: playerZ },           // Player position
  { x: facingDirX, z: facingDirZ },     // Normalized facing direction
  3.0                                     // Interaction range
);

if (nearbyNPC) {
  showInteractionPrompt(nearbyNPC.npc.name);
}
```

**Why Distance + Dot Product?**
- Simple Euclidean distance for range check
- Dot product efficiently checks if NPC is "in front of" player
- FOV cone (default 60°) prevents interacting with NPCs behind player
- Returns closest valid NPC (no ambiguity)

---

## Component Integration

### CollisionProvider

Wrap your 3D scene with `<CollisionProvider>` to enable collision:

```tsx
import { CollisionProvider } from '../../collision';

export default function GameArea() {
  return (
    <Canvas>
      <CollisionProvider>
        <FloorCollision />
        <Walls />
        <Triggers />
        <NPCs />
        <PlayerCharacter />
      </CollisionProvider>
    </Canvas>
  );
}
```

### PlayerCharacter Integration

The player uses all collision systems in its movement loop:

```tsx
useFrame((_, delta) => {
  // 1. Get input velocity
  const velocity = calculateInputVelocity(keys, delta);

  // 2. Resolve wall collision (slide response)
  const wallResult = resolveWallCollision(position, radius, velocity);

  // 3. Get floor height at new position
  const floorY = getFloorHeight(wallResult.position.x, wallResult.position.z);

  // 4. Apply final position
  setPosition({
    x: wallResult.position.x,
    y: floorY ?? position.y,
    z: wallResult.position.z
  });

  // 5. Update triggers
  updateTriggers(position);
});
```

---

## Performance Notes

- **Wall collision**: O(n) where n = number of walls. Consider spatial partitioning for > 100 walls.
- **Floor raycast**: Cached per position (100ms TTL). Avoid moving floors.
- **Triggers**: O(n) per frame. Use reasonable trigger counts (< 50).
- **NPCs**: O(n) only when checking proximity (on demand).

---

## Migration from Rapier

| Rapier Component | Custom Replacement |
|-----------------|-------------------|
| `<Physics>` | `<CollisionProvider>` |
| `<RigidBody type="fixed">` | Remove (register with collision system instead) |
| `<CuboidCollider>` | `registerTrigger()` or `registerWall()` |
| `<TrimeshCollider>` | `setFloorMesh()` |
| `<CylinderCollider>` for NPCs | `registerNPC()` |
| `useRapier()` | `useCollision()` |
| `collisionGroups` | Not needed (systems are separate) |
