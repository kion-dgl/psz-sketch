import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useState } from 'react';

// Define trigger zones for area transitions
interface AreaTrigger {
  position: [number, number, number];
  size: [number, number, number];
  targetArea: string;
  name: string;
}

const TRIGGERS: AreaTrigger[] = [
  // Exit trigger to Counter: (2.16, 1.00, 18.37) → (-1.95, 1.00, 18.15)
  {
    position: [0.105, 1, 18.26],
    size: [4.11, 3, 1],
    targetArea: '/stage/counter?spawn=warp-exit',
    name: 'Exit to Counter'
  }
];

interface WarpTriggersProps {
  visible?: boolean;
}

export default function WarpTriggers({ visible = true }: WarpTriggersProps) {
  const [triggeredAreas, setTriggeredAreas] = useState<Set<string>>(new Set());

  const handleTriggerEnter = (trigger: AreaTrigger) => {
    if (triggeredAreas.has(trigger.name)) return;

    // Mark as triggered to prevent repeated triggers
    setTriggeredAreas(prev => new Set(prev).add(trigger.name));

    // Navigate to the target area
    window.location.href = trigger.targetArea;
  };

  return (
    <>
      {TRIGGERS.map((trigger, index) => (
        <RigidBody
          key={index}
          type="fixed"
          position={trigger.position}
          sensor
          collisionGroups={0x00040004}
          userData={{ type: 'trigger', name: trigger.name }}
          onIntersectionEnter={() => handleTriggerEnter(trigger)}
        >
          {/* Explicit collider for sensor detection */}
          <CuboidCollider args={[trigger.size[0] / 2, trigger.size[1] / 2, trigger.size[2] / 2]} />

          {/* Visual mesh (only visible when visible prop is true) */}
          {visible && (
            <mesh>
              <boxGeometry args={trigger.size} />
              <meshStandardMaterial
                color="cyan"
                transparent
                opacity={0.5}
                wireframe
              />
            </mesh>
          )}
        </RigidBody>
      ))}
    </>
  );
}
