# Living Feature Specification: Random Picker

## 1. User Story & Overview
As a user of Tools Hub, I want a playful, responsive, visual-first random decision maker utility with multiple interactive modes (Coin Toss, Multi-Dice Roll, and Multiple Choice Picker with Spinning Wheel and Card Draw views) so that I can make fair, entertaining decisions quickly on mobile or desktop without any external bloat or ads.

---

## 2. Acceptance Criteria

### Mode 1: Coin Toss
1. **Interactive Flip Animation**: Clicking "Flip Coin" (or pressing Enter/Space) triggers an authentic 3D tumbling flip animation.
2. **Outcome Accuracy**: Flips are randomly distributed 50/50 between Heads and Tails using cryptographic/uniform random generation (`crypto.getRandomValues` or `Math.random`).
3. **Statistics Tracking**: Tracks Total Flips, Heads count, Tails count, Heads/Tails percentages, and active consecutive streak (e.g., "3 Heads in a row").
4. **Stats Reset**: Provides a "Reset Stats" button that resets all coin flip counters.

### Mode 2: Dice Roll
1. **Configurable Dice Quantity**: Allows selecting between 1 and 6 six-sided dice.
2. **Authentic Pip Visualization**: Renders authentic 6-sided dice faces with clean high-contrast pips (dots 1 to 6) rather than mere numbers.
3. **Roll Animation & Sum**: Clicking "Roll Dice" triggers a tumbling animation, displays each individual die outcome, and computes the sum total prominently.
4. **Roll History**: Records recent rolls with individual dice values and totals, with an option to clear history.

### Mode 3: Multiple Choice Picker
1. **Dual Presentation Views**: Provides a toggle between:
   - **Spinning Wheel View**: High-contrast wheel with colorful segments, pointer indicator, smooth deceleration spin physics, and accurate landing on the chosen slice.
   - **Card / Instant Draw View**: Mystery shuffle card flip animation revealing the selected choice.
2. **Custom Choices Management**: Users can input custom choices via textarea or comma-delimited list.
3. **Quick Presets**: Offers built-in presets:
   - *"Yes / No / Maybe"*
   - *"What to Eat"* (Pizza, Sushi, Tacos, Burgers, Pasta, Salad)
   - *"Who Goes First"* (Player 1, Player 2, Player 3, Player 4)
   - *"Numbers 1–10"*
4. **Elimination Mode (Raffle / No Repeats)**:
   - Optional toggle: "Eliminate picked option".
   - When enabled, winning option is removed from the active pool and added to an eliminated list.
   - Shows remaining count and provides a "Reset Pool" button to restore all original options.
5. **Celebration Effect**: Triggers a canvas-based confetti particle burst on selection.
6. **Pick History**: Logs recent picks with an option to clear.

### Architecture & UI/UX Standards
1. **Zero Audio Dependencies**: Pure visual animations and particle effects; no external sound files or synthesized audio.
2. **Color Palette & Theme**: Strictly follows Tools Hub dark theme standard (`#0f172a`, `#1e293b`, `#334155`, `#38bdf8` cyan accents, `#f1f5f9` text).
3. **Hub Navigation**: Includes an accessible "Back to Tools Hub" button that invokes `onBack()`.
4. **Accessibility**: High-contrast text (>4.5:1 ratio), keyboard navigable controls, full ARIA labels.
5. **Zero Backend**: Completely client-side static bundle compatible with Cloudflare Workers Assets.
6. **Testing & Parity**: Comprehensive companion automated tests in `src/tools/picker/ChoicePicker.test.tsx` verifying all modes, presets, elimination logic, and edge cases (>80% coverage).
