import { RigidBody } from '@react-three/rapier';
import { useState } from 'react';

// Define trigger zones for area transitions
interface AreaTrigger {
  position: [number, number, number];
  size: [number, number, number];
  targetArea: string;
  name: string;
}

const TRIGGERS: AreaTrigger[] = [
  // Exit trigger to Counter: (-3.33, 14.43) → (4.09, 14.43)
  {
    position: [0.38, 1, 14.43],
    size: [7.42, 3, 1],
    targetArea: '/stage/counter',
    name: 'Exit to Counter'
  }
];

interface AreaTriggersProps {
  visible?: boolean;
}

export default function AreaTriggers({ visible = true }: AreaTriggersProps) {
  const [triggeredAreas, setTriggeredAreas] = useState<Set<string>>(new Set());

  const handleTriggerEnter = (trigger: AreaTrigger) => {
    if (triggeredAreas.has(trigger.name)) return;

    console.log(`Entering trigger: ${trigger.name}`);
    console.log(`Navigating to: ${trigger.targetArea}`);

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
          onIntersectionEnter={() => handleTriggerEnter(trigger)}
        >
          <mesh visible={visible}>
            <boxGeometry args={trigger.size} />
            <meshStandardMaterial
              color="cyan"
              transparent
              opacity={visible ? 0.5 : 0}
              wireframe={visible}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
