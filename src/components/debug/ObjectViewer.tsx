import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  mesh?: THREE.Object3D;
}

interface AnimationConfig {
  enabled: boolean;
  speed: number;
  startY: number;
  maxY: number;
  meshName: string;
}

const WRAP_OPTIONS: { label: string; value: THREE.Wrapping }[] = [
  { label: 'Repeat', value: THREE.RepeatWrapping },
  { label: 'Clamp', value: THREE.ClampToEdgeWrapping },
  { label: 'Mirror', value: THREE.MirroredRepeatWrapping },
];

function ObjectModel({
  modelPath,
  perTextureControls,
  animationConfig,
  onMeshesFound,
  onTexturesFound
}: {
  modelPath: string;
  perTextureControls: Record<string, TextureControls>;
  animationConfig?: AnimationConfig;
  onMeshesFound: (meshes: MeshInfo[]) => void;
  onTexturesFound: (textures: TextureInfo[]) => void;
}) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const texturesMapRef = useRef<Map<string, THREE.Texture>>(new Map());
  const animatedMeshRef = useRef<THREE.Object3D | null>(null);
  const animationProgressRef = useRef(0);
  const hasLoggedRef = useRef(false);

  // Find meshes and textures (only depends on scene, not animationConfig)
  useEffect(() => {
    const meshes: MeshInfo[] = [];
    const textureInfos: TextureInfo[] = [];
    const seenTextures = new Set<string>();
    const texturesMap = new Map<string, THREE.Texture>();

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        const textureNames: string[] = [];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            if (mat.map) {
              const texName = mat.map.name || `texture_${texturesMap.size + 1}`;
              textureNames.push(texName);

              // Store texture reference by name
              if (!texturesMap.has(texName)) {
                texturesMap.set(texName, mat.map);
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
          mesh: child,
        });
      }
    });

    console.log('All meshes found:', meshes.map(m => m.name));
    texturesMapRef.current = texturesMap;
    onMeshesFound(meshes);
    onTexturesFound(textureInfos);
    hasLoggedRef.current = false;
  }, [clonedScene, onMeshesFound, onTexturesFound]);

  // Find animated mesh separately (depends on animationConfig.meshName)
  useEffect(() => {
    animatedMeshRef.current = null;
    const meshName = animationConfig?.meshName;
    if (!meshName) return;

    clonedScene.traverse((child) => {
      if (child.name === meshName) {
        animatedMeshRef.current = child;
      }
    });

    if (!hasLoggedRef.current) {
      console.log('Looking for mesh:', meshName, 'Found:', !!animatedMeshRef.current);
      if (animatedMeshRef.current) {
        console.log('Animated mesh details:', animatedMeshRef.current);
      }
      hasLoggedRef.current = true;
    }
  }, [clonedScene, animationConfig?.meshName]);

  // Apply per-texture controls
  useEffect(() => {
    texturesMapRef.current.forEach((texture, texName) => {
      const controls = perTextureControls[texName];
      if (controls) {
        texture.wrapS = controls.wrapS;
        texture.wrapT = controls.wrapT;
        texture.offset.set(controls.offsetX, controls.offsetY);
        texture.repeat.set(controls.repeatX, controls.repeatY);
        texture.needsUpdate = true;
      }
    });
  }, [perTextureControls]);

  // Animation loop for the beam mesh position
  const animLoggedRef = useRef(false);
  const animMeshCloneRef = useRef<THREE.Mesh | null>(null);
  const originalMeshRef = useRef<THREE.Object3D | null>(null);

  useFrame((_, delta) => {
    if (!animationConfig?.enabled || !animatedMeshRef.current) {
      // Reset: restore original mesh visibility, remove clone
      if (originalMeshRef.current) {
        originalMeshRef.current.visible = true;
        originalMeshRef.current = null;
      }
      if (animMeshCloneRef.current && animMeshCloneRef.current.parent) {
        animMeshCloneRef.current.parent.remove(animMeshCloneRef.current);
        animMeshCloneRef.current = null;
      }
      animLoggedRef.current = false;
      animationProgressRef.current = 0;
      return;
    }

    const mesh = animatedMeshRef.current as THREE.SkinnedMesh;

    // Create a regular mesh clone on first animation frame
    if (!animLoggedRef.current) {
      console.log('Animation started for mesh:', mesh.name);
      console.log('Is SkinnedMesh:', mesh.isSkinnedMesh);
      console.log('Mesh type:', mesh.type);

      // Create a non-skinned clone for animation
      if (mesh.isSkinnedMesh) {
        // Bake the current pose into a new geometry
        const bakedGeometry = mesh.geometry.clone();

        // Apply bind matrix to get proper world-space geometry
        const positionAttribute = bakedGeometry.attributes.position;
        const skinIndexAttribute = bakedGeometry.attributes.skinIndex;
        const skinWeightAttribute = bakedGeometry.attributes.skinWeight;

        if (positionAttribute && skinIndexAttribute && skinWeightAttribute) {
          const boneMatrices = mesh.skeleton.boneMatrices;
          const bindMatrix = mesh.bindMatrix;
          const bindMatrixInverse = mesh.bindMatrixInverse;

          const vertex = new THREE.Vector3();
          const temp = new THREE.Vector3();
          const skinned = new THREE.Vector3();
          const skinIndices = new THREE.Vector4();
          const skinWeights = new THREE.Vector4();
          const boneMatrix = new THREE.Matrix4();

          for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            skinIndices.fromBufferAttribute(skinIndexAttribute, i);
            skinWeights.fromBufferAttribute(skinWeightAttribute, i);

            // Apply bind matrix
            vertex.applyMatrix4(bindMatrix);

            skinned.set(0, 0, 0);

            for (let j = 0; j < 4; j++) {
              const weight = skinWeights.getComponent(j);
              if (weight !== 0) {
                const boneIndex = skinIndices.getComponent(j);
                boneMatrix.fromArray(boneMatrices, boneIndex * 16);
                temp.copy(vertex).applyMatrix4(boneMatrix).multiplyScalar(weight);
                skinned.add(temp);
              }
            }

            // Apply inverse bind matrix
            skinned.applyMatrix4(bindMatrixInverse);

            positionAttribute.setXYZ(i, skinned.x, skinned.y, skinned.z);
          }
          positionAttribute.needsUpdate = true;
        }

        // Create regular mesh with the baked geometry
        const clonedMaterial = Array.isArray(mesh.material)
          ? mesh.material.map(m => m.clone())
          : mesh.material.clone();
        const regularMesh = new THREE.Mesh(bakedGeometry, clonedMaterial);
        regularMesh.name = mesh.name + '_animated';

        // Copy transform from original
        regularMesh.position.copy(mesh.position);
        regularMesh.rotation.copy(mesh.rotation);
        regularMesh.scale.copy(mesh.scale);

        // Add to parent
        if (mesh.parent) {
          mesh.parent.add(regularMesh);
          console.log('Created animated clone, added to parent:', mesh.parent.name);
        }

        // Hide original, store references
        originalMeshRef.current = mesh;
        mesh.visible = false;
        animMeshCloneRef.current = regularMesh;

        console.log('Clone created at position:', regularMesh.position);
      } else {
        // Not a skinned mesh, just animate directly
        animMeshCloneRef.current = mesh as THREE.Mesh;
        console.log('Using mesh directly (not skinned)');
      }

      animLoggedRef.current = true;
    }

    animationProgressRef.current += delta * animationConfig.speed;
    if (animationProgressRef.current >= 1) {
      animationProgressRef.current = 0;
    }

    // Interpolate Y position from startY to maxY
    const currentY = animationConfig.startY + (animationConfig.maxY - animationConfig.startY) * animationProgressRef.current;

    // Animate the clone
    if (animMeshCloneRef.current) {
      animMeshCloneRef.current.position.y = currentY;
    }
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
    offsetY: 1.0,
  },
};

