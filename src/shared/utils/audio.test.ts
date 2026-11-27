import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAudioController, playWithAudio } from './audio';

describe('audio controller utility', () => {
  const originalAudioContextDescriptor = Object.getOwnPropertyDescriptor(window, 'AudioContext');
  const originalWebkitAudioContextDescriptor = Object.getOwnPropertyDescriptor(
    window,
    'webkitAudioContext'
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalAudioContextDescriptor) {
      Object.defineProperty(window, 'AudioContext', originalAudioContextDescriptor);
    } else {
      delete (window as { AudioContext?: unknown }).AudioContext;
    }

    if (originalWebkitAudioContextDescriptor) {
      Object.defineProperty(window, 'webkitAudioContext', originalWebkitAudioContextDescriptor);
    } else {
      delete (window as { webkitAudioContext?: unknown }).webkitAudioContext;
    }
  });

  it('returns null and reports unsupported when AudioContext is missing', async () => {
    delete (window as { AudioContext?: unknown }).AudioContext;
    delete (window as { webkitAudioContext?: unknown }).webkitAudioContext;

    const controller = createAudioController();
    expect(controller.isSupported()).toBe(false);
    expect(controller.getContext()).toBeNull();
    await expect(controller.resume()).resolves.toBeNull();
    await expect(controller.close()).resolves.toBeUndefined();
    await expect(playWithAudio(controller, vi.fn())).resolves.toBe(false);
  });

  it('lazily creates, resumes suspended context, plays callback, and closes cleanly', async () => {
    const resume = vi.fn().mockImplementation(async () => {
      mockCtx.state = 'running';
    });
    const close = vi.fn().mockImplementation(async () => {
      mockCtx.state = 'closed';
    });
    const mockCtx = {
      state: 'suspended' as AudioContextState,
      resume,
      close,
    };

    const AudioContextSpy = vi.fn(function MockAudioContext() {
      return mockCtx;
    });
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: AudioContextSpy,
    });

    const controller = createAudioController();
    expect(controller.isSupported()).toBe(true);
    expect(AudioContextSpy).not.toHaveBeenCalled();

    const playFn = vi.fn();
    const played = await playWithAudio(controller, playFn);
    expect(played).toBe(true);
    expect(AudioContextSpy).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(playFn).toHaveBeenCalledWith(mockCtx);

    await controller.close();
    expect(close).toHaveBeenCalledTimes(1);
    // Calling close again is a safe no-op
    await controller.close();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('handles AudioContext constructor, resume, close, and callback errors gracefully', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: vi.fn(function ThrowingCtor() {
        throw new Error('Hardware audio unavailable');
      }),
    });

    const throwingController = createAudioController();
    expect(throwingController.getContext()).toBeNull();
    await expect(throwingController.resume()).resolves.toBeNull();

    const resumeFailCtx = {
      state: 'suspended' as AudioContextState,
      resume: vi.fn().mockRejectedValue(new Error('Autoplay blocked')),
      close: vi.fn().mockRejectedValue(new Error('Close failed')),
    };
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: vi.fn(function MockAudioContext() {
        return resumeFailCtx;
      }),
    });

    const resumeFailController = createAudioController();
    await expect(resumeFailController.resume()).resolves.toBeNull();
    await expect(resumeFailController.close()).resolves.toBeUndefined();

    const runningCtx = {
      state: 'running' as AudioContextState,
      resume: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: vi.fn(function MockRunningAudioContext() {
        return runningCtx;
      }),
    });

    const runningController = createAudioController();
    const ok = await playWithAudio(runningController, () => {
      throw new Error('Node graph error');
    });
    expect(ok).toBe(false);
  });
});
