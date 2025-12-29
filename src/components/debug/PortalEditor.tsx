import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

type GateEdge = 'north' | 'south' | 'east' | 'west';

interface PortalData {
  id: string;
  edge: GateEdge;
  position: number; // Position along the edge (-X to +X for north/south, -Z to +Z for east/west)
  label: string;
  targetMap?: string;
  // Computed positions based on edge and grid
  gatePosition: [number, number, number];
  spawnPosition: [number, number, number];
  triggerPosition: [number, number, number];
  rotation: number;
}

interface StagePortalConfig {
  gridSize: number;
  gridOffset: [number, number];
  portals: PortalData[];
}

const STORAGE_KEY = 'stage-portal-configs';

// Standard map suffixes used across most stages
const STANDARD_SUFFIXES = [
  'ga1', 'ib1', 'ib2', 'ic1', 'ic3', 'lb1', 'lb3', 'lc1', 'lc2',
  'na1', 'nb2', 'nc2', 'sa1', 'tb3', 'tc3', 'td1', 'td2', 'xb2'
];

// Generate maps for a stage prefix (e.g., 's01' for valley)
function generateStageMaps(prefix: string, variants: string[] = ['a', 'b', 'e', 'z']): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const variant of variants) {
    if (variant === 'e') {
      result[variant] = [`${prefix}e_ia1`];
    } else if (variant === 'z') {
      result[variant] = [`${prefix}z_na1`];
    } else {
      result[variant] = STANDARD_SUFFIXES.map(suffix => `${prefix}${variant}_${suffix}`);
    }
  }
  return result;
}

// Tower has a different structure
const TOWER_MAPS: Record<string, string[]> = {
  '0': ['s080_sa0'],
  '1': ['s081_ga1', 's081_sa1', 's081_ib1', 's081_lb1'],
  '2': ['s082_ga1', 's082_sa1', 's082_ib1', 's082_lb1'],
  '3': ['s083_ga1', 's083_sa1', 's083_ib1', 's083_lb1'],
  '4': ['s084_ga1', 's084_sa1', 's084_ib1', 's084_lb1'],
  '5': ['s085_ga1', 's085_sa1', 's085_ib1', 's085_lb1'],
  '6': ['s086_ga1', 's086_sa1', 's086_ib1', 's086_lb1'],
  '7': ['s087_na1'],
  'e': ['s08e_ib1'],
};

// Shrine has extra boss map
const SHRINE_Z_MAPS = ['s07z_na1', 's07z_na2'];

interface StageAreaConfig {
  name: string;
  prefix: string;
  stageDir: string;
  maps: Record<string, string[]>;
  hubUrl: string;
}

const STAGE_AREAS: Record<string, StageAreaConfig> = {
  valley: {
    name: 'Gurhacia Valley',
    prefix: 's01',
    stageDir: 'valley',
    maps: generateStageMaps('s01'),
    hubUrl: '/stage/valley',
  },
  wetlands: {
    name: 'Ozette Wetlands',
    prefix: 's02',
    stageDir: 'wetlands',
    maps: generateStageMaps('s02'),
    hubUrl: '/stage/wetlands',
  },
  snowfield: {
    name: 'Rioh Snowfield',
    prefix: 's03',
    stageDir: 'snowfield',
    maps: generateStageMaps('s03'),
    hubUrl: '/stage/snowfield',
  },
  makara: {
    name: 'Makara Ruins',
    prefix: 's04',
    stageDir: 'makara',
    maps: generateStageMaps('s04'),
    hubUrl: '/stage/makara',
  },
  paru: {
    name: 'Oblivion City Paru',
    prefix: 's05',
    stageDir: 'paru',
    maps: generateStageMaps('s05'),
    hubUrl: '/stage/paru',
  },
  arca: {
    name: 'Arca Plant',
    prefix: 's06',
    stageDir: 'arca',
    maps: generateStageMaps('s06'),
    hubUrl: '/stage/arca',
  },
  shrine: {
    name: 'Dark Shrine',
    prefix: 's07',
    stageDir: 'shrine',
    maps: {
      ...generateStageMaps('s07', ['a', 'b', 'e']),
      z: SHRINE_Z_MAPS,
    },
    hubUrl: '/stage/shrine',
  },
  tower: {
    name: 'Eternal Tower',
    prefix: 's08',
    stageDir: 'tower',
    maps: TOWER_MAPS,
    hubUrl: '/stage/tower',
  },
};

