import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface LabelData {
  name: string;
  position: THREE.Vector3;
  userData: any;
}

interface FloorFace {
  vertices: THREE.Vector3[];
  normal: THREE.Vector3;
  meshName: string;
  area: number;
}

function CollisionDebugScene({ selectedMap, onDataExtracted }: {
  selectedMap: string;
  onDataExtracted: (labels: LabelData[], floors: FloorFace[]) => void
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [floorMeshes, setFloorMeshes] = useState<THREE.Mesh[]>([]);

  useEffect(() => {
    const loader = new GLTFLoader();
    const glbPath = `/valley_a/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      const labels: LabelData[] = [];
      const floorFaces: FloorFace[] = [];
      const floorGeometries: THREE.BufferGeometry[] = [];

      // Extract labels
      gltf.scene.traverse((object) => {
        if (object.type === 'Label') {
          labels.push({
            name: object.name,
            position: object.position.clone(),
            userData: { ...object.userData }
          });
        }
      });

      // Extract floor faces (faces where all vertices have y = 0)
      const floorVertices: number[] = [];

      gltf.scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const geometry = mesh.geometry;

          if (geometry.attributes.position) {
            const positions = geometry.attributes.position;
            const index = geometry.index;

            if (index) {
              // Indexed geometry
              for (let i = 0; i < index.count; i += 3) {
                const i0 = index.getX(i);
                const i1 = index.getX(i + 1);
                const i2 = index.getX(i + 2);

                const v0 = new THREE.Vector3(
                  positions.getX(i0),
                  positions.getY(i0),
                  positions.getZ(i0)
                );
                const v1 = new THREE.Vector3(
                  positions.getX(i1),
                  positions.getY(i1),
                  positions.getZ(i1)
                );
                const v2 = new THREE.Vector3(
                  positions.getX(i2),
                  positions.getY(i2),
                  positions.getZ(i2)
                );

                // Transform to world space
                v0.applyMatrix4(mesh.matrixWorld);
                v1.applyMatrix4(mesh.matrixWorld);
                v2.applyMatrix4(mesh.matrixWorld);

                // Check if all vertices have y close to 0 (within tolerance)
                const tolerance = 0.25;
                if (Math.abs(v0.y) < tolerance &&
                    Math.abs(v1.y) < tolerance &&
                    Math.abs(v2.y) < tolerance) {

                  // Calculate area
                  const edge1 = new THREE.Vector3().subVectors(v1, v0);
                  const edge2 = new THREE.Vector3().subVectors(v2, v0);
                  const cross = new THREE.Vector3().crossVectors(edge1, edge2);
                  const area = cross.length() / 2;

                  floorFaces.push({
                    vertices: [v0.clone(), v1.clone(), v2.clone()],
                    normal: cross.normalize(),
                    meshName: mesh.name,
                    area
                  });

                  // Add to floor geometry for visualization (offset to y = 0.05)
                  floorVertices.push(v0.x, 0.05, v0.z);
                  floorVertices.push(v1.x, 0.05, v1.z);
                  floorVertices.push(v2.x, 0.05, v2.z);
                }
              }
            }
          }
        }
      });

      // Create single geometry from all floor vertices
      if (floorVertices.length > 0) {
        const tempGeometry = new THREE.BufferGeometry();
        tempGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorVertices, 3));
        tempGeometry.computeVertexNormals();
        floorGeometries.push(tempGeometry);
      }

      // Create floor visualization meshes
      const meshes = floorGeometries.map((geom, idx) => {
        const material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          wireframe: false,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        });
        return new THREE.Mesh(geom, material);
      });

      setFloorMeshes(meshes);
      setScene(gltf.scene);
      onDataExtracted(labels, floorFaces);
    });
  }, [selectedMap]);

  return (
    <>
      {scene && <primitive object={scene} />}
      {floorMeshes.map((mesh, idx) => (
        <primitive key={idx} object={mesh} />
      ))}
    </>
  );
}

const AVAILABLE_MAPS = [
  's01a_ga1', 's01a_ib1', 's01a_ib2', 's01a_ic1', 's01a_ic3',
  's01a_lb1', 's01a_lb3', 's01a_lc1', 's01a_lc2', 's01a_na1',
  's01a_nb2', 's01a_nc2', 's01a_sa1', 's01a_tb3', 's01a_tc3',
  's01a_td1', 's01a_td2', 's01a_xb2'
];

export default function ValleyCollisionDebug() {
  const [selectedMap, setSelectedMap] = useState('s01a_ga1');
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [floorFaces, setFloorFaces] = useState<FloorFace[]>([]);
  const [showFloor, setShowFloor] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const handleDataExtracted = (extractedLabels: LabelData[], extractedFloors: FloorFace[]) => {
    setLabels(extractedLabels);
    setFloorFaces(extractedFloors);
  };

  const handleExportCollision = () => {
    const collisionData = {
      map: selectedMap,
      labels: labels.map(l => ({
        name: l.name,
        position: { x: l.position.x, y: l.position.y, z: l.position.z },
        userData: l.userData
      })),
      floorFaces: floorFaces.map(f => ({
        meshName: f.meshName,
        area: f.area,
        vertices: f.vertices.map(v => ({ x: v.x, y: v.y, z: v.z })),
        normal: { x: f.normal.x, y: f.normal.y, z: f.normal.z }
      })),
      stats: {
        labelCount: labels.length,
        floorFaceCount: floorFaces.length,
        totalFloorArea: floorFaces.reduce((sum, f) => sum + f.area, 0)
      }
    };

    const json = JSON.stringify(collisionData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMap}_collision.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalFloorArea = floorFaces.reduce((sum, f) => sum + f.area, 0);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Header */}
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
        fontSize: '12px',
        maxWidth: '350px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
          Valley Collision Debug
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
              padding: '5px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          >
            {AVAILABLE_MAPS.map((map) => (
              <option key={map} value={map}>{map}</option>
            ))}
          </select>
        </div>

        {/* Visibility Toggles */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showFloor}
              onChange={(e) => setShowFloor(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Floor Geometry
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Label Data
          </label>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Statistics:</div>
          <div>Labels Found: {labels.length}</div>
          <div>Floor Faces: {floorFaces.length}</div>
          <div>Total Floor Area: {totalFloorArea.toFixed(2)}</div>
        </div>

        {/* Labels */}
        {showLabels && labels.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Labels:</div>
            {labels.map((label, idx) => (
              <div key={idx} style={{
                marginBottom: '8px',
                padding: '8px',
                background: 'rgba(100,100,255,0.2)',
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                <div style={{ fontWeight: 'bold', color: '#8af' }}>{label.name}</div>
                <div>Pos: ({label.position.x.toFixed(2)}, {label.position.y.toFixed(2)}, {label.position.z.toFixed(2)})</div>
                {Object.keys(label.userData).length > 0 && (
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#aaa' }}>
                    UserData: {JSON.stringify(label.userData)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExportCollision}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(50, 200, 50, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Export Collision Data
        </button>
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
          fontWeight: 'bold'
        }}
      >
        Back to Game
      </a>

      {/* 3D Scene */}
      <Canvas shadows>
        <OrbitControls />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />

        <Suspense fallback={null}>
          <CollisionDebugScene
            selectedMap={selectedMap}
            onDataExtracted={handleDataExtracted}
          />
        </Suspense>

        {/* Grid helper */}
        <gridHelper args={[100, 100]} position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
