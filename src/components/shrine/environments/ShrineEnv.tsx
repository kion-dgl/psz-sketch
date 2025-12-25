import { useGLTF } from '@react-three/drei';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Texture fix settings - keyed by texture image filename (without .png extension)
// Generated from texture debug tool for Dark Shrine walkable areas
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  // A-area textures
  's07_1_amyaku': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_ayukas': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_asaku1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_awall': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_ayuka2': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's07_0_adoor': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's07_0_ayuka3': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_awall2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_acell': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_apole': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_alined': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_2_aaka': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_acelld': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Main area textures
  's07_1_light3': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_earth': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_spces': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_saku1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_arch': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_edan': { repeatX: 1.9, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_table': { repeatX: 2, repeatY: 1.6, offsetX: 0, offsetY: -0.6 },
  's07_0_door': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0.4 },
  's07_0_yuka3': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_blight': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_myaku': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_pole': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_wall': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_yuka2': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's07_0_cell': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_line2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_lined': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_2_aka': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_yukas': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_kaidan': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_wall2': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_btable': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: -1 },
  's07_2_kemuri': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  // Z-area textures
  's07_0_zjime': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 0 },
  's07_0_zline': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_2_zkemu1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zhaikei': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zjime3': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_ztou01': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_code1': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_zmyaku': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_zdoore': { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zyuka2': { repeatX: 2, repeatY: 2, offsetX: 0, offsetY: 1 },
  's07_0_zyuka': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zsky': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zsky3': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zhikari': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_0_zwall': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_1_ztou': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
  's07_2_zmoya3': { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 },
};

interface ShrineEnvProps {
  mapId: string;
  showFloorCollision?: boolean;
}

function getShrineDir(mapId: string): string {
  const match = mapId.match(/^s07([a-z])_/);
  if (match) {
    return `stages/shrine_${match[1]}`;
  }
  return 'stages/shrine_a';
}

export function ShrineFloorCollision({ mapId, showVisual = false }: { mapId: string; showVisual?: boolean }) {
  const shrineDir = getShrineDir(mapId);
  const glbPath = `/${shrineDir}/${mapId}/lndmd/${mapId}_m.glb`;
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
          <meshBasicMaterial color="purple" wireframe={false} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

export default function ShrineEnv({ mapId }: ShrineEnvProps) {
  const shrineDir = getShrineDir(mapId);
  const glbPath = `/${shrineDir}/${mapId}/lndmd/${mapId}_m.glb`;
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
