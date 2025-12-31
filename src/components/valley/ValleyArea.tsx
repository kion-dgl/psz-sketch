import { useState, useCallback } from 'react';
import ValleyEnv, { ValleyFloorCollision } from './environments/ValleyEnv';
import SandParticles from './SandParticles';
import RainParticles from './RainParticles';
import StageArea, { type LightingConfig, type ThemeConfig } from '../shared/StageArea';
import StageObjects, { type StageObjectsConfig } from '../shared/StageObjects';
import { getMapConfig, getDefaultSpawn, type TriggerConfig, type SpawnPoint } from './valleyConfig';

// Rotate a point around the origin by given radians
function rotatePoint(x: number, z: number, radians: number): [number, number] {
  if (radians === 0) return [x, z];
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [
    x * cos - z * sin,
    x * sin + z * cos
  ];
}

// Triggers that only activate when a specific gate is unlocked
export interface LockedTrigger {
  gateId: string;
  trigger: TriggerConfig;
}

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
  stageRotation?: number; // Stage rotation in degrees (0, 90, 180, 270)
  triggers?: TriggerConfig[];
  lockedTriggers?: LockedTrigger[]; // Triggers that activate when gate is unlocked
  spawnPoints?: SpawnPoint[];
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  debugMode?: boolean;
  objects?: StageObjectsConfig;
  children?: React.ReactNode;
}

export default function ValleyArea({
  mapId,
  mapName,
  spawnPosition,
  spawnRotation,
  stageRotation = 0,
  triggers,
  lockedTriggers = [],
  spawnPoints,
  timeOfDay = 'day',
  weather = 'clear',
  debugMode = true,
  objects,
  children
}: ValleyAreaProps) {
  const baseLighting = LIGHTING_CONFIGS[timeOfDay];
  const lighting = getWeatherAdjustedLighting(baseLighting, weather);

  // Track which gates have been unlocked
  const [unlockedGates, setUnlockedGates] = useState<Set<string>>(new Set());

  // Handle gate unlock from switch
  const handleGateUnlocked = useCallback((gateId: string) => {
    setUnlockedGates(prev => {
      const next = new Set(prev);
      next.add(gateId);
      return next;
    });
  }, []);

  // Convert stage rotation from degrees to radians
  const stageRotationRad = (stageRotation * Math.PI) / 180;

  // Rotate spawn position and rotation if stage is rotated
  // (spawn is in stage-local coordinates, needs to be in world-space for player)
  let finalSpawnPosition = spawnPosition;
  let finalSpawnRotation = spawnRotation;
  if (stageRotation !== 0 && spawnPosition) {
    const [rotX, rotZ] = rotatePoint(spawnPosition[0], spawnPosition[2], stageRotationRad);
    finalSpawnPosition = [rotX, spawnPosition[1], rotZ];
    finalSpawnRotation = (spawnRotation || 0) + stageRotationRad;
  }

  // Rotate trigger positions (stage-local to world-space)
  const baseTriggers = triggers || [];
  const unlockedTriggersList = lockedTriggers
    .filter(lt => unlockedGates.has(lt.gateId))
    .map(lt => lt.trigger);

  const allTriggers = [...baseTriggers, ...unlockedTriggersList];

  const rotatedTriggers: TriggerConfig[] = stageRotation !== 0
    ? allTriggers.map(t => {
        const [rotX, rotZ] = rotatePoint(t.position[0], t.position[2], stageRotationRad);
        return {
          ...t,
          position: [rotX, t.position[1], rotZ] as [number, number, number],
          rotation: (t.rotation || 0) + stageRotationRad,
        };
      })
    : allTriggers;

  // Wrap environment in rotated group if needed
  const rotatedEnvironment = stageRotation !== 0 ? (
    <group rotation={[0, stageRotationRad, 0]}>
      <ValleyEnv mapId={mapId} />
    </group>
  ) : (
    <ValleyEnv mapId={mapId} />
  );

  // Pass rotation directly to floor collision (physics RigidBody doesn't inherit group rotation)
  const rotatedFloorCollision = (
    <ValleyFloorCollision mapId={mapId} rotation={stageRotationRad} />
  );

  return (
    <StageArea
      mapId={mapId}
      mapName={mapName}
      environment={rotatedEnvironment}
      floorCollision={rotatedFloorCollision}
      particles={<WeatherParticles weather={weather} />}
      lighting={lighting}
      theme={THEME}
      spawnPosition={finalSpawnPosition}
      spawnRotation={finalSpawnRotation}
      triggers={rotatedTriggers}
      spawnPoints={spawnPoints}
      getMapConfig={getMapConfig}
      getDefaultSpawn={getDefaultSpawn}
      debugMode={debugMode}
      addPiToSpawnRotation={true}
    >
      {/* Objects and children are in stage-local coordinates, wrap in rotated group */}
      {stageRotation !== 0 ? (
        <group rotation={[0, stageRotationRad, 0]}>
          {objects && (
            <StageObjects
              gates={objects.gates}
              boxes={objects.boxes}
              switches={objects.switches}
              onGateUnlocked={handleGateUnlocked}
            />
          )}
          {children}
        </group>
      ) : (
        <>
          {objects && (
            <StageObjects
              gates={objects.gates}
              boxes={objects.boxes}
              switches={objects.switches}
              onGateUnlocked={handleGateUnlocked}
            />
          )}
          {children}
        </>
      )}
    </StageArea>
  );
}
