# Desktop Pals - Modular Tool Specification

## 1. Overview
Desktop Pals is an interactive 2D canvas companion sandbox inspired by classic virtual pets and desktop toys. Users can select and play with charming companions (Pip the Penguin, Barnaby the Pup, and Sprout the Forest Sprite—strictly zero cats), switch between rich themed environments with physical platforms (City Rooftop, Enchanted Forest, Playground Sandbox), drag and toss pals with gravity physics, throw bouncy balls for fetch, feed character-specific snacks, and enjoy zero-asset Web Audio chimes and ambient effects.

## 2. Functional Requirements

### 2.1 Companions ("Pals")
- **Pip the Penguin (🐧)**: Waddles with playful head bobbing, slides smoothly on belly during fast runs or tosses, flaps wings while jumping; favorite treat: Silver Fish (`🐟`).
- **Barnaby the Pup (🐶)**: Bounding stride with animated wagging tail, sits and pants happily when resting, dashes enthusiastically after toys; favorite treat: Bone (`🦴`).
- **Sprout the Forest Sprite (👾)**: Bouncy squish-and-stretch jelly animation, gentle floating descent, swaying leaf sprout on head; favorite treat: Star Berry (`🫐`).
- **Autonomous State Machine**: Transitions between `idle`, `walking`, `jumping`, `sliding`, `chasing`, `eating`, `sleeping`, and `dragged`, turning around upon reaching screen borders or obstacle ledges.

### 2.2 Switchable Environments & Obstacle Physics
- **City Rooftop (🏙️)**: Night skyline silhouettes, neon building lights, brick rooftop ledges, air conditioner / water tower platforms.
- **Enchanted Forest (🌲)**: Emerald night glow, mossy logs, giant mushroom cap platforms, drifting firefly particles.
- **Playground Sandbox (🎪)**: Colorful festive flags, climbing blocks, wooden ramps, springy bouncy trampoline platform that imparts high vertical impulse.
- **Collision & Gravity Physics**: Full platform AABB collision detection with solid floor clamping (`FLOOR_Y`) and one-way elevated platforms, gravity acceleration, velocity decay, and bouncy restitution normalized to frame delta-time (`dt`).

### 2.3 Interactive Play Mechanics
- **Pointer Drag & Toss**: Direct mouse/touch interaction to grab, carry, and throw companions with preserved drag momentum while clamping release coordinates cleanly above/within floor bounds.
- **Petting & Affection**: Direct click or pet action generates floating heart particles (`❤️`), boosting happiness and companion reactions.
- **Toy Ball & Fetch**: Spawns a physical bouncy ball that companions detect, chase, and playfully kick back.
- **Treat Feeding**: Drops character-specific snacks; companions run to eat them, producing crumbs and incrementing the snack tally.
- **Whistle Call**: Calls the companion toward the center of the playground with an alert reaction.

### 2.4 Audio & Mood Feedback
- **Zero-Bloat Web Audio API**: Synthesized sound effects via shared `createAudioController` / `playWithAudio` for bounces, petting, treat eating, and whistle call, with a prominent sound toggle button (muted by default) and graceful fallback when Web Audio is unavailable.
- **Companion Status HUD**: Live mood indicator (`Joyful`, `Playful`, `Curious`, `Munching`, `Sleepy`), energy bar, and lifetime snacks eaten counter.

## 3. Acceptance Criteria
- **Hub Navigation & Direct Route**: Uses shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`) and registers `/pals` in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- **Delta-Time & Floor Boundary Safety**: Physics step scales consistently across 60Hz/120Hz/144Hz displays via clamped `dt`; dragging/releasing a pal near or below `FLOOR_Y` never drops the pal through the floor.
- **RAF & Audio Lifecycle**: Toggling sound does not restart the `requestAnimationFrame` loop; `cancelAnimationFrame` and `audioController.close()` execute cleanly on unmount.
- **Local Persistence & Validation**: Companion choice, environment choice, `snacksCount` (`>= 0`), and mute preference are stored under `tools_hub_desktop_pals` via `usePersistedState` with runtime validation and `try/catch` safety.
- **Responsive Dark Theme & CSS Isolation**: Consumes `src/styles/tokens.css`, prefixes classes (`.pals-*`), wraps button groups and HUD overlays cleanly on 320px viewports, and maintains WCAG AA contrast.
- **Modular Isolation & Test Coverage**: `Pals.tsx` exports only `default function Pals` (types in `types.ts`, canvas/physics in `palsEngine.ts`), with `Pals.test.tsx` covering Web Audio failure, null canvas context, invalid storage enums, unmount cleanup, and `afterEach` mock restoration (>80% coverage).
