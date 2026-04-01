# Big Text

A simple, visually appealing, self-contained static website that displays large text filling the whole screen. Useful for showing short messages or ordering in noisy environments.

## 🚀 Features
- **Dynamic Font Sizing**: Text automatically scales to fill the entire viewport.
- **Minimalist Design**: Zero distractions in "Displaying" mode.
- **Persistence**: Remembers your last entered text.
- **Fully Static**: No backend, fast, and secure.

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Local Development
To start the development server with Hot Module Replacement (HMR):
```bash
npm install
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Building for Production
To generate the production-ready static files in the `dist/` directory:
```bash
npm run build
```

## ☁️ Deployment (Cloudflare Pages)

This project is optimized for [Cloudflare Pages](https://pages.cloudflare.com/).

### Option 1: Git Integration (Recommended)
1. Push this repository to GitHub or GitLab.
2. Connect your repository in the Cloudflare Pages dashboard.
3. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### Option 2: Manual Deployment (Wrangler)
If you have the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-setup/) installed:
```bash
npx wrangler pages deploy dist
```

## 📖 Project Structure
- `SPEC.md`: The source of truth for requirements and design.
- `src/App.tsx`: Core application logic and dynamic sizing calculation.
- `src/App.css`: Minimalist, high-contrast styling.
- `dist/`: Static output folder (generated after `npm run build`).

## ⚖️ Specification
This project follows a **Spec-Driven Development** (SDD) approach. Please refer to [SPEC.md](./SPEC.md) for detailed functional and technical requirements.
