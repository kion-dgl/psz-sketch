import type { Point2D, WallSegment, WallDefinition, WallCollisionResult } from './types';

/**
 * Convert a wall definition (position/length/rotation) to a line segment
 */
export function wallDefinitionToSegment(def: WallDefinition, id: string): WallSegment {
  const [x, _y, z] = def.position;
  const halfLength = def.length / 2;

  // Wall extends along its local Z axis, rotated by rotation around Y
  // At rotation=0, wall goes from (x, z-halfLength) to (x, z+halfLength)
  // Rotation rotates the wall around its center point
  const cos = Math.cos(def.rotation);
  const sin = Math.sin(def.rotation);

  return {
    id,
    start: {
      x: x - sin * halfLength,
      z: z - cos * halfLength
    },
    end: {
      x: x + sin * halfLength,
      z: z + cos * halfLength
    }
  };
}

/**
 * Calculate the closest point on a line segment to a given point
 */
function closestPointOnSegment(point: Point2D, segStart: Point2D, segEnd: Point2D): Point2D {
  const dx = segEnd.x - segStart.x;
  const dz = segEnd.z - segStart.z;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq === 0) {
    // Segment is a point
    return { x: segStart.x, z: segStart.z };
  }

  // Project point onto line, clamped to segment
  const t = Math.max(0, Math.min(1,
    ((point.x - segStart.x) * dx + (point.z - segStart.z) * dz) / lengthSq
  ));

  return {
    x: segStart.x + t * dx,
    z: segStart.z + t * dz
  };
}

/**
 * Calculate distance between two 2D points
 */
function distance2D(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Normalize a 2D vector
 */
function normalize2D(v: Point2D): Point2D {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return { x: 0, z: 0 };
  return { x: v.x / len, z: v.z / len };
}

/**
 * Check if a circle (player) collides with a line segment (wall)
 * Returns collision result with push and slide vectors for smooth movement
 */
export function checkCircleLineCollision(
  circleCenter: Point2D,
  radius: number,
  velocity: Point2D,
  wall: WallSegment
): WallCollisionResult {
  // Find closest point on wall to circle center
  const closest = closestPointOnSegment(circleCenter, wall.start, wall.end);
  const dist = distance2D(circleCenter, closest);

  // No collision if distance > radius
  if (dist > radius) {
    return { hit: false };
  }

  // Calculate push vector (from wall towards player)
  const pushDir = normalize2D({
    x: circleCenter.x - closest.x,
    z: circleCenter.z - closest.z
  });

  // Push amount is how much we're overlapping
  const overlap = radius - dist;
  const pushVector: Point2D = {
    x: pushDir.x * overlap,
    z: pushDir.z * overlap
  };

  // Calculate wall direction (tangent)
  const wallDir = normalize2D({
    x: wall.end.x - wall.start.x,
    z: wall.end.z - wall.start.z
  });

  // Project velocity onto wall direction to get slide component
  const velDotWall = velocity.x * wallDir.x + velocity.z * wallDir.z;
  const slideVector: Point2D = {
    x: wallDir.x * velDotWall,
    z: wallDir.z * velDotWall
  };

  return {
    hit: true,
    wallId: wall.id,
    pushVector,
    slideVector
  };
}

/**
 * Wall collision manager - holds all walls and checks collisions
 */
export class WallCollisionManager {
  private walls: Map<string, WallSegment> = new Map();

  /**
   * Register a wall segment
   * @returns Unregister function
   */
  register(wall: WallSegment): () => void {
    this.walls.set(wall.id, wall);
    return () => {
      this.walls.delete(wall.id);
    };
  }

  /**
   * Register a wall from definition format
   * @returns Unregister function
   */
  registerFromDefinition(def: WallDefinition, id: string): () => void {
    const segment = wallDefinitionToSegment(def, id);
    return this.register(segment);
  }

  /**
   * Check collision against all walls
   * Returns the collision with the deepest penetration, or null if no collision
   */
  checkCollision(position: Point2D, radius: number, velocity: Point2D): WallCollisionResult {
    let deepestCollision: WallCollisionResult = { hit: false };
    let maxOverlap = 0;

    for (const wall of this.walls.values()) {
      const result = checkCircleLineCollision(position, radius, velocity, wall);

      if (result.hit && result.pushVector) {
        const overlap = Math.sqrt(
          result.pushVector.x * result.pushVector.x +
          result.pushVector.z * result.pushVector.z
        );

        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          deepestCollision = result;
        }
      }
    }

    return deepestCollision;
  }

  /**
   * Resolve position to be outside all walls
   * Applies iterative push to handle corner cases
   */
  resolvePosition(position: Point2D, radius: number, velocity: Point2D, maxIterations: number = 3): {
    position: Point2D;
    velocity: Point2D;
    hitWall: boolean;
  } {
    let currentPos = { ...position };
    let currentVel = { ...velocity };
    let hitWall = false;

    for (let i = 0; i < maxIterations; i++) {
      const collision = this.checkCollision(currentPos, radius, currentVel);

      if (!collision.hit) {
        break;
      }

      hitWall = true;

      // Apply push vector to move out of wall
      if (collision.pushVector) {
        currentPos.x += collision.pushVector.x;
        currentPos.z += collision.pushVector.z;
      }

      // Replace velocity with slide velocity
      if (collision.slideVector) {
        currentVel = collision.slideVector;
      }
    }

    return { position: currentPos, velocity: currentVel, hitWall };
  }

  /**
   * Clear all walls
   */
  clear(): void {
    this.walls.clear();
  }

  /**
   * Get wall count (for debugging)
   */
  get count(): number {
    return this.walls.size;
  }
}
