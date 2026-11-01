# Biomorphs: The Evolutionary Watchmaker Specification

## 1. Overview & User Story
As a user visiting Tools Hub, I want an interactive artificial selection sandbox ("Biomorphs: The Evolutionary Watchmaker") inspired by Richard Dawkins' *The Blind Watchmaker*. Each session begins with a procedurally generated alien organism (the "Adam" specimen) with parametric anatomy (head, thorax, abdomen/tail, articulated limbs, sensory orbs, and bioluminescent patterns).

In each generation, the tool displays two candidate organisms (Specimen Alpha vs. Specimen Beta) side-by-side: one representing the current champion and the other possessing subtle (or radical) genetic mutations. By selecting one of the specimens (via click or keyboard arrow keys `←` and `→`), the user guides artificial selection. The selected organism becomes the breeding parent for the next generation, producing new mutations. An interactive ancestor lineage timeline allows users to look back at their evolutionary trajectory, inspect past ancestors, or rewind and branch evolution along a different evolutionary pathway.

---

## 2. Acceptance Criteria

### 2.1 Genetic Architecture & Anatomy
- **AC-1 (Parametric Genome / DNA):**
  Every organism is deterministically generated from an explicit genome data structure:
  - `body`: Segment count (1-4), segment radii, segment aspect ratios, body curve/taper.
  - `limbs`: Limb pair count (1-5 pairs), segment count per limb (1-3 joints), segment lengths, joint angles, thickness, foot/claw type (tapered, claw, pad, glowing orb).
  - `antennae`: Feelers / antennae count, length, curvature, tip style (feathered, beaded, bulbous).
  - `eyes`: Eye count (single cyclops, dual, cluster 4-8), eye spacing, size, pupil/iris glow color.
  - `markings`: Carapace dorsal stripe/spot pattern count, glowing ridge bars, bioluminescent intensity.
  - `palette`: Primary carapace color, secondary accent hue, bioluminescent glow hue, dark underbelly tint.
  - `symmetry`: Symmetrical morphology by default, with occasional asymmetrical limb/color mutations.
- **AC-2 (Procedural Canvas Rendering):**
  - Smooth HTML5 Canvas 2D rendering at crisp resolution with DPI awareness (`window.devicePixelRatio`).
  - High-contrast glowing dark aesthetic: bioluminescent cyan, toxic green, neon purple, electric amber accents against deep obsidian cards (`#0b0f19` / `#1e293b`).
  - Specimen canvas includes subtle ambient breathing animation or idle micro-flexing of limbs to give an organic, living feel.

### 2.2 Evolutionary Engine & Mutation Dynamics
- **AC-3 (2-Way Dual-Mutant Selection):**
  - Dual-card layout: **Specimen Alpha** vs. **Specimen Beta**. Both specimens are distinct, independently mutated offspring originating from the active parent champion, mutating by equal amounts each generation.
  - High-visibility comparison badges on both cards showing key mutated traits (e.g., "+Limb length", "+Dorsal ridge", "Eye cluster", "Pigment shift").
  - Fast selection interactions:
    - Click or tap on either card.
    - Keyboard shortcuts: `←` (Left Arrow or `1`) selects Specimen Alpha; `→` (Right Arrow or `2`) selects Specimen Beta.
- **AC-4 (Mutation Intensity Levels & Radical Default):**
  - Three user-selectable mutation intensity modes, with **Radical** set as the default initial mode for bold, dynamic evolutionary divergence:
    - **Subtle (Micro-evolution):** Small 3-8% shifts in morphology parameters; gradual speciation.
    - **Moderate (Standard):** Balanced 15-25% variations; noticeable adaptive leaps.
    - **Radical (Cosmic Radiation - Default):** 40-70% drastic mutations with anatomical alterations (adding/losing limbs or segments).
- **AC-5 (New Genesis / Reroll):**
  - "New Genesis" / "Restart" button that seeds a fresh Gen 0 primordial organism.
  - Keyboard shortcut: `Space` or `R` triggers a confirmation/quick reroll.

### 2.3 Lineage History & Time-Travel Rewind
- **AC-6 (Ancestor Lineage Timeline):**
  - Horizontal scrollable history strip showing thumbnail canvases or cards of past selected ancestors from Gen 0 to current Gen $N$.
  - Displays Generation number (`Gen 0`, `Gen 1`, `Gen 2`...) and creature nickname / classification tag.
  - Current champion is highlighted in the timeline.
- **AC-7 (Evolutionary Time-Travel & Branching):**
  - Clicking any past ancestor thumbnail restores that ancestor as the parent, allowing the user to explore "What If?" alternative evolutionary branches.
  - Preserves history or branches from that ancestral point.

### 2.4 DNA Code & Specimen Export
- **AC-8 (DNA Code Import/Export):**
  - "Copy DNA" button encodes the genome into a compact shareable string (Base64 JSON or hex seed).
  - "Load DNA" modal/prompt allowing users to paste a DNA string to restore a specific organism.
- **AC-9 (High-Res PNG Specimen Snapshot):**
  - "Export PNG" button renders the champion organism onto an off-screen canvas at 1024x1024 with a dark gradient background and downloads it as `biomorph-gen<N>.png`.

### 2.5 Hub Integration, Standards & Testing
- **AC-10 (Theme & Contrast):**
  - Follows Tools Hub dark theme standards (`#0f172a`, `#1e293b`, `#38bdf8`, `#10b981`, `#f1f5f9`).
  - High-contrast text satisfying WCAG AA (>= 4.5:1).
- **AC-11 (Responsive Scaling & Mobile Usability):**
  - Stacks into vertical duel cards or swipeable view on mobile screens (<= 640px) with zero horizontal overflow.
- **AC-12 (Navigation & Routing):**
  - Accessible "Back to Tools Hub" button calling `onBack()`.
  - Registered under route `/biomorphs` in `src/routes.ts` with direct URL support and browser history sync.
  - Semantic link card on hub dashboard in `src/App.tsx`.
- **AC-13 (Persistence):**
  - Automatically saves current generation, lineage, and mutation intensity to `localStorage` under `tools_hub_biomorphs` with `try/catch` safety.
- **AC-14 (Automated Regression Test Suite):**
  - Full automated companion tests in `src/tools/biomorphs/Biomorphs.test.tsx` verifying:
    - Component rendering and initial Specimen Alpha / Beta cards.
    - Selection of Left / Right specimens advancing generation count.
    - Keyboard shortcut selection (`ArrowLeft`, `ArrowRight`).
    - Mutation intensity mode switching.
    - Ancestor timeline generation and time-travel rewind.
    - DNA export/copy and PNG export trigger.
    - LocalStorage persistence and recovery.
    - Direct route `/biomorphs` in `src/App.test.tsx`.
