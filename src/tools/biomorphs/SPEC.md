# Biomorphs: The Evolutionary Watchmaker - Tool Specification

## 1. Overview
"Biomorphs: The Evolutionary Watchmaker" is an interactive browser simulation inspired by Richard Dawkins' famous *The Blind Watchmaker* biomorph algorithm. It allows users to guide artificial natural selection of procedurally generated alien creatures across generations through continuous 2-way comparative duels, and launch their champion organisms into an autonomous 2D living ecosystem simulation.

## 2. Key Features
- **Parametric Anatomy & Genome:** Procedural segmented bodies, articulated jointed appendages, wings/glide fins, mouthparts (proboscis, mandibles, razor fangs, serrated jaws), dorsal chitinous serrations, sensory eye clusters, antennae feelers, bioluminescent markings, and expansive chromatic palettes.
- **Ecosystem Adaptation & Fitness Engine:** Combinable environmental dimensions (Terrain, Climate, Threat) establishing objective fitness goals (0%–100%) with real-time adaptive deltas, diagnostic trait tags, and Apex Organism milestones (>=90% fitness).
- **Living Biosphere Simulation:** Full-screen 2D multi-agent ecosystem simulation with living environmental flora (kelp ribbons, lily pads, fern fronds, crystals, vents) where the player's biomorph lives, swims, crawls, or flies among diverse autonomous prey (bell spores, nymphs, flutterers) and hostile predators (fanged stalkers, raptors, serpentine parasites).
- **Fitness-Driven Survival & Predation:** Locomotion speed, stamina, metabolic drain, and predator combat resilience are dynamically governed by the creature's genome and fitness score.
- **Extinction Debrief & Evolutionary Advice:** When energy/health reaches zero, an extinction debrief analyzes unadapted anatomical traits and provides guidance for counter-adaptation in the lab.
- **Apex Dominance Milestone:** Reaching prolonged survival and dominant feeding in the biosphere crowns the creature as the Apex Ruler of the biome.
- **2-Way Offspring Duel:** Side-by-side Offspring 1 vs Offspring 2 comparison cards with clear separation between current Active Biosphere traits (above canvas) and Next-Gen Mutations (below canvas), with top "Select as Champion" buttons, bottom-right "Launch" buttons, and rapid keyboard selection (`←` / `→` or `1` / `2`).
- **How to Play Guide:** Built-in guidance banner detailing the core loop: analyze environment -> selectively breed adapted traits -> test in living biosphere.
- **Natural Evolutionary Drift with Familial Semblance:** Calibrated mutation dynamics ensuring offspring retain recognizable familial resemblance to their parent while presenting distinct variations.
- **Evolutionary Lineage Timeline:** Visual ancestor timeline tracking generations from Gen 0 onward with auto-zoomed thumbnails and time-travel rewind to branch alternate evolutionary trees.
- **Streamlined Bottom Utility Dock:** Copy DNA, Import DNA, HD PNG export, and New Genesis conveniently consolidated at the bottom.
- **DNA Sharing & HD Image Export:** Shareable DNA code copy/import and one-click 1024x1024 HD PNG specimen snapshot export.
- **Zero Bloat & Dark Theme:** Pure HTML5 Canvas 2D engine with zero external libraries, optimized for 60fps rendering and mobile responsiveness.

## 3. Keyboard Shortcuts
- `←` or `1`: Select Specimen Alpha (Left) in Breeding Lab
- `→` or `2`: Select Specimen Beta (Right) in Breeding Lab
- `L`: Launch champion organism into Living Biosphere (or return to Lab)
- `Space`: Pause / Resume Living Biosphere simulation
- `R`: New Genesis in Lab (Restart from fresh Gen 0 primordial organism)

## 4. Storage & State
- State is persisted to `localStorage` under key `tools_hub_biomorphs`:
  - `parentGenome`: Current champion organism DNA
  - `lineage`: Array of past ancestor genomes (capped at last 25 generations)
  - `ecosystem`: Active environmental parameters (`terrain`, `climate`, `threat`)
- Gracefully handles quota and private browsing restrictions.
