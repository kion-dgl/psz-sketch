import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Define interactive trigger zones that require 'e' key to activate
interface InteractiveTrigger {
  position: [number, number, number];
  radius: number;
  height: number;
  targetArea: string;
  name: string;
}

const TRIGGERS: InteractiveTrigger[] = [
  // Gurhacia Valley entrance at X: 4.55, Y: 1.00, Z: -4.10
  {
    position: [4.55, 1, -4.10],
    radius: 1,
    height: 3,
    targetArea: '/stage/valley',
    name: 'Enter Gurhacia Valley'
  },
  // Ozette Wetlands entrance at X: 6.56, Z: 0.42
  {
    position: [6.56, 1, 0.42],
    radius: 1,
    height: 3,
    targetArea: '/stage/wetlands',
    name: 'Enter Ozette Wetlands'
  },
  // Rioh Snowfield entrance at X: 4.65, Y: 1.00, Z: 5.14
  {
    position: [4.65, 1, 5.14],
    radius: 1,
    height: 3,
    targetArea: '/stage/snowfield',
    name: 'Enter Rioh Snowfield'
  },
  // Makara Ruins entrance at X: 0.08, Y: 1.00, Z: 6.72
  {
    position: [0.08, 1, 6.72],
    radius: 1,
    height: 3,
    targetArea: '/stage/makara',
    name: 'Enter Makara Ruins'
  },
  // Oblivion City Paru entrance at X: -4.50, Y: 1.00, Z: 4.50
  {
    position: [-4.50, 1, 4.50],
    radius: 1,
    height: 3,
    targetArea: '/stage/paru',
    name: 'Enter Oblivion City Paru'
  },
  // Arca Plant entrance at X: -6.68, Y: 1.00, Z: 0.42
  {
    position: [-6.68, 1, 0.42],
    radius: 1,
    height: 3,
    targetArea: '/stage/arca',
    name: 'Enter Arca Plant'
  },
  // Dark Shrine entrance at X: -4.69, Y: 1.00, Z: -4.17
  {
    position: [-4.69, 1, -4.17],
    radius: 1,
    height: 3,
    targetArea: '/stage/shrine',
    name: 'Enter Dark Shrine'
  }
];

interface InteractiveTriggersProps {
  visible?: boolean;
  onPlayerInZone?: (zone: string | null) => void;
}

export default function InteractiveTriggers({ visible = true, onPlayerInZone }: InteractiveTriggersProps) {
  const [playerInZone, setPlayerInZone] = useState<string | null>(null);
  const [activated, setActivated] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (onPlayerInZone) {
      onPlayerInZone(playerInZone);
    }
  }, [playerInZone, onPlayerInZone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && playerInZone && !activated.has(playerInZone)) {
        // Find the trigger
        const trigger = TRIGGERS.find(t => t.name === playerInZone);
        if (trigger) {
          setActivated(prev => new Set(prev).add(playerInZone));
          window.location.href = trigger.targetArea;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerInZone, activated]);

  const handleEnter = (triggerName: string) => {
    setPlayerInZone(triggerName);
  };

  const handleExit = () => {
    setPlayerInZone(null);
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
          userData={{ type: 'interactive-trigger', name: trigger.name }}
          onIntersectionEnter={() => handleEnter(trigger.name)}
          onIntersectionExit={handleExit}
        >
          {/* Cylindrical collider for circular trigger */}
          <CylinderCollider args={[trigger.height / 2, trigger.radius]} />

          {/* Visual mesh (only visible when visible prop is true) */}
          {visible && (
            <mesh>
              <cylinderGeometry args={[trigger.radius, trigger.radius, trigger.height, 16]} />
              <meshStandardMaterial
                color={playerInZone === trigger.name ? "green" : "purple"}
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

// Separate component for the UI prompt
export function InteractiveTriggerUI({ playerInZone }: { playerInZone: string | null }) {
  if (!playerInZone) return null;

  return createPortal(
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px 30px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '16px',
      textAlign: 'center'
    }}>
      Press <strong>E</strong> to {playerInZone}
    </div>,
    document.body
  );
}
