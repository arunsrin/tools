import { useState, useEffect, useRef, useCallback } from 'react';
import './FractalExplorer.css';

export type FractalType = 'mandelbrot' | 'julia' | 'burningship';
export type PaletteId = 'cyan' | 'neon' | 'sunset' | 'emerald' | 'monochrome';

interface FractalExplorerProps {
  onBack: () => void;
}

interface Landmark {
  id: string;
  name: string;
  fractal: FractalType;
  centerX: number;
  centerY: number;
  zoom: number;
  juliaC?: [number, number];
  description: string;
}

const STORAGE_KEY = 'tools_hub_fractal_prefs';

const LANDMARKS: Landmark[] = [
  {
    id: 'm-overview',
    name: 'Overview',
    fractal: 'mandelbrot',
    centerX: -0.65,
    centerY: 0.0,
    zoom: 1.0,
    description: 'Classic full view of the Mandelbrot cardioid',
  },
  {
    id: 'm-seahorse',
    name: 'Seahorse Valley',
    fractal: 'mandelbrot',
    centerX: -0.743643,
    centerY: 0.131825,
    zoom: 8500,
    description: 'Intricate spiraling seahorse tendrils',
  },
  {
    id: 'm-elephant',
    name: 'Elephant Valley',
    fractal: 'mandelbrot',
    centerX: 0.275,
    centerY: 0.006,
    zoom: 1200,
    description: 'Curving elephant-trunk filaments',
  },
  {
    id: 'm-spiral',
    name: 'Triple Spiral',
    fractal: 'mandelbrot',
    centerX: -0.088,
    centerY: 0.654,
    zoom: 2400,
    description: 'Hypnotic three-arm vortex',
  },
  {
    id: 'm-satellite',
    name: 'Mini Mandelbrot',
    fractal: 'mandelbrot',
    centerX: -1.7685,
    centerY: -0.001,
    zoom: 8000,
    description: 'Distant self-similar satellite copy',
  },
  {
    id: 'j-rabbit',
    name: "Douady's Rabbit",
    fractal: 'julia',
    centerX: 0.0,
    centerY: 0.0,
    zoom: 1.2,
    juliaC: [-0.123, 0.745],
    description: 'Famous three-eared Julia rabbit',
  },
  {
    id: 'j-dendrite',
    name: 'Dendrite Crystal',
    fractal: 'julia',
    centerX: 0.0,
    centerY: 0.0,
    zoom: 1.2,
    juliaC: [-0.4, 0.6],
    description: 'Snowflake-like branching tree fractal',
  },
  {
    id: 'j-dragon',
    name: 'San Marco Dragon',
    fractal: 'julia',
    centerX: 0.0,
    centerY: 0.0,
    zoom: 1.2,
    juliaC: [-0.75, 0.0],
    description: 'Winged dragon-like self-similarity',
  },
  {
    id: 'b-ship',
    name: 'Burning Ship',
    fractal: 'burningship',
    centerX: -0.45,
    centerY: -0.5,
    zoom: 1.2,
    description: 'Jagged flaming masts of the Burning Ship',
  },
  {
    id: 'b-armada',
    name: 'Ship Armada',
    fractal: 'burningship',
    centerX: -1.75,
    centerY: -0.03,
    zoom: 1500,
    description: 'Deep canyon of burning ghost ships',
  },
];

const PALETTES: Record<PaletteId, { name: string; colors: [number, number, number][] }> = {
  cyan: {
    name: 'Electric Cyan',
    colors: [
      [10, 15, 29],
      [14, 52, 102],
      [24, 110, 180],
      [56, 189, 248],
      [186, 230, 253],
      [240, 249, 255],
    ],
  },
  neon: {
    name: 'Twilight Neon',
    colors: [
      [20, 8, 36],
      [109, 40, 217],
      [217, 70, 239],
      [244, 63, 94],
      [56, 189, 248],
      [254, 240, 138],
    ],
  },
  sunset: {
    name: 'Sunset Ember',
    colors: [
      [15, 6, 6],
      [127, 29, 29],
      [194, 65, 12],
      [249, 115, 22],
      [250, 204, 21],
      [254, 249, 195],
    ],
  },
  emerald: {
    name: 'Emerald Nebula',
    colors: [
      [4, 20, 16],
      [6, 78, 59],
      [16, 185, 129],
      [52, 211, 153],
      [167, 243, 208],
      [240, 253, 244],
    ],
  },
  monochrome: {
    name: 'Monochrome Silver',
    colors: [
      [9, 9, 11],
      [39, 39, 42],
      [82, 82, 91],
      [161, 161, 170],
      [228, 228, 231],
      [255, 255, 255],
    ],
  },
};

