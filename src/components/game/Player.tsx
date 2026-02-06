/**
 * Player Controller Component
 * Handles player movement and rendering
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Mesh } from 'three';

interface PlayerProps {
  position: [number, number, number];
  onPositionChange: (position: [number, number, number]) => void;
}

// Track pressed keys
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  shift: false,
};

export function Player({ position, onPositionChange }: PlayerProps) {
  const meshRef = useRef<Mesh>(null);
  const velocity = useRef(new Vector3());
  const WALK_SPEED = 5;
  const RUN_SPEED = 10;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) {
        keys[key as keyof typeof keys] = true;
      }
      if (e.key === 'Shift') {
        keys.shift = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) {
        keys[key as keyof typeof keys] = false;
      }
      if (e.key === 'Shift') {
        keys.shift = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const speed = keys.shift ? RUN_SPEED : WALK_SPEED;
    const direction = new Vector3();

    if (keys.w) direction.z -= 1;
    if (keys.s) direction.z += 1;
    if (keys.a) direction.x -= 1;
    if (keys.d) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      velocity.current.lerp(direction.multiplyScalar(speed), 0.2);
    } else {
      velocity.current.lerp(new Vector3(0, 0, 0), 0.2);
    }

    meshRef.current.position.x += velocity.current.x * delta;
    meshRef.current.position.z += velocity.current.z * delta;

    // Rotate player to face movement direction
    if (velocity.current.length() > 0.1) {
      const angle = Math.atan2(velocity.current.x, velocity.current.z);
      meshRef.current.rotation.y = angle;
    }

    // Report position change
    const pos = meshRef.current.position;
    onPositionChange([pos.x, pos.y, pos.z]);
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      {/* Body */}
      <boxGeometry args={[0.6, 1.2, 0.4]} />
      <meshStandardMaterial color="#4a90d9" />

      {/* Head */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f5d0a9" />
      </mesh>
    </mesh>
  );
}
