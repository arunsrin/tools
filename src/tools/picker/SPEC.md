# Random Picker - Tool Specification

## Overview
A playful, responsive, visual-first random decision maker utility with three interactive modes: Coin Toss, Multi-Dice Roll, and Multiple Choice Picker (Spinning Wheel & Card Draw).

## Features
- **Coin Toss**: 3D flip animation, Heads/Tails outcome, streaks, flip statistics (Heads/Tails counts and percentages), reset stats.
- **Dice Roll**: 1 to 6 six-sided dice with classic dot pips, tumbling animation, sum calculation, roll history.
- **Multiple Choice Picker**:
  - **Spinning Wheel View**: Smooth deceleration rotation, pointer alignment, slice labels.
  - **Instant Draw / Card Picker**: Card shuffle/flip animation.
  - **Quick Presets**: "Yes / No / Maybe", "What to Eat", "Who Goes First", "Numbers 1-10".
  - **Elimination Mode**: Draw without replacement (raffle mode) with remaining items tracker and pool reset.
  - **Confetti Celebration**: Canvas particle burst on selection.
  - **History**: Pick history with clear button.
- **Visuals Only**: High-contrast animations, zero audio dependencies.
- **Navigation**: High-contrast "Back to Tools Hub" button.

## Architecture
- Client-side static component (`ChoicePicker.tsx`) with zero external runtime dependencies.
- Scoped stylesheet (`ChoicePicker.css`).
- High-contrast dark theme aligned with Tools Hub (`#0f172a`, `#1e293b`, `#38bdf8`).
- Strict TypeScript types, zero `any`.
- Vitest unit tests in `ChoicePicker.test.tsx`.
