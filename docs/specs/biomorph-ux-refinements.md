# Living Specification: Biomorphs UX Refinements, Creature Variety & Living Biome Canvas

## 1. Overview & Motivation
This specification details a comprehensive set of UX, pedagogical, and visual enhancements for the Biomorphs tool. It clarifies candidate quality distinctions, improves action button layout, fixes ancestor thumbnail scaling, introduces an in-game "How to Play" guide, renames candidate duel cards to "Offspring 1" & "Offspring 2", enriches predator/prey anatomy with teeth, serrations, and diverse body plans, and brings the 2D biosphere canvas to life with environmental flora, vents, and terrain features.

---

## 2. Acceptance Criteria

### AC-1: Visual Separation of Active Biosphere Traits vs Genetic Mutations
- **Above Canvas:** Under the fitness score bar, display the candidate's environmental adaptation diagnostics (`pros` and `cons`) clearly labeled as **"Active Biosphere Adaptation:"** (e.g. `+Basalt Blending`, `-Brittle limbs`).
- **Below Canvas:** Display the newly generated genetic mutations (`traits`) clearly labeled as **"✦ Next-Gen Mutations:"** (e.g. `✦ Spectral Shift`, `✦ Wing Elongation`).
- The specimen canvas MUST sit directly between these two sections to eliminate any visual ambiguity between current adaptations and new mutations.

### AC-2: Inverted Action Hierarchy (Select as Champion Primary, Launch Secondary)
- **Top Card Action:** The header of each specimen card MUST feature a prominent **`👑 Select as Champion`** button/action, highlighting that generation selection is the primary loop.
- **Bottom Right Action:** The **`🚀 Launch`** button MUST be positioned at the bottom right of each specimen card footer.
- The entire card MUST remain clickable (and keyboard accessible via Enter/Space) to select that offspring as champion.

### AC-3: Ancestor Tree Thumbnail Zoom-Out
- In `LineageThumbnail` and canvas rendering, apply an automatic scaling factor (`scale ≈ 0.32x`) relative to thumbnail dimensions (76×60) so that the organism's complete anatomical silhouette—including extremities, appendages, wings, and feelers—is fully visible rather than clipped.
- Successive generations in the Lineage scrubber must be visually distinct and easily recognizable.

### AC-4: "How to Play" Guidance Callout
- Under the title group and subtitle, render a sleek, high-contrast **"💡 How to Play"** guidance callout box.
- The guidance MUST clearly instruct the player to:
  1. Study the Active Biosphere's Terrain, Climate, and Threat pressures.
  2. Select offspring with adaptive strengths (`+pros`) that counter these hazards.
  3. Breed through generations until satisfied with fitness, then launch into the biosphere to test survival.

### AC-5: Removal of Visual Arrow Shortcut Boxes
- The `.shortcut-indicator` visual badges (formerly showing `← / 1` and `→ / 2`) MUST be completely removed from the specimen cards.
- Background keyboard listeners (`ArrowLeft`, `ArrowRight`, `1`, `2`) MUST remain operational.

### AC-6: Offspring 1 and Offspring 2 Naming Standard
- Replace all "Alpha" and "Beta" labels on duel cards, tags, aria attributes, and button names with **"Offspring 1"** and **"Offspring 2"**.
- Code identifiers may keep legacy test IDs or alias them with backward compatibility.

### AC-7: Creature Morphological Diversity (Fangs, Serrations & Varied Body Plans)
- Predators and large biomorphs MUST support aggressive anatomical structures:
  - Interlocking sharp teeth / fangs or serrated mandibles.
  - Dorsal serrations / chitinous spine ridges along body segments.
  - Predatory needle proboscis for specialized threats (airborne/parasites).
- Diverse prey and predator forms:
  - Undulating/serpentine body plans, medusa-like bell spores with trailing tentacles, and winged apex hunters.

### AC-8: Living Environmental Flora, Geological Vents & Canvas Elements
- The biosphere canvas renderer MUST draw animated, swaying procedural flora and geological features tailored to each `TerrainType`:
  - **Murky Swamp:** Floating lily pads, spore flowers, undulating submerged kelp/algae ribbons.
  - **Cloud Canopy:** Layered fern fronds, hanging vines, bioluminescent flowers.
  - **Basalt Crags:** Jagged volcanic columns, smoking thermal vents with rising ember motes.
  - **Glass Desert:** Desert spires, dry scrub, shifting dune ripple lines.
  - **Abyssal Trench:** Hydrothermal chimneys with smoke plumes, swaying sea lilies/stalks.
  - **Crystalline Caverns:** Faceted crystal clusters with specular gleams and glowing cavern lichen.

### AC-9: Rigorous Automated Testing & CI Verification
- Update and extend companion tests in `src/tools/biomorphs/Biomorphs.test.tsx` asserting:
  - Offspring 1 & Offspring 2 card rendering and naming.
  - Placement of Active Biosphere traits above canvas and Next-Gen Mutations below canvas.
  - Button positioning (Select as Champion at top, Launch at bottom right).
  - "How to Play" guide presence.
  - Absence of arrow indicator boxes.
  - Thumbnail zoom-out rendering.
  - Enhanced biosphere canvas rendering of flora/elements without crash.
- Full test suite passes via `./scripts/test.ps1` with >80% coverage and zero diagnostics.

### AC-10: Autonomous Prey Replenishment Floor & Apex Carnivore Devouring
- **Carrying Capacity & Population Floor:**
  - Maintain an autonomous prey carrying capacity (`carryingCapacity: 8`, `minPreyFloor: 4`).
  - When living prey count drops below the floor, flora germinates new bio-spore prey with accelerated intervals (~1.8s, or immediately if depleted) so sustained simulations never run out of food.
  - Natural carrying capacity replenishes every ~3.5s up to 8.
- **Apex Carnivore Predation:**
  - High-fitness apex predators ($\ge 85\%$ fitness, or possessing fangs/serrations) counter-attack and devour hostile native predators upon collision for +35 energy, preventing starvation against native threats.
  - Slain native predators naturally respawn from arena boundaries every ~12s.
  - Excess dead entities beyond 2 are pruned from memory to ensure bounded execution.
  - Clean modular architecture (`carryingCapacity`, `minPreyFloor`, `preyReplenishTimer`) provides a solid foundation for future Lotka-Volterra population oscillation extensions.
