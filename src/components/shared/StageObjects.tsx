import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

type GateEdge = 'north' | 'south' | 'east' | 'west';
type BoxType = 'valley_cont' | 'valley_recont';

export interface GateConfig {
  edge: GateEdge;
  x: number;
  z: number;
  scale: number;
  label?: string;
  animated?: boolean;
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

export interface StageObjectsConfig {
  gates?: GateConfig[];
  boxes?: BoxConfig[];
}

const GATE_MODEL_PATH = '/objects/01_o01a/o0c_gate.imd/o0c_gate.glb';
const BOX_MODEL_PATHS: Record<BoxType, string> = {
  'valley_cont': '/objects/01_o01a/o01_cont.imd/o01_cont.glb',
  'valley_recont': '/objects/01_o01z/o0c_recont.imd/o0c_recont.glb',
};

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

function GateModel({ x, z, edge, scale, animated = false }: GateConfig) {
  const { scene } = useGLTF(GATE_MODEL_PATH);
  const rotation = getGateRotation(edge);
  const animationProgress = useRef(0);
  const animatedMeshRef = useRef<THREE.Object3D | null>(null);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Find the animated mesh after clone is created
  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      if (child.name === GATE_ANIMATION.meshName) {
        animatedMeshRef.current = child;
      }
    });
  }, [clonedScene]);

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

export default function StageObjects({ gates = [], boxes = [] }: StageObjectsConfig) {
  return (
    <>
      {gates.map((gate, i) => (
        <GateModel key={`gate-${i}`} {...gate} />
      ))}
      {boxes.map((box, i) => (
        <BoxModel key={`box-${i}`} {...box} />
      ))}
    </>
  );
}
