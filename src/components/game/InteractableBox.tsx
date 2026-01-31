/**
 * Interactable Box Component
 * A box that can be opened to receive items
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface InteractableBoxProps {
  position: [number, number, number];
  playerPosition: [number, number, number];
  onInteract: () => void;
  opened: boolean;
}

export function InteractableBox({
  position,
  playerPosition,
  onInteract,
  opened,
}: InteractableBoxProps) {
  const meshRef = useRef<Mesh>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [hovered, setHovered] = useState(false);
  const INTERACTION_DISTANCE = 2;

  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate distance to player
    const dx = position[0] - playerPosition[0];
    const dz = position[2] - playerPosition[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    setIsNearby(distance < INTERACTION_DISTANCE);

    // Hover animation
    if (!opened) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(Date.now() / 500) * 0.05;
    }
  });

  const handleClick = () => {
    if (isNearby && !opened) {
      onInteract();
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={opened ? '#666666' : isNearby ? '#ffd700' : '#8b4513'}
          emissive={hovered && isNearby && !opened ? '#ffd700' : '#000000'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Interaction prompt */}
      {isNearby && !opened && (
        <sprite position={[position[0], position[1] + 1.2, position[2]]} scale={[1.5, 0.4, 1]}>
          <spriteMaterial color="#ffffff" opacity={0.9} transparent />
        </sprite>
      )}
    </group>
  );
}
