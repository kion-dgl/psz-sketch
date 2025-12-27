import SnowfieldEnv, { SnowfieldFloorCollision } from './environments/SnowfieldEnv';
import SnowParticles from './SnowParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './snowfieldConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'snowing' | 'blizzard';

// Snowfield lighting - cold, icy atmosphere
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.6,
    ambientColor: '#e0f0ff',
    directionalIntensity: 0.8,
    directionalColor: '#fffef8',
    directionalPosition: [10, 20, 10],
    fogColor: '#c8dce8',
    fogNear: 30,
    fogFar: 150,
  },
  dusk: {
    ambientIntensity: 0.35,
    ambientColor: '#9999cc',
    directionalIntensity: 0.45,
    directionalColor: '#ff9966',
    directionalPosition: [30, 5, 10],
    fogColor: '#8a7a8a',
    fogNear: 20,
    fogFar: 120,
  },
  night: {
    ambientIntensity: 0.15,
    ambientColor: '#4a5a7a',
    directionalIntensity: 0.25,
    directionalColor: '#aaccff',
    directionalPosition: [-10, 15, -10],
    fogColor: '#1a2a3e',
    fogNear: 15,
    fogFar: 80,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #1a4a6e 0%, #4a8ab0 100%)',
  debugAccentColor: '#ffd700',
  debugButtonActiveColor: '#00aa00',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    // Snowy weather reduces visibility
    fogNear: weather === 'snowing' ? 10 : weather === 'blizzard' ? 5 : lighting.fogNear,
    fogFar: weather === 'snowing' ? 50 : weather === 'blizzard' ? 25 : lighting.fogFar,
    // Snow uses whiter fog
    fogColor: weather === 'snowing' ? '#d8e8f0' : weather === 'blizzard' ? '#e8f0f8' : lighting.fogColor,
    // Blizzard darkens the scene slightly
    ambientIntensity: weather === 'blizzard' ? (lighting.ambientIntensity ?? 0.6) * 0.7 : lighting.ambientIntensity,
    directionalIntensity: weather === 'blizzard' ? (lighting.directionalIntensity ?? 0.8) * 0.5 : lighting.directionalIntensity,
  };
}

interface SnowfieldAreaProps {
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

export default function SnowfieldArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: SnowfieldAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<SnowfieldEnv mapId={mapId} />}
      floorCollision={<SnowfieldFloorCollision mapId={mapId} />}
      particles={<SnowParticles intensity={weather === 'blizzard' ? 'heavy' : weather === 'snowing' ? 'normal' : 'light'} />}
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
