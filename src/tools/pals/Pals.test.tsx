import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Pals from './Pals';
import {
  ENV_PLATFORMS,
  FLOOR_Y,
  normalizeFrameDelta,
  stepPalsPhysics,
} from './palsEngine';
import { createAudioController } from '../../shared/utils/audio';
import type { PalEntity } from './types';

const STORAGE_KEY = 'tools_hub_desktop_pals';

describe('Desktop Pals Component', () => {
  const onBackMock = vi.fn();
  let rafCallbacks: FrameRequestCallback[] = [];
  let virtualTimeMs = 1000;
  let closeMock = vi.fn().mockResolvedValue(undefined);

  const origAudioContext = window.AudioContext;
  const origWebkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  const origSetPointerCapture = HTMLCanvasElement.prototype.setPointerCapture;
  const origReleasePointerCapture = HTMLCanvasElement.prototype.releasePointerCapture;
  const origGetBoundingClientRect = HTMLCanvasElement.prototype.getBoundingClientRect;

  const mockOscillator = {
    type: 'sine',
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const mockGain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };

  function stepFrames(count = 1, frameStepMs = 1000 / 60) {
    for (let i = 0; i < count; i++) {
      virtualTimeMs += frameStepMs;
      act(() => {
        const cbs = [...rafCallbacks];
        rafCallbacks = [];
        cbs.forEach((cb) => cb(virtualTimeMs));
      });
    }
  }

  beforeEach(() => {
    localStorage.clear();
    onBackMock.mockClear();
    rafCallbacks = [];
    virtualTimeMs = 1000;
    closeMock = vi.fn().mockResolvedValue(undefined);

    let nextRafId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      nextRafId += 1;
      return nextRafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    class MockAudioContext {
      currentTime = 10;
      state = 'suspended';
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      close = closeMock;
      createOscillator = vi.fn(() => mockOscillator);
      createGain = vi.fn(() => mockGain);
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    const mockGradient = { addColorStop: vi.fn() };
    const mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      ellipse: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      createLinearGradient: vi.fn(() => mockGradient),
      createRadialGradient: vi.fn(() => mockGradient),
      fillText: vi.fn(),
      quadraticCurveTo: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockContext as unknown as CanvasRenderingContext2D
    );

    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 450,
      right: 800,
      bottom: 450,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.AudioContext = origAudioContext;
    if (origWebkitAudioContext !== undefined) {
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext =
        origWebkitAudioContext;
    } else {
      delete (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    }
    HTMLCanvasElement.prototype.getContext = origGetContext;
    HTMLCanvasElement.prototype.setPointerCapture = origSetPointerCapture;
    HTMLCanvasElement.prototype.releasePointerCapture = origReleasePointerCapture;
    HTMLCanvasElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('renders the Desktop Pals header, canvas, and controls', () => {
    render(<Pals onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 1, name: /desktop pals/i })).toBeInTheDocument();
    expect(screen.getByText(/interactive toy/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('pals-canvas')).toBeInTheDocument();
    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByText(/feed fish/i)).toBeInTheDocument();

    stepFrames(5);
  });

  it('navigates back to hub when clicking Back to Tools Hub', () => {
    render(<Pals onBack={onBackMock} />);
    const backBtn = screen.getByRole('button', { name: /back to tools hub/i });
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('switches between companions (Pip, Barnaby, Sprout) and renders each in canvas', () => {
    render(<Pals onBack={onBackMock} />);

    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🐧 pip/i })).toHaveAttribute('aria-pressed', 'true');
    stepFrames(5);

    const barnabyBtn = screen.getByRole('button', { name: /🐶 barnaby/i });
    fireEvent.click(barnabyBtn);
    expect(screen.getByText(/barnaby the pup/i)).toBeInTheDocument();
    expect(screen.getByText(/feed bone/i)).toBeInTheDocument();
    expect(barnabyBtn).toHaveAttribute('aria-pressed', 'true');
    stepFrames(5);

    const sproutBtn = screen.getByRole('button', { name: /👾 sprout/i });
    fireEvent.click(sproutBtn);
    expect(screen.getByText(/sprout the sprite/i)).toBeInTheDocument();
    expect(screen.getByText(/feed berry/i)).toBeInTheDocument();
    expect(sproutBtn).toHaveAttribute('aria-pressed', 'true');
    stepFrames(5);
  });

  it('switches between environments (City, Forest, Playground) and renders each', () => {
    render(<Pals onBack={onBackMock} />);

    const cityBtn = screen.getByRole('button', { name: /🏙️ city/i });
    const forestBtn = screen.getByRole('button', { name: /🌲 forest/i });
    const playgroundBtn = screen.getByRole('button', { name: /🎪 playground/i });

    expect(cityBtn).toHaveAttribute('aria-pressed', 'true');
    stepFrames(5);

    fireEvent.click(forestBtn);
    expect(forestBtn).toHaveAttribute('aria-pressed', 'true');
    expect(cityBtn).toHaveAttribute('aria-pressed', 'false');
    stepFrames(5);

    fireEvent.click(playgroundBtn);
    expect(playgroundBtn).toHaveAttribute('aria-pressed', 'true');
    expect(forestBtn).toHaveAttribute('aria-pressed', 'false');
    stepFrames(5);
  });

  it('toggles sound effects without restarting the RAF loop', async () => {
    render(<Pals onBack={onBackMock} />);

    const cancelSpy = vi.mocked(window.cancelAnimationFrame);
    expect(cancelSpy).not.toHaveBeenCalled();

    const soundBtn = screen.getByRole('button', { name: /enable sound effects/i });
    expect(soundBtn).toHaveTextContent(/🔇 muted/i);

    fireEvent.click(soundBtn);
    expect(screen.getByRole('button', { name: /mute sound effects/i })).toHaveTextContent(
      /🔊 sound on/i
    );
    expect(cancelSpy).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /💖 pet pal/i }));
      fireEvent.click(screen.getByRole('button', { name: /🎾 throw ball/i }));
      fireEvent.click(screen.getByRole('button', { name: /🔔 whistle/i }));
    });
    stepFrames(3);

    fireEvent.click(screen.getByRole('button', { name: /mute sound effects/i }));
    expect(screen.getByRole('button', { name: /enable sound effects/i })).toHaveTextContent(
      /🔇 muted/i
    );
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it('cancels animation frame and closes AudioContext on unmount', async () => {
    const { unmount } = render(<Pals onBack={onBackMock} />);

    fireEvent.click(screen.getByRole('button', { name: /enable sound effects/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /💖 pet pal/i }));
    });

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('handles missing or throwing AudioContext gracefully', async () => {
    delete (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
    delete (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    render(<Pals onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /enable sound effects/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /💖 pet pal/i }));
      fireEvent.click(screen.getByRole('button', { name: /🎾 throw ball/i }));
      fireEvent.click(screen.getByRole('button', { name: /🔔 whistle/i }));
    });
    expect(screen.getByText(/mood: joyful/i)).toBeInTheDocument();

    class ThrowingAudioContext {
      constructor() {
        throw new Error('Audio blocked');
      }
    }
    window.AudioContext = ThrowingAudioContext as unknown as typeof AudioContext;

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /💖 pet pal/i }));
    });
    expect(screen.getByText(/mood: joyful/i)).toBeInTheDocument();
  });

  it('handles null 2D canvas context gracefully', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    render(<Pals onBack={onBackMock} />);
    await act(async () => {});
    expect(screen.getByRole('alert')).toHaveTextContent(/2d canvas rendering is unavailable/i);
  });

  it('handles action buttons and animates ball and treat simulation', () => {
    render(<Pals onBack={onBackMock} />);

    fireEvent.click(screen.getByRole('button', { name: /enable sound effects/i }));

    const ballBtn = screen.getByRole('button', { name: /🎾 throw ball/i });
    fireEvent.click(ballBtn);
    expect(screen.getByText(/mood: playful/i)).toBeInTheDocument();
    stepFrames(30);

    const treatBtn = screen.getByRole('button', { name: /feed fish/i });
    fireEvent.click(treatBtn);
    expect(screen.getByText(/mood: curious/i)).toBeInTheDocument();
    stepFrames(60);

    const whistleBtn = screen.getByRole('button', { name: /🔔 whistle/i });
    fireEvent.click(whistleBtn);
    expect(screen.getByText(/mood: joyful/i)).toBeInTheDocument();
    stepFrames(20);

    const resetBtn = screen.getByRole('button', { name: /🔄 reset/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText(/mood: playful/i)).toBeInTheDocument();
    stepFrames(5);
  });

  it('supports pointer drag and toss on canvas with momentum and prevents floor tunneling', () => {
    render(<Pals onBack={onBackMock} />);
    const canvas = screen.getByTestId('pals-canvas');

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    expect(screen.getByText(/mood: joyful/i)).toBeInTheDocument();

    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 350, pointerId: 1 });
    // Drag well below FLOOR_Y (405) to verify clamping prevents falling through floor
    fireEvent.pointerMove(canvas, { clientX: 460, clientY: 445, pointerId: 1 });
    stepFrames(2);
    fireEvent.pointerUp(canvas, { clientX: 460, clientY: 445, pointerId: 1 });

    stepFrames(30);
    expect(screen.getByTestId('pals-canvas')).toBeInTheDocument();
  });

  it('normalizes physics speed across 60Hz and 120Hz frame rates and clamps pal to FLOOR_Y', () => {
    const controller = createAudioController();
    const makePal = (): PalEntity => ({
      x: 400,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 26,
      facing: 'right',
      state: 'jumping',
      stateTimer: 100,
      animTime: 0,
      squash: 1,
      stretch: 1,
      isGrounded: false,
    });

    // 60Hz: 1 frame at 16.6667ms -> dt = 1
    const pal60 = makePal();
    const { dt: dt60 } = normalizeFrameDelta(1000 + 1000 / 60, 1000);
    expect(dt60).toBeCloseTo(1, 3);
    stepPalsPhysics({
      pal: pal60,
      ball: null,
      treat: null,
      particles: [],
      platforms: ENV_PLATFORMS.city,
      selectedPal: 'pip',
      dt: dt60,
      tickCount: 1,
      soundEnabled: false,
      audioController: controller,
      onEatTreat: vi.fn(),
      onSetMood: vi.fn(),
      onBoostEnergy: vi.fn(),
    });

    // 120Hz: 2 frames at 8.3333ms -> dt = 0.5 each
    const pal120 = makePal();
    const { dt: dt120 } = normalizeFrameDelta(1000 + 1000 / 120, 1000);
    expect(dt120).toBeCloseTo(0.5, 3);
    for (let i = 0; i < 2; i++) {
      stepPalsPhysics({
        pal: pal120,
        ball: null,
        treat: null,
        particles: [],
        platforms: ENV_PLATFORMS.city,
        selectedPal: 'pip',
        dt: dt120,
        tickCount: i + 1,
        soundEnabled: false,
        audioController: controller,
        onEatTreat: vi.fn(),
        onSetMood: vi.fn(),
        onBoostEnergy: vi.fn(),
      });
    }
    expect(pal120.vy).toBeCloseTo(pal60.vy, 5);

    // Pal below FLOOR_Y recovers onto floor rather than falling through
    const fallenPal = makePal();
    fallenPal.y = FLOOR_Y + 40;
    fallenPal.vy = 6;
    stepPalsPhysics({
      pal: fallenPal,
      ball: null,
      treat: null,
      particles: [],
      platforms: ENV_PLATFORMS.city,
      selectedPal: 'pip',
      dt: 1,
      tickCount: 1,
      soundEnabled: false,
      audioController: controller,
      onEatTreat: vi.fn(),
      onSetMood: vi.fn(),
      onBoostEnergy: vi.fn(),
    });
    expect(fallenPal.y).toBe(FLOOR_Y - fallenPal.radius);
    expect(fallenPal.vy).toBe(0);
    expect(fallenPal.isGrounded).toBe(true);
  });

  it('triggers edge bounces when companion approaches screen boundaries', () => {
    render(<Pals onBack={onBackMock} />);
    const canvas = screen.getByTestId('pals-canvas');

    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 350, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 10, clientY: 380, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 10, clientY: 380, pointerId: 1 });
    stepFrames(10);

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 380, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 790, clientY: 380, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 790, clientY: 380, pointerId: 1 });
    stepFrames(10);
  });

  it('tests trampoline bounce in playground environment', () => {
    render(<Pals onBack={onBackMock} />);

    fireEvent.click(screen.getByRole('button', { name: /🎪 playground/i }));
    fireEvent.click(screen.getByRole('button', { name: /enable sound effects/i }));

    const canvas = screen.getByTestId('pals-canvas');

    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 350, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 380, clientY: 280, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 380, clientY: 280, pointerId: 1 });

    stepFrames(30);
  });

  it('restores preferences from localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pal: 'barnaby',
        env: 'forest',
        soundEnabled: true,
        snacksCount: 7,
      })
    );

    render(<Pals onBack={onBackMock} />);

    expect(screen.getByText(/barnaby the pup/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🌲 forest/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/snacks: 7/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mute sound effects/i })).toHaveTextContent(
      /🔊 sound on/i
    );
  });

  it('persists preferences to localStorage when changed', () => {
    render(<Pals onBack={onBackMock} />);

    fireEvent.click(screen.getByRole('button', { name: /👾 sprout/i }));
    fireEvent.click(screen.getByRole('button', { name: /🎪 playground/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(saved.pal).toBe('sprout');
    expect(saved.env).toBe('playground');
  });

  it('handles invalid or corrupted localStorage data and invalid enums gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');

    expect(() => render(<Pals onBack={onBackMock} />)).not.toThrow();
    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🏙️ city/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('rejects invalid stored enum values and negative snacksCount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pal: 'dragon',
        env: 'moon',
        soundEnabled: 'yes',
        snacksCount: -5,
      })
    );

    render(<Pals onBack={onBackMock} />);
    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🏙️ city/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/snacks: 0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable sound effects/i })).toHaveTextContent(
      /🔇 muted/i
    );
  });

  it('tolerates localStorage read and write exceptions gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      render(<Pals onBack={onBackMock} />);
      fireEvent.click(screen.getByRole('button', { name: /🐶 barnaby/i }));
    }).not.toThrow();

    expect(screen.getByText(/barnaby the pup/i)).toBeInTheDocument();
  });
});
