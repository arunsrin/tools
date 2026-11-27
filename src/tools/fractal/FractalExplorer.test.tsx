import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FractalExplorer from './FractalExplorer';
import { clampZoom } from './fractalEngine';

const STORAGE_KEY = 'tools_hub_fractal_prefs';

describe('Fractal Explorer Component', () => {
  const onBackMock = vi.fn();

  const origGetContext = HTMLCanvasElement.prototype.getContext;
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const origSetPointerCapture = HTMLCanvasElement.prototype.setPointerCapture;
  const origReleasePointerCapture = HTMLCanvasElement.prototype.releasePointerCapture;
  const origGetBoundingClientRect = HTMLCanvasElement.prototype.getBoundingClientRect;
  const origClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  beforeEach(() => {
    localStorage.clear();
    onBackMock.mockClear();

    const mockContext = {
      createImageData: vi.fn((w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      })),
      putImageData: vi.fn(),
      drawImage: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockContext as unknown as CanvasRenderingContext2D
    );

    HTMLCanvasElement.prototype.toDataURL = vi.fn(
      () => 'data:image/png;base64,mockPngData'
    );
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 850,
      height: 500,
      right: 850,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    HTMLCanvasElement.prototype.getContext = origGetContext;
    HTMLCanvasElement.prototype.toDataURL = origToDataURL;
    HTMLCanvasElement.prototype.setPointerCapture = origSetPointerCapture;
    HTMLCanvasElement.prototype.releasePointerCapture = origReleasePointerCapture;
    HTMLCanvasElement.prototype.getBoundingClientRect = origGetBoundingClientRect;

    if (origClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', origClipboardDescriptor);
    } else {
      delete (navigator as unknown as { clipboard?: Clipboard }).clipboard;
    }
  });

  it('renders Fractal Explorer header, controls, canvas, and landmarks', () => {
    render(<FractalExplorer onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 1, name: /fractal explorer/i })).toBeInTheDocument();
    expect(screen.getByText(/wallpaper studio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('fractal-canvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open wallpaper export modal/i })).toBeInTheDocument();
    expect(screen.getByText(/detail: 120/i)).toBeInTheDocument();
    expect(screen.getByText(/seahorse valley/i)).toBeInTheDocument();
  });

  it('navigates back to hub when clicking Back to Tools Hub', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const backBtn = screen.getByRole('button', { name: /back to tools hub/i });
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('switches between fractal types (Mandelbrot, Julia, Burning Ship)', () => {
    render(<FractalExplorer onBack={onBackMock} />);

    const mandelbrotBtn = screen.getByRole('button', { name: /^mandelbrot$/i });
    expect(mandelbrotBtn).toHaveAttribute('aria-pressed', 'true');

    const juliaBtn = screen.getByRole('button', { name: /^julia set$/i });
    fireEvent.click(juliaBtn);
    expect(juliaBtn).toHaveAttribute('aria-pressed', 'true');
    expect(mandelbrotBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /📍 douady's rabbit/i })).toBeInTheDocument();

    const shipBtn = screen.getByRole('button', { name: /^burning ship$/i });
    fireEvent.click(shipBtn);
    expect(shipBtn).toHaveAttribute('aria-pressed', 'true');
    expect(juliaBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /📍 burning ship/i })).toBeInTheDocument();
  });

  it('changes color palettes via dropdown select', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const select = screen.getByRole('combobox', { name: /select color palette/i });

    expect(select).toHaveValue('cyan');

    fireEvent.change(select, { target: { value: 'neon' } });
    expect(select).toHaveValue('neon');

    fireEvent.change(select, { target: { value: 'sunset' } });
    expect(select).toHaveValue('sunset');

    fireEvent.change(select, { target: { value: 'emerald' } });
    expect(select).toHaveValue('emerald');

    fireEvent.change(select, { target: { value: 'monochrome' } });
    expect(select).toHaveValue('monochrome');
  });

  it('updates calculation iteration slider', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const slider = screen.getByLabelText(/iteration depth slider/i);

    expect(slider).toHaveValue('120');

    fireEvent.change(slider, { target: { value: '250' } });
    expect(screen.getByText(/detail: 250/i)).toBeInTheDocument();
  });

  it('warps to curated landmarks when clicked', () => {
    render(<FractalExplorer onBack={onBackMock} />);

    const seahorseBtn = screen.getByRole('button', { name: /📍 seahorse valley/i });
    fireEvent.click(seahorseBtn);
    expect(screen.getByText(/-0.74364/i)).toBeInTheDocument();

    const elephantBtn = screen.getByRole('button', { name: /📍 elephant valley/i });
    fireEvent.click(elephantBtn);
    expect(screen.getByText(/0.27500/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^julia set$/i }));
    const rabbitBtn = screen.getByRole('button', { name: /📍 douady's rabbit/i });
    fireEvent.click(rabbitBtn);
    expect(screen.getByText(/0.00000/i)).toBeInTheDocument();
  });

  it('handles zoom in, zoom out, and reset buttons and enforces zoom bounds', () => {
    render(<FractalExplorer onBack={onBackMock} />);

    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    const resetBtn = screen.getByRole('button', { name: /reset view/i });

    fireEvent.click(zoomInBtn);
    expect(screen.getByText(/1.5x/i)).toBeInTheDocument();

    fireEvent.click(zoomOutBtn);
    expect(screen.getByText(/1.0x/i)).toBeInTheDocument();

    // Zoom out repeatedly to hit lower bound (0.2x)
    for (let i = 0; i < 6; i++) {
      fireEvent.click(zoomOutBtn);
    }
    expect(screen.getByText(/0.2x/i)).toBeInTheDocument();

    // Reset restores 1.0x
    fireEvent.click(resetBtn);
    expect(screen.getByText(/1.0x/i)).toBeInTheDocument();

    // Verify zoom clamping helper bounds (min 0.2, max 1e12, non-finite fallback)
    expect(clampZoom(0.01)).toBe(0.2);
    expect(clampZoom(1e15)).toBe(1e12);
    expect(clampZoom(Number.NaN)).toBe(1.0);
  });

  it('handles non-passive native wheel zoom on canvas and calls preventDefault', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const canvas = screen.getByTestId('fractal-canvas');

    const wheelIn = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    act(() => {
      canvas.dispatchEvent(wheelIn);
    });
    expect(wheelIn.defaultPrevented).toBe(true);
    expect(screen.getByText(/1.3x/i)).toBeInTheDocument();

    const wheelOut = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
    act(() => {
      canvas.dispatchEvent(wheelOut);
    });
    expect(wheelOut.defaultPrevented).toBe(true);
    expect(screen.getByText(/1.0x/i)).toBeInTheDocument();
  });

  it('handles pointer dragging to pan using canvas aspect ratio and ignores zero-size rect', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const canvas = screen.getByTestId('fractal-canvas');

    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 250, clientY: 220, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 250, clientY: 220, pointerId: 1 });

    // Center should shift left/up from (-0.65, 0)
    expect(screen.queryByText(/-0\.65000, 0\.00000/)).not.toBeInTheDocument();

    // Zero-size bounding rect must not produce NaN
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 240, clientY: 240, pointerId: 2 });
    fireEvent.pointerUp(canvas, { clientX: 240, clientY: 240, pointerId: 2 });
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('copies coordinate telemetry to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(<FractalExplorer onBack={onBackMock} />);
    const copyBtn = screen.getByRole('button', { name: /copy coordinate telemetry/i });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Fractal: mandelbrot'));
    expect(screen.getByText(/✓ copied/i)).toBeInTheDocument();
  });

  it('shows error alert toast when clipboard copy rejects', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(<FractalExplorer onBack={onBackMock} />);
    const copyBtn = screen.getByRole('button', { name: /copy coordinate telemetry/i });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByText(/⚠ failed/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/unable to copy coordinate telemetry/i);
  });

  it('opens wallpaper export modal, selects resolution, and triggers download', () => {
    vi.useFakeTimers();
    render(<FractalExplorer onBack={onBackMock} />);

    const openExportBtn = screen.getByRole('button', { name: /open wallpaper export modal/i });
    fireEvent.click(openExportBtn);

    expect(screen.getByRole('heading', { level: 2, name: /wallpaper studio export/i })).toBeInTheDocument();

    const res4kInput = screen.getByLabelText(/4k ultra hd/i);
    fireEvent.click(res4kInput);

    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        el.click = mockClick;
      }
      return el;
    });

    const downloadBtn = screen.getByRole('button', { name: /download png/i });
    fireEvent.click(downloadBtn);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockClick).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('shows an error alert if toDataURL fails during wallpaper export', () => {
    vi.useFakeTimers();
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
      throw new Error('SecurityError');
    });

    render(<FractalExplorer onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /open wallpaper export modal/i }));
    fireEvent.click(screen.getByRole('button', { name: /download png/i }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to encode or download wallpaper png/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('handles null 2D canvas context gracefully on render and export', () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    render(<FractalExplorer onBack={onBackMock} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/2d canvas rendering is unavailable/i);

    fireEvent.click(screen.getByRole('button', { name: /open wallpaper export modal/i }));
    fireEvent.click(screen.getByRole('button', { name: /download png/i }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => /unable to initialize canvas renderer/i.test(el.textContent ?? ''))).toBe(true);
    vi.useRealTimers();
  });

  it('cleans up pending export timer on unmount without triggering download', () => {
    vi.useFakeTimers();
    const toDataUrlSpy = vi.fn(() => 'data:image/png;base64,mockPngData');
    HTMLCanvasElement.prototype.toDataURL = toDataUrlSpy;

    const { unmount } = render(<FractalExplorer onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /open wallpaper export modal/i }));
    fireEvent.click(screen.getByRole('button', { name: /download png/i }));

    unmount();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(toDataUrlSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('closes wallpaper export modal via Cancel and Escape and restores focus', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const openBtn = screen.getByRole('button', { name: /open wallpaper export modal/i });
    openBtn.focus();
    fireEvent.click(openBtn);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('heading', { level: 2, name: /wallpaper studio export/i })).not.toBeInTheDocument();

    fireEvent.click(openBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openBtn).toHaveFocus();
  });

  it('restores preferences from localStorage on mount and clamps out-of-range iterations', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        type: 'julia',
        palette: 'sunset',
        iterations: 9999,
      })
    );

    render(<FractalExplorer onBack={onBackMock} />);

    expect(screen.getByRole('button', { name: /^julia set$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox', { name: /select color palette/i })).toHaveValue('sunset');
    expect(screen.getByText(/detail: 500/i)).toBeInTheDocument();
  });

  it('clamps low stored iterations to minimum 30', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        type: 'mandelbrot',
        palette: 'cyan',
        iterations: 5,
      })
    );

    render(<FractalExplorer onBack={onBackMock} />);
    expect(screen.getByText(/detail: 30/i)).toBeInTheDocument();
  });

  it('persists preferences to localStorage when changed', () => {
    render(<FractalExplorer onBack={onBackMock} />);

    fireEvent.click(screen.getByRole('button', { name: /^burning ship$/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /select color palette/i }), {
      target: { value: 'emerald' },
    });

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(saved.type).toBe('burningship');
    expect(saved.palette).toBe('emerald');
  });

  it('handles invalid or corrupted localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');

    expect(() => render(<FractalExplorer onBack={onBackMock} />)).not.toThrow();
    expect(screen.getByRole('button', { name: /^mandelbrot$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('tolerates localStorage write exceptions gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      render(<FractalExplorer onBack={onBackMock} />);
      fireEvent.click(screen.getByRole('button', { name: /^julia set$/i }));
    }).not.toThrow();

    expect(screen.getByRole('button', { name: /^julia set$/i })).toBeInTheDocument();
  });
});
