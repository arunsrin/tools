# Fractal Explorer Specification

## 1. Overview & User Story
As a user or creative visiting Tools Hub, I want an interactive fractal explorer and wallpaper studio featuring Mandelbrot, Julia, and Burning Ship sets with continuous deep zoom, vivid customizable color palettes, curated landmark bookmarks, and 4K wallpaper export so that I can explore the infinite beauty of mathematical fractals and create stunning wallpapers directly in my browser with zero bloat.

---

## 2. Acceptance Criteria

### 2.1 Fractal Types & Algorithms
- **AC-1 (Supported Fractal Sets):**
  - **Mandelbrot Set:** Classic quadratic map $z_{n+1} = z_n^2 + c$ where $z_0 = 0$.
  - **Julia Sets:** Quadratic map $z_{n+1} = z_n^2 + c$ with customizable complex constant $c$ (e.g. Douady's Rabbit, Dendrite Crystal, San Marco).
  - **Burning Ship Set:** The absolute value variant $(|\text{Re}(z)| + i|\text{Im}(z)|)^2 + c$ yielding jagged, ship-like flame silhouettes.
- **AC-2 (Iteration Depth Control):**
  - Users can adjust calculation iterations via slider (e.g. 40 to 500) to balance performance and boundary detail.

### 2.2 Rendering Engine & Performance
- **AC-3 (High-Precision Canvas 2D Direct Pixel Buffer Engine):**
  - Renders directly via an optimized Canvas 2D direct pixel array buffer (`createImageData` + `putImageData`) utilizing full 64-bit IEEE double float precision, avoiding 32-bit GPU float truncation at deep zoom magnifications.
  - Smooth multi-stop gradient color interpolation across a 48-step cycle period to prevent banding.
- **AC-4 (Fluid Panning & Deep Zooming):**
  - Pan via pointer click-and-drag (mouse / touch).
  - Continuous zoom via mouse scroll wheel, touch pinch, and on-screen zoom buttons (`+`, `-`).
  - Home / Reset button to return to the default overview for the active fractal type.

### 2.3 Curated Landmarks & Presets
- **AC-5 (Landmark Bookmarks):**
  - One-click warp buttons to iconic regions:
    - *Seahorse Valley* (Mandelbrot spiraling tendrils)
    - *Elephant Valley* (Mandelbrot curving trunks)
    - *Triple Spiral* (Mandelbrot hypnotic vortices)
    - *Mini Mandelbrot* (satellite self-similarity)
    - *Douady's Rabbit* (three-eared Julia set)
    - *Dendrite Crystal* (tree-like Julia boundary)
    - *Burning Ship Armada* (flame-masts)

### 2.4 Color Palettes & Aesthetic Styling
- **AC-6 (Color Themes):**
  - Selectable high-contrast color schemes:
    - *Electric Cyan* (deep slate to cyan `#38bdf8`, matching Tools Hub theme)
    - *Twilight Neon* (synthwave magenta, violet, and sky-blue)
    - *Sunset Ember* (warm fire gold, fiery orange, obsidian)
    - *Emerald Nebula* (bioluminescent green, jade, dark teal)
    - *Monochrome Silver* (high-contrast metallic silver & ink black)

### 2.5 Wallpaper Studio & Export
- **AC-7 (High-Resolution Wallpaper Export):**
  - Modal or drawer allowing instant export of the current view as a PNG wallpaper.
  - Preset resolution choices:
    - *Current Viewport*
    - *Full HD (1920 × 1080)*
    - *4K Ultra HD (3840 × 2160)*
    - *Mobile Portrait (1080 × 2400)*
  - Triggers client-side browser download (`fractal-wallpaper.png`) with zero server requests.

### 2.6 Telemetry & Persistence
- **AC-8 (Live Coordinates HUD):**
  - Real-time display of Center X, Center Y, and Zoom magnification multiplier.
  - "Copy Coordinates" button to copy current telemetry to clipboard with visual feedback.
- **AC-9 (Local Storage Persistence):**
  - Saves active fractal type, color palette, and iteration limit under `tools_hub_fractal_prefs`. Wrapped in `try/catch`.
- **AC-10 (Hub Navigation & Route Registration):**
  - Accessible "Back to Tools Hub" button calling `onBack()`.
  - Registered under route `/fractal` in `src/routes.ts` with direct URL access, browser history navigation, and semantic hub card link in `src/App.tsx`.
  - Responsive design scaling from 320px mobile to ultrawide desktop with zero horizontal overflow.
- **AC-11 (Automated Test Suite):**
  - Companion automated regression tests in `src/tools/fractal/FractalExplorer.test.tsx` verifying:
    - Initial rendering and canvas setup.
    - Fractal type switching (Mandelbrot, Julia, Burning Ship).
    - Landmark preset navigation.
    - Color palette switching.
    - Iteration slider changes.
    - Wallpaper export modal and download.
    - Coordinates copy to clipboard.
    - LocalStorage persistence and corrupted state handling.
    - Back navigation and direct route tests in `src/App.test.tsx`.
    - >80% test coverage.
