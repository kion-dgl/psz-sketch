import { useGLTF } from '@react-three/drei';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

interface TextureConfig {
  name: string;
  offset: { x: number; y: number };
  repeat: { x: number; y: number };
  wrapS: string;
  wrapT: string;
}

interface StageConfig {
  stage: string;
  textures: TextureConfig[];
}

const getWrappingMode = (mode: string): number => {
  switch (mode) {
    case 'MirroredRepeatWrapping':
      return THREE.MirroredRepeatWrapping;
    case 'RepeatWrapping':
      return THREE.RepeatWrapping;
    case 'ClampToEdgeWrapping':
      return THREE.ClampToEdgeWrapping;
    default:
      return THREE.RepeatWrapping;
  }
};

export default function WarpEnvironment() {
  const { scene } = useGLTF('/city_e/s00e_sa3/lndmd/s00e_sa3_m.glb');
  const [textureConfig, setTextureConfig] = useState<StageConfig | null>(null);

  // Load texture configuration
  useEffect(() => {
    fetch('/city_e/s00e_sa3/lndmd/s00e_sa3_m-texture-config.json')
      .then(response => response.json())
      .then(config => setTextureConfig(config))
      .catch(error => console.error('Failed to load texture config:', error));
  }, []);

  useEffect(() => {
    // Traverse the scene and enable shadows + disable physics
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Aggressively disable Rapier auto-collision generation
        child.userData.collider = false;
      }
    });
  }, [scene]);

  // Apply texture configuration
  useEffect(() => {
    if (!textureConfig) return;

    // Create a map of texture configs by name for quick lookup
    const configMap = new Map<string, TextureConfig>();
    textureConfig.textures.forEach(config => {
      configMap.set(config.name, config);
    });

    // Apply configurations to textures
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        materials.forEach((material: any) => {
          if (material.map) {
            const textureName = material.map.name;
            const config = configMap.get(textureName);

            if (config) {
              material.map.offset.set(config.offset.x, config.offset.y);
              material.map.repeat.set(config.repeat.x, config.repeat.y);
              material.map.wrapS = getWrappingMode(config.wrapS);
              material.map.wrapT = getWrappingMode(config.wrapT);
              material.map.needsUpdate = true;
            }
          }
        });
      }
    });
  }, [scene, textureConfig]);

  return (
    <>
      {/* Warp environment model - visible but no collision */}
      <primitive object={scene} position={[0, 0, 0]} />
    </>
  );
}

// Separate ground plane component that goes inside Physics
export function WarpGroundPlane() {
  const [collisionHull, setCollisionHull] = useState<any>(null);

  useEffect(() => {
    fetch('/city_e/s00e_sa3/lndmd/s00e_sa3_m-collision-hull.json')
      .then(response => response.json())
      .then(data => setCollisionHull(data))
      .catch(error => console.error('Failed to load collision hull:', error));
  }, []);

  const geometry = useMemo(() => {
    if (!collisionHull) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(collisionHull.vertices), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(collisionHull.indices), 1));
    geo.computeVertexNormals();
    return geo;
  }, [collisionHull]);

  if (!collisionHull || !geometry) {
    return null;
  }

  return (
    <RigidBody type="fixed" position={[0, 0, 0]} collisionGroups={0x00030003} userData={{ type: 'ground' }}>
      {/* Trimesh collider using the collision hull data */}
      <TrimeshCollider
        args={[
          new Float32Array(collisionHull.vertices),
          new Uint32Array(collisionHull.indices)
        ]}
      />
      {/* Visible mesh for debugging */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#00ff00" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  );
}

// Preload the model
useGLTF.preload('/city_e/s00e_sa3/lndmd/s00e_sa3_m.glb');
