import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Character } from '../../stores/characterStore';
import * as THREE from 'three';
import { useCollision } from '../../collision';

// Player configuration
const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT = 2;
const PLAYER_HEIGHT_OFFSET = 1; // How high above floor the player center is

interface PlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number; rotation: number }) => void;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  onInteraction?: (npcName: string) => void;
}

export default function PlayerCharacter({
  character,
  onPositionChange,
  spawnPosition = [0.98, 1, 62.79],
  spawnRotation = 0,
  onInteraction
}: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const {
    resolveWallCollision,
    getFloorHeight,
    hasFloor,
    checkNPCProximity,
    updateTriggers
  } = useCollision();

  // Player state
  const position = useRef(new THREE.Vector3(spawnPosition[0], spawnPosition[1], spawnPosition[2]));
  const [rotation, setRotation] = useState(spawnRotation);
  const [npcDetected, setNpcDetected] = useState(false);
  const lastReportedPosition = useRef({ x: 0, y: 0, z: 0, rotation: 0 });

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
        case 'g': keys.current.debug = true; break;
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

  // Initialize position on spawn
  useEffect(() => {
    position.current.set(spawnPosition[0], spawnPosition[1], spawnPosition[2]);
    if (groupRef.current) {
      groupRef.current.position.copy(position.current);
    }
  }, [spawnPosition]);

  // Character movement and interaction
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const speed = 7;
    const rotationSpeed = 2; // radians per second

    // Debug ground check when G is pressed
    if (keys.current.debug) {
      const floorY = getFloorHeight(position.current.x, position.current.z);
      console.log('=== GROUND DEBUG ===');
      console.log('Position:', position.current.x.toFixed(2), position.current.y.toFixed(2), position.current.z.toFixed(2));
      console.log('Floor height:', floorY !== null ? floorY.toFixed(2) : 'NO FLOOR');
      console.log('Has floor:', hasFloor(position.current.x, position.current.z));
      keys.current.debug = false;
    }

    // Tank controls: A/D rotate, W/S move forward/backward
    let newRotation = rotation;
    if (keys.current.left) {
      newRotation += rotationSpeed * delta;
    }
    if (keys.current.right) {
      newRotation -= rotationSpeed * delta;
    }
    if (newRotation !== rotation) {
      setRotation(newRotation);
    }

    // Calculate movement based on rotation
    let velocityX = 0;
    let velocityZ = 0;

    if (keys.current.forward || keys.current.backward) {
      const direction = keys.current.forward ? 1 : -1;
      velocityX = -Math.sin(newRotation) * speed * direction * delta;
      velocityZ = -Math.cos(newRotation) * speed * direction * delta;
    }

    // Calculate intended position
    let intendedX = position.current.x + velocityX;
    let intendedZ = position.current.z + velocityZ;

    // Check if intended position has floor
    const intendedFloorY = getFloorHeight(intendedX, intendedZ);

    if (intendedFloorY === null) {
      // No floor at intended position - block movement
      intendedX = position.current.x;
      intendedZ = position.current.z;
    } else {
      // Check wall collision and apply slide
      const resolved = resolveWallCollision(
        { x: intendedX, z: intendedZ },
        PLAYER_RADIUS,
        { x: velocityX, z: velocityZ }
      );

      intendedX = resolved.position.x;
      intendedZ = resolved.position.z;

      // After wall resolution, check floor again
      const resolvedFloorY = getFloorHeight(intendedX, intendedZ);
      if (resolvedFloorY === null) {
        // Wall pushed us off the floor - revert
        intendedX = position.current.x;
        intendedZ = position.current.z;
      }
    }

    // Get final floor height and update position
    const finalFloorY = getFloorHeight(intendedX, intendedZ);
    const targetY = finalFloorY !== null
      ? finalFloorY + PLAYER_HEIGHT_OFFSET
      : position.current.y;

    // Update position
    position.current.set(intendedX, targetY, intendedZ);
    groupRef.current.position.copy(position.current);

    // Update triggers
    updateTriggers(position.current, PLAYER_RADIUS);

    // Report position changes (throttled)
    const threshold = 0.01;
    const last = lastReportedPosition.current;
    const posChanged =
      Math.abs(position.current.x - last.x) > threshold ||
      Math.abs(position.current.y - last.y) > threshold ||
      Math.abs(position.current.z - last.z) > threshold ||
      Math.abs(newRotation - last.rotation) > threshold;

    if (posChanged) {
      lastReportedPosition.current = {
        x: position.current.x,
        y: position.current.y,
        z: position.current.z,
        rotation: newRotation
      };
      onPositionChange({
        x: position.current.x,
        y: position.current.y,
        z: position.current.z,
        rotation: newRotation
      });
    }

    // NPC detection (check if facing an NPC within range)
    const facingX = -Math.sin(newRotation);
    const facingZ = -Math.cos(newRotation);

    const npcResult = checkNPCProximity(
      { x: position.current.x, z: position.current.z },
      { x: facingX, z: facingZ },
      3 // 3 unit range
    );

    if (npcResult) {
      if (!npcDetected) setNpcDetected(true);

      // Handle interaction when E is pressed
      if (keys.current.interact) {
        if (onInteraction) {
          onInteraction(npcResult.npc.name);
        }
        keys.current.interact = false;
      }
    } else {
      if (npcDetected) setNpcDetected(false);
    }

    // Clear interaction key if nothing to interact with
    if (keys.current.interact) {
      keys.current.interact = false;
    }
  });

  return (
    <group ref={groupRef} position={spawnPosition}>
      <group rotation={[0, rotation, 0]}>
        {/* Cylinder player matching NPC dimensions */}
        <mesh castShadow>
          <cylinderGeometry args={[PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>

        {/* Yellow line indicator - child of player so it rotates with player */}
        <mesh
          position={[0, 0.75, -1.5]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial
            color={npcDetected ? "#ffff00" : "#888800"}
            emissive={npcDetected ? "#ffff00" : "#888800"}
            emissiveIntensity={npcDetected ? 1.0 : 0.5}
          />
        </mesh>
      </group>
    </group>
  );
}
