# Tools Hub

A centralized static hub for hosting multiple small, self-contained utilities. Built with React, TypeScript, and Vite, and optimized for deployment on Cloudflare Workers.

## 🚀 Featured Tools
- **Big Text**: A high-visibility full-screen text display. Scale text to fill your entire screen for use in noisy environments or at a distance.

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

## 🏗️ Building & Testing
- **Test**: `npm test`
- **Build**: `npm run build` (outputs to `dist/`)
- **Lint**: `npm run lint`

## ☁️ Deployment (Cloudflare Workers Assets)
This project is designed to be hosted as a static-only Worker using **Cloudflare Workers Assets**.

1. Ensure your `wrangler.json` is configured correctly (points to `./dist`).
2. Deploy using:
```bash
npm run build && npx wrangler deploy
```

## 📖 Project Structure
- `SPEC.md`: Master specification for the hub.
- `src/App.tsx`: Hub dashboard and view switcher.
- `src/tools/`: Directory containing individual modular tools.
  - `src/tools/big/`: The Big Text tool module.

## ⚖️ License
GPLv3 - See [LICENSE](./LICENSE) for details.
