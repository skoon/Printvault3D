import { app as n, BrowserWindow as v, ipcMain as a, dialog as _ } from "electron";
import r from "path";
import { fileURLToPath as A } from "url";
import h from "fs/promises";
const D = {
  models: [],
  rootPath: null,
  apiKey: ""
};
class b {
  constructor() {
    this.statePath = r.join(n.getPath("userData"), "state.json"), this.state = { ...D };
  }
  async init() {
    try {
      const t = await h.readFile(this.statePath, "utf-8");
      this.state = JSON.parse(t);
    } catch {
      await this.save();
    }
  }
  async save() {
    await h.writeFile(this.statePath, JSON.stringify(this.state, null, 2), "utf-8");
  }
  async saveModels(t) {
    this.state.models = t, await this.save();
  }
  async loadModels() {
    return this.state.models;
  }
  async saveRootPath(t) {
    this.state.rootPath = t, await this.save();
  }
  async getRootPath() {
    return this.state.rootPath;
  }
  async saveApiKey(t) {
    this.state.apiKey = t, await this.save();
  }
  async getApiKey() {
    return this.state.apiKey;
  }
}
const i = new b(), j = A(import.meta.url), F = r.dirname(j), K = !n.isPackaged;
let l = null;
function g() {
  l = new v({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: r.join(F, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), K ? (l.loadURL("http://localhost:3000"), l.webContents.openDevTools()) : l.loadFile(r.join(n.getAppPath(), "dist", "index.html"));
}
n.whenReady().then(() => {
  i.init(), g(), n.on("activate", () => {
    v.getAllWindows().length === 0 && g();
  });
});
n.on("window-all-closed", () => {
  process.platform !== "darwin" && n.quit();
});
a.handle("pick-directory", async () => {
  const e = await _.showOpenDialog(l, {
    properties: ["openDirectory"]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
});
a.handle("scan-directory", async (e, t) => {
  const o = [".stl", ".obj", ".3mf"], c = [];
  async function d(y, f = "", p = []) {
    const P = await h.readdir(y, { withFileTypes: !0 });
    for (const s of P) {
      const m = r.join(y, s.name);
      if (s.isFile()) {
        const u = r.extname(s.name).toLowerCase();
        if (o.includes(u)) {
          const w = await h.stat(m);
          c.push({
            id: crypto.randomUUID(),
            name: s.name,
            path: `${f}/${s.name}`,
            extension: u,
            size: w.size,
            lastModified: w.mtimeMs,
            tags: [],
            directoryTags: p
          });
        }
      } else s.isDirectory() && await d(m, `${f}/${s.name}`, [...p, s.name]);
    }
  }
  return await d(t), c;
});
a.handle("save-models", async (e, t) => i.saveModels(t));
a.handle("load-models", async () => i.loadModels());
a.handle("save-root-path", async (e, t) => i.saveRootPath(t));
a.handle("get-root-path", async () => i.getRootPath());
a.handle("save-api-key", async (e, t) => i.saveApiKey(t));
a.handle("get-api-key", async () => i.getApiKey());
a.handle("read-file", async (e, t) => {
  const o = await h.readFile(t);
  return o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength);
});
