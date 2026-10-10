import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  IndianRupee,
  Upload,
  FileText,
  Download,
  Smartphone,
  Laptop,
  CheckCheck,
  Building2,
  Clock,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import {
  subscribeToChatMessages,
  sendChatMessage,
  subscribeToClientBills,
  getDeviceIdentifier,
} from '../services/firebaseSync';
import { ChatMessage, ClientBill } from '../types';

interface RealtimeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUploadBill: () => void;
  userDisplayName?: string;
  userEmail?: string;
}

export const RealtimeChatModal: React.FC<RealtimeChatModalProps> = ({
  isOpen,
  onClose,
  onOpenUploadBill,
  userDisplayName = 'Akaar Team',
  userEmail = 'support@akaar.com',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bills, setBills] = useState<ClientBill[]>([]);
  const [activeView, setActiveView] = useState<'chat' | 'bills'>('chat');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [senderName, setSenderName] = useState<string>(userDisplayName);
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const myDevice = getDeviceIdentifier();

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!isOpen) return;

    const unsubChat = subscribeToChatMessages((incoming) => {
      setMessages(incoming);
    });

    const unsubBills = subscribeToClientBills((incomingBills) => {
      setBills(incomingBills);
    });

    return () => {
      unsubChat();
      unsubBills();
    };
  }, [isOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      await sendChatMessage({
        senderName: senderName.trim() || 'Akaar Team',
        senderEmail: userEmail,
        text: textToSend,
        device: myDevice,
      });
    } catch (err) {
      console.error('Failed to send chat message', err);
    } finally {
      setIsSending(false);
    }
  };

  const totalBilledRupees = bills.reduce((acc, curr) => acc + (curr.billAmount || 0), 0);

  const handleDownloadFile = (fileName: string, fileData?: string) => {
    if (!fileData) {
      alert('Digital bill file record.');
      return;
    }
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName || 'Client_Bill.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="realtime-chat-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="realtime-chat-modal"
        className="bg-white rounded-2xl max-w-2xl w-full h-[85vh] sm:h-[80vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold leading-tight">Akaar Real-Time Team Chat</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Multi-Device Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Messages and bills sync instantly across mobile, tablet, and PC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher: Live Chat vs Client Bills Ledger */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-lg">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Team Chat ({messages.length})</span>
            </button>

            <button
              onClick={() => setActiveView('bills')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeView === 'bills'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Client Bills & Invoices ({bills.length})</span>
            </button>
          </div>

          <button
            onClick={onOpenUploadBill}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Bill</span>
          </button>
        </div>

        {/* Main Body View */}
        {activeView === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6 stroke-1" />
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">No chat messages yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Type a message below or upload a client bill. When opened on your phone or other device, everything syncs live in real-time!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderName === senderName;
                  const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Sender metadata */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                        <span className="font-semibold text-slate-700">{msg.senderName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[10px]">
                          {msg.device?.toLowerCase().includes('phone') ||
                          msg.device?.toLowerCase().includes('android') ||
                          msg.device?.toLowerCase().includes('ios') ? (
                            <Smartphone className="w-2.5 h-2.5" />
                          ) : (
                            <Laptop className="w-2.5 h-2.5" />
                          )}
                          <span>{msg.device || 'Device'}</span>
                        </span>
                        <span>•</span>
                        <span>{timeFormatted}</span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {/* Bill Attachment inside message */}
                        {msg.hasBill && msg.billData && (
                          <div
                            className={`mt-2.5 p-3 rounded-xl border ${
                              isMe
                                ? 'bg-indigo-700/60 border-indigo-400/40 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            } space-y-1.5`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{msg.billData.clientName}</span>
                              </div>
                              <span className="font-extrabold text-sm text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                                ₹{msg.billData.billAmount.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] opacity-80">
                              <span>Invoice: {msg.billData.invoiceNumber}</span>
                              {msg.billData.service && <span>{msg.billData.service}</span>}
                            </div>

                            {msg.billData.fileUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadFile(
                                    msg.billData?.fileName || 'Bill.pdf',
                                    msg.billData?.fileUrl
                                  )
                                }
                                className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download {msg.billData.fileName || 'Invoice File'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                  <span>Chatting as:</span>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                    <Laptop className="w-3 h-3" />
                    <span>{myDevice}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenUploadBill}
                    title="Upload client bill & share in chat"
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a team message (syncs to other devices in real time)..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Client Bills Ledger View */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {/* Total summary banner */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Uploaded Billed Revenue</p>
                <p className="text-xl font-extrabold text-emerald-700">
                  ₹{totalBilledRupees.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={onOpenUploadBill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Bill</span>
              </button>
            </div>

            {/* Bills List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bills.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                  <p className="font-semibold text-slate-700 text-sm">No client bills uploaded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click &apos;Upload Bill&apos; to attach client invoices and commercial contracts. They will sync to all devices instantly!
                  </p>
                </div>
              ) : (
                bills.map((bill) => {
                  const dateStr = new Date(bill.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={bill.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-900 text-sm">{bill.clientName}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {bill.invoiceNumber}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                          ₹{bill.billAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {bill.service}
                        </span>
                        {bill.clientEmail && (
                          <span className="text-slate-500">{bill.clientEmail}</span>
                        )}
                        <span className="text-slate-400 ml-auto">{dateStr}</span>
                      </div>

                      {bill.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {bill.notes}
                        </p>
                      )}

                      {bill.fileName && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{bill.fileName}</span>
                            <span className="text-slate-400">({bill.fileSize || 'Doc'})</span>
                          </span>

                          <button
                            onClick={() => handleDownloadFile(bill.fileName || 'Bill.pdf', bill.fileData)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
