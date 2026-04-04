"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  pickDirectory: () => electron.ipcRenderer.invoke("pick-directory"),
  scanDirectory: (path) => electron.ipcRenderer.invoke("scan-directory", path),
  saveModels: (models) => electron.ipcRenderer.invoke("save-models", models),
  loadModels: () => electron.ipcRenderer.invoke("load-models"),
  saveRootPath: (path) => electron.ipcRenderer.invoke("save-root-path", path),
  getRootPath: () => electron.ipcRenderer.invoke("get-root-path"),
  saveApiKey: (key) => electron.ipcRenderer.invoke("save-api-key", key),
  getApiKey: () => electron.ipcRenderer.invoke("get-api-key"),
  readFile: (filePath) => electron.ipcRenderer.invoke("read-file", filePath)
});
