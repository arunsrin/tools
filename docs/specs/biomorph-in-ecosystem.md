# Biomorph in Ecosystem: Autonomous Living Biosphere Simulation - Living Specification

## 1. Overview & Vision
"Biomorph in Ecosystem" extends the "Biomorphs: The Evolutionary Watchmaker" tool into a complete, interactive evolutionary playground. After breeding and adapting alien biomorphs against 150 procedural biospheres in the Breeding Lab, users can launch their organism into a dynamic, 2D living ecosystem canvas.

In the biosphere, the player's biomorph swims, crawls, or flies alongside autonomous prey, rival creatures, and hostile predators tailored to the active terrain, climate, and threat. The creature's survival, speed, resilience, and predation success are directly governed by its deterministic fitness score and anatomical genome. If the creature perishes, an Extinction Debrief analyzes its anatomical shortcomings and invites the user back to the lab to evolve counter-adaptations.

---

## 2. User Journey & Game Loop
1. **Breeding & Preparation:** In the **Breeding Lab**, the user selects and mutates biomorphs against the chosen `(Terrain, Climate, Threat)` combination.
2. **Launch:** The user clicks `🚀 Launch into Biosphere` (or presses `L`) from the specimen card or top dock.
3. **Living Simulation:** The view seamlessly transitions to the **Living Biosphere** stage:
   - A full-width animated HTML5 Canvas 2D ecosystem matching the active environment (water currents, atmospheric smog, spore motes, embers, or blizzard flakes).
   - "Our" organism is prominently highlighted with an ethereal beacon aura and health/energy HUD.
   - Autonomous prey swim passively or graze; predators hunt; rival biomorphs wander.
   - Locomotion, evasion speed, and combat resistance depend on the player's genome and fitness score.
4. **Resolution (Extinction or Dominance):**
   - **Extinction:** If health reaches 0, the creature perishes, opening an Extinction Debrief with evolutionary advice and a 1-click `🔬 Return to Lab to Evolve Defenses` button.
   - **Apex Dominance:** Surpassing survival and predation milestones awards the "Apex Ruler" crown.
5. **Iteration:** The user returns to the Breeding Lab, breeds the necessary counter-traits (more limbs, wings, armor, sensory eyes), and re-launches.

---

## 3. Detailed Acceptance Criteria

### AC-1: Integrated Lab ⇄ Biosphere Mode Navigation
- `/biomorphs` supports two view modes: `'lab'` (Breeding Lab) and `'biosphere'` (Living Ecosystem).
- Both modes render within the `/biomorphs` route without routing disruptions.
- The top header provides an accessible mode switcher `[🧬 Breeding Lab]` ⇄ `[🌍 Living Biosphere]`.
- Candidate specimen cards in the Breeding Lab include a high-contrast `🚀 Launch into Biosphere` button.
- Keyboard shortcut `L` launches the active parent/champion organism into the biosphere.
- Biosphere view provides a prominent `🔬 Back to Breeding Lab` button returning instantly with lineage intact.

### AC-2: Procedural Atmospheric Canvas Stage
- Responsive HTML5 Canvas 2D simulation running at 60 FPS.
- Procedural environmental backdrops reflecting `TerrainType`:
  - **Swamp / Abyss:** Deep murky currents, rising methane bubbles, bioluminescent light motes.
  - **Canopy / Crags:** Ambient wind gusts, floating leaves/dust motes, rock silhouetted plateaus.
  - **Desert / Cavern:** Heat shimmer, sand grains, crystal cavern specular highlights.
- Atmospheric overlay tint reflecting `ClimateType`:
  - **Acidic:** Caustic yellow-green hazy fog.
  - **Geothermal:** Warm volcanic embers & rising heat waves.
  - **Frost:** Drifting crystalline blizzard particulates.
  - **Oxygen:** Vibrant energetic motes.
  - **Darkness:** Murky vignette with creature bioluminescence illumination.

