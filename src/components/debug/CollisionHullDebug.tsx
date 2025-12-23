import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

interface SelectedTriangle {
  meshName: string;
  faceIndex: number;
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
}

function CollisionMesh({ onTriangleClick, selectedTriangles, groundRadius }: {
  onTriangleClick: (triangle: SelectedTriangle) => void;
  selectedTriangles: SelectedTriangle[];
  groundRadius: number;
}) {
  const { scene } = useGLTF('/stages/city_e/s00e_sa3/lndmd/s00e_sa3_m.glb');
  const [hoveredFace, setHoveredFace] = useState<{ meshName: string; faceIndex: number } | null>(null);
  const [textureConfig, setTextureConfig] = useState<any>(null);
  const { camera, raycaster, pointer } = useThree();

  // Load texture configuration
  useEffect(() => {
    fetch('/stages/city_e/s00e_sa3/lndmd/s00e_sa3_m-texture-config.json')
      .then(response => response.json())
      .then(config => setTextureConfig(config))
      .catch(error => console.error('Failed to load texture config:', error));
  }, []);

  // Clone the scene and apply textures
  const texturedScene = useMemo(() => {
    const cloned = scene.clone();

    if (!textureConfig) {
      return cloned;
    }

    // Create a map of texture configs by name
    const configMap = new Map();
    textureConfig.textures.forEach((config: any) => {
      configMap.set(config.name, config);
    });

    cloned.traverse((child: any) => {
      if (child.isMesh) {
        // Store original name for tracking
        child.userData.originalName = child.name;

        // Apply texture configuration if available
        if (child.material && child.material.map) {
          const textureName = child.material.map.name;
          const config = configMap.get(textureName);

          if (config) {
            child.material.map.offset.set(config.offset.x, config.offset.y);
            child.material.map.repeat.set(config.repeat.x, config.repeat.y);
            child.material.map.wrapS = THREE.MirroredRepeatWrapping;
            child.material.map.wrapT = THREE.MirroredRepeatWrapping;
            child.material.map.needsUpdate = true;
          }
        }

        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene, textureConfig]);

  // Create highlight meshes for selected triangles
  const selectedMeshes = useMemo(() => {
    const meshes: JSX.Element[] = [];

    selectedTriangles.forEach((triangle, index) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        triangle.vertices[0].x, triangle.vertices[0].y, triangle.vertices[0].z,
        triangle.vertices[1].x, triangle.vertices[1].y, triangle.vertices[1].z,
        triangle.vertices[2].x, triangle.vertices[2].y, triangle.vertices[2].z,
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex([0, 1, 2]);
      geometry.computeVertexNormals();

      meshes.push(
        <mesh key={`selected-${index}`} geometry={geometry}>
          <meshStandardMaterial color="yellow" side={THREE.DoubleSide} />
        </mesh>
      );
    });

    return meshes;
  }, [selectedTriangles]);

  // Create highlight mesh for hovered triangle
  const hoveredMesh = useMemo(() => {
    if (!hoveredFace) return null;

    let hoveredTriangle: SelectedTriangle | null = null;

    texturedScene.traverse((child: any) => {
      if (child.isMesh && child.userData.originalName === hoveredFace.meshName) {
        const geometry = child.geometry;
        const index = geometry.index;
        const position = geometry.attributes.position;

        if (index) {
          const faceIndex = hoveredFace.faceIndex;
          const a = index.getX(faceIndex * 3);
          const b = index.getX(faceIndex * 3 + 1);
          const c = index.getX(faceIndex * 3 + 2);

          const v1 = new THREE.Vector3().fromBufferAttribute(position, a);
          const v2 = new THREE.Vector3().fromBufferAttribute(position, b);
          const v3 = new THREE.Vector3().fromBufferAttribute(position, c);

          // Apply world transform
          child.localToWorld(v1);
          child.localToWorld(v2);
          child.localToWorld(v3);

          hoveredTriangle = {
            meshName: hoveredFace.meshName,
            faceIndex: hoveredFace.faceIndex,
            vertices: [v1, v2, v3]
          };
        }
      }
    });

    if (!hoveredTriangle) return null;

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      hoveredTriangle.vertices[0].x, hoveredTriangle.vertices[0].y, hoveredTriangle.vertices[0].z,
      hoveredTriangle.vertices[1].x, hoveredTriangle.vertices[1].y, hoveredTriangle.vertices[1].z,
      hoveredTriangle.vertices[2].x, hoveredTriangle.vertices[2].y, hoveredTriangle.vertices[2].z,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex([0, 1, 2]);
    geometry.computeVertexNormals();

    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial color="cyan" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    );
  }, [hoveredFace, texturedScene]);

  useFrame(() => {
    // Update raycaster
    raycaster.setFromCamera(pointer, camera);

    // Check intersections
    const intersects = raycaster.intersectObject(texturedScene, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      if (intersect.object instanceof THREE.Mesh && intersect.face) {
        setHoveredFace({
          meshName: intersect.object.userData.originalName || intersect.object.name,
          faceIndex: intersect.faceIndex!
        });
      }
    } else {
      setHoveredFace(null);
    }
  });

  const handleClick = () => {
    if (!hoveredFace) return;

    texturedScene.traverse((child: any) => {
      if (child.isMesh && child.userData.originalName === hoveredFace.meshName) {
        const geometry = child.geometry;
        const index = geometry.index;
        const position = geometry.attributes.position;

        if (index) {
          const faceIndex = hoveredFace.faceIndex;
          const a = index.getX(faceIndex * 3);
          const b = index.getX(faceIndex * 3 + 1);
          const c = index.getX(faceIndex * 3 + 2);

          const v1 = new THREE.Vector3().fromBufferAttribute(position, a);
          const v2 = new THREE.Vector3().fromBufferAttribute(position, b);
          const v3 = new THREE.Vector3().fromBufferAttribute(position, c);

          // Apply world transform
          child.localToWorld(v1);
          child.localToWorld(v2);
          child.localToWorld(v3);

          onTriangleClick({
            meshName: hoveredFace.meshName,
            faceIndex: hoveredFace.faceIndex,
            vertices: [v1, v2, v3]
          });
        }
      }
    });
  };

  // Create circular ground plane
  const groundPlane = useMemo(() => {
    const geometry = new THREE.CircleGeometry(groundRadius, 32);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal
    return geometry;
  }, [groundRadius]);

  return (
    <group onClick={handleClick}>
      <primitive object={texturedScene} />
      {/* Circular ground plane at 0,0,0 - always yellow */}
      <mesh geometry={groundPlane} position={[0, 0, 0]}>
        <meshStandardMaterial color="yellow" side={THREE.DoubleSide} />
      </mesh>
      {selectedMeshes}
      {hoveredMesh}
    </group>
  );
}

export default function CollisionHullDebug() {
  const [selectedTriangles, setSelectedTriangles] = useState<SelectedTriangle[]>([]);
  const [groundRadius, setGroundRadius] = useState<number>(5);

  const handleTriangleClick = (triangle: SelectedTriangle) => {
    // Check if triangle is already selected
    const isSelected = selectedTriangles.some(
      t => t.meshName === triangle.meshName && t.faceIndex === triangle.faceIndex
    );

    if (isSelected) {
      // Deselect
      setSelectedTriangles(prev =>
        prev.filter(t => !(t.meshName === triangle.meshName && t.faceIndex === triangle.faceIndex))
      );
    } else {
      // Select
      setSelectedTriangles(prev => [...prev, triangle]);
    }
  };

  const clearSelection = () => {
    setSelectedTriangles([]);
  };

  const exportCollisionHull = () => {
    // Create vertices and indices for the collision hull
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;

    // Add circular ground plane first (at 0,0,0)
    const circleGeometry = new THREE.CircleGeometry(groundRadius, 32);
    circleGeometry.rotateX(-Math.PI / 2);
    const positionAttr = circleGeometry.attributes.position;
    const circleIndex = circleGeometry.index;

    if (circleIndex) {
      // Add vertices
      for (let i = 0; i < positionAttr.count; i++) {
        vertices.push(
          positionAttr.getX(i),
          positionAttr.getY(i),
          positionAttr.getZ(i)
        );
      }

      // Add indices
      for (let i = 0; i < circleIndex.count; i++) {
        indices.push(circleIndex.getX(i));
      }

      vertexIndex = positionAttr.count;
    }

    // Add selected triangles
    selectedTriangles.forEach(triangle => {
      triangle.vertices.forEach(v => {
        vertices.push(v.x, v.y, v.z);
      });
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
      vertexIndex += 3;
    });

    const circleTriangleCount = circleIndex ? circleIndex.count / 3 : 0;

    const collisionData = {
      stage: 's00e_sa3_m',
      vertices: vertices,
      indices: indices,
      triangleCount: selectedTriangles.length + circleTriangleCount
    };

    const blob = new Blob([JSON.stringify(collisionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 's00e_sa3_m-collision-hull.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* 3D Viewport */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[20, 30, 20]}
            intensity={1.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <directionalLight position={[-15, 15, -15]} intensity={0.6} />
          <hemisphereLight args={['#ffffff', '#666666', 0.5]} />
          <OrbitControls />
          <Suspense fallback={null}>
            <CollisionMesh
              onTriangleClick={handleTriangleClick}
              selectedTriangles={selectedTriangles}
              groundRadius={groundRadius}
            />
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
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Collision Hull Debug</h1>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Instructions</h2>
          <ul style={{ fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Hover over triangles to highlight them in <span style={{ color: 'cyan' }}>cyan</span></li>
            <li>Click to select/deselect triangles (solid <span style={{ color: 'yellow' }}>yellow</span>)</li>
            <li>Use mouse to orbit, zoom, and pan the view</li>
            <li>Yellow circle at center is ground plane (always included)</li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold' }}>Ground Plane Radius</span>
            <span style={{ color: '#4a9eff' }}>{groundRadius.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={groundRadius}
            onChange={(e) => setGroundRadius(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <input
            type="number"
            step="0.5"
            min="1"
            max="20"
            value={groundRadius}
            onChange={(e) => setGroundRadius(parseFloat(e.target.value))}
            style={{
              width: '100%',
              marginTop: '5px',
              padding: '5px',
              background: '#1a1a1a',
              color: 'white',
              border: '1px solid #444',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            Selected Triangles: <span style={{ color: '#4a9eff' }}>{selectedTriangles.length}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>
            Click triangles to select collision surfaces
          </div>
          <div style={{ fontSize: '12px', color: '#4a9eff' }}>
            + Ground plane (radius {groundRadius.toFixed(1)}) always included
          </div>
        </div>

        <button
          onClick={clearSelection}
          disabled={selectedTriangles.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            background: selectedTriangles.length === 0 ? '#444' : '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: selectedTriangles.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => {
            if (selectedTriangles.length > 0) e.currentTarget.style.background = '#c0392b';
          }}
          onMouseOut={(e) => {
            if (selectedTriangles.length > 0) e.currentTarget.style.background = '#e74c3c';
          }}
        >
          Clear Selection
        </button>

        <button
          onClick={exportCollisionHull}
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
          Export Collision Hull
        </button>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#2a2a2a',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#4a9eff' }}>
            Export Preview:
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify({
              stage: 's00e_sa3_m',
              triangleCount: selectedTriangles.length + 32, // 32 triangles in ground plane circle
              selectedTriangles: selectedTriangles.length,
              groundPlane: `32 triangles (radius ${groundRadius.toFixed(1)})`
            }, null, 2)}
          </pre>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#2a2a2a',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#aaa'
        }}>
          <strong>Tip:</strong> Select all walkable surfaces including slopes, stairs, and flat areas. The exported collision hull will be used for player physics.
        </div>
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload('/stages/city_e/s00e_sa3/lndmd/s00e_sa3_m.glb');
