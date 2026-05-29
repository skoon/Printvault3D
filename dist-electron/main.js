import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
const DEFAULT_STATE = {
  models: [],
  rootPath: null,
  apiKey: ""
};
class Storage {
  constructor() {
    this.statePath = path.join(app.getPath("userData"), "state.json");
    this.state = { ...DEFAULT_STATE };
  }
  async init() {
    try {
      const data = await fs.readFile(this.statePath, "utf-8");
      this.state = JSON.parse(data);
    } catch {
      await this.save();
    }
  }
  async save() {
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), "utf-8");
  }
  async saveModels(models) {
    this.state.models = models;
    await this.save();
  }
  async loadModels() {
    return this.state.models;
  }
  async saveRootPath(dirPath) {
    this.state.rootPath = dirPath;
    await this.save();
  }
  async getRootPath() {
    return this.state.rootPath;
  }
  async saveApiKey(key) {
    this.state.apiKey = key;
    await this.save();
  }
  async getApiKey() {
    return this.state.apiKey;
  }
}
const storage = new Storage();
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const isDev = !app.isPackaged;
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
}
app.whenReady().then(() => {
  storage.init();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.handle("pick-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
ipcMain.handle("scan-directory", async (_event, dirPath) => {
  const ALLOWED_EXTENSIONS = [".stl", ".obj", ".3mf"];
  const models = [];
  async function walk(dir, currentPath = "", dirTags = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          const stat = await fs.stat(fullPath);
          models.push({
            id: crypto.randomUUID(),
            name: entry.name,
            path: `${currentPath}/${entry.name}`,
            extension: ext,
            size: stat.size,
            lastModified: stat.mtimeMs,
            tags: [],
            directoryTags: dirTags
          });
        }
      } else if (entry.isDirectory()) {
        await walk(fullPath, `${currentPath}/${entry.name}`, [...dirTags, entry.name]);
      }
    }
  }
  await walk(dirPath);
  return models;
});
ipcMain.handle("save-models", async (_event, models) => {
  return storage.saveModels(models);
});
ipcMain.handle("load-models", async () => {
  return storage.loadModels();
});
ipcMain.handle("save-root-path", async (_event, dirPath) => {
  return storage.saveRootPath(dirPath);
});
ipcMain.handle("get-root-path", async () => {
  return storage.getRootPath();
});
ipcMain.handle("save-api-key", async (_event, key) => {
  return storage.saveApiKey(key);
});
ipcMain.handle("get-api-key", async () => {
  return storage.getApiKey();
});
ipcMain.handle("read-file", async (_event, filePath) => {
  const buffer = await fs.readFile(filePath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});
