// Dependency-free scanning logic shared by the Electron main process and the
// Express server. Plain Node ESM so it can be imported without a build step.
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

export const ALLOWED_EXTENSIONS = ['.stl', '.obj', '.3mf'];

/**
 * Recursively walk a single library directory and return a flat list of models.
 * `path` is stored relative to the directory root (leading slash), so the
 * absolute location can later be reconstructed as `directory.path + model.path`.
 *
 * @param {string} rootDir Absolute path of the directory to scan.
 * @param {string} directoryId Stable id of the owning LibraryDirectory.
 */
export async function scanDirectory(rootDir, directoryId) {
  const models = [];

  async function walk(dir, currentPath = '', dirTags = []) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // directory removed or unreadable — skip silently
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          let stat;
          try {
            stat = await fs.stat(fullPath);
          } catch {
            continue;
          }
          models.push({
            id: crypto.randomUUID(),
            directoryId,
            name: entry.name,
            path: `${currentPath}/${entry.name}`,
            extension: ext,
            size: stat.size,
            lastModified: stat.mtimeMs,
            tags: [],
            directoryTags: dirTags,
          });
        }
      } else if (entry.isDirectory()) {
        await walk(fullPath, `${currentPath}/${entry.name}`, [...dirTags, entry.name]);
      }
    }
  }

  await walk(rootDir);
  return models;
}

/**
 * Scan every configured directory and concatenate the results.
 * @param {Array<{id: string, path: string}>} directories
 */
export async function scanDirectories(directories) {
  const all = [];
  for (const dir of directories) {
    const models = await scanDirectory(dir.path, dir.id);
    all.push(...models);
  }
  return all;
}

/**
 * Merge freshly scanned models with the previously stored ones, preserving
 * user-authored `tags` and `description` by matching on directoryId + path.
 * Models whose files no longer exist drop out (they are absent from `scanned`).
 */
export function mergeModels(existing, scanned) {
  const prev = new Map();
  for (const m of existing || []) {
    prev.set(`${m.directoryId}::${m.path}`, m);
  }
  return scanned.map((m) => {
    const match = prev.get(`${m.directoryId}::${m.path}`);
    if (!match) return m;
    return {
      ...m,
      id: match.id,
      tags: match.tags ?? [],
      description: match.description ?? m.description,
    };
  });
}

/**
 * Resolve a relative model path inside a directory root and assert the result
 * stays within that root (path-traversal guard). Returns the absolute path or
 * throws if the path escapes the root.
 */
export function resolveWithinRoot(rootDir, relPath) {
  const cleaned = String(relPath).replace(/^[/\\]+/, '');
  const resolvedRoot = path.resolve(rootDir);
  const resolved = path.resolve(resolvedRoot, cleaned);
  const rel = path.relative(resolvedRoot, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path escapes the configured directory');
  }
  return resolved;
}
