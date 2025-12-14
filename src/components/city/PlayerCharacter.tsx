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
    let canMove = true;

    if (keys.current.forward || keys.current.backward) {
      const direction = keys.current.forward ? 1 : -1;
      const moveX = -Math.sin(newRotation) * speed * direction;
      const moveZ = -Math.cos(newRotation) * speed * direction;

      // Get current position
      const position = rigidBodyRef.current.translation();

      // Calculate intended position (check a bit ahead to predict movement)
      const checkDistance = 0.5; // Check 0.5 units ahead
      const intendedX = position.x + (moveX / speed) * checkDistance;
      const intendedZ = position.z + (moveZ / speed) * checkDistance;

      // Raycast downward from intended position to check for ground
      try {
        const rayOrigin = {
          x: intendedX,
          y: position.y + 1, // Start ray from above player
          z: intendedZ
        };
        const rayDirection = { x: 0, y: -1, z: 0 }; // Downward
        const rayLength = 5; // Check 5 units down

        const groundCheck = world.castRay(
          { origin: rayOrigin, dir: rayDirection },
          rayLength,
          true,
          undefined,
          0x00030003, // Only check for ground collision group
          undefined,
          undefined
        );

        // Only allow movement if ground is detected
        if (groundCheck) {
          velocity.x = moveX;
          velocity.z = moveZ;
          // Debug: Log when ground is detected
          if (Math.random() < 0.01) { // Only log 1% of the time to avoid spam
            console.log('[Ground Check] Ground found at distance:', groundCheck.timeOfImpact);
          }
        } else {
          canMove = false;
          console.log('[Ground Check] NO GROUND - blocking movement at', intendedX.toFixed(2), intendedZ.toFixed(2));
        }
      } catch (error) {
        // If raycast fails, allow movement (safer than blocking)
        velocity.x = moveX;
        velocity.z = moveZ;
      }
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

      // Debug raycast - Disabled
      // const debugRay = world.castRay(
      //   { origin: rayOrigin, dir: rayDirection },
      //   rayLength,
      //   true,
      //   undefined, // filterFlags
      //   undefined, // filterGroups - hit EVERYTHING
      //   undefined, // filterExcludeCollider
      //   rigidBodyRef.current // filterExcludeRigidBody - exclude player
      // );

      // if (debugRay) {
      //   const debugParent = debugRay.collider.parent();
      //   const groups = debugRay.collider.collisionGroups();
      //   const userData = debugParent?.userData;

      //   // Decode collision group
      //   let groupName = 'UNKNOWN';
      //   if (groups === 0x00010001) groupName = 'WALL';
      //   else if (groups === 0x00020002) groupName = 'NPC';
      //   else if (groups === 0x00030003) groupName = 'GROUND';
      //   else if (groups === 0x00040004) groupName = 'TRIGGER';

      //   console.log(`[Ray] ${groupName} at distance ${debugRay.timeOfImpact.toFixed(2)} | Groups: 0x${groups.toString(16)} | userData:`, userData);
      // }

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
      // Debug collision logging - ENABLED for debugging
      onCollisionEnter={(event) => {
        const parent = event.other.parent();
        const collisionGroups = event.other.collisionGroups();
        console.log('=== Player Collision ===');
        console.log('Collision groups (hex):', '0x' + collisionGroups.toString(16));
        console.log('RigidBody userData:', parent?.userData);
        console.log('Collider type:', event.other.collider?.type);
        console.log('Collider shape:', event.other.collider?.shape?.type);
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
