// PrintVault3D web server. Serves the built front-end and exposes a REST API
// that mirrors the Electron IPC surface, so the same React app runs unchanged
// against either backend. Plain Node ESM — no build step, no native deps.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  initConfig,
  getDirectories,
  getDirectory,
  addDirectory,
  removeDirectory,
  getModels,
  saveModels,
  getApiKey,
  saveApiKey,
} from './config.mjs';
import { scanDirectories, mergeModels, resolveWithinRoot } from '../shared/fileScan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || process.env.PVAULT_PORT || 8787);

const CONTENT_TYPES = {
  '.stl': 'model/stl',
  '.obj': 'model/obj',
  '.3mf': 'model/3mf',
};

const app = express();
app.use(express.json({ limit: '50mb' }));

const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  });
};

// --- Directories ---
app.get('/api/directories', wrap(async (_req, res) => {
  res.json(getDirectories());
}));

app.post('/api/directories', wrap(async (req, res) => {
  const { path: dirPath, label } = req.body || {};
  if (!dirPath || typeof dirPath !== 'string') {
    return res.status(400).json({ error: 'A directory path is required' });
  }
  try {
    const dir = await addDirectory(dirPath, label);
    res.json(dir);
  } catch (err) {
    res.status(400).json({ error: `Cannot add directory: ${err.message}` });
  }
}));

app.delete('/api/directories/:id', wrap(async (req, res) => {
  await removeDirectory(req.params.id);
  res.json({ ok: true });
}));

// --- Scan ---
app.post('/api/scan', wrap(async (_req, res) => {
  const scanned = await scanDirectories(getDirectories());
  const merged = mergeModels(getModels(), scanned);
  await saveModels(merged);
  res.json(merged);
}));

// --- Models ---
app.get('/api/models', wrap(async (_req, res) => {
  res.json(getModels());
}));

app.post('/api/models', wrap(async (req, res) => {
  const models = Array.isArray(req.body) ? req.body : req.body?.models;
  if (!Array.isArray(models)) {
    return res.status(400).json({ error: 'models array required' });
  }
  await saveModels(models);
  res.json({ ok: true });
}));

// --- File streaming (with path-traversal guard) ---
app.get('/api/file', wrap(async (req, res) => {
  const { dir: dirId, path: relPath } = req.query;
  const dir = getDirectory(String(dirId || ''));
  if (!dir) return res.status(404).json({ error: 'Unknown directory' });

  let abs;
  try {
    abs = resolveWithinRoot(dir.path, String(relPath || ''));
  } catch {
    return res.status(403).json({ error: 'Forbidden path' });
  }
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File not found' });

  const ext = path.extname(abs).toLowerCase();
  res.type(CONTENT_TYPES[ext] || 'application/octet-stream');
  fs.createReadStream(abs).pipe(res);
}));

// --- Config / API key ---
app.get('/api/config', wrap(async (_req, res) => {
  // Never return the key itself to the browser — only whether one is set.
  res.json({ hasApiKey: !!getApiKey() });
}));

app.post('/api/config/api-key', wrap(async (req, res) => {
  await saveApiKey(String(req.body?.apiKey || ''));
  res.json({ ok: true });
}));

// --- Gemini AI proxy (key stays server-side) ---
app.post('/api/ai/tags', wrap(async (req, res) => {
  const fileName = String(req.body?.fileName || '');
  const apiKey = getApiKey();
  if (!apiKey) return res.json({ tags: [] });

  const { GoogleGenAI, Type } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the file name "${fileName}", suggest 3-5 short, relevant tags for 3D printing categorization. Output only as a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    });
    const text = response.text;
    res.json({ tags: text ? JSON.parse(text) : [] });
  } catch (err) {
    console.error('AI tag error:', err.message);
    res.json({ tags: [] });
  }
}));

// --- Static front-end (SPA fallback) ---
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  console.warn(`[printvault] dist/ not found at ${DIST}. Run "npm run web:build" first.`);
}

await initConfig();
app.listen(PORT, () => {
  console.log(`PrintVault3D server listening on http://localhost:${PORT}`);
  console.log(`Configured libraries: ${getDirectories().length}`);
});
