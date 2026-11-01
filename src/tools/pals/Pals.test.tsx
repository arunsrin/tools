import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Pals from './Pals';

const STORAGE_KEY = 'tools_hub_desktop_pals';

describe('Desktop Pals Component', () => {
  const onBackMock = vi.fn();
  let rafCallbacks: FrameRequestCallback[] = [];

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

  function stepFrames(count = 1) {
    for (let i = 0; i < count; i++) {
      act(() => {
        const cbs = [...rafCallbacks];
        rafCallbacks = [];
        cbs.forEach((cb) => cb(performance.now()));
      });
    }
  }

  beforeEach(() => {
    localStorage.clear();
    onBackMock.mockClear();
    rafCallbacks = [];

    // Mock requestAnimationFrame & cancelAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Mock AudioContext
    class MockAudioContext {
      currentTime = 10;
      state = 'suspended';
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      createOscillator = vi.fn(() => mockOscillator);
      createGain = vi.fn(() => mockGain);
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    // Mock Canvas 2D context
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

    // Mock pointer capture methods
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
  });

  it('renders the Desktop Pals header, canvas, and controls', () => {
    render(<Pals onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 1, name: /desktop pals/i })).toBeInTheDocument();
    expect(screen.getByText(/interactive toy/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('pals-canvas')).toBeInTheDocument();
    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByText(/feed fish/i)).toBeInTheDocument();

    // Step animation loop
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

    // Pip active
    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🐧 pip/i })).toHaveAttribute('aria-pressed', 'true');
    stepFrames(5);

    // Switch to Barnaby (Pup)
    const barnabyBtn = screen.getByRole('button', { name: /🐶 barnaby/i });
    fireEvent.click(barnabyBtn);
    expect(screen.getByText(/barnaby the pup/i)).toBeInTheDocument();
    expect(screen.getByText(/feed bone/i)).toBeInTheDocument();
    expect(barnabyBtn).toHaveAttribute('aria-pressed', 'true');
    stepFrames(5);

    // Switch to Sprout (Forest Sprite)
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

    // Switch to Forest
    fireEvent.click(forestBtn);
    expect(forestBtn).toHaveAttribute('aria-pressed', 'true');
    expect(cityBtn).toHaveAttribute('aria-pressed', 'false');
    stepFrames(5);

    // Switch to Playground (includes bouncy trampoline)
    fireEvent.click(playgroundBtn);
    expect(playgroundBtn).toHaveAttribute('aria-pressed', 'true');
    expect(forestBtn).toHaveAttribute('aria-pressed', 'false');
    stepFrames(5);
  });

  it('toggles sound effects on and off and triggers audio methods', () => {
    render(<Pals onBack={onBackMock} />);

    const soundBtn = screen.getByRole('button', { name: /enable sound effects/i });
    expect(soundBtn).toHaveTextContent(/🔇 muted/i);

    // Toggle on
    fireEvent.click(soundBtn);
    expect(screen.getByRole('button', { name: /mute sound effects/i })).toHaveTextContent(
      /🔊 sound on/i
    );

    // Trigger actions with sound enabled
    fireEvent.click(screen.getByRole('button', { name: /💖 pet pal/i }));
    fireEvent.click(screen.getByRole('button', { name: /🎾 throw ball/i }));
    fireEvent.click(screen.getByRole('button', { name: /🔔 whistle/i }));
    stepFrames(3);

    // Toggle off
    fireEvent.click(screen.getByRole('button', { name: /mute sound effects/i }));
    expect(screen.getByRole('button', { name: /enable sound effects/i })).toHaveTextContent(
      /🔇 muted/i
    );
  });

  it('handles action buttons and animates ball and treat simulation', () => {
    render(<Pals onBack={onBackMock} />);

    // Enable sound
    fireEvent.click(screen.getByRole('button', { name: /enable sound effects/i }));

    // Throw Ball
    const ballBtn = screen.getByRole('button', { name: /🎾 throw ball/i });
    fireEvent.click(ballBtn);
    expect(screen.getByText(/mood: playful/i)).toBeInTheDocument();
    stepFrames(30);

    // Feed Treat
    const treatBtn = screen.getByRole('button', { name: /feed fish/i });
    fireEvent.click(treatBtn);
    expect(screen.getByText(/mood: curious/i)).toBeInTheDocument();
    stepFrames(60);

    // Whistle
    const whistleBtn = screen.getByRole('button', { name: /🔔 whistle/i });
    fireEvent.click(whistleBtn);
    expect(screen.getByText(/mood: joyful/i)).toBeInTheDocument();
    stepFrames(20);

    // Reset
    const resetBtn = screen.getByRole('button', { name: /🔄 reset/i });
    fireEvent.click(resetBtn);
    expect(screen.getByText(/mood: playful/i)).toBeInTheDocument();
    stepFrames(5);
  });

  it('supports pointer drag and toss on canvas with momentum', () => {
    render(<Pals onBack={onBackMock} />);
    const canvas = screen.getByTestId('pals-canvas');

    // Clicking away triggers pet
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    expect(screen.getByText(/mood: joyful/i)).toBeInTheDocument();

    // Dragging pal near center (400, 350)
    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 350, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 460, clientY: 280, pointerId: 1 });
    stepFrames(2);
    fireEvent.pointerUp(canvas, { clientX: 460, clientY: 280, pointerId: 1 });

    // Step frames to simulate flight and landing
    stepFrames(30);
  });

  it('triggers edge bounces when companion approaches screen boundaries', () => {
    render(<Pals onBack={onBackMock} />);
    const canvas = screen.getByTestId('pals-canvas');

    // Drag to far left wall
    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 350, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 10, clientY: 380, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 10, clientY: 380, pointerId: 1 });
    stepFrames(10);

    // Drag to far right wall
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 380, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 790, clientY: 380, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 790, clientY: 380, pointerId: 1 });
    stepFrames(10);
  });

  it('tests trampoline bounce in playground environment', () => {
    render(<Pals onBack={onBackMock} />);

    // Switch to Playground
    fireEvent.click(screen.getByRole('button', { name: /🎪 playground/i }));
    // Enable sound
    fireEvent.click(screen.getByRole('button', { name: /enable sound effects/i }));

    const canvas = screen.getByTestId('pals-canvas');

    // Drop pal directly above the trampoline (x=380, y=280; trampoline is x=330, y=325, w=140)
    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 350, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 380, clientY: 280, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 380, clientY: 280, pointerId: 1 });

    // Step through trampoline landing & bounce
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

  it('handles invalid or corrupted localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');

    expect(() => render(<Pals onBack={onBackMock} />)).not.toThrow();
    expect(screen.getByText(/pip the penguin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🏙️ city/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('tolerates localStorage write exceptions gracefully', () => {
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
