import * as THREE from 'three';

/**
 * Floor collision manager using Three.js Raycaster
 * Casts rays downward to find floor height at any XZ position
 */
export class FloorCollisionManager {
  private raycaster: THREE.Raycaster;
  private floorMeshes: Map<string, THREE.Mesh> = new Map();
  private rayOrigin: THREE.Vector3;
  private rayDirection: THREE.Vector3;

  // Cache for floor height lookups (optional optimization)
  private heightCache: Map<string, { height: number; timestamp: number }> = new Map();
  private cacheMaxAge: number = 100; // ms before cache entry expires

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.rayOrigin = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3(0, -1, 0); // Always pointing down
  }

  /**
   * Set a floor mesh for raycasting
   * @param id Unique identifier for this floor mesh
   * @param mesh The Three.js mesh to use for floor detection
   * @returns Unregister function
   */
  setFloorMesh(id: string, mesh: THREE.Mesh): () => void {
    this.floorMeshes.set(id, mesh);
    this.clearCache();

    return () => {
      this.floorMeshes.delete(id);
      this.clearCache();
    };
  }

  /**
   * Remove a floor mesh by ID
   */
  removeFloorMesh(id: string): void {
    this.floorMeshes.delete(id);
    this.clearCache();
  }

  /**
   * Clear all floor meshes
   */
  clearAllFloorMeshes(): void {
    this.floorMeshes.clear();
    this.clearCache();
  }

  /**
   * Get floor height at a given XZ position
   * @param x X coordinate
   * @param z Z coordinate
   * @param rayHeight Height to cast ray from (default 100 units up)
   * @returns Floor Y height, or null if no floor found
   */
  getHeight(x: number, z: number, rayHeight: number = 100): number | null {
    // Check cache first
    const cacheKey = `${x.toFixed(2)},${z.toFixed(2)}`;
    const cached = this.heightCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheMaxAge) {
      return cached.height;
    }

    // No floor meshes registered
    if (this.floorMeshes.size === 0) {
      return null;
    }

    // Set up ray from high above, pointing down
    this.rayOrigin.set(x, rayHeight, z);
    this.raycaster.set(this.rayOrigin, this.rayDirection);

    // Check all floor meshes
    const meshArray = Array.from(this.floorMeshes.values());
    const intersections = this.raycaster.intersectObjects(meshArray, false);

    if (intersections.length > 0) {
      // Return the highest intersection (closest to ray origin when pointing down)
      const height = intersections[0].point.y;

      // Cache the result
      this.heightCache.set(cacheKey, { height, timestamp: now });

      return height;
    }

    return null;
  }

  /**
   * Check if there is floor at a given XZ position
   */
  hasFloor(x: number, z: number): boolean {
    return this.getHeight(x, z) !== null;
  }

  /**
   * Get floor height with a fallback value
   */
  getHeightOrDefault(x: number, z: number, defaultHeight: number = 0): number {
    return this.getHeight(x, z) ?? defaultHeight;
  }

  /**
   * Check if a position is over a hole/void
   * Returns true if no floor is found within maxDropDistance below currentY
   */
  isOverVoid(x: number, y: number, z: number, maxDropDistance: number = 10): boolean {
    // Cast ray from current position
    this.rayOrigin.set(x, y + 1, z); // Start slightly above current position
    this.raycaster.set(this.rayOrigin, this.rayDirection);

    const meshArray = Array.from(this.floorMeshes.values());
    const intersections = this.raycaster.intersectObjects(meshArray, false);

    if (intersections.length === 0) {
      return true; // No floor at all
    }

    // Check if floor is within acceptable drop distance
    const floorY = intersections[0].point.y;
    const drop = y - floorY;

    return drop > maxDropDistance;
  }

  /**
   * Clear the height cache (call when floor geometry changes)
   */
  clearCache(): void {
    this.heightCache.clear();
  }

  /**
   * Get number of registered floor meshes
   */
  get meshCount(): number {
    return this.floorMeshes.size;
  }
}
