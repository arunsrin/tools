# Biomorphs: The Evolutionary Watchmaker - Tool Specification

## 1. Overview
"Biomorphs: The Evolutionary Watchmaker" is an interactive browser simulation inspired by Richard Dawkins' famous *The Blind Watchmaker* biomorph algorithm. It allows users to guide artificial natural selection of procedurally generated alien creatures across generations through continuous 2-way comparative duels.

## 2. Key Features
- **Parametric Anatomy & Genome:** Procedural segmented bodies, articulated jointed appendages, sensory eye clusters, antennae feelers, bioluminescent markings, and radiant alien color palettes.
- **2-Way Dual-Mutant Duel:** Side-by-side Alpha vs Beta comparison cards where both specimens mutate equally from the parent champion, with rapid keyboard shortcuts (`←` / `→` or `1` / `2`).
- **Mutation Dynamics:** User-selectable mutation intensity (Subtle, Moderate, Radical) with Radical as default for bold cosmic mutations.
- **Evolutionary Lineage Timeline:** Visual ancestor timeline tracking generations from Gen 0 onward with time-travel rewind to branch alternate evolutionary trees.
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
