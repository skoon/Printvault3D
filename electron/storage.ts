import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

interface PrintModel {
  id: string;
  directoryId: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  lastModified: number;
  tags: string[];
  directoryTags: string[];
  description?: string;
}

interface LibraryDirectory {
  id: string;
  path: string;
  label: string;
}

interface AppState {
  models: PrintModel[];
  directories: LibraryDirectory[];
  apiKey: string;
}

const DEFAULT_STATE: AppState = {
  models: [],
  directories: [],
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
      this.state = { ...DEFAULT_STATE, ...JSON.parse(data) };
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

  getDirectories(): LibraryDirectory[] {
    return this.state.directories;
  }

  getDirectory(id: string): LibraryDirectory | undefined {
    return this.state.directories.find((d) => d.id === id);
  }

  async addDirectory(dir: LibraryDirectory) {
    if (!this.state.directories.some((d) => path.resolve(d.path) === path.resolve(dir.path))) {
      this.state.directories.push(dir);
      await this.save();
    }
  }

  async removeDirectory(id: string) {
    this.state.directories = this.state.directories.filter((d) => d.id !== id);
    this.state.models = this.state.models.filter((m) => m.directoryId !== id);
    await this.save();
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
