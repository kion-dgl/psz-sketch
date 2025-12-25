import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Define walls to keep player within underground boundaries
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 5;

interface WallConfig {
  position: [number, number, number];
  rotation: number;
  length: number;
}

const WALLS: WallConfig[] = [
  // TODO: Add wall boundaries for underground area
];

interface UndergroundWallsProps {
  visible?: boolean;
}

export default function UndergroundWalls({ visible = true }: UndergroundWallsProps) {
  return (
    <>
      {WALLS.map((wall, index) => (
        <RigidBody
          key={index}
          type="fixed"
          position={wall.position}
          rotation={[0, wall.rotation, 0]}
          collisionGroups={0x00010001}
          userData={{ type: 'wall', index }}
        >
          <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, wall.length / 2]} />
          {visible && (
            <mesh>
              <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, wall.length]} />
              <meshStandardMaterial color="yellow" transparent opacity={0.5} />
            </mesh>
          )}
        </RigidBody>
      ))}
    </>
  );
}
