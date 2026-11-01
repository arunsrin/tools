# Desktop Pals Specification

## 1. Overview & User Story
As a user visiting Tools Hub, I want a playful, interactive desktop companion sandbox ("Desktop Pals") featuring cute animated companions, physical obstacles, platforms, and switchable environments so that I can enjoy a delightful, relaxing interactive break right in my browser without installing external software or heavy 3D engines.

---

## 2. Acceptance Criteria

### 2.1 Companions ("Pals")
- **AC-1 (Companion Cast - Zero Cats):** Provides at least three distinct companions to choose from:
  - **Pip the Penguin (🐧):** Waddles, slides on belly, flaps wings, loves fish treats.
  - **Barnaby the Pup (🐶):** Bounds, wags tail, pants happily, loves bone treats.
  - **Sprout the Forest Sprite (👾):** Squishes, bounces, floats gently, loves glowing berry treats.
- **AC-2 (Autonomous Behavior & State Machine):**
  - Companions operate on an autonomous state machine: `idle`, `walking`, `jumping`, `sliding` / `special`, `chasing` (ball/treat), `eating`, `sleeping`, and `dragged`.
  - Companions change direction when hitting screen edges or obstacle boundaries.
  - Companions randomly inspect surroundings, pause to rest, or perform character-specific idle animations.

### 2.2 Environments & Themed Playgrounds
- **AC-3 (Switchable Themed Environments):** The canvas supports switching between at least three rich visual environments:
  - **City Rooftop (🏙️):** Night skyline silhouettes, neon signs, chimney/ledge obstacles, dark navy atmosphere.
  - **Enchanted Forest (🌲):** Mystical mossy platforms, giant mushroom tops, floating firefly particles, deep emerald night palette.
  - **Playground Sandbox (🎪):** Colorful ramps, elevated wooden blocks, bouncy trampoline pad, festive celebratory vibe.
- **AC-4 (Platforms & Obstacle Physics):**
  - Each environment features distinct solid floor and elevated platforms with collision boxes.
  - Companions and toys respect gravity, platform landing, edge drop-offs, and bounce elasticity.

### 2.3 Interactive Mechanics & Play
- **AC-5 (Drag, Toss & Gravity Physics):**
  - Users can click/tap and drag the companion to pick them up into a `dragged` state.
  - Releasing with momentum applies throw velocity with realistic arc and bounce on the floor/platforms.
- **AC-6 (Petting & Affection):**
  - Clicking or petting the pal produces floating heart particles (`❤️`), increases happiness stats, and triggers a joyful companion animation.
- **AC-7 (Bouncy Toy Ball & Fetch):**
  - An interactive ball can be spawned or tossed into the arena.
  - The companion detects the moving ball, enters a `chasing` state, runs to intercept it, and playfully nudges/bounces it back.
- **AC-8 (Treat Feeding):**
  - Clicking the treat button spawns character-appropriate food (Fish for Pip, Bone for Barnaby, Star Berry for Sprout).
  - The companion hurries toward the treat, consumes it with eating animation and crumb/sparkle particles, boosting energy and snacks tally.
- **AC-9 (Whistle / Call):**
  - A whistle action attracts the companion's attention, making them look toward the center and run over happily.

### 2.4 Audio & Mood Feedback
- **AC-10 (Zero-Asset Web Audio Sound Effects):**
  - Real-time synthesized audio using native Web Audio API oscillators:
    - Petting purr / chirp sound.
    - Ball bounce sound.
    - Treat nibble sound.
    - Whistle call chime.
  - Sound can be toggled on/off (Muted by default to avoid unexpected noise, or toggleable with saved state).
  - Graceful fallback when Web Audio is blocked or unsupported.
- **AC-11 (Companion Status Display):**
  - Displays companion mood (e.g., Happy, Playful, Sleepy), energy bar, and snacks eaten counter.

### 2.5 Responsive UI, Theme & Hub Standards
- **AC-12 (HTML5 2D Canvas & Zero Bloat):**
  - Pure HTML5 Canvas 2D rendering at 60fps via `requestAnimationFrame`. Zero heavy 3D libraries (no Three.js), minimal CPU overhead.
  - Automatic DPI scaling (`window.devicePixelRatio`) for crisp rendering on Retina / 4K displays.
- **AC-13 (Touch & Mobile Usability):**
  - Supports mouse drag & click as well as mobile touch events (`touchstart`, `touchmove`, `touchend`).
  - Fluid canvas sizing with responsive container constraints (`min(100%, 800px)`) ensuring zero horizontal scroll on mobile viewports.
- **AC-14 (Navigation & Direct URL Routing):**
  - Accessible "Back to Tools Hub" button calling `onBack()`.
  - Registered under route `/pals` in `src/routes.ts` with direct URL access, browser history navigation, and semantic hub card link in `src/App.tsx`.
- **AC-15 (Persistence):**
  - Saves active pal selection, environment choice, snacks count, and sound preference to `localStorage` under `tools_hub_desktop_pals`. Wrapped in `try/catch`.
- **AC-16 (Automated Regression Test Suite):**
  - Companion tests in `src/tools/pals/Pals.test.tsx` verifying:
    - Component rendering and controls.
    - Companion selection switching (Pip, Barnaby, Sprout).
    - Environment switching (City, Forest, Playground).
    - Interactive actions (pet, feed treat, throw ball, whistle).
    - Mute/sound toggle.
    - LocalStorage persistence and recovery.
    - Direct route mounting and navigation in `src/App.test.tsx`.
