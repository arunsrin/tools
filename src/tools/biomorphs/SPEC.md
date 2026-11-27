# Biomorphs: The Evolutionary Watchmaker - Modular Tool Specification

## 1. Overview
"Biomorphs: The Evolutionary Watchmaker" is an interactive browser simulation inspired by Richard Dawkins' famous *The Blind Watchmaker* biomorph algorithm. It allows users to guide artificial natural selection of procedurally generated alien creatures across generations through continuous 2-way comparative duels, and launch their champion organisms into an autonomous 2D living ecosystem simulation.

## 2. Functional Requirements
- **Parametric Anatomy & Genome**: Procedural segmented bodies, articulated jointed appendages, wings/glide fins, mouthparts (proboscis, mandibles, razor fangs, serrated jaws), dorsal chitinous serrations, sensory eye clusters, antennae feelers, bioluminescent markings, and expansive chromatic palettes.
- **Ecosystem Adaptation & Fitness Engine**: Combinable environmental dimensions (Terrain, Climate, Threat) establishing objective fitness goals (0%–100%) with real-time adaptive deltas, diagnostic trait tags, and Apex Organism milestones (>=90% fitness).
- **Living Biosphere Simulation**: Full-screen 2D multi-agent ecosystem simulation with living environmental flora (kelp ribbons, lily pads, fern fronds, crystals, vents) where the player's biomorph lives, swims, crawls, or flies among diverse autonomous prey (bell spores, nymphs, flutterers) and hostile predators (fanged stalkers, raptors, serpentine parasites). Features autonomous ecological equilibrium with a carrying capacity of 8 prey and an emergency replenishment floor of 4 to prevent starvation in sustained runs.
- **Fitness-Driven Survival & Apex Predation**: Locomotion speed, stamina, metabolic drain, and predator combat resilience are dynamically governed by the creature's genome and fitness score. High-fitness apex predators with razor fangs or serrated jaws can counter-attack and devour hostile native predators for +35 energy.
- **Extinction Debrief & Evolutionary Advice**: When energy/health reaches zero, an extinction debrief analyzes unadapted anatomical traits and provides guidance for counter-adaptation in the lab.
- **Apex Dominance Milestone**: Reaching prolonged survival and dominant feeding in the biosphere crowns the creature as the Apex Ruler of the biome.
- **2-Way Offspring Duel**: Side-by-side Offspring 1 vs Offspring 2 comparison cards (`SpecimenCard`) with clear separation between current Active Biosphere traits and Next-Gen Mutations, with "Select as Champion" and "Launch" actions.
- **How to Play Guide**: Built-in guidance banner detailing the core loop: analyze environment -> selectively breed adapted traits -> test in living biosphere.
- **Natural Evolutionary Drift with Familial Semblance**: Calibrated mutation dynamics ensuring offspring retain recognizable familial resemblance to their parent while presenting distinct variations.
- **Evolutionary Lineage Timeline**: Visual ancestor timeline (`LineageThumbnail`) tracking generations from Gen 0 onward (capped at 25 generations) with auto-zoomed thumbnails and time-travel rewind to branch alternate evolutionary trees.
- **DNA Sharing & HD Image Export**: Streamlined utility dock for UTF-8-safe base64 DNA copy/import (`Modal` + `InlineAlert` + `Toast` via `useCopyFeedback`), one-click 1024×1024 HD PNG specimen snapshot export (`downloadCanvasPng`), and New Genesis.
- **Keyboard Shortcuts**:
  - `←` or `1`: Select Specimen Alpha (Left) in Breeding Lab
  - `→` or `2`: Select Specimen Beta (Right) in Breeding Lab
  - `L`: Launch champion organism into Living Biosphere (or return to Lab)
  - `Space`: Pause / Resume Living Biosphere simulation (with `e.preventDefault()`)
  - `R`: New Genesis in Lab (Restart from fresh Gen 0 primordial organism)

## 3. Acceptance Criteria
- **Hub Navigation & Direct Route**: Renders shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`) and registers `/biomorphs` in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- **Accessible Modals & Zero Blocking Dialogs**: DNA import uses the shared `Modal` (`role="dialog"`, `aria-modal="true"`, `Escape` close, focus restoration) and `InlineAlert` (`role="alert"`) for invalid base64/JSON/schema errors—never `window.alert()`.
- **Keyboard & ARIA Integrity**: Global keyboard shortcuts are suppressed while typing in `INPUT`/`TEXTAREA` or when modals are open, and no interactive `<button>` is nested inside `<div role="button">`.
- **RAF & Canvas Lifecycle**: `requestAnimationFrame` loops pause cleanly in Lab mode when not animating, do not reset elapsed animation on selection changes, and cancel cleanly on unmount.
- **Persistence & Validation**: State is persisted to `localStorage` under `tools_hub_biomorphs` (`parentGenome`, `lineage` capped at 25 generations, `ecosystem`) via `usePersistedState` with runtime schema validation (`segments`/`limbPairs`) and `try/catch` safety.
- **WCAG AA Dark Theme & Mobile Scaling**: Consumes `src/styles/tokens.css`, meets >= 4.5:1 text contrast, and wraps controls cleanly on 320px–375px viewports without horizontal overflow.
- **Modular Isolation & Test Coverage**: `Biomorphs.tsx` exports only `default function Biomorphs`, with companion tests in `Biomorphs.test.tsx` restoring mocked globals in `afterEach` and exceeding 80% coverage.
