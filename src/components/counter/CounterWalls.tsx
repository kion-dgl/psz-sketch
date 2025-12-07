import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Define walls to keep player within counter boundaries
// Format: { position: [x, y, z], size: [thickness, height, length], rotation: angle in radians }
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 5;

const WALLS = [
  // Wall 1: (2.71, 71.37) → (2.71, 12.48)
  { position: [2.71, 2.5, 41.925] as [number, number, number], length: 58.89, rotation: 0 },
  // Wall 2: (-2.57, 12.48) → (-2.57, 71.70)
  { position: [-2.57, 2.5, 42.09] as [number, number, number], length: 59.22, rotation: 0 },
];

interface CounterWallsProps {
  visible?: boolean;
}

export default function CounterWalls({ visible = true }: CounterWallsProps) {
  return (
    <>
      {WALLS.map((wall, index) => (
        <RigidBody
          key={index}
          type="fixed"
          position={wall.position}
          rotation={[0, wall.rotation, 0]}
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
