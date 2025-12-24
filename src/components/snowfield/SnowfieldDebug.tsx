import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface TextureInfo {
  name: string;        // Display name with instance number (e.g., "s03_1_lamp1.png #1")
  key: string;         // Key for settings (e.g., "s03_1_lamp1.png#1")
  filename: string;    // Base filename (e.g., "s03_1_lamp1.png")
  texture: THREE.Texture;
  material: THREE.Material;
}

// Get snowfield directory based on mapId prefix
function getSnowfieldDir(mapId: string): string {
  const match = mapId.match(/^s03([a-z])_/);
  if (match) {
    return `stages/snowfield_${match[1]}`;
  }
  return 'stages/snowfield_a';
}

// Extract filename from texture
function getTextureFilename(texture: THREE.Texture): string {
  // Try to get filename from texture.name first
  if (texture.name) {
    // Extract just the filename from path if present
    const parts = texture.name.split('/');
    return parts[parts.length - 1];
  }
  // Fallback to image source
  const image = texture.image as { src?: string } | null;
  if (image && image.src) {
    const parts = image.src.split('/');
    return parts[parts.length - 1];
  }
  return 'unknown';
}

function SnowfieldDebugScene({
  selectedMap,
  textureSettings,
  onTexturesLoaded
}: {
  selectedMap: string;
  textureSettings: Record<string, any>;
  onTexturesLoaded: (textures: TextureInfo[]) => void;
}) {
  const [cleanedScene, setCleanedScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCleanedScene(null);

    const loader = new GLTFLoader();
    const snowfieldDir = getSnowfieldDir(selectedMap);
    const glbPath = `/${snowfieldDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      const objectsToRemove: THREE.Object3D[] = [];

      // First pass: identify Label objects
      gltf.scene.traverse((object) => {
        if (object.type === 'Label') {
          objectsToRemove.push(object);
        }
      });

      // Remove Label objects from the scene
      objectsToRemove.forEach(obj => {
        if (obj.parent) {
          obj.parent.remove(obj);
        }
      });

      // Track texture instances by filename
      const textureInstanceCounts: Record<string, number> = {};
      const textureList: TextureInfo[] = [];

      const processTexture = (
        originalTexture: THREE.Texture,
        material: THREE.Material,
        type: 'diffuse' | 'normal',
        assignBack: (tex: THREE.Texture) => void
      ) => {
        const filename = getTextureFilename(originalTexture);

        // Track instance number for this filename
        const instanceKey = `${filename}_${type}`;
        textureInstanceCounts[instanceKey] = (textureInstanceCounts[instanceKey] || 0) + 1;
        const instanceNum = textureInstanceCounts[instanceKey];

        // Clone texture for independent control
        const texture = originalTexture.clone();
        texture.needsUpdate = true;
        assignBack(texture);

        // Create key based on filename and instance
        const key = `${filename}#${instanceNum}`;
        const displayName = `${filename} #${instanceNum}`;

        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;

        // Apply saved settings if available
        if (textureSettings[key]) {
          const settings = textureSettings[key];
          texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
          texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
        }

        texture.needsUpdate = true;

        textureList.push({
          name: displayName,
          key,
          filename,
          texture,
          material
        });
      };

      // Extract textures from the cleaned scene
      gltf.scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

          materials.forEach((mat) => {
            const m = mat as any;

            if (m.map) {
              processTexture(m.map, mat, 'diffuse', (tex) => { m.map = tex; });
            }

            if (m.normalMap) {
              processTexture(m.normalMap, mat, 'normal', (tex) => { m.normalMap = tex; });
            }
          });
        }
      });

      onTexturesLoaded(textureList);
      setCleanedScene(gltf.scene);
      setLoading(false);
    });
  }, [selectedMap]);

  if (loading || !cleanedScene) return null;

  return <primitive object={cleanedScene} />;
}

const SNOWFIELD_A_MAPS = [
  's03a_ga1', 's03a_ib1', 's03a_ib2', 's03a_ic1', 's03a_ic3',
  's03a_lb1', 's03a_lb3', 's03a_lc1', 's03a_lc2', 's03a_na1',
  's03a_nb2', 's03a_nc2', 's03a_sa1', 's03a_tb3', 's03a_tc3',
  's03a_td1', 's03a_td2', 's03a_xb2'
];

const SNOWFIELD_B_MAPS = [
  's03b_ga1', 's03b_ib1', 's03b_ib2', 's03b_ic1', 's03b_ic3',
  's03b_lb1', 's03b_lb3', 's03b_lc1', 's03b_lc2', 's03b_na1',
  's03b_nb2', 's03b_nc2', 's03b_sa1', 's03b_tb3', 's03b_tc3',
  's03b_td1', 's03b_td2', 's03b_xb2'
];

const SNOWFIELD_E_MAPS = ['s03e_ia1'];
const SNOWFIELD_Z_MAPS = ['s03z_na1'];

