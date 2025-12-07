import { useRef, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type { Character } from '../../stores/characterStore';

interface PlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
}

export default function PlayerCharacter({ character, onPositionChange }: PlayerCharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  // Keyboard state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.forward = true; break;
        case 's': keys.current.backward = true; break;
        case 'a': keys.current.left = true; break;
        case 'd': keys.current.right = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.forward = false; break;
        case 's': keys.current.backward = false; break;
        case 'a': keys.current.left = false; break;
        case 'd': keys.current.right = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Character movement
  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const velocity = { x: 0, y: 0, z: 0 };
    const speed = 5;

    // Get current velocity
    const currentVel = rigidBodyRef.current.linvel();

    // Calculate desired horizontal velocity
    if (keys.current.forward) velocity.z -= speed;
    if (keys.current.backward) velocity.z += speed;
    if (keys.current.left) velocity.x -= speed;
    if (keys.current.right) velocity.x += speed;

    // Set velocity (preserve Y for gravity)
    rigidBodyRef.current.setLinvel(
      {
        x: velocity.x,
        y: currentVel.y,
        z: velocity.z
      },
      true
    );

    // Update position display
    const position = rigidBodyRef.current.translation();
    onPositionChange({
      x: position.x,
      y: position.y,
      z: position.z
    });
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0.98, 10, 62.79]}
      enabledRotations={[false, false, false]}
      lockRotations
    >
      {/* Simple cube for debugging */}
      <mesh castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </RigidBody>
  );
}
