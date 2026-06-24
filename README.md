# PrintVault3D

A library manager for your 3D-print files (STL / OBJ / 3MF) with folder-based
tagging, Three.js previews, and optional Gemini AI tag suggestions.

It runs three ways from one codebase:

- **Desktop app** (Electron) — scans local folders, native picker.
- **Web app** (Node/Express server) — scans server-side folders, serves over HTTP.
- **Docker container** — the web app, packaged with volume-mounted libraries.

You can manage **multiple scan directories** from the in-app **Settings** dialog
in every mode.

---

## Prerequisites

- Node.js **20+** (`engines` enforces this)

## Desktop app (Electron)

```bash
npm install
npm run electron:dev      # dev (Vite + Electron, hot reload)
npm run build:win         # build a Windows installer into release/
```

In the app, open **Settings → Add Directory** to pick one or more folders.
For AI tags, paste a Gemini API key in Settings (stored locally).

### Windows build troubleshooting

If `vite build` / `electron-builder` fails with an error like
`Cannot find module @rollup/rollup-win32-x64-msvc`, you've hit the
[npm optional-dependency bug](https://github.com/npm/cli/issues/4828). Fix it
with a clean install:

```bash
npm run reinstall         # removes node_modules + package-lock.json, reinstalls
```

The Docker/web route below avoids local build tooling entirely.

## Web app (standalone)

Scans directories on the machine running the server and serves the UI + files
over HTTP.

```bash
npm install
# Seed one or more libraries via env (comma-separated absolute paths):
PVAULT_LIBRARIES="/path/to/models,/path/to/more" npm run web:start
# → http://localhost:8787
```

Add/remove directories at runtime from **Settings** (enter absolute server paths).

Environment variables:

| Variable           | Default        | Purpose                                            |
| ------------------ | -------------- | -------------------------------------------------- |
| `PVAULT_PORT`      | `8787`         | HTTP port                                          |
| `PVAULT_DATA_DIR`  | `./data`       | Where directory list / tags are persisted          |
| `PVAULT_LIBRARIES` | _(none)_       | Comma-separated absolute paths seeded on first boot |
| `GEMINI_API_KEY`   | _(none)_       | Enables AI tag suggestions (proxied server-side)    |

For local development with hot reload, run the API and Vite together:

```bash
npm run server:dev                       # terminal 1 (API on :8787)
VITE_WEB_ONLY=true npm run dev           # terminal 2 (UI on :3000, proxies /api)
```

## Docker

```bash
# Put your models under ./models (or edit the volume in docker-compose.yml)
GEMINI_API_KEY=your-key docker compose up --build
# → http://localhost:8787
```

`docker-compose.yml` mounts `./models` read-only into the container and
auto-registers it via `PVAULT_LIBRARIES`. App state persists in the
`printvault-data` named volume.

---

## How the AI key stays private (web/Docker)

In web/Docker mode the Gemini key lives only on the server. The browser calls
`POST /api/ai/tags`, the server makes the Gemini request, and the key is never
returned to or used by the client. In the Electron desktop app the key is stored
locally and used directly.
