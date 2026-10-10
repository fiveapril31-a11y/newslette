import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  LogIn,
  AlertTriangle,
  Mail,
  ArrowRight,
  Info,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';

interface LoginHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email?: string) => void;
  isAuthenticating?: boolean;
  targetEmail?: string;
  developerEmail?: string;
}

export const LoginHelpModal: React.FC<LoginHelpModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  isAuthenticating = false,
  targetEmail = 'support@akaar.com',
  developerEmail = 'abhimorkhade11@gmail.com',
}) => {
  if (!isOpen) return null;

  const [copiedEmail, setCopiedEmail] = useState(false);
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const gcpConsoleUrl =
    'https://console.cloud.google.com/apis/credentials/consent?project=inspiring-folio-452009-a3';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div
      id="login-help-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="login-help-modal"
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Fix &quot;Error 403: access_denied&quot;
              </h2>
              <p className="text-xs text-slate-500">
                Google Verification / Testing Mode Resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-sm text-slate-600">
          {/* Urgent Error 403 Callout */}
          <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 text-sm">
                  Why Google showed &quot;Error 403: access_denied&quot;
                </h3>
                <p className="text-xs text-red-700 leading-relaxed mt-1">
                  Your Google Cloud Project (<strong>inspiring-folio-452009-a3</strong>) is in <strong>&quot;Testing&quot; mode</strong>. Google requires any Gmail account other than the developer to be added to the <strong>&quot;Test users&quot;</strong> list in Google Cloud Console.
                </p>
              </div>
            </div>

            {/* Quick 20-second fix */}
            <div className="mt-3 pt-3 border-t border-red-200/60 text-xs text-red-900 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>How to fix in 20 seconds:</span>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                <li>
                  Click here to{' '}
                  <a
                    href={gcpConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    <span>Open OAuth Consent Screen in Google Cloud Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Scroll down to the <strong className="text-slate-900">&quot;Test users&quot;</strong> section and click <strong className="text-slate-900">&quot;+ ADD USERS&quot;</strong>.
                </li>
                <li className="flex flex-wrap items-center gap-1.5">
                  <span>Enter:</span>
                  <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-semibold border border-slate-300">
                    {targetEmail}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(targetEmail)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[11px] font-medium text-slate-700 transition cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                  <span>and click <strong className="text-slate-900">SAVE</strong>.</span>
                </li>
                <li>
                  Done! Come back here and click <strong className="text-slate-900">&quot;Sign in with Google&quot;</strong>.
                </li>
              </ol>
            </div>
          </div>

          {/* Alternative: Sign in with Developer Account */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instant Alternative (No Setup Required):</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                Works Right Now
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The developer / owner account <strong className="text-slate-800">{developerEmail}</strong> is already pre-approved by Google. You can sign in with it immediately:
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogin(developerEmail);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-3 h-3 text-indigo-400" />
              <span>Sign in with {developerEmail}</span>
            </button>
          </div>

          {/* Standard Sign-in Steps */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Once added as a Test User:
            </h4>

            {/* Step 1 & 2 */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  1
                </div>
                <p className="font-semibold text-slate-800">
                  Click Advanced &gt; Go to inspiring-folio-452009-a3 (unsafe)
                </p>
              </div>
              <p className="text-slate-500 pl-7">
                When Google asks to verify, click <strong className="text-slate-700">&quot;Advanced&quot;</strong> in the bottom left, then click <strong className="text-indigo-600">&quot;Go to inspiring-folio-452009-a3 (unsafe)&quot;</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  2
                </div>
                <p className="font-semibold text-slate-800">
                  Check all Gmail permission checkboxes
                </p>
              </div>
              <p className="text-slate-500 pl-7">
                Check all permission boxes and click <strong className="text-slate-700">Continue</strong> to load your mailbox with Indian Rupee (₹) brand queries and newsletter filtering.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={gcpConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <span>Open Google Cloud Console</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isInsideIframe && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition cursor-pointer"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogin(targetEmail);
              }}
              disabled={isAuthenticating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
            >
              <LogIn className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-spin' : ''}`} />
              <span>{isAuthenticating ? 'Opening Google...' : `Sign in with ${targetEmail}`}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
