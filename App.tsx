
import React, { useState, useEffect, useMemo } from 'react';
import { PrintModel, ViewMode } from './types';
import { electronStorage } from './services/electronStorage';
import { suggestTags } from './services/geminiService';
import { useLibrary } from './hooks/useLibrary';
import ModelCard from './components/ModelCard';
import Sidebar from './components/Sidebar';
import SearchHeader from './components/SearchHeader';
import ModelDetailModal from './components/ModelDetailModal';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [initialModels, setInitialModels] = useState<PrintModel[]>([]);
  const [initialRootPath, setInitialRootPath] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const savedModels = await electronStorage.loadModels();
      const savedRootPath = await electronStorage.getRootPath();
      if (savedModels) setInitialModels(savedModels);
      if (savedRootPath) setInitialRootPath(savedRootPath);
      setInitialLoadDone(true);
    };
    init();
  }, []);

  if (!initialLoadDone) {
    return null;
  }

  return <AppContent initialModels={initialModels} initialRootPath={initialRootPath} />;
};

const AppContent: React.FC<{ initialModels: PrintModel[], initialRootPath: string | null }> = ({ initialModels, initialRootPath }) => {
  const {
    models,
    setModels,
    rootPath,
    isScanning,
    handlePickDirectory,
    scanDirectory
  } = useLibrary(initialModels, initialRootPath);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<PrintModel | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      await electronStorage.saveModels(updatedModels);
      if (selectedModel?.id === modelId) {
        setSelectedModel(prev => prev ? { ...prev, tags: Array.from(new Set([...prev.tags, ...suggested])) } : null);
      }
    }
  };

  const removeTag = async (modelId: string, tag: string) => {
    if (!selectedModel) return;
    const updated = { ...selectedModel, tags: selectedModel.tags.filter(t => t !== tag) };
    setSelectedModel(updated);
    const updatedModels = models.map(m => m.id === modelId ? updated : m);
    setModels(updatedModels);
    await electronStorage.saveModels(updatedModels);
  };

  const addTag = async (modelId: string, tag: string) => {
    if (!selectedModel) return;
    const updated = { ...selectedModel, tags: [...selectedModel.tags, tag] };
    setSelectedModel(updated);
    const updatedModels = models.map(m => m.id === modelId ? updated : m);
    setModels(updatedModels);
    await electronStorage.saveModels(updatedModels);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar 
        rootPath={rootPath}
        modelsLength={models.length}
        filteredModelsLength={filteredModels.length}
        allTags={allTags}
        activeTags={activeTags}
        onToggleTag={toggleTag}
        onPickDirectory={handlePickDirectory}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <SearchHeader 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          rootPath={rootPath}
          isScanning={isScanning}
          onRefresh={() => rootPath && scanDirectory(rootPath)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!rootPath && (
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

          {rootPath && filteredModels.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400">No models found matching your criteria.</p>
            </div>
          )}

          {rootPath && filteredModels.length > 0 && (
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

      {selectedModel && (
        <ModelDetailModal 
          model={selectedModel}
          rootPath={rootPath}
          onClose={() => setSelectedModel(null)}
          onGenerateAITags={generateAITags}
          onRemoveTag={removeTag}
          onAddTag={addTag}
        />
      )}

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
