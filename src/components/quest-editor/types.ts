/**
 * Quest Editor Types
 * Extends stage/types.ts with editor-specific data structures
 */

import type { StageContent, StageArea, ContentDifficulty, StageConfig } from '../../systems/stage/types';

// ============================================================================
// Directions (re-used from grid generation)
// ============================================================================

export type Direction = 'north' | 'south' | 'east' | 'west';

// ============================================================================
// Cell Roles
// ============================================================================

export type CellRole = 'transit' | 'guard' | 'puzzle' | 'cache' | 'landmark' | 'boss';

export const ROLE_COLORS: Record<CellRole, string> = {
  transit: '#666',
  guard: '#cc4444',
  puzzle: '#ccaa44',
  cache: '#44aa44',
  landmark: '#4488cc',
  boss: '#cc8844',
};

export const ROLE_LABELS: Record<CellRole, string> = {
  transit: 'Transit',
  guard: 'Guard',
  puzzle: 'Puzzle',
  cache: 'Cache',
  landmark: 'Landmark',
  boss: 'Boss',
};

// ============================================================================
// Editor Grid Cell
// ============================================================================

export interface EditorGridCell {
  /** Stage ID with prefix (e.g., "s01a_ib1") */
  stageName: string;
  /** Rotation in degrees (0, 90, 180, 270). Only used for single-gate stages. */
  rotation?: number;
  /** Which gate direction is key-locked on this cell */
  lockedGate?: Direction;
  /** Cell role for visual and future content generation */
  role: CellRole;
  /** Whether this cell was manually placed (vs generated) */
  manual: boolean;
  /** Optional designer notes */
  notes?: string;
  /** Authored 3D position for key pickup [x, y, z] in stage-local coords */
  keyPosition?: [number, number, number];
}

// ============================================================================
// Quest Project (top-level save state)
// ============================================================================

export interface QuestProject {
  /** Unique project ID */
  id: string;
  /** Project display name */
  name: string;
  /** Area key from STAGE_AREAS (e.g., "valley", "wetlands") */
  areaKey: string;
  /** Area variant ("a" or "b") */
  variant: string;
  /** Grid dimension (NxN) */
  gridSize: number;
  /** Sparse cell map, keyed by "row,col" */
  cells: Record<string, EditorGridCell>;
  /** Start cell position "row,col" or null */
  startPos: string | null;
  /** End cell position "row,col" or null */
  endPos: string | null;
  /** Key-gate links: gateCell "row,col" → keyCell "row,col" */
  keyLinks: Record<string, string>;
  /** Quest metadata */
  metadata: QuestMetadata;
  /** Per-cell content (Milestone 2 placeholder) */
  cellContents: Record<string, StageContent>;
  /** Last modified ISO timestamp */
  lastModified: string;
  /** Schema version */
  version: number;
}

export interface QuestMetadata {
  questName: string;
  description: string;
  questType: 'exploration' | 'hunt' | 'collection' | 'escort' | 'story';
  difficulty: ContentDifficulty;
  recommendedLevel: number;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  cellPos?: string;
}

// ============================================================================
// Area config for the editor (which areas have configs available)
// ============================================================================

export interface EditorAreaConfig {
  key: string;
  name: string;
  prefix: string;
  variants: string[];
  available: boolean;
}

export const EDITOR_AREAS: EditorAreaConfig[] = [
  { key: 'valley', name: 'Gurhacia Valley', prefix: 's01', variants: ['a', 'b'], available: true },
  { key: 'wetlands', name: 'Ozette Wetlands', prefix: 's02', variants: ['a', 'b'], available: true },
  { key: 'snowfield', name: 'Rioh Snowfield', prefix: 's03', variants: ['a', 'b'], available: true },
  { key: 'makara', name: 'Makara Ruins', prefix: 's04', variants: ['a', 'b'], available: true },
  { key: 'paru', name: 'Oblivion City Paru', prefix: 's05', variants: ['a', 'b'], available: true },
  { key: 'arca', name: 'Arca Plant', prefix: 's06', variants: ['a', 'b'], available: false },
  { key: 'shrine', name: 'Dark Shrine', prefix: 's07', variants: ['a', 'b'], available: false },
  { key: 'tower', name: 'Eternal Tower', prefix: 's08', variants: [], available: false },
];

// ============================================================================
// Factory
// ============================================================================

export function createDefaultProject(id?: string): QuestProject {
  return {
    id: id || crypto.randomUUID(),
    name: 'New Quest',
    areaKey: 'valley',
    variant: 'a',
    gridSize: 5,
    cells: {},
    startPos: null,
    endPos: null,
    keyLinks: {},
    metadata: {
      questName: '',
      description: '',
      questType: 'exploration',
      difficulty: 'normal',
      recommendedLevel: 1,
    },
    cellContents: {},
    lastModified: new Date().toISOString(),
    version: 1,
  };
}
