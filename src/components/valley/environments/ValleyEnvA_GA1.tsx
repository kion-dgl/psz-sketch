import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useEffect } from 'react';
import * as THREE from 'three';

// Texture fix settings
const TEXTURE_FIXES: Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }> = {
  "m_3_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_6_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_7_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_8_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_9_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
  "m_12_diffuse": { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 1.81 },
};

export default function ValleyEnvA_GA1() {
  const { scene } = useGLTF('/valley_a/s01a_ga1/lndmd/s01a_ga1_m.glb');

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

// Debug ground plane at Y=0 for testing collision
export function DebugGroundPlane() {
  return (
    <RigidBody type="fixed" position={[0, 0, 0]} collisionGroups={0x00030003} userData={{ type: 'debug-ground' }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="orange" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  );
}

useGLTF.preload('/valley_a/s01a_ga1/lndmd/s01a_ga1_m.glb');
