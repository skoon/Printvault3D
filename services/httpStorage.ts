import { LibraryDirectory, PrintModel } from '../types';

// Data source backed by the Express server (standalone / Docker deployment).
// Mirrors the Electron API so the React app is agnostic to which backend runs.

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const httpStorage = {
  async listDirectories(): Promise<LibraryDirectory[]> {
    return json(await fetch('/api/directories'));
  },

  // `dirPath` is required in web mode (no native picker available).
  async addDirectory(dirPath?: string): Promise<LibraryDirectory | null> {
    if (!dirPath) return null;
    return json(
      await fetch('/api/directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath }),
      })
    );
  },

  async removeDirectory(id: string): Promise<void> {
    await json(await fetch(`/api/directories/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  },

  async scanDirectories(): Promise<PrintModel[]> {
    return json(await fetch('/api/scan', { method: 'POST' }));
  },

  async loadModels(): Promise<PrintModel[]> {
    return json(await fetch('/api/models'));
  },

  async saveModels(models: PrintModel[]): Promise<void> {
    await json(
      await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(models),
      })
    );
  },

  // The backend never returns the key to the browser; this is used only to
  // detect whether a key is configured (returns a sentinel, not the value).
  async getApiKey(): Promise<string> {
    const cfg = await json<{ hasApiKey: boolean }>(await fetch('/api/config'));
    return cfg.hasApiKey ? '********' : '';
  },

  async saveApiKey(key: string): Promise<void> {
    await json(
      await fetch('/api/config/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      })
    );
  },

  async readFile(dirId: string, relPath: string): Promise<ArrayBuffer | null> {
    const res = await fetch(
      `/api/file?dir=${encodeURIComponent(dirId)}&path=${encodeURIComponent(relPath)}`
    );
    if (!res.ok) return null;
    return res.arrayBuffer();
  },

  async suggestTags(fileName: string): Promise<string[]> {
    try {
      const res = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      const body = await json<{ tags: string[] }>(res);
      return body.tags || [];
    } catch {
      return [];
    }
  },
};
