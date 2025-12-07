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
  // Wall 3: (-2.41, 11.98) → (-5.04, 11.98)
  { position: [-3.725, 2.5, 11.98] as [number, number, number], length: 2.63, rotation: 1.571 },
  // Wall 4: (-10.58, 7.93) → (-8.27, 4.38)
  { position: [-9.425, 2.5, 6.155] as [number, number, number], length: 4.24, rotation: 2.579 },
  // Wall 5: (-8.27, 4.38) → (-8.27, 1.25)
  { position: [-8.27, 2.5, 2.815] as [number, number, number], length: 3.13, rotation: 0 },
  // Wall 6: (-8.27, 1.25) → (-11.65, 1.25)
  { position: [-9.96, 2.5, 1.25] as [number, number, number], length: 3.38, rotation: 1.571 },
  // Wall 7: (-11.65, 1.25) → (-11.65, -4.44)
  { position: [-11.65, 2.5, -1.595] as [number, number, number], length: 5.69, rotation: 0 },
  // Wall 8: (-11.65, -4.44) → (-5.13, -11.08)
  { position: [-8.39, 2.5, -7.76] as [number, number, number], length: 9.31, rotation: 2.356 },
  // Wall 9: (-5.13, -11.08) → (-2.57, -12.15)
  { position: [-3.85, 2.5, -11.615] as [number, number, number], length: 2.78, rotation: 1.964 },
  // Wall 10: (-5.54, 12.20) → (-10.17, 8.58)
  { position: [-7.855, 2.5, 10.39] as [number, number, number], length: 5.88, rotation: -2.246 },
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
