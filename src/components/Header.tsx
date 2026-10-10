import { useState } from 'react';
import { 
  Search, 
  X, 
  Bell, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Menu,
  IndianRupee,
  BookOpen,
  RefreshCw,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  FileSpreadsheet,
  MessageSquare,
  Upload,
  Globe,
  Mail,
  LayoutDashboard,
  RotateCcw,
  Undo2
} from 'lucide-react';
import { RealtimeAlertItem, InboxFocusMode } from '../types';

interface HeaderProps {
  userEmail: string;
  actualConnectedEmail?: string | null;
  userGooglePhoto?: string | null;
  isConnectedGmail: boolean;
  isSyncingGmail: boolean;
  isAuthenticatingGmail?: boolean;
  onSyncGmail: () => void;
  onLoginGmail: () => void;
  onLogoutGmail: () => void;
  onSwitchAccount: () => void;
  onOpenLoginHelp?: () => void;
  syncError?: string | null;
  onClearSyncError?: () => void;
  onClearDatabaseRecords?: () => void;
  onResetAllToZero?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
  activeWorkspaceView?: 'dashboard' | 'mailbox' | 'billing' | 'chat';
  onWorkspaceViewChange?: (view: 'dashboard' | 'mailbox' | 'billing' | 'chat') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  focusMode: InboxFocusMode;
  onFocusModeChange: (mode: InboxFocusMode) => void;
  alerts: RealtimeAlertItem[];
  onOpenEmail: (emailId: string) => void;
  onClearAlerts: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onSimulateIncoming?: () => void;
  onOpenInboundGateway?: () => void;
  onOpenPublicPortal?: () => void;
  onOpenSmartAnalysis: () => void;
  onOpenRealtimeChat: () => void;
  onOpenUploadBill: () => void;
  onToggleMobileSidebar: () => void;
  brandOffersTotal: number;
  personalCount: number;
  newslettersCount: number;
  brandsCount: number;
  onOpenFilterRules: () => void;
}

