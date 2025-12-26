import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

interface CameraControllerProps {
  target: { x: number; y: number; z: number };
  distance?: number;
  initialPitch?: number;
}

export default function CameraController({
  target,
  distance = 6,
  initialPitch = 0.3
}: CameraControllerProps) {
  const { camera, gl } = useThree();
  const rotationRef = useRef(0);
  const pitchRef = useRef(initialPitch);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const rotationSpeed = 0.05;
      if (e.key === 'ArrowLeft') {
        rotationRef.current -= rotationSpeed;
      } else if (e.key === 'ArrowRight') {
        rotationRef.current += rotationSpeed;
      } else if (e.key === 'ArrowUp') {
        pitchRef.current = Math.min(pitchRef.current + rotationSpeed, Math.PI / 2 - 0.1);
      } else if (e.key === 'ArrowDown') {
        pitchRef.current = Math.max(pitchRef.current - rotationSpeed, -Math.PI / 2 + 0.1);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastMouseX.current;
      const deltaY = e.clientY - lastMouseY.current;
      const rotationSpeed = 0.005;

      rotationRef.current -= deltaX * rotationSpeed;
      pitchRef.current = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, pitchRef.current + deltaY * rotationSpeed)
      );

      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    const canvas = gl.domElement;
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl]);

  useFrame(() => {
    const horizontalDist = Math.cos(pitchRef.current) * distance;
    const height = Math.sin(pitchRef.current) * distance;

    const offsetX = Math.sin(rotationRef.current) * horizontalDist;
    const offsetZ = Math.cos(rotationRef.current) * horizontalDist;

    camera.position.x = target.x + offsetX;
    camera.position.y = target.y + 1 + height;
    camera.position.z = target.z + offsetZ;

    camera.lookAt(target.x, target.y + 1, target.z);
  });

  return null;
}
