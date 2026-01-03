import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid } from '@react-three/drei';
import { Suspense, useState } from 'react';
import * as THREE from 'three';

const GLB_PATH = '/stages/valley_a/s01a_ga1/lndmd/s01a_ga1-scene.glb';

type LightingPreset = 'day' | 'morning' | 'evening' | 'night';

interface LightingConfig {
  background: string;
  ambient: { color: string; intensity: number };
  sun: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number; position: [number, number, number] };
  hemisphere: { skyColor: string; groundColor: string; intensity: number };
  fog?: { color: string; near: number; far: number };
}

const LIGHTING_PRESETS: Record<LightingPreset, LightingConfig> = {
  day: {
    background: '#87CEEB',
    ambient: { color: '#ffffff', intensity: 0.5 },
    sun: { color: '#fffaf0', intensity: 1.2, position: [10, 30, 10] },
    fill: { color: '#87CEEB', intensity: 0.3, position: [-10, 10, -10] },
    hemisphere: { skyColor: '#87CEEB', groundColor: '#8B7355', intensity: 0.4 },
  },
  morning: {
    background: '#c4a67c',
    ambient: { color: '#ffe8d0', intensity: 0.4 },
    sun: { color: '#ffcc88', intensity: 1.0, position: [-20, 12, 10] },
    fill: { color: '#8899bb', intensity: 0.25, position: [10, 8, -10] },
    hemisphere: { skyColor: '#ffd699', groundColor: '#665544', intensity: 0.35 },
    fog: { color: '#d4b896', near: 60, far: 150 },
  },
  evening: {
    background: '#4a3a50',
    ambient: { color: '#aa7766', intensity: 0.3 },
    sun: { color: '#ff7744', intensity: 0.8, position: [25, 6, -15] },
    fill: { color: '#334466', intensity: 0.2, position: [-10, 10, 10] },
    hemisphere: { skyColor: '#cc7755', groundColor: '#221818', intensity: 0.3 },
    fog: { color: '#5a4a55', near: 50, far: 120 },
  },
  night: {
    background: '#0f1525',
    ambient: { color: '#2a3050', intensity: 0.35 },
    sun: { color: '#aabbdd', intensity: 0.6, position: [8, 25, 8] }, // Moonlight
    fill: { color: '#223344', intensity: 0.25, position: [-15, 10, -10] },
    hemisphere: { skyColor: '#1a2035', groundColor: '#0a0a12', intensity: 0.3 },
  },
};

function SceneLighting({ preset }: { preset: LightingPreset }) {
  const config = LIGHTING_PRESETS[preset];

  return (
    <>
      <color attach="background" args={[config.background]} />

      {config.fog && (
        <fog attach="fog" args={[config.fog.color, config.fog.near, config.fog.far]} />
      )}

      <ambientLight color={config.ambient.color} intensity={config.ambient.intensity} />

      <directionalLight
        color={config.sun.color}
        intensity={config.sun.intensity}
        position={config.sun.position}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <directionalLight
        color={config.fill.color}
        intensity={config.fill.intensity}
        position={config.fill.position}
      />

      <hemisphereLight
        color={config.hemisphere.skyColor}
        groundColor={config.hemisphere.groundColor}
        intensity={config.hemisphere.intensity}
      />
    </>
  );
}

function ExportedModel() {
  const { scene } = useGLTF(GLB_PATH);

  // Filter out collision and marker objects - only show terrain_visual
  const filteredScene = scene.clone();
  const toRemove: THREE.Object3D[] = [];

  filteredScene.traverse((child) => {
    // Remove collision meshes, portals, gates, triggers, spawns
    if (
      child.name.includes('collision') ||
      child.name.includes('portal') ||
      child.name.includes('gate') ||
      child.name.includes('trigger') ||
      child.name.includes('spawn')
    ) {
      toRemove.push(child);
    }
  });

  toRemove.forEach((obj) => {
    obj.parent?.remove(obj);
  });

  return <primitive object={filteredScene} />;
}

// Preload the GLB
useGLTF.preload(GLB_PATH);

export default function LambertTestScene() {
  const [preset, setPreset] = useState<LightingPreset>('day');
  const [showGrid, setShowGrid] = useState(true);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Control Panel */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          minWidth: '200px',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', color: '#4a9eff' }}>Lambert Material Test</h3>

        {/* Lighting Presets */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888' }}>
            Lighting Preset:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(['day', 'morning', 'evening', 'night'] as LightingPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                style={{
                  padding: '8px 12px',
                  background: preset === p ? '#4a9eff' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: preset === p ? 'bold' : 'normal',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          <span>Show Grid</span>
        </label>

        <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '12px 0' }} />

        <p style={{ margin: '4px 0', color: '#666' }}>GLB: s01a_ga1-scene.glb</p>
        <p style={{ margin: '4px 0', color: '#666' }}>Visual mesh only (no collision/gates)</p>
      </div>

      {/* Back Link */}
      <a
        href="/stage"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 16px',
          background: 'rgba(50,50,80,0.9)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontFamily: 'sans-serif',
          fontSize: '14px',
        }}
      >
        ← Back to Stages
      </a>

      <Canvas camera={{ position: [20, 15, 20], fov: 50 }} shadows>
        <SceneLighting preset={preset} />

        <Suspense fallback={null}>
          <ExportedModel />
        </Suspense>

        {showGrid && (
          <Grid
            args={[100, 100]}
            position={[0, 0.01, 0]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#333"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#555"
            fadeDistance={100}
            fadeStrength={1}
          />
        )}

        <OrbitControls makeDefault minDistance={5} maxDistance={100} target={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
