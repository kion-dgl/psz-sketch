import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import FixTextureEnvironment from './FixTextureEnvironment';

export default function FixTextureArea() {
  const [textureAdjustments, setTextureAdjustments] = useState<Record<string, any>>({});

  const handleExportJSON = () => {
    const json = JSON.stringify(textureAdjustments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valley-a-ga1_texture_fixes.json`;
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
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Texture Fixer: Gurhacia Valley A-GA1</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Use mouse to orbit, scroll to zoom</div>
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
          cursor: 'pointer'
        }}
      >
        Back to Stage
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
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          <FixTextureEnvironment onTextureAdjustmentsChange={setTextureAdjustments} />
        </Suspense>
      </Canvas>
    </div>
  );
}
