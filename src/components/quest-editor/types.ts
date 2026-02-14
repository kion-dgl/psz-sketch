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
// Cell Objects (placed in 3D stage)
// ============================================================================

export type CellObjectType = 'box' | 'rare_box' | 'enemy' | 'fence' | 'step_switch' | 'message';

export interface CellObject {
  /** Unique ID within cell (e.g., "box_0", "enemy_1") */
  id: string;
  /** Object type */
  type: CellObjectType;
  /** Stage-local position [x, y, z] */
  position: [number, number, number];
  /** Y-axis rotation in degrees */
  rotation?: number;
  /** Enemy ID for type='enemy' */
  enemy_id?: string;
  /** Links switch↔fence pairs with matching link_id */
  link_id?: string;
  /** Spawn wave number for type='enemy' (default 1) */
  wave?: number;
  /** Message text for type='message' */
  text?: string;
}

export const CELL_OBJECT_COLORS: Record<CellObjectType, string> = {
  box: '#aa6633',
  rare_box: '#ddaa33',
  enemy: '#cc4444',
  fence: '#4488cc',
  step_switch: '#44cc66',
  message: '#cc66ff',
};

export const CELL_OBJECT_LABELS: Record<CellObjectType, string> = {
  box: 'Box',
  rare_box: 'Rare Box',
  enemy: 'Enemy',
  fence: 'Fence',
  step_switch: 'Switch',
  message: 'Message',
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
  /** Placed objects (boxes, enemies, fences, switches) */
  objects?: CellObject[];
}

// ============================================================================
// Quest Section (one section of a multi-section quest)
// ============================================================================

export type SectionType = 'grid' | 'transition' | 'boss';

export interface QuestSection {
  /** Section type: grid (NxN), transition (1 cell), boss (1 cell) */
  type: SectionType;
  /** Area variant for this section ("a", "b", "e", "z") */
  variant: string;
  /** Grid dimension (NxN) — only meaningful for grid sections */
  gridSize: number;
  /** Sparse cell map, keyed by "row,col" */
  cells: Record<string, EditorGridCell>;
  /** Start cell position "row,col" or null */
  startPos: string | null;
  /** End cell position "row,col" or null */
  endPos: string | null;
  /** Key-gate links: gateCell "row,col" → keyCell "row,col" */
  keyLinks: Record<string, string>;
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
  /** Area variant ("a" or "b") — used for single-section compat */
  variant: string;
  /** Grid dimension (NxN) — used for single-section compat */
  gridSize: number;
  /** Sparse cell map, keyed by "row,col" — used for single-section compat */
  cells: Record<string, EditorGridCell>;
  /** Start cell position "row,col" or null — used for single-section compat */
  startPos: string | null;
  /** End cell position "row,col" or null — used for single-section compat */
  endPos: string | null;
  /** Key-gate links — used for single-section compat */
  keyLinks: Record<string, string>;
  /** Multi-section support. If present, overrides single-section fields. */
  sections?: QuestSection[];
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

/** Get the active section list from a project.
 *  If sections[] is present, returns it. Otherwise wraps legacy single-section fields. */
export function getProjectSections(project: QuestProject): QuestSection[] {
  if (project.sections && project.sections.length > 0) {
    return project.sections;
  }
  // Wrap legacy single-section as sections[0]
  return [{
    type: 'grid',
    variant: project.variant,
    gridSize: project.gridSize,
    cells: project.cells,
    startPos: project.startPos,
    endPos: project.endPos,
    keyLinks: project.keyLinks,
  }];
}

/** Get the active section data for a given section index.
 *  Returns the section fields to use for editing (cells, startPos, etc.) */
export function getActiveSection(project: QuestProject, sectionIdx: number): QuestSection {
  const sections = getProjectSections(project);
  return sections[sectionIdx] || sections[0];
}

/** Create a new empty section */
export function createSection(type: SectionType, variant: string, gridSize?: number): QuestSection {
  return {
    type,
    variant,
    gridSize: type === 'grid' ? (gridSize || 5) : 1,
    cells: {},
    startPos: null,
    endPos: null,
    keyLinks: {},
  };
}

/** Section labels for UI */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  grid: 'Grid',
  transition: 'Transition',
  boss: 'Boss',
};

/** Default variant suggestions per section type */
export const SECTION_VARIANT_SUGGESTIONS: Record<SectionType, string> = {
  grid: 'a',
  transition: 'e',
  boss: 'z',
};
