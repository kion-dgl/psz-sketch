import { useEffect } from 'react';
import * as THREE from 'three';
import LobbyArea, { type LobbyRenderProps } from '../shared/LobbyArea';
import WarpEnvironment, { WarpGroundPlane } from './WarpEnvironment';
import WarpNPCs from './WarpNPCs';
import WarpWalls from './WarpWalls';
import WarpTriggers from './WarpTriggers';
import InteractiveTriggers, { type InteractiveTrigger } from '../shared/InteractiveTriggers';
import { useCollision } from '../../collision';

const WARP_TRIGGERS: InteractiveTrigger[] = [
  { position: [4.55, 1, -4.10], radius: 1, height: 3, targetArea: '/stage/valley', name: 'Enter Gurhacia Valley' },
  { position: [6.56, 1, 0.42], radius: 1, height: 3, targetArea: '/stage/wetlands', name: 'Enter Ozette Wetlands' },
  { position: [4.65, 1, 5.14], radius: 1, height: 3, targetArea: '/stage/snowfield', name: 'Enter Rioh Snowfield' },
  { position: [0.08, 1, 6.72], radius: 1, height: 3, targetArea: '/stage/makara', name: 'Enter Makara Ruins' },
  { position: [-4.50, 1, 4.50], radius: 1, height: 3, targetArea: '/stage/paru', name: 'Enter Oblivion City Paru' },
  { position: [-6.68, 1, 0.42], radius: 1, height: 3, targetArea: '/stage/arca', name: 'Enter Arca Plant' },
  { position: [-4.69, 1, -4.17], radius: 1, height: 3, targetArea: '/stage/shrine', name: 'Enter Dark Shrine' },
  { position: [0.08, 1, -6.25], radius: 1, height: 3, targetArea: '/stage/tower', name: 'Enter Eternal Tower' }
];

function KillPlane({ onRespawn }: { onRespawn: () => void }) {
  const { registerTrigger } = useCollision();

  useEffect(() => {
    const center = new THREE.Vector3(0, -50, 0);
    const size = new THREE.Vector3(200, 1, 200);
    const bounds = new THREE.Box3().setFromCenterAndSize(center, size);

    const unregister = registerTrigger({
      id: 'kill-plane',
      bounds,
      onEnter: () => onRespawn()
    });
    return unregister;
  }, [onRespawn, registerTrigger]);

  return (
    <mesh position={[0, -50, 0]}>
      <boxGeometry args={[200, 1, 200]} />
      <meshStandardMaterial color="red" transparent opacity={0.3} />
    </mesh>
  );
}

export default function WarpArea() {
  return (
    <LobbyArea
      defaultSpawnPosition={[0.08, 5, 15.26]}
      debugLabel="Wall"
      showInteractiveTriggerUI={true}
      environmentOutsidePhysics={<WarpEnvironment />}
      renderPhysicsContent={({ setPlayerInInteractiveZone }: LobbyRenderProps) => (
        <>
          <WarpGroundPlane />
          <WarpWalls visible={true} />
          <KillPlane onRespawn={() => window.location.reload()} />
          <WarpTriggers visible={false} />
          <InteractiveTriggers
            triggers={WARP_TRIGGERS}
            visible={true}
            onPlayerInZone={setPlayerInInteractiveZone}
          />
          <WarpNPCs />
        </>
      )}
    />
  );
}
