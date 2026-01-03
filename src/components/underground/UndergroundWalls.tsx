import { useEffect } from 'react';
import { useCollision, type WallDefinition } from '../../collision';

// Define walls to keep player within underground boundaries
const WALL_THICKNESS = 0.5;
const WALL_HEIGHT = 5;

const WALLS: WallDefinition[] = [
  // TODO: Add wall boundaries for underground area
];

interface UndergroundWallsProps {
  visible?: boolean;
}

export default function UndergroundWalls({ visible = true }: UndergroundWallsProps) {
  const { registerWallFromDefinition } = useCollision();

  // Register all walls with collision system
  useEffect(() => {
    const unregisters = WALLS.map((wall, index) =>
      registerWallFromDefinition(wall, `underground-wall-${index}`)
    );

    return () => {
      unregisters.forEach(unregister => unregister());
    };
  }, [registerWallFromDefinition]);

  // Visual representation (optional, for debugging)
  if (!visible || WALLS.length === 0) return null;

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
