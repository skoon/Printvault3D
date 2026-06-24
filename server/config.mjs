// JSON-file persistence for the web server (directories, models, apiKey).
// Analogous to electron/storage.ts but for the standalone/Docker deployment.
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const DATA_DIR = process.env.PVAULT_DATA_DIR
  ? path.resolve(process.env.PVAULT_DATA_DIR)
  : path.resolve(process.cwd(), 'data');

const STATE_PATH = path.join(DATA_DIR, 'state.json');

const DEFAULT_STATE = {
  directories: [],
  models: [],
  apiKey: '',
};

let state = { ...DEFAULT_STATE };

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Load state from disk and seed any directories declared in PVAULT_LIBRARIES
 * (comma-separated absolute paths) that aren't already present. This lets a
 * Docker volume mount register itself automatically on first boot.
 */
export async function initConfig() {
  try {
    const data = await fs.readFile(STATE_PATH, 'utf-8');
    state = { ...DEFAULT_STATE, ...JSON.parse(data) };
  } catch {
    state = { ...DEFAULT_STATE };
  }

  const seed = (process.env.PVAULT_LIBRARIES || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  let changed = false;
  for (const dirPath of seed) {
    const abs = path.resolve(dirPath);
    if (!state.directories.some((d) => path.resolve(d.path) === abs)) {
      state.directories.push({
        id: crypto.randomUUID(),
        path: abs,
        label: path.basename(abs) || abs,
      });
      changed = true;
    }
  }

  if (!state.apiKey && process.env.GEMINI_API_KEY) {
    // Env key is read at request time too; do not persist it to disk.
  }

  await persist();
}

export function getDirectories() {
  return state.directories;
}

export function getDirectory(id) {
  return state.directories.find((d) => d.id === id) || null;
}

export async function addDirectory(dirPath, label) {
  const abs = path.resolve(dirPath);
  const stat = await fs.stat(abs); // throws if missing
  if (!stat.isDirectory()) {
    throw new Error('Not a directory');
  }
  const existing = state.directories.find((d) => path.resolve(d.path) === abs);
  if (existing) return existing;
  const dir = {
    id: crypto.randomUUID(),
    path: abs,
    label: label || path.basename(abs) || abs,
  };
  state.directories.push(dir);
  await persist();
  return dir;
}

export async function removeDirectory(id) {
  state.directories = state.directories.filter((d) => d.id !== id);
  state.models = state.models.filter((m) => m.directoryId !== id);
  await persist();
}

export function getModels() {
  return state.models;
}

export async function saveModels(models) {
  state.models = models;
  await persist();
}

export function getApiKey() {
  return state.apiKey || process.env.GEMINI_API_KEY || '';
}

export async function saveApiKey(key) {
  state.apiKey = key;
  await persist();
}
