import ShrineEnv, { ShrineFloorCollision } from './environments/ShrineEnv';
import ShadowWispParticles from './ShadowWispParticles';
import LightDarkParticles from './LightDarkParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import { getMapConfig, getDefaultSpawn, type TriggerConfig } from './shrineConfig';

type TimeOfDay = 'day' | 'dusk' | 'night';
type Weather = 'clear' | 'humid' | 'rain';

// Dark Shrine lighting - mysterious dark temple with ethereal glows
const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  day: {
    ambientIntensity: 0.2,
    ambientColor: '#2a2a3a',
    directionalIntensity: 0.25,
    directionalColor: '#8888aa',
    directionalPosition: [10, 20, 10],
    fogColor: '#1a1a2a',
    fogNear: 20,
    fogFar: 90,
  },
  dusk: {
    ambientIntensity: 0.15,
    ambientColor: '#2a2030',
    directionalIntensity: 0.2,
    directionalColor: '#aa6688',
    directionalPosition: [30, 5, 10],
    fogColor: '#151520',
    fogNear: 15,
    fogFar: 75,
  },
  night: {
    ambientIntensity: 0.08,
    ambientColor: '#15151f',
    directionalIntensity: 0.1,
    directionalColor: '#5555aa',
    directionalPosition: [-10, 15, -10],
    fogColor: '#0a0a12',
    fogNear: 10,
    fogFar: 55,
  },
};

const THEME: ThemeConfig = {
  loadingBackground: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2a 100%)',
  debugAccentColor: '#aa88cc',
  debugButtonActiveColor: '#8855aa',
};

function getWeatherAdjustedLighting(lighting: LightingConfig, weather: Weather): LightingConfig {
  return {
    ...lighting,
    fogNear: weather === 'humid' ? 12 : weather === 'rain' ? 8 : lighting.fogNear,
    fogFar: weather === 'humid' ? 60 : weather === 'rain' ? 45 : lighting.fogFar,
    fogColor: weather === 'humid' ? '#1a1a25' : weather === 'rain' ? '#12121a' : lighting.fogColor,
    ambientIntensity: weather === 'rain' ? lighting.ambientIntensity * 0.6 : lighting.ambientIntensity,
    directionalIntensity: weather === 'rain' ? lighting.directionalIntensity * 0.4 : lighting.directionalIntensity,
  };
}

function ShrineParticles({ mapId }: { mapId: string }) {
  if (mapId.startsWith('s07a_')) {
    return <ShadowWispParticles intensity="normal" />;
  }
  if (mapId.startsWith('s07b_')) {
    return <LightDarkParticles intensity="normal" />;
  }
  if (mapId.startsWith('s07e_')) {
    return <ShadowWispParticles intensity="light" />;
  }
  if (mapId.startsWith('s07z_')) {
    return <LightDarkParticles intensity="heavy" />;
  }
  return null;
}

interface ShrineAreaProps {
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

export default function ShrineArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  triggers,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  children
}: ShrineAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={<ShrineEnv mapId={mapId} />}
      floorCollision={<ShrineFloorCollision mapId={mapId} />}
      particles={<ShrineParticles mapId={mapId} />}
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
