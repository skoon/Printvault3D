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

import { webStorage } from './webStorage';

export const electronStorage = {
  async pickDirectory(): Promise<string | null> {
    if (isElectron()) return window.electronAPI!.pickDirectory();
    return webStorage.pickDirectory();
  },

  async scanDirectory(dirPath: string): Promise<PrintModelData[]> {
    if (isElectron()) return window.electronAPI!.scanDirectory(dirPath);
    return webStorage.scanDirectory(dirPath);
  },

  async saveModels(models: PrintModelData[]): Promise<void> {
    if (isElectron()) return window.electronAPI!.saveModels(models);
    return webStorage.saveModels(models);
  },

  async loadModels(): Promise<PrintModelData[]> {
    if (isElectron()) return window.electronAPI!.loadModels();
    return webStorage.loadModels();
  },

  async saveRootPath(path: string): Promise<void> {
    if (isElectron()) return window.electronAPI!.saveRootPath(path);
    return webStorage.saveRootPath(path);
  },

  async getRootPath(): Promise<string | null> {
    if (isElectron()) return window.electronAPI!.getRootPath();
    return webStorage.getRootPath();
  },

  async saveApiKey(key: string): Promise<void> {
    if (isElectron()) return window.electronAPI!.saveApiKey(key);
    return webStorage.saveApiKey(key);
  },

  async getApiKey(): Promise<string> {
    if (isElectron()) return window.electronAPI!.getApiKey();
    return webStorage.getApiKey();
  },

  async readFile(filePath: string): Promise<ArrayBuffer | null> {
    if (isElectron()) return window.electronAPI!.readFile(filePath);
    return webStorage.readFile(filePath);
  },
};
