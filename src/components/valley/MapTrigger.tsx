import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useCollision } from '../../collision';

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
  const { registerTrigger } = useCollision();
  const [isPlayerInside, setIsPlayerInside] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Generate unique ID for this trigger
  const triggerId = useRef(`map-trigger-${position.join('-')}-${Date.now()}`);

  useEffect(() => {
    // Calculate rotated bounds
    // For simplicity, we'll use the axis-aligned bounding box
    // More accurate would be to use an OBB, but Box3 is sufficient for most cases
    const center = new THREE.Vector3(position[0], position[1], position[2]);
    const sizeVec = new THREE.Vector3(size[0], size[1], size[2]);
    const bounds = new THREE.Box3().setFromCenterAndSize(center, sizeVec);

    const handleEnter = () => {
      setIsPlayerInside(true);
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
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

    const handleExit = () => {
      setIsPlayerInside(false);
    };

    const unregister = registerTrigger({
      id: triggerId.current,
      bounds,
      onEnter: handleEnter,
      onExit: handleExit
    });

    return unregister;
  }, [position, size, targetMap, targetUrl, spawnPosition, spawnRotation, registerTrigger]);

  return (
    <>
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
