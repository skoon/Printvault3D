import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  pickDirectory: () => ipcRenderer.invoke("pick-directory"),
  scanDirectory: (path) => ipcRenderer.invoke("scan-directory", path),
  saveModels: (models) => ipcRenderer.invoke("save-models", models),
  loadModels: () => ipcRenderer.invoke("load-models"),
  saveRootPath: (path) => ipcRenderer.invoke("save-root-path", path),
  getRootPath: () => ipcRenderer.invoke("get-root-path"),
  saveApiKey: (key) => ipcRenderer.invoke("save-api-key", key),
  getApiKey: () => ipcRenderer.invoke("get-api-key")
});
