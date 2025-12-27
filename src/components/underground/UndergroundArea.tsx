import LobbyArea, { type LobbyRenderProps } from '../shared/LobbyArea';
import UndergroundEnvironment, { DebugGroundPlane } from './UndergroundEnvironment';
import UndergroundNPCs from './UndergroundNPCs';
import UndergroundWalls from './UndergroundWalls';
import UndergroundTriggers from './UndergroundTriggers';
import InteractiveTriggers, { type InteractiveTrigger } from '../shared/InteractiveTriggers';

const UNDERGROUND_TRIGGERS: InteractiveTrigger[] = [
  { position: [0.04, 1, -3.91], radius: 2, height: 3, targetArea: '/stage/city', name: 'Exit to City' }
];

export default function UndergroundArea() {
  return (
    <LobbyArea
      defaultSpawnPosition={[0, 10, 0]}
      debugLabel="Debug"
      showInteractiveTriggerUI={true}
      environmentOutsidePhysics={<UndergroundEnvironment />}
      renderPhysicsContent={({ setPlayerInInteractiveZone }: LobbyRenderProps) => (
        <>
          <DebugGroundPlane />
          <UndergroundWalls visible={true} />
          <UndergroundTriggers visible={false} />
          <InteractiveTriggers
            triggers={UNDERGROUND_TRIGGERS}
            visible={true}
            onPlayerInZone={setPlayerInInteractiveZone}
          />
          <UndergroundNPCs />
        </>
      )}
    />
  );
}
