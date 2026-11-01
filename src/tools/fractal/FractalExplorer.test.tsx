import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FractalExplorer from './FractalExplorer';

const STORAGE_KEY = 'tools_hub_fractal_prefs';

describe('Fractal Explorer Component', () => {
  const onBackMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onBackMock.mockClear();

    // Mock Canvas 2D context
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
    vi.restoreAllMocks();
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

    // Initial is Mandelbrot
    const mandelbrotBtn = screen.getByRole('button', { name: /^mandelbrot$/i });
    expect(mandelbrotBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to Julia
    const juliaBtn = screen.getByRole('button', { name: /^julia set$/i });
    fireEvent.click(juliaBtn);
    expect(juliaBtn).toHaveAttribute('aria-pressed', 'true');
    expect(mandelbrotBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /📍 douady's rabbit/i })).toBeInTheDocument();

    // Switch to Burning Ship
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

    // Switch to Twilight Neon
    fireEvent.change(select, { target: { value: 'neon' } });
    expect(select).toHaveValue('neon');

    // Switch to Sunset Ember
    fireEvent.change(select, { target: { value: 'sunset' } });
    expect(select).toHaveValue('sunset');

    // Switch to Emerald Nebula
    fireEvent.change(select, { target: { value: 'emerald' } });
    expect(select).toHaveValue('emerald');

    // Switch to Monochrome
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

    // Click Seahorse Valley
    const seahorseBtn = screen.getByRole('button', { name: /📍 seahorse valley/i });
    fireEvent.click(seahorseBtn);
    expect(screen.getByText(/-0.74364/i)).toBeInTheDocument();

    // Click Elephant Valley
    const elephantBtn = screen.getByRole('button', { name: /📍 elephant valley/i });
    fireEvent.click(elephantBtn);
    expect(screen.getByText(/0.27500/i)).toBeInTheDocument();

    // Switch to Julia and warp to Douady's Rabbit
    fireEvent.click(screen.getByRole('button', { name: /^julia set$/i }));
    const rabbitBtn = screen.getByRole('button', { name: /📍 douady's rabbit/i });
    fireEvent.click(rabbitBtn);
    expect(screen.getByText(/0.00000/i)).toBeInTheDocument();
  });

  it('handles zoom in, zoom out, and reset buttons', () => {
    render(<FractalExplorer onBack={onBackMock} />);

    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    const resetBtn = screen.getByRole('button', { name: /reset view/i });

    // Zoom in
    fireEvent.click(zoomInBtn);
    expect(screen.getByText(/1.5x/i)).toBeInTheDocument();

    // Zoom out
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText(/1.0x/i)).toBeInTheDocument();

    // Reset
    fireEvent.click(resetBtn);
    expect(screen.getByText(/1.0x/i)).toBeInTheDocument();
  });

  it('handles mouse wheel zoom on canvas', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const canvas = screen.getByTestId('fractal-canvas');

    // Wheel zoom in
    fireEvent.wheel(canvas, { deltaY: -100 });
    expect(screen.getByText(/1.3x/i)).toBeInTheDocument();

    // Wheel zoom out
    fireEvent.wheel(canvas, { deltaY: 100 });
    expect(screen.getByText(/1.0x/i)).toBeInTheDocument();
  });

  it('handles pointer dragging to pan across coordinates', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    const canvas = screen.getByTestId('fractal-canvas');

    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 250, clientY: 220, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 250, clientY: 220, pointerId: 1 });
  });

  it('copies coordinate telemetry to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<FractalExplorer onBack={onBackMock} />);
    const copyBtn = screen.getByRole('button', { name: /copy coordinate telemetry/i });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Fractal: mandelbrot'));
    expect(screen.getByText(/✓ copied/i)).toBeInTheDocument();
  });

  it('opens wallpaper export modal, selects resolution, and triggers download', () => {
    vi.useFakeTimers();
    render(<FractalExplorer onBack={onBackMock} />);

    // Open export modal
    const openExportBtn = screen.getByRole('button', { name: /open wallpaper export modal/i });
    fireEvent.click(openExportBtn);

    expect(screen.getByRole('heading', { level: 2, name: /wallpaper studio export/i })).toBeInTheDocument();

    // Pick 4K Ultra HD
    const res4kInput = screen.getByLabelText(/4k ultra hd/i);
    fireEvent.click(res4kInput);

    // Mock link click
    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        el.click = mockClick;
      }
      return el;
    });

    // Click Download PNG
    const downloadBtn = screen.getByRole('button', { name: /download png/i });
    fireEvent.click(downloadBtn);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockClick).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('closes wallpaper export modal when clicking Cancel', () => {
    render(<FractalExplorer onBack={onBackMock} />);
    fireEvent.click(screen.getByRole('button', { name: /open wallpaper export modal/i }));

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('heading', { level: 2, name: /wallpaper studio export/i })).not.toBeInTheDocument();
  });

  it('restores preferences from localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        type: 'julia',
        palette: 'sunset',
        iterations: 200,
      })
    );

    render(<FractalExplorer onBack={onBackMock} />);

    expect(screen.getByRole('button', { name: /^julia set$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox', { name: /select color palette/i })).toHaveValue('sunset');
    expect(screen.getByText(/detail: 200/i)).toBeInTheDocument();
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
