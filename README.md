# ⚡ Live Code Sandbox

Self-hosted Sandpack-based code editor with an interactive preview, template system, infinite loop protection, and manual preview recovery.

## Features

- **Self-hosted Sandpack** — fully local code editor + bundler, no external Sandpack CDN dependency
- **Custom bundler** — built from `codesandbox/sandpack-bundler` with pre-fetched dependency manifests (react, react-dom, etc.)
- **Template system** — load sandbox templates from `files/*`; `hello-world` is included in the repo as a default example
- **Multi-domain isolation** — editor and preview iframe can be served from separate domains, so an infinite loop in the preview never freezes the main window
- **Crash protection** — heartbeat-based iframe watchdog detects frozen previews (infinite loops, crashes) and shows a recovery overlay
- **Manual controls** — Restart Preview, Hide/Show Preview, Reset editor data
- **Error overlays** — compile errors and preview crashes shown as in-app overlays
- **Auto-reload** — changes recompile automatically with immediate preview updates

## Getting Started

```bash
git clone --recurse-submodules <repo-url>
cd livecoding
npm install
```

### Template files

`files/hello-world/` is included in the repo as a default example.

Add more templates by creating folders under `files/`. Each template is converted into `public/sandpack-files-*.json` by `npm run build:files`.

### Start development server

```bash
npm run dev
```

### Full build

```bash
npm run build
npm run preview
```

### Environment

Copy `.env.example` to `.env` for deployment-specific settings:

```bash
VITE_BUNDLER_ORIGIN_MATCH=your-editor-domain.example
VITE_BUNDLER_URL=https://your-preview-domain.example/bundler/index.html
```

When both variables are set and the current origin matches `VITE_BUNDLER_ORIGIN_MATCH`, the app loads the Sandpack bundler from `VITE_BUNDLER_URL`. Local development keeps using the built-in localhost/IPv6 split automatically.

### Deployment domains

Deploy the editor app and the Sandpack bundler preview on two different domains or subdomains:

- `your-editor-domain.example` serves the main React app
- `your-preview-domain.example` serves `/bundler/index.html` and `/bundler-api/*`

This separation is important. Preview code runs inside an iframe, but if the iframe uses the same origin as the editor, a user snippet like `while (true) {}` can still block the main browser window. Serving the preview from a different origin isolates that work, so the editor stays responsive and the watchdog can show the crash overlay or restart the iframe.

## Project Structure

```
├── build-bundler.mjs          # Builds sandpack-bundler + pre-fetches deps
├── build-files.mjs            # Generates sandpack file bundles from templates
├── files/
│   └── hello-world/           # Default template (included in repo as example)
├── public/
│   ├── bundler/               # Built bundler (gitignored, regenerated)
│   └── bundler-api/           # Dependency manifests (gitignored, pre-fetched)
├── src/
│   ├── App.tsx                # Root layout with SandpackProvider
│   ├── App.css                # All styles (dark theme, overlays, responsive)
│   ├── components/
│   │   ├── Header.tsx         # Top bar: Restart, Hide Preview, Reset
│   │   ├── PreviewBrokenOverlay.tsx
│   │   ├── PreviewStatusOverlay.tsx
│   │   ├── PreviewOverlay.tsx
│   │   ├── ResizableLayout.tsx
│   │   └── SandpackRuntimeSync.tsx
│   └── sandpack/
│       ├── useSandpackWatchdog.tsx  # Heartbeat-based crash detection
│       ├── previewIframe.ts        # Iframe management helpers
│       ├── dependencies.ts         # Dependency resolution
│       ├── bundlerUrl.ts           # Bundler URL configuration
│       ├── storage.ts              # Cache management
│       └── useSandpackData.ts      # Template data loading
└── vite.config.ts            # Vite config with bundler API proxy
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build all (files + bundler + app) |
| `npm run build:files` | Build template files only |
| `npm run build:bundler` | Build sandpack-bundler + pre-fetch deps |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## How the Watchdog Works

1. The bundler `index.html` sends a `livecoding-preview-heartbeat` `postMessage` every 500ms
2. `useSandpackWatchdog` listens for heartbeats and resets a timer on each one
3. If no heartbeat arrives before the watchdog timeout, the iframe is removed and a "Preview crashed" overlay is shown
4. Click **Restart Preview** to create a fresh iframe
