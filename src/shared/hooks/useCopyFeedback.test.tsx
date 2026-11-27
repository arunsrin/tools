import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyFeedback } from './useCopyFeedback';

describe('useCopyFeedback', () => {
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
      delete (navigator as { clipboard?: Clipboard }).clipboard;
    }
    if (originalExecCommandDescriptor) {
      Object.defineProperty(document, 'execCommand', originalExecCommandDescriptor);
    } else {
      delete (document as { execCommand?: unknown }).execCommand;
    }
  });

  it('transitions idle -> copied -> idle after resetDelayMs', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const { result } = renderHook(() => useCopyFeedback(1500));
    expect(result.current.status).toBe('idle');

    let ok = false;
    await act(async () => {
      ok = await result.current.copy('abc');
    });

    expect(ok).toBe(true);
    expect(result.current.status).toBe('copied');

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.status).toBe('idle');
  });

  it('transitions to error on copy failure and supports manual reset', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useCopyFeedback(2000));

    let ok = true;
    await act(async () => {
      ok = await result.current.copy('fail');
    });

    expect(ok).toBe(false);
    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
  });

  it('ignores async completion and cancels reset timers if unmounted', async () => {
    let resolveCopy!: () => void;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: {
        writeText: vi.fn(
          () =>
            new Promise<void>((resolve) => {
              resolveCopy = resolve;
            })
        ),
      },
    });

    const { result, unmount } = renderHook(() => useCopyFeedback(2000));

    let pendingCopy!: Promise<boolean>;
    act(() => {
      pendingCopy = result.current.copy('slow');
    });

    unmount();

    await act(async () => {
      resolveCopy();
      await pendingCopy;
    });

    expect(result.current.status).toBe('idle');
  });
});
