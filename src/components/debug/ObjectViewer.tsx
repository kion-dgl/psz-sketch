import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

interface TextureControls {
  wrapS: THREE.Wrapping;
  wrapT: THREE.Wrapping;
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
}

interface TextureInfo {
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

interface MeshInfo {
  name: string;
  geometry: string;
  material: string;
  textures: string[];
}

interface AnimationConfig {
  enabled: boolean;
  speed: number;
  maxY: number;
  meshName: string;
  textureName: string;
}

const WRAP_OPTIONS: { label: string; value: THREE.Wrapping }[] = [
  { label: 'Repeat', value: THREE.RepeatWrapping },
  { label: 'Clamp', value: THREE.ClampToEdgeWrapping },
  { label: 'Mirror', value: THREE.MirroredRepeatWrapping },
];

function ObjectModel({
  modelPath,
  textureControls,
  animationConfig,
  onMeshesFound,
  onTexturesFound
}: {
  modelPath: string;
  textureControls: TextureControls;
  animationConfig?: AnimationConfig;
  onMeshesFound: (meshes: MeshInfo[]) => void;
  onTexturesFound: (textures: TextureInfo[]) => void;
}) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const texturesRef = useRef<THREE.Texture[]>([]);
  const animatedTextureRef = useRef<THREE.Texture | null>(null);
  const animationOffsetRef = useRef(0);

  useEffect(() => {
    const meshes: MeshInfo[] = [];
    const textures: THREE.Texture[] = [];
    const textureInfos: TextureInfo[] = [];
    const seenTextures = new Set<string>();
    animatedTextureRef.current = null;

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        const textureNames: string[] = [];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            if (mat.map) {
              textures.push(mat.map);
              const texName = mat.map.name || `texture_${textures.length}`;
              textureNames.push(texName);

              // Check if this is the animated texture
              if (animationConfig && child.name === animationConfig.meshName) {
                animatedTextureRef.current = mat.map;
              }

              // Extract texture preview (avoid duplicates)
              if (!seenTextures.has(texName)) {
                seenTextures.add(texName);
                const image = mat.map.image;
                if (image) {
                  try {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width || 64;
                    canvas.height = image.height || 64;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(image, 0, 0);
                      textureInfos.push({
                        name: texName,
                        dataUrl: canvas.toDataURL(),
                        width: canvas.width,
                        height: canvas.height,
                      });
                    }
                  } catch {
                    // Cross-origin or other error, skip preview
                  }
                }
              }
            }
          }
        });

        meshes.push({
          name: child.name || 'unnamed',
          geometry: `${child.geometry.attributes.position?.count || 0} vertices`,
          material: materials.map(m => m.type).join(', '),
          textures: textureNames,
        });
      }
    });

    texturesRef.current = textures;
    onMeshesFound(meshes);
    onTexturesFound(textureInfos);
  }, [clonedScene, onMeshesFound, onTexturesFound, animationConfig]);

  useEffect(() => {
    texturesRef.current.forEach((texture) => {
      // Skip animated texture - it manages its own offset
      if (animationConfig?.enabled && texture === animatedTextureRef.current) {
        texture.wrapS = textureControls.wrapS;
        texture.wrapT = textureControls.wrapT;
        texture.repeat.set(textureControls.repeatX, textureControls.repeatY);
        texture.needsUpdate = true;
        return;
      }
      texture.wrapS = textureControls.wrapS;
      texture.wrapT = textureControls.wrapT;
      texture.offset.set(textureControls.offsetX, textureControls.offsetY);
      texture.repeat.set(textureControls.repeatX, textureControls.repeatY);
      texture.needsUpdate = true;
    });
  }, [textureControls, animationConfig]);

  // Animation loop for the beam texture
  useFrame((_, delta) => {
    if (!animationConfig?.enabled || !animatedTextureRef.current) return;

    animationOffsetRef.current += delta * animationConfig.speed;
    if (animationOffsetRef.current >= animationConfig.maxY) {
      animationOffsetRef.current = 0;
    }

    animatedTextureRef.current.offset.setY(animationOffsetRef.current);
  });

  return <primitive object={clonedScene} />;
}

