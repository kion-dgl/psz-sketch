/**
 * Element Placer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_DROP_TABLES,
  getDropTable,
  getBoxParams,
  getPuzzleParams,
  generateRandomPositions,
  generatePositionNearGate,
  generateElementId,
  resetElementIdCounter,
  generateBoxes,
  generateFenceSwitchPuzzle,
  generateStageElements,
  generateKeyElement,
  findKeyPosition,
  validateElementPlacement,
  validateFenceSwitchLinks,
} from './element-placer';
import { createSeededRandom } from './enemy-pools';
import type { StageConfig, ContentDifficulty } from './types';

// Mock stage config for testing
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

describe('Element Placer', () => {
  beforeEach(() => {
    resetElementIdCounter();
  });

  describe('DEFAULT_DROP_TABLES', () => {
    it('should have common-box table', () => {
      const table = DEFAULT_DROP_TABLES['common-box'];
      expect(table).toBeDefined();
      expect(table.id).toBe('common-box');
      expect(table.entries.length).toBeGreaterThan(0);
      expect(table.meseta).toBeDefined();
    });

    it('should have uncommon-box table', () => {
      const table = DEFAULT_DROP_TABLES['uncommon-box'];
      expect(table).toBeDefined();
      expect(table.rolls).toBe(2);
    });

    it('should have rare-box table with better items', () => {
      const table = DEFAULT_DROP_TABLES['rare-box'];
      expect(table).toBeDefined();
      expect(table.rolls).toBe(3);

      // Should have high-tier items
      const itemIds = table.entries.map(e => e.itemId);
      expect(itemIds).toContain('trimate');
      expect(itemIds).toContain('sol-atomizer');
    });

    it('should have valid entry weights', () => {
      for (const table of Object.values(DEFAULT_DROP_TABLES)) {
        for (const entry of table.entries) {
          expect(entry.weight).toBeGreaterThan(0);
          expect(entry.minQuantity).toBeDefined();
          expect(entry.minQuantity).toBeLessThanOrEqual(entry.maxQuantity || 1);
        }
      }
    });
  });

  describe('getDropTable', () => {
    it('should return table by ID', () => {
      const table = getDropTable('common-box');
      expect(table).toBeDefined();
      expect(table?.id).toBe('common-box');
    });

    it('should return null for unknown table', () => {
      const table = getDropTable('unknown-table');
      expect(table).toBeNull();
    });
  });

  describe('getBoxParams', () => {
    it('should return params for normal difficulty', () => {
      const params = getBoxParams('normal');
      expect(params.minBoxes).toBe(1);
      expect(params.maxBoxes).toBe(3);
      expect(params.rareChance).toBe(0.05);
    });

    it('should have higher rare chance on hard', () => {
      const normal = getBoxParams('normal');
      const hard = getBoxParams('hard');
      expect(hard.rareChance).toBeGreaterThan(normal.rareChance);
    });

    it('should have higher box count on super-hard', () => {
      const normal = getBoxParams('normal');
      const superHard = getBoxParams('super-hard');
      expect(superHard.maxBoxes).toBeGreaterThan(normal.maxBoxes);
    });
  });

  describe('getPuzzleParams', () => {
    it('should return params for normal difficulty', () => {
      const params = getPuzzleParams('normal');
      expect(params.puzzleChance).toBe(0.2);
      expect(params.maxPuzzles).toBe(1);
    });

    it('should have higher puzzle chance on hard', () => {
      const normal = getPuzzleParams('normal');
      const hard = getPuzzleParams('hard');
      expect(hard.puzzleChance).toBeGreaterThan(normal.puzzleChance);
    });
  });

  describe('generateRandomPositions', () => {
    it('should generate requested number of positions', () => {
      const random = createSeededRandom(12345);
      const positions = generateRandomPositions(5, 54, 5, random);
      expect(positions.length).toBe(5);
    });

    it('should generate positions within bounds', () => {
      const random = createSeededRandom(12345);
      const gridSize = 54;
      const margin = 5;
      const positions = generateRandomPositions(10, gridSize, margin, random);

      const halfGrid = gridSize / 2;
      for (const [x, y, z] of positions) {
        expect(Math.abs(x)).toBeLessThanOrEqual(halfGrid);
        expect(Math.abs(z)).toBeLessThanOrEqual(halfGrid);
        expect(y).toBe(0);
      }
    });

    it('should maintain minimum distance between positions', () => {
      const random = createSeededRandom(12345);
      const positions = generateRandomPositions(10, 54, 5, random);
      const minDistance = 4;

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i][0] - positions[j][0];
          const dz = positions[i][2] - positions[j][2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          expect(dist).toBeGreaterThanOrEqual(minDistance);
        }
      }
    });

    it('should avoid existing positions', () => {
      const random = createSeededRandom(12345);
      const existing: [number, number, number][] = [[0, 0, 0], [10, 0, 10]];
      const positions = generateRandomPositions(5, 54, 5, random, existing);
      const minDistance = 4;

      for (const pos of positions) {
        for (const ex of existing) {
          const dx = pos[0] - ex[0];
          const dz = pos[2] - ex[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          expect(dist).toBeGreaterThanOrEqual(minDistance);
        }
      }
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const positions1 = generateRandomPositions(5, 54, 5, random1);
      const positions2 = generateRandomPositions(5, 54, 5, random2);

      expect(positions1).toEqual(positions2);
    });
  });

  describe('generatePositionNearGate', () => {
    it('should generate position south of north gate', () => {
      const random = createSeededRandom(12345);
      const pos = generatePositionNearGate('north', -17, -27, 5, random);

      expect(pos[2]).toBeGreaterThan(-27); // South is positive Z
    });

    it('should generate position north of south gate', () => {
      const random = createSeededRandom(12345);
      const pos = generatePositionNearGate('south', 14, 27, 5, random);

      expect(pos[2]).toBeLessThan(27); // North is negative Z
    });

    it('should generate position west of east gate', () => {
      const random = createSeededRandom(12345);
      const pos = generatePositionNearGate('east', 27, 0, 5, random);

      expect(pos[0]).toBeLessThan(27); // West is negative X
    });

    it('should generate position east of west gate', () => {
      const random = createSeededRandom(12345);
      const pos = generatePositionNearGate('west', -27, 0, 5, random);

      expect(pos[0]).toBeGreaterThan(-27); // East is positive X
    });
  });

  describe('generateElementId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateElementId('box');
      const id2 = generateElementId('box');
      const id3 = generateElementId('fence');

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });

    it('should include element type in ID', () => {
      const boxId = generateElementId('box');
      const fenceId = generateElementId('fence');

      expect(boxId).toContain('box');
      expect(fenceId).toContain('fence');
    });
  });

  describe('resetElementIdCounter', () => {
    it('should reset ID counter', () => {
      generateElementId('box');
      generateElementId('box');
      resetElementIdCounter();
      const newId = generateElementId('box');

      expect(newId).toBe('box-1');
    });
  });

  describe('generateBoxes', () => {
    it('should generate boxes within count range', () => {
      const random = createSeededRandom(12345);
      const boxes = generateBoxes('normal', 54, random);

      const params = getBoxParams('normal');
      expect(boxes.length).toBeGreaterThanOrEqual(params.minBoxes);
      expect(boxes.length).toBeLessThanOrEqual(params.maxBoxes);
    });

    it('should set box type correctly', () => {
      const random = createSeededRandom(12345);
      const boxes = generateBoxes('normal', 54, random);

      for (const box of boxes) {
        expect(['box', 'rare-box']).toContain(box.type);
      }
    });

    it('should assign drop tables', () => {
      const random = createSeededRandom(12345);
      const boxes = generateBoxes('normal', 54, random);

      for (const box of boxes) {
        expect(box.dropTable).toBeDefined();
        expect(['common-box', 'uncommon-box', 'rare-box']).toContain(box.dropTable);
      }
    });

    it('should have more rare boxes on harder difficulties (statistically)', () => {
      let normalRareCount = 0;
      let hardRareCount = 0;

      // Run multiple times to get statistical result
      for (let i = 0; i < 100; i++) {
        const normalRandom = createSeededRandom(i * 1000);
        const hardRandom = createSeededRandom(i * 1000);

        const normalBoxes = generateBoxes('normal', 54, normalRandom);
        const hardBoxes = generateBoxes('super-hard', 54, hardRandom);

        normalRareCount += normalBoxes.filter(b => b.type === 'rare-box').length;
        hardRareCount += hardBoxes.filter(b => b.type === 'rare-box').length;
      }

      // Hard should have more rare boxes overall
      expect(hardRareCount).toBeGreaterThan(normalRareCount);
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      resetElementIdCounter();
      const boxes1 = generateBoxes('normal', 54, random1);

      resetElementIdCounter();
      const boxes2 = generateBoxes('normal', 54, random2);

      expect(boxes1.length).toBe(boxes2.length);
      for (let i = 0; i < boxes1.length; i++) {
        expect(boxes1[i].position).toEqual(boxes2[i].position);
        expect(boxes1[i].type).toBe(boxes2[i].type);
      }
    });
  });

  describe('generateFenceSwitchPuzzle', () => {
    it('should generate fence and switch elements', () => {
      const random = createSeededRandom(12345);
      const result = generateFenceSwitchPuzzle(54, random);

      expect(result).not.toBeNull();
      expect(result!.elements.length).toBe(2);

      const fence = result!.elements.find(e => e.type === 'fence');
      const switchEl = result!.elements.find(e => e.type.endsWith('-switch'));

      expect(fence).toBeDefined();
      expect(switchEl).toBeDefined();
    });

    it('should create valid link between fence and switch', () => {
      const random = createSeededRandom(12345);
      const result = generateFenceSwitchPuzzle(54, random);

      expect(result).not.toBeNull();
      expect(result!.link.fenceId).toBeDefined();
      expect(result!.link.switchId).toBeDefined();
      expect(['step', 'interact', 'remote']).toContain(result!.link.switchType);

      // Elements should reference each other
      const fence = result!.elements.find(e => e.id === result!.link.fenceId);
      const switchEl = result!.elements.find(e => e.id === result!.link.switchId);

      expect(fence?.linkedTo).toBe(switchEl?.id);
      expect(switchEl?.linkedTo).toBe(fence?.id);
    });

    it('should avoid existing positions', () => {
      const random = createSeededRandom(12345);
      const existing: [number, number, number][] = [[0, 0, 0]];
      const result = generateFenceSwitchPuzzle(54, random, existing);

      if (result) {
        for (const element of result.elements) {
          const dx = element.position[0];
          const dz = element.position[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          expect(dist).toBeGreaterThanOrEqual(4);
        }
      }
    });
  });

  describe('generateStageElements', () => {
    it('should generate elements for a stage', () => {
      const random = createSeededRandom(12345);
      const result = generateStageElements('normal', mockStageConfig, random);

      expect(result.elements.length).toBeGreaterThan(0);
      expect(result.dropTables.length).toBeGreaterThan(0);
    });

    it('should include drop tables for all boxes', () => {
      const random = createSeededRandom(12345);
      const result = generateStageElements('normal', mockStageConfig, random);

      const boxElements = result.elements.filter(e => e.type === 'box' || e.type === 'rare-box');
      const dropTableIds = new Set(result.dropTables.map(t => t.id));

      for (const box of boxElements) {
        if (box.dropTable) {
          expect(dropTableIds.has(box.dropTable)).toBe(true);
        }
      }
    });

    it('should have valid fence-switch links', () => {
      // Run multiple times to ensure we get some puzzles
      for (let i = 0; i < 20; i++) {
        const random = createSeededRandom(i * 1000 + 99999); // Different seeds
        const result = generateStageElements('super-hard', mockStageConfig, random);

        if (result.fenceSwitchLinks.length > 0) {
          const validation = validateFenceSwitchLinks(result.fenceSwitchLinks, result.elements);
          expect(validation.valid).toBe(true);
          break;
        }
      }
    });

    it('should be deterministic with seeded random', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      resetElementIdCounter();
      const result1 = generateStageElements('hard', mockStageConfig, random1);

      resetElementIdCounter();
      const result2 = generateStageElements('hard', mockStageConfig, random2);

      expect(result1.elements.length).toBe(result2.elements.length);
      expect(result1.fenceSwitchLinks.length).toBe(result2.fenceSwitchLinks.length);
    });
  });

  describe('generateKeyElement', () => {
    it('should create key element with correct properties', () => {
      const position: [number, number, number] = [5, 0, 10];
      const keyGateId = 'keygate-1';
      const key = generateKeyElement(position, keyGateId);

      expect(key.type).toBe('key');
      expect(key.position).toEqual(position);
      expect(key.linkedTo).toBe(keyGateId);
    });

    it('should generate unique IDs', () => {
      const key1 = generateKeyElement([0, 0, 0], 'gate-1');
      const key2 = generateKeyElement([5, 0, 5], 'gate-2');

      expect(key1.id).not.toBe(key2.id);
    });
  });

  describe('findKeyPosition', () => {
    it('should return valid position within grid', () => {
      const random = createSeededRandom(12345);
      const position = findKeyPosition(mockStageConfig, random);

      const halfGrid = mockStageConfig.gridSize / 2;
      expect(Math.abs(position[0])).toBeLessThanOrEqual(halfGrid);
      expect(Math.abs(position[2])).toBeLessThanOrEqual(halfGrid);
    });

    it('should avoid existing positions', () => {
      const random = createSeededRandom(12345);
      const existing: [number, number, number][] = [[0, 0, 0], [5, 0, 5]];
      const position = findKeyPosition(mockStageConfig, random, existing);

      for (const ex of existing) {
        const dx = position[0] - ex[0];
        const dz = position[2] - ex[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        expect(dist).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe('validateElementPlacement', () => {
    it('should validate elements within bounds', () => {
      const elements = [
        { id: 'box-1', type: 'box' as const, position: [0, 0, 0] as [number, number, number] },
        { id: 'box-2', type: 'box' as const, position: [10, 0, 10] as [number, number, number] },
      ];

      const result = validateElementPlacement(elements, 54);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect out of bounds elements', () => {
      const elements = [
        { id: 'box-1', type: 'box' as const, position: [100, 0, 0] as [number, number, number] },
      ];

      const result = validateElementPlacement(elements, 54);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('out of bounds');
    });

    it('should detect overlapping elements', () => {
      const elements = [
        { id: 'box-1', type: 'box' as const, position: [0, 0, 0] as [number, number, number] },
        { id: 'box-2', type: 'box' as const, position: [0.5, 0, 0.5] as [number, number, number] },
      ];

      const result = validateElementPlacement(elements, 54);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('too close');
    });
  });

  describe('validateFenceSwitchLinks', () => {
    it('should validate correct links', () => {
      const elements = [
        { id: 'fence-1', type: 'fence' as const, position: [0, 0, 0] as [number, number, number] },
        { id: 'switch-1', type: 'step-switch' as const, position: [10, 0, 10] as [number, number, number] },
      ];

      const links = [
        { fenceId: 'fence-1', switchId: 'switch-1', switchType: 'step' as const },
      ];

      const result = validateFenceSwitchLinks(links, elements);
      expect(result.valid).toBe(true);
    });

    it('should detect missing fence', () => {
      const elements = [
        { id: 'switch-1', type: 'step-switch' as const, position: [10, 0, 10] as [number, number, number] },
      ];

      const links = [
        { fenceId: 'fence-1', switchId: 'switch-1', switchType: 'step' as const },
      ];

      const result = validateFenceSwitchLinks(links, elements);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('fence-1');
    });

    it('should detect missing switch', () => {
      const elements = [
        { id: 'fence-1', type: 'fence' as const, position: [0, 0, 0] as [number, number, number] },
      ];

      const links = [
        { fenceId: 'fence-1', switchId: 'switch-1', switchType: 'step' as const },
      ];

      const result = validateFenceSwitchLinks(links, elements);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('switch-1');
    });
  });
});
