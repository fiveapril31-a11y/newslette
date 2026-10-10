import { useState, type MouseEvent, type DragEvent } from 'react';
import {
  GripVertical,
  Star,
  IndianRupee,
  BookOpen,
  UserCheck,
  Mail,
  MailOpen,
  Trash2,
  FolderInput,
  Tag as TagIcon,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { EmailItem, EmailCategory, FolderItem, SmartTag } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface EmailListProps {
  emails: EmailItem[];
  selectedEmailId: string | null;
  onSelectEmail: (email: EmailItem) => void;
  onToggleStar: (emailId: string, e?: MouseEvent) => void;
  onToggleRead: (emailId: string, e?: MouseEvent) => void;
  onDeleteEmail: (emailId: string, e?: MouseEvent) => void;
  onSeparatePersonal: (emailId: string, e?: MouseEvent) => void;
  activeCategoryFilter: 'all' | EmailCategory | 'high_value' | 'unread' | 'starred';
  onCategoryFilterChange: (filter: 'all' | EmailCategory | 'high_value' | 'unread' | 'starred') => void;
  folders: FolderItem[];
  smartTags: SmartTag[];
  onBatchMove: (emailIds: string[], targetFolderId: string) => void;
  onBatchTag: (emailIds: string[], tagName: string) => void;
  onBatchDelete: (emailIds: string[]) => void;
  onBatchMarkRead: (emailIds: string[], read: boolean) => void;
  viewTitle: string;
  onOpenSmartAnalysis?: () => void;
  onOpenInboundGateway?: () => void;
}

export default function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
  onToggleStar,
  onToggleRead,
  onDeleteEmail,
  onSeparatePersonal,
  activeCategoryFilter,
  onCategoryFilterChange,
  folders,
  smartTags,
  onBatchMove,
  onBatchTag,
  onBatchDelete,
  onBatchMarkRead,
  viewTitle,
  onOpenSmartAnalysis,
  onOpenInboundGateway,
}: EmailListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFolderBatchMenu, setShowFolderBatchMenu] = useState(false);
  const [showTagBatchMenu, setShowTagBatchMenu] = useState(false);
  const [draggedEmailId, setDraggedEmailId] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<'batch' | string | null>(null);

  // Filter emails according to secondary category filter tabs
  const filteredEmails = emails.filter((email) => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'brand_query') return email.category === 'brand_query';
    if (activeCategoryFilter === 'newsletter') return email.category === 'newsletter';
    if (activeCategoryFilter === 'personal') return email.category === 'personal';
    if (activeCategoryFilter === 'unread') return !email.read;
    if (activeCategoryFilter === 'starred') return email.starred;
    if (activeCategoryFilter === 'high_value') {
      if (!email.brandMeta?.budgetOffer) return false;
      const num = parseInt(email.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num >= 50000;
    }
    return true;
  });

  const allSelected = filteredEmails.length > 0 && selectedIds.length === filteredEmails.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmails.map((e) => e.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDragStart = (e: DragEvent, emailId: string) => {
    e.dataTransfer.setData('text/plain', emailId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEmailId(emailId);
  };

  const handleDragEnd = () => {
    setDraggedEmailId(null);
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white border-r border-slate-200 min-w-0 overflow-hidden">
      {/* Top Filter and View Header */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 truncate">{viewTitle}</h2>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-100">
              {filteredEmails.length} {filteredEmails.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
            <button
              id="filter-tab-all"
              onClick={() => onCategoryFilterChange('all')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              id="filter-tab-brands"
              onClick={() => onCategoryFilterChange('brand_query')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                activeCategoryFilter === 'brand_query'
                  ? 'bg-emerald-700 text-white'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70'
              }`}
            >
              <IndianRupee className="w-3 h-3" />
              <span>Brand / Customer Queries</span>
            </button>
            <button
              id="filter-tab-newsletters"
              onClick={() => onCategoryFilterChange('newsletter')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                activeCategoryFilter === 'newsletter'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Newsletters</span>
            </button>
            <button
              id="filter-tab-highvalue"
              onClick={() => onCategoryFilterChange('high_value')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                activeCategoryFilter === 'high_value'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100/70'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>₹50k+ Deals</span>
            </button>
            <button
              id="filter-tab-starred"
              onClick={() => onCategoryFilterChange('starred')}
              className={`p-1 rounded-md transition cursor-pointer ${
                activeCategoryFilter === 'starred' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-amber-500'
              }`}
              title="Starred only"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
            </button>

            {onOpenSmartAnalysis && (
              <button
                type="button"
                id="btn-list-export-csv"
                onClick={onOpenSmartAnalysis}
                title="Export separate CSV / Excel spreadsheets for Brand Queries and Newsletters"
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                <span>Export CSVs</span>
              </button>
            )}
          </div>
        </div>

        {/* Inbound Gateway Quick Action Banner for support@akaar.com */}
        {onOpenInboundGateway && (
          <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Inbound Active: <strong className="text-emerald-900 font-mono">service@akaarentertainment.com</strong>
              </span>
            </div>
            <button
              onClick={onOpenInboundGateway}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 cursor-pointer ml-2"
            >
              Receive Query Free →
            </button>
          </div>
        )}

        {/* Batch Action Bar (Appears when 1 or more items are selected) */}
        {selectedIds.length > 0 ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-semibold">{selectedIds.length} selected</span>
            </div>

            <div className="flex items-center gap-1.5 relative">
              {/* Batch Move to Folder */}
              <div className="relative">
                <button
                  onClick={() => setShowFolderBatchMenu(!showFolderBatchMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                  <span>Move to</span>
                </button>

                {showFolderBatchMenu && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 block">
                      Target Folder
                    </span>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onBatchMove(selectedIds, f.id);
                          setSelectedIds([]);
                          setShowFolderBatchMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between"
                      >
                        <span>{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Assign Tag */}
              <div className="relative">
                <button
                  onClick={() => setShowTagBatchMenu(!showTagBatchMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Tag</span>
                </button>

                {showTagBatchMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 block">
                      Assign Smart Tag
                    </span>
                    {smartTags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onBatchTag(selectedIds, t.name);
                          setSelectedIds([]);
                          setShowTagBatchMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Mark Read */}
              <button
                onClick={() => {
                  onBatchMarkRead(selectedIds, true);
                  setSelectedIds([]);
                }}
                className="p-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                title="Mark as Read"
              >
                <MailOpen className="w-3.5 h-3.5" />
              </button>

              {/* Batch Delete */}
              <button
                onClick={() => setDeleteConfirmTarget('batch')}
                className="p-1 rounded bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 cursor-pointer"
                title="Delete Selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                title="Select all items in view"
              />
              <span>Select all</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Drag email handle onto folders in sidebar
            </span>
          </div>
        )}
      </div>

      {/* Email List Scrollable Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredEmails.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-700">No emails match this filter</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Try adjusting your search criteria, switching category tabs, or click "All Mail" to see everything.
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const isChecked = selectedIds.includes(email.id);
            const isBeingDragged = draggedEmailId === email.id;

            return (
              <div
                key={email.id}
                id={`email-item-${email.id}`}
                onClick={() => onSelectEmail(email)}
                draggable
                onDragStart={(e) => handleDragStart(e, email.id)}
                onDragEnd={handleDragEnd}
                className={`group relative p-3 sm:p-3.5 transition cursor-pointer select-none flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-50/70 border-l-4 border-indigo-600 pl-2 sm:pl-2.5'
                    : !email.read
                    ? 'bg-slate-50/50 hover:bg-slate-100/70'
                    : 'bg-white hover:bg-slate-50'
                } ${isBeingDragged ? 'opacity-40 scale-[0.99]' : ''}`}
              >
                {/* Drag Handle */}
                <div
                  className="pt-1 text-slate-300 group-hover:text-slate-500 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition"
                  title="Drag and drop this email into any folder in the sidebar"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Checkbox */}
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (selectedIds.includes(email.id)) {
                        setSelectedIds(selectedIds.filter((item) => item !== email.id));
                      } else {
                        setSelectedIds([...selectedIds, email.id]);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Star Button */}
                <button
                  onClick={(e) => onToggleStar(email.id, e)}
                  className={`pt-1 transition cursor-pointer ${
                    email.starred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'
                  }`}
                  title={email.starred ? 'Starred' : 'Not starred'}
                >
                  <Star className={`w-3.5 h-3.5 ${email.starred ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Main Content Info */}
                <div className="flex-1 min-w-0">
                  {/* Sender & Timestamp & Category Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      {!email.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-200 shrink-0" title="New / Unread" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          !email.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {email.senderName}
                      </span>

                      {/* Corporate Inbound support@akaar.com badge */}
                      {(email.recipientEmail === 'support@akaar.com' || email.tags?.includes('support@akaar.com')) && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-300/80 shrink-0" title="Delivered directly to support@akaar.com">
                          <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                          <span>support@akaar.com</span>
                        </span>
                      )}

                      {/* Category Label Pill */}
                      {email.category === 'brand_query' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          <IndianRupee className="w-2.5 h-2.5" />
                          <span>Brand Query</span>
                          {email.brandMeta?.budgetOffer && (
                            <span className="ml-0.5 text-emerald-950 font-extrabold bg-emerald-200/80 px-1 py-0.2 rounded">
                              {email.brandMeta.budgetOffer}
                            </span>
                          )}
                          {email.brandMeta?.serviceOpted && (
                            <span className="ml-0.5 text-indigo-900 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded font-medium">
                              {email.brandMeta.serviceOpted}
                            </span>
                          )}
                        </span>
                      )}

                      {email.category === 'newsletter' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 shrink-0">
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>Newsletter</span>
                          {email.newsletterMeta?.readTimeMinutes && (
                            <span className="text-indigo-900">
                              • {email.newsletterMeta.readTimeMinutes}m
                            </span>
                          )}
                        </span>
                      )}

                      {email.category === 'personal' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-700 shrink-0">
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Personal</span>
                        </span>
                      )}

                      {email.priority === 'urgent' && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase tracking-tight shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                      {formatTimestamp(email.receivedAt)}
                    </span>
                  </div>

                  {/* Subject Line */}
                  <h3
                    className={`text-xs mb-1 truncate ${
                      !email.read ? 'font-bold text-slate-900' : 'font-normal text-slate-800'
                    }`}
                  >
                    {email.subject}
                  </h3>

                  {/* Preview Snippet */}
                  <p className="text-xs text-slate-500 line-clamp-1 mb-1.5 leading-relaxed">
                    {email.preview}
                  </p>

                  {/* Bottom Tags Row & Quick Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1 max-w-[80%]">
                      {email.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Quick Action Icons on Hover */}
                    <div
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* One-click isolate/separate personal correspondence */}
                      {email.category === 'personal' && email.folderId !== 'personal_vault' && (
                        <button
                          onClick={(e) => onSeparatePersonal(email.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Isolate into Personal Vault (Cleans your work inbox)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => onToggleRead(email.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                        title={email.read ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        {email.read ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmTarget(email.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation modal for delete actions */}
      <ConfirmationModal
        isOpen={deleteConfirmTarget !== null}
        type="delete"
        title={deleteConfirmTarget === 'batch' ? `Move ${selectedIds.length} Emails to Trash` : 'Move Email to Trash'}
        description={
          deleteConfirmTarget === 'batch'
            ? `Are you sure you want to move all ${selectedIds.length} selected conversations to the Trash?`
            : 'Are you sure you want to move this conversation to the Trash?'
        }
        confirmText="Move to Trash"
        onConfirm={() => {
          if (deleteConfirmTarget === 'batch') {
            onBatchDelete(selectedIds);
            setSelectedIds([]);
          } else if (deleteConfirmTarget) {
            onDeleteEmail(deleteConfirmTarget);
          }
          setDeleteConfirmTarget(null);
        }}
        onCancel={() => setDeleteConfirmTarget(null)}
      />
    </div>
  );
}
