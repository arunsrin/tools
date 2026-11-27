import type {
  FractalPrefs,
  FractalType,
  FractalViewport,
  Landmark,
  PaletteId,
  WallpaperPreset,
} from './types';

export const FRACTAL_STORAGE_KEY = 'tools_hub_fractal_prefs';
export const MIN_ITERATIONS = 30;
export const MAX_ITERATIONS = 500;
export const DEFAULT_ITERATIONS = 120;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 1e12;

export const DEFAULT_FRACTAL_PREFS: FractalPrefs = {
  type: 'mandelbrot',
  palette: 'cyan',
  iterations: DEFAULT_ITERATIONS,
};

export const LANDMARKS: Landmark[] = [
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

export const PALETTES: Record<PaletteId, { name: string; colors: [number, number, number][] }> = {
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

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { id: 'screen', name: 'Screen Viewport', width: 1200, height: 750 },
  { id: 'fhd', name: 'Full HD (1920 × 1080)', width: 1920, height: 1080 },
  { id: '4k', name: '4K Ultra HD (3840 × 2160)', width: 3840, height: 2160 },
  { id: 'mobile', name: 'Mobile Portrait (1080 × 2400)', width: 1080, height: 2400 },
];

export function clampIterations(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ITERATIONS;
  }
  return Math.max(MIN_ITERATIONS, Math.min(MAX_ITERATIONS, Math.round(value)));
}

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) {
    return 1.0;
  }
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

export function validateFractalPrefs(raw: unknown): FractalPrefs {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_FRACTAL_PREFS;
  }
  const obj = raw as Record<string, unknown>;
  const type: FractalType =
    obj.type === 'mandelbrot' || obj.type === 'julia' || obj.type === 'burningship'
      ? obj.type
      : DEFAULT_FRACTAL_PREFS.type;
  const palette: PaletteId =
    typeof obj.palette === 'string' && Object.prototype.hasOwnProperty.call(PALETTES, obj.palette)
      ? (obj.palette as PaletteId)
      : DEFAULT_FRACTAL_PREFS.palette;
  const iterations =
    typeof obj.iterations === 'number'
      ? clampIterations(obj.iterations)
      : DEFAULT_FRACTAL_PREFS.iterations;

  return { type, palette, iterations };
}

export function getDefaultViewport(type: FractalType): FractalViewport {
  if (type === 'mandelbrot') {
    return { centerX: -0.65, centerY: 0.0, zoom: 1.0 };
  }
  if (type === 'julia') {
    return { centerX: 0.0, centerY: 0.0, zoom: 1.2 };
  }
  return { centerX: -0.45, centerY: -0.5, zoom: 1.2 };
}

/**
 * Renders the selected fractal directly into a 2D canvas context.
 * Returns `false` if the canvas dimensions are zero or 2D context is unavailable.
 */
export function renderFractalOnCanvas(
  canvas: HTMLCanvasElement,
  type: FractalType,
  centerX: number,
  centerY: number,
  zoom: number,
  maxIterations: number,
  paletteId: PaletteId,
  juliaC: [number, number]
): boolean {
  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return false;

  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const aspect = width / height;
  const scale = 3.0 / zoom;
  const palette = PALETTES[paletteId] || PALETTES.cyan;
  const colors = palette.colors;

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
        data[pixelIndex] = 10;
        data[pixelIndex + 1] = 15;
        data[pixelIndex + 2] = 24;
        data[pixelIndex + 3] = 255;
      } else {
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
  return true;
}
