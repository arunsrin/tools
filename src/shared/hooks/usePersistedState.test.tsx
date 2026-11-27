import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('performs a single localStorage read on mount and uses fallback when absent', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result, rerender } = renderHook(() =>
      usePersistedState('test-key', { count: 1 })
    );

    expect(result.current[0]).toEqual({ count: 1 });
    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).not.toHaveBeenCalled();

    rerender();
    expect(getItemSpy).toHaveBeenCalledTimes(1);
  });

  it('loads and validates stored JSON, falling back on corrupt JSON or invalid shape', () => {
    localStorage.setItem('count-key', JSON.stringify({ count: 42 }));
    const validate = (raw: unknown): { count: number } => {
      if (
        typeof raw === 'object' &&
        raw !== null &&
        typeof (raw as { count?: unknown }).count === 'number'
      ) {
        return { count: Math.max(0, (raw as { count: number }).count) };
      }
      throw new Error('Invalid shape');
    };

    const { result } = renderHook(() =>
      usePersistedState('count-key', { count: 0 }, { validate })
    );
    expect(result.current[0]).toEqual({ count: 42 });

    localStorage.setItem('corrupt-key', '{bad-json');
    const { result: corruptResult } = renderHook(() =>
      usePersistedState('corrupt-key', { count: 5 }, { validate })
    );
    expect(corruptResult.current[0]).toEqual({ count: 5 });

    localStorage.setItem('bad-shape-key', JSON.stringify({ count: 'oops' }));
    const { result: badShapeResult } = renderHook(() =>
      usePersistedState('bad-shape-key', { count: 7 }, { validate })
    );
    expect(badShapeResult.current[0]).toEqual({ count: 7 });
  });

  it('persists state updates and survives getItem / setItem storage errors', () => {
    const { result } = renderHook(() => usePersistedState('persist-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('persist-key')).toBe(JSON.stringify('updated'));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    act(() => {
      result.current[1]('after-quota-error');
    });
    expect(result.current[0]).toBe('after-quota-error');

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { result: blockedResult } = renderHook(() =>
      usePersistedState('blocked-key', () => 'lazy-default')
    );
    expect(blockedResult.current[0]).toBe('lazy-default');
  });
});
