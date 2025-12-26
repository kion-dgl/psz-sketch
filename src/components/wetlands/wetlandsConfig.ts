// Wetlands stage configuration - spawn points and triggers for each map

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

// Wetlands stage configurations - Generated from debug tool
// Configured maps: 38

export const WETLANDS_CONFIG: Record<string, MapConfig> = {
  's02a_ga1': {
    spawnPoints: [
      {
        position: [0.19, 1, -20.54],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.19, 1, 18.51],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [0.43, 1, -23.73],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-0.1, 1, 21.85],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_ib1': {
    spawnPoints: [
      {
        position: [-5.81, 1, -26.35],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [4.14, 1, 26.94],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [4.05, 1, 30.7],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-5.86, 1, -29.73],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_ib2': {
    spawnPoints: [
      {
        position: [-5.86, 1, -26.39],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-5.9, 1, 27.04],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-5.9, 1, 31.37],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-5.95, 1, -29.44],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_ic1': {
    spawnPoints: [
      {
        position: [1.14, 1, -26.96],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-13.9, 1, 24.23],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [1.19, 1, -30.63],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-13.9, 1, 27.75],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_ic3': {
    spawnPoints: [
      {
        position: [-13.81, 1, 28.7],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-0.33, 1, -25.11],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.38, 1, -29.39],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-13.9, 1, 32.56],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_lb1': {
    spawnPoints: [
      {
        position: [-5.95, 1, -25.39],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [29.05, 1, 5.85],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-5.9, 1, -28.49],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [33.14, 1, 5.99],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_lb3': {
    spawnPoints: [
      {
        position: [29.29, 1, -7.77],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-5.95, 1, -26.44],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [33.33, 1, -7.87],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-5.86, 1, -30.2],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_lc1': {
    spawnPoints: [
      {
        position: [1.14, 1, -26.87],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [14.62, 1, 18.37],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [1.14, 1, -30.49],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [18.14, 1, 18.18],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_lc2': {
    spawnPoints: [
      {
        position: [0.1, 1, -28.54],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.14, 1, -0.15],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-0.19, 1, -31.54],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [31, 1, -0.06],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02a_na1': {
    spawnPoints: [
      {
        position: [-7.05, 1, 22.99],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-7.1, 1, 27.56],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02a_nb2': {
    spawnPoints: [
      {
        position: [5.95, 1, 26.32],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [5.95, 1, 30.56],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02a_nc2': {
    spawnPoints: [
      {
        position: [-0.1, 1, 25.65],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [0, 1, 29.51],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02a_sa1': {
    spawnPoints: [
      {
        position: [-0.14, 1, 20.94],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-0.14, 1, 25.61],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02a_tb3': {
    spawnPoints: [
      {
        position: [-23.48, 1, 7.8],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [26.76, 1, 5.7],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [5.9, 1, 26.61],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-27.67, 1, 7.7],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [31, 1, 5.75],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [6, 1, 30.75],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02a_tc3': {
    spawnPoints: [
      {
        position: [-25.43, 1, -13.96],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [26.86, 1, -0.54],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-0.19, 1, 25.46],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-30.9, 1, -14.06],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [30.86, 1, -0.54],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [-0.24, 1, 29.04],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02a_td1': {
    spawnPoints: [
      {
        position: [-26.95, 1, -5.92],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [26.9, 1, -8.35],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [5.9, 1, 26.51],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-31.81, 1, -5.92],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [31.24, 1, -8.35],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [5.95, 1, 29.65],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02a_td2': {
    spawnPoints: [
      {
        position: [26.95, 1, -8.39],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-26.95, 1, -4.87],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [6, 1, 26.37],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [30.95, 1, -8.35],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-32.24, 1, -5.06],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [5.95, 1, 30.27],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02a_xb2': {
    spawnPoints: [
      {
        position: [-5.81, 1, 27.89],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.67, 1, 7.42],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-28.33, 1, -4.96],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-5.81, 1, -26.49],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6, 1, 31.85],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [32.29, 1, 7.42],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [-34.05, 1, -4.92],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      },
      {
        position: [-5.9, 1, -30.92],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 4'
      }
    ]
  },
  's02b_ga1': {
    spawnPoints: [
      {
        position: [-8.15, 1, 16.34],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-8.25, 1, 21.79],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02b_ib1': {
    spawnPoints: [
      {
        position: [-11.3, 1, 21.84],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [10.8, 1, -23.71],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-11.1, 1, 26.84],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [10.6, 1, -27.96],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_ib2': {
    spawnPoints: [
      {
        position: [-10.85, 1, 22.04],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [11.75, 1, -22.86],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [11.5, 1, -28.26],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-10.95, 1, 27.49],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_ic1': {
    spawnPoints: [
      {
        position: [-8.6, 1, 24.24],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [13.15, 1, -24.71],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-8.7, 1, 28.84],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [13.2, 1, -29.61],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_ic3': {
    spawnPoints: [
      {
        position: [-8.1, 1, 19.29],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-5.65, 1, -24.71],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-7.95, 1, 23.79],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-5.5, 1, -28.51],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_lb1': {
    spawnPoints: [
      {
        position: [25.05, 1, -3.71],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [10.55, 1, -22.36],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [28.95, 1, -3.61],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [10.7, 1, -27.76],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_lb3': {
    spawnPoints: [
      {
        position: [23.65, 1, -7.66],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [11.05, 1, -24.06],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [29.05, 1, -7.71],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [10.85, 1, -28.26],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_lc1': {
    spawnPoints: [
      {
        position: [19.4, 1, -29.66],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [25.2, 1, 12.89],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [19.3, 1, -36.06],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [30.3, 1, 12.74],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_lc2': {
    spawnPoints: [
      {
        position: [-5.95, 1, -27.71],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.3, 1, 4.89],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6.2, 1, -31.31],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [31.65, 1, 4.79],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_na1': {
    spawnPoints: [
      {
        position: [-8.3, 1, 24.09],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-8.55, 1, 28.94],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02b_nb2': {
    spawnPoints: [
      {
        position: [-3.75, 1, 23.99],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-3.7, 1, 28.44],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02b_nc2': {
    spawnPoints: [
      {
        position: [9.95, 1, 22.44],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [9.95, 1, 27.64],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      }
    ]
  },
  's02b_sa1': {
    spawnPoints: [
      {
        position: [-7.45, 1, 21.64],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-1, 1, -26.41],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-7.8, 1, 26.24],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-0.6, 1, -30.46],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02b_tb3': {
    spawnPoints: [
      {
        position: [11.8, 1, -25.51],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.5, 1, 6.74],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-23.85, 1, 6.94],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-12.55, 1, 23.84],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [11.6, 1, -28.61],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [27.95, 1, 6.89],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [-28.55, 1, 6.84],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      },
      {
        position: [-12.65, 1, 28.24],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 4'
      }
    ]
  },
  's02b_tc3': {
    spawnPoints: [
      {
        position: [27.15, 1, 11.19],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [5.6, 1, 24.54],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-23.3, 1, -6.31],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [30.95, 1, 10.94],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [5.8, 1, 29.39],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [-29.6, 1, -6.26],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02b_td1': {
    spawnPoints: [
      {
        position: [-23.55, 1, -3.81],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-5.2, 1, 25.74],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [25.05, 1, -5.91],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-29.25, 1, -4.06],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [-5.2, 1, 30.54],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [29.6, 1, -6.06],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02b_td2': {
    spawnPoints: [
      {
        position: [-23.5, 1, -2.86],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.65, 1, -6.01],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-5.1, 1, 26.04],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-29.75, 1, -3.01],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [31.1, 1, -6.16],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [-5.15, 1, 29.99],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      }
    ]
  },
  's02b_xb2': {
    spawnPoints: [
      {
        position: [11.5, 1, -22.51],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [22.85, 1, -9.96],
        rotation: 4.7124, // 270°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-22.25, 1, -10.01],
        rotation: 1.5708, // 90°
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-12.4, 1, 21.84],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-28.1, 1, -9.96],
        rotation: 4.7124, // 270°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [11.55, 1, -27.66],
        rotation: 3.1416, // 180°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      },
      {
        position: [28.1, 1, -10.16],
        rotation: 1.5708, // 90°
        targetUrl: '/stage/wetlands',
        label: 'Trigger 3'
      },
      {
        position: [-12.45, 1, 26.94],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 4'
      }
    ]
  },
  's02e_ia1': {
    spawnPoints: [
      {
        position: [-10.8, 1, 20.94],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [10.85, 1, -25.61],
        rotation: 0.0000, // 0°
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-10.7, 1, 24.79],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 1'
      },
      {
        position: [10.6, 1, -29.16],
        targetUrl: '/stage/wetlands',
        label: 'Trigger 2'
      }
    ]
  },
  's02z_na1': {
    spawnPoints: [
      {
        position: [-0.1, 1, 16.44],
        rotation: 3.1416, // 180°
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: []
  }
};

// Helper to get config for a map, with fallback defaults
export function getMapConfig(mapId: string): MapConfig {
  return WETLANDS_CONFIG[mapId] || {
    spawnPoints: [{ position: [0, 5, 0], rotation: 0, label: 'Default', isDefault: true }],
    triggers: []
  };
}
