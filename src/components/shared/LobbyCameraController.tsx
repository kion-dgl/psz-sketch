import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

interface LobbyCameraControllerProps {
  target: { x: number; y: number; z: number };
  distance?: number;
  height?: number;
}

/**
 * Simple camera controller for lobby areas.
 * Uses keyboard-only horizontal rotation (arrow keys).
 * No mouse drag or pitch control - designed for areas with culling
 * that only work from one camera direction.
 */
export default function LobbyCameraController({
  target,
  distance = 6,
  height = 3
}: LobbyCameraControllerProps) {
  const { camera } = useThree();
  const rotationRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const rotationSpeed = 0.05;
      if (e.key === 'ArrowLeft') {
        rotationRef.current -= rotationSpeed;
      } else if (e.key === 'ArrowRight') {
        rotationRef.current += rotationSpeed;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useFrame(() => {
    const offsetX = Math.sin(rotationRef.current) * distance;
    const offsetZ = Math.cos(rotationRef.current) * distance;

    camera.position.x = target.x + offsetX;
    camera.position.y = target.y + height;
    camera.position.z = target.z + offsetZ;

    camera.lookAt(target.x, target.y + 1, target.z);
  });

  return null;
}
