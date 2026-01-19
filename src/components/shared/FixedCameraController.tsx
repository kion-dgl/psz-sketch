import { useFrame, useThree } from '@react-three/fiber';

interface FixedCameraControllerProps {
  target: { x: number; y: number; z: number };
  distance?: number;
  height?: number;
}

/**
 * Fixed third-person camera that always stays behind the player (at +Z).
 * Used for screen-relative movement where the camera doesn't rotate.
 */
export default function FixedCameraController({
  target,
  distance = 6,
  height = 4,
}: FixedCameraControllerProps) {
  const { camera } = useThree();

  useFrame(() => {
    // Camera is always at fixed position behind player (at +Z)
    const desiredX = target.x;
    const desiredY = target.y + height;
    const desiredZ = target.z + distance;

    // Smooth camera follow
    camera.position.x += (desiredX - camera.position.x) * 0.1;
    camera.position.y += (desiredY - camera.position.y) * 0.1;
    camera.position.z += (desiredZ - camera.position.z) * 0.1;

    // Look at player
    camera.lookAt(target.x, target.y + 0.5, target.z);
  });

  return null;
}
