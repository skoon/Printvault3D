
import React from 'react';

interface TagBadgeProps {
  label: string;
  onRemove?: () => void;
  onClick?: () => void;
  type?: 'default' | 'directory' | 'ai';
  active?: boolean;
}

const TagBadge: React.FC<TagBadgeProps> = ({ label, onRemove, onClick, type = 'default', active = false }) => {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer";
  
  const typeStyles = {
    default: active 
      ? "bg-indigo-600 text-white" 
      : "bg-slate-800 text-slate-300 hover:bg-slate-700",
    directory: active
      ? "bg-emerald-600 text-white"
      : "bg-slate-800 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/20",
    ai: active
      ? "bg-purple-600 text-white"
      : "bg-slate-800 text-purple-400 border border-purple-900/50 hover:bg-purple-900/20"
  };

  return (
    <span 
      onClick={onClick}
      className={`${baseStyles} ${typeStyles[type]} mr-1 mb-1`}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1.5 hover:text-white transition-colors"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      )}
    </span>
  );
};

export default TagBadge;