export default function Header({
  userEmail,
  actualConnectedEmail,
  userGooglePhoto,
  isConnectedGmail,
  isSyncingGmail,
  isAuthenticatingGmail,
  onSyncGmail,
  onLoginGmail,
  onLogoutGmail,
  onSwitchAccount,
  onOpenLoginHelp,
  syncError,
  onClearSyncError,
  onClearDatabaseRecords,
  onResetAllToZero,
  onUndo,
  canUndo,
  undoCount,
  activeWorkspaceView = 'dashboard',
  onWorkspaceViewChange,
  searchQuery,
  onSearchChange,
  focusMode,
  onFocusModeChange,
  alerts,
  onOpenEmail,
  onClearAlerts,
  soundEnabled,
  onToggleSound,
  onSimulateIncoming,
  onOpenInboundGateway,
  onOpenPublicPortal,
  onOpenSmartAnalysis,
  onOpenRealtimeChat,
  onOpenUploadBill,
  onToggleMobileSidebar,
  brandOffersTotal,
  personalCount,
  newslettersCount,
  brandsCount,
  onOpenFilterRules,
}: HeaderProps) {
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [showSearchTips, setShowSearchTips] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const unreadAlerts = alerts.filter((a) => !a.read);
  const isTargetAccount = actualConnectedEmail?.toLowerCase() === userEmail.toLowerCase();
  const isDifferentAccount = isConnectedGmail && actualConnectedEmail && !isTargetAccount;

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const syntaxChips = [
    { label: 'type:brand', query: 'type:brand ' },
    { label: 'type:newsletter', query: 'type:newsletter ' },
    { label: 'has:budget', query: 'has:budget ' },
    { label: 'min:₹50000', query: 'min:50000 ' },
    { label: 'tag:"High Value"', query: 'tag:"High Value (₹50k+)" ' },
    { label: 'is:unread', query: 'is:unread ' },
  ];

  const handleChipClick = (chipQuery: string) => {
    if (!searchQuery.includes(chipQuery.trim())) {
      onSearchChange((searchQuery ? searchQuery + ' ' : '') + chipQuery);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Bar with Focus Indicator, Live Gmail Status & Pipeline */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-100 px-3 sm:px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900/40">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated Inbound Studio</span>
          </div>
          <span className="text-indigo-400/50 hidden sm:inline">•</span>

          {/* Inbound Gateway Button for support@akaar.com */}
          <button
            id="btn-header-inbound-gateway"
            onClick={onOpenInboundGateway}
            title="Real-time Inbound Receiver for support@akaar.com: Ingest emails sent from any Gmail and configure live webhook"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 hover:text-white transition cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Receive: support@akaar.com</span>
          </button>
          <span className="text-indigo-400/50 hidden sm:inline">•</span>

          {/* Public Portal Button */}
          {onOpenPublicPortal && (
            <>
              <button
                id="btn-header-public-portal"
                onClick={onOpenPublicPortal}
                title="Open 100% Free Public Client Query Portal for support@akaar.com"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/30 hover:text-white transition cursor-pointer shadow-xs"
              >
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>Free Client Portal</span>
              </button>
              <span className="text-indigo-400/50 hidden sm:inline">•</span>
            </>
          )}

          {/* Account & Connection Indicator Pill */}
          <div className="relative">
            <button
              id="header-account-pill"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition cursor-pointer ${
                isConnectedGmail
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 hover:bg-emerald-900/80'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnectedGmail
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="truncate max-w-[170px]">
                {userEmail}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Account Popover Menu */}
            {showAccountDropdown && (
              <div 
                className="absolute left-0 mt-1.5 w-80 bg-white text-slate-800 rounded-xl border border-slate-200 shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setShowAccountDropdown(false)}
              >
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {userGooglePhoto ? (
                      <img
                        src={userGooglePhoto}
                        alt="User"
                        className="w-9 h-9 rounded-full border border-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {(actualConnectedEmail || userEmail).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        Corporate Mailbox
                      </h4>
                      <p className="text-[11px] font-mono text-indigo-700 font-semibold truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAccountDropdown(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sender Identity & Outbox Banner */}
                <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Outbound Sender: {userEmail}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    All client replies are dispatched directly from <strong>{userEmail}</strong> within this CRM without tab redirects.
                  </p>
                  {actualConnectedEmail && (
                    <div className="mt-1.5 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                      <span>Operator: {actualConnectedEmail}</span>
                      <span className="text-emerald-800 font-sans font-semibold">Active</span>
                    </div>
                  )}
                </div>

                {/* Connect / Actions Buttons */}
                <div className="mt-3 space-y-1.5">
                  {isConnectedGmail ? (
                    <>
                      <button
                        onClick={() => {
                          setShowAccountDropdown(false);
                          onSyncGmail();
                        }}
                        disabled={isSyncingGmail}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGmail ? 'animate-spin' : ''}`} />
                        <span>{isSyncingGmail ? 'Syncing Gmail...' : 'Sync Mailbox Now'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountDropdown(false);
                          onSwitchAccount();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Switch Google Account ({userEmail})</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountDropdown(false);
                          onLogoutGmail();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-1 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Workspace Account</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowAccountDropdown(false);
                          onLoginGmail();
                        }}
                        disabled={isAuthenticatingGmail}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <LogIn className={`w-3.5 h-3.5 ${isAuthenticatingGmail ? 'animate-spin' : ''}`} />
                        <span>{isAuthenticatingGmail ? 'Opening Google Sign-in...' : `Sign in with Google (${userEmail})`}</span>
                      </button>
                      <p className="text-[10px] text-slate-500 text-center">
                        Connects live Gmail inbox with real-time sorting for newsletters & brand queries.
                      </p>
                    </>
                  )}

                  {onClearDatabaseRecords && (
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onClearDatabaseRecords();
                      }}
                      className="w-full py-1 text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer text-left"
                    >
                      Clear Studio Database Records
                    </button>
                  )}

                  {onResetAllToZero && (
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onResetAllToZero();
                      }}
                      className="w-full py-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer text-left flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-600" />
                      <span>Reset All Values to Zero (Clean Slate)</span>
                    </button>
                  )}

                  {canUndo && onUndo && (
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onUndo();
                      }}
                      className="w-full py-1 text-[11px] text-amber-600 hover:text-amber-800 font-semibold cursor-pointer text-left flex items-center gap-1"
                    >
                      <Undo2 className="w-3 h-3 text-amber-600" />
                      <span>Undo / Restore Previous Data</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-slate-500 hidden md:inline">•</span>
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            Active Pipeline:{' '}
            <strong className="text-emerald-400 flex items-center">
              ₹{brandOffersTotal.toLocaleString('en-IN')} (Rs)
            </strong>
          </span>

          {/* Header Undo Action Button */}
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              title="Undo recent reset / restore retained records"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-xs"
            >
              <Undo2 className="w-3 h-3 text-amber-300" />
              <span>Undo ({undoCount || 'Restore'})</span>
            </button>
          )}

          {/* Header Reset to Zero Button */}
          {onResetAllToZero && (
            <button
              onClick={onResetAllToZero}
              title="Reset all pipeline values, records, and metrics to 0 for a clean 1st time state"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-rose-300" />
              <span className="hidden sm:inline">Reset to Zero</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Connect or Sync Status Button */}
          {isConnectedGmail ? (
            <button
              onClick={onSyncGmail}
              disabled={isSyncingGmail}
              title="Sync latest messages from Gmail"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSyncingGmail ? 'animate-spin' : ''}`} />
              <span>{isSyncingGmail ? 'Syncing...' : 'Sync Mailbox'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLoginGmail}
                disabled={isAuthenticatingGmail}
                title="Log in to Gmail to see your real-time mailbox"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition cursor-pointer active:scale-95 shadow-xs"
              >
                <LogIn className={`w-3 h-3 ${isAuthenticatingGmail ? 'animate-spin' : ''}`} />
                <span>{isAuthenticatingGmail ? 'Signing in...' : 'Login to Real Gmail'}</span>
              </button>

              {onOpenLoginHelp && (
                <button
                  type="button"
                  onClick={onOpenLoginHelp}
                  title={`View step-by-step instructions to connect ${userEmail}`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Login Steps</span>
                </button>
              )}

              {isInsideIframe && (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open app in a new browser tab for 100% reliable popup sign-in"
                  className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                  <span>Open in Tab</span>
                </a>
              )}
            </div>
          )}

          {/* Inbound Mail Gateway for service@akaarentertainment.com */}
          {onOpenInboundGateway && (
            <button
              id="btn-inbound-gateway"
              onClick={onOpenInboundGateway}
              title="Receive & view queries sent to service@akaarentertainment.com for 100% FREE"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
            >
              <Mail className="w-3 h-3 text-emerald-100" />
              <span>Receive service@akaarentertainment.com</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            </button>
          )}

          {/* Public Client Query Portal Link */}
          {onOpenPublicPortal && (
            <button
              id="btn-public-portal"
              onClick={onOpenPublicPortal}
              title="Open or copy public client portal link for support@akaar.com"
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Public Portal</span>
            </button>
          )}

          {/* Smart Analysis & CSV Export Feature */}
          <button
            id="btn-smart-analysis"
            onClick={onOpenSmartAnalysis}
            title="Smartly analyze newsletters & brand queries by money and service, and export to CSV/Excel"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer active:scale-95 shadow-xs"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-100" />
            <span>Smart Analysis & CSV</span>
          </button>

          {/* Real-time Multi-Device Team Chat & Bills */}
          <button
            id="btn-open-realtime-chat"
            onClick={onOpenRealtimeChat}
            title="Open real-time team chat and client data across mobile, tablet, and PC"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer active:scale-95 shadow-xs"
          >
            <MessageSquare className="w-3 h-3" />
            <span className="hidden sm:inline">Team Chat</span>
            <span className="sm:hidden">Chat</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* Upload Client Bill Quick Action */}
          <button
            id="btn-quick-upload-bill"
            onClick={onOpenUploadBill}
            title="Upload client bill & commercial contract"
            className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Upload className="w-3 h-3 text-emerald-400" />
            <span>Upload Bill</span>
          </button>
        </div>
      </div>

      {/* Account Mismatch Global Header Warning Banner */}
      {isDifferentAccount && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-900" />
            <span className="truncate">
              Connected as <strong>{actualConnectedEmail}</strong>. To access <strong>{userEmail}</strong>, please switch accounts:
            </span>
          </div>
          <button
            onClick={onSwitchAccount}
            className="shrink-0 px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Switch to {userEmail}
          </button>
        </div>
      )}

      {/* Sync Error Banner if any */}
      {syncError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{syncError}</span>
          </div>
          {onClearSyncError && (
            <button onClick={onClearSyncError} className="p-0.5 text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Navigation & Search Row */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle + Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="btn-mobile-menu"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-base shadow-xs">
              AE
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-slate-900 leading-tight">Akaar Entertainment</h1>
                {isConnectedGmail ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Workspace
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Studio CRM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-tight">Deal Pipeline & Inbound Intelligence</p>
            </div>
          </div>

          {/* Primary Workspace Navigation Tabs */}
          {onWorkspaceViewChange && (
            <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => onWorkspaceViewChange('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
                  activeWorkspaceView === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Executive Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onWorkspaceViewChange('mailbox')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
                  activeWorkspaceView === 'mailbox'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Studio Mailbox</span>
              </button>

              <button
                type="button"
                onClick={() => onWorkspaceViewChange('billing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
                  activeWorkspaceView === 'billing'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invoicing & Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => onWorkspaceViewChange('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
                  activeWorkspaceView === 'chat'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>Team Studio Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Smart Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="input-smart-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setShowSearchTips(true)}
              placeholder="Smart search (e.g. type:brand, tag:'High Value', min:₹50000, has:budget)..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Syntax Chips Dropdown / Helper */}
          {showSearchTips && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 p-2.5 bg-white rounded-lg border border-slate-200 shadow-lg z-40"
              onMouseLeave={() => setShowSearchTips(false)}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                <span className="font-semibold flex items-center gap-1 text-slate-700">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Smart Query Syntax Suggestions (In Rupees ₹)
                </span>
                <button 
                  onClick={() => setShowSearchTips(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {syntaxChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      handleChipClick(chip.query);
                      setShowSearchTips(false);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded text-xs font-mono text-slate-700 transition cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Personal Separator Switch & Notifications Alert Bell */}
        <div className="flex items-center gap-2 shrink-0">
          {/* SEPARATION FEATURE: Personal Correspondence Separator Switch */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              id="btn-focus-clean"
              onClick={() => onFocusModeChange('clean_work')}
              title="Separates all personal correspondence for a clean, focused work inbox"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                focusMode === 'clean_work'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Clean Inbox</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                focusMode === 'clean_work' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {brandsCount + newslettersCount}
              </span>
            </button>

            <button
              id="btn-focus-all"
              onClick={() => onFocusModeChange('all')}
              title="View all incoming messages"
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                focusMode === 'all'
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              All Mail
            </button>

            <button
              id="btn-focus-personal"
              onClick={() => onFocusModeChange('personal_only')}
              title="View only separated personal correspondence"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                focusMode === 'personal_only'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Personal Vault</span>
              {personalCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  focusMode === 'personal_only' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'
                }`}>
                  {personalCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Rules Modal Button */}
          <button
            id="btn-open-rules"
            onClick={onOpenFilterRules}
            title="Manage Custom Filters & Auto-Triage Rules"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
            aria-label="Custom Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Real-time Alert Bell with Dropdown Menu */}
          <div className="relative">
            <button
              id="btn-notification-bell"
              onClick={() => setShowAlertDropdown(!showAlertDropdown)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
              aria-label="Incoming Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold ring-2 ring-white">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Alert Dropdown Menu */}
            {showAlertDropdown && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-900">Real-Time Inbound Alerts</span>
                  </div>
                  {alerts.length > 0 && (
                    <button
                      onClick={() => {
                        onClearAlerts();
                        setShowAlertDropdown(false);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 transition"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                      <p>No new alerts yet.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Incoming brand pitches & newsletters trigger instant alerts here.
                      </p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          onOpenEmail(alert.emailId);
                          setShowAlertDropdown(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                          !alert.read ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${
                          alert.category === 'brand_query' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {alert.category === 'brand_query' ? (
                            <IndianRupee className="w-4 h-4" />
                          ) : (
                            <BookOpen className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {alert.sender}
                            </span>
                            {alert.budget && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                {alert.budget}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 line-clamp-2 mt-0.5">{alert.title}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Live polling active
                  </span>
                  <button
                    onClick={() => {
                      if (onSimulateIncoming) onSimulateIncoming();
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    + Ingest Client Inquiry (₹4.5L)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync / Login Feedback Banner */}
      {syncError && (
        <div className="bg-red-950/90 border-t border-b border-red-500/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium leading-tight">{syncError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://console.cloud.google.com/apis/credentials/consent?project=inspiring-folio-452009-a3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-medium text-xs transition cursor-pointer"
            >
              <span>Add to Test Users (GCP)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {onOpenLoginHelp && (
              <button
                type="button"
                onClick={onOpenLoginHelp}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold underline cursor-pointer"
              >
                Fix Steps
              </button>
            )}
            {isInsideIframe && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {onClearSyncError && (
              <button
                type="button"
                onClick={onClearSyncError}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
