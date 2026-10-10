import { IndianRupee, BookOpen, X, ArrowRight, Bell } from 'lucide-react';
import { RealtimeAlertItem } from '../types';

interface RealtimeNotificationToastProps {
  alert: RealtimeAlertItem | null;
  onView: (emailId: string) => void;
  onDismiss: () => void;
}

export default function RealtimeNotificationToast({
  alert,
  onView,
  onDismiss,
}: RealtimeNotificationToastProps) {
  if (!alert) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-full bg-white rounded-xl border border-slate-200 shadow-2xl p-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 rounded-lg shrink-0 ${
            alert.category === 'brand_query'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          {alert.category === 'brand_query' ? (
            <IndianRupee className="w-5 h-5" />
          ) : (
            <BookOpen className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {alert.category === 'brand_query' ? 'New Brand Query Received' : 'New Newsletter Edition'}
            </span>
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">{alert.sender}</h4>
            {alert.budget && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                {alert.budget}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 mb-2.5">{alert.title}</p>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onDismiss}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onView(alert.emailId);
                onDismiss();
              }}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition"
            >
              <span>View Query</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
