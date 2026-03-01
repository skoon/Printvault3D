
import { PrintModel } from '../types';

const DB_NAME = 'PrintVaultDB';
const STORE_NAME = 'models';
const META_STORE = 'metadata';

export const openDB = (): Promise<IDBDatabase> => {
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
};

export const saveModels = async (models: PrintModel[]): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  // Clear existing
  store.clear();
  
  for (const model of models) {
    // We don't save the handle in IDB directly, just metadata
    const { handle, ...meta } = model;
    store.put(meta);
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const loadModels = async (): Promise<PrintModel[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveRootHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(META_STORE, 'readwrite');
  tx.objectStore(META_STORE).put(handle, 'rootHandle');
};

export const getRootHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const db = await openDB();
  const tx = db.transaction(META_STORE, 'readonly');
  const request = tx.objectStore(META_STORE).get('rootHandle');
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};
