import { useRef, useEffect, useState } from 'react';
import { RigidBody, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type { Character } from '../../stores/characterStore';
import * as THREE from 'three';

interface PlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
  spawnPosition?: [number, number, number];
  onInteraction?: (npcName: string) => void;
}

export default function PlayerCharacter({ character, onPositionChange, spawnPosition = [0.98, 10, 62.79], onInteraction }: PlayerCharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { world } = useRapier();
  const [facingDirection, setFacingDirection] = useState(new THREE.Vector3(0, 0, -1));
  const lastMovement = useRef(new THREE.Vector3(0, 0, -1));

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

    // Update facing direction based on movement
    if (velocity.x !== 0 || velocity.z !== 0) {
      const newDirection = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
      lastMovement.current.copy(newDirection);
      setFacingDirection(newDirection);
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
    onPositionChange({
      x: position.x,
      y: position.y,
      z: position.z
    });

    // Raycast to detect NPCs in front of player
    const rayLength = 3;
    const rayOrigin = {
      x: position.x,
      y: position.y + 1, // Cast from player center height
      z: position.z
    };
    const rayDir = {
      x: lastMovement.current.x,
      y: 0,
      z: lastMovement.current.z
    };

    const ray = world.castRay(
      new THREE.Vector3(rayOrigin.x, rayOrigin.y, rayOrigin.z),
      new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z),
      rayLength,
      true
    );

    // Handle interaction
    if (keys.current.interact && ray) {
      const hit = ray.collider;
      const parent = hit.parent();

      if (parent) {
        const userData = parent.userData as { npcName?: string };

        // Log interaction for debugging
        console.log('Interacting with object at distance:', ray.timeOfImpact);
        console.log('Hit position:', {
          x: rayOrigin.x + rayDir.x * ray.timeOfImpact,
          y: rayOrigin.y,
          z: rayOrigin.z + rayDir.z * ray.timeOfImpact
        });

        if (userData?.npcName) {
          console.log(`Starting conversation with: ${userData.npcName}`);
          if (onInteraction) {
            onInteraction(userData.npcName);
          }
        } else {
          console.log('Interacting with non-NPC object');
        }
      }

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
        {/* Simple cube for debugging */}
        <mesh castShadow>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>

      {/* Red line indicator showing interaction raycast */}
      {rigidBodyRef.current && (
        <mesh
          position={[
            rigidBodyRef.current.translation().x + facingDirection.x * 1.5,
            rigidBodyRef.current.translation().y + 1,
            rigidBodyRef.current.translation().z + facingDirection.z * 1.5
          ]}
          rotation={[
            0,
            Math.atan2(facingDirection.x, facingDirection.z),
            0
          ]}
        >
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
