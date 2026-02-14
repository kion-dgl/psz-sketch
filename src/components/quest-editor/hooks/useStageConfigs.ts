/**
 * useStageConfigs — Loads stage configs and provides gate helpers
 *
 * Uses paru-configs.json which contains 186 stages across s01-s05.
 * Provides filtering by area/variant and rotation-aware gate matching.
 */

import { useMemo } from 'react';
import paruConfigs from '../../../../docs/paru-configs.json';
import type { StageConfig } from '../../../systems/stage/types';
import type { Direction } from '../types';
import { EDITOR_AREAS } from '../types';

// Cast the JSON import
const ALL_CONFIGS = paruConfigs as unknown as Record<string, StageConfig>;

// ============================================================================
// Gate helpers (extracted from GridViewer)
// ============================================================================

const DIRECTION_ORDER: Direction[] = ['north', 'east', 'south', 'west'];

/** Get original gate directions for a stage (before rotation) */
export function getOriginalGates(stageName: string): Set<Direction> {
  const config = ALL_CONFIGS[stageName];
  if (!config) return new Set();
  return new Set(config.gates.map(g => g.edge as Direction));
}

/** Rotate a direction CW by degrees (0, 90, 180, 270) */
export function rotateDirection(dir: Direction, rotation: number): Direction {
  if (rotation === 0) return dir;
  const idx = DIRECTION_ORDER.indexOf(dir);
  if (idx < 0) return dir;
  const steps = ((rotation / 90) % 4 + 4) % 4;
  return DIRECTION_ORDER[(idx + steps) % 4];
}

/** Get gate directions after applying rotation (grid-space gates) */
export function getRotatedGates(stageName: string, rotation: number): Set<Direction> {
  const original = getOriginalGates(stageName);
  if (rotation === 0) return original;
  return new Set([...original].map(g => rotateDirection(g, rotation)));
}

/** Get opposite direction */
export function oppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
  };
  return opposites[dir];
}

/** Get neighbor position in a direction */
export function getNeighbor(row: number, col: number, dir: Direction): [number, number] {
  switch (dir) {
    case 'north': return [row - 1, col];
    case 'south': return [row + 1, col];
    case 'east': return [row, col + 1];
    case 'west': return [row, col - 1];
  }
}

/** Check if position is valid in grid */
export function isValidPos(row: number, col: number, gridSize: number): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

/** Get the StageConfig for a stage name */
export function getStageConfig(stageName: string): StageConfig | undefined {
  return ALL_CONFIGS[stageName];
}

// ============================================================================
// Stage filtering
// ============================================================================

/** Get all stage names for an area and variant */
export function getStagesForArea(areaKey: string, variant: string): string[] {
  const area = EDITOR_AREAS.find(a => a.key === areaKey);
  if (!area) return [];
  const prefix = `${area.prefix}${variant}_`;
  return Object.keys(ALL_CONFIGS).filter(k => k.startsWith(prefix));
}

/** Get stage suffix (e.g., "ib1" from "s01a_ib1") */
export function getStageSuffix(stageName: string): string {
  const idx = stageName.indexOf('_');
  return idx >= 0 ? stageName.substring(idx + 1) : stageName;
}

// ============================================================================
// Hook
// ============================================================================

export interface UseStageConfigsReturn {
  /** All available configs */
  allConfigs: Record<string, StageConfig>;
  /** Get stages filtered for current area/variant */
  getStages: (areaKey: string, variant: string) => string[];
  /** Get config for a specific stage */
  getConfig: (stageName: string) => StageConfig | undefined;
}

export function useStageConfigs(): UseStageConfigsReturn {
  const getStages = useMemo(() => {
    // Cache results by area+variant
    const cache = new Map<string, string[]>();
    return (areaKey: string, variant: string): string[] => {
      const key = `${areaKey}:${variant}`;
      if (!cache.has(key)) {
        cache.set(key, getStagesForArea(areaKey, variant));
      }
      return cache.get(key)!;
    };
  }, []);

  return {
    allConfigs: ALL_CONFIGS,
    getStages,
    getConfig: getStageConfig,
  };
}
