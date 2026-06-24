import React from 'react';
import TagBadge from './TagBadge';

interface SidebarProps {
  directoryCount: number;
  modelsLength: number;
  filteredModelsLength: number;
  allTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  directoryCount,
  modelsLength,
  filteredModelsLength,
  allTags,
  activeTags,
  onToggleTag,
  onOpenSettings
}) => {
  return (
    <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col backdrop-blur-xl shrink-0 h-full">
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
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all text-sm font-medium mb-8"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {directoryCount > 0 ? `Manage Directories (${directoryCount})` : 'Add Directory'}
        </button>

        <div className="mb-6 flex flex-col min-h-0 relative h-[calc(100vh-250px)]">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 shrink-0">Tags</h2>
          <div className="flex flex-wrap gap-1 overflow-y-auto pr-2 custom-scrollbar content-start">
            {allTags.length > 0 ? (
              allTags.map(tag => (
                <TagBadge 
                  key={tag} 
                  label={tag} 
                  active={activeTags.includes(tag)}
                  onClick={() => onToggleTag(tag)}
                />
              ))
            ) : (
              <p className="text-xs text-slate-600 italic">No tags discovered yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/80 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400 mono">
          <span>Total: {modelsLength}</span>
          <span>{filteredModelsLength} shown</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