interface ObjectViewerProps {
  areaId: string;
  objects: string[];
}

const DEFAULT_CONTROLS: TextureControls = {
  wrapS: THREE.RepeatWrapping,
  wrapT: THREE.RepeatWrapping,
  offsetX: 0,
  offsetY: 0,
  repeatX: 1,
  repeatY: 1,
};

// Object-specific default configs (applied across all areas)
const OBJECT_DEFAULTS: Record<string, Partial<TextureControls>> = {
  'o01_cont.imd': {
    wrapS: THREE.MirroredRepeatWrapping,
    wrapT: THREE.MirroredRepeatWrapping,
    repeatX: 2,
    repeatY: 2,
  },
  'o0c_bombcont.imd': {
    wrapS: THREE.MirroredRepeatWrapping,
    wrapT: THREE.MirroredRepeatWrapping,
    repeatX: 2,
    repeatY: 2,
  },
  'o0c_recont.imd': {
    wrapS: THREE.MirroredRepeatWrapping,
    wrapT: THREE.MirroredRepeatWrapping,
    repeatX: 2,
    repeatY: 2,
  },
};

function getDefaultsForObject(objectName: string): TextureControls {
  const objectDefaults = OBJECT_DEFAULTS[objectName] || {};
  return { ...DEFAULT_CONTROLS, ...objectDefaults };
}

const WRAP_LABELS: Record<number, string> = {
  [THREE.RepeatWrapping]: 'Repeat',
  [THREE.ClampToEdgeWrapping]: 'Clamp',
  [THREE.MirroredRepeatWrapping]: 'Mirror',
};

function getStorageKey(areaId: string, objectName: string) {
  return `objectViewer_${areaId}_${objectName}`;
}

