import React, { useState, useEffect } from 'react';
import { LibraryDirectory } from '../types';
import { electronStorage, isElectron } from '../services/electronStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  directories: LibraryDirectory[];
  isScanning: boolean;
  onAddDirectory: (path?: string) => Promise<string | null>;
  onRemoveDirectory: (id: string) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  directories,
  isScanning,
  onAddDirectory,
  onRemoveDirectory,
}) => {
  const electron = isElectron();
  const [apiKey, setApiKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setNewPath('');
      setKeySaved(false);
      electronStorage.getApiKey().then((key) => setApiKey(key === '********' ? '' : key));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    setError(null);
    setBusy(true);
    try {
      // Electron opens a native picker (path arg ignored); web needs a path.
      const err = await onAddDirectory(electron ? undefined : newPath.trim());
      if (err) {
        setError(err);
      } else {
        setNewPath('');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveKey = async () => {
    await electronStorage.saveApiKey(apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Library Directories
            </label>

            <div className="space-y-2 mb-3">
              {directories.length === 0 && (
                <p className="text-xs text-slate-500 italic">No directories added yet.</p>
              )}
              {directories.map((dir) => (
                <div
                  key={dir.id}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{dir.label}</div>
                    <div className="text-[11px] text-slate-500 truncate mono">{dir.path}</div>
                  </div>
                  <button
                    onClick={() => onRemoveDirectory(dir.id)}
                    disabled={busy || isScanning}
                    title="Remove directory"
                    className="shrink-0 p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {electron ? (
              <button
                onClick={handleAdd}
                disabled={busy || isScanning}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm font-medium text-white transition-all"
              >
                {busy ? 'Adding…' : 'Add Directory…'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newPath.trim()) handleAdd(); }}
                  placeholder="/absolute/path/on/server"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
                <button
                  onClick={handleAdd}
                  disabled={busy || isScanning || !newPath.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm font-medium text-white transition-all shrink-0"
                >
                  {busy ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <p className="mt-2 text-xs text-slate-500">
              {electron
                ? 'Pick folders containing your STL, OBJ, and 3MF files.'
                : 'Enter an absolute path on the server (must be mounted/accessible to the container).'}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={electron ? 'Enter your Gemini API key…' : 'Set server-side or enter to override…'}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              <button
                onClick={handleSaveKey}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-all shrink-0"
              >
                {keySaved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {electron
                ? 'Required for AI-powered tag suggestions. Stored locally.'
                : 'In web/Docker mode the key is kept server-side and used to proxy AI requests; it is never sent to the browser.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
