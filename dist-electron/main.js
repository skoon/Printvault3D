import { app as l, BrowserWindow as b, ipcMain as n, dialog as P } from "electron";
import d from "path";
import { fileURLToPath as M } from "url";
import p from "fs/promises";
import A from "crypto";
import h from "node:path";
import g from "node:fs/promises";
import _ from "node:crypto";
const D = {
  models: [],
  directories: [],
  apiKey: ""
};
class I {
  constructor() {
    this.statePath = d.join(l.getPath("userData"), "state.json"), this.state = { ...D };
  }
  async init() {
    try {
      const t = await p.readFile(this.statePath, "utf-8");
      this.state = { ...D, ...JSON.parse(t) };
    } catch {
      await this.save();
    }
  }
  async save() {
    await p.writeFile(this.statePath, JSON.stringify(this.state, null, 2), "utf-8");
  }
  async saveModels(t) {
    this.state.models = t, await this.save();
  }
  async loadModels() {
    return this.state.models;
  }
  getDirectories() {
    return this.state.directories;
  }
  getDirectory(t) {
    return this.state.directories.find((e) => e.id === t);
  }
  async addDirectory(t) {
    this.state.directories.some((e) => d.resolve(e.path) === d.resolve(t.path)) || (this.state.directories.push(t), await this.save());
  }
  async removeDirectory(t) {
    this.state.directories = this.state.directories.filter((e) => e.id !== t), this.state.models = this.state.models.filter((e) => e.directoryId !== t), await this.save();
  }
  async saveApiKey(t) {
    this.state.apiKey = t, await this.save();
  }
  async getApiKey() {
    return this.state.apiKey;
  }
}
const r = new I(), U = [".stl", ".obj", ".3mf"];
async function W(a, t) {
  const e = [];
  async function s(i, o = "", m = []) {
    let u;
    try {
      u = await g.readdir(i, { withFileTypes: !0 });
    } catch {
      return;
    }
    for (const c of u) {
      const w = h.join(i, c.name);
      if (c.isFile()) {
        const v = h.extname(c.name).toLowerCase();
        if (U.includes(v)) {
          let y;
          try {
            y = await g.stat(w);
          } catch {
            continue;
          }
          e.push({
            id: _.randomUUID(),
            directoryId: t,
            name: c.name,
            path: `${o}/${c.name}`,
            extension: v,
            size: y.size,
            lastModified: y.mtimeMs,
            tags: [],
            directoryTags: m
          });
        }
      } else c.isDirectory() && await s(w, `${o}/${c.name}`, [...m, c.name]);
    }
  }
  return await s(a), e;
}
async function j(a) {
  const t = [];
  for (const e of a) {
    const s = await W(e.path, e.id);
    t.push(...s);
  }
  return t;
}
function E(a, t) {
  const e = /* @__PURE__ */ new Map();
  for (const s of a || [])
    e.set(`${s.directoryId}::${s.path}`, s);
  return t.map((s) => {
    const i = e.get(`${s.directoryId}::${s.path}`);
    return i ? {
      ...s,
      id: i.id,
      tags: i.tags ?? [],
      description: i.description ?? s.description
    } : s;
  });
}
function F(a, t) {
  const e = String(t).replace(/^[/\\]+/, ""), s = h.resolve(a), i = h.resolve(s, e), o = h.relative(s, i);
  if (o.startsWith("..") || h.isAbsolute(o))
    throw new Error("Path escapes the configured directory");
  return i;
}
const K = M(import.meta.url), L = d.dirname(K), O = !l.isPackaged;
let f = null;
function $() {
  f = new b({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: d.join(L, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), O ? (f.loadURL("http://localhost:3000"), f.webContents.openDevTools()) : f.loadFile(d.join(l.getAppPath(), "dist", "index.html"));
}
l.whenReady().then(async () => {
  await r.init(), $(), l.on("activate", () => {
    b.getAllWindows().length === 0 && $();
  });
});
l.on("window-all-closed", () => {
  process.platform !== "darwin" && l.quit();
});
n.handle("list-directories", async () => r.getDirectories());
n.handle("add-directory", async () => {
  const a = await P.showOpenDialog(f, {
    properties: ["openDirectory"]
  });
  if (a.canceled || a.filePaths.length === 0)
    return null;
  const t = a.filePaths[0], e = {
    id: A.randomUUID(),
    path: t,
    label: d.basename(t) || t
  };
  return await r.addDirectory(e), e;
});
n.handle("remove-directory", async (a, t) => {
  await r.removeDirectory(t);
});
n.handle("scan-directories", async () => {
  const a = await j(r.getDirectories()), t = E(await r.loadModels(), a);
  return await r.saveModels(t), t;
});
n.handle("save-models", async (a, t) => r.saveModels(t));
n.handle("load-models", async () => r.loadModels());
n.handle("save-api-key", async (a, t) => r.saveApiKey(t));
n.handle("get-api-key", async () => r.getApiKey());
n.handle("read-file", async (a, t, e) => {
  const s = r.getDirectory(t);
  if (!s) throw new Error("Unknown directory");
  const i = F(s.path, e), o = await p.readFile(i);
  return o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength);
});
