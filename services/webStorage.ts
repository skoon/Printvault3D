import { PrintModel } from '../types';
import { pickDirectory as fsPick, scanDirectory as fsScan, readFile as fsRead, getRootHandle, restoreRootHandle } from './webFileSystem';

const DB_NAME = 'PrintVaultDB';
const STORE_NAME = 'models';
const META_STORE = 'metadata';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMeta(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(META_STORE, 'readwrite');
  tx.objectStore(META_STORE).put(value, key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getMeta(key: string): Promise<unknown> {
  const db = await openDB();
  const tx = db.transaction(META_STORE, 'readonly');
  const request = tx.objectStore(META_STORE).get(key);
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
  });
}

export async function restoreWebHandle(): Promise<void> {
  await restoreRootHandle();
}

export const webStorage = {
  async pickDirectory(): Promise<string | null> {
    return fsPick();
  },

  async scanDirectory(_dirPath: string): Promise<PrintModel[]> {
    const handle = getRootHandle();
    if (!handle) return [];
    return fsScan(handle);
  },

  async saveModels(models: PrintModel[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const model of models) {
      store.put(model);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async loadModels(): Promise<PrintModel[]> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async saveRootPath(path: string): Promise<void> {
    await saveMeta('rootPath', path);
  },

  async getRootPath(): Promise<string | null> {
    return (await getMeta('rootPath')) as string | null;
  },

  async saveApiKey(key: string): Promise<void> {
    await saveMeta('apiKey', key);
  },

  async getApiKey(): Promise<string> {
    return ((await getMeta('apiKey')) as string) || '';
  },

  async readFile(filePath: string): Promise<ArrayBuffer | null> {
    return fsRead(filePath);
  },
};
