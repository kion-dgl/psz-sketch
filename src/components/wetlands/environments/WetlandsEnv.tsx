import { useGLTF } from '@react-three/drei';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

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

  if (!floorGeometry) return null;

  return (
    <>
      {/* Physics collision */}
      <RigidBody type="fixed" collisionGroups={0x00030003}>
        <TrimeshCollider args={[
          floorGeometry.attributes.position.array as Float32Array,
          new Uint32Array(Array.from({ length: floorGeometry.attributes.position.count }, (_, i) => i))
        ]} />
      </RigidBody>

      {/* Visual representation (optional) */}
      {showVisual && (
        <mesh geometry={floorGeometry} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="green" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export default function WetlandsEnv({ mapId, showFloorCollision = false }: WetlandsEnvProps) {
  const wetlandsDir = getWetlandsDir(mapId);
  const glbPath = `/${wetlandsDir}/${mapId}/lndmd/${mapId}_m.glb`;
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
    const textureSrc = texture.image?.src || texture.source?.data?.src || '';
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
    <primitive object={scene} />
  );
}
