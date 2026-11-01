# Fractal Explorer - Modular Tool Specification

## 1. Overview
Fractal Explorer is a high-performance interactive fractal renderer and wallpaper studio. It provides real-time exploration of the Mandelbrot Set, Julia Sets, and the Burning Ship fractal with deep continuous zoom, high-contrast aesthetic color palettes, curated landmark bookmarks, live coordinate telemetry, and client-side 4K/Full HD wallpaper export.

---

## 2. Acceptance Criteria & Features

### 2.1 Supported Fractals
- **Mandelbrot:** $z_{n+1} = z_n^2 + c$ starting from $z_0 = 0$.
- **Julia:** $z_{n+1} = z_n^2 + c$ with selectable constant presets (e.g. Douady's Rabbit $c = -0.123 + 0.745i$, Dendrite $c = -0.4 + 0.6i$).
- **Burning Ship:** Inverted absolute value variant $(|\text{Re}(z)| + i|\text{Im}(z)|)^2 + c$.

### 2.2 Rendering & Interaction
- **High-Precision Direct Pixel Buffer Engine:**
  - High-performance Canvas 2D direct pixel array buffer computation using 64-bit IEEE double float precision for artifact-free deep zoom.
  - Multi-stop gradient color interpolation across a 48-step cycle period to produce smooth, posterization-free wallpapers.
- **Navigation:**
  - Pan via click-and-drag or touch drag.
  - Deep continuous zoom via mouse wheel, touch pinch, and zoom buttons (`+`, `-`).
  - Iteration depth slider (40 to 500 iterations).
  - Home / Reset button to restore default zoom for the current fractal.

### 2.3 Landmarks & Presets
- Curated landmark warp buttons:
  - *Seahorse Valley* ($x = -0.7436, y = 0.1318, \text{zoom} = 15000$)
  - *Elephant Valley* ($x = 0.275, y = 0.005, \text{zoom} = 1200$)
  - *Triple Spiral* ($x = -0.088, y = 0.654, \text{zoom} = 2500$)
  - *Mini Mandelbrot* ($x = -1.768, y = 0.001, \text{zoom} = 8000$)
  - *Douady's Rabbit* (Julia $c = -0.123 + 0.745i$)
  - *Dendrite Crystal* (Julia $c = -0.4 + 0.6i$)
  - *Burning Ship Armada* ($x = -0.45, y = -0.5, \text{zoom} = 1500$)

### 2.4 Color Palettes
- *Electric Cyan* (deep slate to `#38bdf8`)
- *Twilight Neon* (synthwave violet/magenta/cyan)
- *Sunset Ember* (volcanic gold/orange/black)
- *Emerald Nebula* (bioluminescent emerald/jade)
- *Monochrome Silver* (sharp metallic silver/ink)

### 2.5 Wallpaper Studio
- Export current view to PNG at selectable resolutions:
  - Current Viewport
  - Full HD (1920 × 1080)
  - 4K Ultra HD (3840 × 2160)
  - Mobile Portrait (1080 × 2400)
- Fully client-side canvas snapshot download (`fractal-wallpaper.png`).

### 2.6 Hub Integration & Standards
- Accessible "Back to Tools Hub" button calling `onBack()`.
- Direct route `/fractal` registered in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- Preferences (fractal type, palette, iterations) stored in `localStorage` under `tools_hub_fractal_prefs`.
- Zero external dependencies.
