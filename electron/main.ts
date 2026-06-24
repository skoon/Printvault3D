import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';
import { storage } from './storage';
import { scanDirectories, mergeModels, resolveWithinRoot } from '../shared/fileScan.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.whenReady().then(async () => {
  await storage.init();
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

// IPC: List configured directories
ipcMain.handle('list-directories', async () => {
  return storage.getDirectories();
});

// IPC: Add a directory (native picker)
ipcMain.handle('add-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const dirPath = result.filePaths[0];
  const dir = {
    id: crypto.randomUUID(),
    path: dirPath,
    label: path.basename(dirPath) || dirPath,
  };
  await storage.addDirectory(dir);
  return dir;
});

// IPC: Remove a directory
ipcMain.handle('remove-directory', async (_event, id: string) => {
  await storage.removeDirectory(id);
});

// IPC: Scan all configured directories (merge to preserve user tags)
ipcMain.handle('scan-directories', async () => {
  const scanned = await scanDirectories(storage.getDirectories());
  const merged = mergeModels(await storage.loadModels(), scanned);
  await storage.saveModels(merged);
  return merged;
});

// IPC: Save models
ipcMain.handle('save-models', async (_event, models) => {
  return storage.saveModels(models);
});

// IPC: Load models
ipcMain.handle('load-models', async () => {
  return storage.loadModels();
});

// IPC: Save API key
ipcMain.handle('save-api-key', async (_event, key: string) => {
  return storage.saveApiKey(key);
});

// IPC: Get API key
ipcMain.handle('get-api-key', async () => {
  return storage.getApiKey();
});

// IPC: Read a model file as ArrayBuffer (resolved within its directory root)
ipcMain.handle('read-file', async (_event, dirId: string, relPath: string) => {
  const dir = storage.getDirectory(dirId);
  if (!dir) throw new Error('Unknown directory');
  const abs = resolveWithinRoot(dir.path, relPath);
  const buffer = await fs.readFile(abs);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});
