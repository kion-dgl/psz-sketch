import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import TexturePanel from '../debug/TexturePanel';

interface TextureInfo {
  name: string;
  texture: THREE.Texture;
  material: THREE.Material;
}

function ValleyDebugScene({ selectedMap, textureSettings, onTextureAdjustmentsChange }: { selectedMap: string; textureSettings: Record<string, any>; onTextureAdjustmentsChange: (adjustments: Record<string, any>) => void }) {
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedTextureIndex, setSelectedTextureIndex] = useState<number>(0);
  const [cleanedScene, setCleanedScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTextures([]);
    setCleanedScene(null);

    const loader = new GLTFLoader();
    const glbPath = `/valley_a/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
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

      // Log label data for debugging
      if (labels.length > 0) {
        console.log(`Found ${labels.length} Label objects - these might contain collision data!`, labels);
      }

      const textureList: TextureInfo[] = [];

      // Extract textures from the cleaned scene
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
      setCleanedScene(gltf.scene);
      setLoading(false);
    });
  }, [selectedMap]);

  // Helper to extract common texture key (removes map-specific prefix)
  const getTextureKey = (fullName: string) => {
    // Extract the part starting from "_m_" onward (e.g., "s01a_ga1_m_3_diffuse" -> "m_3_diffuse")
    // This matches the mesh number and texture type, which should be consistent across maps
    const match = fullName.match(/_(m_\d+_\w+)$/);
    return match ? match[1] : fullName;
  };

  const extractTextures = (material: THREE.Material, baseName: string, list: TextureInfo[]) => {
    if ((material as any).map) {
      const texture = (material as any).map as THREE.Texture;
      const textureName = `${baseName}_diffuse`;
      const textureKey = getTextureKey(textureName);

      // Set wrapping to mirror
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

      // Apply saved settings if they exist
      if (textureSettings[textureKey]) {
        const settings = textureSettings[textureKey];
        texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
        texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
      }

      texture.needsUpdate = true;

      list.push({
        name: textureName,
        texture,
        material
      });
    }

    if ((material as any).normalMap) {
      const texture = (material as any).normalMap as THREE.Texture;
      const textureName = `${baseName}_normal`;
      const textureKey = getTextureKey(textureName);

      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

      // Apply saved settings if they exist
      if (textureSettings[textureKey]) {
        const settings = textureSettings[textureKey];
        texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
        texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
      }

      texture.needsUpdate = true;

      list.push({
        name: textureName,
        texture,
        material
      });
    }

    if ((material as any).roughnessMap) {
      const texture = (material as any).roughnessMap as THREE.Texture;
      const textureName = `${baseName}_roughness`;
      const textureKey = getTextureKey(textureName);

      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

      // Apply saved settings if they exist
      if (textureSettings[textureKey]) {
        const settings = textureSettings[textureKey];
        texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
        texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
      }

      texture.needsUpdate = true;

      list.push({
        name: textureName,
        texture,
        material
      });
    }

    if ((material as any).metalnessMap) {
      const texture = (material as any).metalnessMap as THREE.Texture;
      const textureName = `${baseName}_metalness`;
      const textureKey = getTextureKey(textureName);

      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

      // Apply saved settings if they exist
      if (textureSettings[textureKey]) {
        const settings = textureSettings[textureKey];
        texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
        texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
      }

      texture.needsUpdate = true;

      list.push({
        name: textureName,
        texture,
        material
      });
    }

    if ((material as any).aoMap) {
      const texture = (material as any).aoMap as THREE.Texture;
      const textureName = `${baseName}_ao`;
      const textureKey = getTextureKey(textureName);

      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

      // Apply saved settings if they exist
      if (textureSettings[textureKey]) {
        const settings = textureSettings[textureKey];
        texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
        texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
      }

      texture.needsUpdate = true;

      list.push({
        name: textureName,
        texture,
        material
      });
    }
  };

  const handleTextureUpdate = (index: number, adjustments: any) => {
    const textureInfo = textures[index];
    if (!textureInfo) return;

    const { texture, name } = textureInfo;
    texture.repeat.set(adjustments.repeatX, adjustments.repeatY);
    texture.offset.set(adjustments.offsetX, adjustments.offsetY);
    texture.needsUpdate = true;

    // Save this texture's adjustments using the shared key
    const textureKey = getTextureKey(name);
    onTextureAdjustmentsChange(textureKey, adjustments);
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

const AVAILABLE_MAPS = [
  's01a_ga1', 's01a_ib1', 's01a_ib2', 's01a_ic1', 's01a_ic3',
  's01a_lb1', 's01a_lb3', 's01a_lc1', 's01a_lc2', 's01a_na1',
  's01a_nb2', 's01a_nc2', 's01a_sa1', 's01a_tb3', 's01a_tc3',
  's01a_td1', 's01a_td2', 's01a_xb2'
];

export default function ValleyAreaA_GA1_Debug() {
  const [selectedMap, setSelectedMap] = useState('s01a_ga1');
  const [textureAdjustments, setTextureAdjustments] = useState<Record<string, any>>({});

  const handleTextureChange = (textureName: string, adjustments: any) => {
    setTextureAdjustments(prev => ({
      ...prev,
      [textureName]: adjustments
    }));
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(textureAdjustments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'valley_texture_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Gurhacia Valley A-GA1 - Debug Mode</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Use orbit controls to view the model</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Adjust textures with the panel below</div>

        {/* Map Selector */}
        <div style={{ marginTop: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
            Select Map:
          </label>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            style={{
              width: '100%',
              padding: '5px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {AVAILABLE_MAPS.map((map) => (
              <option key={map} value={map}>
                {map}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Back Button */}
      <a
        href="/stage/valley-a-ga1"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '10px 20px',
          background: 'rgba(200, 50, 50, 0.9)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        Back to Game
      </a>

      {/* Export Button */}
      <button
        onClick={handleExportJSON}
        style={{
          position: 'absolute',
          top: '70px',
          right: '10px',
          zIndex: 1000,
          padding: '10px 20px',
          background: 'rgba(50, 200, 50, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Export JSON
      </button>

      {/* 3D Scene */}
      <Canvas shadows>
        <OrbitControls />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow
        />

        <Suspense fallback={null}>
          <ValleyDebugScene
            selectedMap={selectedMap}
            textureSettings={textureAdjustments}
            onTextureAdjustmentsChange={handleTextureChange}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
