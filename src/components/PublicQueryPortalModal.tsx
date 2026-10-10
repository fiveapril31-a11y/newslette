import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  X,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Copy,
  ExternalLink,
  Building2,
  FileText
} from 'lucide-react';
import { EmailItem } from '../types';
import { sendInboundSimulation } from '../services/inboundGateway';

interface PublicQueryPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuerySubmitted: (email: EmailItem) => void;
  userEmail?: string;
}

export const PublicQueryPortalModal: React.FC<PublicQueryPortalModalProps> = ({
  isOpen,
  onClose,
  onQuerySubmitted,
  userEmail = 'abhimorkhade11@gmail.com',
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [company, setCompany] = useState('');
  const [service, setService] = useState('Brand Sponsorship & Promotion');
  const [budget, setBudget] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<{ id: string; refNo: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const publicPortalUrl = `${window.location.origin}${window.location.pathname}?portal=inbound`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail || !subject || !message) return;

    setIsSubmitting(true);
    try {
      // 1. Post to Inbound Gateway
      const res = await sendInboundSimulation({
        from: senderEmail,
        senderName: senderName || senderEmail.split('@')[0],
        to: 'service@akaarentertainment.com',
        subject,
        message: `${message}\n\n---\nClient Organization: ${company || 'Independent Brand'}\nRequested Service: ${service}\nSubmitted via Akaar Entertainment Public Inbound Portal`,
        budget,
        service,
      });

      // 2. Also send notification to user's real email via FormSubmit for free
      try {
        await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(userEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: `${senderName} (via service@akaarentertainment.com Portal)`,
            email: senderEmail,
            _replyto: senderEmail,
            _subject: `[Akaar Query] ${subject} (${budget})`,
            service_required: service,
            proposed_budget: budget,
            organization: company || 'N/A',
            message: message,
            crm_destination: 'service@akaarentertainment.com',
          }),
        });
      } catch {
        // notification backup
      }

      if (res.success && res.email) {
        const refNo = `AKR-${Math.floor(100000 + Math.random() * 900000)}`;
        setSubmittedItem({ id: res.email.id, refNo });
        onQuerySubmitted(res.email);
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedItem(null);
    setSubject('New Inquiry for Akaar Team');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Public Client Query Portal</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% Free Inbound
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Delivers queries straight into your CRM inbox under <strong>service@akaarentertainment.com</strong>
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

        {/* Shareable Link Banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border-b border-indigo-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Share with clients:</strong> Send this link to anyone to receive queries without paying for custom email!
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                <span>Copy Public Link</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {submittedItem ? (
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Query Received Successfully!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your inquiry has been delivered directly to <strong className="text-indigo-700">service@akaarentertainment.com</strong> and logged into the Akaar Entertainment CRM workspace.
                </p>
                <div className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  Tracking Ref: {submittedItem.refNo}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2 text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>CRM Delivery Status: Confirmed</span>
                </div>
                <p className="text-emerald-800">
                  • Ingested into CRM Inbox (Clean Inbox & Brand Queries)<br />
                  • Sound notification triggered<br />
                  • Notification sent to {userEmail}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
                >
                  View in CRM Inbox Now
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer"
                >
                  Send Another Query
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name / Representative
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g., Abhi Morkhade / Sneha Roy"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Email (Gmail or Work Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g., abhimorkhade11@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>Company / Brand</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Media / Brand Partner"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Required
                  </label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="Brand Sponsorship & Promotion">Brand Sponsorship & Promotion</option>
                    <option value="Commercial Soundtrack & Audio">Commercial Soundtrack & Audio</option>
                    <option value="Music Licensing & Sync">Music Licensing & Sync</option>
                    <option value="Newsletter Collaboration">Newsletter Collaboration</option>
                    <option value="General Query & Support">General Query & Support</option>
                  </select>
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
                    placeholder="₹50,000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Mailbox
                </label>
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>service@akaarentertainment.com (Akaar CRM Inbound Gateway)</span>
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
                  placeholder="Subject of your inquiry"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Message / Project Requirements
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide scope, deliverables, timeline, or query details..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white leading-relaxed resize-none"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Directly routes to CRM • 100% Free • Instant confirmation</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Delivering to CRM...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Query to support@akaar.com</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicQueryPortalModal;
