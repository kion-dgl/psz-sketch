import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../collision';

// Define trigger zones for area transitions
interface AreaTrigger {
  position: [number, number, number];
  size: [number, number, number];
  targetArea: string;
  name: string;
}

const TRIGGERS: AreaTrigger[] = [
  // Exit trigger to Market: Updated to be near x:0, z:20
  {
    position: [0, 1, 20],
    size: [4, 3, 1],
    targetArea: '/stage/city?spawn=counter-exit',
    name: 'Exit to Market'
  },
  // Exit trigger to Warp: (1.63, 1.00, -21.85) → (-1.66, 1.00, -22.76)
  {
    position: [-0.015, 1, -22.305],
    size: [3.29, 3, 0.91],
    targetArea: '/stage/warp',
    name: 'Exit to Warp'
  }
];

interface CounterTriggersProps {
  visible?: boolean;
}

export default function CounterTriggers({ visible = true }: CounterTriggersProps) {
  const { registerTrigger } = useCollision();
  const triggeredRef = useRef<Set<string>>(new Set());

  // Register all triggers with collision system
  useEffect(() => {
    const unregisters = TRIGGERS.map((trigger) => {
      const center = new THREE.Vector3(trigger.position[0], trigger.position[1], trigger.position[2]);
      const size = new THREE.Vector3(trigger.size[0], trigger.size[1], trigger.size[2]);
      const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

      return registerTrigger({
        id: trigger.name,
        bounds,
        onEnter: () => {
          if (triggeredRef.current.has(trigger.name)) return;
          triggeredRef.current.add(trigger.name);
          window.location.href = trigger.targetArea;
        }
      });
    });

    return () => {
      unregisters.forEach(unregister => unregister());
    };
  }, [registerTrigger]);

  // Visual representation (optional, for debugging)
  if (!visible) return null;

  return (
    <>
      {TRIGGERS.map((trigger, index) => (
        <mesh
          key={index}
          position={trigger.position}
        >
          <boxGeometry args={trigger.size} />
          <meshStandardMaterial
            color="cyan"
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>
      ))}
    </>
  );
}
