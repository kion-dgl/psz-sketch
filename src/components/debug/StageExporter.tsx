import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid } from '@react-three/drei';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Stage configuration from existing pages
interface StageConfig {
  mapId: string;
  gates?: Array<{ edge: 'north' | 'south' | 'east' | 'west'; x: number; z: number; scale?: number }>;
  spawns?: Array<{ position: [number, number, number]; rotation: number; label: string }>;
  triggers?: Array<{ position: [number, number, number]; rotation: number; targetUrl: string; label: string }>;
}

// Texture fixes per stage type
const TEXTURE_FIXES: Record<string, Record<string, { repeatX: number; repeatY: number; offsetX: number; offsetY: number }>> = {
  valley: {
    "m_3_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
    "m_6_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
    "m_7_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
    "m_8_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
    "m_9_diffuse": { repeatX: 2, repeatY: 1, offsetX: 0, offsetY: 0 },
    "m_12_diffuse": { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 1.81 },
  },
};

function getStageDir(mapId: string): string {
  const match = mapId.match(/^s(\d{2})([a-z])_/);
  if (!match) return 'stages/valley_a';

  const stageNum = match[1];
  const area = match[2];

  const stageNames: Record<string, string> = {
    '01': 'valley',
    '02': 'wetlands',
    '03': 'snowfield',
    '04': 'makara',
    '05': 'paru',
    '06': 'arca',
    '07': 'shrine',
    '08': 'tower',
  };

  const stageName = stageNames[stageNum] || 'valley';
  return `stages/${stageName}_${area}`;
}

function getStageType(mapId: string): string {
  const match = mapId.match(/^s(\d{2})/);
  if (!match) return 'valley';

  const stageNames: Record<string, string> = {
    '01': 'valley',
    '02': 'wetlands',
    '03': 'snowfield',
    '04': 'makara',
    '05': 'paru',
    '06': 'arca',
    '07': 'shrine',
    '08': 'tower',
  };

  return stageNames[match[1]] || 'valley';
}

// Extract floor collision geometry from scene
function extractFloorCollision(scene: THREE.Object3D): THREE.BufferGeometry | null {
  const floorVertices: number[] = [];
  const tolerance = 0.25;

  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      const geometry = mesh.geometry;

      if (geometry.attributes.position) {
        const positions = geometry.attributes.position;
        const index = geometry.index;

        if (index) {
          for (let i = 0; i < index.count; i += 3) {
            const i0 = index.getX(i);
            const i1 = index.getX(i + 1);
            const i2 = index.getX(i + 2);

            const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0));
            const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1));
            const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2));

            v0.applyMatrix4(mesh.matrixWorld);
            v1.applyMatrix4(mesh.matrixWorld);
            v2.applyMatrix4(mesh.matrixWorld);

            if (Math.abs(v0.y) < tolerance && Math.abs(v1.y) < tolerance && Math.abs(v2.y) < tolerance) {
              floorVertices.push(v0.x, 0, v0.z);
              floorVertices.push(v1.x, 0, v1.z);
              floorVertices.push(v2.x, 0, v2.z);
            }
          }
        }
      }
    }
  });

  if (floorVertices.length > 0) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(floorVertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }
  return null;
}

// Apply texture fixes to materials
function applyTextureFixes(scene: THREE.Object3D, stageType: string) {
  const fixes = TEXTURE_FIXES[stageType] || {};

  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat) => {
        if ((mat as any).map) {
          const texture = (mat as any).map as THREE.Texture;

          // Try to find fixes by mesh name pattern
          const meshMatch = mesh.name.match(/_(m_\d+)$/);
          if (meshMatch) {
            const textureKey = `${meshMatch[1]}_diffuse`;
            const fix = fixes[textureKey];
            if (fix) {
              texture.wrapS = THREE.MirroredRepeatWrapping;
              texture.wrapT = THREE.MirroredRepeatWrapping;
              texture.repeat.set(fix.repeatX, fix.repeatY);
              texture.offset.set(fix.offsetX, fix.offsetY);
              texture.needsUpdate = true;
            }
          }
        }
      });
    }
  });
}

// Create marker empty node
function createMarker(name: string, position: [number, number, number], rotation: number, userData: Record<string, any> = {}): THREE.Object3D {
  const marker = new THREE.Object3D();
  marker.name = name;
  marker.position.set(position[0], position[1], position[2]);
  marker.rotation.set(0, rotation, 0);
  marker.userData = userData;
  return marker;
}

