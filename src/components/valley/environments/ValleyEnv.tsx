import { useGLTF } from '@react-three/drei';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Texture fix settings
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  "m_3_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_6_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_7_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_8_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_9_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_12_diffuse": { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 1.81 },
};

interface ValleyEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

// Get valley directory based on mapId prefix (s01a_* -> valley_a, s01b_* -> valley_b, etc.)
function getValleyDir(mapId: string): string {
  const match = mapId.match(/^s01([a-z])_/);
  if (match) {
    return `valley_${match[1]}`;
  }
  return 'valley_a'; // fallback
}

export function ValleyFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const [floorGeometry, setFloorGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const valleyDir = getValleyDir(mapId);
    const glbPath = `/${valleyDir}/${mapId}/lndmd/${mapId}_m.glb`;

    loader.load(glbPath, (gltf) => {
      const floorVertices: number[] = [];

      // Extract floor faces (faces where all vertices have y ≈ 0)
      gltf.scene.traverse((object) => {
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
        setFloorGeometry(geometry);
        console.log(`[${mapId}] Created floor collision with ${floorVertices.length / 9} triangles`);
      }
    });
  }, [mapId]);

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

export default function ValleyEnv({ mapId, showFloorCollision = false }: ValleyEnvProps) {
  const valleyDir = getValleyDir(mapId);
  const glbPath = `/${valleyDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);

  useEffect(() => {
    if (scene) {
      // Apply texture fixes
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const material = mesh.material;

          if (Array.isArray(material)) {
            material.forEach((mat) => applyTextureFixes(mat, mesh.name));
          } else {
            applyTextureFixes(material, mesh.name);
          }
        }
      });
    }
  }, [scene]);

  const applyTextureFixes = (material: THREE.Material, meshName: string) => {
    // Extract the common texture key from mesh name (e.g., "s01a_ga1_m_3" -> "m_3_diffuse")
    const match = meshName.match(/_(m_\d+)$/);
    if (!match) return;

    const textureKey = `${match[1]}_diffuse`;
    const fixes = TEXTURE_FIXES[textureKey];

    if (!fixes) return;

    // Apply fixes to the diffuse map
    if ((material as any).map) {
      const texture = (material as any).map as THREE.Texture;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.repeat.set(fixes.repeatX, fixes.repeatY);
      texture.offset.set(fixes.offsetX, fixes.offsetY);
      texture.needsUpdate = true;
    }
  };

  return (
    <primitive object={scene} />
  );
}
