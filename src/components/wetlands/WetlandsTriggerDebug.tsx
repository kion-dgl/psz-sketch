import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface MarkerData {
  id: string;
  type: 'spawn' | 'trigger';
  position: [number, number, number];
  rotation: number; // in radians, snapped to 45 degrees
  label: string;
}

// Get wetlands directory based on mapId prefix
function getWetlandsDir(mapId: string): string {
  const match = mapId.match(/^s02([a-z])_/);
  if (match) {
    return `stages/wetlands_${match[1]}`;
  }
  return 'stages/wetlands_a';
}

// Arrow component for showing direction
function DirectionArrow({ rotation, color }: { rotation: number; color: string }) {
  return (
    <group rotation={[0, rotation, 0]}>
      {/* Arrow shaft */}
      <mesh position={[0, 0.5, 1.5]}>
        <boxGeometry args={[0.3, 0.3, 2]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Arrow head */}
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
  const { camera, gl } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    setLoading(true);
    setScene(null);
    setFloorGeometry(null);

    const loader = new GLTFLoader();
    const wetlandsDir = getWetlandsDir(selectedMap);
    const glbPath = `/${wetlandsDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      // Rotate scene to be viewed from top
      gltf.scene.rotation.x = 0;
      setScene(gltf.scene);

      // Extract floor geometry
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

  // Handle click on the floor plane
  const handleClick = (event: any) => {
    event.stopPropagation();

    const point = event.point;
    if (point) {
      onAddMarker([
        Math.round(point.x * 100) / 100,
        1.00, // Default Y position
        Math.round(point.z * 100) / 100
      ]);
    }
  };

  if (loading || !scene) return null;

  return (
    <>
      <primitive object={scene} />

      {/* Green floor debug mesh */}
      {showFloorMesh && floorGeometry && (
        <mesh geometry={floorGeometry}>
          <meshBasicMaterial color="#00ff00" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Invisible click plane */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Render markers */}
      {markers.map((marker) => (
        <group key={marker.id} position={marker.position}>
          {/* Marker sphere */}
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color={marker.type === 'spawn' ? '#00ff00' : '#ff6600'}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Marker ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2, 1.5, 32]} />
            <meshBasicMaterial
              color={marker.type === 'spawn' ? '#00ff00' : '#ff6600'}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Direction arrow for spawn points */}
          {marker.type === 'spawn' && (
            <DirectionArrow rotation={marker.rotation} color="#00ff00" />
          )}
        </group>
      ))}
    </>
  );
}

const WETLANDS_A_MAPS = [
  's02a_ga1', 's02a_ib1', 's02a_ib2', 's02a_ic1', 's02a_ic3',
  's02a_lb1', 's02a_lb3', 's02a_lc1', 's02a_lc2', 's02a_na1',
  's02a_nb2', 's02a_nc2', 's02a_sa1', 's02a_tb3', 's02a_tc3',
  's02a_td1', 's02a_td2', 's02a_xb2'
];

const WETLANDS_B_MAPS = [
  's02b_ga1', 's02b_ib1', 's02b_ib2', 's02b_ic1', 's02b_ic3',
  's02b_lb1', 's02b_lb3', 's02b_lc1', 's02b_lc2', 's02b_na1',
  's02b_nb2', 's02b_nc2', 's02b_sa1', 's02b_tb3', 's02b_tc3',
  's02b_td1', 's02b_td2', 's02b_xb2'
];

const WETLANDS_E_MAPS = ['s02e_ia1'];
const WETLANDS_Z_MAPS = ['s02z_na1'];

// Helper to convert radians to degrees
const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
// Helper to convert degrees to radians
const degToRad = (deg: number) => (deg * Math.PI) / 180;

export default function WetlandsTriggerDebug() {
  const [selectedMap, setSelectedMap] = useState('s02a_ga1');
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarkerType, setSelectedMarkerType] = useState<'spawn' | 'trigger'>('spawn');
  const [zoom, setZoom] = useState(50);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, z: 0 });
  const [showFloorMesh, setShowFloorMesh] = useState(true);

  // Clear markers when map changes
  useEffect(() => {
    setMarkers([]);
  }, [selectedMap]);

  const handleAddMarker = (position: [number, number, number]) => {
    const newMarker: MarkerData = {
      id: `${Date.now()}`,
      type: selectedMarkerType,
      position,
      rotation: 0, // Default rotation facing +Z
      label: selectedMarkerType === 'spawn' ? 'Spawn Point' : `Trigger ${markers.filter(m => m.type === 'trigger').length + 1}`
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  // Rotate marker by 45 degrees
  const handleRotateMarker = (id: string, direction: 'cw' | 'ccw') => {
    setMarkers(prev => prev.map(m => {
      if (m.id === id) {
        const step = degToRad(45);
        let newRotation = direction === 'cw' ? m.rotation + step : m.rotation - step;
        // Normalize to 0-2PI
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
        code += `    targetUrl: "/stage/wetlands",\n`;
        code += `    label: "${trigger.label}"\n`;
        code += `  }${i < triggerMarkers.length - 1 ? ',' : ''}\n`;
      });
      code += `]}\n`;
    }

    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const panSpeed = 5;
    switch(e.key) {
      case 'w':
      case 'ArrowUp':
        setCameraPosition(prev => ({ ...prev, z: prev.z - panSpeed }));
        break;
      case 's':
      case 'ArrowDown':
        setCameraPosition(prev => ({ ...prev, z: prev.z + panSpeed }));
        break;
      case 'a':
      case 'ArrowLeft':
        setCameraPosition(prev => ({ ...prev, x: prev.x - panSpeed }));
        break;
      case 'd':
      case 'ArrowRight':
        setCameraPosition(prev => ({ ...prev, x: prev.x + panSpeed }));
        break;
    }
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Left Panel - Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        width: '280px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
          Trigger Debug Tool
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
              cursor: 'pointer'
            }}
          >
            <optgroup label="Wetlands A">
              {WETLANDS_A_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Wetlands B">
              {WETLANDS_B_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Wetlands E">
              {WETLANDS_E_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
            <optgroup label="Wetlands Z">
              {WETLANDS_Z_MAPS.map((map) => (
                <option key={map} value={map}>{map}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Marker Type Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Click to Place:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setSelectedMarkerType('spawn')}
              style={{
                flex: 1,
                padding: '8px',
                background: selectedMarkerType === 'spawn' ? '#00aa00' : '#333',
                color: 'white',
                border: selectedMarkerType === 'spawn' ? '2px solid #00ff00' : '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              Spawn Point
            </button>
            <button
              onClick={() => setSelectedMarkerType('trigger')}
              style={{
                flex: 1,
                padding: '8px',
                background: selectedMarkerType === 'trigger' ? '#aa5500' : '#333',
                color: 'white',
                border: selectedMarkerType === 'trigger' ? '2px solid #ff6600' : '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              Exit Trigger
            </button>
          </div>
        </div>

        {/* Zoom Control */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Zoom: {zoom}
          </label>
          <input
            type="range"
            min="20"
            max="150"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Floor Mesh Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showFloorMesh}
              onChange={(e) => setShowFloorMesh(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold' }}>Show Floor Debug Mesh</span>
          </label>
        </div>

        {/* Instructions */}
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: '#222',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#aaa'
        }}>
          <div><b>Controls:</b></div>
          <div>Click on map to place marker</div>
          <div>WASD / Arrow keys to pan</div>
          <div>Slider to zoom in/out</div>
        </div>

        {/* Markers List */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Placed Markers:
          </label>
          {markers.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>No markers placed</div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  style={{
                    padding: '8px',
                    background: marker.type === 'spawn' ? 'rgba(0,255,0,0.2)' : 'rgba(255,102,0,0.2)',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold' }}>{marker.label}</div>
                    <button
                      onClick={() => handleRemoveMarker(marker.id)}
                      style={{
                        background: '#aa0000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      X
                    </button>
                  </div>
                  <div style={{ color: '#aaa', marginBottom: '4px' }}>
                    [{marker.position.map(p => p.toFixed(2)).join(', ')}]
                  </div>
                  {/* Rotation controls for spawn markers */}
                  {marker.type === 'spawn' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ color: '#8f8' }}>Rot: {radToDeg(marker.rotation)}°</span>
                      <button
                        onClick={() => handleRotateMarker(marker.id, 'ccw')}
                        style={{
                          background: '#336633',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        ↺ -45°
                      </button>
                      <button
                        onClick={() => handleRotateMarker(marker.id, 'cw')}
                        style={{
                          background: '#336633',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        ↻ +45°
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCode}
          disabled={markers.length === 0}
          style={{
            width: '100%',
            padding: '10px',
            background: markers.length === 0 ? '#333' : '#0066aa',
            color: markers.length === 0 ? '#666' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: markers.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}
        >
          Copy Code to Clipboard
        </button>
      </div>

      {/* Back Button */}
      <a
        href="/stage/wetlands"
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
          fontWeight: 'bold'
        }}
      >
        Back to Wetlands
      </a>

      {/* 3D Scene - Top Down View */}
      <Canvas>
        <OrthographicCamera
          makeDefault
          position={[cameraPosition.x, 80, cameraPosition.z]}
          zoom={zoom}
          near={0.1}
          far={1000}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 50, 0]} intensity={0.5} />

        <Suspense fallback={null}>
          <TopDownScene
            selectedMap={selectedMap}
            markers={markers}
            onAddMarker={handleAddMarker}
            selectedMarkerType={selectedMarkerType}
            showFloorMesh={showFloorMesh}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