interface StageViewerProps {
  mapId: string;
  config: StageConfig;
  onSceneReady: (scene: THREE.Group, floorGeometry: THREE.BufferGeometry | null) => void;
}

function StageViewer({ mapId, config, onSceneReady }: StageViewerProps) {
  const stageDir = getStageDir(mapId);
  const glbPath = `/${stageDir}/${mapId}/lndmd/${mapId}_m.glb`;
  const { scene } = useGLTF(glbPath);
  const stageType = getStageType(mapId);

  useEffect(() => {
    if (scene) {
      // Apply texture fixes
      applyTextureFixes(scene, stageType);

      // Extract floor collision
      const floorGeometry = extractFloorCollision(scene);

      onSceneReady(scene as THREE.Group, floorGeometry);
    }
  }, [scene, stageType, onSceneReady]);

  return <primitive object={scene} />;
}

// Visual markers for spawns, gates, triggers
function MarkerVisuals({ config }: { config: StageConfig }) {
  return (
    <>
      {/* Spawns - green boxes */}
      {config.spawns?.map((spawn, i) => (
        <mesh key={`spawn-${i}`} position={spawn.position}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshBasicMaterial color="green" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Gates - red boxes */}
      {config.gates?.map((gate, i) => {
        const pos: [number, number, number] = [gate.x, 1, gate.z];
        return (
          <mesh key={`gate-${i}`} position={pos}>
            <boxGeometry args={[2, 2, 0.5]} />
            <meshBasicMaterial color="red" transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Triggers - blue boxes */}
      {config.triggers?.map((trigger, i) => (
        <mesh key={`trigger-${i}`} position={trigger.position}>
          <boxGeometry args={[1, 0.5, 1]} />
          <meshBasicMaterial color="blue" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

interface ExportData {
  scene: THREE.Group | null;
  floorGeometry: THREE.BufferGeometry | null;
}

export default function StageExporter() {
  const [mapId, setMapId] = useState('s01a_ga1');
  const [config, setConfig] = useState<StageConfig>({ mapId: 's01a_ga1' });
  const [exportData, setExportData] = useState<ExportData>({ scene: null, floorGeometry: null });
  const [status, setStatus] = useState('Ready');
  const [configJson, setConfigJson] = useState('');

  // Parse config JSON
  const handleConfigChange = (json: string) => {
    setConfigJson(json);
    try {
      const parsed = JSON.parse(json);
      setConfig({ ...parsed, mapId });
    } catch (e) {
      // Invalid JSON, ignore
    }
  };

  const handleSceneReady = (scene: THREE.Group, floorGeometry: THREE.BufferGeometry | null) => {
    setExportData({ scene, floorGeometry });
    setStatus(`Scene loaded. Floor triangles: ${floorGeometry ? floorGeometry.attributes.position.count / 3 : 0}`);
  };

  const handleExport = async () => {
    if (!exportData.scene) {
      setStatus('No scene loaded');
      return;
    }

    setStatus('Preparing export...');

    // Create export scene with all data
    const exportScene = new THREE.Scene();
    exportScene.name = `stage_${mapId}`;

    // Add stage metadata
    exportScene.userData = {
      stageId: mapId,
      stageType: getStageType(mapId),
      exportedAt: new Date().toISOString(),
    };

    // Clone and add visual mesh
    const visualMesh = exportData.scene.clone();
    visualMesh.name = 'terrain_visual';

    // Strip skinning data to prevent invalid GLTF export
    // (scene.clone() doesn't properly handle skinned meshes)
    visualMesh.traverse((object) => {
      if ((object as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinnedMesh = object as THREE.SkinnedMesh;
        // Remove skeleton reference
        skinnedMesh.skeleton = undefined as any;
        skinnedMesh.bindMatrix = undefined as any;
        skinnedMesh.bindMatrixInverse = undefined as any;
      }
      // Also remove any skinning attributes from geometry
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.deleteAttribute('skinIndex');
          mesh.geometry.deleteAttribute('skinWeight');
        }
      }
    });

    exportScene.add(visualMesh);

    // Add floor collision mesh
    if (exportData.floorGeometry) {
      const floorMesh = new THREE.Mesh(
        exportData.floorGeometry,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      floorMesh.name = 'collision_floor';
      floorMesh.userData = { type: 'collision', collisionType: 'floor' };
      exportScene.add(floorMesh);
    }

    // Add spawn markers
    config.spawns?.forEach((spawn, i) => {
      const marker = createMarker(
        `spawn_${spawn.label.toLowerCase().replace(/\s+/g, '_')}`,
        spawn.position,
        spawn.rotation,
        { type: 'spawn', label: spawn.label }
      );
      exportScene.add(marker);
    });

    // Add gate markers
    config.gates?.forEach((gate, i) => {
      const pos: [number, number, number] = [gate.x, 1, gate.z];
      const rotation = gate.edge === 'north' || gate.edge === 'south' ? 0 : Math.PI / 2;
      const marker = createMarker(
        `gate_${gate.edge}_${i}`,
        pos,
        rotation,
        { type: 'gate', edge: gate.edge, scale: gate.scale || 1 }
      );
      exportScene.add(marker);
    });

    // Add trigger markers
    config.triggers?.forEach((trigger, i) => {
      const marker = createMarker(
        `trigger_${trigger.label.toLowerCase().replace(/\s+/g, '_')}`,
        trigger.position,
        trigger.rotation,
        { type: 'trigger', targetUrl: trigger.targetUrl, label: trigger.label }
      );
      exportScene.add(marker);
    });

    // Export to GLB
    const exporter = new GLTFExporter();

    try {
      const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          exportScene,
          (result) => resolve(result as ArrayBuffer),
          reject,
          { binary: true }
        );
      });

      // Download the file
      const blob = new Blob([glb], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mapId}_exported.glb`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus(`Exported ${mapId}_exported.glb successfully!`);
    } catch (error) {
      setStatus(`Export failed: ${error}`);
    }
  };

  // Example config template
  const exampleConfig = {
    gates: [
      { edge: "north", x: -17, z: -27, scale: 1 },
      { edge: "south", x: 14, z: 27, scale: 1 },
    ],
    spawns: [
      { position: [-17, 1, -24], rotation: 0, label: "North Gate" },
      { position: [14, 1, 24], rotation: 3.14159, label: "South Gate" },
    ],
    triggers: [
      { position: [-17, 1, -29], rotation: 0, targetUrl: "/stage/valley", label: "North Warp" },
      { position: [14, 1, 29], rotation: 3.14159, targetUrl: "/stage/valley", label: "South Warp" },
    ],
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#1a1a2e' }}>
      {/* Left panel - Config */}
      <div style={{ width: '350px', padding: '16px', background: '#252540', color: 'white', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Stage Exporter</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Map ID:</label>
          <input
            type="text"
            value={mapId}
            onChange={(e) => {
              setMapId(e.target.value);
              setConfig({ ...config, mapId: e.target.value });
            }}
            style={{ width: '100%', padding: '8px', background: '#1a1a2e', color: 'white', border: '1px solid #444' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Stage Config (JSON):</label>
          <textarea
            value={configJson}
            onChange={(e) => handleConfigChange(e.target.value)}
            placeholder={JSON.stringify(exampleConfig, null, 2)}
            style={{
              width: '100%',
              height: '300px',
              padding: '8px',
              background: '#1a1a2e',
              color: 'white',
              border: '1px solid #444',
              fontFamily: 'monospace',
              fontSize: '11px'
            }}
          />
        </div>

        <button
          onClick={() => handleConfigChange(JSON.stringify(exampleConfig, null, 2))}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '8px',
            background: '#444',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Load Example Config
        </button>

        <button
          onClick={handleExport}
          style={{
            width: '100%',
            padding: '12px',
            background: '#4a9eff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Export GLB
        </button>

        <div style={{ marginTop: '16px', padding: '8px', background: '#1a1a2e', borderRadius: '4px' }}>
          <strong>Status:</strong> {status}
        </div>

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#aaa' }}>Exported GLB Contains:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>terrain_visual - rendered environment</li>
            <li>collision_floor - floor collision mesh</li>
            <li>spawn_* - spawn point markers</li>
            <li>gate_* - gate position markers</li>
            <li>trigger_* - trigger/warp markers</li>
          </ul>
        </div>
      </div>

      {/* Right panel - 3D View */}
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [0, 30, 30], fov: 50 }}>
          <color attach="background" args={['#1a1a2e']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />

          <StageViewer
            mapId={mapId}
            config={config}
            onSceneReady={handleSceneReady}
          />

          <MarkerVisuals config={config} />

          <Grid
            args={[100, 100]}
            position={[0, 0.01, 0]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#444"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#666"
            fadeDistance={100}
            fadeStrength={1}
          />

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
}
