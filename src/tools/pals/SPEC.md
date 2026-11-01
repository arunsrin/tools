# Desktop Pals - Modular Tool Specification

## 1. Overview
Desktop Pals is an interactive 2D canvas companion sandbox inspired by classic virtual pets and desktop toys. Users can select and play with charming companions (Pip the Penguin, Barnaby the Pup, and Sprout the Forest Sprite—strictly zero cats), switch between rich themed environments with physical platforms (City Rooftop, Enchanted Forest, Playground Sandbox), drag and toss pals with gravity physics, throw bouncy balls for fetch, feed character-specific snacks, and enjoy zero-asset Web Audio chimes and ambient effects.

---

## 2. Acceptance Criteria & Features

### 2.1 Companions ("Pals")
- **Pip the Penguin (🐧):**
  - Waddles with playful head bobbing, slides smoothly on belly during fast runs or tosses, flaps wings while jumping.
  - Favorite treat: Silver Fish (`🐟`).
- **Barnaby the Pup (🐶):**
  - Bounding stride with an animated wagging tail, sits and pants happily when resting, dashes enthusiastically after toys.
  - Favorite treat: Bone (`🦴`).
- **Sprout the Forest Sprite (👾):**
  - Bouncy squish-and-stretch jelly animation, gentle floating descent, swaying leaf sprout on head.
  - Favorite treat: Star Berry (`🫐`).
- **State Machine:**
  - Autonomous transitions between `idle`, `walking`, `jumping`, `sliding`, `chasing`, `eating`, `sleeping`, and `dragged`.
  - Turns around upon reaching screen borders or obstacle ledges.

### 2.2 Switchable Environments & Obstacle Physics
- **City Rooftop (🏙️):** Night skyline silhouettes, neon building lights, brick rooftop ledges, air conditioner / water tower platforms.
- **Enchanted Forest (🌲):** Emerald night glow, mossy logs, giant mushroom cap platforms, drifting firefly particles.
- **Playground Sandbox (🎪):** Colorful festive flags, climbing blocks, wooden ramps, springy bouncy trampoline platform that imparts high vertical impulse.
- **Collision & Gravity Physics:**
  - Full platform AABB collision detection with solid floor and one-way elevated platforms.
  - Gravity acceleration, velocity decay, and realistic bouncy restitution.

### 2.3 Interactive Play Mechanics
- **Pointer Drag & Toss:**
  - Direct pointer interaction (mouse / touch) to grab, carry, and throw companions with preserved drag momentum.
- **Petting & Affection:**
  - Direct click or pet action generates floating heart particles (`❤️`), boosting happiness and companion reactions.
- **Toy Ball & Fetch:**
  - Spawns a physical bouncy ball. Companions actively detect, chase, and playfully kick the ball back.
- **Treat Feeding:**
  - Drops character-specific snack. Companions run to gobble it up, producing eating crumbs and incrementing the snack tally.
- **Whistle Call:**
  - Calls companion toward the center of the playground with an alert reaction.

### 2.4 Audio & Mood Feedback
- **Zero-Bloat Web Audio API:**
  - Synthesized sound effects for bounces, purrs/petting, treat eating, and whistle call.
  - Prominent sound toggle button (muted by default with persistent user preference).
  - Graceful fallback when Web Audio is blocked or unsupported.
- **Companion Status HUD:**
  - Live mood indicator (e.g., Happy, Playful, Curious, Snacking, Sleepy).
  - Energy bar and lifetime snacks eaten counter.

### 2.5 Hub Standards & Technical Constraints
- **HTML5 2D Canvas & Zero Bloat:** Pure client-side Canvas 2D with `requestAnimationFrame`, automatic HiDPI scaling, and zero external 3D engine overhead.
- **Navigation:** Accessible "Back to Tools Hub" button calling `onBack()`.
- **Direct Route:** `/pals` registered in `src/routes.ts`, `src/App.tsx`, and verified in `src/App.test.tsx`.
- **Local Persistence:** Companion choice, environment choice, snacks count, and mute preference saved under `tools_hub_desktop_pals` wrapped in `try/catch`.
- **Responsive Dark Theme:** Fluid viewport scaling from 320px mobile to desktop matching Tools Hub palette (`#0f172a`, `#1e293b`, `#38bdf8`, `#334155`).
