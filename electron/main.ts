import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { storage } from './storage';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  storage.init();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Pick directory
ipcMain.handle('pick-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// IPC: Scan directory
ipcMain.handle('scan-directory', async (_event, dirPath: string) => {
  const ALLOWED_EXTENSIONS = ['.stl', '.obj', '.3mf'];
  const models: Array<{
    id: string;
    name: string;
    path: string;
    extension: string;
    size: number;
    lastModified: number;
    tags: string[];
    directoryTags: string[];
    description?: string;
  }> = [];

  async function walk(dir: string, currentPath: string = '', dirTags: string[] = []) {
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
            directoryTags: dirTags,
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

// IPC: Save models
ipcMain.handle('save-models', async (_event, models) => {
  return storage.saveModels(models);
});

// IPC: Load models
ipcMain.handle('load-models', async () => {
  return storage.loadModels();
});

// IPC: Save root path
ipcMain.handle('save-root-path', async (_event, dirPath: string) => {
  return storage.saveRootPath(dirPath);
});

// IPC: Get root path
ipcMain.handle('get-root-path', async () => {
  return storage.getRootPath();
});

// IPC: Save API key
ipcMain.handle('save-api-key', async (_event, key: string) => {
  return storage.saveApiKey(key);
});

// IPC: Get API key
ipcMain.handle('get-api-key', async () => {
  return storage.getApiKey();
});
