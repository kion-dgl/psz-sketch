/**
 * ExportTab — JSON export with validation
 *
 * Three formats:
 * 1. Quest Layout JSON — the QuestProject data, re-importable
 * 2. Godot Quest JSON — cell format matching grid_generator output
 * 3. Mission Content JSON — calls content-generator for procedural content
 *
 * Plus: Import Godot Quest JSON back into a QuestProject for editing.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { QuestProject, ValidationIssue, Direction, EditorGridCell } from '../types';
import { EDITOR_AREAS } from '../types';
import type { MissionLayout, GridCell, StageArea, MissionContent } from '../../../systems/stage/types';
import { generateMissionContent } from '../../../systems/stage/content-generator';
import {
  getOriginalGates,
  getRotatedGates,
  getNeighbor,
  isValidPos,
  oppositeDirection,
  getStageConfig,
  getStageSuffix,
} from '../hooks/useStageConfigs';

interface ExportTabProps {
  project: QuestProject;
  setProject?: (project: QuestProject) => void;
}

// ============================================================================
// Area mapping: editor areaKey ↔ Godot area_id
// ============================================================================

const AREA_KEY_TO_ID: Record<string, string> = {
  valley: 'gurhacia',
  wetlands: 'ozette',
  snowfield: 'rioh',
  makara: 'makara',
  paru: 'paru',
  arca: 'arca',
  shrine: 'dark',
  tower: 'tower',
};

const AREA_ID_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(AREA_KEY_TO_ID).map(([k, v]) => [v, k])
);

// ============================================================================
// Export: QuestProject → Godot Quest JSON
// ============================================================================

function projectToGodotQuest(project: QuestProject): object {
  const cells: object[] = [];
  // Build path_order from BFS starting at startPos
  const pathOrder = buildPathOrder(project);

  for (const [pos, cell] of Object.entries(project.cells)) {
    const [row, col] = pos.split(',').map(Number);
    const gates = getRotatedGates(cell.stageName, cell.rotation ?? 0);

    // Build connections
    const connections: Record<string, string> = {};
    for (const worldDir of gates) {
      const [nr, nc] = getNeighbor(row, col, worldDir);
      const nk = `${nr},${nc}`;
      if (project.cells[nk]) {
        connections[worldDir] = nk;
      }
    }

    // Find warp edge for end cell
    let warpEdge = '';
    if (project.endPos === pos) {
      for (const worldDir of gates) {
        const [nr, nc] = getNeighbor(row, col, worldDir);
        if (!isValidPos(nr, nc, project.gridSize) || !project.cells[`${nr},${nc}`]) {
          warpEdge = worldDir;
          break;
        }
      }
    }

    // Key gate direction: which specific gate is locked
    let keyGateDirection = '';
    if (pos in project.keyLinks && cell.lockedGate) {
      keyGateDirection = cell.lockedGate;
    }

    const cellData: Record<string, unknown> = {
      pos,
      stage_id: cell.stageName,
      rotation: cell.rotation ?? 0,
      connections,
      is_start: project.startPos === pos,
      is_end: project.endPos === pos,
      is_branch: Object.keys(connections).length > 2,
      has_key: Object.values(project.keyLinks).includes(pos),
      key_for_cell: Object.entries(project.keyLinks).find(([_, v]) => v === pos)?.[0] || '',
      is_key_gate: pos in project.keyLinks,
      key_gate_direction: keyGateDirection,
      warp_edge: warpEdge,
      path_order: pathOrder.get(pos) ?? -1,
    };

    // Include authored key position if set
    if (cell.keyPosition) {
      cellData.key_position = cell.keyPosition;
    }

    cells.push(cellData);
  }

  // Sort cells by path_order for readability
  cells.sort((a: any, b: any) => (a.path_order ?? 999) - (b.path_order ?? 999));

  return {
    id: project.id,
    name: project.name,
    area_id: AREA_KEY_TO_ID[project.areaKey] || project.areaKey,
    sections: [{
      type: 'grid',
      area: project.variant,
      start_pos: project.startPos || '',
      end_pos: project.endPos || '',
      cells,
    }],
  };
}

/** BFS from startPos to assign path_order */
function buildPathOrder(project: QuestProject): Map<string, number> {
  const order = new Map<string, number>();
  if (!project.startPos || !project.cells[project.startPos]) return order;

  const visited = new Set<string>();
  const queue: string[] = [project.startPos];
  visited.add(project.startPos);
  let idx = 0;

  while (queue.length > 0) {
    const pos = queue.shift()!;
    order.set(pos, idx++);

    const cell = project.cells[pos];
    if (!cell) continue;

    const [row, col] = pos.split(',').map(Number);
    const gates = getRotatedGates(cell.stageName, cell.rotation ?? 0);

    for (const dir of gates) {
      const [nr, nc] = getNeighbor(row, col, dir);
      const nk = `${nr},${nc}`;
      if (!visited.has(nk) && project.cells[nk]) {
        visited.add(nk);
        queue.push(nk);
      }
    }
  }

  return order;
}

