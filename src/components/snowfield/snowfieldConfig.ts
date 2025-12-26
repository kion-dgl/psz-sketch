// Snowfield stage configuration - spawn points and triggers for each map

export interface TriggerConfig {
  position: [number, number, number];
  size?: [number, number, number]; // Default: [6, 3, 2] - wide enough to block paths
  rotation?: number; // Rotation in radians, for angled walkways
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

// Snowfield stage configurations - Generated from debug tool
// Configured maps: 38 (s03a_*, s03b_*, s03e_ia1, s03z_na1)

export const SNOWFIELD_CONFIG: Record<string, MapConfig> = {
  's03a_ga1': {
    spawnPoints: [
      {
        position: [-0.38, 1, 21.55],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [1.05, 1, -24.07],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [1.1, 1, -28.21],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-0.43, 1, 26.93],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_ib1': {
    spawnPoints: [
      {
        position: [0.86, 1, -23.45],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [8.43, 1, 24.83],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.9, 1, -28.64],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [8.67, 1, 30.88],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_ib2': {
    spawnPoints: [
      {
        position: [7.24, 1, -22.79],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [12.48, 1, 25.45],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [7.52, 1, -28.64],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [12.57, 1, 31.79],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_ic1': {
    spawnPoints: [
      {
        position: [-8.62, 1, -22.98],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [12, 1, 27.64],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-8.33, 1, -30.36],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [12.05, 1, 33.93],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_ic3': {
    spawnPoints: [
      {
        position: [2.05, 1, 27.07],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [4.62, 1, -26.45],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [2.19, 1, 32.74],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [4.62, 1, -32.4],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_lb1': {
    spawnPoints: [
      {
        position: [25.81, 1, -4.69],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-6.24, 1, -23.93],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [30.81, 1, -4.74],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [-6.29, 1, -28.79],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_lb3': {
    spawnPoints: [
      {
        position: [-15.38, 1, -22.21],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.19, 1, 7.83],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-15.62, 1, -28.45],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [28.62, 1, 7.69],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_lc1': {
    spawnPoints: [
      {
        position: [-4.43, 1, -27.02],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.71, 1, -8.45],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-4.48, 1, -34.12],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [30.05, 1, -8.88],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_lc2': {
    spawnPoints: [
      {
        position: [-15.62, 1, -25.17],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [28.9, 1, 14.98],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-15.67, 1, -33.79],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [34.38, 1, 15.17],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_na1': {
    spawnPoints: [
      {
        position: [2.38, 1, 21.45],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [2.57, 1, 26.07],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03a_nb2': {
    spawnPoints: [
      {
        position: [15.38, 1, 22.17],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [15.48, 1, 26.69],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03a_nc2': {
    spawnPoints: [
      {
        position: [-15.62, 1, 24.17],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-15.43, 1, 31.21],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03a_sa1': {
    spawnPoints: [
      {
        position: [-2.95, 1, 41.17],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-5.76, 1, 47.26],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03a_tb3': {
    spawnPoints: [
      {
        position: [-6.29, 1, 26.02],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-24.24, 1, -7.69],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [23.57, 1, -12.5],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6.14, 1, 30.45],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-28.67, 1, -7.36],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [31.43, 1, -12.6],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      }
    ]
  },
  's03a_tc3': {
    spawnPoints: [
      {
        position: [-28.1, 1, 12.5],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-4.48, 1, 24.69],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [24.67, 1, -15.31],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-34.67, 1, 12.17],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-4.62, 1, 30.83],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [32.67, 1, -15.07],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      }
    ]
  },
  's03a_td1': {
    spawnPoints: [
      {
        position: [-24.24, 1, 3.5],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.19, 1, 23.64],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [21.9, 1, -9.88],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [31.38, 1, -10.21],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-32.48, 1, 3.45],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [-0.1, 1, 28.83],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      }
    ]
  },
  's03a_td2': {
    spawnPoints: [
      {
        position: [-22.76, 1, 3.4],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [20.29, 1, -7.31],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-32.05, 1, 3.45],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [28.14, 1, -7.31],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03a_xb2': {
    spawnPoints: [
      {
        position: [-7.19, 1, -24.21],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [24.14, 1, 3.88],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-22.95, 1, 11.5],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-9.67, 1, 24.4],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6.95, 1, -32.17],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [31.19, 1, 4.07],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [-32.1, 1, 11.12],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      },
      {
        position: [-9.57, 1, 31.12],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 4'
      }
    ]
  },
  // Snowfield B maps - same geometry as A variants
  's03b_ga1': {
    spawnPoints: [
      {
        position: [-0.38, 1, 21.55],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [1.05, 1, -24.07],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [1.1, 1, -28.21],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-0.43, 1, 26.93],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_ib1': {
    spawnPoints: [
      {
        position: [0.86, 1, -23.45],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [8.43, 1, 24.83],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.9, 1, -28.64],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [8.67, 1, 30.88],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_ib2': {
    spawnPoints: [
      {
        position: [7.24, 1, -22.79],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [12.48, 1, 25.45],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [7.52, 1, -28.64],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [12.57, 1, 31.79],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_ic1': {
    spawnPoints: [
      {
        position: [-8.62, 1, -22.98],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [12, 1, 27.64],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-8.33, 1, -30.36],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [12.05, 1, 33.93],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_ic3': {
    spawnPoints: [
      {
        position: [2.05, 1, 27.07],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [4.62, 1, -26.45],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [2.19, 1, 32.74],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [4.62, 1, -32.4],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_lb1': {
    spawnPoints: [
      {
        position: [25.81, 1, -4.69],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-6.24, 1, -23.93],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [30.81, 1, -4.74],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-6.29, 1, -28.79],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_lb3': {
    spawnPoints: [
      {
        position: [-15.38, 1, -22.21],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.19, 1, 7.83],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-15.62, 1, -28.45],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [28.62, 1, 7.69],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_lc1': {
    spawnPoints: [
      {
        position: [-4.43, 1, -27.02],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.71, 1, -8.45],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-4.48, 1, -34.12],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [30.05, 1, -8.88],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_lc2': {
    spawnPoints: [
      {
        position: [-15.62, 1, -25.17],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [28.9, 1, 14.98],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-15.67, 1, -33.79],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [34.38, 1, 15.17],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_na1': {
    spawnPoints: [
      {
        position: [2.38, 1, 21.45],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [2.57, 1, 26.07],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03b_nb2': {
    spawnPoints: [
      {
        position: [15.38, 1, 22.17],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [15.48, 1, 26.69],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03b_nc2': {
    spawnPoints: [
      {
        position: [-15.62, 1, 24.17],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-15.43, 1, 31.21],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03b_sa1': {
    spawnPoints: [
      {
        position: [-2.95, 1, 41.17],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-5.76, 1, 47.26],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      }
    ]
  },
  's03b_tb3': {
    spawnPoints: [
      {
        position: [-6.29, 1, 26.02],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-24.24, 1, -7.69],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [23.57, 1, -12.5],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6.14, 1, 30.45],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-28.67, 1, -7.36],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [31.43, 1, -12.6],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      }
    ]
  },
  's03b_tc3': {
    spawnPoints: [
      {
        position: [-28.1, 1, 12.5],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-4.48, 1, 24.69],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [24.67, 1, -15.31],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-34.67, 1, 12.17],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-4.62, 1, 30.83],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [32.67, 1, -15.07],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      }
    ]
  },
  's03b_td1': {
    spawnPoints: [
      {
        position: [-24.24, 1, 3.5],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.19, 1, 23.64],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [21.9, 1, -9.88],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [31.38, 1, -10.21],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [-32.48, 1, 3.45],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [-0.1, 1, 28.83],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      }
    ]
  },
  's03b_td2': {
    spawnPoints: [
      {
        position: [-22.76, 1, 3.4],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [20.29, 1, -7.31],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-32.05, 1, 3.45],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [28.14, 1, -7.31],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      }
    ]
  },
  's03b_xb2': {
    spawnPoints: [
      {
        position: [-7.19, 1, -24.21],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [24.14, 1, 3.88],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-22.95, 1, 11.5],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-9.67, 1, 24.4],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6.95, 1, -32.17],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 1'
      },
      {
        position: [31.19, 1, 4.07],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 2'
      },
      {
        position: [-32.1, 1, 11.12],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/snowfield',
        label: 'Trigger 3'
      },
      {
        position: [-9.57, 1, 31.12],
        targetUrl: '/stage/snowfield',
        label: 'Trigger 4'
      }
    ]
  },
  // Snowfield E map - special/event variant
  's03e_ia1': {
    spawnPoints: [
      {
        position: [0, 1, 20],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0, 1, 25],
        targetUrl: '/stage/snowfield',
        label: 'Exit'
      }
    ]
  },
  // Snowfield Z map - zone/boss variant
  's03z_na1': {
    spawnPoints: [
      {
        position: [2.38, 1, 21.45],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [2.57, 1, 26.07],
        targetUrl: '/stage/snowfield',
        label: 'Exit'
      }
    ]
  }
};

// Helper to get config for a map, with fallback defaults
export function getMapConfig(mapId: string): MapConfig {
  return SNOWFIELD_CONFIG[mapId] || {
    spawnPoints: [{ position: [0, 5, 0], rotation: 0, label: 'Default', isDefault: true }],
    triggers: []
  };
}
