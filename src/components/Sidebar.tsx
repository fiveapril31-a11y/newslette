import { useState, type DragEvent } from 'react';
import {
  Inbox,
  Briefcase,
  Globe,
  BookOpen,
  UserCheck,
  Archive,
  Trash2,
  Folder,
  Send,
  Plus,
  Tag as TagIcon,
  SlidersHorizontal,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  MessageSquare,
  Upload,
  Mail,
  LayoutDashboard
} from 'lucide-react';
import { FolderItem, SmartTag, InboxFocusMode, EmailCategory } from '../types';

interface SidebarProps {
  folders: FolderItem[];
  activeFolderId: string;
  onSelectFolder: (folderId: string) => void;
  smartTags: SmartTag[];
  activeTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  focusMode: InboxFocusMode;
  onFocusModeChange: (mode: InboxFocusMode) => void;
  folderCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  onDropEmailToFolder: (emailId: string, folderId: string) => void;
  onOpenNewFolderModal: () => void;
  onOpenFilterRules: () => void;
  onOpenSmartAnalysis: () => void;
  onOpenRealtimeChat: () => void;
  onOpenUploadBill: () => void;
  onOpenInboundGateway?: () => void;
  onOpenPublicPortal?: () => void;
  activeWorkspaceView?: 'dashboard' | 'mailbox' | 'billing' | 'chat';
  onWorkspaceViewChange?: (view: 'dashboard' | 'mailbox' | 'billing' | 'chat') => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  personalCount: number;
  newslettersCount: number;
  brandsCount: number;
}

