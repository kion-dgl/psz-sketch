import ValleyEnv, { ValleyFloorCollision } from './environments/ValleyEnv';
import SandParticles from './SandParticles';
import RainParticles from './RainParticles';
import StageArea, { type LightingConfig, type ThemeConfig, type TriggerConfig } from '../shared/StageArea';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'sandstorm' | 'rain' | 'rain-heavy';

const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.6,
    ambientColor: '#ffffff',
    directionalIntensity: 0.8,
    directionalColor: '#fffaf0',
    directionalPosition: [10, 20, 10],
    fogColor: '#87ceeb',
    fogNear: 50,
    fogFar: 200,
  },
  dusk: {
    ambientIntensity: 0.35,
    ambientColor: '#ff9966',
    directionalIntensity: 0.5,
    directionalColor: '#ff6633',
    directionalPosition: [30, 5, 10],
    fogColor: '#ff7744',
    fogNear: 30,
    fogFar: 150,
  },
  night: {
    ambientIntensity: 0.15,
    ambientColor: '#4466aa',
    directionalIntensity: 0.25,
    directionalColor: '#aaccff',
    directionalPosition: [-10, 15, -10],
    fogColor: '#1a1a2e',
    fogNear: 20,
    fogFar: 100,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  debugAccentColor: '#ffd700',
  debugButtonActiveColor: '#00aa00',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    // Sandstorm reduces visibility significantly
    fogNear: weather === 'sandstorm' ? 10 : weather === 'rain' ? 20 : weather === 'rain-heavy' ? 10 : lighting.fogNear,
    fogFar: weather === 'sandstorm' ? 60 : weather === 'rain' ? 80 : weather === 'rain-heavy' ? 50 : lighting.fogFar,
    // Rain uses dark blue fog
    fogColor: weather === 'rain' ? '#2a3a5a' : weather === 'rain-heavy' ? '#1a2a4a' : lighting.fogColor,
    // Rain darkens the scene
    ambientIntensity: weather === 'rain' ? (lighting.ambientIntensity ?? 0.6) * 0.7 : weather === 'rain-heavy' ? (lighting.ambientIntensity ?? 0.6) * 0.5 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? (lighting.directionalIntensity ?? 0.8) * 0.5 : weather === 'rain-heavy' ? (lighting.directionalIntensity ?? 0.8) * 0.3 : lighting.directionalIntensity,
  };
}

function WeatherParticles({ weather }: { weather: Weather }) {
  if (weather === 'rain') {
    return <RainParticles intensity="normal" />;
  } else if (weather === 'rain-heavy') {
    return <RainParticles intensity="heavy" />;
  }
  return <SandParticles intensity={weather === 'sandstorm' ? 'heavy' : weather === 'clear' ? 'light' : 'normal'} />;
}

interface ValleyAreaProps {
  mapId: string;
  mapName: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  triggers?: TriggerConfig[];
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  children?: React.ReactNode;
}

export default function ValleyArea({
  mapId,
  mapName,
  spawnPosition = [0, 10, 0],
  spawnRotation = 0,
  triggers = [],
  timeOfDay = 'day',
  weather = 'clear',
  children
}: ValleyAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<ValleyEnv mapId={mapId} />}
      floorCollision={<ValleyFloorCollision mapId={mapId} />}
      particles={<WeatherParticles weather={weather} />}
      lighting={lighting}
      theme={THEME}
      spawnPosition={spawnPosition}
      spawnRotation={spawnRotation}
      triggers={triggers}
      debugMode={false}
      showDebugPanel={true}
      addPiToSpawnRotation={false}
    >
      {children}
    </StageArea>
  );
}