const WALLPAPER_PRESETS = [
  { id: 'screen', name: 'Screen Viewport', width: 1200, height: 750 },
  { id: 'fhd', name: 'Full HD (1920 × 1080)', width: 1920, height: 1080 },
  { id: '4k', name: '4K Ultra HD (3840 × 2160)', width: 3840, height: 2160 },
  { id: 'mobile', name: 'Mobile Portrait (1080 × 2400)', width: 1080, height: 2400 },
];

export default function FractalExplorer({ onBack }: FractalExplorerProps) {
  // Load preferences from localStorage
  const [fractalType, setFractalType] = useState<FractalType>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.type === 'mandelbrot' || parsed.type === 'julia' || parsed.type === 'burningship') {
          return parsed.type;
        }
      }
    } catch {
      // fallback
    }
    return 'mandelbrot';
  });

  const [paletteId, setPaletteId] = useState<PaletteId>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (PALETTES[parsed.palette as PaletteId]) {
          return parsed.palette;
        }
      }
    } catch {
      // fallback
    }
    return 'cyan';
  });

  const [iterations, setIterations] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.iterations === 'number') {
          return Math.max(30, Math.min(500, parsed.iterations));
        }
      }
    } catch {
      // fallback
    }
    return 120;
  });

  const [centerX, setCenterX] = useState<number>(-0.65);
  const [centerY, setCenterY] = useState<number>(0.0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [juliaC, setJuliaC] = useState<[number, number]>([-0.123, 0.745]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(WALLPAPER_PRESETS[1].id);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          type: fractalType,
          palette: paletteId,
          iterations,
        })
      );
    } catch {
      // ignore
    }
  }, [fractalType, paletteId, iterations]);

  // Reset viewport when switching fractal type
  const handleSelectFractalType = (type: FractalType) => {
    setFractalType(type);
    if (type === 'mandelbrot') {
      setCenterX(-0.65);
      setCenterY(0.0);
      setZoom(1.0);
    } else if (type === 'julia') {
      setCenterX(0.0);
      setCenterY(0.0);
      setZoom(1.2);
    } else {
      setCenterX(-0.45);
      setCenterY(-0.5);
      setZoom(1.2);
    }
  };

  // Warp to a curated landmark
  const handleSelectLandmark = (landmark: Landmark) => {
    setFractalType(landmark.fractal);
    setCenterX(landmark.centerX);
    setCenterY(landmark.centerY);
    setZoom(landmark.zoom);
    if (landmark.juliaC) {
      setJuliaC(landmark.juliaC);
    }
  };

  // Zoom controls
  const handleZoom = useCallback((factor: number) => {
    setZoom((prev) => Math.max(0.2, Math.min(1e12, prev * factor)));
  }, []);

  const handleReset = useCallback(() => {
    if (fractalType === 'mandelbrot') {
      setCenterX(-0.65);
      setCenterY(0.0);
      setZoom(1.0);
    } else if (fractalType === 'julia') {
      setCenterX(0.0);
      setCenterY(0.0);
      setZoom(1.2);
    } else {
      setCenterX(-0.45);
      setCenterY(-0.5);
      setZoom(1.2);
    }
  }, [fractalType]);

  // Copy telemetry
  const handleCopyTelemetry = () => {
    const text = `Fractal: ${fractalType} | Re: ${centerX.toFixed(7)} | Im: ${centerY.toFixed(
      7
    )} | Zoom: ${zoom.toExponential(2)} | Iterations: ${iterations}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedTelemetry(true);
      setTimeout(() => setCopiedTelemetry(false), 2000);
    }).catch(() => {});
  };

  // Pointer panning on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const rect = canvasRef.current.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const scale = 3.0 / zoom;

    const dRe = -(dx / rect.width) * scale * aspect;
    const dIm = -(dy / rect.height) * scale;

    setCenterX((prev) => prev + dRe);
    setCenterY((prev) => prev + dIm);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
    handleZoom(factor);
  };

  // Render to canvas (supports WebGL with seamless 2D fallback)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderFractalOnCanvas(
      canvas,
      fractalType,
      centerX,
      centerY,
      zoom,
      iterations,
      paletteId,
      juliaC
    );
  }, [fractalType, centerX, centerY, zoom, iterations, paletteId, juliaC]);

  // Wallpaper export download
  const handleExportWallpaper = () => {
    const preset =
      WALLPAPER_PRESETS.find((p) => p.id === selectedResolution) || WALLPAPER_PRESETS[1];
    setIsExporting(true);

    setTimeout(() => {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = preset.width;
        offscreen.height = preset.height;

        renderFractalOnCanvas(
          offscreen,
          fractalType,
          centerX,
          centerY,
          zoom,
          iterations,
          paletteId,
          juliaC
        );

        const dataUrl = offscreen.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `fractal-${fractalType}-${preset.width}x${preset.height}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // error
      } finally {
        setIsExporting(false);
        setIsExportModalOpen(false);
      }
    }, 50);
  };

  return (
    <div className="fractal-wrapper">
      <header className="fractal-header">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Back to Tools Hub"
        >
          ← Back to Tools Hub
        </button>

        <div className="fractal-title-area">
          <div className="fractal-badge">Wallpaper Studio</div>
          <h1 className="fractal-title">Fractal Explorer</h1>
          <p className="fractal-subtitle">
            Explore Mandelbrot, Julia & Burning Ship fractals with deep zoom & 4K export.
          </p>
        </div>
      </header>

      <main className="fractal-main">
        {/* Top Control Bar: Fractal Type, Palette & Wallpapers */}
        <div className="fractal-controls-bar">
          <div className="control-group">
            <span className="control-label">Fractal:</span>
            <div className="btn-group" role="group" aria-label="Select fractal type">
              <button
                type="button"
                className={`type-btn ${fractalType === 'mandelbrot' ? 'active' : ''}`}
                onClick={() => handleSelectFractalType('mandelbrot')}
                aria-pressed={fractalType === 'mandelbrot'}
              >
                Mandelbrot
              </button>
              <button
                type="button"
                className={`type-btn ${fractalType === 'julia' ? 'active' : ''}`}
                onClick={() => handleSelectFractalType('julia')}
                aria-pressed={fractalType === 'julia'}
              >
                Julia Set
              </button>
              <button
                type="button"
                className={`type-btn ${fractalType === 'burningship' ? 'active' : ''}`}
                onClick={() => handleSelectFractalType('burningship')}
                aria-pressed={fractalType === 'burningship'}
              >
                Burning Ship
              </button>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">Palette:</span>
            <select
              className="palette-select"
              value={paletteId}
              onChange={(e) => setPaletteId(e.target.value as PaletteId)}
              aria-label="Select color palette"
            >
              {Object.entries(PALETTES).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group iterations-group">
            <label htmlFor="iter-slider" className="control-label">
              Detail: {iterations}
            </label>
            <input
              id="iter-slider"
              type="range"
              min="40"
              max="500"
              step="10"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="iter-slider"
              aria-label="Iteration depth slider"
            />
          </div>

          <div className="control-group export-control">
            <button
              type="button"
              className="export-btn"
              onClick={() => setIsExportModalOpen(true)}
              aria-label="Open wallpaper export modal"
            >
              🖼️ Export Wallpaper
            </button>
          </div>
        </div>

        {/* Landmarks Quick-Warp Bar */}
        <div className="landmarks-bar" role="group" aria-label="Curated landmark bookmarks">
          <span className="landmarks-title">Landmarks:</span>
          <div className="landmarks-scroll">
            {LANDMARKS.filter((lm) => lm.fractal === fractalType).map((lm) => (
              <button
                key={lm.id}
                type="button"
                className="landmark-chip"
                onClick={() => handleSelectLandmark(lm)}
                title={lm.description}
              >
                📍 {lm.name}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Canvas Stage */}
        <div className="fractal-canvas-container">
          <canvas
            ref={canvasRef}
            width={850}
            height={500}
            className="fractal-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            data-testid="fractal-canvas"
          />

          {/* Floating On-Canvas Telemetry HUD */}
          <div className="telemetry-hud">
            <div className="telemetry-data">
              <span>
                <strong>Center:</strong> {centerX.toFixed(5)}, {centerY.toFixed(5)}
              </span>
              <span>
                <strong>Zoom:</strong> {zoom >= 1000 ? zoom.toExponential(2) : `${zoom.toFixed(1)}x`}
              </span>
            </div>
            <button
              type="button"
              className="copy-telemetry-btn"
              onClick={handleCopyTelemetry}
              title="Copy coordinate telemetry"
              aria-label="Copy coordinate telemetry"
            >
              {copiedTelemetry ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>

          {/* Floating Navigation Buttons (+ / - / Reset) */}
          <div className="canvas-nav-overlay">
            <button
              type="button"
              className="nav-btn"
              onClick={() => handleZoom(1.5)}
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={() => handleZoom(1 / 1.5)}
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={handleReset}
              title="Reset View"
              aria-label="Reset View"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Instructions / Tip Card */}
        <div className="fractal-tip-card">
          <p>
            💡 <strong>Exploration Guide:</strong> Click and drag to pan across the fractal. Use the mouse wheel or on-screen buttons to zoom in endlessly. Pick landmark presets or switch color palettes to discover hidden self-similar worlds!
          </p>
        </div>
      </main>

      {/* Wallpaper Studio Export Modal */}
      {isExportModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-card">
            <h2 id="modal-title" className="modal-title">
              🖼️ Wallpaper Studio Export
            </h2>
            <p className="modal-desc">
              Render and download the current fractal view at crystal-clear high resolutions.
            </p>

            <div className="resolution-options" role="radiogroup" aria-label="Select export resolution">
              {WALLPAPER_PRESETS.map((p) => (
                <label
                  key={p.id}
                  className={`res-label ${selectedResolution === p.id ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="wallpaper-res"
                    value={p.id}
                    checked={selectedResolution === p.id}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                  />
                  <div className="res-info">
                    <span className="res-name">{p.name}</span>
                    <span className="res-dim">{p.width} × {p.height} px</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-download-btn"
                onClick={handleExportWallpaper}
                disabled={isExporting}
              >
                {isExporting ? 'Rendering...' : '⬇️ Download PNG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// FRACTAL COMPUTATION & CANVAS RENDERING ENGINE
// -----------------------------------------------------------

function renderFractalOnCanvas(
  canvas: HTMLCanvasElement,
  type: FractalType,
  centerX: number,
  centerY: number,
  zoom: number,
  maxIterations: number,
  paletteId: PaletteId,
  juliaC: [number, number]
) {
  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return;

  const aspect = width / height;
  const scale = 3.0 / zoom;
  const palette = PALETTES[paletteId] || PALETTES.cyan;
  const colors = palette.colors;

  // Try 2D Context rendering (fast pixel array buffer)
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const [jRe, jIm] = juliaC;

  for (let py = 0; py < height; py++) {
    const im = centerY + ((py - height / 2) / height) * scale;
    const rowOffset = py * width * 4;

    for (let px = 0; px < width; px++) {
      const re = centerX + ((px - width / 2) / width) * scale * aspect;

      let zr = type === 'julia' ? re : 0;
      let zi = type === 'julia' ? im : 0;
      const cr = type === 'julia' ? jRe : re;
      const ci = type === 'julia' ? jIm : im;

      let iter = 0;
      let zr2 = zr * zr;
      let zi2 = zi * zi;

      if (type === 'burningship') {
        zr = 0;
        zi = 0;
        zr2 = 0;
        zi2 = 0;
        while (zr2 + zi2 <= 4.0 && iter < maxIterations) {
          const absZr = Math.abs(zr);
          const absZi = Math.abs(zi);
          zi = 2.0 * absZr * absZi + ci;
          zr = zr2 - zi2 + cr;
          zr2 = zr * zr;
          zi2 = zi * zi;
          iter++;
        }
      } else {
        while (zr2 + zi2 <= 4.0 && iter < maxIterations) {
          zi = 2.0 * zr * zi + ci;
          zr = zr2 - zi2 + cr;
          zr2 = zr * zr;
          zi2 = zi * zi;
          iter++;
        }
      }

      const pixelIndex = rowOffset + px * 4;

      if (iter === maxIterations) {
        // Inside set: deep dark obsidian
        data[pixelIndex] = 10;
        data[pixelIndex + 1] = 15;
        data[pixelIndex + 2] = 24;
        data[pixelIndex + 3] = 255;
      } else {
        // Continuous smooth coloring across an aesthetic 48-step cycle
        const CYCLE_PERIOD = 48;
        const cycleVal = (iter % CYCLE_PERIOD) / CYCLE_PERIOD;
        const scaled = cycleVal * (colors.length - 1);
        const colorIdx = Math.floor(scaled);
        const nextIdx = Math.min(colors.length - 1, colorIdx + 1);
        const t = scaled - colorIdx;

        const c1 = colors[colorIdx];
        const c2 = colors[nextIdx];

        data[pixelIndex] = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        data[pixelIndex + 1] = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        data[pixelIndex + 2] = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        data[pixelIndex + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
