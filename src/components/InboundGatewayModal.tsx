import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  X,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Radio,
  Copy,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  Globe,
  Terminal
} from 'lucide-react';
import { EmailItem } from '../types';
import { sendInboundSimulation } from '../services/inboundGateway';

interface InboundGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onEmailReceived: (email: EmailItem) => void;
  onOpenPublicPortal?: () => void;
  onSyncGmail?: () => void;
}

export const InboundGatewayModal: React.FC<InboundGatewayModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'abhimorkhade11@gmail.com',
  onEmailReceived,
  onOpenPublicPortal,
  onSyncGmail,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'free_alias' | 'public_portal' | 'cloudflare' | 'webhook'>('simulator');
  const [targetMailbox, setTargetMailbox] = useState<string>('service@akaarentertainment.com');
  const [senderEmail, setSenderEmail] = useState(userEmail || '');
  const [senderName, setSenderName] = useState('');
  const [subject, setSubject] = useState('');
  const [service, setService] = useState('Brand Deal & Commercial Audio');
  const [budget, setBudget] = useState('₹0');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [copiedWebhookCurl, setCopiedWebhookCurl] = useState(false);

  const applyPreset = (preset: 'brand' | 'film' | 'support' | 'newsletter') => {
    if (preset === 'brand') {
      setSenderEmail('partnerships@brandclient.com');
      setSenderName('Brand Partnerships Team');
      setSubject('Q4 Commercial Audio & Brand Collaboration');
      setService('Sponsored Content & Socials');
      setBudget('₹0');
      setMessage('Hello Akaar Team,\n\nWe would like to discuss a commercial audio campaign collaboration with your studio.\n\nPlease share your current availability.');
    } else if (preset === 'film') {
      setSenderEmail('production@studiopartner.com');
      setSenderName('Studio Production Team');
      setSubject('Commercial Original Score & Sync Licensing');
      setService('Original Score & Sound Design');
      setBudget('₹0');
      setMessage('Hello Team Akaar,\n\nWe are looking to license original audio compositions for an upcoming production.\n\nLooking forward to hearing from you.');
    } else if (preset === 'support') {
      setSenderEmail('client.support@domain.com');
      setSenderName('Client Support Desk');
      setSubject('Invoice & Master Audio File Access Request');
      setService('Account Assistance');
      setBudget('N/A');
      setMessage('Hello Support,\n\nRequesting access to master audio delivery stems and corresponding commercial invoice.\n\nThank you.');
    } else if (preset === 'newsletter') {
      setSenderEmail('digest@audiotechweekly.io');
      setSenderName('Audio Engineering Weekly');
      setSubject('Audio Industry Digest: Production & Spatial Sound');
      setService('Editorial Newsletter');
      setBudget('N/A');
      setMessage('Weekly industry bulletin covering spatial audio, mixing engineering, and music production workflows.');
    }
  };

  if (!isOpen) return null;

  const publicPortalUrl = `${window.location.origin}${window.location.pathname}?portal=inbound`;
  const freeAliasEmail = userEmail ? `${userEmail.replace('@gmail.com', '')}+support@gmail.com` : 'support@gmail.com';

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(freeAliasEmail);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 3000);
  };

  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(publicPortalUrl);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 3000);
  };

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessNotice(null);

    try {
      const res = await sendInboundSimulation({
        from: senderEmail,
        senderName,
        to: targetMailbox,
        subject,
        message,
        budget,
        service,
      });

      if (res.success && res.email) {
        onEmailReceived(res.email);
        setSuccessNotice(
          `Success! Email from "${senderEmail}" was ingested for ${targetMailbox} and added to your CRM inbox.`
        );
        setTimeout(() => {
          setSuccessNotice(null);
        }, 6000);
      } else {
        alert(res.error || 'Failed to ingest email');
      }
    } catch (err: any) {
      alert(err.message || 'Error ingesting email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Inbound Mail Gateway</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {targetMailbox}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Receive and process all customer & brand queries into this CRM for <strong>100% FREE</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Explanation Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">Why your email to service@akaarentertainment.com bounced in Gmail:</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              When someone sends an email to <code>service@akaarentertainment.com</code> from personal Gmail, Google looks for paid MX servers for <code>akaarentertainment.com</code>. Because you don't pay ₹500/mo for Google Workspace, Gmail bounces it.
              <strong> Good news: You DO NOT need to spend money!</strong> Use the 1-click Ingest Gateway below, or set up Free Cloudflare / ImprovMX Routing (detailed in Tab 4) to receive every email for 100% free!
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-4 pt-2 gap-1 sm:gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2 px-2.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'simulator'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>1. Ingest Email Now (Test)</span>
          </button>

          <button
            onClick={() => setActiveTab('free_alias')}
            className={`pb-2 px-2.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'free_alias'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>2. Free Gmail Alias</span>
          </button>

          <button
            onClick={() => setActiveTab('public_portal')}
            className={`pb-2 px-2.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'public_portal'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3. Public Query Link</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`pb-2 px-2.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cloudflare'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Free Cloudflare Routing</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-2 px-2.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'webhook'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>5. Inbound Webhook (API)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* TAB 1: SIMULATE & INGEST */}
          {activeTab === 'simulator' && (
            <form onSubmit={handleSimulateInbound} className="space-y-3.5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 leading-relaxed">
                <strong>Ingest your query directly into the CRM:</strong> Did you already draft or try sending an email from your Gmail? Enter it below and click <strong>"Receive Email in CRM Now"</strong>. It will immediately appear in your CRM inbox under <strong>support@akaar.com</strong> with Rupee deal amounts and sound notification.
              </div>

              {/* 1-Click Preset Template Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1-Click Test Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('brand')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <IndianRupee className="w-3 h-3 text-emerald-600" />
                    <span>Brand Deal (₹95,000)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('film')}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>Film Licensing (₹1,40,000)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('support')}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>Client Help Ticket</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('newsletter')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <span>Newsletter</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Client Name or Brand Representative"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Mailbox (Target Destination)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetMailbox('service@akaarentertainment.com')}
                    className={`flex items-center gap-2 p-2.5 text-xs font-semibold rounded-lg border text-left transition cursor-pointer ${
                      targetMailbox === 'service@akaarentertainment.com'
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${targetMailbox === 'service@akaarentertainment.com' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="truncate font-bold">service@akaarentertainment.com</div>
                      <div className="text-[10px] text-emerald-700 font-normal">Akaar Entertainment (Live Primary)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMailbox('support@akaar.com')}
                    className={`flex items-center gap-2 p-2.5 text-xs font-semibold rounded-lg border text-left transition cursor-pointer ${
                      targetMailbox === 'support@akaar.com'
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${targetMailbox === 'support@akaar.com' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="truncate font-bold">support@akaar.com</div>
                      <div className="text-[10px] text-slate-500 font-normal">Akaar Support Desk</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service / Collaboration Type
                  </label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="Brand Sponsorship & Promotion"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <IndianRupee className="w-3 h-3 text-emerald-600" />
                    <span>Proposed Budget (INR)</span>
                  </label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="₹65,000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject of the email"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-mono leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Target: <strong className="text-teal-700">support@akaar.com</strong>
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Delivering to CRM...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Receive Email in CRM Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: FREE GMAIL ALIAS */}
          {activeTab === 'free_alias' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Google's Built-In Free Plus-Addressing</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Every Google account supports unlimited free aliases. Anyone can send an email to:
                </p>

                <div className="flex items-center gap-2 p-2.5 bg-white border border-indigo-200 rounded-lg shadow-2xs">
                  <span className="font-mono text-xs font-bold text-indigo-900 flex-1 truncate">
                    {freeAliasEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAlias}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs transition cursor-pointer shrink-0"
                  >
                    {copiedAlias ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAlias ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-slate-600 pt-1 text-[11px]">
                  <p>• When someone emails this address, it lands in your real Gmail inbox for 100% free.</p>
                  <p>• When you connect or sync your Gmail in this CRM, the CRM automatically detects it as an inquiry for <strong>support@akaar.com</strong>!</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Connect & Sync Your Real Gmail:</span>
                  <span className="text-[11px] text-slate-500">Sync all emails delivered to your inbox directly into this CRM</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSyncGmail) onSyncGmail();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition cursor-pointer text-xs shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Gmail Inbox</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLIC QUERY PORTAL */}
          {activeTab === 'public_portal' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Public Client Query Portal (100% Free)</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Provide your clients, brand sponsors, or fans with a direct web portal link to submit inquiries. No custom email hosting needed!
                </p>

                <div className="flex items-center gap-2 p-2.5 bg-white border border-emerald-300 rounded-lg shadow-2xs">
                  <span className="font-mono text-[11px] text-emerald-900 flex-1 truncate select-all">
                    {publicPortalUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPortalLink}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs transition cursor-pointer shrink-0"
                  >
                    {copiedPortalLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPortalLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPublicPortal) onOpenPublicPortal();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Public Form Preview</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FREE CLOUDFLARE EMAIL ROUTING */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-sm">How to get service@akaarentertainment.com for 100% Free Forever:</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  You <strong>NEVER</strong> need to pay Google Workspace ₹500/month or Microsoft 365. Cloudflare provides <strong>100% FREE Email Routing forever</strong>. Follow these 4 simple steps:
                </p>

                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs">Method 1: Cloudflare Email Routing (Recommended & 100% Free)</div>
                  <ol className="list-decimal ml-4 space-y-1.5 text-slate-700 text-[11px]">
                    <li>Sign up for a free account at <strong>dash.cloudflare.com</strong> and add your domain <code>akaarentertainment.com</code>.</li>
                    <li>Update your domain registrar nameservers to Cloudflare's 2 free nameservers.</li>
                    <li>In Cloudflare dashboard, go to <strong>Email Routing → Routes → Create Address</strong>.</li>
                    <li>Set <strong>Custom address:</strong> <code>service@akaarentertainment.com</code> → <strong>Action:</strong> Send to → <strong>Destination:</strong> <code>abhimorkhade11@gmail.com</code>.</li>
                    <li>Check your Gmail for Cloudflare's verification email and click the confirmation link.</li>
                    <li>Cloudflare automatically provisions the 3 MX records (e.g. <code>isaac.mx.cloudflare.net</code>).</li>
                  </ol>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px] font-medium">
                    ✨ Any email sent by anyone to <code>service@akaarentertainment.com</code> lands in your Gmail in &lt;1 second and syncs right into this CRM!
                  </div>
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs">Method 2: ImprovMX / ForwardEmail (Without changing nameservers)</div>
                  <p className="text-[11px] text-slate-600">
                    If your domain is with GoDaddy, Namecheap, or Hostinger and you don't want to change nameservers:
                  </p>
                  <ol className="list-decimal ml-4 space-y-1 text-slate-700 text-[11px]">
                    <li>Go to <strong>improvmx.com</strong> or <strong>forwardemail.net</strong> (Free tier).</li>
                    <li>Add <code>akaarentertainment.com</code> and forward <code>service@akaarentertainment.com</code> to <code>abhimorkhade11@gmail.com</code>.</li>
                    <li>Copy their 2 MX DNS records into your DNS provider. Takes 2 minutes!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FREE INBOUND WEBHOOK / API */}
          {activeTab === 'webhook' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Terminal className="w-4 h-4" />
                    Inbound Webhook Endpoint
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    POST application/json
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg text-emerald-300 text-xs break-all select-all border border-slate-800">
                  {window.location.origin}/api/inbound-email
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Any external service (Cloudflare Worker, Zapier, Make.com, FormSubmit, SendGrid Inbound Parse) can POST here for 100% free delivery straight into your CRM inbox.
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-slate-300">Sample JSON Payload:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`curl -X POST "${window.location.origin}/api/inbound-email" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "sponsor@brands.com",
    "senderName": "Brand Director",
    "to": "service@akaarentertainment.com",
    "subject": "Commercial Audio Collaboration",
    "bodyText": "We would like to partner with Akaar Entertainment on our campaign.",
    "budget": "₹1,20,000",
    "service": "Music Licensing & Sync"
  }'`);
                        setCopiedWebhookCurl(true);
                        setTimeout(() => setCopiedWebhookCurl(false), 3000);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-sans cursor-pointer text-xs"
                    >
                      {copiedWebhookCurl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhookCurl ? 'Copied cURL' : 'Copy cURL Command'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded leading-relaxed">
{`{
  "from": "sponsor@brands.com",
  "senderName": "Brand Director",
  "to": "service@akaarentertainment.com",
  "subject": "Commercial Audio Collaboration",
  "bodyText": "We would like to partner with Akaar Entertainment on our campaign.",
  "budget": "₹1,20,000",
  "service": "Music Licensing & Sync"
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Inbound Mailbox: <strong className="text-indigo-600">support@akaar.com</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InboundGatewayModal;
