import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  pickDirectory: () => ipcRenderer.invoke('pick-directory'),
  scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
  saveModels: (models: any) => ipcRenderer.invoke('save-models', models),
  loadModels: () => ipcRenderer.invoke('load-models'),
  saveRootPath: (path: string) => ipcRenderer.invoke('save-root-path', path),
  getRootPath: () => ipcRenderer.invoke('get-root-path'),
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
});
