// Wetlands stage configuration - spawn points and triggers for each map

export interface TriggerConfig {
  position: [number, number, number];
  size?: [number, number, number]; // Default: [6, 3, 2] - wide enough to block paths
  targetUrl?: string;
  targetMap?: string;
  label?: string;
  spawnPosition?: [number, number, number];
  spawnRotation?: number;
}

export interface SpawnPoint {
  position: [number, number, number];
  rotation: number;
  label?: string;
  isDefault?: boolean; // The spawn point used when entering the map
}

export interface MapConfig {
  spawnPoints: SpawnPoint[];
  triggers: TriggerConfig[];
}

// Legacy support - get default spawn
export function getDefaultSpawn(config: MapConfig): { position: [number, number, number]; rotation: number } {
  const defaultSpawn = config.spawnPoints.find(s => s.isDefault) || config.spawnPoints[0];
  return defaultSpawn
    ? { position: defaultSpawn.position, rotation: defaultSpawn.rotation }
    : { position: [0, 5, 0], rotation: 0 };
}

// Configuration for each wetlands map
export const WETLANDS_CONFIG: Record<string, MapConfig> = {
  's02a_ga1': {
    spawnPoints: [
      {
        position: [-0.03, 1, 22.93],
        rotation: 0, // Face -Z direction (toward Inner Bridge)
        label: 'From Hub',
        isDefault: true
      },
      {
        position: [1.29, 1, -25],
        rotation: Math.PI, // Face +Z direction (toward Hub exit)
        label: 'From Inner Bridge 1'
      }
    ],
    triggers: [
      {
        position: [-0.06, 1, 28.02],
        targetUrl: '/stage/wetlands',
        label: 'Exit to Hub'
      },
      {
        position: [1.29, 1, -27.1],
        targetUrl: '/stage/wetlands-s02a_ib1',
        label: 'To Inner Bridge 1'
      }
    ]
  },
  // Add more map configurations as needed
};

// Helper to get config for a map, with fallback defaults
export function getMapConfig(mapId: string): MapConfig {
  return WETLANDS_CONFIG[mapId] || {
    spawnPoints: [{ position: [0, 5, 0], rotation: 0, label: 'Default', isDefault: true }],
    triggers: []
  };
}