export default function Sidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  smartTags,
  activeTagId,
  onSelectTag,
  focusMode,
  onFocusModeChange,
  folderCounts,
  tagCounts,
  onDropEmailToFolder,
  onOpenNewFolderModal,
  onOpenFilterRules,
  onOpenSmartAnalysis,
  onOpenRealtimeChat,
  onOpenUploadBill,
  onOpenInboundGateway,
  onOpenPublicPortal,
  activeWorkspaceView = 'dashboard',
  onWorkspaceViewChange,
  isOpenMobile,
  onCloseMobile,
  personalCount,
  newslettersCount,
  brandsCount,
}: SidebarProps) {
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Icon resolver for folders
  const renderFolderIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'Inbox':
        return <Inbox className="w-4 h-4 text-blue-600" />;
      case 'Send':
        return <Send className="w-4 h-4 text-purple-600" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'Globe':
        return <Globe className="w-4 h-4 text-cyan-600" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'UserCheck':
        return <UserCheck className="w-4 h-4 text-slate-600" />;
      case 'Archive':
        return <Archive className="w-4 h-4 text-slate-500" />;
      case 'Trash2':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <Folder className="w-4 h-4" style={{ color: color || '#6366f1' }} />;
    }
  };

  const handleDragOver = (e: DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (e: DragEvent, folderId: string) => {
    e.preventDefault();
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null);
    }
  };

  const handleDrop = (e: DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const emailId = e.dataTransfer.getData('text/plain');
    if (emailId) {
      onDropEmailToFolder(emailId, folderId);
    }
  };

  const systemFolders = folders.filter((f) => f.isSystem || !f.isCustom);
  const customFolders = folders.filter((f) => f.isCustom);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Close */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              AE
            </div>
            <span className="font-semibold text-sm text-slate-800">Folders & Tags</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Views Navigation */}
        {onWorkspaceViewChange && (
          <div className="p-3 pb-0">
            <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-1">
              <button
                type="button"
                onClick={() => onWorkspaceViewChange('dashboard')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeWorkspaceView === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onWorkspaceViewChange('mailbox')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeWorkspaceView === 'mailbox'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Studio Mailbox</span>
              </button>

              <button
                type="button"
                onClick={() => onWorkspaceViewChange('billing')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeWorkspaceView === 'billing'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Accounts & Invoices</span>
              </button>

              <button
                type="button"
                onClick={() => onWorkspaceViewChange('chat')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeWorkspaceView === 'chat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Team Studio Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Feature: Personal Email Isolator / Focus Card */}
        <div className="p-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Inbox Focus Mode
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                Smart Separator
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
              Separates brand deals and newsletters from personal correspondence for zero distraction.
            </p>

            <div className="grid grid-cols-1 gap-1">
              <button
                id="sidebar-focus-clean"
                onClick={() => onFocusModeChange('clean_work')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  focusMode === 'clean_work'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Clean Work Inbox
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  focusMode === 'clean_work' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {brandsCount + newslettersCount}
                </span>
              </button>

              <button
                id="sidebar-focus-all"
                onClick={() => onFocusModeChange('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  focusMode === 'all'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  All Inbound (Unfiltered)
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  focusMode === 'all' ? 'bg-violet-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {brandsCount + newslettersCount + personalCount}
                </span>
              </button>

              <button
                id="sidebar-focus-personal"
                onClick={() => onFocusModeChange('personal_only')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  focusMode === 'personal_only'
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-xs'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Personal Vault Only
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  focusMode === 'personal_only' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {personalCount}
                </span>
              </button>
            </div>
          </div>

          {/* INBOUND RECEIVER GATEWAY CARD */}
          <div className="mt-2 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-xl p-3 border border-emerald-500/20 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-300">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                Inbound Receiver
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-tight">
              Ingests emails sent to <strong className="text-emerald-300">service@akaarentertainment.com</strong> from any Gmail.
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              <button
                id="sidebar-inbound-gateway"
                onClick={() => {
                  if (onOpenInboundGateway) onOpenInboundGateway();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition cursor-pointer active:scale-95 shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Receive & Test Free</span>
                </span>
                <span className="text-[10px] bg-emerald-800/90 px-1.5 py-0.2 rounded font-mono">
                  Live
                </span>
              </button>

              {onOpenPublicPortal && (
                <button
                  id="sidebar-public-portal"
                  onClick={() => {
                    onOpenPublicPortal();
                    if (isOpenMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-500/30 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Free Client Portal Link</span>
                  </span>
                  <span className="text-[10px] bg-indigo-700/60 px-1.5 py-0.2 rounded font-mono">
                    Share
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* SMART INTEGRATION & DEVICE SYNC CARD */}
          <div className="mt-2 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-xl p-3 border border-indigo-500/20 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-indigo-300">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                Smart Integration
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                Live
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Separate Brand Queries & Newsletters by Money & Service with instant CSV exports.
            </p>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button
                id="sidebar-smart-analysis"
                onClick={() => {
                  onOpenSmartAnalysis();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer active:scale-95 shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Smart Analysis & CSV
                </span>
                <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.2 rounded font-mono">
                  CSV
                </span>
              </button>

              <button
                id="sidebar-team-chat"
                onClick={() => {
                  onOpenRealtimeChat();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer active:scale-95 shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Live Team Chat & Bills
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sync
                </span>
              </button>

              <button
                id="sidebar-upload-bill"
                onClick={() => {
                  onOpenUploadBill();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  Upload Client Bill
                </span>
                <span className="text-[10px] text-slate-400">Ledger</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Folder & Tags List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {/* Folders Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Folders (Drag to Move)
              </span>
              <button
                id="btn-new-folder"
                onClick={onOpenNewFolderModal}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                title="Create custom folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {systemFolders.map((folder) => {
                const count = folderCounts[folder.id] || 0;
                const isSelected = activeFolderId === folder.id;
                const isDragTarget = dragOverFolderId === folder.id;

                return (
                  <button
                    key={folder.id}
                    id={`folder-item-${folder.id}`}
                    onClick={() => {
                      onSelectFolder(folder.id);
                      onSelectTag(null);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={(e) => handleDragLeave(e, folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
                      isDragTarget
                        ? 'bg-indigo-100 border-2 border-dashed border-indigo-500 text-indigo-900 scale-[1.02]'
                        : isSelected
                        ? 'bg-white border border-slate-200 text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {renderFolderIcon(folder.iconName, folder.color)}
                      <span className="truncate">{folder.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDragTarget ? (
                        <span className="text-[10px] text-indigo-600 font-bold animate-pulse">Drop here</span>
                      ) : count > 0 ? (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                            isSelected ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Folders Sub-list */}
            {customFolders.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 block">
                  Custom Folders
                </span>
                <div className="space-y-0.5">
                  {customFolders.map((folder) => {
                    const count = folderCounts[folder.id] || 0;
                    const isSelected = activeFolderId === folder.id;
                    const isDragTarget = dragOverFolderId === folder.id;

                    return (
                      <button
                        key={folder.id}
                        id={`folder-custom-${folder.id}`}
                        onClick={() => {
                          onSelectFolder(folder.id);
                          onSelectTag(null);
                          if (isOpenMobile) onCloseMobile();
                        }}
                        onDragOver={(e) => handleDragOver(e, folder.id)}
                        onDragLeave={(e) => handleDragLeave(e, folder.id)}
                        onDrop={(e) => handleDrop(e, folder.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer select-none ${
                          isDragTarget
                            ? 'bg-indigo-100 border-2 border-dashed border-indigo-500 text-indigo-900'
                            : isSelected
                            ? 'bg-white border border-slate-200 text-slate-900 font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="w-3.5 h-3.5" style={{ color: folder.color }} />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        {count > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-600 font-semibold">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Smart Tags Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <TagIcon className="w-3 h-3 text-slate-400" />
                Smart Tags
              </span>
              {activeTagId && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                >
                  Reset tag
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 px-1">
              {smartTags.map((tag) => {
                const isSelected = activeTagId === tag.name;
                const count = tagCounts[tag.name] || 0;

                return (
                  <button
                    key={tag.id}
                    id={`tag-filter-${tag.id}`}
                    onClick={() => {
                      onSelectTag(isSelected ? null : tag.name);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : `${tag.bgClass} ${tag.textClass} ${tag.borderClass} hover:opacity-90`
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : tag.color }}
                    />
                    <span>{tag.name}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-bold ml-0.5 ${isSelected ? 'text-indigo-200' : 'opacity-70'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Automation & Filter Rules Link */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <button
            id="sidebar-btn-rules"
            onClick={onOpenFilterRules}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Custom Filter Rules
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-500 font-mono">
              Auto-triage
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
