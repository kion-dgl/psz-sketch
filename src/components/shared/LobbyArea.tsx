import type { ReactNode } from 'react';
import GameArea, { type SpawnConfig, type GameAreaRenderProps } from './GameArea';
import { InteractiveTriggerUI } from './InteractiveTriggers';

export interface LobbyRenderProps extends GameAreaRenderProps {}

export interface LobbyAreaProps {
  // Render props for physics content
  renderPhysicsContent: (props: LobbyRenderProps) => ReactNode;
  // Environment elements outside physics (optional)
  environmentOutsidePhysics?: ReactNode;
  // Spawn configurations based on URL params
  spawnConfigs?: SpawnConfig[];
  // Default spawn position and rotation
  defaultSpawnPosition: [number, number, number];
  defaultSpawnRotation?: number;
  // Camera settings
  cameraDistance?: number;
  cameraHeight?: number;
  // Debug label for space key
  debugLabel?: string;
  // Background gradient for loading/no-character states
  backgroundGradient?: string;
  // Show interactive trigger UI
  showInteractiveTriggerUI?: boolean;
}

export default function LobbyArea({
  renderPhysicsContent,
  environmentOutsidePhysics,
  spawnConfigs = [],
  defaultSpawnPosition,
  defaultSpawnRotation = 0,
  cameraDistance = 6,
  cameraHeight = 3,
  debugLabel = 'Debug',
  backgroundGradient = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  showInteractiveTriggerUI = false
}: LobbyAreaProps) {
  return (
    <GameArea
      defaultSpawnPosition={defaultSpawnPosition}
      defaultSpawnRotation={defaultSpawnRotation}
      spawnConfigs={spawnConfigs}
      lobbyMode={true}
      cameraDistance={cameraDistance}
      cameraHeight={cameraHeight}
      debugLabel={debugLabel}
      backgroundGradient={backgroundGradient}
      environmentOutsidePhysics={environmentOutsidePhysics}
      renderPhysicsContent={renderPhysicsContent}
      overlayUI={
        showInteractiveTriggerUI
          ? ({ playerInInteractiveZone }) => <InteractiveTriggerUI playerInZone={playerInInteractiveZone} />
          : undefined
      }
    />
  );
}

// Re-export for convenience
export { type SpawnConfig } from './GameArea';
