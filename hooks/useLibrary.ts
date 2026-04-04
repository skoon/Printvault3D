import { useState, useCallback } from 'react';
import { PrintModel } from '../types';
import { electronStorage } from '../services/electronStorage';

export function useLibrary(initialModels: PrintModel[], initialRootPath: string | null) {
  const [models, setModels] = useState<PrintModel[]>(initialModels);
  const [rootPath, setRootPath] = useState<string | null>(initialRootPath);
  const [isScanning, setIsScanning] = useState(false);

  const scanDirectory = useCallback(async (dirPath: string) => {
    setIsScanning(true);
    const newModels = await electronStorage.scanDirectory(dirPath);
    setModels(newModels);
    await electronStorage.saveModels(newModels);
    setIsScanning(false);
  }, []);

  const handlePickDirectory = useCallback(async () => {
    try {
      const dirPath = await electronStorage.pickDirectory();
      if (!dirPath) return;
      setRootPath(dirPath);
      await electronStorage.saveRootPath(dirPath);
      await scanDirectory(dirPath);
    } catch (err) {
      console.error("Directory selection cancelled or failed", err);
    }
  }, [scanDirectory]);

  return {
    models,
    setModels,
    rootPath,
    setRootPath,
    isScanning,
    handlePickDirectory,
    scanDirectory
  };
}
