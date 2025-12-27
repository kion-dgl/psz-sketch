// Valley stage configuration - spawn points and triggers for each map

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
  return VALLEY_CONFIG[mapId] || { spawnPoints: [{ position: [0, 5, 0], rotation: 0, isDefault: true }], triggers: [] };
}

// Valley stage configurations - Generated from debug tool
// Configured maps: 38

export const VALLEY_CONFIG: Record<string, MapConfig> = {
  's01a_ga1': {
    spawnPoints: [
      {
        position: [-6.3, 1, 23.47],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [1.9, 1, -23.88],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [1.85, 1, -27.28],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-6.1, 1, 28.27],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_ib1': {
    spawnPoints: [
      {
        position: [-17.3, 1, -22.28],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [14.2, 1, 21.97],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-17.15, 1, -25.78],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [14.25, 1, 26.42],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_ib2': {
    spawnPoints: [
      {
        position: [11.8, 1, 22.42],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-17.3, 1, -22.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-17.15, 1, -26.63],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [11.8, 1, 27.02],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_ic1': {
    spawnPoints: [
      {
        position: [-13.6, 1, -23.23],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [11.05, 1, 14.42],
        rotation: 3.9270,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-13.4, 1, -26.23],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [15.65, 1, 16.47],
        rotation: 3.9270,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_ic3': {
    spawnPoints: [
      {
        position: [-19.05, 1, -17.43],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [18.95, 1, 22.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-18.85, 1, -20.88],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [19.05, 1, 26.87],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_lb1': {
    spawnPoints: [
      {
        position: [-17.2, 1, -22.28],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.05, 1, -11.18],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-17.05, 1, -25.98],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [34.6, 1, -14.98],
        rotation: 2.3562,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_lb3': {
    spawnPoints: [
      {
        position: [-6.2, 1, -27.28],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [21.75, 1, 12.02],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-6.2, 1, -30.53],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [26.15, 1, 11.67],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_lc1': {
    spawnPoints: [
      {
        position: [-13.35, 1, -23.23],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [18.6, 1, 13.47],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-13.45, 1, -26.43],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [23.05, 1, 13.42],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_lc2': {
    spawnPoints: [
      {
        position: [28.85, 1, -10.43],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [14.1, 1, -25.43],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [32.85, 1, -10.53],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [13.75, 1, -28.63],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01a_na1': {
    spawnPoints: [
      {
        position: [19, 1, 17.12],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [19.1, 1, 21.87],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01a_nb2': {
    spawnPoints: [
      {
        position: [16.65, 1, 23.12],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [16.75, 1, 27.87],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01a_nc2': {
    spawnPoints: [
      {
        position: [-14.15, 1, 23.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-14.15, 1, 27.92],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01a_sa1': {
    spawnPoints: [
      {
        position: [-2.35, 1, 23.42],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-2.15, 1, 28.67],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01a_tb3': {
    spawnPoints: [
      {
        position: [-21.05, 1, -11.88],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [24.6, 1, 8.52],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [6, 1, 26.92],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [6.2, 1, 31.02],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [29.2, 1, 8.17],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [-25.7, 1, -12.23],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01a_tc3': {
    spawnPoints: [
      {
        position: [29.1, 1, -16.93],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [18.95, 1, 23.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-28, 1, 5.92],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [19.1, 1, 27.97],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-31.35, 1, 5.47],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [33.3, 1, -16.78],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01a_td1': {
    spawnPoints: [
      {
        position: [-28.15, 1, -16.13],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [28.5, 1, 0.87],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-13.95, 1, 24.92],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-13.75, 1, 29.02],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [31.5, 1, 0.67],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [-31.3, 1, -16.28],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01a_td2': {
    spawnPoints: [
      {
        position: [-29.05, 1, -0.48],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [27.6, 1, 6.32],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-14.8, 1, 24.82],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-32.3, 1, -0.33],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-14.7, 1, 29.07],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [31.05, 1, 6.47],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01a_xb2': {
    spawnPoints: [
      {
        position: [-16.95, 1, -23.08],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-33.25, 1, 15.82],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [11.9, 1, 23.42],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [31.8, 1, -4.18],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-16.7, 1, -26.98],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-36.75, 1, 16.02],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [12, 1, 27.22],
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      },
      {
        position: [35.45, 1, -5.08],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 4'
      }
    ]
  },
  's01b_ga1': {
    spawnPoints: [
      {
        position: [4.9, 1, 27.27],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [5, 1, 31.47],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01b_ib1': {
    spawnPoints: [
      {
        position: [16.6, 1, 26.07],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-16.75, 1, -19.33],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [14.7, 1, 33.17],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-17.1, 1, -23.78],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_ib2': {
    spawnPoints: [
      {
        position: [10.6, 1, -31.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [7.2, 1, 22.97],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [7.4, 1, 27.07],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [11.3, 1, -34.58],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_ic1': {
    spawnPoints: [
      {
        position: [-16.8, 1, -24.78],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [16.55, 1, 25.97],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-16.7, 1, -27.48],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [15.25, 1, 30.82],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_ic3': {
    spawnPoints: [
      {
        position: [-13.7, 1, 30.57],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [14.55, 1, -34.13],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-13.35, 1, 35.07],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [14.5, 1, -37.13],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_lb1': {
    spawnPoints: [
      {
        position: [-17, 1, -20.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [29.8, 1, -16.98],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-16.95, 1, -24.38],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [33.55, 1, -17.08],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_lb3': {
    spawnPoints: [
      {
        position: [-17.5, 1, -28.13],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [30.55, 1, -16.93],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-18.7, 1, -31.43],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [34.3, 1, -17.18],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_lc1': {
    spawnPoints: [
      {
        position: [-17, 1, -25.73],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [33.95, 1, 2.72],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-16.2, 1, -29.28],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [37.4, 1, 2.52],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_lc2': {
    spawnPoints: [
      {
        position: [10.15, 1, -36.23],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [25.65, 1, 15.72],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [10.1, 1, -39.38],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [29.45, 1, 15.67],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_na1': {
    spawnPoints: [
      {
        position: [16.7, 1, 25.02],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [17.05, 1, 29.67],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01b_nb2': {
    spawnPoints: [
      {
        position: [-11.25, 1, 29.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-10.95, 1, 33.77],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01b_nc2': {
    spawnPoints: [
      {
        position: [-10, 1, 32.67],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: [
      {
        position: [-9.9, 1, 37.12],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      }
    ]
  },
  's01b_sa1': {
    spawnPoints: [
      {
        position: [5.05, 1, 35.47],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-5.1, 1, -23.48],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [5.15, 1, 40.67],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-5.1, 1, -26.88],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01b_tb3': {
    spawnPoints: [
      {
        position: [-22.4, 1, 16.77],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [16.9, 1, 21.72],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [31.6, 1, -14.83],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [-25.8, 1, 16.67],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [16.9, 1, 25.57],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [35.5, 1, -14.58],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01b_tc3': {
    spawnPoints: [
      {
        position: [29.75, 1, -11.33],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [11.95, 1, 25.22],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-26.35, 1, 15.52],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [33.7, 1, -11.23],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [12.15, 1, 29.62],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [-29.85, 1, 15.52],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01b_td1': {
    spawnPoints: [
      {
        position: [31.05, 1, -12.58],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-31.55, 1, 6.47],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [10.75, 1, 29.67],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [34.95, 1, -12.73],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-35.1, 1, 6.32],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [10.9, 1, 33.57],
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01b_td2': {
    spawnPoints: [
      {
        position: [30.7, 1, 5.82],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-31.5, 1, -3.18],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-13.95, 1, 28.37],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [34.55, 1, 5.97],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-34.8, 1, -3.28],
        rotation: 1.5708,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [-13.75, 1, 32.17],
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      }
    ]
  },
  's01b_xb2': {
    spawnPoints: [
      {
        position: [17.1, 1, 26.52],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [-29.8, 1, 16.72],
        rotation: 1.5708,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [-9.45, 1, -21.58],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: false
      },
      {
        position: [27.85, 1, -14.68],
        rotation: 4.7124,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [19.15, 1, 31.22],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-33.45, 1, 16.57],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      },
      {
        position: [-9.5, 1, -24.68],
        targetUrl: '/stage/valley',
        label: 'Trigger 3'
      },
      {
        position: [31.3, 1, -14.58],
        rotation: 4.7124,
        targetUrl: '/stage/valley',
        label: 'Trigger 4'
      }
    ]
  },
  's01e_ia1': {
    spawnPoints: [
      {
        position: [-7.65, 1, -27.93],
        rotation: 0.0000,
        label: 'Spawn Point',
        isDefault: true
      },
      {
        position: [3.4, 1, 27.27],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: false
      }
    ],
    triggers: [
      {
        position: [3.7, 1, 31.07],
        targetUrl: '/stage/valley',
        label: 'Trigger 1'
      },
      {
        position: [-7.7, 1, -30.58],
        targetUrl: '/stage/valley',
        label: 'Trigger 2'
      }
    ]
  },
  's01z_na1': {
    spawnPoints: [
      {
        position: [0.25, 1, 11.97],
        rotation: 3.1416,
        label: 'Spawn Point',
        isDefault: true
      }
    ],
    triggers: []
  }
};
