import LobbyArea from '../shared/LobbyArea';
import CounterEnvironment, { CounterGroundPlane } from './CounterEnvironment';
import CounterNPCs from './CounterNPCs';
import CounterWalls from './CounterWalls';
import CounterTriggers from './CounterTriggers';

const SPAWN_CONFIGS = [
  { condition: 'warp-exit', position: [0.50, 10, -15.33] as [number, number, number], rotation: -3.15 }
];

export default function CounterArea() {
  return (
    <LobbyArea
      defaultSpawnPosition={[0.06, 10, 12.95]}
      defaultSpawnRotation={-6.28}
      spawnConfigs={SPAWN_CONFIGS}
      debugLabel="Trigger"
      environmentOutsidePhysics={<CounterEnvironment />}
      renderPhysicsContent={() => (
        <>
          <CounterGroundPlane />
          <CounterWalls visible={true} />
          <CounterTriggers visible={false} />
          <CounterNPCs />
        </>
      )}
    />
  );
}
