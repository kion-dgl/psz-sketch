import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useState } from 'react';
import * as THREE from 'three';

interface MapTriggerProps {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number; // Y-axis rotation in radians
  targetMap?: string;
  targetUrl?: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  label?: string;
}

export default function MapTrigger({
  position,
  size = [2, 3, 2],
  rotation = 0,
  targetMap,
  targetUrl,
  spawnPosition,
  spawnRotation,
  label
}: MapTriggerProps) {
  const [isPlayerInside, setIsPlayerInside] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleIntersectionEnter = () => {
    setIsPlayerInside(true);
    if (!hasTriggered) {
      setHasTriggered(true);
      console.log(`[MapTrigger] Transitioning to ${targetUrl || targetMap}`);

      // Build URL with spawn parameters
      let url = targetUrl || `/stage/valley-${targetMap}`;
      const params = new URLSearchParams();

      if (spawnPosition) {
        params.set('x', spawnPosition[0].toString());
        params.set('y', spawnPosition[1].toString());
        params.set('z', spawnPosition[2].toString());
      }
      if (spawnRotation !== undefined) {
        params.set('r', spawnRotation.toString());
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      // Navigate to new map
      window.location.href = url;
    }
  };

  const handleIntersectionExit = () => {
    setIsPlayerInside(false);
  };

  return (
    <>
      {/* Trigger collider (invisible) */}
      <RigidBody
        type="fixed"
        sensor
        collisionGroups={0x00040004}
        onIntersectionEnter={handleIntersectionEnter}
        onIntersectionExit={handleIntersectionExit}
        position={position}
        rotation={[0, rotation, 0]}
      >
        <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      </RigidBody>

      {/* Visual indicator (optional) */}
      {label && (
        <group position={position} rotation={[0, rotation, 0]}>
          <mesh position={[0, size[1] / 2 + 0.5, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial
              color={isPlayerInside ? 0x00ff00 : 0xffff00}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}
    </>
  );
}
