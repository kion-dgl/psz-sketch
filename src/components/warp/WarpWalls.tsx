import { RigidBody, CylinderCollider } from '@react-three/rapier';

interface WarpWallsProps {
  visible?: boolean;
}

export default function WarpWalls({ visible = false }: WarpWallsProps) {
  // Invisible cylindrical barrier around the play area
  // Radius slightly larger than the walkable area to catch falling players
  const barrierRadius = 60;
  const barrierHeight = 100;

  return (
    <RigidBody
      type="fixed"
      position={[0, 0, 0]}
      collisionGroups={0x00010001}
      userData={{ type: 'barrier' }}
    >
      {/* Cylinder collider acts as invisible wall */}
      <CylinderCollider args={[barrierHeight / 2, barrierRadius]} />
      {visible && (
        <mesh>
          <cylinderGeometry args={[barrierRadius, barrierRadius, barrierHeight, 32]} />
          <meshStandardMaterial color="red" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </RigidBody>
  );
}
