import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { useCollision } from '../../collision';

// Define interactive trigger zones that require 'e' key to activate
export interface InteractiveTrigger {
  position: [number, number, number];
  radius: number;
  height: number;
  targetArea: string;
  name: string;
}

interface InteractiveTriggersProps {
  triggers: InteractiveTrigger[];
  visible?: boolean;
  onPlayerInZone?: (zone: string | null) => void;
}

export default function InteractiveTriggers({ triggers, visible = true, onPlayerInZone }: InteractiveTriggersProps) {
  const { registerTrigger } = useCollision();
  const [playerInZone, setPlayerInZone] = useState<string | null>(null);
  const [activated, setActivated] = useState<Set<string>>(new Set());
  const playerInZoneRef = useRef<string | null>(null);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    playerInZoneRef.current = playerInZone;
  }, [playerInZone]);

  useEffect(() => {
    if (onPlayerInZone) {
      onPlayerInZone(playerInZone);
    }
  }, [playerInZone, onPlayerInZone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && playerInZoneRef.current && !activated.has(playerInZoneRef.current)) {
        // Find the trigger
        const trigger = triggers.find(t => t.name === playerInZoneRef.current);
        if (trigger) {
          setActivated(prev => new Set(prev).add(playerInZoneRef.current!));
          window.location.href = trigger.targetArea;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activated, triggers]);

  // Register all triggers with collision system
  useEffect(() => {
    const unregisters = triggers.map((trigger) => {
      // Use a box approximation for the cylinder
      // Box3 with radius on X/Z and height on Y
      const center = new THREE.Vector3(trigger.position[0], trigger.position[1], trigger.position[2]);
      const size = new THREE.Vector3(trigger.radius * 2, trigger.height, trigger.radius * 2);
      const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

      return registerTrigger({
        id: trigger.name,
        bounds,
        onEnter: () => setPlayerInZone(trigger.name),
        onExit: () => setPlayerInZone(null)
      });
    });

    return () => {
      unregisters.forEach(unregister => unregister());
    };
  }, [triggers, registerTrigger]);

  // Visual representation (optional, for debugging)
  if (!visible) return null;

  return (
    <>
      {triggers.map((trigger, index) => (
        <mesh
          key={index}
          position={trigger.position}
        >
          <cylinderGeometry args={[trigger.radius, trigger.radius, trigger.height, 16]} />
          <meshStandardMaterial
            color={playerInZone === trigger.name ? "green" : "purple"}
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>
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
