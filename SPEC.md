# Tools Hub - Master Specification

A centralized static hub for hosting multiple small, self-contained tools.

## 1. Functional Requirements
- **Centralized Navigation**: A main "Tools Hub" page that lists all available tools.
- **Tool Isolation**: Each tool operates independently but follows the hub's UI/UX standards.
- **Routing/View Switching**: Seamless URL-synchronized routing between the hub and individual tools using the HTML5 History API (e.g. `/big`, `/timezone`, `/picker`, `/pomo`), supporting direct shareable links, browser history navigation (back/forward), and semantic link cards with zero external router bloat.
- **Dark Theme Standard**: Tools Hub and modular tools adopt a high-contrast dark theme by default matching `arunsr.in` (`#0f172a`, `#1e293b`, `#38bdf8`), avoiding unnecessary global theme toggles.
- **Mandatory README Tool Registration**: Whenever a new tool is introduced to `src/tools/`, `README.md` MUST be updated under Featured Tools and Project Structure.
- **Scalability**: New tools can be added by creating a new module in `src/tools/`.

## 2. UI/UX Requirements
- **Clean Dashboard**: A minimalist, card-based layout for the hub.
- **Consistent Cyan Theme**: Harmonized palette matching `arunsr.in` (sky-blue/azure accents in light mode, cyan in dark mode).
- **Subtle Chessboard Watermark**: SVG 8×8 checkered watermark with radial fade mask anchored to the top-right corner, featuring an interactive chess knight easter egg with authentic chess quotes.
- **Back to Hub**: Every tool MUST have a clear way to return to the main Tools Hub page.
- **Responsive Hub**: The dashboard works perfectly on mobile and desktop.
- **Attribution & Transparency**: Prominently displays author attribution ("Authored by Arun · Co-authored by LLM") and links to the GitHub repository and personal website.

## 3. Technical Constraints
- **Self-Contained Static Output**: Deployed to Cloudflare Workers using Workers Assets.
- **Technology Stack**: React (TypeScript) + Vite.
- **No Backend**: Completely client-side.
- **License**: GPLv3.

## 4. Current Tools
1. **[Big Text](./src/tools/big/SPEC.md)**: A high-visibility full-screen text display.
2. **[Timezone Converter](./src/tools/timezone/SPEC.md)**: A visual 3-day world clock, overlapping working hours & meeting planner.
3. **[Random Picker](./src/tools/picker/SPEC.md)**: A playful decision maker with coin toss, multi-dice roll, and spinning wheel / raffle picker.
4. **[Cute Pomo](./src/tools/pomo/SPEC.md)**: A playful Pomodoro and focus timer featuring Sprouting Tomato Buddy, chimes & cycle tracking.
5. **[Biomorphs](./src/tools/biomorphs/SPEC.md)**: Evolutionary Watchmaker artificial selection sandbox guiding morphology of generative alien organisms.
