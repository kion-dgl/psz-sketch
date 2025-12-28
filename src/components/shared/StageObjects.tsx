import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

type GateEdge = 'north' | 'south' | 'east' | 'west';
type BoxType = 'o01_cont' | 'o0c_recont';

export interface GateConfig {
  edge: GateEdge;
  x: number;
  z: number;
  scale: number;
  label?: string;
}

export interface BoxConfig {
  x: number;
  z: number;
  boxType: BoxType;
  label?: string;
}

export interface StageObjectsConfig {
  gates?: GateConfig[];
  boxes?: BoxConfig[];
}

const GATE_MODEL_PATH = '/objects/01_o01a/o0c_gate.imd/o0c_gate.glb';
const BOX_MODEL_PATHS: Record<BoxType, string> = {
  'o01_cont': '/objects/01_o01a/o01_cont.imd/o01_cont.glb',
  'o0c_recont': '/objects/01_o01z/o0c_recont.imd/o0c_recont.glb',
};

function getGateRotation(edge: GateEdge): number {
  switch (edge) {
    case 'north': return Math.PI;
    case 'south': return 0;
    case 'east': return -Math.PI / 2;
    case 'west': return Math.PI / 2;
  }
}

function GateModel({ x, z, edge, scale }: GateConfig) {
  const { scene } = useGLTF(GATE_MODEL_PATH);
  const rotation = getGateRotation(edge);

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <primitive object={clonedScene} scale={[scale, scale, scale]} />
    </group>
  );
}

function BoxModel({ x, z, boxType }: BoxConfig) {
  const { scene } = useGLTF(BOX_MODEL_PATHS[boxType]);

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

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
