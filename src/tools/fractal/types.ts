export type FractalType = 'mandelbrot' | 'julia' | 'burningship';

export type PaletteId = 'cyan' | 'neon' | 'sunset' | 'emerald' | 'monochrome';

export interface FractalExplorerProps {
  onBack: () => void;
}

export interface Landmark {
  id: string;
  name: string;
  fractal: FractalType;
  centerX: number;
  centerY: number;
  zoom: number;
  juliaC?: [number, number];
  description: string;
}

export interface WallpaperPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface FractalPrefs {
  type: FractalType;
  palette: PaletteId;
  iterations: number;
}

export interface FractalViewport {
  centerX: number;
  centerY: number;
  zoom: number;
}
