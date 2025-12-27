import { type ReactNode } from 'react';
import GameArea, { type LightingConfig as BaseLightingConfig, type FogConfig } from './GameArea';
import Compass from '../ui/Compass';
import MapTrigger from '../valley/MapTrigger';
import DebugMarkers, { type SpawnPoint, type TriggerConfig } from './DebugMarkers';

export interface LightingConfig extends BaseLightingConfig {
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

export interface ThemeConfig {
  loadingBackground: string;
  loadingTextColor?: string;
  debugAccentColor: string;
  debugButtonActiveColor?: string;
}

export interface MapConfig {
  triggers: TriggerConfig[];
  spawnPoints: SpawnPoint[];
}

export interface StageAreaProps {
  // Required identifiers
  mapId: string;
  mapName: string;

  // Render components (passed as JSX)
  environment: ReactNode;
  floorCollision: ReactNode;
  particles?: ReactNode;

  // Lighting configuration
  lighting: LightingConfig;

  // Theme configuration
  theme: ThemeConfig;

  // Optional spawn/trigger configuration
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
  triggers?: TriggerConfig[];
  spawnPoints?: SpawnPoint[];

  // Optional config module functions
  getMapConfig?: (mapId: string) => MapConfig;
  getDefaultSpawn?: (config: MapConfig) => { position: [number, number, number]; rotation: number };

  // Debug and display options
  debugMode?: boolean;
  showDebugPanel?: boolean;
  addPiToSpawnRotation?: boolean;

  // Additional children to render in Physics
  children?: ReactNode;
}

export default function StageArea({
  mapId,
  mapName,
  environment,
  floorCollision,
  particles,
  lighting,
  theme,
  spawnPosition: propSpawn,
  spawnRotation: propRotation,
  triggers: propTriggers,
  spawnPoints: propSpawnPoints,
  getMapConfig,
  getDefaultSpawn: getDefaultSpawnFn,
  debugMode: initialDebug = true,
  showDebugPanel = true,
  addPiToSpawnRotation = true,
  children
}: StageAreaProps) {
  // Get config from module if provided, with prop overrides
  const mapConfig = getMapConfig ? getMapConfig(mapId) : { triggers: [], spawnPoints: [] };
  const defaultSpawn = getDefaultSpawnFn ? getDefaultSpawnFn(mapConfig) : { position: [0, 10, 0] as [number, number, number], rotation: 0 };

  const configSpawn = propSpawn || defaultSpawn.position;
  const configRotation = propRotation ?? defaultSpawn.rotation;
  const configTriggers = propTriggers && propTriggers.length > 0 ? propTriggers : mapConfig.triggers;
  const configSpawnPoints = propSpawnPoints && propSpawnPoints.length > 0 ? propSpawnPoints : mapConfig.spawnPoints;

  // Convert lighting to GameArea format
  const fog: FogConfig = {
    color: lighting.fogColor,
    near: lighting.fogNear,
    far: lighting.fogFar
  };

  const baseLighting: BaseLightingConfig = {
    ambientIntensity: lighting.ambientIntensity,
    ambientColor: lighting.ambientColor,
    directionalIntensity: lighting.directionalIntensity,
    directionalColor: lighting.directionalColor,
    directionalPosition: lighting.directionalPosition
  };

  return (
    <GameArea
      areaName={mapName}
      areaId={mapId}
      defaultSpawnPosition={configSpawn}
      defaultSpawnRotation={configRotation}
      addPiToSpawnRotation={addPiToSpawnRotation}
      lobbyMode={false}
      lighting={baseLighting}
      fog={fog}
      backgroundGradient={theme.loadingBackground}
      debugAccentColor={theme.debugAccentColor}
      showDebugPanel={showDebugPanel}
      debugLabel="Debug"
      environmentOutsidePhysics={
        <>
          {environment}
          {particles}
          {initialDebug && configSpawnPoints.length > 0 && (
            <DebugMarkers
              spawnPoints={configSpawnPoints}
              triggers={configTriggers}
            />
          )}
        </>
      }
      renderPhysicsContent={() => (
        <>
          {floorCollision}
          {configTriggers.map((trigger, index) => (
            <MapTrigger
              key={index}
              position={trigger.position}
              size={trigger.size || [6, 3, 2]}
              rotation={trigger.rotation || 0}
              targetUrl={trigger.targetUrl}
              targetMap={trigger.targetMap}
              label={trigger.label}
              spawnPosition={trigger.spawnPosition}
              spawnRotation={trigger.spawnRotation}
            />
          ))}
          {children}
        </>
      )}
      overlayUI={({ playerPosition }) => (
        <Compass rotation={playerPosition.rotation} position="bottom-left" />
      )}
    />
  );
}

// Re-export types for convenience
export type { SpawnPoint, TriggerConfig } from './DebugMarkers';
