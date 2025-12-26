import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TextureConfig {
  name: string;
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
}

interface TextureData {
  config: TextureConfig;
  texture: THREE.Texture;
}

function StageModel({ textureConfigs, onTextureUpdate }: {
  textureConfigs: TextureConfig[];
  onTextureUpdate: (configs: TextureConfig[], textureMap: Map<string, THREE.Texture>) => void;
}) {
  const { scene } = useGLTF('/stages/city_e/s00e_sa3/lndmd/s00e_sa3_m.glb');

  useEffect(() => {
    const textures: TextureConfig[] = [];
    const textureMap = new Map<THREE.Texture, string>();
    const texturesByName = new Map<string, THREE.Texture>();
    let textureIndex = 0;

    // Traverse and collect all unique textures
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        materials.forEach((material: any) => {
          if (material.map && !textureMap.has(material.map)) {
            const textureName = material.map.name || `Texture_${textureIndex}`;
            textureMap.set(material.map, textureName);
            texturesByName.set(textureName, material.map);

            // Set wrapS and wrapT to mirrored repeat
            material.map.wrapS = THREE.MirroredRepeatWrapping;
            material.map.wrapT = THREE.MirroredRepeatWrapping;

            textures.push({
              name: textureName,
              offsetX: material.map.offset.x,
              offsetY: material.map.offset.y,
              repeatX: material.map.repeat.x,
              repeatY: material.map.repeat.y,
            });

            textureIndex++;
          }
        });
      }
    });

    if (textures.length > 0 && textureConfigs.length === 0) {
      onTextureUpdate(textures, texturesByName);
    }
  }, [scene]);

  useEffect(() => {
    // Apply texture configurations
    const texturesByName = new Map<string, THREE.Texture>();

    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        materials.forEach((material: any) => {
          if (material.map) {
            const textureName = material.map.name || `Texture_${Array.from(texturesByName.keys()).length}`;
            texturesByName.set(textureName, material.map);
          }
        });
      }
    });

    textureConfigs.forEach(config => {
      const texture = texturesByName.get(config.name);
      if (texture) {
        texture.offset.set(config.offsetX, config.offsetY);
        texture.repeat.set(config.repeatX, config.repeatY);
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.needsUpdate = true;
      }
    });
  }, [textureConfigs, scene]);

  return <primitive object={scene} position={[0, 0, 0]} />;
}

function TexturePreview({ texture }: { texture: THREE.Texture | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!texture || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the image from the texture
    const image = texture.image;
    if (!image) return;

    // Set canvas size to match image aspect ratio
    const maxSize = 256;
    const aspectRatio = image.width / image.height;

    if (aspectRatio > 1) {
      canvas.width = maxSize;
      canvas.height = maxSize / aspectRatio;
    } else {
      canvas.width = maxSize * aspectRatio;
      canvas.height = maxSize;
    }

    // Draw the texture
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }, [texture]);

  if (!texture) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No texture</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 'auto',
        border: '1px solid #444',
        borderRadius: '4px',
        background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 50% / 20px 20px'
      }}
    />
  );
}

