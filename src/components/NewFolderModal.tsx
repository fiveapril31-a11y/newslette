import { useState, type FormEvent } from 'react';
import { X, Folder, Plus } from 'lucide-react';
import { FolderItem } from '../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folder: Omit<FolderItem, 'id' | 'count'>) => void;
}

export default function NewFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
}: NewFolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  if (!isOpen) return null;

  const colorOptions = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#64748b', // Slate
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateFolder({
      name: name.trim(),
      iconName: 'Folder',
      color,
      isCustom: true,
    });

    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Folder className="w-4 h-4 text-indigo-600" />
            <span>Create New Folder</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Folder Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Tech Sponsors, Creator Pitches 2026..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Folder Color
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                    color === c ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