// Per-texture defaults for specific objects
const TEXTURE_DEFAULTS: Record<string, Record<string, Partial<TextureControls>>> = {
  'o0c_gate.imd': {
    'o0c_0_gatet.png': {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      offsetX: 0.56,
      offsetY: 0.8,
      repeatX: 1,
      repeatY: 2,
    },
  },
  'o0c_gatet.imd': {
    'o0c_0_gatet.png': {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      offsetX: 0.56,
      offsetY: 0.8,
      repeatX: 1,
      repeatY: 2,
    },
  },
  // o0c_point_1 navigation indicator states:
  // offsetX: 0.00 = new area (not visited before)
  // offsetX: 0.12 = unvisited (current default)
  // offsetX: 0.40 = return to visited area
  'o0c_point.imd': {
    'o0c_0_point.png': {
      offsetX: 0.12,
    },
  },
};

function getDefaultsForObject(objectName: string): TextureControls {
  const objectDefaults = OBJECT_DEFAULTS[objectName] || {};
  return { ...DEFAULT_CONTROLS, ...objectDefaults };
}

function getDefaultsForTexture(objectName: string, textureName: string): TextureControls {
  const textureDefaults = TEXTURE_DEFAULTS[objectName]?.[textureName];
  if (textureDefaults) {
    return { ...DEFAULT_CONTROLS, ...textureDefaults };
  }
  return getDefaultsForObject(objectName);
}

