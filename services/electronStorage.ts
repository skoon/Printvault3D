export interface ElectronAPI {
  pickDirectory: () => Promise<string | null>;
  scanDirectory: (path: string) => Promise<PrintModelData[]>;
  saveModels: (models: PrintModelData[]) => Promise<void>;
  loadModels: () => Promise<PrintModelData[]>;
  saveRootPath: (path: string) => Promise<void>;
  getRootPath: () => Promise<string | null>;
  saveApiKey: (key: string) => Promise<void>;
  getApiKey: () => Promise<string>;
  readFile: (filePath: string) => Promise<ArrayBuffer>;
}

export interface PrintModelData {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  lastModified: number;
  tags: string[];
  directoryTags: string[];
  description?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;

export const electronStorage = {
  async pickDirectory(): Promise<string | null> {
    if (!isElectron()) return null;
    return window.electronAPI!.pickDirectory();
  },

  async scanDirectory(dirPath: string): Promise<PrintModelData[]> {
    if (!isElectron()) return [];
    return window.electronAPI!.scanDirectory(dirPath);
  },

  async saveModels(models: PrintModelData[]): Promise<void> {
    if (!isElectron()) return;
    return window.electronAPI!.saveModels(models);
  },

  async loadModels(): Promise<PrintModelData[]> {
    if (!isElectron()) return [];
    return window.electronAPI!.loadModels();
  },

  async saveRootPath(path: string): Promise<void> {
    if (!isElectron()) return;
    return window.electronAPI!.saveRootPath(path);
  },

  async getRootPath(): Promise<string | null> {
    if (!isElectron()) return null;
    return window.electronAPI!.getRootPath();
  },

  async saveApiKey(key: string): Promise<void> {
    if (!isElectron()) return;
    return window.electronAPI!.saveApiKey(key);
  },

  async getApiKey(): Promise<string> {
    if (!isElectron()) return '';
    return window.electronAPI!.getApiKey();
  },

  async readFile(filePath: string): Promise<ArrayBuffer | null> {
    if (!isElectron()) return null;
    return window.electronAPI!.readFile(filePath);
  },
};
