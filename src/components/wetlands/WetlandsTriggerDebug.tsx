import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface MarkerData {
  id: string;
  type: 'spawn' | 'trigger';
  position: [number, number, number];
  label: string;
}

// Get wetlands directory based on mapId prefix
function getWetlandsDir(mapId: string): string {
  const match = mapId.match(/^s02([a-z])_/);
  if (match) {
    return `wetlands_${match[1]}`;
  }
  return 'wetlands_a';
}

function TopDownScene({
  selectedMap,
  markers,
  onAddMarker,
  selectedMarkerType
}: {
  selectedMap: string;
  markers: MarkerData[];
  onAddMarker: (position: [number, number, number]) => void;
  selectedMarkerType: 'spawn' | 'trigger';
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const { camera, gl } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    setLoading(true);
    setScene(null);

    const loader = new GLTFLoader();
    const wetlandsDir = getWetlandsDir(selectedMap);
    const glbPath = `/${wetlandsDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      // Rotate scene to be viewed from top
      gltf.scene.rotation.x = 0;
      setScene(gltf.scene);
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

export default function WetlandsTriggerDebug() {
  const [selectedMap, setSelectedMap] = useState('s02a_ga1');
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarkerType, setSelectedMarkerType] = useState<'spawn' | 'trigger'>('spawn');
  const [zoom, setZoom] = useState(50);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, z: 0 });

  // Clear markers when map changes
  useEffect(() => {
    setMarkers([]);
  }, [selectedMap]);

  const handleAddMarker = (position: [number, number, number]) => {
    const newMarker: MarkerData = {
      id: `${Date.now()}`,
      type: selectedMarkerType,
      position,
      label: selectedMarkerType === 'spawn' ? 'Spawn Point' : `Trigger ${markers.filter(m => m.type === 'trigger').length + 1}`
    };
    setMarkers(prev => [...prev, newMarker]);
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
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 8px',
                    background: marker.type === 'spawn' ? 'rgba(0,255,0,0.2)' : 'rgba(255,102,0,0.2)',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontSize: '11px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{marker.label}</div>
                    <div style={{ color: '#aaa' }}>
                      [{marker.position.map(p => p.toFixed(2)).join(', ')}]
                    </div>
                  </div>
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
