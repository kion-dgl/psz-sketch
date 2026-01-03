import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { StageContextValue, StageProps } from './types';

/**
 * Stage Context
 *
 * Provides shared state management for tags within a stage.
 * Tracks gate unlocks, key collection, and object destruction.
 * Optional - tags work standalone but gain features when inside Stage.
 */

const StageContext = createContext<StageContextValue | null>(null);

/**
 * Hook to access stage context
 * Returns null if not inside a Stage (standalone mode)
 */
export function useStage(): StageContextValue | null {
  return useContext(StageContext);
}

/**
 * Hook to access stage context (throws if not in Stage)
 * Use when tag requires Stage context
 */
export function useStageRequired(): StageContextValue {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error('This component must be used within a <Stage> container');
  }
  return context;
}

/**
 * Stage Container Component
 *
 * Wraps tags to provide shared state management.
 * Usage:
 * <Stage id="valley-01" difficulty="normal">
 *   <Box position={[5, 0, 0]} />
 *   <Gate id="gate1" position={[0, 0, 10]} />
 *   <Switch type="step" targetId="gate1" position={[3, 0, 5]} />
 * </Stage>
 */
export function Stage({ id, children, difficulty, lootTable, onComplete }: StageProps) {
  // Track unlocked gates
  const [unlockedGates, setUnlockedGates] = useState<Set<string>>(new Set());

  // Track collected keys
  const [collectedKeys, setCollectedKeys] = useState<Set<string>>(new Set());

  // Track destroyed objects
  const [destroyedObjects, setDestroyedObjects] = useState<Set<string>>(new Set());

  // Unlock a gate
  const unlockGate = useCallback((gateId: string) => {
    setUnlockedGates(prev => {
      const next = new Set(prev);
      next.add(gateId);
      console.log(`[Stage ${id}] Gate unlocked: ${gateId}`);
      return next;
    });
  }, [id]);

  // Collect a key
  const collectKey = useCallback((keyId: string) => {
    setCollectedKeys(prev => {
      const next = new Set(prev);
      next.add(keyId);
      console.log(`[Stage ${id}] Key collected: ${keyId}`);
      return next;
    });
  }, [id]);

  // Destroy an object
  const destroyObject = useCallback((objectId: string) => {
    setDestroyedObjects(prev => {
      const next = new Set(prev);
      next.add(objectId);
      console.log(`[Stage ${id}] Object destroyed: ${objectId}`);
      return next;
    });
  }, [id]);

  // Query functions
  const isGateUnlocked = useCallback((gateId: string) => unlockedGates.has(gateId), [unlockedGates]);
  const hasKey = useCallback((keyId: string) => collectedKeys.has(keyId), [collectedKeys]);
  const isDestroyed = useCallback((objectId: string) => destroyedObjects.has(objectId), [destroyedObjects]);

  // Create stable context value
  const value = useMemo<StageContextValue>(() => ({
    unlockedGates,
    collectedKeys,
    destroyedObjects,
    unlockGate,
    collectKey,
    destroyObject,
    isGateUnlocked,
    hasKey,
    isDestroyed,
    difficulty,
    lootTable,
  }), [
    unlockedGates,
    collectedKeys,
    destroyedObjects,
    unlockGate,
    collectKey,
    destroyObject,
    isGateUnlocked,
    hasKey,
    isDestroyed,
    difficulty,
    lootTable,
  ]);

  return (
    <StageContext.Provider value={value}>
      {children}
    </StageContext.Provider>
  );
}

export default Stage;
