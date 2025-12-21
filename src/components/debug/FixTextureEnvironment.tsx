import { useGLTF } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import TexturePanel from './TexturePanel';

interface FixTextureEnvironmentProps {
  onTextureAdjustmentsChange: (adjustments: Record<string, any>) => void;
}

interface TextureInfo {
  name: string;
  texture: THREE.Texture;
  material: THREE.Material;
}

export default function FixTextureEnvironment({ onTextureAdjustmentsChange }: FixTextureEnvironmentProps) {
  // Use the EXACT same GLB path as the working valley stage
  const { scene } = useGLTF('/valley_a/s01a_ga1/lndmd/s01a_ga1_m.glb');
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedTextureIndex, setSelectedTextureIndex] = useState<number>(0);

  useEffect(() => {
    const textureList: TextureInfo[] = [];

    scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        const material = mesh.material;

        if (Array.isArray(material)) {
          material.forEach((mat, index) => {
            extractTextures(mat, `${mesh.name}_mat${index}`, textureList);
          });
        } else {
          extractTextures(material, mesh.name, textureList);
        }
      }
    });

    setTextures(textureList);
  }, [scene]);

  const extractTextures = (material: THREE.Material, baseName: string, list: TextureInfo[]) => {
    if ((material as any).map) {
      const texture = (material as any).map as THREE.Texture;
      // Set wrapping to mirror
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;

      list.push({
        name: `${baseName}_diffuse`,
        texture,
        material
      });
    }

    if ((material as any).normalMap) {
      const texture = (material as any).normalMap as THREE.Texture;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;

      list.push({
        name: `${baseName}_normal`,
        texture,
        material
      });
    }

    if ((material as any).roughnessMap) {
      const texture = (material as any).roughnessMap as THREE.Texture;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;

      list.push({
        name: `${baseName}_roughness`,
        texture,
        material
      });
    }

    if ((material as any).metalnessMap) {
      const texture = (material as any).metalnessMap as THREE.Texture;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;

      list.push({
        name: `${baseName}_metalness`,
        texture,
        material
      });
    }

    if ((material as any).aoMap) {
      const texture = (material as any).aoMap as THREE.Texture;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;

      list.push({
        name: `${baseName}_ao`,
        texture,
        material
      });
    }
  };

  const handleTextureUpdate = (index: number, adjustments: any) => {
    const textureInfo = textures[index];
    if (!textureInfo) return;

    const { texture } = textureInfo;
    texture.repeat.set(adjustments.repeatX, adjustments.repeatY);
    texture.offset.set(adjustments.offsetX, adjustments.offsetY);
    texture.needsUpdate = true;

    // Update adjustments for export
    const allAdjustments: Record<string, any> = {};
    textures.forEach((t, i) => {
      if (i === index) {
        allAdjustments[t.name] = adjustments;
      } else {
        allAdjustments[t.name] = {
          repeatX: t.texture.repeat.x,
          repeatY: t.texture.repeat.y,
          offsetX: t.texture.offset.x,
          offsetY: t.texture.offset.y
        };
      }
    });

    onTextureAdjustmentsChange(allAdjustments);
  };

  return (
    <>
      {/* Render scene EXACTLY like the valley stage does */}
      <primitive object={scene} />

      {textures.length > 0 && (
        <TexturePanel
          textures={textures}
          selectedIndex={selectedTextureIndex}
          onSelectTexture={setSelectedTextureIndex}
          onUpdate={handleTextureUpdate}
        />
      )}
    </>
  );
}

// Preload EXACTLY like the valley stage does
useGLTF.preload('/valley_a/s01a_ga1/lndmd/s01a_ga1_m.glb');
