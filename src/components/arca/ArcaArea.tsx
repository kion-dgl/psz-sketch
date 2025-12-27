import ArcaEnv, { ArcaFloorCollision } from './environments/ArcaEnv';
import SteamParticles from './SteamParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './arcaConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'humid' | 'rain';

// Arca Plant lighting - industrial facility with metallic tones and warm lights
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.4,
    ambientColor: '#5a5a5a',
    directionalIntensity: 0.55,
    directionalColor: '#ccbb99',
    directionalPosition: [10, 25, 10],
    fogColor: '#3a3a3a',
    fogNear: 30,
    fogFar: 120,
  },
  dusk: {
    ambientIntensity: 0.3,
    ambientColor: '#4a4545',
    directionalIntensity: 0.45,
    directionalColor: '#cc8855',
    directionalPosition: [30, 8, 10],
    fogColor: '#2a2525',
    fogNear: 25,
    fogFar: 100,
  },
  night: {
    ambientIntensity: 0.15,
    ambientColor: '#2a2a2a',
    directionalIntensity: 0.2,
    directionalColor: '#8899aa',
    directionalPosition: [-10, 20, -10],
    fogColor: '#151515',
    fogNear: 15,
    fogFar: 70,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #1a1a1a 0%, #2a2525 100%)',
  debugAccentColor: '#ccaa77',
  debugButtonActiveColor: '#cc8800',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    // Steam/haze weather
    fogNear: weather === 'humid' ? 15 : weather === 'rain' ? 10 : lighting.fogNear,
    fogFar: weather === 'humid' ? 70 : weather === 'rain' ? 50 : lighting.fogFar,
    fogColor: weather === 'humid' ? '#4a4a4a' : weather === 'rain' ? '#3a3a3a' : lighting.fogColor,
    ambientIntensity: weather === 'rain' ? (lighting.ambientIntensity ?? 0.4) * 0.6 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? (lighting.directionalIntensity ?? 0.55) * 0.4 : lighting.directionalIntensity,
  };
}

interface ArcaAreaProps {
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

export default function ArcaArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: ArcaAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<ArcaEnv mapId={mapId} />}
      floorCollision={<ArcaFloorCollision mapId={mapId} />}
      particles={<SteamParticles intensity="light" />}
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
