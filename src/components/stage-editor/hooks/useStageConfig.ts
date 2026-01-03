import { useState, useEffect, useCallback } from 'react';
import type { UnifiedStageConfig } from '../types';
import { createDefaultConfig } from '../types';

const STORAGE_KEY = 'unified-stage-configs';
const MAX_UNDO_STACK = 50;

// Load all configs from localStorage
function loadAllConfigs(): Record<string, UnifiedStageConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save all configs to localStorage
function saveAllConfigs(configs: Record<string, UnifiedStageConfig>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.error('Failed to save stage configs:', e);
  }
}

// Deep clone config for undo stack
function cloneConfig(config: UnifiedStageConfig): UnifiedStageConfig {
  return JSON.parse(JSON.stringify(config));
}

export interface UseStageConfigReturn {
  config: UnifiedStageConfig | null;
  updateConfig: (updater: (prev: UnifiedStageConfig) => UnifiedStageConfig) => void;
  setConfig: (config: UnifiedStageConfig) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveNow: () => void;
  resetToDefault: () => void;
}

export function useStageConfig(mapId: string): UseStageConfigReturn {
  const [config, setConfigState] = useState<UnifiedStageConfig | null>(null);
  const [undoStack, setUndoStack] = useState<UnifiedStageConfig[]>([]);
  const [redoStack, setRedoStack] = useState<UnifiedStageConfig[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Load config on mount or mapId change
  useEffect(() => {
    const configs = loadAllConfigs();
    const loaded = configs[mapId] || createDefaultConfig(mapId);
    setConfigState(loaded);
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
  }, [mapId]);

  // Auto-save when dirty (debounced)
  useEffect(() => {
    if (!config || !isDirty) return;

    const timeout = setTimeout(() => {
      const configs = loadAllConfigs();
      configs[mapId] = { ...config, lastModified: new Date().toISOString() };
      saveAllConfigs(configs);
      setIsDirty(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [config, mapId, isDirty]);

  // Update config with undo support
  const updateConfig = useCallback(
    (updater: (prev: UnifiedStageConfig) => UnifiedStageConfig) => {
      setConfigState((prev) => {
        if (!prev) return prev;

        // Push current state to undo stack
        setUndoStack((stack) => {
          const newStack = [...stack, cloneConfig(prev)];
          // Limit stack size
          if (newStack.length > MAX_UNDO_STACK) {
            return newStack.slice(-MAX_UNDO_STACK);
          }
          return newStack;
        });

        // Clear redo stack on new action
        setRedoStack([]);
        setIsDirty(true);

        return updater(prev);
      });
    },
    []
  );

  // Direct set (also pushes to undo)
  const setConfig = useCallback((newConfig: UnifiedStageConfig) => {
    setConfigState((prev) => {
      if (prev) {
        setUndoStack((stack) => {
          const newStack = [...stack, cloneConfig(prev)];
          if (newStack.length > MAX_UNDO_STACK) {
            return newStack.slice(-MAX_UNDO_STACK);
          }
          return newStack;
        });
        setRedoStack([]);
      }
      setIsDirty(true);
      return newConfig;
    });
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const prev = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));

    setConfigState((current) => {
      if (current) {
        setRedoStack((stack) => [...stack, cloneConfig(current)]);
      }
      setIsDirty(true);
      return prev;
    });
  }, [undoStack]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));

    setConfigState((current) => {
      if (current) {
        setUndoStack((stack) => [...stack, cloneConfig(current)]);
      }
      setIsDirty(true);
      return next;
    });
  }, [redoStack]);

  // Force save now
  const saveNow = useCallback(() => {
    if (!config) return;
    const configs = loadAllConfigs();
    configs[mapId] = { ...config, lastModified: new Date().toISOString() };
    saveAllConfigs(configs);
    setIsDirty(false);
  }, [config, mapId]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    const defaultConfig = createDefaultConfig(mapId);
    setConfig(defaultConfig);
  }, [mapId, setConfig]);

  return {
    config,
    updateConfig,
    setConfig,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    saveNow,
    resetToDefault,
  };
}

// Helper to get all saved map IDs
export function getSavedMapIds(): string[] {
  const configs = loadAllConfigs();
  return Object.keys(configs);
}

// Helper to export config as JSON
export function exportConfigAsJson(config: UnifiedStageConfig): string {
  return JSON.stringify(config, null, 2);
}

// Helper to import config from JSON
export function importConfigFromJson(json: string): UnifiedStageConfig | null {
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (parsed.mapId && parsed.version) {
      return parsed as UnifiedStageConfig;
    }
    return null;
  } catch {
    return null;
  }
}
