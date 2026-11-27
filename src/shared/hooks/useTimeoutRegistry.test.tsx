import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeoutRegistry } from './useTimeoutRegistry';

describe('useTimeoutRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('executes scheduled callbacks and supports manual clear and clearAll', () => {
    const first = vi.fn();
    const second = vi.fn();
    const third = vi.fn();

    const { result } = renderHook(() => useTimeoutRegistry());

    act(() => {
      const id1 = result.current.schedule(first, 100);
      result.current.schedule(second, 200);
      result.current.clear(id1);
      result.current.clear(null);
      result.current.clear(undefined);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.schedule(third, 100);
      result.current.clearAll();
      vi.advanceTimersByTime(200);
    });

    expect(third).not.toHaveBeenCalled();
  });

  it('cancels all pending timers automatically on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useTimeoutRegistry());

    act(() => {
      result.current.schedule(callback, 500);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
