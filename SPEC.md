# Tools Hub - Master Specification

A centralized static hub for hosting multiple small, self-contained tools.

## 1. Functional Requirements
- **Centralized Navigation**: A main "Tools Hub" page that lists all available tools.
- **Tool Isolation**: Each tool operates independently but follows the hub's UI/UX standards.
- **Routing/View Switching**: Seamless navigation between the hub and individual tools using a centralized state-based switcher.
- **Scalability**: New tools can be added by creating a new module in `src/tools/`.

## 2. UI/UX Requirements
- **Clean Dashboard**: A minimalist, card-based layout for the hub.
- **Consistent Branding**: A unified aesthetic across all tools.
- **Back to Hub**: Every tool MUST have a clear way to return to the main Tools Hub page.
- **Responsive Hub**: The dashboard works perfectly on mobile and desktop.

## 3. Technical Constraints
- **Self-Contained Static Output**: Deployed to Cloudflare Workers using Workers Assets.
- **Technology Stack**: React (TypeScript) + Vite.
- **No Backend**: Completely client-side.
- **License**: GPLv3.

## 4. Current Tools
1. **[Big Text](./src/tools/big/SPEC.md)**: A high-visibility full-screen text display.