function getAllMapsForArea(areaKey: string): string[] {
  const area = STAGE_AREAS[areaKey];
  if (!area) return [];
  return Object.values(area.maps).flat();
}

function getStageDir(areaKey: string, mapId: string): string {
  const area = STAGE_AREAS[areaKey];
  if (!area) return 'stages/valley_a';

  // Extract variant letter from mapId (e.g., 's01a_ga1' -> 'a')
  const match = mapId.match(new RegExp(`^${area.prefix}([a-z0-9])_`));
  const variant = match ? match[1] : 'a';

  return `stages/${area.stageDir}_${variant}`;
}

function loadAllConfigs(): Record<string, StagePortalConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAllConfigs(configs: Record<string, StagePortalConfig>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

// Calculate positions based on edge, offset along edge, and grid settings
function calculatePortalPositions(
  edge: GateEdge,
  offsetAlongEdge: number,
  gridSize: number,
  gridOffset: [number, number]
): { gate: [number, number, number]; spawn: [number, number, number]; trigger: [number, number, number]; rotation: number } {
  const halfSize = gridSize / 2;
  const spawnInset = 3; // How far inside the map the spawn is
  const triggerOutset = 2; // How far outside the map the trigger is
  const y = 1;

  switch (edge) {
    case 'north': // -Z edge
      return {
        gate: [gridOffset[0] + offsetAlongEdge, y, gridOffset[1] - halfSize],
        spawn: [gridOffset[0] + offsetAlongEdge, y, gridOffset[1] - halfSize + spawnInset],
        trigger: [gridOffset[0] + offsetAlongEdge, y, gridOffset[1] - halfSize - triggerOutset],
        rotation: 0 // Facing south (away from gate, into map)
      };
    case 'south': // +Z edge
      return {
        gate: [gridOffset[0] + offsetAlongEdge, y, gridOffset[1] + halfSize],
        spawn: [gridOffset[0] + offsetAlongEdge, y, gridOffset[1] + halfSize - spawnInset],
        trigger: [gridOffset[0] + offsetAlongEdge, y, gridOffset[1] + halfSize + triggerOutset],
        rotation: Math.PI // Facing north (away from gate, into map)
      };
    case 'east': // +X edge
      return {
        gate: [gridOffset[0] + halfSize, y, gridOffset[1] + offsetAlongEdge],
        spawn: [gridOffset[0] + halfSize - spawnInset, y, gridOffset[1] + offsetAlongEdge],
        trigger: [gridOffset[0] + halfSize + triggerOutset, y, gridOffset[1] + offsetAlongEdge],
        rotation: -Math.PI / 2 // Facing west (away from gate, into map)
      };
    case 'west': // -X edge
      return {
        gate: [gridOffset[0] - halfSize, y, gridOffset[1] + offsetAlongEdge],
        spawn: [gridOffset[0] - halfSize + spawnInset, y, gridOffset[1] + offsetAlongEdge],
        trigger: [gridOffset[0] - halfSize - triggerOutset, y, gridOffset[1] + offsetAlongEdge],
        rotation: Math.PI / 2 // Facing east (away from gate, into map)
      };
  }
}

function getGateRotation(edge: GateEdge): number {
  switch (edge) {
    case 'north': return Math.PI;
    case 'south': return 0;
    case 'east': return Math.PI / 2;
    case 'west': return -Math.PI / 2;
  }
}

// Grid visualization
function GridOverlay({ size, offset }: { size: number; offset: [number, number] }) {
  const halfSize = size / 2;
  const lines: React.ReactNode[] = [];

  // Edge lines (yellow, thicker)
  const edges = [
    // North edge (-Z)
    { start: [offset[0] - halfSize, 0.2, offset[1] - halfSize], end: [offset[0] + halfSize, 0.2, offset[1] - halfSize], color: '#ffff00' },
    // South edge (+Z)
    { start: [offset[0] - halfSize, 0.2, offset[1] + halfSize], end: [offset[0] + halfSize, 0.2, offset[1] + halfSize], color: '#ffff00' },
    // East edge (+X)
    { start: [offset[0] + halfSize, 0.2, offset[1] - halfSize], end: [offset[0] + halfSize, 0.2, offset[1] + halfSize], color: '#ffff00' },
    // West edge (-X)
    { start: [offset[0] - halfSize, 0.2, offset[1] - halfSize], end: [offset[0] - halfSize, 0.2, offset[1] + halfSize], color: '#ffff00' },
  ];

  edges.forEach((edge, i) => {
    const positions = new Float32Array([...edge.start, ...edge.end] as number[]);
    lines.push(
      <line key={`edge-${i}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={edge.color} linewidth={3} />
      </line>
    );
  });

  // Grid lines
  for (let i = -halfSize + 5; i < halfSize; i += 5) {
    const color = i === 0 ? '#666666' : '#333333';

    // Horizontal lines
    const hPositions = new Float32Array([
      offset[0] - halfSize, 0.15, offset[1] + i,
      offset[0] + halfSize, 0.15, offset[1] + i
    ]);
    lines.push(
      <line key={`h${i}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[hPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
    );

    // Vertical lines
    const vPositions = new Float32Array([
      offset[0] + i, 0.15, offset[1] - halfSize,
      offset[0] + i, 0.15, offset[1] + halfSize
    ]);
    lines.push(
      <line key={`v${i}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[vPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
    );
  }

  return <group>{lines}</group>;
}

// Gate dimensions from model bounding box
const GATE_WIDTH = 6.0;
const GATE_HEIGHT = 1.5;
const GATE_DEPTH = 0.2;

// Portal visualization (gate + spawn + trigger)
function PortalMarker({
  portal,
  selected,
  onClick,
  onDragStart,
  isDragging
}: {
  portal: PortalData;
  selected: boolean;
  onClick: () => void;
  onDragStart: () => void;
  isDragging: boolean;
}) {
  const gateColor = isDragging ? '#ffff00' : selected ? '#00ffff' : '#8888ff';
  const spawnColor = '#00ff00';
  const triggerColor = '#ff6600';

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerDown={(e) => { e.stopPropagation(); onDragStart(); }}
    >
      {/* Gate marker */}
      <group position={portal.gatePosition} rotation={[0, getGateRotation(portal.edge), 0]}>
        <mesh>
          <boxGeometry args={[GATE_WIDTH, GATE_HEIGHT, GATE_DEPTH]} />
          <meshBasicMaterial color={gateColor} transparent opacity={isDragging ? 0.9 : selected ? 0.8 : 0.5} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(GATE_WIDTH, GATE_HEIGHT, GATE_DEPTH)]} />
          <lineBasicMaterial color={gateColor} />
        </lineSegments>
      </group>

      {/* Spawn point marker (green sphere inside) */}
      <group position={portal.spawnPosition}>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color={spawnColor} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1, 1.3, 32]} />
          <meshBasicMaterial color={spawnColor} side={THREE.DoubleSide} />
        </mesh>
        {/* Direction arrow */}
        <group rotation={[0, portal.rotation, 0]}>
          <mesh position={[0, 0.3, 1]}>
            <boxGeometry args={[0.2, 0.2, 1.5]} />
            <meshBasicMaterial color={spawnColor} />
          </mesh>
          <mesh position={[0, 0.3, 2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.4, 0.6, 8]} />
            <meshBasicMaterial color={spawnColor} />
          </mesh>
        </group>
      </group>

      {/* Trigger marker (orange box outside) - matches gate width */}
      <group position={portal.triggerPosition} rotation={[0, getGateRotation(portal.edge), 0]}>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[GATE_WIDTH, 3, 2]} />
          <meshBasicMaterial color={triggerColor} transparent opacity={0.3} />
        </mesh>
        <lineSegments position={[0, 1.5, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(GATE_WIDTH, 3, 2)]} />
          <lineBasicMaterial color={triggerColor} />
        </lineSegments>
      </group>

      {/* Connection line from spawn to gate to trigger */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              ...portal.spawnPosition,
              ...portal.gatePosition,
              ...portal.triggerPosition
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </line>
    </group>
  );
}

function TopDownScene({
  selectedArea,
  selectedMap,
  gridSize,
  gridOffset,
  portals,
  selectedPortal,
  onSelectPortal,
  onAddOrUpdatePortal,
  onDragPortal,
  placementEdge,
  draggingPortal,
  setDraggingPortal,
  snapGrid,
  showFloorMesh
}: {
  selectedArea: string;
  selectedMap: string;
  gridSize: number;
  gridOffset: [number, number];
  portals: PortalData[];
  selectedPortal: string | null;
  onSelectPortal: (id: string | null) => void;
  onAddOrUpdatePortal: (edge: GateEdge, position: number) => void;
  onDragPortal: (id: string, position: number) => void;
  placementEdge: GateEdge | null;
  draggingPortal: string | null;
  setDraggingPortal: (id: string | null) => void;
  snapGrid: number;
  showFloorMesh: boolean;
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [floorGeometry, setFloorGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setScene(null);
    setFloorGeometry(null);

    const loader = new GLTFLoader();
    const stageDir = getStageDir(selectedArea, selectedMap);
    const glbPath = `/${stageDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      setScene(gltf.scene);

      // Extract floor geometry (triangles near y=0)
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
                  floorVertices.push(v0.x, 0.15, v0.z);
                  floorVertices.push(v1.x, 0.15, v1.z);
                  floorVertices.push(v2.x, 0.15, v2.z);
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
  }, [selectedArea, selectedMap]);

  // Snap value to grid
  const snapValue = (val: number) => {
    if (snapGrid <= 0) return val;
    return Math.round(val / snapGrid) * snapGrid;
  };

  const handleClick = (event: any) => {
    if (!placementEdge) return;
    event.stopPropagation();
    const point = event.point;
    if (point) {
      // Calculate offset along edge based on click position
      let offsetAlongEdge: number;
      switch (placementEdge) {
        case 'north':
        case 'south':
          offsetAlongEdge = point.x - gridOffset[0];
          break;
        case 'east':
        case 'west':
          offsetAlongEdge = point.z - gridOffset[1];
          break;
      }
      onAddOrUpdatePortal(placementEdge, snapValue(offsetAlongEdge));
    }
  };

  const handlePointerMove = (event: any) => {
    if (!draggingPortal) return;
    const portal = portals.find(p => p.id === draggingPortal);
    if (!portal) return;

    const point = event.point;
    if (point) {
      let offsetAlongEdge: number;
      switch (portal.edge) {
        case 'north':
        case 'south':
          offsetAlongEdge = point.x - gridOffset[0];
          break;
        case 'east':
        case 'west':
          offsetAlongEdge = point.z - gridOffset[1];
          break;
      }
      onDragPortal(draggingPortal, snapValue(offsetAlongEdge));
    }
  };

  const handlePointerUp = () => {
    setDraggingPortal(null);
  };

  if (loading || !scene) return null;

  return (
    <>
      <primitive object={scene} />
      <GridOverlay size={gridSize} offset={gridOffset} />

      {/* Floor debug mesh */}
      {showFloorMesh && floorGeometry && (
        <mesh geometry={floorGeometry}>
          <meshBasicMaterial color="#00ff00" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Clickable/draggable plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Edge highlight when in placement mode */}
      {placementEdge && (
        <EdgeHighlight edge={placementEdge} gridSize={gridSize} gridOffset={gridOffset} />
      )}

      {/* Portal markers */}
      {portals.map((portal) => (
        <PortalMarker
          key={portal.id}
          portal={portal}
          selected={selectedPortal === portal.id}
          onClick={() => onSelectPortal(portal.id)}
          onDragStart={() => { setDraggingPortal(portal.id); onSelectPortal(portal.id); }}
          isDragging={draggingPortal === portal.id}
        />
      ))}

      {/* Origin marker */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </>
  );
}

function EdgeHighlight({ edge, gridSize, gridOffset }: { edge: GateEdge; gridSize: number; gridOffset: [number, number] }) {
  const halfSize = gridSize / 2;
  let position: [number, number, number];
  let size: [number, number, number];

  switch (edge) {
    case 'north':
      position = [gridOffset[0], 0.3, gridOffset[1] - halfSize];
      size = [gridSize, 0.5, 2];
      break;
    case 'south':
      position = [gridOffset[0], 0.3, gridOffset[1] + halfSize];
      size = [gridSize, 0.5, 2];
      break;
    case 'east':
      position = [gridOffset[0] + halfSize, 0.3, gridOffset[1]];
      size = [2, 0.5, gridSize];
      break;
    case 'west':
      position = [gridOffset[0] - halfSize, 0.3, gridOffset[1]];
      size = [2, 0.5, gridSize];
      break;
  }

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
    </mesh>
  );
}

const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);

export default function PortalEditor() {
  const [selectedArea, setSelectedArea] = useState('valley');
  const [selectedMap, setSelectedMap] = useState('s01a_ga1');
  const [gridSize, setGridSize] = useState(54);
  const [gridOffset, setGridOffset] = useState<[number, number]>([0, 0]);
  const [portals, setPortals] = useState<PortalData[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [placementEdge, setPlacementEdge] = useState<GateEdge | null>(null);
  const [allConfigs, setAllConfigs] = useState<Record<string, StagePortalConfig>>({});
  const [zoom, setZoom] = useState(20);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, z: 0 });
  const [draggingPortal, setDraggingPortal] = useState<string | null>(null);
  const [snapGrid, setSnapGrid] = useState(0.5); // Snap to 0.5 units by default
  const [showFloorMesh, setShowFloorMesh] = useState(false);

  const currentAreaConfig = STAGE_AREAS[selectedArea];
  const currentAreaMaps = getAllMapsForArea(selectedArea);

  // Helper to check which edges have portals
  const getPortalForEdge = (edge: GateEdge) => portals.find(p => p.edge === edge);

  // When area changes, select first map in that area
  const handleAreaChange = (newArea: string) => {
    setSelectedArea(newArea);
    const maps = getAllMapsForArea(newArea);
    if (maps.length > 0) {
      setSelectedMap(maps[0]);
    }
  };

  // Load configs on mount
  useEffect(() => {
    setAllConfigs(loadAllConfigs());
  }, []);

  // Load config when map changes
  useEffect(() => {
    const configs = loadAllConfigs();
    const config = configs[selectedMap];
    if (config) {
      setGridSize(config.gridSize);
      setGridOffset(config.gridOffset);
      setPortals(config.portals);
    } else {
      setGridSize(54);
      setGridOffset([0, 0]);
      setPortals([]);
    }
    setSelectedPortal(null);
    setDraggingPortal(null);
  }, [selectedMap]);

  // Save config when portals/grid change
  useEffect(() => {
    const configs = loadAllConfigs();
    if (portals.length > 0 || gridSize !== 54 || gridOffset[0] !== 0 || gridOffset[1] !== 0) {
      configs[selectedMap] = { gridSize, gridOffset, portals };
    } else {
      delete configs[selectedMap];
    }
    saveAllConfigs(configs);
    setAllConfigs(configs);
  }, [portals, gridSize, gridOffset, selectedMap]);

  // Add new portal or update existing one on that edge (max 1 per edge)
  const handleAddOrUpdatePortal = (edge: GateEdge, offsetAlongEdge: number) => {
    const existingPortal = getPortalForEdge(edge);
    const positions = calculatePortalPositions(edge, offsetAlongEdge, gridSize, gridOffset);

    if (existingPortal) {
      // Update existing portal position
      setPortals(prev => prev.map(p => {
        if (p.id !== existingPortal.id) return p;
        return {
          ...p,
          position: offsetAlongEdge,
          gatePosition: positions.gate,
          spawnPosition: positions.spawn,
          triggerPosition: positions.trigger,
          rotation: positions.rotation
        };
      }));
      setSelectedPortal(existingPortal.id);
    } else {
      // Create new portal
      const newPortal: PortalData = {
        id: `portal_${Date.now()}`,
        edge,
        position: offsetAlongEdge,
        label: `${edge.charAt(0).toUpperCase() + edge.slice(1)} Gate`,
        gatePosition: positions.gate,
        spawnPosition: positions.spawn,
        triggerPosition: positions.trigger,
        rotation: positions.rotation
      };
      setPortals(prev => [...prev, newPortal]);
      setSelectedPortal(newPortal.id);
    }
    setPlacementEdge(null);
  };

  // Handle dragging portal along its edge
  const handleDragPortal = (id: string, offsetAlongEdge: number) => {
    setPortals(prev => prev.map(p => {
      if (p.id !== id) return p;
      const positions = calculatePortalPositions(p.edge, offsetAlongEdge, gridSize, gridOffset);
      return {
        ...p,
        position: offsetAlongEdge,
        gatePosition: positions.gate,
        spawnPosition: positions.spawn,
        triggerPosition: positions.trigger,
        rotation: positions.rotation
      };
    }));
  };

  const handleRemovePortal = (id: string) => {
    setPortals(prev => prev.filter(p => p.id !== id));
    if (selectedPortal === id) setSelectedPortal(null);
  };

  const handleUpdatePortal = (id: string, updates: Partial<PortalData>) => {
    setPortals(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      // Recalculate positions if edge or position changed
      if (updates.edge !== undefined || updates.position !== undefined) {
        const positions = calculatePortalPositions(
          updated.edge,
          updated.position,
          gridSize,
          gridOffset
        );
        updated.gatePosition = positions.gate;
        updated.spawnPosition = positions.spawn;
        updated.triggerPosition = positions.trigger;
        updated.rotation = positions.rotation;
      }
      return updated;
    }));
  };

  const handleCopyJSON = () => {
    const hubUrl = currentAreaConfig?.hubUrl || '/stage/valley';
    const config = {
      gates: portals.map(p => ({
        edge: p.edge,
        x: p.gatePosition[0],
        z: p.gatePosition[2],
        scale: 1,
        animated: true
      })),
      spawnPoints: portals.map(p => ({
        position: p.spawnPosition,
        rotation: p.rotation,
        label: p.label
      })),
      triggers: portals.map(p => ({
        position: p.triggerPosition,
        rotation: p.rotation,
        targetUrl: p.targetMap || hubUrl,
        label: p.label
      }))
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert('Copied to clipboard!');
  };

  // Helper to determine area from map ID
  const getAreaFromMapId = (mapId: string): string => {
    for (const [areaKey, areaConfig] of Object.entries(STAGE_AREAS)) {
      if (mapId.startsWith(areaConfig.prefix)) {
        return areaKey;
      }
    }
    return 'valley';
  };

  const handleExportAll = () => {
    const allConfigs = loadAllConfigs();
    const exportData: Record<string, any> = {};

    for (const [mapId, config] of Object.entries(allConfigs)) {
      const area = getAreaFromMapId(mapId);
      const areaConfig = STAGE_AREAS[area];
      const hubUrl = areaConfig?.hubUrl || '/stage/valley';

      exportData[mapId] = {
        gridSize: config.gridSize,
        gridOffset: config.gridOffset,
        gates: config.portals.map(p => ({
          edge: p.edge,
          x: p.gatePosition[0],
          z: p.gatePosition[2],
          scale: 1,
          animated: true
        })),
        spawnPoints: config.portals.map(p => ({
          position: p.spawnPosition,
          rotation: p.rotation,
          label: p.label
        })),
        triggers: config.portals.map(p => ({
          position: p.triggerPosition,
          rotation: p.rotation,
          targetUrl: p.targetMap || hubUrl,
          label: p.label
        }))
      };
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedArea}-configs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const panSpeed = 5;
    switch (e.key) {
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
      case 'Delete':
      case 'Backspace':
        if (selectedPortal) handleRemovePortal(selectedPortal);
        break;
      case 'Escape':
        setPlacementEdge(null);
        setSelectedPortal(null);
        break;
    }
  };

  const selectedPortalData = portals.find(p => p.id === selectedPortal);
  const configuredInArea = currentAreaMaps.filter(m => allConfigs[m]).length;
  const totalInArea = currentAreaMaps.length;
  const hasCurrentConfig = !!allConfigs[selectedMap];

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 1000,
    background: 'rgba(0,0,0,0.95)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    width: '300px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '11px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px',
    background: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '4px',
    fontFamily: 'monospace',
    boxSizing: 'border-box'
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div style={panelStyle}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Portal Editor</h2>

        {/* Area Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Area:</label>
          <select
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {Object.entries(STAGE_AREAS).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
        </div>

        {/* Map Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stage:</label>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {Object.entries(currentAreaConfig?.maps || {}).map(([variant, maps]) => (
              <optgroup key={variant} label={`${currentAreaConfig?.name} ${variant.toUpperCase()}`}>
                {maps.map((map) => (
                  <option key={map} value={map}>{allConfigs[map] ? '✓ ' : ''}{map}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Status */}
        <div style={{
          marginBottom: '15px',
          padding: '8px',
          background: hasCurrentConfig ? '#1a3a1a' : '#3a3a1a',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          {hasCurrentConfig ? `✓ ${portals.length} portals configured` : '⚠ No portals'}
          <div style={{ color: '#888' }}>Configured: {configuredInArea}/{totalInArea}</div>
        </div>

        {/* Grid Controls */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Grid: {gridSize}x{gridSize}</label>
          <input type="range" min="20" max="100" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px' }}>Offset X:</label>
              <input type="number" step="0.5" value={gridOffset[0]} onChange={(e) => setGridOffset([Number(e.target.value), gridOffset[1]])} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px' }}>Offset Z:</label>
              <input type="number" step="0.5" value={gridOffset[1]} onChange={(e) => setGridOffset([gridOffset[0], Number(e.target.value)])} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Zoom & Snap */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>Zoom: {zoom}</label>
            <input type="range" min="1" max="150" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>Snap: {snapGrid}</label>
            <input type="range" min="0" max="2" step="0.25" value={snapGrid} onChange={(e) => setSnapGrid(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>

        {/* Floor Mesh Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showFloorMesh}
              onChange={(e) => setShowFloorMesh(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px' }}>Show Floor Debug Mesh</span>
          </label>
        </div>

        {/* Edge Portals - click to place, shows status */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Edge Portals:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            {(['north', 'south', 'east', 'west'] as GateEdge[]).map(edge => {
              const hasPortal = !!getPortalForEdge(edge);
              const isPlacing = placementEdge === edge;
              return (
                <button
                  key={edge}
                  onClick={() => setPlacementEdge(isPlacing ? null : edge)}
                  style={{
                    ...buttonStyle,
                    background: isPlacing ? '#006600' : hasPortal ? '#004488' : '#333',
                    border: isPlacing ? '2px solid #00ff00' : hasPortal ? '1px solid #0088ff' : '1px solid #555',
                    textTransform: 'capitalize'
                  }}
                >
                  {hasPortal ? '✓ ' : ''}{edge}
                </button>
              );
            })}
          </div>
          {placementEdge && (
            <div style={{ marginTop: '8px', color: '#0f0', fontSize: '11px' }}>
              {getPortalForEdge(placementEdge)
                ? `Click to reposition ${placementEdge} portal, or drag it`
                : `Click on the ${placementEdge} edge to place portal`}
            </div>
          )}
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
            Drag portals to adjust position along edge
          </div>
        </div>

        {/* Selected Portal Editor */}
        {selectedPortalData && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#0a2a2a', borderRadius: '4px', border: '1px solid #0aa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#0ff' }}>{selectedPortalData.label}</span>
              <button onClick={() => handleRemovePortal(selectedPortalData.id)} style={{ ...buttonStyle, background: '#aa0000', padding: '2px 8px' }}>Delete</button>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Label:</label>
              <input type="text" value={selectedPortalData.label} onChange={(e) => handleUpdatePortal(selectedPortalData.id, { label: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Target Map:</label>
              <input type="text" value={selectedPortalData.targetMap || ''} placeholder="/stage/valley" onChange={(e) => handleUpdatePortal(selectedPortalData.id, { targetMap: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Position along edge:</label>
              <input type="number" step="0.5" value={selectedPortalData.position} onChange={(e) => handleUpdatePortal(selectedPortalData.id, { position: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              <div>Gate: [{selectedPortalData.gatePosition.map(n => n.toFixed(1)).join(', ')}]</div>
              <div>Spawn: [{selectedPortalData.spawnPosition.map(n => n.toFixed(1)).join(', ')}]</div>
              <div>Trigger: [{selectedPortalData.triggerPosition.map(n => n.toFixed(1)).join(', ')}]</div>
              <div>Rotation: {radToDeg(selectedPortalData.rotation)}°</div>
            </div>
          </div>
        )}

        {/* Portals List */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Portals ({portals.length}):</div>
          {portals.map(portal => (
            <div
              key={portal.id}
              onClick={() => setSelectedPortal(portal.id)}
              style={{
                padding: '6px 8px',
                background: selectedPortal === portal.id ? '#0aa' : '#222',
                borderRadius: '3px',
                marginBottom: '2px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {portal.label} ({portal.edge})
            </div>
          ))}
        </div>

        {/* Export */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
          <button onClick={handleCopyJSON} disabled={portals.length === 0} style={{ ...buttonStyle, flex: 1, background: portals.length === 0 ? '#333' : '#0066aa' }}>
            Copy JSON
          </button>
          <button onClick={handleExportAll} disabled={configuredInArea === 0} style={{ ...buttonStyle, flex: 1, background: configuredInArea === 0 ? '#333' : '#006644' }}>
            Export All
          </button>
        </div>

        <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
          WASD/Arrows=pan, Del=remove, Esc=cancel
        </div>
      </div>

      {/* Back Button */}
      <a
        href={currentAreaConfig?.hubUrl || '/stage/valley'}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 16px',
          background: '#c33',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        Back to {currentAreaConfig?.name || 'Valley'}
      </a>

      {/* Canvas */}
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
            selectedArea={selectedArea}
            selectedMap={selectedMap}
            gridSize={gridSize}
            gridOffset={gridOffset}
            portals={portals}
            selectedPortal={selectedPortal}
            onSelectPortal={setSelectedPortal}
            onAddOrUpdatePortal={handleAddOrUpdatePortal}
            onDragPortal={handleDragPortal}
            placementEdge={placementEdge}
            draggingPortal={draggingPortal}
            setDraggingPortal={setDraggingPortal}
            snapGrid={snapGrid}
            showFloorMesh={showFloorMesh}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
