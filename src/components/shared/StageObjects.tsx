import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useCollision } from '../../collision';

type GateEdge = 'north' | 'south' | 'east' | 'west';
type BoxType = 'valley_cont' | 'valley_recont';
type SwitchType = 'valley_switchf';

export interface GateConfig {
  id?: string; // Unique identifier for switch targeting
  edge: GateEdge;
  x: number;
  z: number;
  scale: number;
  label?: string;
  animated?: boolean;
  blocked?: boolean; // Adds collision - player can't pass through
}

export interface TextureConfig {
  wrapS?: 'repeat' | 'mirror' | 'clamp';
  wrapT?: 'repeat' | 'mirror' | 'clamp';
  offsetX?: number;
  offsetY?: number;
  repeatX?: number;
  repeatY?: number;
}

export interface BoxConfig {
  x: number;
  z: number;
  boxType: BoxType;
  label?: string;
  texture?: TextureConfig;
}

export interface SwitchConfig {
  x: number;
  z: number;
  switchType: SwitchType;
  targetGateId: string; // ID of the gate this switch controls
  label?: string;
}

export interface StageObjectsConfig {
  gates?: GateConfig[];
  boxes?: BoxConfig[];
  switches?: SwitchConfig[];
  onGateUnlocked?: (gateId: string) => void; // Callback when a gate is unlocked
}

const GATE_MODEL_PATH = '/objects/01_o01a/o0c_gate.imd/o0c_gate.glb';
const BOX_MODEL_PATHS: Record<BoxType, string> = {
  'valley_cont': '/objects/01_o01a/o01_cont.imd/o01_cont.glb',
  'valley_recont': '/objects/01_o01z/o0c_recont.imd/o0c_recont.glb',
};
const SWITCH_MODEL_PATHS: Record<SwitchType, string> = {
  'valley_switchf': '/objects/01_o01a/o0c_switchf.imd/o0c_switchf.glb',
};

// Laser texture name in gate model (hide when gate is deactivated)
const GATE_LASER_TEXTURE = 'o0c_1_gate';

function getGateRotation(edge: GateEdge): number {
  switch (edge) {
    case 'north': return Math.PI;
    case 'south': return 0;
    case 'east': return -Math.PI / 2;
    case 'west': return Math.PI / 2;
  }
}

// Gate animation config
const GATE_ANIMATION = {
  meshName: 'o0c_gate_3',
  speed: 0.8,
  startY: -0.55,
  maxY: 0.25,
};

// Gate collision dimensions
const GATE_COLLISION = {
  width: 6.0,
  height: 3.0,
  depth: 0.5,
};

interface GateModelProps extends GateConfig {
  active?: boolean; // When false, gate is unlocked (no collision, lasers hidden)
}

function GateModel({ x, z, edge, scale, animated = false, blocked = false, active = true }: GateModelProps) {
  const { registerWallFromDefinition } = useCollision();
  const { scene } = useGLTF(GATE_MODEL_PATH);
  const rotation = getGateRotation(edge);
  const animationProgress = useRef(0);
  const animatedMeshRef = useRef<THREE.Object3D | null>(null);
  const laserMeshesRef = useRef<THREE.Mesh[]>([]);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Find the animated mesh and laser meshes after clone is created
  useEffect(() => {
    if (!clonedScene) return;
    const laserMeshes: THREE.Mesh[] = [];
    clonedScene.traverse((child) => {
      if (child.name === GATE_ANIMATION.meshName) {
        animatedMeshRef.current = child;
      }
      // Find laser meshes by checking texture name
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.map?.name?.includes(GATE_LASER_TEXTURE) ||
            material.name?.includes(GATE_LASER_TEXTURE)) {
          laserMeshes.push(mesh);
        }
      }
    });
    laserMeshesRef.current = laserMeshes;
  }, [clonedScene]);

  // Update laser visibility based on active state
  useEffect(() => {
    laserMeshesRef.current.forEach(mesh => {
      mesh.visible = active;
    });
  }, [active]);

  // Register wall collision when blocked AND active
  useEffect(() => {
    if (blocked && active) {
      const unregister = registerWallFromDefinition({
        position: [x, GATE_COLLISION.height / 2, z],
        length: GATE_COLLISION.width,
        rotation: rotation
      }, `gate-wall-${x}-${z}`);
      return unregister;
    }
  }, [blocked, active, x, z, rotation, registerWallFromDefinition]);

  // Animate the gate mesh
  useFrame((_, delta) => {
    if (!animated || !animatedMeshRef.current) return;

    animationProgress.current += delta * GATE_ANIMATION.speed;
    if (animationProgress.current >= 1) {
      animationProgress.current = 0;
    }

    const currentY = GATE_ANIMATION.startY +
      (GATE_ANIMATION.maxY - GATE_ANIMATION.startY) * animationProgress.current;
    animatedMeshRef.current.position.y = currentY;
  });

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <primitive object={clonedScene} scale={[scale, scale, scale]} />
    </group>
  );
}

