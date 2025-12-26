import * as THREE from 'three';

export interface SpawnPoint {
  position: [number, number, number];
  rotation: number;
  isDefault?: boolean;
  label?: string;
}

export interface TriggerConfig {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
  targetUrl?: string;
  targetMap?: string;
  label?: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
}

interface DebugMarkersProps {
  spawnPoints: SpawnPoint[];
  triggers: TriggerConfig[];
}

export default function DebugMarkers({ spawnPoints, triggers }: DebugMarkersProps) {
  return (
    <group>
      {/* Spawn point markers - green for default, yellow for others */}
      {spawnPoints.map((spawn, index) => {
        const color = spawn.isDefault ? '#00ff00' : '#ffff00';
        return (
          <group key={index} position={spawn.position}>
            {/* Base platform */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            {/* Spawn indicator pole */}
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Direction arrow - points in the direction player will face */}
            <group rotation={[0, spawn.rotation, 0]}>
              {/* Arrow shaft */}
              <mesh position={[0, 0.3, 1.2]}>
                <boxGeometry args={[0.2, 0.2, 2]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {/* Arrow head - pointing forward (+Z when rotation=0) */}
              <mesh position={[0, 0.3, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.4, 0.8, 8]} />
                <meshBasicMaterial color={color} />
              </mesh>
            </group>
            {/* Label sphere at top */}
            <mesh position={[0, 2.2, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
      })}

      {/* Exit trigger markers - blue boxes centered at trigger position */}
      {triggers.map((trigger, index) => {
        const size: [number, number, number] = trigger.size || [6, 3, 2];
        const rotation = trigger.rotation || 0;
        return (
          <group key={index} position={trigger.position} rotation={[0, rotation, 0]}>
            {/* Blue transparent box - centered at trigger position */}
            <mesh>
              <boxGeometry args={size} />
              <meshBasicMaterial color="#0088ff" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            {/* Wireframe outline */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
              <lineBasicMaterial color="#00aaff" linewidth={2} />
            </lineSegments>
            {/* Label indicator at top */}
            <mesh position={[0, size[1] / 2 + 0.5, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color="#0088ff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
