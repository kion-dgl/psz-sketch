import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Define walls to keep player within warp boundaries
// Format: { position: [x, y, z], size: [thickness, height, length], rotation: angle in radians }
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 5;

const WALLS = [
  // Wall 1: (2.46, 1.00, 17.59) → (2.46, 1.00, 11.08)
  { position: [2.46, 2.5, 14.335] as [number, number, number], length: 6.51, rotation: 0 },
  // Wall 2: (2.46, 1.00, 11.08) → (4.76, 1.00, 10.76)
  { position: [3.61, 2.5, 10.92] as [number, number, number], length: 2.32, rotation: 1.708 },
  // Wall 3: (4.76, 1.00, 10.76) → (10.51, 1.00, 4.61)
  { position: [7.635, 2.5, 7.685] as [number, number, number], length: 8.42, rotation: 2.379 },
  // Wall 4: (10.51, 1.00, 4.61) → (10.22, 1.00, -3.96)
  { position: [10.365, 2.5, 0.325] as [number, number, number], length: 8.57, rotation: -3.108 },
  // Wall 5: (10.22, 1.00, -3.96) → (4.21, 1.00, -10.72)
  { position: [7.215, 2.5, -7.34] as [number, number, number], length: 9.05, rotation: -2.419 },
  // Wall 6: (4.21, 1.00, -10.72) → (-4.66, 1.00, -10.91)
  { position: [-0.225, 2.5, -10.815] as [number, number, number], length: 8.87, rotation: -1.592 },
  // Wall 7: (-4.66, 1.00, -10.91) → (-10.55, 1.00, -4.45)
  { position: [-7.605, 2.5, -7.68] as [number, number, number], length: 8.74, rotation: -0.738 },
  // Wall 8: (-10.55, 1.00, -4.45) → (-10.55, 1.00, 4.43)
  { position: [-10.55, 2.5, -0.01] as [number, number, number], length: 8.88, rotation: 0 },
  // Wall 9: (-10.55, 1.00, 4.43) → (-4.71, 1.00, 10.65)
  { position: [-7.63, 2.5, 7.54] as [number, number, number], length: 8.53, rotation: 0.756 },
  // Wall 10: (-4.71, 1.00, 10.65) → (-2.52, 1.00, 11.29)
  { position: [-3.615, 2.5, 10.97] as [number, number, number], length: 2.28, rotation: 1.283 },
  // Wall 11: (-2.52, 1.00, 11.29) → (-2.52, 1.00, 17.50)
  { position: [-2.52, 2.5, 14.395] as [number, number, number], length: 6.21, rotation: 0 },
];

interface WarpWallsProps {
  visible?: boolean;
}

export default function WarpWalls({ visible = true }: WarpWallsProps) {
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
