import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../../collision';

// Texture fix settings - keyed by texture image filename (without .png extension)
// Generated from texture debug tool for Oblivion City Paru walkable areas
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  's05_0_road1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_road3': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_view1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_tail1b': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_tail2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_1_exit1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_etc1': { repeatX: 2, repeatY: 1.5, offsetX: 0, offsetY: 1.3 },
  's05_1_etc1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_1_reaf2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_wall1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_edge1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_tree2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_1_reaf5': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_field': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_tree1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_wat1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_hasi1': { repeatX: 1, repeatY: 2, offsetX: 0, offsetY: 1 },
  's05_0_kan1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_0_view4b': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's05_1_reaf3': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
};

interface ParuEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

// Get paru directory based on mapId prefix (s05a_* -> paru_a, s05b_* -> paru_b, etc.)
function getParuDir(mapId: string): string {
  const match = mapId.match(/^s05([a-z])_/);
  if (match) {
    return `stages/paru_${match[1]}`;
  }
  return 'stages/paru_a'; // fallback
}

export function ParuFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const { setFloorMesh } = useCollision();
  const meshRef = useRef<THREE.Mesh>(null);
  const paruDir = getParuDir(mapId);
  const glbPath = `/${paruDir}/${mapId}/lndmd/${mapId}_m.glb`;
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

  // Register floor mesh with collision system
  useEffect(() => {
    if (meshRef.current && floorGeometry) {
      const unregister = setFloorMesh(`paru-floor-${mapId}`, meshRef.current);
      return unregister;
    }
  }, [floorGeometry, mapId, setFloorMesh]);

  if (!floorGeometry) return null;

  return (
    <>
      <mesh ref={meshRef} geometry={floorGeometry} visible={false}>
        <meshBasicMaterial />
      </mesh>

      {/* Visual representation (optional) */}
      {showVisual && (
        <mesh geometry={floorGeometry} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="orange" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export default function ParuEnv({ mapId, showFloorCollision = false }: ParuEnvProps) {
  const paruDir = getParuDir(mapId);
  const glbPath = `/${paruDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);

  useEffect(() => {
    if (scene) {
      // Apply texture fixes
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const material = mesh.material;

          if (Array.isArray(material)) {
            material.forEach((mat) => applyTextureFixes(mat));
          } else {
            applyTextureFixes(material);
          }
        }
      });
    }
  }, [scene]);

  const applyTextureFixes = (material: THREE.Material) => {
    // Check if material has a diffuse map
    if (!(material as any).map) return;

    const texture = (material as any).map as THREE.Texture;

    // Get texture filename from source or name
    const textureSrc = ((texture.image as any)?.src || (texture.source?.data as any)?.src || '') as string;
    const textureName = texture.name || '';

    // Extract filename without extension
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
    <primitive object={scene} />
  );
}
