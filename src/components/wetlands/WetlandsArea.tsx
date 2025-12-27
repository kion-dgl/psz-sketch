import WetlandsEnv, { WetlandsFloorCollision } from './environments/WetlandsEnv';
import RainParticles from '../valley/RainParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './wetlandsConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'foggy' | 'rain' | 'rain-heavy';

// Wetlands lighting - more green/misty atmosphere
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.5,
    ambientColor: '#e0ffe0',
    directionalIntensity: 0.7,
    directionalColor: '#fffef0',
    directionalPosition: [10, 20, 10],
    fogColor: '#8fbc8f',
    fogNear: 30,
    fogFar: 150,
  },
  dusk: {
    ambientIntensity: 0.3,
    ambientColor: '#cc9966',
    directionalIntensity: 0.4,
    directionalColor: '#ff8844',
    directionalPosition: [30, 5, 10],
    fogColor: '#7a6655',
    fogNear: 20,
    fogFar: 120,
  },
  night: {
    ambientIntensity: 0.12,
    ambientColor: '#3a5a4a',
    directionalIntensity: 0.2,
    directionalColor: '#88aacc',
    directionalPosition: [-10, 15, -10],
    fogColor: '#1a2a1e',
    fogNear: 15,
    fogFar: 80,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #2d5016 0%, #4a7023 100%)',
  debugAccentColor: '#ffd700',
  debugButtonActiveColor: '#00aa00',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    // Foggy weather reduces visibility
    fogNear: weather === 'foggy' ? 5 : weather === 'rain' ? 15 : weather === 'rain-heavy' ? 20 : lighting.fogNear,
    fogFar: weather === 'foggy' ? 40 : weather === 'rain' ? 60 : weather === 'rain-heavy' ? 70 : lighting.fogFar,
    // Rain uses darker fog
    fogColor: weather === 'rain' ? '#3a4a3a' : weather === 'rain-heavy' ? '#2a3a2a' : weather === 'foggy' ? '#6a8a6a' : lighting.fogColor,
    // Rain darkens the scene - heavy rain is very dark to emphasize lamp posts
    ambientIntensity: weather === 'rain' ? (lighting.ambientIntensity ?? 0.5) * 0.7 : weather === 'rain-heavy' ? (lighting.ambientIntensity ?? 0.5) * 0.15 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? (lighting.directionalIntensity ?? 0.7) * 0.5 : weather === 'rain-heavy' ? (lighting.directionalIntensity ?? 0.7) * 0.1 : lighting.directionalIntensity,
  };
}

function WetlandsParticles({ weather }: { weather: Weather }) {
  if (weather === 'rain' || weather === 'rain-heavy') {
    return <RainParticles intensity={weather === 'rain-heavy' ? 'heavy' : 'normal'} />;
  }
  return null;
}

interface WetlandsAreaProps {
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

export default function WetlandsArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: WetlandsAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<WetlandsEnv mapId={mapId} />}
      floorCollision={<WetlandsFloorCollision mapId={mapId} />}
      particles={<WetlandsParticles weather={weather} />}
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
