import { useGLTF } from '@react-three/drei';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Texture fix settings - keyed by texture image filename (without .png extension)
// Generated from texture debug tool for Arca Plant walkable areas
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  // Main area textures
  's06_0_kaid1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_wall02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zkaid1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_door02': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_wall04': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_kazae1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zyuk01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_yuka02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_wall03': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_gren02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_yuka03': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_pilr01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_yuka01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_lamp01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 1.5 },
  's06_1_door01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_wall01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_kaza01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 1.3 },
  's06_1_hashi1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 1.5 },
  's06_0_yuka00': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_gren01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_spce03': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_spce02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_tree01': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's06_1_symb1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: -0.5 },
  's06_0_bwat01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_clock1': { repeatX: 2.1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_door03': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: -0.5 },
  's06_1_door04': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0.5 },
  's06_0_zdoo01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: -0.5 },
  // B-area textures
  's06_0_bwal06': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bwal04': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bwal07': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_byuk04': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bdoo07': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_zbsak02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_byuk05': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_eyuk01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_byuk01': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 0 },
  's06_0_bdis00': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bdoo02': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bwal02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_byuk00': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bsuid00': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_blin01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_bsak01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_byuk02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bwat00': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bwal05': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bdoo04': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bdoo05': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: -0.5 },
  's06_1_bsak02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_2_btak00': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_byuk03': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_bdoo06': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  // E-area textures
  's06_0_ekaid1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_eido01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_eyuk02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_eyuk04': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_ewal03': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_egait1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Z-area textures
  's06_0_zpipe2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zturo1': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zhass1': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: -1 },
  's06_0_zro0': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zkaga1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_1_zbsak01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zpipe1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's06_0_zhaik1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
};

interface ArcaEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

// Get arca directory based on mapId prefix (s06a_* -> arca_a, s06b_* -> arca_b, etc.)
function getArcaDir(mapId: string): string {
  const match = mapId.match(/^s06([a-z])_/);
  if (match) {
    return `stages/arca_${match[1]}`;
  }
  return 'stages/arca_a'; // fallback
}

export function ArcaFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const arcaDir = getArcaDir(mapId);
  const glbPath = `/${arcaDir}/${mapId}/lndmd/${mapId}_m.glb`;
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
          <meshBasicMaterial color="orange" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export default function ArcaEnv({ mapId, showFloorCollision = false }: ArcaEnvProps) {
  const arcaDir = getArcaDir(mapId);
  const glbPath = `/${arcaDir}/${mapId}/lndmd/${mapId}_m.glb`;
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
