import { useEffect } from 'react';
import { useCollision, type WallDefinition } from '../../collision';

// Define walls to keep player within counter boundaries
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 5;

const WALLS: WallDefinition[] = [
  // Wall 1: (2.71, 71.37) → (2.71, 12.48)
  { position: [2.71, 2.5, 41.925], length: 58.89, rotation: 0 },
  // Wall 2: (-2.57, 12.48) → (-2.57, 71.70)
  { position: [-2.57, 2.5, 42.09], length: 59.22, rotation: 0 },
  // Wall 3: (-2.41, 11.98) → (-5.04, 11.98)
  { position: [-3.725, 2.5, 11.98], length: 2.63, rotation: 1.571 },
  // Wall 4: (-10.58, 7.93) → (-8.27, 4.38)
  { position: [-9.425, 2.5, 6.155], length: 4.24, rotation: 2.579 },
  // Wall 5: (-8.27, 4.38) → (-8.27, 1.25)
  { position: [-8.27, 2.5, 2.815], length: 3.13, rotation: 0 },
  // Wall 6: (-8.27, 1.25) → (-11.65, 1.25)
  { position: [-9.96, 2.5, 1.25], length: 3.38, rotation: 1.571 },
  // Wall 7: (-11.65, 1.25) → (-11.65, -4.44)
  { position: [-11.65, 2.5, -1.595], length: 5.69, rotation: 0 },
  // Wall 8: (-11.65, -4.44) → (-5.13, -11.08) - Moved back towards counter
  { position: [-8.39, 2.5, -10.0], length: 9.31, rotation: 2.356 },
  // Wall 9: (-5.13, -11.08) → (-2.57, -12.15)
  { position: [-3.85, 2.5, -11.615], length: 2.78, rotation: 1.964 },
  // Wall 10: (-5.54, 12.20) → (-10.17, 8.58)
  { position: [-7.855, 2.5, 10.39], length: 5.88, rotation: -2.246 },
  // Wall 11: (3.46, 12.27) → (5.52, 12.27)
  { position: [4.49, 2.5, 12.27], length: 2.06, rotation: 1.571 },
  // Wall 12: (5.52, 12.27) → (12.71, 5.08)
  { position: [9.115, 2.5, 8.675], length: 10.17, rotation: -0.785 },
  // Wall 13: (12.71, 5.08) → (12.71, -4.98)
  { position: [12.71, 2.5, 0.05], length: 10.06, rotation: 0 },
  // Wall 14: (12.71, -4.98) → (10.65, -7.13)
  { position: [11.68, 2.5, -6.055], length: 2.98, rotation: -2.327 },
  // Wall 15: (10.65, -7.13) → (16.35, -12.42)
  { position: [13.5, 2.5, -9.775], length: 7.78, rotation: -0.750 },
  // Wall 16: (16.35, -12.42) → (12.62, -16.06)
  { position: [14.485, 2.5, -14.24], length: 5.21, rotation: -2.354 },
  // Wall 17: (12.62, -16.06) → (6.92, -10.69)
  { position: [9.77, 2.5, -13.375], length: 7.83, rotation: 2.394 },
  // Wall 18: (6.92, -10.69) → (5.10, -12.17)
  { position: [6.01, 2.5, -11.43], length: 2.35, rotation: -2.456 },
  // Wall 19: (5.10, -12.17) → (2.38, -12.17)
  { position: [3.74, 2.5, -12.17], length: 2.72, rotation: 1.571 },
  // Wall 20: (2.38, -12.17) → (2.38, -24.55)
  { position: [2.38, 2.5, -18.36], length: 12.38, rotation: 0 },
  // Wall 21: (-2.41, -24.55) → (-2.41, -12.88)
  { position: [-2.41, 2.5, -18.715], length: 11.67, rotation: 0 },
];

interface CounterWallsProps {
  visible?: boolean;
}

export default function CounterWalls({ visible = true }: CounterWallsProps) {
  const { registerWallFromDefinition } = useCollision();

  // Register all walls with collision system
  useEffect(() => {
    const unregisters = WALLS.map((wall, index) =>
      registerWallFromDefinition(wall, `counter-wall-${index}`)
    );

    return () => {
      unregisters.forEach(unregister => unregister());
    };
  }, [registerWallFromDefinition]);

  // Visual representation (optional, for debugging)
  if (!visible) return null;

  return (
    <>
      {WALLS.map((wall, index) => (
        <mesh
          key={index}
          position={wall.position}
          rotation={[0, wall.rotation, 0]}
        >
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, wall.length]} />
          <meshStandardMaterial color="yellow" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}
