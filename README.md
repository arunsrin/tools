# Tools Hub

A centralized static hub for hosting multiple small, self-contained utilities. Built with React 19, TypeScript, and Vite, and optimized for deployment on Cloudflare Workers using Workers Assets.

**Live Site:** [https://tools.arunsr.in](https://tools.arunsr.in)  
**Author:** Authored by [Arun](https://www.arunsr.in) · Co-authored by LLM  
**Repository:** [GitHub](https://github.com/arunsrin/tools)  

---

## 🚀 Featured Tools

- **[Big Text](./src/tools/big/SPEC.md)**: A high-visibility full-screen text display. Scale text to fill your entire screen for use in noisy environments, presentations, or at a distance.
- **[Timezone Converter](./src/tools/timezone/SPEC.md)**: A visual 3-day world clock, overlapping working hours analyzer, and meeting planner with time scrubber and clipboard export.
- **[Random Picker](./src/tools/picker/SPEC.md)**: A playful decision maker with 3D coin toss, multi-dice roll, customizable spinning wheel, and raffle picker.
- **[Cute Pomo](./src/tools/pomo/SPEC.md)**: A playful Pomodoro and focus timer featuring Sprouting Tomato Buddy, synthesized Web Audio chimes, and cycle tracking.
- **[Desktop Pals](./src/tools/pals/SPEC.md)**: An interactive canvas companion toy with physics playgrounds, obstacles, toys & treats (Pip the Penguin, Barnaby the Pup, Sprout the Sprite).

---

## 🎨 Theme & Easter Eggs

- **Cyan Color Harmony (Dark Theme by Default):** Inspired by [arunsr.in](https://www.arunsr.in), featuring a deep slate/navy palette (`#0f172a` / `#1e293b`) with vibrant cyan and sky-blue accents (`#38bdf8`).
- **Interactive Chessboard Watermark:** A subtle SVG 8×8 corner watermark fading gracefully into the screen. Click the knight (♞) for famous quotes on chess, art, and strategy from Marcel Duchamp, Garry Kasparov, Savielly Tartakower, and more.
- **Hidden ASCII Banner:** Curious developers inspecting page source will discover a hidden ASCII Owl of Athena and philosophical greeting.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Local Development
To start the development server:
```bash
npm install
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Building & Testing

- **Strict Test Pipeline:**
  ```bash
  ./scripts/test.ps1    # PowerShell (Windows)
  ./scripts/test.sh     # Bash (Linux / macOS / WSL)
  ```
- **Individual Commands:**
  - `npm test`: Run Vitest tests
  - `npm run coverage`: Run Vitest with v8 coverage
  - `npm run build`: Production build (outputs to `dist/`)
  - `npm run lint`: ESLint static analysis

---

## ☁️ Deployment (Cloudflare Workers Assets)

This project is designed to be hosted as a static-only Worker using **Cloudflare Workers Assets**.

1. Ensure your `wrangler.json` is configured correctly (points to `./dist`).
2. Deploy using:
   ```bash
   npm run build && npx wrangler deploy
   ```

---

## 📖 Project Structure

- `SPEC.md`: Master specification for the hub.
- `src/App.tsx`: Central hub dashboard and view switcher.
- `src/components/`: Shared UI components (ThemeToggle, ChessWatermark).
- `src/theme/`: ThemeContext and localStorage persistence hooks.
- `src/tools/`: Directory containing individual modular tools:
  - `src/tools/big/`: The Big Text tool module.
  - `src/tools/timezone/`: The Timezone Converter tool module.
  - `src/tools/picker/`: The Random Picker and Decision Maker tool module.
  - `src/tools/pomo/`: The Cute Pomo / Focus Timer tool module.
  - `src/tools/pals/`: The Desktop Pals interactive companion sandbox tool module.
- `docs/specs/`: Feature specifications authored during autonomous sprints.
- `scripts/`: Local verification, CI parity, and sprint lifecycle automation.

---

## ⚖️ License

GPLv3 - See [LICENSE](./LICENSE) for details.
