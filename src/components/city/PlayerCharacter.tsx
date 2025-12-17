import { useRef, useEffect, useState } from 'react';
import { RigidBody, useRapier, CylinderCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type { Character } from '../../stores/characterStore';
import * as THREE from 'three';

interface PlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number; rotation: number }) => void;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  onInteraction?: (npcName: string) => void;
}

export default function PlayerCharacter({ character, onPositionChange, spawnPosition = [0.98, 10, 62.79], spawnRotation = 0, onInteraction }: PlayerCharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { world } = useRapier();
  const [rotation, setRotation] = useState(spawnRotation); // Tank control rotation
  const [npcDetected, setNpcDetected] = useState(false); // Track if NPC is in range
  const hasErrored = useRef(false); // Prevent error spam
  const debugLineRef = useRef<THREE.Line | null>(null);

  // Keyboard state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
    debug: false
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
        case 'g': keys.current.debug = true; break; // Debug ground check
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.forward = false; break;
        case 's': keys.current.backward = false; break;
        case 'a': keys.current.left = false; break;
        case 'd': keys.current.right = false; break;
        case 'e': keys.current.interact = false; break;
        case 'g': keys.current.debug = false; break;
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

    // Debug ground check when G is pressed
    if (keys.current.debug) {
      const position = rigidBodyRef.current.translation();
      // console.log('=== GROUND DEBUG (Press G) ===');
      // console.log('Player position:', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2));
      // console.log('Player velocity:', currentVel.x.toFixed(2), currentVel.y.toFixed(2), currentVel.z.toFixed(2));

      // Cast rays in multiple directions
      const rayDown = { x: 0, y: -1, z: 0 };

      // Test 1: Ray filtered to GROUND GROUP ONLY (0x00030003)
      const groundOnlyRay = world.castRay(
        { origin: { x: position.x, y: position.y + 0.5, z: position.z }, dir: rayDown },
        20,
        true,
        undefined,
        0x00030003, // Only check ground collision group
        undefined,
        rigidBodyRef.current
      );

      // Test 2: Ray that hits EVERYTHING (except player)
      const allRay = world.castRay(
        { origin: { x: position.x, y: position.y + 0.5, z: position.z }, dir: rayDown },
        20,
        true,
        undefined,
        undefined, // Hit EVERYTHING
        undefined,
        rigidBodyRef.current
      );

      // console.log('--- Ground Group Ray (0x00030003) ---');
      // if (groundOnlyRay) {
      //   const collider = groundOnlyRay.collider;
      //   const parent = collider.parent();
      //   console.log('GROUND HIT at distance:', groundOnlyRay.timeOfImpact.toFixed(3));
      //   console.log('  Hit Y position:', (position.y + 0.5 - groundOnlyRay.timeOfImpact).toFixed(3));
      //   console.log('  Collision groups:', '0x' + collider.collisionGroups().toString(16));
      //   console.log('  UserData:', parent?.userData);
      //   console.log('  Shape type:', collider.shape?.type);
      // } else {
      //   console.log('GROUND MISS - TrimeshCollider not detected!');
      // }

      // console.log('--- All Collision Ray ---');
      // if (allRay) {
      //   const collider = allRay.collider;
      //   const parent = collider.parent();
      //   console.log('HIT at distance:', allRay.timeOfImpact.toFixed(3));
      //   console.log('  Hit Y position:', (position.y + 0.5 - allRay.timeOfImpact).toFixed(3));
      //   console.log('  Collision groups:', '0x' + collider.collisionGroups().toString(16));
      //   console.log('  UserData:', parent?.userData);
      //   console.log('  Shape type:', collider.shape?.type);
      // } else {
      //   console.log('MISS - no collision beneath player at all!');
      // }

      keys.current.debug = false; // Reset
    }

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
        const rayLength = 10; // Check 10 units down

        // Also raycast from current position to see what we're standing on
        const currentPosRay = world.castRay(
          { origin: { x: position.x, y: position.y + 1, z: position.z }, dir: rayDirection },
          rayLength,
          true,
          undefined,
          0x00030003,
          undefined,
          rigidBodyRef.current // EXCLUDE PLAYER
        );

        const groundCheck = world.castRay(
          { origin: rayOrigin, dir: rayDirection },
          rayLength,
          true,
          undefined,
          0x00030003, // Only check for ground collision group
          undefined,
          rigidBodyRef.current // EXCLUDE PLAYER
        );

        // Log current ground status periodically
        // if (Math.random() < 0.02) { // Log 2% of frames
        //   console.log('[Ground Status]');
        //   console.log('  Player at:', position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2));
        //   console.log('  Current ground ray:', currentPosRay ? `HIT at ${currentPosRay.timeOfImpact.toFixed(2)}` : 'NO HIT');
        //   console.log('  Intended pos:', intendedX.toFixed(2), intendedZ.toFixed(2));
        //   console.log('  Intended ground ray:', groundCheck ? `HIT at ${groundCheck.timeOfImpact.toFixed(2)}` : 'NO HIT');
        // }

        // Only allow movement if ground is detected
        if (groundCheck) {
          velocity.x = moveX;
          velocity.z = moveZ;
        } else {
          canMove = false;
          // console.log('[Ground Check] NO GROUND AHEAD - blocking at', intendedX.toFixed(2), intendedZ.toFixed(2));
        }
      } catch (error) {
        console.error('[Ground Check] Raycast error:', error);
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
      collisionGroups={0xFFFFFFFF}
      // Debug collision logging - ENABLED for debugging
      onCollisionEnter={(event) => {
        // const parent = event.other.parent();
        // const collisionGroups = event.other.collisionGroups();
        // console.log('=== Player Collision ===');
        // console.log('Collision groups (hex):', '0x' + collisionGroups.toString(16));
        // console.log('RigidBody userData:', parent?.userData);
        // console.log('Collider type:', event.other.collider?.type);
        // console.log('Collider shape:', event.other.collider?.shape?.type);
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
