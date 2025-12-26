import MakaraEnv, { MakaraFloorCollision } from './environments/MakaraEnv';
import EmberParticles from './EmberParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './makaraConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'humid' | 'rain';

// Makara Ruins lighting - dark underground with red flower accents
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.25,
    ambientColor: '#4a3a3a',
    directionalIntensity: 0.3,
    directionalColor: '#aa8877',
    directionalPosition: [10, 20, 10],
    fogColor: '#2a1a1a',
    fogNear: 20,
    fogFar: 100,
  },
  dusk: {
    ambientIntensity: 0.2,
    ambientColor: '#4a2a2a',
    directionalIntensity: 0.25,
    directionalColor: '#884422',
    directionalPosition: [30, 5, 10],
    fogColor: '#1a1010',
    fogNear: 15,
    fogFar: 80,
  },
  night: {
    ambientIntensity: 0.1,
    ambientColor: '#2a1a2a',
    directionalIntensity: 0.15,
    directionalColor: '#553344',
    directionalPosition: [-10, 15, -10],
    fogColor: '#0a0808',
    fogNear: 10,
    fogFar: 60,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #1a0a0a 0%, #2a1515 100%)',
  debugAccentColor: '#ffd700',
  debugButtonActiveColor: '#00aa00',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    fogNear: weather === 'humid' ? 15 : weather === 'rain' ? 10 : lighting.fogNear,
    fogFar: weather === 'humid' ? 80 : weather === 'rain' ? 50 : lighting.fogFar,
    fogColor: weather === 'humid' ? '#7a9a6a' : weather === 'rain' ? '#4a5a4a' : lighting.fogColor,
    ambientIntensity: weather === 'rain' ? lighting.ambientIntensity * 0.6 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? lighting.directionalIntensity * 0.4 : lighting.directionalIntensity,
  };
}

interface MakaraAreaProps {
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

export default function MakaraArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: MakaraAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<MakaraEnv mapId={mapId} />}
      floorCollision={<MakaraFloorCollision mapId={mapId} />}
      particles={<EmberParticles intensity="light" />}
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
