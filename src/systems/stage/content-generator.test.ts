/**
 * Content Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateEnemySpawns,
  createEnemyWaves,
  generateStageContent,
  generateMissionContent,
  validateMissionContent,
  createEmptyStageContent,
  addEnemiesToStage,
  stageAreaToEnemyArea,
  getBossForArea,
} from './content-generator';
import { createSeededRandom, isEnemyValidForArea } from './enemy-pools';
import { resetElementIdCounter } from './element-placer';
import type { MissionLayout, StageConfig, EnemyArea, GridCell } from './types';

// Mock stage config
const mockStageConfig: StageConfig = {
  gridSize: 54,
  gridOffset: [0, 0],
  gates: [
    { edge: 'north', x: -17, z: -27, scale: 1, animated: true },
    { edge: 'south', x: 14, z: 27, scale: 1, animated: true },
  ],
  spawnPoints: [
    { position: [-17, 1, -24], rotation: 0, label: 'North Gate' },
    { position: [14, 1, 24], rotation: Math.PI, label: 'South Gate' },
  ],
  triggers: [
    { position: [-17, 1, -29], rotation: 0, targetUrl: '/stage/valley', label: 'North Gate' },
    { position: [14, 1, 29], rotation: Math.PI, targetUrl: '/stage/valley', label: 'South Gate' },
  ],
};

// Mock mission layout
const mockLayout: MissionLayout = {
  area: 'valley-a',
  cells: [
    {
      pos: '0,2',
      stage: 'sa1',
      fullStageName: 's01a_sa1',
      connections: { south: '1,2' },
      start: true,
    },
    {
      pos: '1,2',
      stage: 'ib1',
      fullStageName: 's01a_ib1',
      connections: { north: '0,2', south: '2,2' },
      key: true,
    },
    {
      pos: '2,2',
      stage: 'ib2',
      fullStageName: 's01a_ib2',
      connections: { north: '1,2', south: '3,2' },
      keyGate: 'south',
    },
    {
      pos: '3,2',
      stage: 'ic1',
      fullStageName: 's01a_ic1',
      connections: { north: '2,2' },
      end: true,
      warp: 'east',
    },
  ],
  stageConfigs: {
    's01a_sa1': mockStageConfig,
    's01a_ib1': mockStageConfig,
    's01a_ib2': mockStageConfig,
    's01a_ic1': mockStageConfig,
  },
};

describe('Content Generator', () => {
  beforeEach(() => {
    resetElementIdCounter();
  });

  describe('stageAreaToEnemyArea', () => {
    it('should map valley to gurhacia', () => {
      expect(stageAreaToEnemyArea('valley-a')).toBe('gurhacia');
      expect(stageAreaToEnemyArea('valley-b')).toBe('gurhacia');
    });

    it('should map snowfield to rioh', () => {
      expect(stageAreaToEnemyArea('snowfield-a')).toBe('rioh');
    });

    it('should map wetland to ozette', () => {
      expect(stageAreaToEnemyArea('wetland-a')).toBe('ozette');
    });

    it('should map city to paru', () => {
      expect(stageAreaToEnemyArea('city-a')).toBe('paru');
    });

    it('should map ruins to makara', () => {
      expect(stageAreaToEnemyArea('ruins-a')).toBe('makara');
    });

    it('should map plant to arca', () => {
      expect(stageAreaToEnemyArea('plant-a')).toBe('arca');
    });

    it('should map shrine to dark', () => {
      expect(stageAreaToEnemyArea('shrine-a')).toBe('dark');
    });

    it('should default to gurhacia for unknown areas', () => {
      expect(stageAreaToEnemyArea('unknown')).toBe('gurhacia');
    });
  });

  describe('getBossForArea', () => {
    it('should return boss for gurhacia', () => {
      expect(getBossForArea('gurhacia')).toBe('boss_dragon');
    });

    it('should return boss for ozette', () => {
      expect(getBossForArea('ozette')).toBe('boss_octopus');
    });

    it('should return boss for paru', () => {
      expect(getBossForArea('paru')).toBe('boss_robot');
    });

    it('should return boss for arca', () => {
      expect(getBossForArea('arca')).toBe('boss_mother');
    });

    it('should return boss for dark', () => {
      expect(getBossForArea('dark')).toBe('boss_darkfalz');
    });

    it('should return null for areas without bosses', () => {
      expect(getBossForArea('rioh')).toBeNull();
      expect(getBossForArea('makara')).toBeNull();
    });
  });

  describe('generateEnemySpawns', () => {
    it('should generate spawns for a stage', () => {
      const random = createSeededRandom(12345);
      const spawns = generateEnemySpawns('gurhacia', 'normal', mockStageConfig, random);

      expect(spawns.length).toBeGreaterThan(0);
    });

    it('should only spawn enemies valid for the area', () => {
      const random = createSeededRandom(12345);
      const spawns = generateEnemySpawns('gurhacia', 'hard', mockStageConfig, random);

      for (const spawn of spawns) {
        expect(isEnemyValidForArea(spawn.enemyId, 'gurhacia')).toBe(true);
      }
    });

    it('should generate boss stage with boss enemy', () => {
      const random = createSeededRandom(12345);
      const spawns = generateEnemySpawns('gurhacia', 'normal', mockStageConfig, random, {
        isBossStage: true,
        bossId: 'boss_dragon',
      });

      const boss = spawns.find(s => s.enemyId === 'boss_dragon');
      expect(boss).toBeDefined();
      expect(boss?.position).toEqual([0, 0, 0]); // Boss at center
    });

    it('should avoid existing positions', () => {
      const random = createSeededRandom(12345);
      const existing: [number, number, number][] = [[0, 0, 0], [10, 0, 10]];
      const spawns = generateEnemySpawns('gurhacia', 'normal', mockStageConfig, random, {
        existingPositions: existing,
      });

      for (const spawn of spawns) {
        for (const ex of existing) {
          const dx = spawn.position[0] - ex[0];
          const dz = spawn.position[2] - ex[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          expect(dist).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const spawns1 = generateEnemySpawns('gurhacia', 'normal', mockStageConfig, random1);
      const spawns2 = generateEnemySpawns('gurhacia', 'normal', mockStageConfig, random2);

      expect(spawns1.length).toBe(spawns2.length);
      for (let i = 0; i < spawns1.length; i++) {
        expect(spawns1[i].enemyId).toBe(spawns2[i].enemyId);
        expect(spawns1[i].position).toEqual(spawns2[i].position);
      }
    });
  });

  describe('createEnemyWaves', () => {
    it('should create waves from spawns', () => {
      const spawns = [
        { enemyId: 'snake', position: [0, 0, 0] as [number, number, number], waveGroup: 0 },
        { enemyId: 'lizard', position: [5, 0, 5] as [number, number, number], waveGroup: 0 },
        { enemyId: 'lion', position: [10, 0, 10] as [number, number, number], waveGroup: 1 },
      ];

      const waves = createEnemyWaves(spawns);

      expect(waves.length).toBe(2);
      expect(waves[0].waveNumber).toBe(0);
      expect(waves[0].spawns.length).toBe(2);
      expect(waves[1].waveNumber).toBe(1);
      expect(waves[1].spawns.length).toBe(1);
    });

    it('should set immediate trigger for first wave', () => {
      const spawns = [
        { enemyId: 'snake', position: [0, 0, 0] as [number, number, number], waveGroup: 0 },
      ];

      const waves = createEnemyWaves(spawns);
      expect(waves[0].trigger.type).toBe('immediate');
    });

    it('should set previous-cleared trigger for later waves', () => {
      const spawns = [
        { enemyId: 'snake', position: [0, 0, 0] as [number, number, number], waveGroup: 0 },
        { enemyId: 'lion', position: [10, 0, 10] as [number, number, number], waveGroup: 1 },
      ];

      const waves = createEnemyWaves(spawns);
      expect(waves[1].trigger.type).toBe('previous-cleared');
    });

    it('should handle spawns without wave group (default to 0)', () => {
      const spawns = [
        { enemyId: 'snake', position: [0, 0, 0] as [number, number, number] },
        { enemyId: 'lizard', position: [5, 0, 5] as [number, number, number] },
      ];

      const waves = createEnemyWaves(spawns);
      expect(waves.length).toBe(1);
      expect(waves[0].spawns.length).toBe(2);
    });
  });

  describe('generateStageContent', () => {
    it('should generate complete stage content', () => {
      const random = createSeededRandom(12345);
      const content = generateStageContent(
        's01a_ib1',
        mockStageConfig,
        'gurhacia',
        'normal',
        random
      );

      expect(content.stageId).toBe('s01a_ib1');
      expect(content.waves.length).toBeGreaterThan(0);
      expect(content.elements.length).toBeGreaterThan(0);
      expect(content.dropTables.length).toBeGreaterThan(0);
      expect(content.requiresClear).toBe(true);
    });

    it('should add key when specified', () => {
      const random = createSeededRandom(12345);
      const content = generateStageContent(
        's01a_ib1',
        mockStageConfig,
        'gurhacia',
        'normal',
        random,
        { hasKey: true, keyGateId: 'keygate-test' }
      );

      const keyElement = content.elements.find(e => e.type === 'key');
      expect(keyElement).toBeDefined();
      expect(keyElement?.linkedTo).toBe('keygate-test');
    });

    it('should generate boss content for boss stage', () => {
      const random = createSeededRandom(12345);
      const content = generateStageContent(
        's01a_boss',
        mockStageConfig,
        'gurhacia',
        'normal',
        random,
        { isBossStage: true, bossId: 'boss_dragon' }
      );

      expect(content.bossId).toBe('boss_dragon');

      // Find boss in spawns
      const bossSpawn = content.waves
        .flatMap(w => w.spawns)
        .find(s => s.enemyId === 'boss_dragon');
      expect(bossSpawn).toBeDefined();
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      resetElementIdCounter();
      const content1 = generateStageContent('s01a_ib1', mockStageConfig, 'gurhacia', 'normal', random1);

      resetElementIdCounter();
      const content2 = generateStageContent('s01a_ib1', mockStageConfig, 'gurhacia', 'normal', random2);

      expect(content1.waves.length).toBe(content2.waves.length);
      expect(content1.elements.length).toBe(content2.elements.length);
    });
  });

  describe('generateMissionContent', () => {
    it('should generate complete mission content', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      expect(result.mission).toBeDefined();
      expect(result.mission.id).toContain('generated');
      expect(result.mission.layout).toBe(mockLayout);
      expect(result.metadata.seed).toBe(12345);
    });

    it('should generate content for all cells', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      for (const cell of mockLayout.cells) {
        expect(result.mission.stageContents[cell.pos]).toBeDefined();
      }
    });

    it('should include boss in end cell when includeBoss is true', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
        includeBoss: true,
      });

      const endCell = mockLayout.cells.find(c => c.end);
      const endContent = result.mission.stageContents[endCell!.pos];

      expect(endContent.bossId).toBe('boss_dragon');
    });

    it('should not include boss when includeBoss is false', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
        includeBoss: false,
      });

      const endCell = mockLayout.cells.find(c => c.end);
      const endContent = result.mission.stageContents[endCell!.pos];

      expect(endContent.bossId).toBeUndefined();
    });

    it('should track statistics', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      expect(result.metadata.totalEnemies).toBeGreaterThan(0);
      expect(result.metadata.totalBoxes).toBeGreaterThan(0);
      expect(result.metadata.generatedAt).toBeGreaterThan(0);
    });

    it('should calculate par time', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      expect(result.mission.parTime).toBeGreaterThan(0);
    });

    it('should be deterministic with same seed', () => {
      const result1 = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      const result2 = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      expect(result1.metadata.totalEnemies).toBe(result2.metadata.totalEnemies);
      expect(result1.metadata.totalBoxes).toBe(result2.metadata.totalBoxes);
    });

    it('should generate different content with different seeds', () => {
      const result1 = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      const result2 = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 54321,
      });

      // May have different enemy counts or compositions
      // At minimum, mission IDs should differ
      expect(result1.mission.id).not.toBe(result2.mission.id);
    });
  });

  describe('validateMissionContent', () => {
    it('should validate correct mission content', () => {
      const result = generateMissionContent(mockLayout, {
        enemyArea: 'gurhacia',
        difficulty: 'normal',
        playerLevel: 10,
        seed: 12345,
      });

      const validation = validateMissionContent(result.mission);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing mission ID', () => {
      const mission = {
        id: '',
        name: 'Test',
        enemyArea: 'gurhacia' as EnemyArea,
        stageArea: 'valley-a' as const,
        difficulty: 'normal' as const,
        layout: mockLayout,
        stageContents: {},
        recommendedLevel: 10,
      };

      const validation = validateMissionContent(mission);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('ID'))).toBe(true);
    });

    it('should detect missing stage contents', () => {
      const mission = {
        id: 'test',
        name: 'Test',
        enemyArea: 'gurhacia' as EnemyArea,
        stageArea: 'valley-a' as const,
        difficulty: 'normal' as const,
        layout: mockLayout,
        stageContents: { '0,2': createEmptyStageContent('s01a_sa1') }, // Missing other cells
        recommendedLevel: 10,
      };

      const validation = validateMissionContent(mission);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Missing stage content'))).toBe(true);
    });

    it('should detect invalid enemy area', () => {
      const mission = {
        id: 'test',
        name: 'Test',
        enemyArea: 'invalid' as EnemyArea,
        stageArea: 'valley-a' as const,
        difficulty: 'normal' as const,
        layout: mockLayout,
        stageContents: {},
        recommendedLevel: 10,
      };

      const validation = validateMissionContent(mission);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid enemy area'))).toBe(true);
    });
  });

  describe('createEmptyStageContent', () => {
    it('should create empty stage content', () => {
      const content = createEmptyStageContent('test-stage');

      expect(content.stageId).toBe('test-stage');
      expect(content.waves).toHaveLength(0);
      expect(content.elements).toHaveLength(0);
      expect(content.keyGates).toHaveLength(0);
      expect(content.fenceSwitchLinks).toHaveLength(0);
      expect(content.dropTables).toHaveLength(0);
      expect(content.requiresClear).toBe(false);
    });
  });

  describe('addEnemiesToStage', () => {
    it('should add enemies to empty stage', () => {
      const content = createEmptyStageContent('test-stage');
      const enemies = [
        { enemyId: 'snake', position: [0, 0, 0] as [number, number, number] },
        { enemyId: 'lizard', position: [5, 0, 5] as [number, number, number] },
      ];

      const updated = addEnemiesToStage(content, enemies);

      expect(updated.waves.length).toBe(1);
      expect(updated.waves[0].spawns.length).toBe(2);
    });

    it('should preserve other content', () => {
      const content = createEmptyStageContent('test-stage');
      content.dropTables = [{ id: 'test', entries: [], rolls: 1 }];

      const enemies = [{ enemyId: 'snake', position: [0, 0, 0] as [number, number, number] }];
      const updated = addEnemiesToStage(content, enemies);

      expect(updated.dropTables).toHaveLength(1);
    });

    it('should respect wave groups', () => {
      const content = createEmptyStageContent('test-stage');
      const enemies = [
        { enemyId: 'snake', position: [0, 0, 0] as [number, number, number], waveGroup: 0 },
        { enemyId: 'lion', position: [10, 0, 10] as [number, number, number], waveGroup: 1 },
      ];

      const updated = addEnemiesToStage(content, enemies);

      expect(updated.waves.length).toBe(2);
      expect(updated.waves[0].spawns[0].enemyId).toBe('snake');
      expect(updated.waves[1].spawns[0].enemyId).toBe('lion');
    });
  });
});
