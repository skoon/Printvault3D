import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

interface PrintModel {
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

interface AppState {
  models: PrintModel[];
  rootPath: string | null;
  apiKey: string;
}

const DEFAULT_STATE: AppState = {
  models: [],
  rootPath: null,
  apiKey: '',
};

class Storage {
  private statePath: string;
  private state: AppState;

  constructor() {
    this.statePath = path.join(app.getPath('userData'), 'state.json');
    this.state = { ...DEFAULT_STATE };
  }

  async init() {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8');
      this.state = JSON.parse(data);
    } catch {
      await this.save();
    }
  }

  private async save() {
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  async saveModels(models: PrintModel[]) {
    this.state.models = models;
    await this.save();
  }

  async loadModels(): Promise<PrintModel[]> {
    return this.state.models;
  }

  async saveRootPath(dirPath: string) {
    this.state.rootPath = dirPath;
    await this.save();
  }

  async getRootPath(): Promise<string | null> {
    return this.state.rootPath;
  }

  async saveApiKey(key: string) {
    this.state.apiKey = key;
    await this.save();
  }

  async getApiKey(): Promise<string> {
    return this.state.apiKey;
  }
}

export const storage = new Storage();
