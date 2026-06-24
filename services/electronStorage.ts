import { LibraryDirectory, PrintModel } from '../types';
import { httpStorage } from './httpStorage';

export interface ElectronAPI {
  listDirectories: () => Promise<LibraryDirectory[]>;
  addDirectory: () => Promise<LibraryDirectory | null>;
  removeDirectory: (id: string) => Promise<void>;
  scanDirectories: () => Promise<PrintModel[]>;
  saveModels: (models: PrintModel[]) => Promise<void>;
  loadModels: () => Promise<PrintModel[]>;
  saveApiKey: (key: string) => Promise<void>;
  getApiKey: () => Promise<string>;
  readFile: (dirId: string, relPath: string) => Promise<ArrayBuffer>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;

export const electronStorage = {
  async listDirectories(): Promise<LibraryDirectory[]> {
    if (isElectron()) return window.electronAPI!.listDirectories();
    return httpStorage.listDirectories();
  },

  // Electron opens a native picker (arg ignored); web requires a path string.
  async addDirectory(dirPath?: string): Promise<LibraryDirectory | null> {
    if (isElectron()) return window.electronAPI!.addDirectory();
    return httpStorage.addDirectory(dirPath);
  },

  async removeDirectory(id: string): Promise<void> {
    if (isElectron()) return window.electronAPI!.removeDirectory(id);
    return httpStorage.removeDirectory(id);
  },

  async scanDirectories(): Promise<PrintModel[]> {
    if (isElectron()) return window.electronAPI!.scanDirectories();
    return httpStorage.scanDirectories();
  },

  async saveModels(models: PrintModel[]): Promise<void> {
    if (isElectron()) return window.electronAPI!.saveModels(models);
    return httpStorage.saveModels(models);
  },

  async loadModels(): Promise<PrintModel[]> {
    if (isElectron()) return window.electronAPI!.loadModels();
    return httpStorage.loadModels();
  },

  async saveApiKey(key: string): Promise<void> {
    if (isElectron()) return window.electronAPI!.saveApiKey(key);
    return httpStorage.saveApiKey(key);
  },

  async getApiKey(): Promise<string> {
    if (isElectron()) return window.electronAPI!.getApiKey();
    return httpStorage.getApiKey();
  },

  async readFile(dirId: string, relPath: string): Promise<ArrayBuffer | null> {
    if (isElectron()) return window.electronAPI!.readFile(dirId, relPath);
    return httpStorage.readFile(dirId, relPath);
  },
};
