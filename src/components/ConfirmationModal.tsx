import { AlertTriangle, Send, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: 'delete' | 'send_email';
  title: string;
  description: string;
  details?: { label: string; value: string }[];
  confirmText?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  type,
  title,
  description,
  details,
  confirmText,
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const isDelete = type === 'delete';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDelete ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              {isDelete ? <Trash2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={confirmLoading}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{description}</p>

          {details && details.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
              {details.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-500 shrink-0">{item.label}:</span>
                  <span className="text-slate-800 font-medium truncate text-right">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {isDelete && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>This email will be moved to the Trash in your connected Gmail mailbox.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/80 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold cursor-pointer transition shadow-xs disabled:opacity-50 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            <span>
              {confirmText || (isDelete ? 'Confirm Delete' : 'Confirm & Send Email')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
