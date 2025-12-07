import { useRef, useEffect, useState } from 'react';
import { RigidBody, useRapier, CylinderCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type { Character } from '../../stores/characterStore';

interface PlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number; rotation: number }) => void;
  spawnPosition?: [number, number, number];
  onInteraction?: (npcName: string) => void;
}

export default function PlayerCharacter({ character, onPositionChange, spawnPosition = [0.98, 10, 62.79], onInteraction }: PlayerCharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { world } = useRapier();
  const [rotation, setRotation] = useState(0); // Tank control rotation
  const [npcDetected, setNpcDetected] = useState(false); // Track if NPC is in range
  const hasErrored = useRef(false); // Prevent error spam

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

    const speed = 7;
    const rotationSpeed = 2; // radians per second

    // Get current velocity
    const currentVel = rigidBodyRef.current.linvel();

    // Tank controls: A/D rotate, W/S move forward/backward
    let newRotation = rotation;
    if (keys.current.left) {
      newRotation += rotationSpeed * delta;
    }
    if (keys.current.right) {
      newRotation -= rotationSpeed * delta;
    }
    setRotation(newRotation);

    // Calculate movement based on rotation
    // Red line points in -Z direction, so negate to move forward
    const velocity = { x: 0, y: 0, z: 0 };
    if (keys.current.forward) {
      velocity.x = -Math.sin(newRotation) * speed;
      velocity.z = -Math.cos(newRotation) * speed;
    }
    if (keys.current.backward) {
      velocity.x = Math.sin(newRotation) * speed;
      velocity.z = Math.cos(newRotation) * speed;
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
      z: position.z,
      rotation: newRotation
    });

    // Raycast to detect NPCs in front of player
    try {
      const rayLength = 3;

      // Calculate ray direction (normalized)
      const dirX = -Math.sin(newRotation);
      const dirZ = -Math.cos(newRotation);
      const dirLength = Math.sqrt(dirX * dirX + dirZ * dirZ);

      // Rapier expects plain objects, not THREE.Vector3
      const rayOrigin = {
        x: position.x,
        y: position.y + 0.75,
        z: position.z
      };
      const rayDirection = {
        x: dirX / dirLength,
        y: 0,
        z: dirZ / dirLength
      };

      // Cast ray with NO filter to see what's actually in front of player
      const debugRay = world.castRay(
        { origin: rayOrigin, dir: rayDirection },
        rayLength,
        true,
        undefined, // filterFlags
        undefined, // filterGroups - hit EVERYTHING
        undefined, // filterExcludeCollider
        rigidBodyRef.current // filterExcludeRigidBody - exclude player
      );

      if (debugRay) {
        const debugParent = debugRay.collider.parent();
        const groups = debugRay.collider.collisionGroups();
        const userData = debugParent?.userData;

        // Decode collision group
        let groupName = 'UNKNOWN';
        if (groups === 0x00010001) groupName = 'WALL';
        else if (groups === 0x00020002) groupName = 'NPC';
        else if (groups === 0x00030003) groupName = 'GROUND';
        else if (groups === 0x00040004) groupName = 'TRIGGER';

        console.log(`[Ray] ${groupName} at distance ${debugRay.timeOfImpact.toFixed(2)} | Groups: 0x${groups.toString(16)} | userData:`, userData);
      }

      // Cast ray with filter to exclude the player's own collider and walls
      // Only hit collision group 1 (NPCs), not group 0 (walls)
      const ray = world.castRay(
        { origin: rayOrigin, dir: rayDirection },
        rayLength,
        true,
        undefined, // filterFlags
        0x00020002, // filterGroups - only hit group 1 (NPCs)
        undefined, // filterExcludeCollider
        rigidBodyRef.current // filterExcludeRigidBody - exclude player
      );

      // Update NPC detection state
      if (ray) {
        const hit = ray.collider;
        const parent = hit.parent();
        const userData = parent?.userData as { npcName?: string } | undefined;

        if (userData?.npcName) {
          setNpcDetected(true);

          // Handle interaction when E is pressed
          if (keys.current.interact) {
            console.log(`Starting conversation with: ${userData.npcName}`);
            if (onInteraction) {
              onInteraction(userData.npcName);
            }
            keys.current.interact = false;
          }
        } else {
          setNpcDetected(false);
        }
      } else {
        setNpcDetected(false);
      }
    } catch (error) {
      if (!hasErrored.current) {
        console.error('Raycast error:', error);
        console.log('Position:', position);
        console.log('Rotation:', newRotation);
        hasErrored.current = true;
      }
      setNpcDetected(false);
    }

    // Debounce interaction if pressed but nothing hit
    if (keys.current.interact) {
      keys.current.interact = false;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={spawnPosition}
      enabledRotations={[false, false, false]}
      lockRotations
      onCollisionEnter={(event) => {
        const parent = event.other.parent();
        const collisionGroups = event.other.collisionGroups();
        console.log('=== Player Collision ===');
        console.log('Collision groups (hex):', '0x' + collisionGroups.toString(16));
        console.log('RigidBody userData:', parent?.userData);
        console.log('RigidBodyObject name:', event.other.rigidBodyObject?.name);
        console.log('ColliderObject name:', event.other.colliderObject?.name);
        console.log('Full event:', event.other);
      }}
    >
      {/* Cylinder collider matching NPC dimensions */}
      <CylinderCollider args={[1, 0.5]} />

      <group rotation={[0, rotation, 0]}>
        {/* Cylinder player matching NPC dimensions */}
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>

        {/* Yellow line indicator - child of player so it rotates with player */}
        <mesh
          position={[0, 0.75, -1.5]} // Position in front of player (local coordinates)
          rotation={[Math.PI / 2, 0, 0]} // Rotate to make horizontal
        >
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial
            color={npcDetected ? "#ffff00" : "#888800"}
            emissive={npcDetected ? "#ffff00" : "#888800"}
            emissiveIntensity={npcDetected ? 1.0 : 0.5}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
