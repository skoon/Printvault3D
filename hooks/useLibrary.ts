import { useState, useCallback, useMemo } from 'react';
import { PrintModel } from '../types';
import { saveModels, saveRootHandle } from '../services/storage';

const ALLOWED_EXTENSIONS = ['.stl', '.obj', '.3mf'];

export function useLibrary(initialModels: PrintModel[], initialRootHandle: FileSystemDirectoryHandle | null) {
  const [models, setModels] = useState<PrintModel[]>(initialModels);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(initialRootHandle);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  const scanDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setIsScanning(true);
    const newModels: PrintModel[] = [];
    
    async function walk(dirHandle: FileSystemDirectoryHandle, currentPath: string = '', dirTags: string[] = []) {
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const extension = fileHandle.name.slice(fileHandle.name.lastIndexOf('.')).toLowerCase();
          if (ALLOWED_EXTENSIONS.includes(extension)) {
            const file = await fileHandle.getFile();
            newModels.push({
              id: crypto.randomUUID(),
              name: fileHandle.name,
              path: `${currentPath}/${fileHandle.name}`,
              extension,
              size: file.size,
              lastModified: file.lastModified,
              tags: [],
              directoryTags: dirTags,
              handle: fileHandle
            });
          }
        } else if (entry.kind === 'directory') {
          const subDirHandle = entry as FileSystemDirectoryHandle;
          await walk(subDirHandle, `${currentPath}/${subDirHandle.name}`, [...dirTags, subDirHandle.name]);
        }
      }
    }

    await walk(handle);
    setModels(newModels);
    await saveModels(newModels);
    setIsScanning(false);
  }, []);

  const handlePickDirectory = useCallback(async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setRootHandle(handle);
      await saveRootHandle(handle);
      await scanDirectory(handle);
    } catch (err) {
      console.error("Directory selection cancelled or failed", err);
    }
  }, [scanDirectory]);

  return {
    models,
    setModels,
    rootHandle,
    setRootHandle,
    isScanning,
    scanProgress,
    handlePickDirectory,
    scanDirectory
  };
}
