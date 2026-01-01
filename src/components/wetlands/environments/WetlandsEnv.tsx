import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../../collision';

// Texture fix settings - keyed by texture image filename
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  "s02_0_hasim": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "s02_1_light": { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
};

interface WetlandsEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

// Get wetlands directory based on mapId prefix (s02a_* -> wetlands_a, s02b_* -> wetlands_b, etc.)
function getWetlandsDir(mapId: string): string {
  const match = mapId.match(/^s02([a-z])_/);
  if (match) {
    return `stages/wetlands_${match[1]}`;
  }
  return 'stages/wetlands_a'; // fallback
}

export function WetlandsFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const { setFloorMesh } = useCollision();
  const meshRef = useRef<THREE.Mesh>(null);
  const wetlandsDir = getWetlandsDir(mapId);
  const glbPath = `/${wetlandsDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);

  // Extract floor collision geometry synchronously from the loaded scene
  const floorGeometry = useMemo(() => {
    if (!scene) return null;

    const floorVertices: number[] = [];

    // Extract floor faces (faces where all vertices have y ≈ 0)
    scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        const geometry = mesh.geometry;

        if (geometry.attributes.position) {
          const positions = geometry.attributes.position;
          const index = geometry.index;

          if (index) {
            for (let i = 0; i < index.count; i += 3) {
              const i0 = index.getX(i);
              const i1 = index.getX(i + 1);
              const i2 = index.getX(i + 2);

              const v0 = new THREE.Vector3(
                positions.getX(i0),
                positions.getY(i0),
                positions.getZ(i0)
              );
              const v1 = new THREE.Vector3(
                positions.getX(i1),
                positions.getY(i1),
                positions.getZ(i1)
              );
              const v2 = new THREE.Vector3(
                positions.getX(i2),
                positions.getY(i2),
                positions.getZ(i2)
              );

              // Transform to world space
              v0.applyMatrix4(mesh.matrixWorld);
              v1.applyMatrix4(mesh.matrixWorld);
              v2.applyMatrix4(mesh.matrixWorld);

              // Check if all vertices have y close to 0
              const tolerance = 0.25;
              if (Math.abs(v0.y) < tolerance &&
                  Math.abs(v1.y) < tolerance &&
                  Math.abs(v2.y) < tolerance) {

                // Add vertices at y = 0 for collision
                floorVertices.push(v0.x, 0, v0.z);
                floorVertices.push(v1.x, 0, v1.z);
                floorVertices.push(v2.x, 0, v2.z);
              }
            }
          }
        }
      }
    });

    // Create collision geometry
    if (floorVertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(floorVertices, 3));
      geometry.computeVertexNormals();
      return geometry;
    }
    return null;
  }, [scene]);

  // Register floor mesh with collision system when geometry is ready
  useEffect(() => {
    if (meshRef.current && floorGeometry) {
      const unregister = setFloorMesh(`wetlands-floor-${mapId}`, meshRef.current);
      return unregister;
    }
  }, [floorGeometry, mapId, setFloorMesh]);

  if (!floorGeometry) return null;

  return (
    <>
      {/* Invisible collision mesh */}
      <mesh
        ref={meshRef}
        geometry={floorGeometry}
        visible={false}
      >
        <meshBasicMaterial />
      </mesh>

      {/* Visual representation (optional) */}
      {showVisual && (
        <mesh geometry={floorGeometry} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="green" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

// Helper to check if a material uses a specific texture
function materialUsesTexture(material: THREE.Material, textureNameToFind: string): boolean {
  if (!(material as any).map) return false;

  const texture = (material as any).map as THREE.Texture;
  const textureSrc = ((texture.image as any)?.src || (texture.source?.data as any)?.src || '') as string;
  const textureName = texture.name || '';

  // Extract filename without extension
  let match = textureSrc.match(/\/([^/]+)\.(png|jpg|jpeg)$/i);
  let textureFilename = match ? match[1] : '';

  if (!textureFilename && textureName) {
    const nameMatch = textureName.match(/^(.+)\.(png|jpg|jpeg)$/i);
    textureFilename = nameMatch ? nameMatch[1] : textureName;
  }

  return textureFilename === textureNameToFind;
}

export default function WetlandsEnv({ mapId, showFloorCollision = false }: WetlandsEnvProps) {
  const wetlandsDir = getWetlandsDir(mapId);
  const glbPath = `/${wetlandsDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);
  const [lightPositions, setLightPositions] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (scene) {
      const foundLightPositions: THREE.Vector3[] = [];

      // Apply texture fixes and find light post positions
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const geometry = mesh.geometry;

          // Apply texture fixes to all materials
          materials.forEach((mat) => applyTextureFixes(mat));

          // Find which material indices use the light texture
          const lightMaterialIndices: number[] = [];
          materials.forEach((mat, index) => {
            if (materialUsesTexture(mat, 's02_1_light')) {
              lightMaterialIndices.push(index);
            }
          });

          if (lightMaterialIndices.length === 0) return;

          // Get geometry data
          const positions = geometry.attributes.position;
          const index = geometry.index;
          const groups = geometry.groups;

          if (!positions || !index) return;

          // Collect vertices that belong to faces using the light material
          const lightVertices: THREE.Vector3[] = [];

          if (groups && groups.length > 0) {
            // Multi-material mesh - check groups
            for (const group of groups) {
              if (lightMaterialIndices.includes(group.materialIndex ?? 0)) {
                // This group uses the light material
                for (let i = group.start; i < group.start + group.count; i++) {
                  const vertexIndex = index.getX(i);
                  const vertex = new THREE.Vector3(
                    positions.getX(vertexIndex),
                    positions.getY(vertexIndex),
                    positions.getZ(vertexIndex)
                  );
                  vertex.applyMatrix4(mesh.matrixWorld);
                  lightVertices.push(vertex);
                }
              }
            }
          } else if (lightMaterialIndices.includes(0)) {
            // Single material mesh
            for (let i = 0; i < index.count; i++) {
              const vertexIndex = index.getX(i);
              const vertex = new THREE.Vector3(
                positions.getX(vertexIndex),
                positions.getY(vertexIndex),
                positions.getZ(vertexIndex)
              );
              vertex.applyMatrix4(mesh.matrixWorld);
              lightVertices.push(vertex);
            }
          }

          // Cluster vertices into separate light posts (group by proximity)
          const clusters: THREE.Vector3[][] = [];
          const clusterRadius = 3; // Max distance to be in same cluster

          for (const vertex of lightVertices) {
            let addedToCluster = false;
            for (const cluster of clusters) {
              // Check if vertex is close to any vertex in this cluster
              const isNear = cluster.some(v => v.distanceTo(vertex) < clusterRadius);
              if (isNear) {
                cluster.push(vertex);
                addedToCluster = true;
                break;
              }
            }
            if (!addedToCluster) {
              clusters.push([vertex]);
            }
          }

          // Calculate center of each cluster
          for (const cluster of clusters) {
            const center = new THREE.Vector3();
            for (const v of cluster) {
              center.add(v);
            }
            center.divideScalar(cluster.length);
            foundLightPositions.push(center);
          }
        }
      });

      // Deduplicate nearby positions (within 2 units)
      const uniquePositions: THREE.Vector3[] = [];
      for (const pos of foundLightPositions) {
        const isDuplicate = uniquePositions.some(
          (existing) => existing.distanceTo(pos) < 2
        );
        if (!isDuplicate) {
          uniquePositions.push(pos);
        }
      }

      console.log(`[WetlandsEnv] Found ${uniquePositions.length} light posts`);
      setLightPositions(uniquePositions);
    }
  }, [scene]);

  const applyTextureFixes = (material: THREE.Material) => {
    // Check if material has a diffuse map
    if (!(material as any).map) return;

    const texture = (material as any).map as THREE.Texture;

    // Get texture filename from source or name
    const textureSrc = ((texture.image as any)?.src || (texture.source?.data as any)?.src || '') as string;
    const textureName = texture.name || '';

    // Extract filename without extension (e.g., "s02_0_hasim" from ".../s02_0_hasim.png")
    let match = textureSrc.match(/\/([^/]+)\.(png|jpg|jpeg)$/i);
    let textureFilename = match ? match[1] : '';

    // If no match from src, try the texture name
    if (!textureFilename && textureName) {
      const nameMatch = textureName.match(/^(.+)\.(png|jpg|jpeg)$/i);
      textureFilename = nameMatch ? nameMatch[1] : textureName;
    }

    if (!textureFilename) return;

    const fixes = TEXTURE_FIXES[textureFilename];
    if (!fixes) return;

    // Apply fixes
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(fixes.repeatX, fixes.repeatY);
    texture.offset.set(fixes.offsetX, fixes.offsetY);
    texture.needsUpdate = true;
  };

  return (
    <>
      <primitive object={scene} />
      {/* Light posts - warm light at each lamp position */}
      {lightPositions.map((pos, index) => (
        <group key={index}>
          <pointLight
            position={[pos.x, pos.y - 0.5, pos.z]}
            color="#ffaa55"
            intensity={50}
            distance={30}
            decay={2}
          />
          {/* Debug sphere to visualize light position */}
          <mesh position={[pos.x, pos.y - 0.5, pos.z]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ffaa55" />
          </mesh>
        </group>
      ))}
    </>
  );
}
