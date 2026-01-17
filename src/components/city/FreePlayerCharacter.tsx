import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Character } from '../../stores/characterStore';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';

// Player configuration
const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT_OFFSET = 1;

// Map class IDs to their body type for animations
const GENDER_MAP: Record<string, 'm' | 'w'> = {
  humar: 'm', hucast: 'm', ramar: 'm', racast: 'm', fomar: 'm', hunewm: 'm', fonewm: 'm',
  humarl: 'w', hucaseal: 'w', ramarl: 'w', racaseal: 'w', fomarl: 'w', hunewearl: 'w', fonewearl: 'w',
};

// Map class IDs to their PC prefix for model/texture paths
const CLASS_TO_PC_PREFIX: Record<string, string> = {
  humar: 'pc_00', humarl: 'pc_01', ramar: 'pc_02', ramarl: 'pc_03',
  fomar: 'pc_04', fomarl: 'pc_05', hunewm: 'pc_06', hunewearl: 'pc_07',
  fonewm: 'pc_08', fonewearl: 'pc_09', hucast: 'pc_10', hucaseal: 'pc_11',
  racast: 'pc_12', racaseal: 'pc_13',
};

// Lobby animation name mapping
const ANIMATION_MAP: Record<string, string> = {
  'pmbn_wait': 'idle',
  'pmsa_run': 'run',
};

interface FreePlayerCharacterProps {
  character: Character;
  onPositionChange: (position: { x: number; y: number; z: number; rotation: number }) => void;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  onInteraction?: (npcName: string) => void;
}

