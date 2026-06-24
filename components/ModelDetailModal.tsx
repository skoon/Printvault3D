import React from 'react';
import { PrintModel } from '../types';
import TagBadge from './TagBadge';
import STLViewer from './STLViewer';

interface ModelDetailModalProps {
  model: PrintModel;
  onClose: () => void;
  onGenerateAITags: (modelId: string) => void;
  onRemoveTag: (modelId: string, tag: string) => void;
  onAddTag: (modelId: string, tag: string) => void;
}

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  model,
  onClose,
  onGenerateAITags,
  onRemoveTag,
  onAddTag
}) => {
  const isSTL = model.extension.toLowerCase() === '.stl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${model.extension === '.3mf' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{model.name}</h2>
              <p className="text-xs text-slate-500 mono mt-1">{model.path}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
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
                    <span className="text-slate-200 font-medium uppercase">{model.extension.replace('.', '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size</span>
                    <span className="text-slate-200 font-medium">{(model.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modified</span>
                    <span className="text-slate-200 font-medium">{new Date(model.lastModified).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {model.extension.toLowerCase() === '.stl' && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Drag to rotate • Scroll to zoom • Right-click to pan
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Preview</h3>
              {isSTL ? (
                <div className="h-full min-h-[300px]">
                  <STLViewer key={model.id} directoryId={model.directoryId} filePath={model.path} />
                </div>
              ) : (
                <div className="h-full min-h-[300px] bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-slate-500">3D preview not available for {model.extension.toUpperCase()} files</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <div>
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Suggestions</h3>
               <button 
                onClick={() => onGenerateAITags(model.id)}
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
                {model.directoryTags.map(tag => (
                  <TagBadge key={tag} label={tag} type="directory" />
                ))}
                {model.directoryTags.length === 0 && <span className="text-xs text-slate-600">Root directory (No tags)</span>}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">User & AI Tags</h3>
              <div className="flex flex-wrap gap-2">
                {model.tags.map(tag => (
                  <TagBadge 
                    key={tag} 
                    label={tag} 
                    onRemove={() => onRemoveTag(model.id, tag)}
                  />
                ))}
                <input 
                  type="text"
                  placeholder="Add tag..."
                  className="bg-transparent border border-slate-700 rounded-full px-3 py-0.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 w-24"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !model.tags.includes(val)) {
                        onAddTag(model.id, val);
                        (e.target as HTMLInputElement).value = '';
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
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelDetailModal;
