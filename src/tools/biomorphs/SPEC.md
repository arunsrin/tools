# Biomorphs: The Evolutionary Watchmaker - Tool Specification

## 1. Overview
"Biomorphs: The Evolutionary Watchmaker" is an interactive browser simulation inspired by Richard Dawkins' famous *The Blind Watchmaker* biomorph algorithm. It allows users to guide artificial natural selection of procedurally generated alien creatures across generations through continuous 2-way comparative duels.

## 2. Key Features
- **Parametric Anatomy & Genome:** Procedural segmented bodies, articulated jointed appendages, wings/glide fins, mouthparts (proboscis/mandibles), sensory eye clusters, antennae feelers, bioluminescent markings, and expansive chromatic palettes.
- **Ecosystem Adaptation & Fitness Engine:** Combinable environmental dimensions (Terrain, Climate, Threat) establishing objective fitness goals (0%–100%) with real-time adaptive deltas, diagnostic trait tags, and Apex Organism milestones (>=90% fitness).
- **2-Way Dual-Mutant Duel:** Side-by-side Alpha vs Beta comparison cards where both specimens mutate equally from the parent champion, with rapid keyboard shortcuts (`←` / `→` or `1` / `2`).
- **Natural Evolutionary Drift with Familial Semblance:** Calibrated mutation dynamics ensuring offspring retain recognizable familial resemblance to their parent (color harmony, stable limb posture, rare macro-mutations) while presenting distinct variations.
- **Evolutionary Lineage Timeline:** Visual ancestor timeline tracking generations from Gen 0 onward with time-travel rewind to branch alternate evolutionary trees.
- **Streamlined Bottom Utility Dock:** Copy DNA, Import DNA, HD PNG export, and New Genesis conveniently consolidated at the bottom.
- **DNA Sharing & HD Image Export:** Shareable DNA code copy/import and one-click 1024x1024 HD PNG specimen snapshot export.
- **Zero Bloat & Dark Theme:** Pure HTML5 Canvas 2D engine with zero external libraries, optimized for 60fps rendering and mobile responsiveness.

## 3. Keyboard Shortcuts
- `←` or `1`: Select Specimen Alpha (Left)
- `→` or `2`: Select Specimen Beta (Right)
- `R`: New Genesis (Restart from fresh Gen 0 primordial organism)

## 4. Storage & State
- State is persisted to `localStorage` under key `tools_hub_biomorphs`:
  - `activeGenome`: Current champion organism DNA
  - `generation`: Current generation number
  - `mutationIntensity`: 'subtle' | 'moderate' | 'radical'
  - `lineage`: Array of past ancestor genomes and generation tags
- Gracefully handles quota and private browsing restrictions.
