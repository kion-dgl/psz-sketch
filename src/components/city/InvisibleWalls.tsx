import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Define walls to keep player within market boundaries
// Format: { position: [x, y, z], size: [thickness, height, length], rotation: angle in radians }
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 5;

const WALLS = [
  // Right side walls
  // Wall 1: (10.72, 65.35) → (7.24, 55.35)
  { position: [8.98, 2.5, 60.35] as [number, number, number], length: 10.59, rotation: 0.335 },
  // Wall 2: (7.24, 55.35) → (7.82, 46.77)
  { position: [7.53, 2.5, 51.06] as [number, number, number], length: 8.60, rotation: -0.067 },
  // Wall 3: (7.82, 46.77) → (5.02, 46.77)
  { position: [6.42, 2.5, 46.77] as [number, number, number], length: 2.80, rotation: 1.571 },
  // Wall 4: (5.02, 46.53) → (5.02, 39.43)
  { position: [5.02, 2.5, 42.98] as [number, number, number], length: 7.10, rotation: 0 },
  // Wall 5: (4.94, 39.43) → (7.41, 39.43)
  { position: [6.175, 2.5, 39.43] as [number, number, number], length: 2.47, rotation: 1.571 },
  // Wall 6: (7.41, 39.43) → (9.94, 30.77)
  { position: [8.675, 2.5, 35.10] as [number, number, number], length: 9.02, rotation: 0.284 },
  // Wall 7: (9.94, 30.77) → (8.45, 25.98)
  { position: [9.195, 2.5, 28.375] as [number, number, number], length: 5.02, rotation: 0.301 },
  // Wall 8: (8.45, 25.98) → (9.03, 22.93)
  { position: [8.74, 2.5, 24.455] as [number, number, number], length: 3.10, rotation: -0.187 },
  // Wall 9: (9.03, 22.93) → (4.77, 16.43)
  { position: [6.90, 2.5, 19.68] as [number, number, number], length: 7.80, rotation: 0.575 },

  // Left side walls
  // Wall 10: (-20.30, 63.23) → (-18.48, 57.12)
  { position: [-19.39, 2.5, 60.175] as [number, number, number], length: 6.38, rotation: -0.289 },
  // Wall 11: (-18.48, 57.12) → (-13.52, 52.65)
  { position: [-16.00, 2.5, 54.885] as [number, number, number], length: 6.68, rotation: -0.833 },
  // Wall 12: (-13.52, 52.65) → (-8.15, 49.59)
  { position: [-10.835, 2.5, 51.12] as [number, number, number], length: 6.18, rotation: -1.054 },
  // Wall 13: (-8.15, 49.59) → (-4.43, 46.95)
  { position: [-6.29, 2.5, 48.27] as [number, number, number], length: 4.56, rotation: -0.954 },
  // Wall 14: (-4.43, 46.95) → (-4.68, 39.27)
  { position: [-4.555, 2.5, 43.11] as [number, number, number], length: 7.68, rotation: 0.033 },
  // Wall 15: (-4.68, 39.27) → (-8.15, 38.69)
  { position: [-6.415, 2.5, 38.98] as [number, number, number], length: 3.52, rotation: 1.405 },
  // Wall 16: (-8.15, 38.69) → (-14.51, 36.21)
  { position: [-11.33, 2.5, 37.45] as [number, number, number], length: 6.83, rotation: 1.192 },
  // Wall 17: (-14.51, 36.21) → (-19.21, 34.39)
  { position: [-16.86, 2.5, 35.30] as [number, number, number], length: 5.04, rotation: 1.195 },
  // Wall 18: (-19.21, 34.39) → (-17.89, 30.18)
  { position: [-18.55, 2.5, 32.285] as [number, number, number], length: 4.41, rotation: -0.304 },
  // Wall 19: (-17.89, 29.02) → (-11.87, 29.02)
  { position: [-14.88, 2.5, 29.02] as [number, number, number], length: 6.02, rotation: 1.571 },
  // Wall 20: (-11.87, 29.02) → (-10.63, 24.90)
  { position: [-11.25, 2.5, 26.96] as [number, number, number], length: 4.30, rotation: -0.294 },
  // Wall 21: (-10.63, 24.90) → (-9.72, 21.35)
  { position: [-10.175, 2.5, 23.125] as [number, number, number], length: 3.67, rotation: -0.251 },
  // Wall 22: (-9.72, 21.35) → (-4.02, 14.82)
  { position: [-6.87, 2.5, 18.085] as [number, number, number], length: 8.67, rotation: -0.719 },

  // North side walls
  // Wall 23: (10.10, 66.33) → (-0.87, 67.24)
  { position: [4.615, 2.5, 66.785] as [number, number, number], length: 11.01, rotation: -1.488 },
  // Wall 24: (-0.29, 67.24) → (-8.62, 66.49)
  { position: [-4.455, 2.5, 66.865] as [number, number, number], length: 8.36, rotation: -1.661 },
  // Wall 25: (-9.03, 66.49) → (-20.07, 63.80)
  { position: [-14.55, 2.5, 65.145] as [number, number, number], length: 11.36, rotation: -1.811 },
];

interface InvisibleWallsProps {
  visible?: boolean;
}

export default function InvisibleWalls({ visible = true }: InvisibleWallsProps) {
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