// ============================================================================
// Import: Godot Quest JSON → QuestProject
// ============================================================================

function godotQuestToProject(quest: any): QuestProject {
  const section = quest.sections?.[0] || {};
  const cells: Record<string, EditorGridCell> = {};
  let startPos: string | null = null;
  let endPos: string | null = null;
  const keyLinks: Record<string, string> = {};
  let maxRow = 0, maxCol = 0;

  for (const cell of section.cells || []) {
    const [r, c] = cell.pos.split(',').map(Number);
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, c);
    const editorCell: EditorGridCell = {
      stageName: cell.stage_id,
      rotation: cell.rotation || undefined,
      lockedGate: cell.key_gate_direction || undefined,
      role: cell.is_end ? 'boss' : cell.is_start ? 'transit' : 'guard',
      manual: true,
    };
    // Round-trip authored key position
    if (cell.key_position && Array.isArray(cell.key_position)) {
      editorCell.keyPosition = cell.key_position as [number, number, number];
    }
    cells[cell.pos] = editorCell;
    if (cell.is_start) startPos = cell.pos;
    if (cell.is_end) endPos = cell.pos;
    if (cell.is_key_gate && cell.key_for_cell) {
      keyLinks[cell.pos] = cell.key_for_cell;
    }
  }

  const areaKey = AREA_ID_TO_KEY[quest.area_id] || 'valley';

  return {
    id: quest.id || crypto.randomUUID(),
    name: quest.name || 'Imported Quest',
    areaKey,
    variant: section.area || 'a',
    gridSize: Math.max(3, Math.max(maxRow, maxCol) + 1),
    cells,
    startPos,
    endPos,
    keyLinks,
    metadata: {
      questName: quest.name || '',
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

// ============================================================================
// MissionLayout export (existing)
// ============================================================================

/** Convert editor project to MissionLayout for content generator */
function projectToMissionLayout(project: QuestProject): MissionLayout | null {
  const cells: GridCell[] = [];
  const stageConfigs: Record<string, any> = {};

  for (const [pos, cell] of Object.entries(project.cells)) {
    const [row, col] = pos.split(',').map(Number);
    const rotatedGates = getRotatedGates(cell.stageName, cell.rotation ?? 0);
    const suffix = getStageSuffix(cell.stageName);

    // Build connections map: gate → neighbor pos
    const connections: Record<string, string> = {};
    for (const gate of rotatedGates) {
      const [nr, nc] = getNeighbor(row, col, gate);
      const neighborKey = `${nr},${nc}`;
      if (project.cells[neighborKey]) {
        connections[gate] = neighborKey;
      }
    }

    // Find warp gate (end cell gate pointing outside grid)
    let warpGate: string | undefined;
    if (project.endPos === pos) {
      for (const gate of rotatedGates) {
        const [nr, nc] = getNeighbor(row, col, gate);
        if (!isValidPos(nr, nc, project.gridSize)) {
          warpGate = gate;
          break;
        }
      }
    }

    const gridCell: GridCell = {
      pos,
      stage: suffix,
      fullStageName: cell.stageName,
      connections,
    };

    if (project.startPos === pos) gridCell.start = true;
    if (project.endPos === pos) gridCell.end = true;
    if (pos in project.keyLinks) gridCell.keyGate = 'locked';
    if (Object.values(project.keyLinks).includes(pos)) gridCell.key = true;
    if (warpGate) gridCell.warp = warpGate;

    cells.push(gridCell);

    // Collect stage config
    const config = getStageConfig(cell.stageName);
    if (config) {
      stageConfigs[cell.stageName] = config;
    }
  }

  const areaVariant = `${project.areaKey}-${project.variant}`;
  // Map to StageArea type
  const stageAreaMap: Record<string, StageArea> = {
    'valley-a': 'valley-a',
    'valley-b': 'valley-b',
    'wetlands-a': 'wetland-a',
    'wetlands-b': 'wetland-b',
    'snowfield-a': 'snowfield-a',
    'snowfield-b': 'snowfield-b',
    'makara-a': 'ruins-a',
    'makara-b': 'ruins-b',
    'paru-a': 'city-a',
    'paru-b': 'city-b',
  };

  return {
    area: stageAreaMap[areaVariant] || ('valley-a' as StageArea),
    cells,
    stageConfigs,
  };
}

// ============================================================================
// Validation
// ============================================================================

/** Validate for export */
function validateForExport(project: QuestProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!project.startPos) issues.push({ severity: 'error', message: 'No start cell' });
  if (!project.endPos) issues.push({ severity: 'error', message: 'No end cell' });
  if (Object.keys(project.cells).length === 0) issues.push({ severity: 'error', message: 'No cells' });

  // Check orphan gates
  for (const [pos, cell] of Object.entries(project.cells)) {
    const [row, col] = pos.split(',').map(Number);
    const gates = getRotatedGates(cell.stageName, cell.rotation ?? 0);

    for (const dir of gates) {
      const [nr, nc] = getNeighbor(row, col, dir);
      if (!isValidPos(nr, nc, project.gridSize)) continue;

      const neighborKey = `${nr},${nc}`;
      const neighbor = project.cells[neighborKey];

      if (neighbor) {
        const neighborGates = getRotatedGates(neighbor.stageName, neighbor.rotation ?? 0);
        if (!neighborGates.has(oppositeDirection(dir))) {
          issues.push({
            severity: 'error',
            message: `Orphan gate: ${pos} (${dir}) → ${neighborKey}`,
            cellPos: pos,
          });
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// Component
// ============================================================================

export default function ExportTab({ project, setProject }: ExportTabProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const [missionResult, setMissionResult] = useState<string>('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issues = useMemo(() => validateForExport(project), [project]);
  const hasErrors = issues.some(i => i.severity === 'error');

  const layoutJson = useMemo(() => JSON.stringify(project, null, 2), [project]);
  const godotJson = useMemo(() => {
    if (hasErrors) return '';
    return JSON.stringify(projectToGodotQuest(project), null, 2);
  }, [project, hasErrors]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied!`);
      setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  }, []);

  const downloadJson = useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const generateMission = useCallback(() => {
    const layout = projectToMissionLayout(project);
    if (!layout) {
      setMissionResult('Failed to build layout');
      return;
    }

    try {
      const result = generateMissionContent(layout, {
        enemyArea: 'gurhacia',
        difficulty: project.metadata.difficulty || 'normal',
        playerLevel: project.metadata.recommendedLevel || 1,
        seed: Date.now(),
        includeBoss: !!project.endPos,
      });

      const json = JSON.stringify(result.mission, null, 2);
      setMissionResult(json);
    } catch (e) {
      setMissionResult(`Generation error: ${e}`);
    }
  }, [project]);

  const handleImport = useCallback((jsonText: string) => {
    setImportError('');
    try {
      const parsed = JSON.parse(jsonText);

      // Detect format: Godot quest has "sections", QuestProject has "cells"
      if (parsed.sections && Array.isArray(parsed.sections)) {
        // Godot quest JSON → convert to QuestProject
        const imported = godotQuestToProject(parsed);
        if (setProject) {
          setProject(imported);
          setCopyStatus('Imported Godot quest!');
          setTimeout(() => setCopyStatus(''), 2000);
          setImportText('');
        } else {
          setImportError('Import not available (setProject not provided)');
        }
      } else if (parsed.cells && parsed.areaKey) {
        // Already a QuestProject
        if (setProject) {
          setProject(parsed as QuestProject);
          setCopyStatus('Imported quest project!');
          setTimeout(() => setCopyStatus(''), 2000);
          setImportText('');
        } else {
          setImportError('Import not available (setProject not provided)');
        }
      } else {
        setImportError('Unrecognized JSON format. Expected Godot quest (with "sections") or QuestProject (with "cells").');
      }
    } catch (e) {
      setImportError(`Parse error: ${e}`);
    }
  }, [setProject]);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleImport(reader.result);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleImport]);

  const buttonStyle = {
    padding: '8px 16px', background: '#555588', border: 'none',
    borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer',
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'auto', padding: '24px', gap: '24px',
    }}>
      {/* Import Quest JSON */}
      {setProject && (
        <div>
          <div style={{
            fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Import Quest JSON
            <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>
              (Godot quest or QuestProject format)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => handleImport(importText)}
              disabled={!importText.trim()}
              style={{
                ...buttonStyle,
                background: !importText.trim() ? '#444' : '#448844',
                cursor: !importText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Import from Text
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={buttonStyle}
            >
              Import from File
            </button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste Godot quest JSON or QuestProject JSON here..."
            style={{
              width: '100%',
              height: '80px',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '11px',
              color: '#aaa',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
          {importError && (
            <div style={{ color: '#ff8888', fontSize: '12px', marginTop: '4px' }}>
              {importError}
            </div>
          )}
        </div>
      )}

      {/* Validation */}
      <div>
        <div style={{
          fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px',
        }}>
          Validation
        </div>
        {issues.length === 0 ? (
          <div style={{ color: '#88ff88', fontSize: '13px' }}>
            No issues found — ready to export
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {issues.map((issue, i) => (
              <div key={i} style={{
                padding: '4px 8px',
                fontSize: '12px',
                color: issue.severity === 'error' ? '#ff8888' :
                       issue.severity === 'warning' ? '#ffcc66' : '#8888ff',
              }}>
                {issue.severity === 'error' ? '[ERROR]' : issue.severity === 'warning' ? '[WARN]' : '[INFO]'} {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      {copyStatus && (
        <div style={{ color: '#88ff88', fontSize: '13px', textAlign: 'center' }}>
          {copyStatus}
        </div>
      )}

      {/* Godot Quest JSON */}
      <div>
        <div style={{
          fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          Godot Quest JSON
          <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>
            (copy to psz-godot/data/quests/)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => copyToClipboard(godotJson, 'Godot quest')}
            disabled={hasErrors}
            style={{
              ...buttonStyle,
              background: hasErrors ? '#444' : '#448844',
              cursor: hasErrors ? 'not-allowed' : 'pointer',
            }}
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => {
              const id = (project.name || 'quest').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              downloadJson(godotJson, `${id}.json`);
            }}
            disabled={hasErrors}
            style={{
              ...buttonStyle,
              background: hasErrors ? '#444' : buttonStyle.background,
              cursor: hasErrors ? 'not-allowed' : 'pointer',
            }}
          >
            Download
          </button>
        </div>
        {!hasErrors && godotJson && (
          <pre style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '10px',
            color: '#aaa',
            maxHeight: '300px',
            overflow: 'auto',
            fontFamily: 'monospace',
          }}>
            {godotJson}
          </pre>
        )}
      </div>

      {/* Quest Layout JSON */}
      <div>
        <div style={{
          fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          Quest Layout JSON
          <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>
            (re-importable by editor)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => copyToClipboard(layoutJson, 'Layout')}
            style={buttonStyle}
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => downloadJson(layoutJson, `quest-${project.name.toLowerCase().replace(/\s+/g, '-')}.json`)}
            style={buttonStyle}
          >
            Download
          </button>
        </div>
        <pre style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '10px',
          color: '#aaa',
          maxHeight: '300px',
          overflow: 'auto',
          fontFamily: 'monospace',
        }}>
          {layoutJson}
        </pre>
      </div>

      {/* Mission Content JSON */}
      <div>
        <div style={{
          fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          Mission Content JSON
          <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>
            (procedurally generated for Godot)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={generateMission}
            disabled={hasErrors}
            style={{
              ...buttonStyle,
              background: hasErrors ? '#444' : '#448844',
              cursor: hasErrors ? 'not-allowed' : 'pointer',
            }}
          >
            Generate Mission Content
          </button>
          {missionResult && !missionResult.startsWith('Failed') && !missionResult.startsWith('Generation error') && (
            <>
              <button
                onClick={() => copyToClipboard(missionResult, 'Mission')}
                style={buttonStyle}
              >
                Copy
              </button>
              <button
                onClick={() => downloadJson(missionResult, `mission-${project.name.toLowerCase().replace(/\s+/g, '-')}.json`)}
                style={buttonStyle}
              >
                Download
              </button>
            </>
          )}
        </div>
        {missionResult && (
          <pre style={{
            background: '#111',
            border: `1px solid ${missionResult.startsWith('Failed') || missionResult.startsWith('Generation error') ? '#884444' : '#333'}`,
            borderRadius: '6px',
            padding: '12px',
            fontSize: '10px',
            color: missionResult.startsWith('Failed') || missionResult.startsWith('Generation error') ? '#ff8888' : '#aaa',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
          }}>
            {missionResult}
          </pre>
        )}
      </div>
    </div>
  );
}