function getWrapMode(mode?: 'repeat' | 'mirror' | 'clamp'): THREE.Wrapping {
  switch (mode) {
    case 'mirror': return THREE.MirroredRepeatWrapping;
    case 'clamp': return THREE.ClampToEdgeWrapping;
    default: return THREE.RepeatWrapping;
  }
}

function BoxModel({ x, z, boxType, texture }: BoxConfig) {
  const { scene } = useGLTF(BOX_MODEL_PATHS[boxType]);

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.map) {
          material.map.wrapS = getWrapMode(texture?.wrapS);
          material.map.wrapT = getWrapMode(texture?.wrapT);
          material.map.offset.set(texture?.offsetX ?? 0, texture?.offsetY ?? 0);
          material.map.repeat.set(texture?.repeatX ?? 1, texture?.repeatY ?? 1);
          material.map.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene, texture]);

  return (
    <group position={[x, 0, z]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Floor switch collision dimensions
const SWITCH_COLLISION = {
  width: 1.5,
  height: 0.3,
  depth: 1.5,
};

interface FloorSwitchProps extends SwitchConfig {
  activated: boolean;
  onActivate: () => void;
}

function FloorSwitch({ x, z, switchType, activated, onActivate }: FloorSwitchProps) {
  const { registerTrigger } = useCollision();
  const { scene } = useGLTF(SWITCH_MODEL_PATHS[switchType]);
  const [isPlayerOn, setIsPlayerOn] = useState(false);

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    // Set initial texture offset based on activated state
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.map) {
          // Off state: offsetX 0.5, On state: offsetX 0.0
          material.map.offset.x = activated ? 0.0 : 0.5;
          material.map.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene, activated]);

  // Update texture when activation state changes
  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.map) {
          material.map.offset.x = activated ? 0.0 : 0.5;
          material.map.needsUpdate = true;
        }
      }
    });
  }, [clonedScene, activated]);

  // Register trigger with collision system
  useEffect(() => {
    const center = new THREE.Vector3(x, SWITCH_COLLISION.height / 2, z);
    const size = new THREE.Vector3(SWITCH_COLLISION.width, SWITCH_COLLISION.height, SWITCH_COLLISION.depth);
    const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

    const unregister = registerTrigger({
      id: `floor-switch-${x}-${z}`,
      bounds,
      onEnter: () => {
        setIsPlayerOn(true);
        if (!activated) {
          onActivate();
        }
      },
      onExit: () => {
        setIsPlayerOn(false);
      }
    });
    return unregister;
  }, [x, z, activated, onActivate, registerTrigger]);

  return (
    <>
      {/* Visual switch model */}
      <group position={[x, 0, z]}>
        <primitive object={clonedScene} />
      </group>

      {/* Debug indicator */}
      <mesh position={[x, 0.5, z]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial
          color={activated ? 0x00ff00 : isPlayerOn ? 0xffff00 : 0xff0000}
          transparent
          opacity={0.7}
        />
      </mesh>
    </>
  );
}

export default function StageObjects({
  gates = [],
  boxes = [],
  switches = [],
  onGateUnlocked
}: StageObjectsConfig) {
  // Track which gates have been unlocked by switches
  const [unlockedGates, setUnlockedGates] = useState<Set<string>>(new Set());

  const handleSwitchActivate = (targetGateId: string) => {
    setUnlockedGates(prev => {
      const next = new Set(prev);
      next.add(targetGateId);
      return next;
    });
    // Notify parent that gate was unlocked (for trigger activation)
    if (onGateUnlocked) {
      onGateUnlocked(targetGateId);
    }
  };

  return (
    <>
      {gates.map((gate, i) => {
        const isUnlocked = gate.id ? unlockedGates.has(gate.id) : false;
        return (
          <GateModel
            key={`gate-${i}`}
            {...gate}
            active={!isUnlocked} // Gate is active (blocking) when NOT unlocked
          />
        );
      })}
      {boxes.map((box, i) => (
        <BoxModel key={`box-${i}`} {...box} />
      ))}
      {switches.map((sw, i) => {
        const isActivated = unlockedGates.has(sw.targetGateId);
        return (
          <FloorSwitch
            key={`switch-${i}`}
            {...sw}
            activated={isActivated}
            onActivate={() => handleSwitchActivate(sw.targetGateId)}
          />
        );
      })}
    </>
  );
}
