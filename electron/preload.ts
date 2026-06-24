import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  listDirectories: () => ipcRenderer.invoke('list-directories'),
  addDirectory: () => ipcRenderer.invoke('add-directory'),
  removeDirectory: (id: string) => ipcRenderer.invoke('remove-directory', id),
  scanDirectories: () => ipcRenderer.invoke('scan-directories'),
  saveModels: (models: any) => ipcRenderer.invoke('save-models', models),
  loadModels: () => ipcRenderer.invoke('load-models'),
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  readFile: (dirId: string, relPath: string) => ipcRenderer.invoke('read-file', dirId, relPath),
});
