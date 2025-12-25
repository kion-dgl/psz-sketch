// Makara stage configuration - spawn points and triggers for each map

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
  return MAKARA_CONFIG[mapId] || { spawnPoints: [{ position: [0, 5, 0], rotation: 0, isDefault: true }], triggers: [] };
}

// Makara stage configurations - Generated from debug tool
// Configured maps: 38

export const MAKARA_CONFIG: Record<string, MapConfig> = {
  's04a_ga1': {
    spawnPoints: [
      {
        position: [-4.9, 1, -22.63],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0.15, 1, 22.32],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-4.9, 1, -27.53],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [0.05, 1, 27.72],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_ib1': {
    spawnPoints: [
      {
        position: [-4.95, 1, -22.53],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0.1, 1, 21.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-4.9, 1, -27.73],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [0.15, 1, 27.57],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_ib2': {
    spawnPoints: [
      {
        position: [-5.05, 1, -22.38],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.25, 1, 22.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-5.1, 1, -27.73],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [-0.15, 1, 27.72],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_ic1': {
    spawnPoints: [
      {
        position: [-7.75, 1, -22.28],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [6.85, 1, 22.32],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-8.1, 1, -27.83],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [7.05, 1, 27.42],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_ic3': {
    spawnPoints: [
      {
        position: [-7.75, 1, -22.08],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [7.45, 1, 21.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-7.85, 1, -27.43],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [7.4, 1, 26.97],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_lb1': {
    spawnPoints: [
      {
        position: [-5.15, 1, -21.73],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [21.85, 1, -4.93],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-4.8, 1, -27.38],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [26.45, 1, -5.23],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_lb3': {
    spawnPoints: [
      {
        position: [0.1, 1, -21.88],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [21.75, 1, -5.13],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.15, 1, -27.43],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.45, 1, -5.13],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_lc1': {
    spawnPoints: [
      {
        position: [-7.85, 1, -22.28],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.65, 1, 1.72],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-7.7, 1, -27.98],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.7, 1, 1.82],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_lc2': {
    spawnPoints: [
      {
        position: [-7.75, 1, -22.73],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.1, 1, 1.72],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-7.95, 1, -27.98],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.95, 1, 1.87],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04a_na1': {
    spawnPoints: [
      {
        position: [4.95, 1, 20.97],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [4.95, 1, 27.32],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04a_nb2': {
    spawnPoints: [
      {
        position: [0.1, 1, 21.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0.05, 1, 26.97],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04a_nc2': {
    spawnPoints: [
      {
        position: [-1.9, 1, 21.67],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-1.95, 1, 26.67],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04a_sa1': {
    spawnPoints: [
      {
        position: [-0.1, 1, 22.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0, 1, 27.92],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04a_tb3': {
    spawnPoints: [
      {
        position: [-22.25, 1, 4.77],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [21.75, 1, 0.17],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [4.65, 1, 21.67],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-28.35, 1, 5.02],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [28.1, 1, 0.32],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [4.8, 1, 27.77],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04a_tc3': {
    spawnPoints: [
      {
        position: [-12.45, 1, 20.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-21.5, 1, 7.12],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [21.65, 1, -7.58],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-12.45, 1, 27.77],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [-27.85, 1, 7.47],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [27.85, 1, -7.73],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04a_td1': {
    spawnPoints: [
      {
        position: [-22.5, 1, 5.12],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.1, 1, 0.12],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [5, 1, 20.87],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-28, 1, 4.97],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.95, 1, 0.07],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [5.1, 1, 27.67],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04a_td2': {
    spawnPoints: [
      {
        position: [-21.65, 1, 4.77],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [21.65, 1, 0.17],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [4.95, 1, 21.47],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-28, 1, 4.82],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [28, 1, -0.08],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [4.9, 1, 27.07],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04a_xb2': {
    spawnPoints: [
      {
        position: [-22.45, 1, 4.72],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [12.1, 1, -21.43],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [22.25, 1, 0.32],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [4.8, 1, 21.12],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-27.85, 1, 4.77],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [12.35, 1, -27.53],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [28, 1, 0.12],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      },
      {
        position: [4.9, 1, 26.92],
        targetUrl: '/stage/makara',
        label: 'Trigger 4'
      }
    ]
  },
  's04b_ga1': {
    spawnPoints: [
      {
        position: [-0.25, 1, 21.12],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, 28.72],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04b_ib1': {
    spawnPoints: [
      {
        position: [-0.05, 1, -22.18],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.15, 1, 20.62],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, 27.52],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [0.05, 1, -27.58],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_ib2': {
    spawnPoints: [
      {
        position: [-0.05, 1, 21.77],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.15, 1, -22.28],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, 27.22],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [-0.05, 1, -27.33],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_ic1': {
    spawnPoints: [
      {
        position: [0.2, 1, -22.78],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0.1, 1, 22.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, 29.22],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [0.15, 1, -29.23],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_ic3': {
    spawnPoints: [
      {
        position: [-15.25, 1, 20.77],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [10, 1, -24.48],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-14.9, 1, 28.97],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [10.3, 1, -29.63],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_lb1': {
    spawnPoints: [
      {
        position: [-0.15, 1, -22.48],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.05, 1, 0.22],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, -27.28],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.9, 1, 0.02],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_lb3': {
    spawnPoints: [
      {
        position: [-0.1, 1, -22.18],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.45, 1, 0.12],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.1, 1, -27.68],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.95, 1, 0.07],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_lc1': {
    spawnPoints: [
      {
        position: [-5, 1, -23.68],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.75, 1, 15.07],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-5.05, 1, -28.83],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [28.85, 1, 15.07],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_lc2': {
    spawnPoints: [
      {
        position: [10.05, 1, -23.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [25.3, 1, 5.52],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [10.15, 1, -29.48],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [29.9, 1, 5.72],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_na1': {
    spawnPoints: [
      {
        position: [-0.1, 1, 21.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, 27.27],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04b_nb2': {
    spawnPoints: [
      {
        position: [-0.1, 1, 21.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.1, 1, 27.42],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04b_nc2': {
    spawnPoints: [
      {
        position: [-0.1, 1, 23.07],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0, 1, 29.32],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      }
    ]
  },
  's04b_sa1': {
    spawnPoints: [
      {
        position: [-0.25, 1, 21.02],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [0, 1, -22.83],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0, 1, 27.47],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [0, 1, -27.38],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04b_tb3': {
    spawnPoints: [
      {
        position: [-22.7, 1, -0.03],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.7, 1, -0.23],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.25, 1, 21.22],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-28, 1, -0.13],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.85, 1, -0.18],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [-0.1, 1, 27.07],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04b_tc3': {
    spawnPoints: [
      {
        position: [-22.2, 1, -15.18],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [24.7, 1, 9.97],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [0.1, 1, 22.42],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-30, 1, -15.33],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [28.9, 1, 9.97],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [0.1, 1, 28.32],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04b_td1': {
    spawnPoints: [
      {
        position: [-22.1, 1, -0.13],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.3, 1, -0.08],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.2, 1, 21.47],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-27.95, 1, -0.03],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.95, 1, 0.12],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [-0.15, 1, 26.82],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04b_td2': {
    spawnPoints: [
      {
        position: [-22.35, 1, -0.28],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.85, 1, 0.12],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.2, 1, 21.27],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-28.05, 1, -0.23],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [27.8, 1, 0.02],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [-0.2, 1, 27.02],
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      }
    ]
  },
  's04b_xb2': {
    spawnPoints: [
      {
        position: [0.1, 1, -22.48],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [23.05, 1, 0.52],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [0, 1, 22.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-22.4, 1, -0.08],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.05, 1, -27.23],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [-0.1, 1, 27.27],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      },
      {
        position: [27.95, 1, 0.27],
        rotation: 4.7124,
        targetUrl: '/stage/makara',
        label: 'Trigger 3'
      },
      {
        position: [-28.05, 1, -0.13],
        rotation: 1.5708,
        targetUrl: '/stage/makara',
        label: 'Trigger 4'
      }
    ]
  },
  's04e_ia1': {
    spawnPoints: [
      {
        position: [-0.2, 1, 22.12],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.1, 1, -22.53],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.05, 1, 27.47],
        targetUrl: '/stage/makara',
        label: 'Trigger 1'
      },
      {
        position: [0.2, 1, -27.03],
        targetUrl: '/stage/makara',
        label: 'Trigger 2'
      }
    ]
  },
  's04z_na1': {
    spawnPoints: [
      {
        position: [-0.25, 1, 14.57],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: []
  }
};
