
import React from 'react';
import { PrintModel } from '../types';
import TagBadge from './TagBadge';

interface ModelCardProps {
  model: PrintModel;
  onTagClick: (tag: string) => void;
  onSelect: (model: PrintModel) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onTagClick, onSelect }) => {
  const is3mf = model.extension.toLowerCase() === '.3mf';

  return (
    <div 
      onClick={() => onSelect(model)}
      className="group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
    >
      <div className="aspect-square bg-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Placeholder Icon */}
        <div className={`transition-transform duration-500 group-hover:scale-110 ${is3mf ? 'text-emerald-500' : 'text-indigo-500'}`}>
          <svg className="w-20 h-20 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
        </div>
        
        {/* Extension Badge */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${is3mf ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
          {model.extension.replace('.', '')}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold truncate text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors" title={model.name}>
          {model.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {model.directoryTags.map(tag => (
            <TagBadge 
              key={tag} 
              label={tag} 
              type="directory" 
              onClick={() => onTagClick(tag)} 
            />
          ))}
          {model.tags.slice(0, 3).map(tag => (
            <TagBadge 
              key={tag} 
              label={tag} 
              onClick={() => onTagClick(tag)} 
            />
          ))}
          {model.tags.length > 3 && (
            <span className="text-[10px] text-slate-500 flex items-center ml-1">
              +{model.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 mono">
          <span>{(model.size / 1024 / 1024).toFixed(2)} MB</span>
          <span>{new Date(model.lastModified).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
