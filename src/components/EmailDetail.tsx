import { useState, useMemo, useEffect, type FormEvent } from 'react';
import {
  ArrowLeft,
  Star,
  Trash2,
  Mail,
  FolderInput,
  Tag as TagIcon,
  IndianRupee,
  BookOpen,
  UserCheck,
  Calendar,
  Send,
  Reply,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Plus,
  X,
  Clock,
  Sparkles,
  Inbox,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { EmailItem, FolderItem, SmartTag, ClientBill } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { ClientRecipientSelector, RecipientMode } from './ClientRecipientSelector';
import {
  resolveEmailTarget,
  getAllClientsInBox,
  ClientInBox,
  ResolvedEmailTarget,
} from '../utils/clientEmailResolver';
import { subscribeToClientBills } from '../services/firebaseSync';

interface EmailDetailProps {
  email: EmailItem;
  allEmails?: EmailItem[];
  userEmail?: string;
  operatorEmail?: string;
  onBack: () => void;
  onToggleStar: (emailId: string) => void;
  onToggleRead: (emailId: string) => void;
  onDeleteEmail: (emailId: string) => Promise<void> | void;
  onMoveToFolder: (emailId: string, folderId: string) => void;
  onAddTag: (emailId: string, tagName: string) => void;
  onRemoveTag: (emailId: string, tagName: string) => void;
  onSeparatePersonal: (emailId: string) => void;
  onSendReply?: (
    to: string,
    subject: string,
    bodyText: string,
    options?: { cc?: string; recipientName?: string }
  ) => Promise<boolean>;
  folders: FolderItem[];
  availableTags: SmartTag[];
}

export default function EmailDetail({
  email,
  allEmails = [],
  userEmail = 'service@akaarentertainment.com',
  operatorEmail,
  onBack,
  onToggleStar,
  onToggleRead,
  onDeleteEmail,
  onMoveToFolder,
  onAddTag,
  onRemoveTag,
  onSeparatePersonal,
  onSendReply,
  folders,
  availableTags,
}: EmailDetailProps) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [unsubscribeNotice, setUnsubscribeNotice] = useState<string | null>(null);

  // Safety Confirmation Modals State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Client and Routing State
  const actualUserEmail = email.recipientEmail || userEmail || 'service@akaarentertainment.com';

  const [clientBills, setClientBills] = useState<ClientBill[]>([]);
  useEffect(() => {
    const unsub = subscribeToClientBills((bills) => {
      setClientBills(bills);
    });
    return () => unsub();
  }, []);

  const knownClients = useMemo(
    () => getAllClientsInBox(allEmails.length > 0 ? allEmails : [email], clientBills),
    [allEmails, email, clientBills]
  );

  const targetInfo: ResolvedEmailTarget = useMemo(
    () => resolveEmailTarget(email, knownClients),
    [email, knownClients]
  );

  const [recipientMode, setRecipientMode] = useState<RecipientMode>('client_direct');
  const [selectedBoxClient, setSelectedBoxClient] = useState<ClientInBox | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [ccMyEmail, setCcMyEmail] = useState(false);

  // Reset routing on email switch
  useEffect(() => {
    setRecipientMode('client_direct');
    setSelectedBoxClient(null);
    setCustomRecipientEmail('');
  }, [email.id]);

  const effectiveRecipient = useMemo(() => {
    if (recipientMode === 'client_direct') {
      return {
        email: targetInfo.clientEmail,
        name: targetInfo.clientName,
        typeLabel: 'Direct Client in Box',
        isBypassingIntake: targetInfo.isInboundIntakeAddress,
      };
    } else if (recipientMode === 'my_box') {
      return {
        email: actualUserEmail,
        name: 'My Personal Mailbox',
        typeLabel: 'Direct to My Email Address',
        isBypassingIntake: targetInfo.isInboundIntakeAddress,
      };
    } else if (recipientMode === 'box_directory') {
      return {
        email: selectedBoxClient?.clientEmail || targetInfo.clientEmail,
        name: selectedBoxClient?.clientName || targetInfo.clientName,
        typeLabel: `Client in Box (${selectedBoxClient?.company || 'Directory'})`,
        isBypassingIntake: targetInfo.isInboundIntakeAddress,
      };
    } else if (recipientMode === 'inbound_sender') {
      return {
        email: targetInfo.inboundSenderEmail,
        name: targetInfo.inboundSenderName,
        typeLabel: 'Inbound Sender Address',
        isBypassingIntake: false,
      };
    } else {
      return {
        email: customRecipientEmail.trim() || targetInfo.clientEmail,
        name: 'Custom Direct Recipient',
        typeLabel: 'Custom Email Address',
        isBypassingIntake: false,
      };
    }
  }, [recipientMode, targetInfo, actualUserEmail, selectedBoxClient, customRecipientEmail]);

  // Predefined quick reply templates for brand inquiries in Rupees
  const applyTemplate = (templateType: 'accept' | 'rate_card' | 'brief' | 'decline') => {
    setIsReplying(true);
    const greetingName =
      effectiveRecipient.name && effectiveRecipient.name !== 'Custom Recipient'
        ? effectiveRecipient.name.replace(/\([^)]*\)/g, '').trim().split(' ')[0]
        : 'there';

    switch (templateType) {
      case 'accept':
        setReplyText(
          `Hi ${greetingName},\n\nThank you for reaching out to Akaar Entertainment! We are very interested in partnering on the ${
            email.brandMeta?.campaignType || 'campaign'
          }.\n\nThe proposed budget of ${
            email.brandMeta?.budgetOffer || 'the stated fee'
          } works for our Q4 production schedule. Please send over your draft agreement and creative brief so our production lead can review.\n\nLooking forward to a great collaboration!\n\nBest regards,\nAkaar Support Team\nsupport@akaar.com`
        );
        break;
      case 'rate_card':
        setReplyText(
          `Hi ${greetingName},\n\nThank you for considering Akaar Entertainment for this campaign. We appreciate your interest!\n\nFor custom dedicated integrations and multi-platform distribution of this scope, our standard production rate starts at ₹6,50,000 (Rs 6.5 Lakh) (including high-resolution master audio and 60-day digital usage rights). We have attached our official 2026 Studio Media Kit and rate matrix for your team's review.\n\nLet us know if you would like to hop on a quick 15-minute alignment call next week.\n\nWarm regards,\nAkaar Support Team\nsupport@akaar.com`
        );
        break;
      case 'brief':
        setReplyText(
          `Hi ${greetingName},\n\nThank you for the inquiry. Could you please share the formal creative brief, mandatory product talking points, and specific delivery milestones for our production team to evaluate feasibility?\n\nBest,\nAkaar Support Desk\nsupport@akaar.com`
        );
        break;
      case 'decline':
        setReplyText(
          `Hi ${greetingName},\n\nThank you so much for thinking of Akaar Entertainment. Unfortunately, our production slate is fully booked for the requested timeframe, so we will have to respectfully pass on this opportunity.\n\nWe would love to keep in touch for future campaigns in 2027!\n\nWarmly,\nAkaar Support Team\nsupport@akaar.com`
        );
        break;
    }
  };

  const handleOpenSendConfirmation = (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setShowSendConfirm(true);
  };

  const handleConfirmSend = async () => {
    setIsSubmittingAction(true);
    try {
      if (onSendReply) {
        const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
        await onSendReply(effectiveRecipient.email, replySubject, replyText, {
          cc: ccMyEmail ? actualUserEmail : undefined,
          recipientName: effectiveRecipient.name,
        });
      }
      setShowSendConfirm(false);
      setReplySuccess(true);
      setTimeout(() => {
        setReplySuccess(false);
        setIsReplying(false);
        setReplyText('');
      }, 2500);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSubmittingAction(true);
    try {
      await onDeleteEmail(email.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCopySender = () => {
    navigator.clipboard.writeText(email.senderEmail);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentFolder = folders.find((f) => f.id === email.folderId) || {
    name: 'Primary Inbox',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2">
          {/* Back button (Mobile view) */}
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            title="Back to email list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Current Folder Badge with Move Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFolderMenu(!showFolderMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <FolderInput className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentFolder.name}</span>
            </button>

            {showFolderMenu && (
              <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">
                  Move to folder
                </div>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onMoveToFolder(email.id, f.id);
                      setShowFolderMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>{f.name}</span>
                    {f.id === email.folderId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {email.category === 'personal' && email.folderId !== 'personal_vault' && (
            <button
              onClick={() => onSeparatePersonal(email.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition cursor-pointer"
              title="Isolate into Personal Vault"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Isolate to Vault</span>
            </button>
          )}

          <button
            onClick={() => onToggleStar(email.id)}
            className={`p-1.5 rounded-lg border border-slate-200 bg-white transition cursor-pointer ${
              email.starred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'
            }`}
            title="Star email"
          >
            <Star className={`w-4 h-4 ${email.starred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => onToggleRead(email.id)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title={email.read ? 'Mark Unread' : 'Mark Read'}
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Trash button triggers confirmation dialog */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Delete email"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Email Body Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Subject Header with Category Badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {email.category === 'brand_query' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <IndianRupee className="w-3 h-3" />
                Customer Query / Brand Deal
              </span>
            )}
            {email.category === 'newsletter' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <BookOpen className="w-3 h-3" />
                Industry Newsletter
              </span>
            )}
            {email.category === 'personal' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                <UserCheck className="w-3 h-3" />
                Personal Correspondence
              </span>
            )}
            {email.priority === 'urgent' && (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                High Urgency
              </span>
            )}
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {email.subject}
          </h1>
        </div>

        {/* Sender and Recipient Card with Client Detection */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {(targetInfo.clientName || email.senderName).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {targetInfo.hasDirectClient ? targetInfo.clientName : email.senderName}
                </span>
                {targetInfo.hasDirectClient && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Client Named in Box
                  </span>
                )}
                <button
                  onClick={handleCopySender}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Copy email address"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {copiedLink && (
                  <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                )}
              </div>

              {/* Direct Client vs Inbound Intake Address Info */}
              {targetInfo.hasDirectClient && (
                <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>Direct Client Mail:</span>
                  <span className="font-mono font-semibold">{targetInfo.clientEmail}</span>
                </div>
              )}

              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Received From:</span>
                <span className="font-mono text-slate-600">{email.senderEmail}</span>
                {targetInfo.isInboundIntakeAddress && (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Intake / Form Address
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>Mailbox (To):</span>
                {email.recipientEmail === 'support@akaar.com' || email.tags?.includes('support@akaar.com') ? (
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    support@akaar.com
                  </span>
                ) : (
                  <span className="font-mono text-slate-600">{email.recipientEmail || actualUserEmail}</span>
                )}
                {actualUserEmail && email.recipientEmail !== actualUserEmail && (
                  <span className="text-[11px] text-slate-400">
                    (Owner: {actualUserEmail})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>{new Date(email.receivedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="font-mono">{new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* SPECIAL SMART ASSESSMENT: For Brand Queries in Rupees */}
        {email.brandMeta && (
          <div className="p-4 rounded-xl bg-linear-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-900">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Customer Inquiry & Commercial Breakdown</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                Verified Query
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-3">
              <div className="p-3 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Proposed Budget / Value
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-600">
                  {email.brandMeta.budgetOffer || 'To Be Negotiated'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Service Opted
                </span>
                <span className="text-xs font-bold text-indigo-700 line-clamp-1">
                  {email.brandMeta.serviceOpted || 'Custom Audio / Media'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Campaign / Scope
                </span>
                <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {email.brandMeta.campaignType || 'Commercial Inquiry'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Production Deadline
                </span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {email.brandMeta.deadline || 'Flexible'}
                </span>
              </div>
            </div>

            {/* Quick response templates for commercial inquiries */}
            <div>
              <span className="text-[11px] font-bold text-emerald-900 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Quick Reply Templates (in Rs):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => applyTemplate('accept')}
                  className="px-2.5 py-1 rounded bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-medium border border-emerald-300 transition cursor-pointer"
                >
                  Accept Offer & Request Brief
                </button>
                <button
                  onClick={() => applyTemplate('rate_card')}
                  className="px-2.5 py-1 rounded bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-medium border border-emerald-300 transition cursor-pointer"
                >
                  Counter with Rate Card (₹6.5L+)
                </button>
                <button
                  onClick={() => applyTemplate('brief')}
                  className="px-2.5 py-1 rounded bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-medium border border-emerald-300 transition cursor-pointer"
                >
                  Request Deliverables Specs
                </button>
                <button
                  onClick={() => applyTemplate('decline')}
                  className="px-2.5 py-1 rounded bg-white hover:bg-rose-600 hover:text-white text-slate-600 text-xs font-medium border border-slate-300 transition cursor-pointer"
                >
                  Polite Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SPECIAL SMART ASSESSMENT: For Newsletters */}
        {email.newsletterMeta && (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-xs font-bold text-indigo-900 block">
                  {email.newsletterMeta.publication} {email.newsletterMeta.issueNumber}
                </span>
                <span className="text-[11px] text-indigo-700">
                  Topic: {email.newsletterMeta.editionTopic} • {email.newsletterMeta.frequency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-500 bg-white px-2 py-1 rounded border border-indigo-200">
                <Clock className="w-3 h-3 text-indigo-500" />
                {email.newsletterMeta.readTimeMinutes} min estimated read
              </span>
              <button
                onClick={() => {
                  setUnsubscribeNotice(`Unsubscribe link tracked for ${email.newsletterMeta?.publication}`);
                  setTimeout(() => setUnsubscribeNotice(null), 3000);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        )}

        {unsubscribeNotice && (
          <div className="p-2 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">
            {unsubscribeNotice}
          </div>
        )}

        {/* SPECIAL SEPARATION BANNER: For Personal Correspondence */}
        {email.category === 'personal' && (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-slate-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Identified as Personal Correspondence
                </span>
                <span className="text-[11px] text-slate-600">
                  Relationship: {email.personalMeta?.relationship || 'Family / Friend'}
                </span>
              </div>
            </div>

            {email.folderId !== 'personal_vault' ? (
              <button
                onClick={() => onSeparatePersonal(email.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Move to Personal Vault</span>
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Safely filed in Personal Vault
              </span>
            )}
          </div>
        )}

        {/* Smart Tags Manager on this Email */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <TagIcon className="w-3 h-3" />
            Tags:
          </span>

          {email.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
            >
              <span>{tag}</span>
              <button
                onClick={() => onRemoveTag(email.id, tag)}
                className="p-0.5 hover:text-rose-600 rounded-full cursor-pointer"
                title="Remove tag"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {/* Add Tag Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-300 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add tag</span>
            </button>

            {showTagMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                  Select tag
                </div>
                {availableTags
                  .filter((t) => !email.tags.includes(t.name))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onAddTag(email.id, t.name);
                        setShowTagMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                      <span>{t.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Email HTML Body content */}
        <div className="pt-3 border-t border-slate-200">
          <div
            className="prose prose-sm max-w-none text-slate-800 leading-relaxed space-y-3"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        </div>

        {/* Sent Replies Thread */}
        {email.sentReplies && email.sentReplies.length > 0 && (
          <div className="pt-4 border-t border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-purple-600" />
                <span>Dispatched Replies ({email.sentReplies.length}) &bull; Sent from support@akaar.com</span>
              </h4>
              <span className="text-[10px] text-purple-600 font-medium bg-purple-100 px-2 py-0.5 rounded-full">
                Saved in Sent Messages
              </span>
            </div>
            <div className="space-y-2.5">
              {email.sentReplies.map((reply) => (
                <div key={reply.id} className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-purple-900 font-mono">
                    <div>
                      <span className="font-bold">From:</span> {reply.from} &rarr; <span className="font-bold">To:</span> {reply.to}
                      {reply.cc && <span className="text-purple-600"> (Cc: {reply.cc})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-sans font-semibold">
                        ✓ Dispatched from support@akaar.com
                      </span>
                      <span className="text-slate-500">{new Date(reply.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="text-slate-800 whitespace-pre-line bg-white/90 p-2.5 rounded-lg border border-purple-100">
                    {reply.bodyText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Composer Section */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          {/* Always-visible or interactive recipient routing selector */}
          <ClientRecipientSelector
            email={email}
            targetInfo={targetInfo}
            target={targetInfo}
            recipientMode={recipientMode}
            onSelectMode={setRecipientMode}
            knownClients={knownClients}
            selectedBoxClient={selectedBoxClient}
            onSelectBoxClient={setSelectedBoxClient}
            customEmail={customRecipientEmail}
            onChangeCustomEmail={setCustomRecipientEmail}
            onCustomEmailChange={setCustomRecipientEmail}
            userEmail={actualUserEmail}
            ccMyEmail={ccMyEmail}
            onToggleCcMyEmail={() => setCcMyEmail(!ccMyEmail)}
          />

          {!isReplying ? (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Ready to send real email via <strong className="text-indigo-800">FormSubmit Tool</strong> from <strong className="text-emerald-700">support@akaar.com</strong> to:
                </span>
                <span className="text-xs font-mono text-indigo-700">
                  {effectiveRecipient.name} &lt;{effectiveRecipient.email}&gt;
                </span>
                {effectiveRecipient.isBypassingIntake && (
                  <span className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Bypasses intake address ({targetInfo.inboundSenderEmail})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReplying(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Reply className="w-4 h-4" />
                  <span>Open FormSubmit Composer</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOpenSendConfirmation} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Reply className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Replying to: <strong className="text-indigo-900">{effectiveRecipient.name}</strong></span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                    {effectiveRecipient.typeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 font-semibold px-2 py-0.5 rounded">
                    From: support@akaar.com
                  </span>
                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Tool: FormSubmit.co
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReplying(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                  >
                    Close
                  </button>
                </div>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Write your direct reply from support@akaar.com to ${effectiveRecipient.name}...`}
                rows={6}
                className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-700 font-mono flex items-center gap-1">
                    <span className="font-bold text-slate-900">Recipient Box:</span>
                    <span className="text-indigo-700 font-semibold">{effectiveRecipient.email}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">Sender Shown: support@akaar.com</span>
                    {ccMyEmail && <span>&bull; Cc: {actualUserEmail}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {replySuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivered via FormSubmit from support@akaar.com!
                    </span>
                  )}

                  {/* FormSubmit Tool Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>FormSubmit Tool (support@akaar.com)</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText.trim() || replySuccess || isSubmittingAction}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via FormSubmit (support@akaar.com)</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Safety Confirmation Modal: Delete / Trash Email */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        type="delete"
        title="Move Email to Trash"
        description={`Are you sure you want to move this message from "${email.senderName}" to the Trash? This will remove it from your primary inbox.`}
        details={[
          { label: 'Subject', value: email.subject },
          { label: 'Sender', value: `${email.senderName} (${email.senderEmail})` },
          { label: 'Category', value: email.category },
        ]}
        confirmText="Move to Trash"
        confirmLoading={isSubmittingAction}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Safety Confirmation Modal: Sending Email Reply with Direct Routing */}
      <ConfirmationModal
        isOpen={showSendConfirm}
        type="send_email"
        title="Send Real Email via FormSubmit Tool"
        description="Review the delivery parameters before sending directly to the recipient mailbox:"
        details={[
          { label: 'Sender Shown (From)', value: 'Akaar Support <support@akaar.com>' },
          { label: 'Recipient Box (To)', value: `${effectiveRecipient.name} <${effectiveRecipient.email}>` },
          { label: 'Delivery Tool', value: 'FormSubmit.co Tool (Real Inbox Delivery, No External Redirect)' },
          { label: 'Dispatch Route', value: effectiveRecipient.typeLabel },
          ...(effectiveRecipient.email !== targetInfo.inboundSenderEmail ? [
            { label: 'Bypassed Inbound Sender', value: `${targetInfo.inboundSenderEmail} [Direct to client box]` },
          ] : []),
          ...(ccMyEmail ? [
            { label: 'CC (Self-Delivery)', value: `${actualUserEmail}` },
          ] : []),
          { label: 'Subject', value: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}` },
          { label: 'Message Preview', value: replyText.slice(0, 160) + (replyText.length > 160 ? '...' : '') },
        ]}
        confirmText="Dispatch Email via FormSubmit"
        confirmLoading={isSubmittingAction}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowSendConfirm(false)}
      />
    </div>
  );
}