### AC-3: Multi-Agent Population & Roles
- **Player Organism:** Rendered from the player's actual `BiomorphGenome` at scaled dimensions (~60–80px), illuminated with a celestial highlight beacon, orientation pointer, and HUD tracker.
- **Prey Critters (6–12 agents):** Small, passive, schooling bio-spores and micro-critters that flee when approached and restore +15 energy when consumed.
- **Predators (2–4 agents):** Threat-specific procedural hunters (Apex Stalkers, Airborne Swarms, Parasites) that stalk and strike vulnerable organisms.
- **Rival Biomorphs (3–6 agents):** Diverse procedural biomorphs co-existing with varying levels of fitness.

### AC-4: Locomotion & Steering Behaviors
- Continuous 2D autonomous steering: wander, seek prey, flee predator, soft boundary containment.
- Procedural locomotion animation: segmented bodies articulate and undulate along velocity vectors, limbs stride/kick, wings flap, and cranial apparatus siphons.
- Organic orientation: biomorphs rotate smoothly toward their heading.

### AC-5: Deterministic Fitness-to-Survival Mechanics
- Organism speed, stamina, and combat outcomes are directly calculated from `calculateFitness(genome, ecosystem)`:
  - **Max Speed & Acceleration:** Base speed $\times (0.6 + 0.8 \times \text{fitness})$, with bonuses from leg count and wings.
  - **Energy Metabolism:** Energy drains steadily over time. Harsh climates (acid, frost, geothermal) increase metabolic drain unless mitigated by high fitness and protective body segments.
  - **Combat & Predator Interactions:**
    - If Player Fitness $\ge$ Threat Threshold: Player intimidates predator, taking minimal damage (-5) and knocking back the predator.
    - If Player Fitness $<$ Threat Threshold: Predator strikes, inflicting heavy damage (-25) and brief stun.

### AC-6: Extinction & Evolutionary Debrief
- When player energy/health reaches 0, the organism dissolves with a particle burst and the simulation pauses.
- An **Extinction Debrief** modal displays:
  - Survival time and prey consumed.
  - Precise cause of death (e.g. *"Overwhelmed by Apex Stalkers in Acidic Smog"*).
  - Diagnostic evolutionary analysis citing unadapted traits (e.g. *"Lacked sufficient appendages or wings to escape pursuit; body armor was insufficient against caustic atmosphere"*).
  - Quick action buttons: `🔬 Return to Lab to Adapt`, `🔄 Respawn in Biome`, `🎲 Randomize Ecosystem`.

### AC-7: Apex Dominance Milestone
- When an organism with $\ge 90\%$ fitness survives $\ge 60$ seconds or consumes 5 prey while repelling threats, it triggers the **Apex Dominance** celebration:
  - Golden crown icon and radiant particle flare.
  - Dynamic status ticker: *"🏆 Apex Dominance Achieved: Biosphere Mastered!"*.

### AC-8: Telemetry, HUD & Controls
- Top HUD Bar: Ecosystem biome lore badge, mode switcher, and Return to Lab button.
- Player Vitals: High-contrast Energy / Health bar with real-time numeric value and fitness badge.
- Dynamic Action Ticker: Real-time scrolling event log (e.g. *"Consumed bio-spore (+15 energy)"*, *"Evaded stalker ambush"*).
- Controls Bar:
  - Play / Pause (Spacebar).
  - Speed toggles: `1x`, `2x`, `3x`.
  - Respawn Organism.
  - Add Prey / Add Predator buttons for interactive experimentation.

### AC-9: Zero Bloat, Performance & Comprehensive Test Suite
- Pure HTML5 Canvas 2D, zero heavy external physics or sprite libraries.
- Proper `requestAnimationFrame` lifecycle and clean unmount teardown.
- Companion automated tests covering:
  - Mode switching between Lab and Biosphere.
  - Player launch with active genome and ecosystem.
  - Agent population generation and initial state.
  - Collision detection, feeding, and predator damage.
  - Energy drain and Extinction Debrief modal display.
  - Apex Dominance trigger.
  - Keyboard shortcuts (`L`, `Space`, `R`).
- All tests passing with >80% code coverage.
