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
  // Exit trigger: (-3.33, 14.43) → (4.09, 14.43)
  {
    position: [0.38, 1, 14.43],
    size: [7.42, 3, 1],
    targetArea: '/stage/next-area', // Change this to the actual next area route
    name: 'Exit to Next Area'
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
    console.log(`Would navigate to: ${trigger.targetArea}`);

    // Mark as triggered to prevent repeated triggers
    setTriggeredAreas(prev => new Set(prev).add(trigger.name));

    // TODO: Implement actual area transition
    // For now, just log. Later, you can:
    // window.location.href = trigger.targetArea;
    // or use a transition animation first
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
