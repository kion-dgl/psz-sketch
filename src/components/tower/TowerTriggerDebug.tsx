import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface MarkerData {
  id: string;
  type: 'spawn' | 'trigger';
  position: [number, number, number];
  rotation: number;
  label: string;
}

interface StoredMapConfig {
  markers: MarkerData[];
}

const STORAGE_KEY = 'tower-trigger-configs';

function getTowerDir(mapId: string): string {
  const match = mapId.match(/^s08([0-7e])_/);
  if (match) {
    return `stages/tower_${match[1]}`;
  }
  return 'stages/tower_0';
}

function loadAllConfigs(): Record<string, StoredMapConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAllConfigs(configs: Record<string, StoredMapConfig>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

function DirectionArrow({ rotation, color }: { rotation: number; color: string }) {
  return (
    <group rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 1.5]}>
        <boxGeometry args={[0.3, 0.3, 2]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 2.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.6, 1, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function TopDownScene({
  selectedMap,
  markers,
  onAddMarker,
  selectedMarkerType,
  showFloorMesh
}: {
  selectedMap: string;
  markers: MarkerData[];
  onAddMarker: (position: [number, number, number]) => void;
  selectedMarkerType: 'spawn' | 'trigger';
  showFloorMesh: boolean;
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [floorGeometry, setFloorGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const planeRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    setLoading(true);
    setScene(null);
    setFloorGeometry(null);

    const loader = new GLTFLoader();
    const towerDir = getTowerDir(selectedMap);
    const glbPath = `/${towerDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      gltf.scene.rotation.x = 0;
      setScene(gltf.scene);

      const floorVertices: number[] = [];
      gltf.scene.traverse((object) => {
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

                const tolerance = 0.25;
                if (Math.abs(v0.y) < tolerance && Math.abs(v1.y) < tolerance && Math.abs(v2.y) < tolerance) {
                  floorVertices.push(v0.x, 0.1, v0.z);
                  floorVertices.push(v1.x, 0.1, v1.z);
                  floorVertices.push(v2.x, 0.1, v2.z);
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
        setFloorGeometry(geometry);
      }

      setLoading(false);
    });
  }, [selectedMap]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    const point = event.point;
    if (point) {
      onAddMarker([
        Math.round(point.x * 100) / 100,
        1.00,
        Math.round(point.z * 100) / 100
      ]);
    }
  };

  if (loading || !scene) return null;

  return (
    <>
      <primitive object={scene} />
      {showFloorMesh && floorGeometry && (
        <mesh geometry={floorGeometry}>
          <meshBasicMaterial color="#00ff00" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} onClick={handleClick}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {markers.map((marker) => (
        <group key={marker.id} position={marker.position}>
          {marker.type === 'spawn' ? (
            <>
              <mesh>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.2, 1.5, 32]} />
                <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} />
              </mesh>
              <DirectionArrow rotation={marker.rotation} color="#00ff00" />
            </>
          ) : (
            <group rotation={[0, marker.rotation, 0]}>
              <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[6, 3, 2]} />
                <meshBasicMaterial color="#ff6600" transparent opacity={0.4} side={THREE.DoubleSide} />
              </mesh>
              <lineSegments position={[0, 1.5, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(6, 3, 2)]} />
                <lineBasicMaterial color="#ff8800" linewidth={2} />
              </lineSegments>
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
                <meshBasicMaterial color="#ff6600" />
              </mesh>
              <mesh position={[0, 0.5, -1.5]}>
                <coneGeometry args={[0.4, 0.8, 8]} />
                <meshBasicMaterial color="#ffaa00" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </>
  );
}

const TOWER_0_MAPS = ['s080_sa0'];
const TOWER_1_MAPS = ['s081_ga1', 's081_sa1', 's081_ib1', 's081_lb1'];
const TOWER_2_MAPS = ['s082_ga1', 's082_sa1', 's082_ib1', 's082_lb1'];
const TOWER_3_MAPS = ['s083_ga1', 's083_sa1', 's083_ib1', 's083_lb1'];
const TOWER_4_MAPS = ['s084_ga1', 's084_sa1', 's084_ib1', 's084_lb1'];
const TOWER_5_MAPS = ['s085_ga1', 's085_sa1', 's085_ib1', 's085_lb1'];
const TOWER_6_MAPS = ['s086_ga1', 's086_sa1', 's086_ib1', 's086_lb1'];
const TOWER_7_MAPS = ['s087_na1'];
const TOWER_E_MAPS = ['s08e_ib1'];

const ALL_MAPS = [...TOWER_0_MAPS, ...TOWER_1_MAPS, ...TOWER_2_MAPS, ...TOWER_3_MAPS, ...TOWER_4_MAPS, ...TOWER_5_MAPS, ...TOWER_6_MAPS, ...TOWER_7_MAPS, ...TOWER_E_MAPS];

const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
const degToRad = (deg: number) => (deg * Math.PI) / 180;

export default function TowerTriggerDebug() {
  const [selectedMap, setSelectedMap] = useState('s080_sa0');
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [allConfigs, setAllConfigs] = useState<Record<string, StoredMapConfig>>({});
  const [selectedMarkerType, setSelectedMarkerType] = useState<'spawn' | 'trigger'>('spawn');
  const [zoom, setZoom] = useState(50);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, z: 0 });
  const [showFloorMesh, setShowFloorMesh] = useState(true);

  useEffect(() => {
    const configs = loadAllConfigs();
    setAllConfigs(configs);
    if (configs[selectedMap]) {
      setMarkers(configs[selectedMap].markers);
    }
  }, []);

  useEffect(() => {
    const configs = loadAllConfigs();
    setMarkers(configs[selectedMap]?.markers || []);
  }, [selectedMap]);

  useEffect(() => {
    const configs = loadAllConfigs();
    if (markers.length > 0) {
      configs[selectedMap] = { markers };
    } else {
      delete configs[selectedMap];
    }
    saveAllConfigs(configs);
    setAllConfigs(configs);
  }, [markers, selectedMap]);

  const handleAddMarker = (position: [number, number, number]) => {
    const newMarker: MarkerData = {
      id: `${Date.now()}`,
      type: selectedMarkerType,
      position,
      rotation: 0,
      label: selectedMarkerType === 'spawn' ? 'Spawn Point' : `Trigger ${markers.filter(m => m.type === 'trigger').length + 1}`
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const handleRotateMarker = (id: string, direction: 'cw' | 'ccw') => {
    setMarkers(prev => prev.map(m => {
      if (m.id === id) {
        const step = degToRad(45);
        let newRotation = direction === 'cw' ? m.rotation + step : m.rotation - step;
        if (newRotation < 0) newRotation += Math.PI * 2;
        if (newRotation >= Math.PI * 2) newRotation -= Math.PI * 2;
        return { ...m, rotation: newRotation };
      }
      return m;
    }));
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const handleClearMap = () => {
    if (confirm(`Clear all markers for ${selectedMap}?`)) {
      setMarkers([]);
    }
  };

  const handleExportCode = () => {
    const spawnMarker = markers.find(m => m.type === 'spawn');
    const triggerMarkers = markers.filter(m => m.type === 'trigger');

    let code = `// ${selectedMap} configuration\n`;
    if (spawnMarker) {
      code += `spawnPosition={[${spawnMarker.position.join(', ')}]}\n`;
      code += `spawnRotation={${spawnMarker.rotation.toFixed(4)}} // ${radToDeg(spawnMarker.rotation)}°\n`;
    }
    if (triggerMarkers.length > 0) {
      code += `triggers={[\n`;
      triggerMarkers.forEach((trigger, i) => {
        code += `  {\n`;
        code += `    position: [${trigger.position.join(', ')}],\n`;
        if (trigger.rotation !== 0) {
          code += `    rotation: ${trigger.rotation.toFixed(4)}, // ${radToDeg(trigger.rotation)}°\n`;
        }
        code += `    targetUrl: "/stage/tower",\n`;
        code += `    label: "${trigger.label}"\n`;
        code += `  }${i < triggerMarkers.length - 1 ? ',' : ''}\n`;
      });
      code += `]}\n`;
    }
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const handleExportAll = () => {
    const configs = loadAllConfigs();
    const configuredMaps = Object.keys(configs).sort();

    if (configuredMaps.length === 0) {
      alert('No maps configured yet!');
      return;
    }

    let code = `// Tower stage configurations - Generated from debug tool\n`;
    code += `// Configured maps: ${configuredMaps.length}\n\n`;
    code += `export const TOWER_CONFIG: Record<string, MapConfig> = {\n`;

    configuredMaps.forEach((mapId, mapIndex) => {
      const config = configs[mapId];
      const spawnMarkers = config.markers.filter(m => m.type === 'spawn');
      const triggerMarkers = config.markers.filter(m => m.type === 'trigger');

      code += `  '${mapId}': {\n`;
      code += `    spawnPoints: [\n`;
      spawnMarkers.forEach((spawn, i) => {
        code += `      {\n`;
        code += `        position: [${spawn.position.join(', ')}],\n`;
        code += `        rotation: ${spawn.rotation.toFixed(4)}, // ${radToDeg(spawn.rotation)}°\n`;
        code += `        label: '${spawn.label}',\n`;
        code += `        isDefault: ${i === 0}\n`;
        code += `      }${i < spawnMarkers.length - 1 ? ',' : ''}\n`;
      });
      code += `    ],\n`;
      code += `    triggers: [\n`;
      triggerMarkers.forEach((trigger, i) => {
        code += `      {\n`;
        code += `        position: [${trigger.position.join(', ')}],\n`;
        if (trigger.rotation !== 0) {
          code += `        rotation: ${trigger.rotation.toFixed(4)}, // ${radToDeg(trigger.rotation)}°\n`;
        }
        code += `        targetUrl: '/stage/tower',\n`;
        code += `        label: '${trigger.label}'\n`;
        code += `      }${i < triggerMarkers.length - 1 ? ',' : ''}\n`;
      });
      code += `    ]\n`;
      code += `  }${mapIndex < configuredMaps.length - 1 ? ',' : ''}\n`;
    });

    code += `};\n`;
    navigator.clipboard.writeText(code);
    alert(`Exported ${configuredMaps.length} map configs to clipboard!`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const panSpeed = 5;
    switch(e.key) {
      case 'w': case 'ArrowUp': setCameraPosition(prev => ({ ...prev, z: prev.z - panSpeed })); break;
      case 's': case 'ArrowDown': setCameraPosition(prev => ({ ...prev, z: prev.z + panSpeed })); break;
      case 'a': case 'ArrowLeft': setCameraPosition(prev => ({ ...prev, x: prev.x - panSpeed })); break;
      case 'd': case 'ArrowRight': setCameraPosition(prev => ({ ...prev, x: prev.x + panSpeed })); break;
    }
  };

  const configuredCount = Object.keys(allConfigs).length;
  const hasCurrentConfig = !!allConfigs[selectedMap];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }} tabIndex={0} onKeyDown={handleKeyDown}>
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.9)', color: 'white', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', width: '280px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>Trigger Debug Tool</div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Map:</label>
          <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontFamily: 'monospace', cursor: 'pointer' }}>
            <optgroup label="Floor 0">{TOWER_0_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 1">{TOWER_1_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 2">{TOWER_2_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 3">{TOWER_3_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 4">{TOWER_4_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 5">{TOWER_5_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 6">{TOWER_6_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Floor 7 - Summit">{TOWER_7_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
            <optgroup label="Elevator">{TOWER_E_MAPS.map((map) => (<option key={map} value={map}>{allConfigs[map] ? '✓ ' : '  '}{map}</option>))}</optgroup>
          </select>
        </div>
        <div style={{ marginBottom: '15px', padding: '10px', background: hasCurrentConfig ? 'rgba(0,150,0,0.3)' : 'rgba(150,100,0,0.3)', borderRadius: '4px', border: hasCurrentConfig ? '1px solid #0a0' : '1px solid #a80' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{hasCurrentConfig ? '✓ Config saved (localStorage)' : '⚠ No config yet'}</div>
          {hasCurrentConfig && (<div style={{ fontSize: '11px', color: '#aaa' }}><div>Spawns: {markers.filter(m => m.type === 'spawn').length}</div><div>Triggers: {markers.filter(m => m.type === 'trigger').length}</div></div>)}
          <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>Configured: {configuredCount} / {ALL_MAPS.length} maps</div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Click to Place:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSelectedMarkerType('spawn')} style={{ flex: 1, padding: '8px', background: selectedMarkerType === 'spawn' ? '#00aa00' : '#333', color: 'white', border: selectedMarkerType === 'spawn' ? '2px solid #00ff00' : '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}>Spawn Point</button>
            <button onClick={() => setSelectedMarkerType('trigger')} style={{ flex: 1, padding: '8px', background: selectedMarkerType === 'trigger' ? '#aa5500' : '#333', color: 'white', border: selectedMarkerType === 'trigger' ? '2px solid #ff6600' : '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}>Exit Trigger</button>
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Zoom: {zoom}</label><input type="range" min="20" max="150" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: '100%' }} /></div>
        <div style={{ marginBottom: '15px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><input type="checkbox" checked={showFloorMesh} onChange={(e) => setShowFloorMesh(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /><span style={{ fontWeight: 'bold' }}>Show Floor Debug Mesh</span></label></div>
        <div style={{ marginBottom: '15px', padding: '10px', background: '#222', borderRadius: '4px', fontSize: '11px', color: '#aaa' }}><div><b>Controls:</b></div><div>Click on map to place marker</div><div>WASD / Arrow keys to pan</div><div>Slider to zoom in/out</div><div style={{ marginTop: '5px', color: '#8f8' }}><b>Auto-saves to localStorage!</b></div></div>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}><label style={{ fontWeight: 'bold' }}>Placed Markers:</label>{markers.length > 0 && (<button onClick={handleClearMap} style={{ background: '#660000', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '10px' }}>Clear All</button>)}</div>
          {markers.length === 0 ? (<div style={{ color: '#666', fontStyle: 'italic' }}>No markers placed</div>) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {markers.map((marker) => (
                <div key={marker.id} style={{ padding: '8px', background: marker.type === 'spawn' ? 'rgba(0,255,0,0.2)' : 'rgba(255,102,0,0.2)', borderRadius: '4px', marginBottom: '5px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}><div style={{ fontWeight: 'bold' }}>{marker.label}</div><button onClick={() => handleRemoveMarker(marker.id)} style={{ background: '#aa0000', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '10px' }}>X</button></div>
                  <div style={{ color: '#aaa', marginBottom: '4px' }}>[{marker.position.map(p => p.toFixed(2)).join(', ')}]</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}><span style={{ color: marker.type === 'spawn' ? '#8f8' : '#fa8' }}>Rot: {radToDeg(marker.rotation)}°</span><button onClick={() => handleRotateMarker(marker.id, 'ccw')} style={{ background: marker.type === 'spawn' ? '#336633' : '#664422', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>↺ -45°</button><button onClick={() => handleRotateMarker(marker.id, 'cw')} style={{ background: marker.type === 'spawn' ? '#336633' : '#664422', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>↻ +45°</button></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handleExportCode} disabled={markers.length === 0} style={{ flex: 1, padding: '10px', background: markers.length === 0 ? '#333' : '#0066aa', color: markers.length === 0 ? '#666' : 'white', border: 'none', borderRadius: '4px', cursor: markers.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>Copy This Map</button>
          <button onClick={handleExportAll} disabled={configuredCount === 0} style={{ flex: 1, padding: '10px', background: configuredCount === 0 ? '#333' : '#006644', color: configuredCount === 0 ? '#666' : 'white', border: 'none', borderRadius: '4px', cursor: configuredCount === 0 ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>Export All ({configuredCount})</button>
        </div>
      </div>
      <a href="/stage/tower" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, padding: '10px 20px', background: 'rgba(200, 50, 50, 0.9)', color: 'white', textDecoration: 'none', borderRadius: '5px', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>Back to Tower</a>
      <Canvas>
        <OrthographicCamera makeDefault position={[cameraPosition.x, 80, cameraPosition.z]} zoom={zoom} near={0.1} far={1000} rotation={[-Math.PI / 2, 0, 0]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 50, 0]} intensity={0.5} />
        <Suspense fallback={null}><TopDownScene selectedMap={selectedMap} markers={markers} onAddMarker={handleAddMarker} selectedMarkerType={selectedMarkerType} showFloorMesh={showFloorMesh} /></Suspense>
      </Canvas>
    </div>
  );
}