const ALL_MAPS = [...SNOWFIELD_A_MAPS, ...SNOWFIELD_B_MAPS, ...SNOWFIELD_E_MAPS, ...SNOWFIELD_Z_MAPS];

export default function SnowfieldDebug() {
  const [selectedMap, setSelectedMap] = useState('s03a_ga1');
  const [textureAdjustments, setTextureAdjustments] = useState<Record<string, any>>({});
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedTextureIndex, setSelectedTextureIndex] = useState(0);
  const [repeatX, setRepeatX] = useState(1);
  const [repeatY, setRepeatY] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectedTexture = textures[selectedTextureIndex];

  // Update local state when texture selection changes
  useEffect(() => {
    if (selectedTexture) {
      setRepeatX(selectedTexture.texture.repeat.x);
      setRepeatY(selectedTexture.texture.repeat.y);
      setOffsetX(selectedTexture.texture.offset.x);
      setOffsetY(selectedTexture.texture.offset.y);

      const image = selectedTexture.texture.image as CanvasImageSource | null;
      if (image) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0, 256, 256);
          setPreviewUrl(canvas.toDataURL());
        }
      }
    }
  }, [selectedTexture]);

  // Apply texture changes
  useEffect(() => {
    if (selectedTexture) {
      selectedTexture.texture.repeat.set(repeatX, repeatY);
      selectedTexture.texture.offset.set(offsetX, offsetY);
      selectedTexture.texture.needsUpdate = true;

      setTextureAdjustments(prev => ({
        ...prev,
        [selectedTexture.key]: { repeatX, repeatY, offsetX, offsetY }
      }));
    }
  }, [repeatX, repeatY, offsetX, offsetY, selectedTextureIndex]);

  const handleTexturesLoaded = (loadedTextures: TextureInfo[]) => {
    setTextures(loadedTextures);
    setSelectedTextureIndex(0);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(textureAdjustments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snowfield_texture_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sidebarWidth = 320;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Fixed Sidebar */}
      <div style={{
        width: `${sidebarWidth}px`,
        height: '100vh',
        background: '#1a1a1a',
        color: 'white',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
          Rioh Snowfield - Texture Debug
        </div>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '15px' }}>
          Use orbit controls to view the model
        </div>

        {/* Map Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Select Map:
          </label>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <optgroup label="Snowfield A">
              {SNOWFIELD_A_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Snowfield B">
              {SNOWFIELD_B_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Snowfield E">
              {SNOWFIELD_E_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Snowfield Z">
              {SNOWFIELD_Z_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {textures.length > 0 && (
          <>
            {/* Texture Selector */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Texture ({textures.length} total)
              </label>
              <select
                value={selectedTextureIndex}
                onChange={(e) => setSelectedTextureIndex(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
              >
                {textures.map((t, i) => (
                  <option key={i} value={i}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Texture Preview */}
            {previewUrl && (
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Preview</div>
                <img
                  src={previewUrl}
                  alt="Texture preview"
                  style={{ width: '100%', maxWidth: '200px', border: '2px solid #555', borderRadius: '4px' }}
                />
              </div>
            )}

            {/* Repeat X */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>Repeat X: {repeatX.toFixed(1)}</label>
              <input type="range" min="0.1" max="10" step="0.1" value={repeatX}
                onChange={(e) => setRepeatX(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Repeat Y */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>Repeat Y: {repeatY.toFixed(1)}</label>
              <input type="range" min="0.1" max="10" step="0.1" value={repeatY}
                onChange={(e) => setRepeatY(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Offset X */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>Offset X: {offsetX.toFixed(1)}</label>
              <input type="range" min="-5" max="5" step="0.1" value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Offset Y */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>Offset Y: {offsetY.toFixed(1)}</label>
              <input type="range" min="-5" max="5" step="0.1" value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => { setRepeatX(1); setRepeatY(1); setOffsetX(0); setOffsetY(0); }}
              style={{
                width: '100%', padding: '10px', background: '#c86432',
                color: 'white', border: 'none', borderRadius: '4px',
                fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              Reset to Default
            </button>
          </>
        )}

        {/* Export Button */}
        <button
          onClick={handleExportJSON}
          style={{
            width: '100%', padding: '10px', background: '#32c832',
            color: 'white', border: 'none', borderRadius: '4px',
            fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Export JSON
        </button>

        {/* Back Link */}
        <a
          href="/stage/snowfield"
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            background: '#c83232',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          Back to Snowfield
        </a>
      </div>

      {/* 3D Scene */}
      <div style={{ flex: 1, height: '100vh' }}>
        <Canvas shadows>
          <OrbitControls />

          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={0.8}
            castShadow
          />

          <Suspense fallback={null}>
            <SnowfieldDebugScene
              selectedMap={selectedMap}
              textureSettings={textureAdjustments}
              onTexturesLoaded={handleTexturesLoaded}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
