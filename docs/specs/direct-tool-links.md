# Feature Specification: Direct Tool Links & URL Routing

## 1. Overview & User Story
**User Story:**
As a user of Tools Hub, I want each individual tool to have its own unique, shareable URL path (e.g., `/big`, `/timezone`, `/picker`, `/pomo`), so that I can send a direct link to a specific tool, refresh or bookmark the page, and navigate between the hub and tools using standard browser Back and Forward buttons.

## 2. Background & Problem Statement
Currently, `src/App.tsx` controls tool navigation purely with local React state (`useState<View>('hub')`). Clicking a tool renders its component, but the browser address bar remains at `/`. Users cannot bookmark or send a direct URL to a specific tool, and browser history buttons do not work.

Cloudflare Workers Assets is configured with `"not_found_handling": "single-page-application"` in `wrangler.json`, which automatically serves `index.html` for client-side routing on arbitrary paths.

## 3. Acceptance Criteria

### 3.1 Clean URL Deep Linking & Path Mapping
- The application synchronizes view state with `window.location.pathname`:
  - Hub: `/` or `/hub`
  - Big Text: `/big`
  - Timezone Converter: `/timezone`
  - Random Picker: `/picker`
  - Cute Pomo: `/pomo`
- Direct navigation to any tool path (e.g. `https://tools.arunsr.in/timezone`) on page load mounts the corresponding tool view immediately.
- Hash fallback tolerance: navigating to `/#/timezone` or `/#pomo` gracefully parses the tool key.

### 3.2 Semantic Hub Cards & Native Link Behavior
- Hub tool cards render as semantic HTML `<a>` anchor elements with `href` pointing to their respective tool paths.
- Default left-click intercepts the event, calls `history.pushState({}, '', path)`, and switches views without a full page reload.
- Modifier clicks (Ctrl+Click, Cmd+Click, Shift+Click, middle click) or right-click "Open in new tab" retain native browser link behavior.
- Hub cards maintain identical high-contrast dark theme styling and keyboard accessibility.

### 3.3 History Traversal & "Back to Hub" Synchronization
- Entering a tool pushes an entry to browser history.
- Clicking the "Back to Tools Hub" button updates the URL to `/` via `history.pushState` and returns to the hub.
- The `popstate` event listener updates the active view when the user uses the browser Back or Forward buttons.
- Cleanup: The `popstate` listener is properly removed on unmount.

### 3.4 Invalid Route Fallback
- Any unrecognized path (e.g. `/nonexistent`, `/foo/bar`) gracefully falls back to the hub view (`'hub'`) and cleans up the address bar to `/` without crashing.

### 3.5 Zero Bloat & Native Web APIs
- Strictly implemented using React 19 hooks (`useState`, `useEffect`, `useCallback`) and standard Web APIs (`window.location`, `window.history`). No external router dependencies added.

### 3.6 Automated Regression Testing (>80% Coverage)
- Companion automated tests in `src/App.test.tsx` verifying:
  - Initial direct mount at `/big`, `/timezone`, `/picker`, `/pomo`.
  - Hash fallback on initial mount (`/#/picker`, `/#timezone`).
  - Clicking a tool card updates `window.location.pathname` and renders the tool.
  - Clicking "Back to Tools Hub" updates `window.location.pathname` back to `/`.
  - Simulating `popstate` events navigates back and forth between tools and hub.
  - Invalid route fallback to hub.
  - Modifier-click bypasses client-side interception.
