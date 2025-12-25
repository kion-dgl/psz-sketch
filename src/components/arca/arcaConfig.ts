// Arca stage configuration - spawn points and triggers for each map

export interface TriggerConfig {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
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
  isDefault?: boolean;
}

export interface MapConfig {
  spawnPoints: SpawnPoint[];
  triggers: TriggerConfig[];
}

export function getDefaultSpawn(config: MapConfig): { position: [number, number, number]; rotation: number } {
  const defaultSpawn = config.spawnPoints.find(s => s.isDefault) || config.spawnPoints[0];
  return defaultSpawn
    ? { position: defaultSpawn.position, rotation: defaultSpawn.rotation }
    : { position: [0, 5, 0], rotation: 0 };
}

export function getMapConfig(mapId: string): MapConfig {
  return ARCA_CONFIG[mapId] || { spawnPoints: [{ position: [0, 5, 0], rotation: 0, isDefault: true }], triggers: [] };
}

// Arca stage configurations - Generated from debug tool
// Configured maps: 38

export const ARCA_CONFIG: Record<string, MapConfig> = {
  's06a_ga1': {
    spawnPoints: [
      {
        position: [-0.05, 1, -21.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.05, 1, 22.22],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.05, 1, -27.38],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [0.1, 1, 27.17],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_ib1': {
    spawnPoints: [
      {
        position: [-0.25, 1, -31.23],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0, 1, 29.67],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.05, 1, -34.93],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.1, 1, 35.07],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_ib2': {
    spawnPoints: [
      {
        position: [-0.35, 1, -32.03],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.3, 1, 30.62],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, -35.33],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.15, 1, 34.92],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_ic1': {
    spawnPoints: [
      {
        position: [-0.1, 1, -32.48],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.15, 1, -37.18],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06a_ic3': {
    spawnPoints: [
      {
        position: [-0.1, 1, 30.77],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0.15, 1, -31.33],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.1, 1, -36.33],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [0.05, 1, 36.47],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_lb1': {
    spawnPoints: [
      {
        position: [-0.15, 1, -31.78],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.85, 1, -0.43],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.25, 1, -35.23],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [35.1, 1, -0.38],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_lb3': {
    spawnPoints: [
      {
        position: [0.15, 1, -32.23],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [31.15, 1, -0.28],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, -35.23],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [35.35, 1, -0.33],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_lc1': {
    spawnPoints: [
      {
        position: [-0.05, 1, -27.58],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [31.15, 1, -0.23],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, -30.98],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.7, 1, -0.38],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_lc2': {
    spawnPoints: [
      {
        position: [0.1, 1, -31.43],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [29.3, 1, -0.03],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, -34.33],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [32.85, 1, -0.08],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_na1': {
    spawnPoints: [
      {
        position: [-0.15, 1, 29.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0, 1, 34.87],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06a_nb2': {
    spawnPoints: [
      {
        position: [-0.1, 1, 29.42],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0.15, 1, 34.97],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06a_nc2': {
    spawnPoints: [
      {
        position: [-0.25, 1, 28.47],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.15, 1, 32.72],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06a_sa1': {
    spawnPoints: [
      {
        position: [0.05, 1, -29.63],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.1, 1, 51.42],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.1, 1, -32.63],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [0.4, 1, 57.57],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06a_tb3': {
    spawnPoints: [
      {
        position: [-0.15, 1, 31.92],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.65, 1, -0.18],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-31.9, 1, -0.18],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.15, 1, 36.57],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.65, 1, -0.13],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [-35.4, 1, -0.33],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06a_tc3': {
    spawnPoints: [
      {
        position: [-30.85, 1, -0.23],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [29.9, 1, -0.03],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.05, 1, 26.22],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-35.95, 1, -0.23],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [35.15, 1, -0.18],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [-0.1, 1, 30.62],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06a_td1': {
    spawnPoints: [
      {
        position: [-31.85, 1, -0.23],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.65, 1, -0.23],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.05, 1, 28.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-35.6, 1, -0.28],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.4, 1, -0.08],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [-0.3, 1, 33.52],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06a_td2': {
    spawnPoints: [
      {
        position: [-31.7, 1, -0.13],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.3, 1, 28.47],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [30.65, 1, -0.13],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-34.8, 1, -0.08],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.1, 1, 34.67],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [34.4, 1, -0.13],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06a_xb2': {
    spawnPoints: [
      {
        position: [-0.25, 1, -31.43],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.65, 1, -0.13],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-31, 1, -0.18],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.25, 1, 30.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.1, 1, 34.87],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.85, 1, -0.03],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [-0.35, 1, -34.98],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      },
      {
        position: [-34.35, 1, -0.08],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 4'
      }
    ]
  },
  's06b_ga1': {
    spawnPoints: [
      {
        position: [-0.05, 1, 29.87],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0, 1, -31.98],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.15, 1, 34.72],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.25, 1, -35.08],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_ib1': {
    spawnPoints: [
      {
        position: [-0.3, 1, 28.17],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0, 1, -30.23],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.05, 1, 33.52],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [0, 1, -33.83],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_ib2': {
    spawnPoints: [
      {
        position: [0, 1, -28.48],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.15, 1, 27.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, 32.02],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.15, 1, -31.93],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_ic1': {
    spawnPoints: [
      {
        position: [-0.15, 1, 31.72],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0.05, 1, -31.58],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.1, 1, -34.38],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.05, 1, 35.87],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_ic3': {
    spawnPoints: [
      {
        position: [-0.1, 1, -32.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.15, 1, 31.57],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, -36.13],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.05, 1, 36.42],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_lb1': {
    spawnPoints: [
      {
        position: [-0.25, 1, -28.58],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [28.95, 1, 0.02],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, -32.08],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [33.05, 1, -0.08],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_lb3': {
    spawnPoints: [
      {
        position: [-0.15, 1, -30.78],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.35, 1, -0.13],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.2, 1, -34.08],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [33.9, 1, -0.03],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_lc1': {
    spawnPoints: [
      {
        position: [0.05, 1, -31.03],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.45, 1, 0.12],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.1, 1, -34.23],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.25, 1, 0.12],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_lc2': {
    spawnPoints: [
      {
        position: [0.1, 1, -31.38],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30, 1, -0.23],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.1, 1, -34.28],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.1, 1, 0.17],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_na1': {
    spawnPoints: [
      {
        position: [-0.05, 1, 24.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0.15, 1, 29.67],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06b_nb2': {
    spawnPoints: [
      {
        position: [-0.05, 1, 27.32],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, 31.82],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06b_nc2': {
    spawnPoints: [
      {
        position: [-0.05, 1, 25.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0.05, 1, 31.92],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      }
    ]
  },
  's06b_sa1': {
    spawnPoints: [
      {
        position: [0.1, 1, -22.78],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.25, 1, 21.32],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.2, 1, -26.03],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.25, 1, 25.42],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06b_tb3': {
    spawnPoints: [
      {
        position: [-30.6, 1, 0.02],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.5, 1, -0.18],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [0.1, 1, 27.02],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-34.25, 1, -0.03],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [32, 1, -0.08],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [0.1, 1, 31.87],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06b_tc3': {
    spawnPoints: [
      {
        position: [-32.95, 1, 0.02],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.85, 1, -0.08],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [0, 1, 29.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-36.35, 1, 0.27],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [35.5, 1, -0.08],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [-0.05, 1, 34.12],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06b_td1': {
    spawnPoints: [
      {
        position: [-29.55, 1, -0.08],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [29.95, 1, -0.28],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.15, 1, 29.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-34.05, 1, -0.13],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.05, 1, -0.13],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [0.1, 1, 34.22],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06b_td2': {
    spawnPoints: [
      {
        position: [-29.55, 1, -0.13],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.75, 1, 0.02],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.15, 1, 29.22],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-34.05, 1, -0.13],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [34.05, 1, -0.03],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [0, 1, 33.92],
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      }
    ]
  },
  's06b_xb2': {
    spawnPoints: [
      {
        position: [-0.05, 1, -31.18],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-29.35, 1, -0.23],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [29.95, 1, -0.23],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.1, 1, 29.67],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.05, 1, -34.08],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-34.15, 1, 0.02],
        rotation: 4.7124,
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      },
      {
        position: [34.25, 1, 0.02],
        rotation: 1.5708,
        targetUrl: '/stage/arca',
        label: 'Trigger 3'
      },
      {
        position: [-0.1, 1, 34.07],
        targetUrl: '/stage/arca',
        label: 'Trigger 4'
      }
    ]
  },
  's06e_ia1': {
    spawnPoints: [
      {
        position: [16.7, 1, 24.97],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.05, 1, -24.78],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [16.95, 1, 29.62],
        targetUrl: '/stage/arca',
        label: 'Trigger 1'
      },
      {
        position: [-0.15, 1, -28.38],
        targetUrl: '/stage/arca',
        label: 'Trigger 2'
      }
    ]
  },
  's06z_na1': {
    spawnPoints: [
      {
        position: [0.7, 1, 12.22],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: []
  }
};