const WRAP_LABELS: Record<number, string> = {
  [THREE.RepeatWrapping]: 'Repeat',
  [THREE.ClampToEdgeWrapping]: 'Clamp',
  [THREE.MirroredRepeatWrapping]: 'Mirror',
};

function getStorageKey(areaId: string, objectName: string) {
  return `objectViewer_v2_${areaId}_${objectName}`;
}

function loadFromStorage(areaId: string, objectName: string): Record<string, TextureControls> {
  try {
    const stored = localStorage.getItem(getStorageKey(areaId, objectName));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveToStorage(areaId: string, objectName: string, controls: Record<string, TextureControls>) {
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
const ANIMATED_OBJECTS: Record<string, { meshName: string; speed: number; startY: number; maxY: number }> = {
  'o0c_gate.imd': { meshName: 'o0c_gate_3', speed: 0.8, startY: -0.55, maxY: 0.25 },
  'o0c_gatet.imd': { meshName: 'o0c_gatet_3', speed: 0.8, startY: -0.55, maxY: 0.25 },
};

export default function ObjectViewer({ areaId, objects }: ObjectViewerProps) {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<MeshInfo[]>([]);
  const [meshVisibility, setMeshVisibility] = useState<Record<string, boolean>>({});
  const [texturePreviews, setTexturePreviews] = useState<TextureInfo[]>([]);
  const [perTextureControls, setPerTextureControls] = useState<Record<string, TextureControls>>({});
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [animationStartY, setAnimationStartY] = useState(0);
  const [animationMaxY, setAnimationMaxY] = useState(1.0);

  const toggleMeshVisibility = (meshName: string) => {
    const mesh = meshes.find(m => m.name === meshName)?.mesh;
    if (mesh) {
      const newVisible = !mesh.visible;
      mesh.visible = newVisible;
      setMeshVisibility(prev => ({ ...prev, [meshName]: newVisible }));
    }
  };

  const hasAnimation = selectedObject ? !!ANIMATED_OBJECTS[selectedObject] : false;
  const animationMeshName = selectedObject && hasAnimation ? ANIMATED_OBJECTS[selectedObject].meshName : null;

  const animationConfig: AnimationConfig | undefined = useMemo(() => {
    if (!hasAnimation || !selectedObject || !animationMeshName) return undefined;
    return {
      enabled: animationEnabled,
      speed: animationSpeed,
      startY: animationStartY,
      maxY: animationMaxY,
      meshName: animationMeshName,
    };
  }, [hasAnimation, selectedObject, animationMeshName, animationEnabled, animationSpeed, animationStartY, animationMaxY]);

  // Get current texture controls (for selected texture or defaults)
  const currentTextureControls = useMemo(() => {
    if (!selectedTexture) return { ...DEFAULT_CONTROLS };
    return perTextureControls[selectedTexture] || { ...DEFAULT_CONTROLS };
  }, [selectedTexture, perTextureControls]);

  // Update controls for the selected texture
  const updateTextureControl = useCallback((updates: Partial<TextureControls>) => {
    if (!selectedTexture) return;
    setPerTextureControls(prev => ({
      ...prev,
      [selectedTexture]: { ...(prev[selectedTexture] || DEFAULT_CONTROLS), ...updates }
    }));
  }, [selectedTexture]);

  // Load saved config when object changes
  useEffect(() => {
    if (selectedObject) {
      const saved = loadFromStorage(areaId, selectedObject);
      setPerTextureControls(saved);
      // Reset animation state when switching objects
      setAnimationEnabled(false);
      // Load animation defaults if this object has animation support
      const animDefaults = ANIMATED_OBJECTS[selectedObject];
      if (animDefaults) {
        setAnimationSpeed(animDefaults.speed);
        setAnimationStartY(animDefaults.startY);
        setAnimationMaxY(animDefaults.maxY);
      } else {
        setAnimationSpeed(0.5);
        setAnimationStartY(0);
        setAnimationMaxY(1.0);
      }
      // Reset mesh visibility
      setMeshVisibility({});
      // Reset selected texture
      setSelectedTexture(null);
    }
  }, [areaId, selectedObject]);

  // Initialize per-texture controls with defaults when textures are found
  useEffect(() => {
    if (texturePreviews.length > 0 && selectedObject) {
      setPerTextureControls(prev => {
        const updated = { ...prev };
        texturePreviews.forEach(tex => {
          if (!updated[tex.name]) {
            // Use per-texture defaults if available, otherwise object defaults
            updated[tex.name] = getDefaultsForTexture(selectedObject, tex.name);
          }
        });
        return updated;
      });
      // Auto-select first texture if none selected
      if (!selectedTexture && texturePreviews.length > 0) {
        setSelectedTexture(texturePreviews[0].name);
      }
    }
  }, [texturePreviews, selectedObject, selectedTexture]);

  // Save to localStorage when controls change
  useEffect(() => {
    if (selectedObject && Object.keys(perTextureControls).length > 0) {
      saveToStorage(areaId, selectedObject, perTextureControls);
    }
  }, [areaId, selectedObject, perTextureControls]);

  const modelPath = selectedObject
    ? `/objects/${areaId}/${selectedObject}/${selectedObject.replace('.imd', '.glb')}`
    : null;

  const handleMeshesFound = useCallback((newMeshes: MeshInfo[]) => {
    setMeshes(newMeshes);
  }, []);

  const handleTexturesFound = useCallback((newTextures: TextureInfo[]) => {
    setTexturePreviews(newTextures);
  }, []);

  const handleReset = () => {
    if (selectedObject && selectedTexture) {
      // Reset just the selected texture to defaults
      setPerTextureControls(prev => ({
        ...prev,
        [selectedTexture]: getDefaultsForTexture(selectedObject, selectedTexture)
      }));
    }
  };

  const handleResetAll = () => {
    if (selectedObject) {
      clearFromStorage(areaId, selectedObject);
      const resetControls: Record<string, TextureControls> = {};
      texturePreviews.forEach(tex => {
        resetControls[tex.name] = getDefaultsForTexture(selectedObject, tex.name);
      });
      setPerTextureControls(resetControls);
    }
  };

  const handleExport = () => {
    const textureConfigs: Record<string, unknown> = {};
    Object.entries(perTextureControls).forEach(([texName, controls]) => {
      textureConfigs[texName] = {
        wrapS: WRAP_LABELS[controls.wrapS] || controls.wrapS,
        wrapT: WRAP_LABELS[controls.wrapT] || controls.wrapT,
        offsetX: controls.offsetX,
        offsetY: controls.offsetY,
        repeatX: controls.repeatX,
        repeatY: controls.repeatY,
      };
    });

    const exportData: Record<string, unknown> = {
      areaId,
      object: selectedObject,
      textures: textureConfigs,
    };
    if (hasAnimation) {
      exportData.animation = {
        meshName: ANIMATED_OBJECTS[selectedObject!].meshName,
        speed: animationSpeed,
        startY: animationStartY,
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
                perTextureControls={perTextureControls}
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
            {meshes.map((mesh, i) => {
              const isVisible = meshVisibility[mesh.name] !== false;
              return (
                <div key={i} style={{
                  background: isVisible ? '#2a2a4a' : '#1a1a2a',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  opacity: isVisible ? 1 : 0.5,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#aaccff' }}>{mesh.name}</div>
                    <button
                      onClick={() => toggleMeshVisibility(mesh.name)}
                      style={{
                        padding: '2px 8px',
                        background: isVisible ? '#3a6a3a' : '#6a3a3a',
                        border: 'none',
                        borderRadius: '3px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      {isVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div style={{ color: '#888' }}>{mesh.geometry}</div>
                  <div style={{ color: '#888' }}>{mesh.material}</div>
                  {mesh.textures.length > 0 && (
                    <div style={{ color: '#88ff88', marginTop: '4px' }}>
                      Textures: {mesh.textures.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#666', marginBottom: '1.5rem' }}>No object selected</div>
        )}

        <h3 style={{ color: '#88aaff' }}>Textures (click to edit)</h3>
        {texturePreviews.length > 0 ? (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {texturePreviews.map((tex, i) => {
              const isSelected = selectedTexture === tex.name;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedTexture(tex.name)}
                  style={{
                    background: isSelected ? '#4a4a8a' : '#2a2a4a',
                    padding: '8px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #88aaff' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
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
                  <div style={{ fontSize: '9px', color: isSelected ? '#fff' : '#888', marginTop: '4px', wordBreak: 'break-all' }}>
                    {tex.name}
                  </div>
                  <div style={{ fontSize: '8px', color: '#666' }}>
                    {tex.width}x{tex.height}
                  </div>
                </div>
              );
            })}
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  Start Y: {animationStartY.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.05"
                  value={animationStartY}
                  onChange={(e) => setAnimationStartY(parseFloat(e.target.value))}
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
                  min="-2"
                  max="5"
                  step="0.05"
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

        <h3 style={{ color: '#88aaff' }}>
          Texture Controls
          {selectedTexture && (
            <span style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>
              ({selectedTexture})
            </span>
          )}
        </h3>

        {selectedTexture ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Wrap S</label>
              <select
                value={currentTextureControls.wrapS}
                onChange={(e) => updateTextureControl({ wrapS: Number(e.target.value) as THREE.Wrapping })}
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
                value={currentTextureControls.wrapT}
                onChange={(e) => updateTextureControl({ wrapT: Number(e.target.value) as THREE.Wrapping })}
                style={{ width: '100%', padding: '6px', background: '#2a2a4a', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
              >
                {WRAP_OPTIONS.map(opt => (
                  <option key={opt.label} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Offset X: {currentTextureControls.offsetX.toFixed(2)}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={currentTextureControls.offsetX}
                onChange={(e) => updateTextureControl({ offsetX: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Offset Y: {currentTextureControls.offsetY.toFixed(2)}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={currentTextureControls.offsetY}
                onChange={(e) => updateTextureControl({ offsetY: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Repeat X: {currentTextureControls.repeatX.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={currentTextureControls.repeatX}
                onChange={(e) => updateTextureControl({ repeatX: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Repeat Y: {currentTextureControls.repeatY.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={currentTextureControls.repeatY}
                onChange={(e) => updateTextureControl({ repeatY: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
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
                  fontSize: '11px',
                }}
              >
                Reset This
              </button>
              <button
                onClick={handleResetAll}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#6a3a3a',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Reset All
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: '#666', fontSize: '12px', marginBottom: '1rem' }}>
            Select a texture above to edit its settings
          </div>
        )}

        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={handleExport}
            disabled={!selectedObject}
            style={{
              width: '100%',
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
