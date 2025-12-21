import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import TextureFixerEnvironment from './TextureFixerEnvironment';

// Map configuration
const MAP_CONFIG: Record<string, { glbPath: string; name: string }> = {
  'valley-a-ga1': {
    glbPath: '/valley_a/s01a_ga1/lndmd/s01a_ga1_m.glb',
    name: 'Gurhacia Valley A-GA1'
  }
};

export default function TextureFixerArea() {
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [textureAdjustments, setTextureAdjustments] = useState<Record<string, any>>({});

  const handleExportJSON = () => {
    if (!selectedMap) return;
    const json = JSON.stringify(textureAdjustments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMap}_texture_fixes.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Map selection screen
  if (!selectedMap) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Texture Fixer</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Select a map to fix textures</p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '500px'
        }}>
          {Object.entries(MAP_CONFIG).map(([id, config]) => (
            <button
              key={id}
              onClick={() => setSelectedMap(id)}
              style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'monospace'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              {config.name}
            </button>
          ))}
        </div>

        <a
          href="/stage/warp"
          style={{
            padding: '0.75rem 2rem',
            background: 'white',
            color: '#1e3c72',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            marginTop: '1rem'
          }}
        >
          Back to Warp
        </a>
      </div>
    );
  }

  const config = MAP_CONFIG[selectedMap];

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
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Texture Fixer: {config.name}</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Use mouse to orbit, scroll to zoom</div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => setSelectedMap(null)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '10px 20px',
          background: 'rgba(200, 50, 50, 0.9)',
          color: 'white',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        Back to Map Select
      </button>

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
          <TextureFixerEnvironment
            glbPath={config.glbPath}
            onTextureAdjustmentsChange={setTextureAdjustments}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
