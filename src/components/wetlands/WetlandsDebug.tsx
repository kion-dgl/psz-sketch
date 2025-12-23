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

// Get wetlands directory based on mapId prefix
function getWetlandsDir(mapId: string): string {
  const match = mapId.match(/^s02([a-z])_/);
  if (match) {
    return `wetlands_${match[1]}`;
  }
  return 'wetlands_a';
}

function WetlandsDebugScene({ selectedMap, textureSettings, onTextureAdjustmentsChange }: { selectedMap: string; textureSettings: Record<string, any>; onTextureAdjustmentsChange: (key: string, adjustments: any) => void }) {
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedTextureIndex, setSelectedTextureIndex] = useState<number>(0);
  const [cleanedScene, setCleanedScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTextures([]);
    setCleanedScene(null);

    const loader = new GLTFLoader();
    const wetlandsDir = getWetlandsDir(selectedMap);
    const glbPath = `/${wetlandsDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

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
    const match = fullName.match(/_(m_\d+_\w+)$/);
    return match ? match[1] : fullName;
  };

  const extractTextures = (material: THREE.Material, baseName: string, list: TextureInfo[]) => {
    if ((material as any).map) {
      const texture = (material as any).map as THREE.Texture;
      const textureName = `${baseName}_diffuse`;
      const textureKey = getTextureKey(textureName);

      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;

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

const WETLANDS_A_MAPS = [
  's02a_ga1', 's02a_ib1', 's02a_ib2', 's02a_ic1', 's02a_ic3',
  's02a_lb1', 's02a_lb3', 's02a_lc1', 's02a_lc2', 's02a_na1',
  's02a_nb2', 's02a_nc2', 's02a_sa1', 's02a_tb3', 's02a_tc3',
  's02a_td1', 's02a_td2', 's02a_xb2'
];

const WETLANDS_B_MAPS = [
  's02b_ga1', 's02b_ib1', 's02b_ib2', 's02b_ic1', 's02b_ic3',
  's02b_lb1', 's02b_lb3', 's02b_lc1', 's02b_lc2', 's02b_na1',
  's02b_nb2', 's02b_nc2', 's02b_sa1', 's02b_tb3', 's02b_tc3',
  's02b_td1', 's02b_td2', 's02b_xb2'
];

const WETLANDS_E_MAPS = ['s02e_ia1'];
const WETLANDS_Z_MAPS = ['s02z_na1'];

const ALL_MAPS = [...WETLANDS_A_MAPS, ...WETLANDS_B_MAPS, ...WETLANDS_E_MAPS, ...WETLANDS_Z_MAPS];

export default function WetlandsDebug() {
  const [selectedMap, setSelectedMap] = useState('s02a_ga1');
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
    a.download = 'wetlands_texture_config.json';
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
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Ozette Wetlands - Texture Debug</div>
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
            <optgroup label="Wetlands A">
              {WETLANDS_A_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Wetlands B">
              {WETLANDS_B_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Wetlands E">
              {WETLANDS_E_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Wetlands Z">
              {WETLANDS_Z_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Back Button */}
      <a
        href="/stage/wetlands"
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
        Back to Wetlands
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
          <WetlandsDebugScene
            selectedMap={selectedMap}
            textureSettings={textureAdjustments}
            onTextureAdjustmentsChange={handleTextureChange}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
