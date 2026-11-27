import { useCallback, useEffect, useMemo, useRef } from 'react';

export type TimeoutId = ReturnType<typeof setTimeout>;

export interface TimeoutRegistry {
  schedule: (fn: () => void, delayMs: number) => TimeoutId;
  clear: (id: TimeoutId | null | undefined) => void;
  clearAll: () => void;
}

/**
 * Ref-backed timer registry that deletes completed timer IDs automatically
 * and cancels every pending timer on unmount.
 */
export function useTimeoutRegistry(): TimeoutRegistry {
  const activeTimersRef = useRef<Set<TimeoutId>>(new Set());

  const clear = useCallback((id: TimeoutId | null | undefined) => {
    if (id === null || id === undefined) {
      return;
    }
    clearTimeout(id);
    activeTimersRef.current.delete(id);
  }, []);

  const clearAll = useCallback(() => {
    for (const id of activeTimersRef.current) {
      clearTimeout(id);
    }
    activeTimersRef.current.clear();
  }, []);

  const schedule = useCallback((fn: () => void, delayMs: number): TimeoutId => {
    const id = setTimeout(() => {
      activeTimersRef.current.delete(id);
      fn();
    }, delayMs);
    activeTimersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return useMemo(
    () => ({ schedule, clear, clearAll }),
    [schedule, clear, clearAll]
  );
}
