import { useCallback, useEffect, useRef, useState } from 'react';
import InlineAlert from '../../shared/components/InlineAlert';
import Modal from '../../shared/components/Modal';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Toast from '../../shared/components/Toast';
import ToolHeader from '../../shared/components/ToolHeader';
import { useCopyFeedback } from '../../shared/hooks/useCopyFeedback';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { useTimeoutRegistry } from '../../shared/hooks/useTimeoutRegistry';
import { downloadCanvasPng } from '../../shared/utils/canvas';
import {
  clampIterations,
  clampZoom,
  DEFAULT_FRACTAL_PREFS,
  FRACTAL_STORAGE_KEY,
  getDefaultViewport,
  LANDMARKS,
  MAX_ITERATIONS,
  MIN_ITERATIONS,
  PALETTES,
  renderFractalOnCanvas,
  validateFractalPrefs,
  WALLPAPER_PRESETS,
} from './fractalEngine';
import type { FractalExplorerProps, FractalPrefs, FractalType, Landmark, PaletteId } from './types';
import './FractalExplorer.css';

const FRACTAL_OPTIONS: readonly { value: FractalType; label: string }[] = [
  { value: 'mandelbrot', label: 'Mandelbrot' },
  { value: 'julia', label: 'Julia Set' },
  { value: 'burningship', label: 'Burning Ship' },
];