function loadFromStorage(areaId: string, objectName: string): TextureControls {
  try {
    const stored = localStorage.getItem(getStorageKey(areaId, objectName));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return getDefaultsForObject(objectName);
}

function saveToStorage(areaId: string, objectName: string, controls: TextureControls) {
  try {
    localStorage.setItem(getStorageKey(areaId, objectName), JSON.stringify(controls));
  } catch {
    // Ignore storage errors
  }
}

function clearFromStorage(areaId: string, objectName: string) {
  try {
    localStorage.removeItem(getStorageKey(areaId, objectName));
  } catch {
    // Ignore storage errors
  }
}

// Objects with animation support
const ANIMATED_OBJECTS: Record<string, { meshName: string; textureName: string }> = {
  'o0c_gate.imd': { meshName: 'o0c_gate_4', textureName: 'o0c_0_gatet.png' },
  'o0c_gatet.imd': { meshName: 'o0c_gatet_4', textureName: 'o0c_0_gatet.png' },
};

export default function ObjectViewer({ areaId, objects }: ObjectViewerProps) {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<MeshInfo[]>([]);
  const [texturePreviews, setTexturePreviews] = useState<TextureInfo[]>([]);
  const [textureControls, setTextureControls] = useState<TextureControls>({ ...DEFAULT_CONTROLS });
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [animationMaxY, setAnimationMaxY] = useState(1.0);

  const hasAnimation = selectedObject ? !!ANIMATED_OBJECTS[selectedObject] : false;
  const animationConfig: AnimationConfig | undefined = hasAnimation && selectedObject
    ? {
        enabled: animationEnabled,
        speed: animationSpeed,
        maxY: animationMaxY,
        meshName: ANIMATED_OBJECTS[selectedObject].meshName,
        textureName: ANIMATED_OBJECTS[selectedObject].textureName,
      }
    : undefined;

  // Load saved config when object changes
  useEffect(() => {
    if (selectedObject) {
      const saved = loadFromStorage(areaId, selectedObject);
      setTextureControls(saved);
      // Reset animation state when switching objects
      setAnimationEnabled(false);
    }
  }, [areaId, selectedObject]);

  // Save to localStorage when controls change
  useEffect(() => {
    if (selectedObject) {
      saveToStorage(areaId, selectedObject, textureControls);
    }
  }, [areaId, selectedObject, textureControls]);

  const modelPath = selectedObject
    ? `/objects/${areaId}/${selectedObject}/${selectedObject.replace('.imd', '.glb')}`
    : null;

  const handleMeshesFound = (newMeshes: MeshInfo[]) => {
    setMeshes(newMeshes);
  };

  const handleTexturesFound = (newTextures: TextureInfo[]) => {
    setTexturePreviews(newTextures);
  };

  const handleReset = () => {
    if (selectedObject) {
      clearFromStorage(areaId, selectedObject);
      setTextureControls(getDefaultsForObject(selectedObject));
    } else {
      setTextureControls({ ...DEFAULT_CONTROLS });
    }
  };

  const handleExport = () => {
    const exportData: Record<string, unknown> = {
      areaId,
      object: selectedObject,
      controls: {
        wrapS: WRAP_LABELS[textureControls.wrapS] || textureControls.wrapS,
        wrapT: WRAP_LABELS[textureControls.wrapT] || textureControls.wrapT,
        offsetX: textureControls.offsetX,
        offsetY: textureControls.offsetY,
        repeatX: textureControls.repeatX,
        repeatY: textureControls.repeatY,
      },
    };
    if (hasAnimation) {
      exportData.animation = {
        meshName: ANIMATED_OBJECTS[selectedObject!].meshName,
        textureName: ANIMATED_OBJECTS[selectedObject!].textureName,
        speed: animationSpeed,
        maxY: animationMaxY,
      };
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${areaId}_${selectedObject?.replace('.imd', '') || 'config'}_texture.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e', color: 'white', fontFamily: 'monospace' }}>
      {/* Left Panel - Object List */}
      <div style={{ width: '250px', borderRight: '1px solid #333', overflow: 'auto', padding: '1rem' }}>
        <h3 style={{ marginTop: 0, color: '#88aaff' }}>Objects ({objects.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {objects.map((obj) => (
            <button
              key={obj}
              onClick={() => setSelectedObject(obj)}
              style={{
                padding: '8px 12px',
                background: selectedObject === obj ? '#4a4a8a' : '#2a2a4a',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              {obj.replace('.imd', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Center - 3D Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        {selectedObject && modelPath ? (
          <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <Suspense fallback={null}>
              <ObjectModel
                modelPath={modelPath}
                textureControls={textureControls}
                animationConfig={animationConfig}
                onMeshesFound={handleMeshesFound}
                onTexturesFound={handleTexturesFound}
              />
            </Suspense>
            <OrbitControls />
            <Grid infiniteGrid fadeDistance={30} fadeStrength={5} />
          </Canvas>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666'
          }}>
            Select an object from the list
          </div>
        )}

        {selectedObject && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(0,0,0,0.7)',
            padding: '0.5rem 1rem',
            borderRadius: '4px'
          }}>
            {selectedObject}
          </div>
        )}
      </div>

      {/* Right Panel - Controls & Info */}
      <div style={{ width: '300px', borderLeft: '1px solid #333', overflow: 'auto', padding: '1rem' }}>
        <h3 style={{ marginTop: 0, color: '#88aaff' }}>Mesh Parts</h3>
        {meshes.length > 0 ? (
          <div style={{ marginBottom: '1.5rem' }}>
            {meshes.map((mesh, i) => (
              <div key={i} style={{
                background: '#2a2a4a',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '8px',
                fontSize: '11px'
              }}>
                <div style={{ fontWeight: 'bold', color: '#aaccff' }}>{mesh.name}</div>
                <div style={{ color: '#888' }}>{mesh.geometry}</div>
                <div style={{ color: '#888' }}>{mesh.material}</div>
                {mesh.textures.length > 0 && (
                  <div style={{ color: '#88ff88', marginTop: '4px' }}>
                    Textures: {mesh.textures.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', marginBottom: '1.5rem' }}>No object selected</div>
        )}

        <h3 style={{ color: '#88aaff' }}>Texture Previews</h3>
        {texturePreviews.length > 0 ? (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {texturePreviews.map((tex, i) => (
              <div key={i} style={{
                background: '#2a2a4a',
                padding: '8px',
                borderRadius: '4px',
                textAlign: 'center',
              }}>
                <img
                  src={tex.dataUrl}
                  alt={tex.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    background: '#111',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ fontSize: '9px', color: '#888', marginTop: '4px', wordBreak: 'break-all' }}>
                  {tex.name}
                </div>
                <div style={{ fontSize: '8px', color: '#666' }}>
                  {tex.width}x{tex.height}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', marginBottom: '1.5rem', fontSize: '12px' }}>No textures found</div>
        )}

        {hasAnimation && (
          <>
            <h3 style={{ color: '#ffaa88' }}>Animation Controls</h3>
            <div style={{
              background: '#3a2a2a',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              border: '1px solid #5a3a3a'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={animationEnabled}
                    onChange={(e) => setAnimationEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Enable Animation
                </label>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Speed: {animationSpeed.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                  disabled={!animationEnabled}
                />
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Max Y: {animationMaxY.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={animationMaxY}
                  onChange={(e) => setAnimationMaxY(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                  disabled={!animationEnabled}
                />
              </div>

              <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
                Target: {ANIMATED_OBJECTS[selectedObject!]?.meshName}
              </div>
            </div>
          </>
        )}

        <h3 style={{ color: '#88aaff' }}>Texture Controls</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Wrap S</label>
          <select
            value={textureControls.wrapS}
            onChange={(e) => setTextureControls(prev => ({ ...prev, wrapS: Number(e.target.value) as THREE.Wrapping }))}
            style={{ width: '100%', padding: '6px', background: '#2a2a4a', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
          >
            {WRAP_OPTIONS.map(opt => (
              <option key={opt.label} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Wrap T</label>
          <select
            value={textureControls.wrapT}
            onChange={(e) => setTextureControls(prev => ({ ...prev, wrapT: Number(e.target.value) as THREE.Wrapping }))}
            style={{ width: '100%', padding: '6px', background: '#2a2a4a', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
          >
            {WRAP_OPTIONS.map(opt => (
              <option key={opt.label} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Offset X: {textureControls.offsetX.toFixed(2)}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.01"
            value={textureControls.offsetX}
            onChange={(e) => setTextureControls(prev => ({ ...prev, offsetX: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Offset Y: {textureControls.offsetY.toFixed(2)}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.01"
            value={textureControls.offsetY}
            onChange={(e) => setTextureControls(prev => ({ ...prev, offsetY: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Repeat X: {textureControls.repeatX.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={textureControls.repeatX}
            onChange={(e) => setTextureControls(prev => ({ ...prev, repeatX: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Repeat Y: {textureControls.repeatY.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={textureControls.repeatY}
            onChange={(e) => setTextureControls(prev => ({ ...prev, repeatY: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: '8px',
              background: '#4a4a8a',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedObject}
            style={{
              flex: 1,
              padding: '8px',
              background: selectedObject ? '#3a6a3a' : '#333',
              border: 'none',
              borderRadius: '4px',
              color: selectedObject ? 'white' : '#666',
              cursor: selectedObject ? 'pointer' : 'not-allowed',
            }}
          >
            Export JSON
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <a
            href="/stage/valley"
            style={{ color: '#88aaff', textDecoration: 'none' }}
          >
            ← Back to Valley Hub
          </a>
        </div>
      </div>
    </div>
  );
}
