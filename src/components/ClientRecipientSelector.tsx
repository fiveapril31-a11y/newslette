import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Mail,
  Inbox,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Check,
  ChevronDown,
  Building,
  Shield,
  Send,
  Edit3
} from 'lucide-react';
import { EmailItem } from '../types';
import { ClientInBox, ResolvedEmailTarget } from '../utils/clientEmailResolver';

export type RecipientMode =
  | 'client_direct'
  | 'my_box'
  | 'box_directory'
  | 'inbound_sender'
  | 'custom';

interface ClientRecipientSelectorProps {
  email?: EmailItem;
  targetInfo?: ResolvedEmailTarget;
  target?: ResolvedEmailTarget;
  knownClients: ClientInBox[];
  userEmail: string;
  recipientMode: RecipientMode;
  onSelectMode: (mode: RecipientMode) => void;
  selectedBoxClient: ClientInBox | null;
  onSelectBoxClient: (client: ClientInBox | null) => void;
  customEmail: string;
  onChangeCustomEmail?: (email: string) => void;
  onCustomEmailChange?: (email: string) => void;
  ccMyEmail: boolean;
  onToggleCcMyEmail: (val: boolean) => void;
}

export const ClientRecipientSelector: React.FC<ClientRecipientSelectorProps> = ({
  email,
  targetInfo,
  target,
  knownClients,
  userEmail,
  recipientMode,
  onSelectMode,
  selectedBoxClient,
  onSelectBoxClient,
  customEmail,
  onChangeCustomEmail,
  onCustomEmailChange,
  ccMyEmail,
  onToggleCcMyEmail,
}) => {
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const handleCustomEmailChange = (val: string) => {
    if (onChangeCustomEmail) onChangeCustomEmail(val);
    if (onCustomEmailChange) onCustomEmailChange(val);
  };

  const safeTargetInfo: ResolvedEmailTarget = targetInfo || target || {
    clientName: email?.brandMeta?.contactPerson || email?.senderName || 'Client in Box',
    clientEmail: email?.brandMeta?.clientEmail || email?.senderEmail || '',
    hasDirectClient: Boolean(email?.brandMeta?.clientEmail),
    myBoxEmail: userEmail || 'support@akaar.com',
    inboundSenderEmail: email?.senderEmail || '',
    inboundSenderName: email?.senderName || '',
    isInboundIntakeAddress: false,
  };

  // Filter clients in box
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return knownClients;
    const q = clientSearchQuery.toLowerCase();
    return knownClients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.clientEmail.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.service && c.service.toLowerCase().includes(q))
    );
  }, [knownClients, clientSearchQuery]);

  const effectiveEmail = useMemo(() => {
    if (recipientMode === 'client_direct') return safeTargetInfo.clientEmail;
    if (recipientMode === 'my_box') return userEmail;
    if (recipientMode === 'box_directory') return selectedBoxClient?.clientEmail || safeTargetInfo.clientEmail;
    if (recipientMode === 'inbound_sender') return safeTargetInfo.inboundSenderEmail;
    return customEmail || safeTargetInfo.clientEmail;
  }, [recipientMode, safeTargetInfo, userEmail, selectedBoxClient, customEmail]);

  const effectiveName = useMemo(() => {
    if (recipientMode === 'client_direct') return safeTargetInfo.clientName;
    if (recipientMode === 'my_box') return 'My Email Address';
    if (recipientMode === 'box_directory') return selectedBoxClient?.clientName || safeTargetInfo.clientName;
    if (recipientMode === 'inbound_sender') return safeTargetInfo.inboundSenderName;
    return 'Custom Recipient';
  }, [recipientMode, safeTargetInfo, selectedBoxClient]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
      {/* Header with Title & Route Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Send className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Automated Email Dispatch Target
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Direct Routing
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Send directly to client name in your box or to your email address — not to the incoming intake address.
            </p>
          </div>
        </div>

        {/* Selected Summary Pill */}
        <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="text-slate-400 font-medium">To:</span>
          <span className="font-bold text-slate-800">{effectiveName}</span>
          <span className="font-mono text-slate-500 text-[11px]">({effectiveEmail})</span>
        </div>
      </div>

      {/* Intake / Forwarder Warning Banner if applicable */}
      {safeTargetInfo.isInboundIntakeAddress && (
        <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Inbound Intake / Form Address Detected:</span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              This message arrived through <span className="font-mono font-semibold">{safeTargetInfo.inboundSenderEmail}</span> (intake form), but the actual client named in your box is <span className="font-semibold underline">{safeTargetInfo.clientName}</span> (<span className="font-mono">{safeTargetInfo.clientEmail}</span>). Routing automated emails directly to the client prevents delivery failures.
            </p>
          </div>
        </div>
      )}

      {/* 4 Dispatch Route Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Option 1: Direct Client Mail (having client name in box) */}
        <button
          type="button"
          onClick={() => onSelectMode('client_direct')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
            recipientMode === 'client_direct'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {recipientMode === 'client_direct' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Client in Box</span>
            </div>
            <div className="text-xs font-bold text-emerald-950 truncate">
              {safeTargetInfo.clientName}
            </div>
            <div className="text-[11px] font-mono text-slate-600 truncate">
              {safeTargetInfo.clientEmail}
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-emerald-700 font-medium">
            ✓ Client named in message/box
          </div>
        </button>

        {/* Option 2: To My Email Address (in my email address box) */}
        <button
          type="button"
          onClick={() => onSelectMode('my_box')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
            recipientMode === 'my_box'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {recipientMode === 'my_box' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Inbox className="w-3.5 h-3.5 text-indigo-600" />
              <span>To My Email Address</span>
            </div>
            <div className="text-xs font-bold text-indigo-950 truncate">
              My Personal Mailbox
            </div>
            <div className="text-[11px] font-mono text-slate-600 truncate">
              {userEmail}
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-indigo-700 font-medium">
            ✓ Sent directly into your box
          </div>
        </button>

        {/* Option 3: Pick Any Client from My Box Directory */}
        <div className="relative flex flex-col">
          <button
            type="button"
            onClick={() => {
              onSelectMode('box_directory');
              setShowClientDropdown(!showClientDropdown);
            }}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between h-full ${
              recipientMode === 'box_directory'
                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {recipientMode === 'box_directory' && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Clients in My Box ({knownClients.length})</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xs font-bold text-blue-950 truncate">
                {selectedBoxClient ? selectedBoxClient.clientName : 'Select from Box Directory...'}
              </div>
              <div className="text-[11px] font-mono text-slate-600 truncate">
                {selectedBoxClient ? selectedBoxClient.clientEmail : 'Browse all clients'}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-blue-700 font-medium">
              ✓ Client bills & email ledger
            </div>
          </button>

          {/* Searchable Clients In Box Dropdown Menu */}
          {showClientDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  placeholder="Search client name or email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto flex-1 space-y-1 divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No matching client in box found.
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedBoxClient?.id === client.id;
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          onSelectBoxClient(client);
                          onSelectMode('box_directory');
                          setShowClientDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {client.clientName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate">
                            {client.clientEmail}
                          </div>
                          {client.company && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building className="w-2.5 h-2.5" />
                              <span>{client.company}</span>
                              {client.service && <span>• {client.service}</span>}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium shrink-0">
                          {client.source === 'Client Bills Ledger' ? 'Bills' : 'Email'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Option 4: Inbound Sender Address (From which email was received) */}
        <button
          type="button"
          onClick={() => onSelectMode('inbound_sender')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
            recipientMode === 'inbound_sender'
              ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {recipientMode === 'inbound_sender' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Inbound Address</span>
            </div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {safeTargetInfo.inboundSenderName}
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate">
              {safeTargetInfo.inboundSenderEmail}
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 font-medium">
            {safeTargetInfo.isInboundIntakeAddress
              ? '⚠️ Form intake address'
              : 'Sender who emailed you'}
          </div>
        </button>
      </div>

      {/* Bottom Bar: CC to My Email Address Checkbox & Custom Email Input */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={ccMyEmail}
            onChange={(e) => onToggleCcMyEmail(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span>
            Also send copy directly to my email address (
            <span className="font-mono font-medium text-slate-800">{userEmail}</span>)
          </span>
        </label>

        {recipientMode === 'custom' ? (
          <div className="flex items-center gap-1.5">
            <input
              type="email"
              value={customEmail}
              onChange={(e) => handleCustomEmailChange(e.target.value)}
              placeholder="Enter direct client email..."
              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => onSelectMode('client_direct')}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSelectMode('custom')}
            className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Enter other custom direct email</span>
          </button>
        )}
      </div>
    </div>
  );
};
