import { PrintModel } from '../types';

const ALLOWED_EXTENSIONS = ['.stl', '.obj', '.3mf'];

let rootHandle: FileSystemDirectoryHandle | null = null;

const HANDLE_DB = 'PrintVaultHandleDB';
const HANDLE_STORE = 'handles';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function persistRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDB();
  const tx = db.transaction(HANDLE_STORE, 'readwrite');
  tx.objectStore(HANDLE_STORE).put(handle, 'rootHandle');
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function restoreRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE, 'readonly');
    const request = tx.objectStore(HANDLE_STORE).get('rootHandle');
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const handle = request.result;
        if (handle) {
          rootHandle = handle;
        }
        resolve(handle || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearRootHandle(): Promise<void> {
  rootHandle = null;
  const db = await openHandleDB();
  const tx = db.transaction(HANDLE_STORE, 'readwrite');
  tx.objectStore(HANDLE_STORE).delete('rootHandle');
}

export function getRootHandle(): FileSystemDirectoryHandle | null {
  return rootHandle;
}

export function setRootHandle(handle: FileSystemDirectoryHandle | null) {
  rootHandle = handle;
}

export async function pickDirectory(): Promise<string | null> {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    rootHandle = handle;
    await persistRootHandle(handle);
    return handle.name;
  } catch {
    return null;
  }
}

async function walk(dirHandle: FileSystemDirectoryHandle, currentPath: string = '', dirTags: string[] = []): Promise<PrintModel[]> {
  const models: PrintModel[] = [];

  for await (const [name, entry] of dirHandle.entries()) {
    if (entry.kind === 'file') {
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        const file = await (entry as FileSystemFileHandle).getFile();
        models.push({
          id: crypto.randomUUID(),
          name,
          path: `${currentPath}/${name}`,
          extension: ext,
          size: file.size,
          lastModified: file.lastModified,
          tags: [],
          directoryTags: dirTags,
        });
      }
    } else if (entry.kind === 'directory') {
      const subModels = await walk(
        entry as FileSystemDirectoryHandle,
        `${currentPath}/${name}`,
        [...dirTags, name]
      );
      models.push(...subModels);
    }
  }

  return models;
}

export async function scanDirectory(handle: FileSystemDirectoryHandle): Promise<PrintModel[]> {
  return walk(handle);
}

export async function readFile(filePath: string): Promise<ArrayBuffer | null> {
  if (!rootHandle) return null;

  let parts = filePath.split(/[/\\]/).filter(Boolean);

  if (parts[0] === rootHandle.name) {
    parts = parts.slice(1);
  }

  let current: FileSystemDirectoryHandle | FileSystemFileHandle = rootHandle;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === parts.length - 1) {
      current = await (current as FileSystemDirectoryHandle).getFileHandle(part);
    } else {
      current = await (current as FileSystemDirectoryHandle).getDirectoryHandle(part);
    }
  }

  const file = await (current as FileSystemFileHandle).getFile();
  return file.arrayBuffer();
}
