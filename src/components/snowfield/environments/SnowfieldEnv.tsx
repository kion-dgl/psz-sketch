import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../../collision';

// Texture fix settings - keyed by texture filename with instance number (e.g., "s03_1_lamp1.png#1")
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  "s03_1_lamp1.png#1": {
    "repeatX": 2,
    "repeatY": 1,
    "offsetX": 0.6,
    "offsetY": 0.6
  },
  "s03_0_tile1.png#1": {
    "repeatX": 2,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_1_snow2.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_0_view1.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_0_yuka1.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_0_mizu1.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_1_lamp1.png#2": {
    "repeatX": 2,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_1_etc2.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_1_tree1.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "s03_0_yuka2.png#1": {
    "repeatX": 1,
    "repeatY": 1,
    "offsetX": 0,
    "offsetY": 0
  }
};

// Helper to get texture filename
function getTextureFilename(texture: THREE.Texture): string {
  if (texture.name) {
    const parts = texture.name.split('/');
    return parts[parts.length - 1];
  }
  const image = texture.image as { src?: string } | null;
  if (image && image.src) {
    const parts = image.src.split('/');
    return parts[parts.length - 1];
  }
  return 'unknown';
}

interface SnowfieldEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

// Get snowfield directory based on mapId prefix (s03a_* -> snowfield_a, s03b_* -> snowfield_b, etc.)
function getSnowfieldDir(mapId: string): string {
  const match = mapId.match(/^s03([a-z])_/);
  if (match) {
    return `stages/snowfield_${match[1]}`;
  }
  return 'stages/snowfield_a'; // fallback
}

export function SnowfieldFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const { setFloorMesh } = useCollision();
  const meshRef = useRef<THREE.Mesh>(null);
  const snowfieldDir = getSnowfieldDir(mapId);
  const glbPath = `/${snowfieldDir}/${mapId}/lndmd/${mapId}_m.glb`;
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
      const unregister = setFloorMesh(`snowfield-floor-${mapId}`, meshRef.current);
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
          <meshBasicMaterial color="cyan" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export default function SnowfieldEnv({ mapId, showFloorCollision = false }: SnowfieldEnvProps) {
  const snowfieldDir = getSnowfieldDir(mapId);
  const glbPath = `/${snowfieldDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);

  useEffect(() => {
    if (scene) {
      // Track texture instances by filename
      const textureInstanceCounts: Record<string, number> = {};

      // Apply texture fixes with instance tracking
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

          materials.forEach((mat) => {
            const m = mat as any;
            if (m.map) {
              const filename = getTextureFilename(m.map);
              textureInstanceCounts[filename] = (textureInstanceCounts[filename] || 0) + 1;
              const instanceNum = textureInstanceCounts[filename];
              const key = `${filename}#${instanceNum}`;

              const fixes = TEXTURE_FIXES[key];
              if (fixes) {
                m.map.wrapS = THREE.MirroredRepeatWrapping;
                m.map.wrapT = THREE.MirroredRepeatWrapping;
                m.map.repeat.set(fixes.repeatX, fixes.repeatY);
                m.map.offset.set(fixes.offsetX, fixes.offsetY);
                m.map.needsUpdate = true;
              }
            }
          });
        }
      });
    }
  }, [scene]);

  return (
    <primitive object={scene} />
  );
}