export default function FractalExplorer({ onBack }: FractalExplorerProps) {
  const [prefs, setPrefs] = usePersistedState<FractalPrefs>(
    FRACTAL_STORAGE_KEY,
    DEFAULT_FRACTAL_PREFS,
    { validate: validateFractalPrefs }
  );

  const fractalType = prefs.type;
  const paletteId = prefs.palette;
  const iterations = prefs.iterations;

  const [initialViewport] = useState(() => getDefaultViewport(fractalType));
  const [centerX, setCenterX] = useState<number>(initialViewport.centerX);
  const [centerY, setCenterY] = useState<number>(initialViewport.centerY);
  const [zoom, setZoom] = useState<number>(initialViewport.zoom);
  const [juliaC, setJuliaC] = useState<[number, number]>([-0.123, 0.745]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(WALLPAPER_PRESETS[1].id);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [renderWarning, setRenderWarning] = useState<string | null>(null);

  const { status: copyStatus, copy: copyTelemetry, reset: resetCopyStatus } = useCopyFeedback(2000);
  const { schedule: scheduleTimeout } = useTimeoutRegistry();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const handleSelectFractalType = useCallback(
    (type: FractalType) => {
      setPrefs((prev) => ({ ...prev, type }));
      const nextViewport = getDefaultViewport(type);
      setCenterX(nextViewport.centerX);
      setCenterY(nextViewport.centerY);
      setZoom(nextViewport.zoom);
    },
    [setPrefs]
  );

  const handleSelectLandmark = useCallback(
    (landmark: Landmark) => {
      setPrefs((prev) => ({ ...prev, type: landmark.fractal }));
      setCenterX(landmark.centerX);
      setCenterY(landmark.centerY);
      setZoom(clampZoom(landmark.zoom));
      if (landmark.juliaC) {
        setJuliaC(landmark.juliaC);
      }
    },
    [setPrefs]
  );

  const handleZoom = useCallback((factor: number) => {
    setZoom((prev) => clampZoom(prev * factor));
  }, []);

  const handleReset = useCallback(() => {
    const nextViewport = getDefaultViewport(fractalType);
    setCenterX(nextViewport.centerX);
    setCenterY(nextViewport.centerY);
    setZoom(nextViewport.zoom);
  }, [fractalType]);

  const handleCopyTelemetry = () => {
    const text = `Fractal: ${fractalType} | Re: ${centerX.toFixed(7)} | Im: ${centerY.toFixed(
      7
    )} | Zoom: ${zoom.toExponential(2)} | Iterations: ${iterations}`;
    void copyTelemetry(text);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!isDraggingRef.current || !canvas) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const aspect =
      canvas.width > 0 && canvas.height > 0
        ? canvas.width / canvas.height
        : rect.width / rect.height;
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
      // Ignore environments without pointer capture support
    }
  };

  // Attach native non-passive wheel listener so preventDefault() blocks page scrolling reliably
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.3 : 1 / 1.3;
      handleZoom(factor);
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, [handleZoom]);

  // Render fractal whenever viewport or parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rendered = renderFractalOnCanvas(
      canvas,
      fractalType,
      centerX,
      centerY,
      zoom,
      iterations,
      paletteId,
      juliaC
    );
    setRenderWarning(
      rendered ? null : '2D canvas rendering is unavailable in this browser environment.'
    );
  }, [fractalType, centerX, centerY, zoom, iterations, paletteId, juliaC]);

  const handleCloseExportModal = useCallback(() => {
    if (isExporting) return;
    setExportError(null);
    setIsExportModalOpen(false);
  }, [isExporting]);

  const handleExportWallpaper = () => {
    const preset =
      WALLPAPER_PRESETS.find((p) => p.id === selectedResolution) || WALLPAPER_PRESETS[1];
    setExportError(null);
    setIsExporting(true);

    scheduleTimeout(() => {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = preset.width;
        offscreen.height = preset.height;

        const rendered = renderFractalOnCanvas(
          offscreen,
          fractalType,
          centerX,
          centerY,
          zoom,
          iterations,
          paletteId,
          juliaC
        );

        if (!rendered) {
          setExportError('Unable to initialize canvas renderer for wallpaper export.');
          return;
        }

        const filename = `fractal-${fractalType}-${preset.width}x${preset.height}.png`;
        const exported = downloadCanvasPng(offscreen, filename);
        if (!exported) {
          setExportError('Failed to encode or download wallpaper PNG. Try a lower resolution.');
          return;
        }

        setIsExportModalOpen(false);
      } catch {
        setExportError('Unexpected error occurred while exporting wallpaper PNG.');
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  return (
    <div className="fractal-wrapper">
      <ToolHeader
        onBack={onBack}
        title="Fractal Explorer"
        badge="Wallpaper Studio"
        subtitle="Explore Mandelbrot, Julia & Burning Ship fractals with deep zoom & 4K export."
        className="fractal-header"
      />

      <main className="fractal-main">
        {/* Top Control Bar: Fractal Type, Palette & Wallpapers */}
        <div className="fractal-controls-bar">
          <div className="fractal-control-group">
            <span className="fractal-control-label">Fractal:</span>
            <SegmentedControl<FractalType>
              ariaLabel="Select fractal type"
              value={fractalType}
              onChange={handleSelectFractalType}
              options={FRACTAL_OPTIONS}
              className="fractal-type-segmented"
            />
          </div>

          <div className="fractal-control-group">
            <label htmlFor="fractal-palette-select" className="fractal-control-label">
              Palette:
            </label>
            <select
              id="fractal-palette-select"
              className="fractal-palette-select"
              value={paletteId}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, palette: e.target.value as PaletteId }))
              }
              aria-label="Select color palette"
            >
              {Object.entries(PALETTES).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fractal-control-group fractal-iterations-group">
            <label htmlFor="iter-slider" className="fractal-control-label">
              Detail: {iterations}
            </label>
            <input
              id="iter-slider"
              type="range"
              min={MIN_ITERATIONS}
              max={MAX_ITERATIONS}
              step="10"
              value={iterations}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  iterations: clampIterations(Number(e.target.value)),
                }))
              }
              className="fractal-iter-slider"
              aria-label="Iteration depth slider"
            />
          </div>

          <div className="fractal-control-group fractal-export-control">
            <button
              type="button"
              className="fractal-export-btn"
              onClick={() => {
                setExportError(null);
                setIsExportModalOpen(true);
              }}
              aria-label="Open wallpaper export modal"
            >
              🖼️ Export Wallpaper
            </button>
          </div>
        </div>

        {/* Landmarks Quick-Warp Bar */}
        <div className="fractal-landmarks-bar" role="group" aria-label="Curated landmark bookmarks">
          <span className="fractal-landmarks-title">Landmarks:</span>
          <div className="fractal-landmarks-scroll">
            {LANDMARKS.filter((lm) => lm.fractal === fractalType).map((lm) => (
              <button
                key={lm.id}
                type="button"
                className="fractal-landmark-chip"
                onClick={() => handleSelectLandmark(lm)}
                title={lm.description}
              >
                📍 {lm.name}
              </button>
            ))}
          </div>
        </div>

        {renderWarning ? (
          <InlineAlert
            variant="warning"
            message={renderWarning}
            onDismiss={() => setRenderWarning(null)}
          />
        ) : null}

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
            data-testid="fractal-canvas"
          />

          {/* Floating On-Canvas Telemetry HUD */}
          <div className="fractal-telemetry-hud">
            <div className="fractal-telemetry-data">
              <span>
                <strong>Center:</strong> {centerX.toFixed(5)}, {centerY.toFixed(5)}
              </span>
              <span>
                <strong>Zoom:</strong> {zoom >= 1000 ? zoom.toExponential(2) : `${zoom.toFixed(1)}x`}
              </span>
            </div>
            <button
              type="button"
              className="fractal-copy-telemetry-btn"
              onClick={handleCopyTelemetry}
              title="Copy coordinate telemetry"
              aria-label="Copy coordinate telemetry"
            >
              {copyStatus === 'copied'
                ? '✓ Copied'
                : copyStatus === 'error'
                  ? '⚠ Failed'
                  : '📋 Copy'}
            </button>
          </div>

          {/* Floating Navigation Buttons (+ / - / Reset) */}
          <div className="fractal-canvas-nav-overlay">
            <button
              type="button"
              className="fractal-nav-btn"
              onClick={() => handleZoom(1.5)}
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              className="fractal-nav-btn"
              onClick={() => handleZoom(1 / 1.5)}
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              className="fractal-nav-btn"
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
            💡 <strong>Exploration Guide:</strong> Click and drag to pan across the fractal. Use the
            mouse wheel or on-screen buttons to zoom in endlessly. Pick landmark presets or switch
            color palettes to discover hidden self-similar worlds!
          </p>
        </div>
      </main>

      {/* Wallpaper Studio Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={handleCloseExportModal}
        title="🖼️ Wallpaper Studio Export"
        closeLabel="Close wallpaper export modal"
        maxWidth="440px"
        className="fractal-modal-card"
      >
        <p className="fractal-modal-desc">
          Render and download the current fractal view at crystal-clear high resolutions.
        </p>

        {exportError ? (
          <InlineAlert
            variant="error"
            message={exportError}
            onDismiss={() => setExportError(null)}
          />
        ) : null}

        <div
          className="fractal-resolution-options"
          role="radiogroup"
          aria-label="Select export resolution"
        >
          {WALLPAPER_PRESETS.map((p) => (
            <label
              key={p.id}
              className={`fractal-res-label ${selectedResolution === p.id ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="wallpaper-res"
                value={p.id}
                checked={selectedResolution === p.id}
                onChange={(e) => setSelectedResolution(e.target.value)}
              />
              <div className="fractal-res-info">
                <span className="fractal-res-name">{p.name}</span>
                <span className="fractal-res-dim">
                  {p.width} × {p.height} px
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="fractal-modal-actions">
          <button
            type="button"
            className="fractal-modal-cancel-btn"
            onClick={handleCloseExportModal}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fractal-modal-download-btn"
            onClick={handleExportWallpaper}
            disabled={isExporting}
          >
            {isExporting ? 'Rendering...' : '⬇️ Download PNG'}
          </button>
        </div>
      </Modal>

      <Toast
        visible={copyStatus === 'error'}
        variant="error"
        message="Unable to copy coordinate telemetry to clipboard."
        onDismiss={resetCopyStatus}
      />
    </div>
  );
}
