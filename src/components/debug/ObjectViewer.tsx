import { Canvas } from '@react-three/fiber';
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

interface MeshInfo {
  name: string;
  geometry: string;
  material: string;
  textures: string[];
}

const WRAP_OPTIONS: { label: string; value: THREE.Wrapping }[] = [
  { label: 'Repeat', value: THREE.RepeatWrapping },
  { label: 'Clamp', value: THREE.ClampToEdgeWrapping },
  { label: 'Mirror', value: THREE.MirroredRepeatWrapping },
];

function ObjectModel({
  modelPath,
  textureControls,
  onMeshesFound
}: {
  modelPath: string;
  textureControls: TextureControls;
  onMeshesFound: (meshes: MeshInfo[]) => void;
}) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const texturesRef = useRef<THREE.Texture[]>([]);

  useEffect(() => {
    const meshes: MeshInfo[] = [];
    const textures: THREE.Texture[] = [];

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        const textureNames: string[] = [];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            if (mat.map) {
              textures.push(mat.map);
              textureNames.push(mat.map.name || 'unnamed');
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
  }, [clonedScene, onMeshesFound]);

  useEffect(() => {
    texturesRef.current.forEach((texture) => {
      texture.wrapS = textureControls.wrapS;
      texture.wrapT = textureControls.wrapT;
      texture.offset.set(textureControls.offsetX, textureControls.offsetY);
      texture.repeat.set(textureControls.repeatX, textureControls.repeatY);
      texture.needsUpdate = true;
    });
  }, [textureControls]);

  return <primitive object={clonedScene} />;
}

interface ObjectViewerProps {
  areaId: string;
  objects: string[];
}

export default function ObjectViewer({ areaId, objects }: ObjectViewerProps) {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<MeshInfo[]>([]);
  const [textureControls, setTextureControls] = useState<TextureControls>({
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    offsetX: 0,
    offsetY: 0,
    repeatX: 1,
    repeatY: 1,
  });

  const modelPath = selectedObject
    ? `/objects/${areaId}/${selectedObject}/${selectedObject.replace('.imd', '.glb')}`
    : null;

  const handleMeshesFound = (newMeshes: MeshInfo[]) => {
    setMeshes(newMeshes);
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
                onMeshesFound={handleMeshesFound}
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

        <button
          onClick={() => setTextureControls({
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            offsetX: 0,
            offsetY: 0,
            repeatX: 1,
            repeatY: 1,
          })}
          style={{
            width: '100%',
            padding: '8px',
            background: '#4a4a8a',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Reset Controls
        </button>

        <div style={{ marginTop: '2rem' }}>
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
