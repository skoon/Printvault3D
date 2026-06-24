import { useState, useCallback } from 'react';
import { LibraryDirectory, PrintModel } from '../types';
import { electronStorage, isElectron } from '../services/electronStorage';

export function useLibrary(
  initialModels: PrintModel[],
  initialDirectories: LibraryDirectory[]
) {
  const [models, setModels] = useState<PrintModel[]>(initialModels);
  const [directories, setDirectories] = useState<LibraryDirectory[]>(initialDirectories);
  const [isScanning, setIsScanning] = useState(false);

  const refresh = useCallback(async () => {
    setIsScanning(true);
    try {
      const newModels = await electronStorage.scanDirectories();
      setModels(newModels);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // In Electron the native picker is used (dirPath ignored). In web mode a
  // server-side absolute path must be supplied. Returns an error string on
  // failure, or null on success.
  const addDirectory = useCallback(async (dirPath?: string): Promise<string | null> => {
    try {
      const dir = isElectron()
        ? await electronStorage.addDirectory()
        : await electronStorage.addDirectory(dirPath);
      if (!dir) return null; // cancelled
      const updated = await electronStorage.listDirectories();
      setDirectories(updated);
      await refresh();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to add directory';
    }
  }, [refresh]);

  const removeDirectory = useCallback(async (id: string) => {
    await electronStorage.removeDirectory(id);
    const updated = await electronStorage.listDirectories();
    setDirectories(updated);
    await refresh();
  }, [refresh]);

  return {
    models,
    setModels,
    directories,
    isScanning,
    addDirectory,
    removeDirectory,
    refresh,
  };
}