export default function FreePlayerCharacter({
  character,
  onPositionChange,
  spawnPosition = [0.98, 1, 62.79],
  spawnRotation = 0,
  onInteraction
}: FreePlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const animationsRef = useRef<Map<string, THREE.AnimationClip>>(new Map());

  const {
    resolveWallCollision,
    getFloorHeight,
    checkNPCProximity,
    updateTriggers
  } = useCollision();

  // Build paths based on character class
  const classId = character.class_id || 'humar';
  const gender = GENDER_MAP[classId] || 'm';
  const pcPrefix = CLASS_TO_PC_PREFIX[classId] || 'pc_00';
  const variation = `${pcPrefix}0`;

  const modelPath = `/player/${variation}/${variation}/${variation}_000.glb`;
  const texturePath = `/player/${variation}/textures/${variation}_000.png`;
  const animationPath = `/player/animations/lobby/${gender}/99_lobby_${gender}/pc_000_000.glb`;

  // Load model
  const { scene: modelScene } = useGLTF(modelPath);

  // Load animations
  const { animations: lobbyAnimations } = useGLTF(animationPath);

  // Load texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(texturePath);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [texturePath]);

  // Clone and setup model
  const clonedModel = useMemo(() => {
    const clone = SkeletonUtils.clone(modelScene);

    // Apply texture
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.map = texture;
          mat.needsUpdate = true;
          mesh.material = mat;
        }
      }
    });

    return clone;
  }, [modelScene, texture]);

  // Player state
  const position = useRef(new THREE.Vector3(spawnPosition[0], spawnPosition[1], spawnPosition[2]));
  const rotation = useRef(spawnRotation);
  const [npcDetected, setNpcDetected] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const lastReportedPosition = useRef({ x: 0, y: 0, z: 0, rotation: 0 });

  // Keyboard state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
  });

  // Setup mixer and animations
  useEffect(() => {
    if (!clonedModel || !lobbyAnimations) return;

    modelRef.current = clonedModel;
    const mixer = new THREE.AnimationMixer(clonedModel);
    mixerRef.current = mixer;

    // Map animations
    const animMap = new Map<string, THREE.AnimationClip>();
    for (const clip of lobbyAnimations) {
      animMap.set(clip.name, clip);
    }
    animationsRef.current = animMap;

    // Start with idle animation
    playAnimation('idle');

    return () => {
      mixer.stopAllAction();
    };
  }, [clonedModel, lobbyAnimations]);

  // Play animation helper
  const playAnimation = (name: string) => {
    if (!mixerRef.current) return;

    // Find animation clip by mapped name
    let clip: THREE.AnimationClip | undefined;
    for (const [gameName, mappedName] of Object.entries(ANIMATION_MAP)) {
      if (mappedName === name) {
        clip = animationsRef.current.get(gameName);
        break;
      }
    }

    if (!clip) return;

    // Fade out current action
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.15);
    }

    // Play new action
    const action = mixerRef.current.clipAction(clip);
    action.reset();
    action.fadeIn(0.15);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();

    currentActionRef.current = action;
  };

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

  // Initialize position on spawn
  useEffect(() => {
    position.current.set(spawnPosition[0], spawnPosition[1], spawnPosition[2]);
    if (groupRef.current) {
      groupRef.current.position.copy(position.current);
    }
  }, [spawnPosition]);

  // Character movement and animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update animation mixer
    if (mixerRef.current) {
      const cappedDelta = Math.min(delta, 1 / 30);
      mixerRef.current.update(cappedDelta);
    }

    const speed = 7;
    const rotateSpeed = 10; // Rotation interpolation speed

    // Screen-relative movement
    let moveX = 0;
    let moveZ = 0;

    // W = forward (-Z), S = back (+Z), A = left (-X), D = right (+X)
    if (keys.current.forward) { moveZ -= 1; }
    if (keys.current.backward) { moveZ += 1; }
    if (keys.current.left) { moveX -= 1; }
    if (keys.current.right) { moveX += 1; }

    const moving = moveX !== 0 || moveZ !== 0;

    if (moving) {
      // Normalize movement
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (length > 0) {
        moveX /= length;
        moveZ /= length;
      }

      // Calculate velocity
      const velocityX = moveX * speed * delta;
      const velocityZ = moveZ * speed * delta;

      // Rotate character to face movement direction
      const targetRotation = Math.atan2(moveX, moveZ);
      let rotDiff = targetRotation - rotation.current;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      rotation.current += rotDiff * rotateSpeed * delta;

      // Calculate intended position
      let intendedX = position.current.x + velocityX;
      let intendedZ = position.current.z + velocityZ;

      // Check if intended position has floor
      const intendedFloorY = getFloorHeight(intendedX, intendedZ);

      if (intendedFloorY === null) {
        intendedX = position.current.x;
        intendedZ = position.current.z;
      } else {
        // Check wall collision
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
    }

    // Apply position and rotation to group
    groupRef.current.position.copy(position.current);
    groupRef.current.rotation.y = rotation.current;

    // Handle animation state changes
    if (moving !== isMoving) {
      setIsMoving(moving);
      playAnimation(moving ? 'run' : 'idle');
    }

    // Update triggers
    updateTriggers(position.current, PLAYER_RADIUS);

    // Report position changes
    const threshold = 0.01;
    const last = lastReportedPosition.current;
    const posChanged =
      Math.abs(position.current.x - last.x) > threshold ||
      Math.abs(position.current.y - last.y) > threshold ||
      Math.abs(position.current.z - last.z) > threshold ||
      Math.abs(rotation.current - last.rotation) > threshold;

    if (posChanged) {
      lastReportedPosition.current = {
        x: position.current.x,
        y: position.current.y,
        z: position.current.z,
        rotation: rotation.current
      };
      onPositionChange({
        x: position.current.x,
        y: position.current.y,
        z: position.current.z,
        rotation: rotation.current
      });
    }

    // NPC detection (use facing direction for detection)
    const facingX = Math.sin(rotation.current);
    const facingZ = Math.cos(rotation.current);

    const npcResult = checkNPCProximity(
      { x: position.current.x, z: position.current.z },
      { x: facingX, z: facingZ },
      3
    );

    if (npcResult) {
      if (!npcDetected) setNpcDetected(true);

      if (keys.current.interact) {
        if (onInteraction) {
          onInteraction(npcResult.npc.name);
        }
        keys.current.interact = false;
      }
    } else {
      if (npcDetected) setNpcDetected(false);
    }

    if (keys.current.interact) {
      keys.current.interact = false;
    }
  });

  return (
    <group ref={groupRef} position={spawnPosition}>
      {/* Player model - rotated 180 degrees to face forward */}
      <primitive object={clonedModel} position={[0, -1, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

// Preload default model and animations
useGLTF.preload('/player/pc_000/pc_000/pc_000_000.glb');
useGLTF.preload('/player/animations/lobby/m/99_lobby_m/pc_000_000.glb');