export default function StageTextureDebugSa3() {
  const [textureConfigs, setTextureConfigs] = useState<TextureConfig[]>([]);
  const [textures, setTextures] = useState<Map<string, THREE.Texture>>(new Map());
  const [selectedTexture, setSelectedTexture] = useState<number>(0);

  const handleTextureUpdate = (configs: TextureConfig[], textureMap: Map<string, THREE.Texture>) => {
    setTextureConfigs(configs);
    setTextures(textureMap);
  };

  const updateTextureConfig = (index: number, field: keyof Omit<TextureConfig, 'name'>, value: number) => {
    const newConfigs = [...textureConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setTextureConfigs(newConfigs);
  };

  const exportConfig = () => {
    const config = {
      stage: 's00e_sa3_m',
      textures: textureConfigs.map(tc => ({
        name: tc.name,
        offset: { x: tc.offsetX, y: tc.offsetY },
        repeat: { x: tc.repeatX, y: tc.repeatY },
        wrapS: 'MirroredRepeatWrapping',
        wrapT: 'MirroredRepeatWrapping'
      }))
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 's00e_sa3_m-texture-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentConfig = textureConfigs[selectedTexture];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* 3D Viewport */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
          <OrbitControls />
          <gridHelper args={[50, 50]} />
          <Suspense fallback={null}>
            <StageModel textureConfigs={textureConfigs} onTextureUpdate={handleTextureUpdate} />
          </Suspense>
        </Canvas>
      </div>

      {/* Control Panel */}
      <div style={{
        width: '400px',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Stage Texture Debug (SA3)</h1>

        {textureConfigs.length === 0 ? (
          <p>Loading textures...</p>
        ) : (
          <>
            {/* Texture Selector */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Select Texture ({textureConfigs.length} total)
              </label>
              <select
                value={selectedTexture}
                onChange={(e) => setSelectedTexture(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#2a2a2a',
                  color: 'white',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {textureConfigs.map((config, index) => (
                  <option key={index} value={index}>
                    {index + 1}. {config.name}
                  </option>
                ))}
              </select>
            </div>

            {currentConfig && (
              <>
                {/* Texture Preview */}
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Texture Preview
                  </label>
                  <TexturePreview texture={textures.get(currentConfig.name) || null} />
                </div>

                {/* Offset X */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Offset X</span>
                    <span style={{ color: '#4a9eff' }}>{currentConfig.offsetX.toFixed(3)}</span>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.001"
                    value={currentConfig.offsetX}
                    onChange={(e) => updateTextureConfig(selectedTexture, 'offsetX', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={currentConfig.offsetX}
                    onChange={(e) => updateTextureConfig(selectedTexture, 'offsetX', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      marginTop: '5px',
                      padding: '5px',
                      background: '#2a2a2a',
                      color: 'white',
                      border: '1px solid #444',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Offset Y */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Offset Y</span>
                    <span style={{ color: '#4a9eff' }}>{currentConfig.offsetY.toFixed(3)}</span>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.001"
                    value={currentConfig.offsetY}
                    onChange={(e) => updateTextureConfig(selectedTexture, 'offsetY', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={currentConfig.offsetY}
                    onChange={(e) => updateTextureConfig(selectedTexture, 'offsetY', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      marginTop: '5px',
                      padding: '5px',
                      background: '#2a2a2a',
                      color: 'white',
                      border: '1px solid #444',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Repeat X */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Repeat X
                  </label>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {[1, 1.5, 2].map((value) => (
                      <label
                        key={value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          background: currentConfig.repeatX === value ? '#4a9eff' : '#2a2a2a',
                          borderRadius: '4px',
                          transition: 'background 0.2s',
                          flex: '1',
                          justifyContent: 'center'
                        }}
                      >
                        <input
                          type="radio"
                          name={`repeatX-${selectedTexture}`}
                          value={value}
                          checked={currentConfig.repeatX === value}
                          onChange={(e) => updateTextureConfig(selectedTexture, 'repeatX', parseFloat(e.target.value))}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Repeat Y */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Repeat Y
                  </label>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {[1, 1.5, 2].map((value) => (
                      <label
                        key={value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          background: currentConfig.repeatY === value ? '#4a9eff' : '#2a2a2a',
                          borderRadius: '4px',
                          transition: 'background 0.2s',
                          flex: '1',
                          justifyContent: 'center'
                        }}
                      >
                        <input
                          type="radio"
                          name={`repeatY-${selectedTexture}`}
                          value={value}
                          checked={currentConfig.repeatY === value}
                          onChange={(e) => updateTextureConfig(selectedTexture, 'repeatY', parseFloat(e.target.value))}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Wrap Mode Info */}
                <div style={{
                  marginBottom: '20px',
                  padding: '10px',
                  background: '#2a2a2a',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#aaa'
                }}>
                  <strong>Wrap Mode:</strong> MirroredRepeatWrapping (S & T)
                </div>

                {/* Export Button */}
                <button
                  onClick={exportConfig}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: '#4a9eff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#3a8eef'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#4a9eff'}
                >
                  Export Configuration
                </button>

                {/* Current Values Display */}
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#2a2a2a',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#4a9eff' }}>
                    Current Texture Config:
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify({
                      name: currentConfig.name,
                      offset: { x: currentConfig.offsetX, y: currentConfig.offsetY },
                      repeat: { x: currentConfig.repeatX, y: currentConfig.repeatY }
                    }, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload('/stages/city_e/s00e_sa3/lndmd/s00e_sa3_m.glb');
