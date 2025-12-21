import { useEffect, useState, useMemo } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import TexturePanel from './TexturePanel';

interface TextureFixerSceneProps {
  glbPath: string;
  onTextureAdjustmentsChange: (adjustments: Record<string, any>) => void;
}

interface TextureInfo {
  name: string;
  texture: THREE.Texture;
  material: THREE.Material;
}

export default function TextureFixerScene({ glbPath, onTextureAdjustmentsChange }: TextureFixerSceneProps) {
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedTextureIndex, setSelectedTextureIndex] = useState<number>(0);
  const [cleanedScene, setCleanedScene] = useState<THREE.Group | null>(null);
  const [labelData, setLabelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(glbPath, (gltf) => {
      // Create a new group and only add meshes (skip Label objects)
      const scene = new THREE.Group();
      const labels: any[] = [];
      const objectsToRemove: THREE.Object3D[] = [];

      // First pass: identify Label objects
      gltf.scene.traverse((object) => {
        if (object.type === 'Label') {
          console.log('Found Label object:', object.name, object);
          labels.push({
            name: object.name,
            position: object.position.clone(),
            userData: object.userData
          });
          objectsToRemove.push(object);
        }
      });

      // Remove Label objects from the scene
      objectsToRemove.forEach(obj => {
        if (obj.parent) {
          obj.parent.remove(obj);
        }
      });

      setLabelData(labels);
      setCleanedScene(gltf.scene);

      const textureList: TextureInfo[] = [];

      gltf.scene.traverse((object) => {
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

      // Log label data for debugging
      if (labels.length > 0) {
        console.log(`Found ${labels.length} Label objects - these might contain collision data!`, labels);
      }

      setLoading(false);
    });
  }, [glbPath]);

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

  if (loading || !cleanedScene) return null;

  return (
    <>
      <primitive object={cleanedScene} />

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
