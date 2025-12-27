import TowerEnv, { TowerFloorCollision } from './environments/TowerEnv';
import EternalMoteParticles from './EternalMoteParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './towerConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'humid' | 'rain';

// Eternal Tower lighting - mystical ancient interior with golden ethereal glow
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.4,
    ambientColor: '#c9b896',
    directionalIntensity: 0.5,
    directionalColor: '#ffe8c0',
    directionalPosition: [5, 20, 5],
    fogColor: '#2a2520',
    fogNear: 100,
    fogFar: 200,
  },
  dusk: {
    ambientIntensity: 0.3,
    ambientColor: '#a89070',
    directionalIntensity: 0.4,
    directionalColor: '#ffd0a0',
    directionalPosition: [10, 15, 5],
    fogColor: '#201a15',
    fogNear: 100,
    fogFar: 200,
  },
  night: {
    ambientIntensity: 0.2,
    ambientColor: '#6a6080',
    directionalIntensity: 0.25,
    directionalColor: '#aabbdd',
    directionalPosition: [-5, 15, -5],
    fogColor: '#15131a',
    fogNear: 100,
    fogFar: 200,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #1a1510 0%, #2a2520 100%)',
  debugAccentColor: '#d4b896',
  debugButtonActiveColor: '#aa8855',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    // Tower keeps distant fog regardless of weather
    fogColor: weather === 'humid' ? '#252018' : weather === 'rain' ? '#1a1510' : lighting.fogColor,
    ambientIntensity: weather === 'rain' ? (lighting.ambientIntensity ?? 0.4) * 0.7 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? (lighting.directionalIntensity ?? 0.5) * 0.5 : lighting.directionalIntensity,
  };
}

interface TowerAreaProps {
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

export default function TowerArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: TowerAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<TowerEnv mapId={mapId} />}
      floorCollision={<TowerFloorCollision mapId={mapId} />}
      particles={<EternalMoteParticles intensity="normal" />}
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
