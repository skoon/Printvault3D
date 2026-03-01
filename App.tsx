
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PrintModel, ViewMode, TagFilter } from './types';
import { saveModels, loadModels, saveRootHandle, getRootHandle } from './services/storage';
import { suggestTags } from './services/geminiService';
import ModelCard from './components/ModelCard';
import TagBadge from './components/TagBadge';

const ALLOWED_EXTENSIONS = ['.stl', '.obj', '.3mf'];

const App: React.FC = () => {
  const [models, setModels] = useState<PrintModel[]>([]);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<PrintModel | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  // Load initial state
  useEffect(() => {
    const init = async () => {
      const storedHandle = await getRootHandle();
      const storedModels = await loadModels();
      if (storedHandle) setRootHandle(storedHandle);
      if (storedModels) setModels(storedModels);
    };
    init();
  }, []);

  const handlePickDirectory = async () => {
    try {
      // Fix: Cast window to any to access showDirectoryPicker which might not be in the default TS lib
      const handle = await (window as any).showDirectoryPicker();
      setRootHandle(handle);
      await saveRootHandle(handle);
      await scanDirectory(handle);
    } catch (err) {
      console.error("Directory selection cancelled or failed", err);
    }
  };

  const scanDirectory = async (handle: FileSystemDirectoryHandle) => {
    setIsScanning(true);
    const newModels: PrintModel[] = [];
    
    async function walk(dirHandle: FileSystemDirectoryHandle, currentPath: string = '', dirTags: string[] = []) {
      // Fix: Cast dirHandle to any to handle async iteration if not recognized by current TS config
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file') {
          // Fix: Assert as FileSystemFileHandle to access getFile()
          const fileHandle = entry as FileSystemFileHandle;
          const extension = fileHandle.name.slice(fileHandle.name.lastIndexOf('.')).toLowerCase();
          if (ALLOWED_EXTENSIONS.includes(extension)) {
            const file = await fileHandle.getFile();
            newModels.push({
              id: crypto.randomUUID(),
              name: fileHandle.name,
              path: `${currentPath}/${fileHandle.name}`,
              extension,
              size: file.size,
              lastModified: file.lastModified,
              tags: [],
              directoryTags: dirTags,
              handle: fileHandle
            });
          }
        } else if (entry.kind === 'directory') {
          // Fix: Assert as FileSystemDirectoryHandle to recurse
          const subDirHandle = entry as FileSystemDirectoryHandle;
          await walk(subDirHandle, `${currentPath}/${subDirHandle.name}`, [...dirTags, subDirHandle.name]);
        }
      }
    }

    await walk(handle);
    setModels(newModels);
    await saveModels(newModels);
    setIsScanning(false);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    models.forEach(m => {
      m.tags.forEach(t => tags.add(t));
      m.directoryTags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const modelTags = [...m.tags, ...m.directoryTags];
      const matchesTags = activeTags.length === 0 || activeTags.every(t => modelTags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [models, searchQuery, activeTags]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const generateAITags = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    const suggested = await suggestTags(model.name);
    if (suggested.length > 0) {
      const updatedModels = models.map(m => 
        m.id === modelId ? { ...m, tags: Array.from(new Set([...m.tags, ...suggested])) } : m
      );
      setModels(updatedModels);
      await saveModels(updatedModels);
      // Update selected model view
      if (selectedModel?.id === modelId) {
        setSelectedModel(prev => prev ? { ...prev, tags: Array.from(new Set([...prev.tags, ...suggested])) } : null);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">PrintVault <span className="text-indigo-400">3D</span></h1>
          </div>

          <button 
            onClick={handlePickDirectory}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all text-sm font-medium mb-8"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {rootHandle ? 'Change Directory' : 'Choose Directory'}
          </button>

          <div className="mb-6">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Tags</h2>
            <div className="flex flex-wrap gap-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {allTags.length > 0 ? (
                allTags.map(tag => (
                  <TagBadge 
                    key={tag} 
                    label={tag} 
                    active={activeTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))
              ) : (
                <p className="text-xs text-slate-600 italic">No tags discovered yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mono">
            <span>Total: {models.length}</span>
            <span>{filteredModels.length} shown</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Search */}
        <header className="h-20 bg-slate-950/50 border-b border-slate-800 flex items-center px-8 gap-6 backdrop-blur-md sticky top-0 z-10">
          <div className="flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search prints by name or tag..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => rootHandle && scanDirectory(rootHandle)}
              disabled={isScanning || !rootHandle}
              className={`p-2 rounded-lg transition-all ${isScanning ? 'animate-spin' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="h-6 w-px bg-slate-800 mx-2" />
            <button 
              onClick={() => setViewMode(ViewMode.GRID)}
              className={`p-2 rounded-lg transition-all ${viewMode === ViewMode.GRID ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.LIST)}
              className={`p-2 rounded-lg transition-all ${viewMode === ViewMode.LIST ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!rootHandle && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
                <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-2">Connect Your Library</h2>
              <p className="text-slate-500 max-w-xs mb-8">
                Select a folder containing your STL, OBJ, and 3MF files to start organizing.
              </p>
              <button 
                onClick={handlePickDirectory}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-indigo-600/20"
              >
                Choose Local Folder
              </button>
            </div>
          )}

          {rootHandle && filteredModels.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400">No models found matching your criteria.</p>
            </div>
          )}

          {rootHandle && filteredModels.length > 0 && (
            <div className={`grid gap-6 ${viewMode === ViewMode.GRID ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-1'}`}>
              {filteredModels.map(model => (
                <ModelCard 
                  key={model.id} 
                  model={model} 
                  onTagClick={toggleTag}
                  onSelect={setSelectedModel}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedModel.extension === '.3mf' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                   <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{selectedModel.name}</h2>
                  <p className="text-xs text-slate-500 mono mt-1">{selectedModel.path}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModel(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Properties</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Extension</span>
                        <span className="text-slate-200 font-medium uppercase">{selectedModel.extension.replace('.', '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Size</span>
                        <span className="text-slate-200 font-medium">{(selectedModel.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Modified</span>
                        <span className="text-slate-200 font-medium">{new Date(selectedModel.lastModified).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Suggestions</h3>
                   <button 
                    onClick={() => generateAITags(selectedModel.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg transition-all text-xs font-semibold mb-4"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                     Smart Tag Suggestions
                   </button>
                   <p className="text-[10px] text-slate-500 leading-relaxed italic">
                     Uses Gemini to analyze the filename and suggest categories like "Cosplay", "Tools", or "Decor".
                   </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Directory Source Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.directoryTags.map(tag => (
                      <TagBadge key={tag} label={tag} type="directory" />
                    ))}
                    {selectedModel.directoryTags.length === 0 && <span className="text-xs text-slate-600">Root directory (No tags)</span>}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">User & AI Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.tags.map(tag => (
                      <TagBadge 
                        key={tag} 
                        label={tag} 
                        onRemove={async () => {
                          const updated = { ...selectedModel, tags: selectedModel.tags.filter(t => t !== tag) };
                          setSelectedModel(updated);
                          const updatedModels = models.map(m => m.id === selectedModel.id ? updated : m);
                          setModels(updatedModels);
                          await saveModels(updatedModels);
                        }}
                      />
                    ))}
                    <input 
                      type="text"
                      placeholder="Add tag..."
                      className="bg-transparent border border-slate-700 rounded-full px-3 py-0.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 w-24"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !selectedModel.tags.includes(val)) {
                            const updated = { ...selectedModel, tags: [...selectedModel.tags, val] };
                            setSelectedModel(updated);
                            (e.target as HTMLInputElement).value = '';
                            const updatedModels = models.map(m => m.id === selectedModel.id ? updated : m);
                            setModels(updatedModels);
                            await saveModels(updatedModels);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedModel(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
