import { useGLTF } from '@react-three/drei';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Texture fix settings - keyed by texture image filename (without .png extension)
// Generated from texture debug tool for Eternal Tower walkable areas
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  // Shared texture from paru
  's05_0_hasi1': { repeatX: 1, repeatY: 2, offsetX: 0, offsetY: 0 },
  // Sky textures
  's08_0_sky10': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_sky20': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_sky21': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_sky30': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_sky61': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_sky70': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_sky71': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_sky11': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Passage/platform textures
  's08_0_ps03': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's08_0_ps07': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_ps11': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_ps12': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_ps13': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_ps10': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Door textures
  's08_0_dr01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_dr02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Upward section textures
  's08_0_up04': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_up05': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_up09': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_up10': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_up11': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_up02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_up06': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_up08': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_up12': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_2_up07': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  // Downward section textures
  's08_0_dw04': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_dw05': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_dw09': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_dw10': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_dw11': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_dw02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_dw06': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_dw08': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_dw12': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_2_dw07': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  // Entrance textures
  's08_0_en01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_en03': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_en05': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_en02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_en06': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_en09': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_2_en07': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_2_en08': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Room textures
  's08_0_rm01': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm02': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm03': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm04': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm06': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's08_0_rm10': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm11': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm12': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_0_rm13': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_1_rm05': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_2_rm08': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's08_2_rm09': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Ledge textures
  's08_0_le10': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
};

interface TowerEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

function getTowerDir(mapId: string): string {
  const match = mapId.match(/^s08([0-7e])_/);
  if (match) {
    return `stages/tower_${match[1]}`;
  }
  return 'stages/tower_1';
}

export function TowerFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const towerDir = getTowerDir(mapId);
  const glbPath = `/${towerDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);

  const floorGeometry = useMemo(() => {
    if (!scene) return null;
    const floorVertices: number[] = [];

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

              const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0));
              const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1));
              const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2));

              v0.applyMatrix4(mesh.matrixWorld);
              v1.applyMatrix4(mesh.matrixWorld);
              v2.applyMatrix4(mesh.matrixWorld);

              const tolerance = 0.25;
              if (Math.abs(v0.y) < tolerance && Math.abs(v1.y) < tolerance && Math.abs(v2.y) < tolerance) {
                floorVertices.push(v0.x, 0, v0.z);
                floorVertices.push(v1.x, 0, v1.z);
                floorVertices.push(v2.x, 0, v2.z);
              }
            }
          }
        }
      }
    });

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
      <RigidBody type="fixed" collisionGroups={0x00030003}>
        <TrimeshCollider args={[
          floorGeometry.attributes.position.array as Float32Array,
          new Uint32Array(Array.from({ length: floorGeometry.attributes.position.count }, (_, i) => i))
        ]} />
      </RigidBody>
      {showVisual && (
        <mesh geometry={floorGeometry} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="cyan" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export default function TowerEnv({ mapId }: TowerEnvProps) {
  const towerDir = getTowerDir(mapId);
  const glbPath = `/${towerDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);

  useEffect(() => {
    if (scene) {
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
    if (!(material as any).map) return;
    const texture = (material as any).map as THREE.Texture;
    const textureSrc = texture.image?.src || texture.source?.data?.src || '';
    const textureName = texture.name || '';
    let match = textureSrc.match(/\/([^/]+)\.(png|jpg|jpeg)$/i);
    let textureFilename = match ? match[1] : '';
    if (!textureFilename && textureName) {
      const nameMatch = textureName.match(/^(.+)\.(png|jpg|jpeg)$/i);
      textureFilename = nameMatch ? nameMatch[1] : textureName;
    }
    if (!textureFilename) return;
    const fixes = TEXTURE_FIXES[textureFilename];
    if (!fixes) return;
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(fixes.repeatX, fixes.repeatY);
    texture.offset.set(fixes.offsetX, fixes.offsetY);
    texture.needsUpdate = true;
  };

  return <primitive object={scene} />;
}
