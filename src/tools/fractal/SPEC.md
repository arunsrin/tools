# Fractal Explorer - Modular Tool Specification

## 1. Overview
Fractal Explorer is a high-performance interactive fractal renderer and wallpaper studio. It provides real-time exploration of the Mandelbrot Set, Julia Sets, and the Burning Ship fractal with deep continuous zoom, high-contrast aesthetic color palettes, curated landmark bookmarks, live coordinate telemetry, and client-side 4K/Full HD wallpaper export.

## 2. Functional Requirements

### 2.1 Supported Fractals
- **Mandelbrot**: $z_{n+1} = z_n^2 + c$ starting from $z_0 = 0$.
- **Julia**: $z_{n+1} = z_n^2 + c$ with selectable constant presets (e.g. Douady's Rabbit $c = -0.123 + 0.745i$, Dendrite $c = -0.4 + 0.6i$).
- **Burning Ship**: Inverted absolute value variant $(|\text{Re}(z)| + i|\text{Im}(z)|)^2 + c$.

### 2.2 Rendering & Navigation
- **High-Precision Direct Pixel Buffer Engine**: Canvas 2D direct pixel array buffer computation in `fractalEngine.ts` using 64-bit IEEE double float precision for artifact-free deep zoom, with multi-stop gradient color interpolation across a 48-step cycle period.
- **Navigation**: Pan via click-and-drag or touch drag (matching rendered canvas aspect ratio), deep continuous zoom via non-passive mouse wheel (`{ passive: false }`), touch pinch, and zoom buttons (`+`, `-`) clamped between `0.2` and `1e12`.
- **Iteration Depth & Reset**: Iteration depth slider (30 to 500 iterations) and Home / Reset button to restore default zoom for the current fractal.

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

### 2.5 Wallpaper Studio & Guide
- Client-side PNG snapshot export (`downloadCanvasPng`) at selectable resolutions (`Current Viewport`, `Full HD 1920 × 1080`, `4K Ultra HD 3840 × 2160`, `Mobile Portrait 1080 × 2400`) as `fractal-wallpaper.png`.
- Shareable coordinate copy with visual feedback (`useCopyFeedback`) and an interactive Help/Guide `Modal`.

## 3. Acceptance Criteria
- **Hub Navigation & Direct Route**: Uses shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`), registers `/fractal` in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- **Error & Clipboard Feedback**: Canvas `getContext('2d') === null`, `toDataURL` export errors, and clipboard rejections surface clear user feedback via `InlineAlert` / `Toast` rather than failing silently.
- **Modal & Wheel Listener Cleanup**: Help `Modal` supports `Escape` dismissal, close button, and focus restoration; native `{ passive: false }` wheel listeners and `useTimeoutRegistry` timers clean up on unmount.
- **Persistence & Clamping**: Preferences (fractal type, palette, iterations clamped to 30–500) are stored in `localStorage` under `tools_hub_fractal_prefs` via `usePersistedState` with validation.
- **Responsive Dark Theme & CSS Isolation**: Consumes `src/styles/tokens.css`, prefixes classes (`.fractal-*`), wraps button groups, and avoids HUD/overlay collisions on 320px mobile viewports.
- **Modular Isolation & Test Coverage**: `FractalExplorer.tsx` exports only `default function FractalExplorer` (types in `types.ts`, engine in `fractalEngine.ts`), with companion tests in `FractalExplorer.test.tsx` restoring patched prototypes/mocks in `afterEach` and exceeding 80% coverage.
