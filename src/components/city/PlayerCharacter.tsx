import { useRef, useEffect, useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type { Character } from '../../stores/characterStore';

interface PlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
  spawnPosition?: [number, number, number];
  onInteraction?: (npcName: string) => void;
}

export default function PlayerCharacter({ character, onPositionChange, spawnPosition = [0.98, 10, 62.79], onInteraction }: PlayerCharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [rotation, setRotation] = useState(0); // Tank control rotation

  // Keyboard state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false
  });

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.forward = true; break;
        case 's': keys.current.backward = true; break;
        case 'a': keys.current.left = true; break;
        case 'd': keys.current.right = true; break;
        case 'e': keys.current.interact = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.forward = false; break;
        case 's': keys.current.backward = false; break;
        case 'a': keys.current.left = false; break;
        case 'd': keys.current.right = false; break;
        case 'e': keys.current.interact = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Character movement and interaction
  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const speed = 5;
    const rotationSpeed = 2; // radians per second

    // Get current velocity
    const currentVel = rigidBodyRef.current.linvel();

    // Tank controls: A/D rotate, W/S move forward/backward
    let newRotation = rotation;
    if (keys.current.left) {
      newRotation -= rotationSpeed * delta;
    }
    if (keys.current.right) {
      newRotation += rotationSpeed * delta;
    }
    setRotation(newRotation);

    // Calculate movement based on rotation
    const velocity = { x: 0, y: 0, z: 0 };
    if (keys.current.forward) {
      velocity.x = Math.sin(newRotation) * speed;
      velocity.z = Math.cos(newRotation) * speed;
    }
    if (keys.current.backward) {
      velocity.x = -Math.sin(newRotation) * speed;
      velocity.z = -Math.cos(newRotation) * speed;
    }

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
    if (!position) return; // Guard against undefined position in early frames

    onPositionChange({
      x: position.x,
      y: position.y,
      z: position.z
    });

    // TODO: Raycast to detect NPCs in front of player
    // Temporarily disabled - need to fix Rapier castRay API usage

    // Handle interaction (simplified for now)
    if (keys.current.interact) {
      console.log('Interact key pressed - raycast disabled temporarily');

      // Debounce interaction
      keys.current.interact = false;
    }
  });

  return (
    <group>
      <RigidBody
        ref={rigidBodyRef}
        position={spawnPosition}
        enabledRotations={[false, false, false]}
        lockRotations
      >
        {/* Simple cube for debugging - rotates to show facing direction */}
        <mesh castShadow rotation={[0, rotation, 0]}>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>

      {/* Red line indicator showing interaction raycast */}
      {rigidBodyRef.current && rigidBodyRef.current.translation() && (
        <mesh
          position={[
            rigidBodyRef.current.translation().x + Math.sin(rotation) * 1.5,
            rigidBodyRef.current.translation().y + 1,
            rigidBodyRef.current.translation().z + Math.cos(rotation) * 1.5
          ]}
          rotation={[
            Math.PI / 2, // Rotate 90 degrees to make cylinder horizontal
            0,
            rotation // Rotate around vertical axis to match player facing
          ]}
        >
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
