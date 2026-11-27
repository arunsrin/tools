import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { useTimeoutRegistry, type TimeoutId } from './useTimeoutRegistry';

export type CopyStatus = 'idle' | 'copied' | 'error';

export interface UseCopyFeedbackReturn {
  status: CopyStatus;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Copies text to the clipboard and exposes transient `'copied' | 'error'`
 * feedback that automatically resets after `resetDelayMs` without leaking
 * timers or updating state after unmount.
 */
export function useCopyFeedback(resetDelayMs = 2000): UseCopyFeedbackReturn {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const { schedule, clear } = useTimeoutRegistry();
  const activeTimerRef = useRef<TimeoutId | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    clear(activeTimerRef.current);
    activeTimerRef.current = null;
    if (isMountedRef.current) {
      setStatus('idle');
    }
  }, [clear]);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      clear(activeTimerRef.current);
      activeTimerRef.current = null;

      const ok = await copyToClipboard(text);
      if (!isMountedRef.current) {
        return ok;
      }

      setStatus(ok ? 'copied' : 'error');
      activeTimerRef.current = schedule(() => {
        activeTimerRef.current = null;
        if (isMountedRef.current) {
          setStatus('idle');
        }
      }, resetDelayMs);

      return ok;
    },
    [clear, resetDelayMs, schedule]
  );

  return { status, copy, reset };
}
