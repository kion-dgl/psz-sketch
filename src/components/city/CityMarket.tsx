import LobbyArea, { type LobbyRenderProps } from '../shared/LobbyArea';
import MarketEnvironment from './MarketEnvironment';
import ShopNPCs from './ShopNPCs';
import InvisibleWalls from './InvisibleWalls';
import AreaTriggers from './AreaTriggers';
import InteractiveTriggers, { type InteractiveTrigger } from '../shared/InteractiveTriggers';

const CITY_TRIGGERS: InteractiveTrigger[] = [
  { position: [-13.44, 1, 57.44], radius: 2, height: 3, targetArea: '/stage/underground', name: 'Enter Underground' }
];

const SPAWN_CONFIGS = [
  { condition: 'counter-exit', position: [0.98, 10, 18.84] as [number, number, number], rotation: Math.PI }
];

export default function CityMarket() {
  return (
    <LobbyArea
      defaultSpawnPosition={[0.98, 10, 62.79]}
      spawnConfigs={SPAWN_CONFIGS}
      debugLabel="Debug"
      showInteractiveTriggerUI={true}
      renderPhysicsContent={({ setPlayerInInteractiveZone }: LobbyRenderProps) => (
        <>
          <MarketEnvironment />
          <InvisibleWalls visible={true} />
          <AreaTriggers visible={false} />
          <InteractiveTriggers
            triggers={CITY_TRIGGERS}
            visible={true}
            onPlayerInZone={setPlayerInInteractiveZone}
          />
          <ShopNPCs />
        </>
      )}
    />
  );
}
