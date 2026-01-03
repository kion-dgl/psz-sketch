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
  // TODO: Add exit trigger back to City once spawn position is determined
];

interface UndergroundTriggersProps {
  visible?: boolean;
}

export default function UndergroundTriggers({ visible = true }: UndergroundTriggersProps) {
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
  if (!visible || TRIGGERS.length === 0) return null;

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
