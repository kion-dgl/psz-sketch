import ParuEnv, { ParuFloorCollision } from './environments/ParuEnv';
import SporeSparkParticles from './SporeSparkParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './paruConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'humid' | 'rain';

// Oblivion City Paru lighting - overgrown futuristic ruins with broken tech
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.35,
    ambientColor: '#4a5a4a',
    directionalIntensity: 0.45,
    directionalColor: '#99aa88',
    directionalPosition: [10, 30, 10],
    fogColor: '#2a3a2a',
    fogNear: 30,
    fogFar: 120,
  },
  dusk: {
    ambientIntensity: 0.25,
    ambientColor: '#3a4a3a',
    directionalIntensity: 0.35,
    directionalColor: '#88aa77',
    directionalPosition: [30, 8, 10],
    fogColor: '#1a2a1a',
    fogNear: 25,
    fogFar: 100,
  },
  night: {
    ambientIntensity: 0.12,
    ambientColor: '#1a2a2a',
    directionalIntensity: 0.15,
    directionalColor: '#3a5a5a',
    directionalPosition: [-10, 20, -10],
    fogColor: '#0a1510',
    fogNear: 15,
    fogFar: 70,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 100%)',
  debugAccentColor: '#7fff7f',
  debugButtonActiveColor: '#00aa00',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    fogNear: weather === 'humid' ? 15 : weather === 'rain' ? 10 : lighting.fogNear,
    fogFar: weather === 'humid' ? 80 : weather === 'rain' ? 50 : lighting.fogFar,
    fogColor: weather === 'humid' ? '#3a4a3a' : weather === 'rain' ? '#2a3a2a' : lighting.fogColor,
    ambientIntensity: weather === 'rain' ? lighting.ambientIntensity * 0.6 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? lighting.directionalIntensity * 0.4 : lighting.directionalIntensity,
  };
}

interface ParuAreaProps {
  mapId: string;
  mapName: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  triggers?: TriggerConfig[];
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  debugMode?: boolean;
  children?: React.ReactNode;
}

export default function ParuArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: ParuAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<ParuEnv mapId={mapId} />}
      floorCollision={<ParuFloorCollision mapId={mapId} />}
      particles={<SporeSparkParticles intensity="light" />}
      lighting={lighting}
      theme={THEME}
      spawnPosition={spawnPosition}
      spawnRotation={spawnRotation}
      triggers={triggers}
      getMapConfig={getMapConfig}
      getDefaultSpawn={getDefaultSpawn}
      debugMode={debugMode}
      addPiToSpawnRotation={true}
    >
      {children}
    </StageArea>
  );
}
