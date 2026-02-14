/**
 * QuestEditor — Main component with tab shell and header controls
 *
 * Milestone 1: Grid Layout Editor
 */

import { useState, useCallback } from 'react';
import type { QuestProject } from './types';
import { EDITOR_AREAS } from './types';
import { useQuestProject } from './hooks/useQuestProject';
import LayoutTab from './tabs/LayoutTab';
import ContentTab from './tabs/ContentTab';
import MetadataTab from './tabs/MetadataTab';
import ExportTab from './tabs/ExportTab';

type TabId = 'layout' | 'content' | 'metadata' | 'export';

const TABS: { id: TabId; label: string; disabled?: boolean }[] = [
  { id: 'layout', label: 'Layout' },
  { id: 'content', label: 'Content' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'export', label: 'Export' },
];

export default function QuestEditor() {
  const {
    project,
    updateProject,
    setProject,
    undo,
    redo,
    canUndo,
    canRedo,
    newProject,
    savedProjectIds,
    loadProject,
    deleteProject,
    getSavedProject,
  } = useQuestProject();

  const [activeTab, setActiveTab] = useState<TabId>('layout');
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const availableAreas = EDITOR_AREAS.filter(a => a.available);

  const handleAreaChange = useCallback((areaKey: string) => {
    updateProject(prev => ({
      ...prev,
      areaKey,
      cells: {},
      startPos: null,
      endPos: null,
      keyLinks: {},
    }));
  }, [updateProject]);

  const handleVariantChange = useCallback((variant: string) => {
    updateProject(prev => ({
      ...prev,
      variant,
      cells: {},
      startPos: null,
      endPos: null,
      keyLinks: {},
    }));
  }, [updateProject]);

  const handleGridSizeChange = useCallback((gridSize: number) => {
    updateProject(prev => ({
      ...prev,
      gridSize,
      cells: {},
      startPos: null,
      endPos: null,
      keyLinks: {},
    }));
  }, [updateProject]);

  const handleNameChange = useCallback((name: string) => {
    updateProject(prev => ({ ...prev, name }));
  }, [updateProject]);

  const currentArea = EDITOR_AREAS.find(a => a.key === project.areaKey);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#1a1a2e',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: '#151525',
        borderBottom: '1px solid #333',
        flexWrap: 'wrap',
      }}>
        {/* Back link */}
        <a
          href="/"
          style={{
            color: '#88aaff',
            textDecoration: 'none',
            fontSize: '13px',
            marginRight: '4px',
          }}
        >
          ← Home
        </a>

        {/* Project name */}
        <input
          type="text"
          value={project.name}
          onChange={(e) => handleNameChange(e.target.value)}
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            padding: '4px 8px',
            width: '200px',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#444'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
        />

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', background: '#333' }} />

        {/* Area selector */}
        <select
          value={project.areaKey}
          onChange={(e) => handleAreaChange(e.target.value)}
          style={{
            padding: '6px 10px',
            background: '#2a2a4a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {EDITOR_AREAS.map(area => (
            <option key={area.key} value={area.key} disabled={!area.available}>
              {area.name} ({area.prefix}){!area.available ? ' — no config' : ''}
            </option>
          ))}
        </select>

        {/* Variant selector */}
        {currentArea && currentArea.variants.length > 0 && (
          <select
            value={project.variant}
            onChange={(e) => handleVariantChange(e.target.value)}
            style={{
              padding: '6px 10px',
              background: '#2a2a4a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
            }}
          >
            {currentArea.variants.map(v => (
              <option key={v} value={v}>Variant {v.toUpperCase()}</option>
            ))}
          </select>
        )}

        {/* Grid size */}
        <select
          value={project.gridSize}
          onChange={(e) => handleGridSizeChange(parseInt(e.target.value))}
          style={{
            padding: '6px 10px',
            background: '#2a2a4a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {[3, 4, 5, 6, 7].map(n => (
            <option key={n} value={n}>{n}x{n}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '4px 10px',
            background: canUndo ? '#2a2a4a' : '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            color: canUndo ? '#fff' : '#555',
            fontSize: '12px',
            cursor: canUndo ? 'pointer' : 'default',
          }}
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '4px 10px',
            background: canRedo ? '#2a2a4a' : '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            color: canRedo ? '#fff' : '#555',
            fontSize: '12px',
            cursor: canRedo ? 'pointer' : 'default',
          }}
        >
          Redo
        </button>

        {/* Project menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            style={{
              padding: '4px 10px',
              background: '#2a2a4a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Projects
          </button>
          {showProjectMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#1a1a2e',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '8px',
                width: '260px',
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => { newProject(); setShowProjectMenu(false); }}
                style={{
                  width: '100%', padding: '8px', background: '#448844',
                  border: 'none', borderRadius: '4px', color: '#fff',
                  fontSize: '12px', cursor: 'pointer', marginBottom: '8px',
                }}
              >
                New Project
              </button>
              {savedProjectIds.length === 0 && (
                <div style={{ color: '#888', fontSize: '12px', padding: '8px' }}>
                  No saved projects
                </div>
              )}
              {savedProjectIds.map(id => {
                const saved = getSavedProject(id);
                if (!saved) return null;
                const isCurrent = id === project.id;
                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: isCurrent ? '#333366' : 'transparent',
                      marginBottom: '2px',
                    }}
                  >
                    <div
                      style={{ flex: 1, cursor: 'pointer', fontSize: '12px', color: '#fff' }}
                      onClick={() => { loadProject(id); setShowProjectMenu(false); }}
                    >
                      {saved.name}
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {saved.areaKey}-{saved.variant} | {Object.keys(saved.cells).length} cells
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => deleteProject(id)}
                        style={{
                          background: 'none', border: 'none', color: '#884444',
                          fontSize: '14px', cursor: 'pointer', padding: '2px',
                        }}
                        title="Delete project"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '0',
        background: '#151525',
        borderBottom: '1px solid #333',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.id ? '#1a1a2e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #5588ff' : '2px solid transparent',
              color: tab.disabled ? '#555' : activeTab === tab.id ? '#fff' : '#888',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: tab.disabled ? 'default' : 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {tab.label}
            {tab.disabled && <span style={{ fontSize: '10px', marginLeft: '4px' }}>(M{tab.id === 'content' ? '2' : '3'})</span>}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'layout' && (
          <LayoutTab project={project} onUpdateProject={updateProject} />
        )}
        {activeTab === 'content' && <ContentTab project={project} onUpdateProject={updateProject} />}
        {activeTab === 'metadata' && <MetadataTab project={project} onUpdateProject={updateProject} />}
        {activeTab === 'export' && <ExportTab project={project} setProject={setProject} />}
      </div>
    </div>
  );
}
