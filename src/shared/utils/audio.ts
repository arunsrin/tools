type AudioContextCtor = new () => AudioContext;

export interface AudioController {
  getContext: () => AudioContext | null;
  resume: () => Promise<AudioContext | null>;
  close: () => Promise<void>;
  isSupported: () => boolean;
}

function getAudioContextConstructor(): AudioContextCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const win = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

/**
 * Creates a lazy, leak-safe Web Audio controller that tolerates missing
 * `AudioContext` APIs, constructor failures, and suspended states.
 */
export function createAudioController(): AudioController {
  let ctx: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (ctx && ctx.state !== 'closed') {
      return ctx;
    }
    ctx = null;
    const Ctor = getAudioContextConstructor();
    if (!Ctor) {
      return null;
    }
    try {
      ctx = new Ctor();
      return ctx;
    } catch {
      ctx = null;
      return null;
    }
  };

  const resume = async (): Promise<AudioContext | null> => {
    const activeCtx = getContext();
    if (!activeCtx) {
      return null;
    }
    if (activeCtx.state === 'suspended') {
      try {
        await activeCtx.resume();
      } catch {
        return null;
      }
    }
    return activeCtx;
  };

  const close = async (): Promise<void> => {
    const activeCtx = ctx;
    ctx = null;
    if (!activeCtx || activeCtx.state === 'closed') {
      return;
    }
    try {
      await activeCtx.close();
    } catch {
      // Ignore close errors during teardown
    }
  };

  const isSupported = (): boolean => getAudioContextConstructor() !== null;

  return { getContext, resume, close, isSupported };
}

/**
 * Lazily resumes the controller's AudioContext and runs `fn` if audio is ready.
 * Never throws; returns `true` when `fn` ran cleanly.
 */
export async function playWithAudio(
  controller: AudioController,
  fn: (ctx: AudioContext) => void
): Promise<boolean> {
  const ctx = await controller.resume();
  if (!ctx) {
    return false;
  }
  try {
    fn(ctx);
    return true;
  } catch {
    return false;
  }
}
