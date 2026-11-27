export interface CanvasPointerPos {
  x: number;
  y: number;
}

export interface CanvasDprMetrics {
  width: number;
  height: number;
  dpr: number;
}

/**
 * Exports a canvas element as a PNG file download.
 * Returns `true` if the download was triggered, `false` on error.
 */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return false;
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Maps a pointer/mouse event's client coordinates into canvas coordinates,
 * scaling accurately when the canvas CSS display size differs from its logical
 * or backing-store dimensions.
 */
export function getCanvasPointerPos(
  event: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  logicalWidth?: number,
  logicalHeight?: number
): CanvasPointerPos {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }

  const targetWidth = logicalWidth ?? canvas.width;
  const targetHeight = logicalHeight ?? canvas.height;

  return {
    x: ((event.clientX - rect.left) * targetWidth) / rect.width,
    y: ((event.clientY - rect.top) * targetHeight) / rect.height,
  };
}

/**
 * Synchronizes a canvas backing store to the clamped device pixel ratio and
 * applies a matching transform on its 2D context (when available).
 */
export function syncCanvasDpr(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  maxDpr = 2
): CanvasDprMetrics {
  const rawDpr =
    typeof window !== 'undefined' &&
    typeof window.devicePixelRatio === 'number' &&
    Number.isFinite(window.devicePixelRatio) &&
    window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;

  const dpr = Math.min(Math.max(rawDpr, 1), Math.max(1, maxDpr));
  const width = Math.max(1, cssWidth);
  const height = Math.max(1, cssHeight);
  const backingWidth = Math.max(1, Math.round(width * dpr));
  const backingHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== backingWidth) {
    canvas.width = backingWidth;
  }
  if (canvas.height !== backingHeight) {
    canvas.height = backingHeight;
  }

  try {
    const ctx = canvas.getContext('2d');
    if (ctx && typeof ctx.setTransform === 'function') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  } catch {
    // Ignore environments without 2D canvas support
  }

  return { width, height, dpr };
}
