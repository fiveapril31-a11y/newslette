/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, type MouseEvent } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import CustomFilterModal from './components/CustomFilterModal';
import NewFolderModal from './components/NewFolderModal';
import RealtimeNotificationToast from './components/RealtimeNotificationToast';
import { LoginHelpModal } from './components/LoginHelpModal';
import { SmartAnalysisModal } from './components/SmartAnalysisModal';
import { RealtimeChatModal } from './components/RealtimeChatModal';
import { UploadBillModal } from './components/UploadBillModal';
import InboundGatewayModal from './components/InboundGatewayModal';
import PublicQueryPortalModal from './components/PublicQueryPortalModal';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import BillingVaultView from './components/BillingVaultView';
import { RotateCcw, Undo2 } from 'lucide-react';
import { fetchInboundEmails } from './services/inboundGateway';
import { analyzeAndSeparateEmails } from './services/emailAnalyzer';
import {
  USER_EMAIL,
  INITIAL_FOLDERS,
  INITIAL_SMART_TAGS,
  INITIAL_CUSTOM_FILTERS,
  INITIAL_EMAILS,
} from './data/studioData';
import {
  EmailItem,
  FolderItem,
  SmartTag,
  CustomFilterRule,
  RealtimeAlertItem,
  InboxFocusMode,
  EmailCategory,
  SentReplyRecord,
} from './types';
import { playNotificationChime } from './utils/audioAlert';
import { parseSearchQuery, filterEmailsByQuery } from './utils/searchParser';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/gmailAuth';
import {
  fetchGmailInbox,
  trashGmailMessage,
  starGmailMessage,
  markMessageAsRead,
  sendGmailReply,
} from './services/gmailApi';
import { sendDirectCrmEmail } from './services/mailDispatcher';

const CLEAN_STATE_FLAG_KEY = 'akaar_clean_first_use_v6';
const CRM_UNDO_BACKUP_KEY = 'akaar_crm_undo_backup';

export default function App() {
  // Undo & Clean State Management
  const [undoBackup, setUndoBackup] = useState<EmailItem[] | null>(() => {
    try {
      const backupRaw = localStorage.getItem(CRM_UNDO_BACKUP_KEY);
      return backupRaw ? JSON.parse(backupRaw) : null;
    } catch {
      return null;
    }
  });

  const [showResetUndoBanner, setShowResetUndoBanner] = useState<boolean>(() => {
    const hasCleaned = localStorage.getItem(CLEAN_STATE_FLAG_KEY);
    const existing = localStorage.getItem('akaar_inbox_emails');
    return !hasCleaned && !!existing;
  });

  // Application Data States - initial clean state for 1st time use
  const [emails, setEmails] = useState<EmailItem[]>(() => {
    const hasAppliedCleanSlate = localStorage.getItem(CLEAN_STATE_FLAG_KEY);
    const saved = localStorage.getItem('akaar_inbox_emails');

    // First time use cleanup: backup whatever was previously stored so user can UNDO, then reset all to 0!
    if (!hasAppliedCleanSlate) {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(CRM_UNDO_BACKUP_KEY, saved);
          }
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.setItem(CLEAN_STATE_FLAG_KEY, 'true');
      localStorage.setItem('akaar_inbox_emails', JSON.stringify([]));
      return [];
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((e) => !e.id.startsWith('email-'));
        }
      } catch (e) {
        console.error('Failed to parse saved emails', e);
      }
    }
    return INITIAL_EMAILS;
  });

  const [folders, setFolders] = useState<FolderItem[]>(() => {
    const saved = localStorage.getItem('akaar_inbox_folders');
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  const [smartTags, setSmartTags] = useState<SmartTag[]>(() => {
    const saved = localStorage.getItem('akaar_inbox_tags');
    return saved ? JSON.parse(saved) : INITIAL_SMART_TAGS;
  });

  const [filterRules, setFilterRules] = useState<CustomFilterRule[]>(() => {
    const saved = localStorage.getItem('akaar_inbox_filter_rules');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOM_FILTERS;
  });

  const [alerts, setAlerts] = useState<RealtimeAlertItem[]>([]);

  // Real-Time Gmail Connection State
  const [isConnectedGmail, setIsConnectedGmail] = useState<boolean>(false);
  const [isSyncingGmail, setIsSyncingGmail] = useState<boolean>(false);
  const [isAuthenticatingGmail, setIsAuthenticatingGmail] = useState<boolean>(false);
  const [actualConnectedEmail, setActualConnectedEmail] = useState<string | null>(null);
  const [userGooglePhoto, setUserGooglePhoto] = useState<string | null>(null);
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<'dashboard' | 'mailbox' | 'billing' | 'chat'>('dashboard');

  // UI Navigation States
  const [activeFolderId, setActiveFolderId] = useState<string>('inbox');
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusMode, setFocusMode] = useState<InboxFocusMode>('clean_work'); // Default: Clean Work Inbox
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | EmailCategory | 'high_value' | 'unread' | 'starred'>('all');

  // Modals & Sound States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [isFilterRulesModalOpen, setIsFilterRulesModalOpen] = useState<boolean>(false);
  const [isLoginHelpOpen, setIsLoginHelpOpen] = useState<boolean>(false);
  const [isSmartAnalysisOpen, setIsSmartAnalysisOpen] = useState<boolean>(false);
  const [isRealtimeChatOpen, setIsRealtimeChatOpen] = useState<boolean>(false);
  const [isUploadBillOpen, setIsUploadBillOpen] = useState<boolean>(false);
  const [isInboundGatewayOpen, setIsInboundGatewayOpen] = useState<boolean>(false);
  const [isPublicPortalOpen, setIsPublicPortalOpen] = useState<boolean>(false);
  const [currentToastAlert, setCurrentToastAlert] = useState<RealtimeAlertItem | null>(null);

  // Auto-open public query portal if URL has ?portal=inbound
  useEffect(() => {
    if (window.location.search.includes('portal=inbound') || window.location.search.includes('view=portal')) {
      setIsPublicPortalOpen(true);
    }
  }, []);

  // Periodically check for incoming emails to support@akaar.com from the gateway
  useEffect(() => {
    const checkInboundGateway = async () => {
      try {
        const queued = await fetchInboundEmails();
        if (queued && queued.length > 0) {
          setEmails((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEmails = queued.filter((e) => !existingIds.has(e.id));
            if (newEmails.length === 0) return prev;

            if (soundEnabled) {
              playNotificationChime();
            }

            const latest = newEmails[0];
            setCurrentToastAlert({
              id: `alert-inbound-${Date.now()}`,
              emailId: latest.id,
              title: `Incoming Email (${latest.recipientEmail || 'service@akaarentertainment.com'}): ${latest.subject}`,
              sender: latest.senderName,
              timestamp: latest.receivedAt,
              category: latest.category,
              budget: latest.brandMeta?.budgetOffer,
              read: false,
            });

            const merged = [...newEmails, ...prev];
            localStorage.setItem('akaar_inbox_emails', JSON.stringify(merged));
            return merged;
          });
        }
      } catch {
        // background sync silence
      }
    };

    const timer = setInterval(checkInboundGateway, 3000);
    checkInboundGateway();

    return () => clearInterval(timer);
  }, [soundEnabled]);

  // Save changes to LocalStorage for persistent CRM records across sessions
  useEffect(() => {
    localStorage.setItem('akaar_inbox_emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem('akaar_inbox_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('akaar_inbox_tags', JSON.stringify(smartTags));
  }, [smartTags]);

  useEffect(() => {
    localStorage.setItem('akaar_inbox_filter_rules', JSON.stringify(filterRules));
  }, [filterRules]);

  // Sync real-time Gmail inbox
  const syncGmailInbox = useCallback(
    async (tokenToUse?: string) => {
      const activeToken = tokenToUse || gmailAccessToken;
      if (!activeToken) return;

      setIsSyncingGmail(true);
      setSyncError(null);
      try {
        const liveMessages = await fetchGmailInbox(activeToken, 30);
        if (liveMessages && liveMessages.length > 0) {
          // Apply custom filter rules
          const processed = liveMessages.map((item) => {
            let curr = item;
            for (const rule of filterRules) {
              curr = applyRuleToEmail(curr, rule);
            }
            return curr;
          });

          setEmails(processed);
          setIsCloudSynced(true);

          // Update alerts with live brand queries and newsletters
          const newAlerts: RealtimeAlertItem[] = [];
          processed.forEach((msg) => {
            if (msg.category === 'brand_query' || msg.category === 'newsletter') {
              newAlerts.push({
                id: `alert_${msg.id}`,
                emailId: msg.id,
                title: msg.subject,
                sender: msg.senderName,
                timestamp: msg.receivedAt,
                category: msg.category,
                budget: msg.brandMeta?.budgetOffer,
                read: msg.read,
              });
            }
          });

          if (newAlerts.length > 0) {
            setAlerts(newAlerts.slice(0, 10));
          }

          if (!selectedEmailId || !processed.some((e) => e.id === selectedEmailId)) {
            setSelectedEmailId(processed[0]?.id || null);
          }
        }
      } catch (err: any) {
        console.error('Error fetching real-time Gmail inbox:', err);
        setSyncError(err.message || 'Failed to sync Gmail inbox. Please check permissions.');
      } finally {
        setIsSyncingGmail(false);
      }
    },
    [gmailAccessToken, filterRules, selectedEmailId]
  );

  // Initialize Firebase Auth listener on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setGmailAccessToken(token);
        setIsConnectedGmail(true);
        setActualConnectedEmail(user.email);
        setUserGooglePhoto(user.photoURL);
        await syncGmailInbox(token);
      },
      () => {
        setIsConnectedGmail(false);
        setGmailAccessToken(null);
        setActualConnectedEmail(null);
        setUserGooglePhoto(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [syncGmailInbox]);

  // Pipeline Metric Calculation in Rupees
  const brandOffersTotal = useMemo(() => {
    return emails.reduce((sum, email) => {
      if (email.category === 'brand_query' && email.brandMeta?.budgetOffer) {
        const num = parseInt(email.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) return sum + num;
      }
      return sum;
    }, 0);
  }, [emails]);

  const personalCount = useMemo(() => {
    return emails.filter((e) => e.category === 'personal').length;
  }, [emails]);

  const brandsCount = useMemo(() => {
    return emails.filter((e) => e.category === 'brand_query').length;
  }, [emails]);

  const newslettersCount = useMemo(() => {
    return emails.filter((e) => e.category === 'newsletter').length;
  }, [emails]);

  // Folder and Tag Counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => {
      if (f.id === 'inbox') {
        counts[f.id] = emails.filter((e) => e.folderId !== 'trash' && e.folderId !== 'archive').length;
      } else {
        counts[f.id] = emails.filter((e) => e.folderId === f.id).length;
      }
    });
    return counts;
  }, [folders, emails]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    smartTags.forEach((t) => {
      counts[t.name] = emails.filter((e) => e.tags.includes(t.name)).length;
    });
    return counts;
  }, [smartTags, emails]);

  // Apply automated filter rule to an email
  function applyRuleToEmail(email: EmailItem, rule: CustomFilterRule): EmailItem {
    if (!rule.isActive) return email;

    let matches = false;
    const lowerValue = rule.value.toLowerCase();

    if (rule.field === 'sender') {
      const senderString = `${email.senderName} ${email.senderEmail}`.toLowerCase();
      matches = rule.operator === 'contains'
        ? senderString.includes(lowerValue)
        : rule.operator === 'starts_with'
        ? senderString.startsWith(lowerValue)
        : senderString === lowerValue;
    } else if (rule.field === 'subject') {
      const sub = email.subject.toLowerCase();
      matches = rule.operator === 'contains'
        ? sub.includes(lowerValue)
        : rule.operator === 'starts_with'
        ? sub.startsWith(lowerValue)
        : sub === lowerValue;
    } else if (rule.field === 'body') {
      const body = email.preview.toLowerCase();
      matches = body.includes(lowerValue);
    } else if (rule.field === 'type') {
      matches = email.category.toLowerCase() === lowerValue;
    } else if (rule.field === 'budget') {
      if (email.brandMeta?.budgetOffer) {
        const num = parseInt(email.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10);
        const targetNum = parseInt(lowerValue.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && !isNaN(targetNum)) {
          matches = rule.operator === 'greater_than' ? num >= targetNum : num === targetNum;
        }
      }
    }

    if (!matches) return email;

    const updated = { ...email };
    if (rule.action === 'move_to_folder') {
      updated.folderId = rule.actionTarget;
    } else if (rule.action === 'assign_tag') {
      if (!updated.tags.includes(rule.actionTarget)) {
        updated.tags = [...updated.tags, rule.actionTarget];
      }
    } else if (rule.action === 'isolate_personal') {
      updated.category = 'personal';
      updated.folderId = 'personal_vault';
    }
    return updated;
  }

  // Filter Emails according to Search, Folder, Tag, and Focus Mode
  const displayedEmails = useMemo(() => {
    let result = [...emails];

    // 1. Separation / Focus Mode Filter:
    if (focusMode === 'clean_work') {
      // Separates all newsletters and brand queries from personal correspondence for a clean, focused inbox
      result = result.filter((e) => e.category === 'brand_query' || e.category === 'newsletter');
    } else if (focusMode === 'personal_only') {
      result = result.filter((e) => e.category === 'personal');
    }

    // 2. Folder Filter (if not clicking a global tag)
    if (!activeTagId) {
      if (activeFolderId === 'inbox') {
        result = result.filter((e) => e.folderId !== 'trash' && e.folderId !== 'archive');
      } else {
        result = result.filter((e) => e.folderId === activeFolderId);
      }
    }

    // 3. Tag Filter
    if (activeTagId) {
      result = result.filter((e) => e.tags.includes(activeTagId));
    }

    // 4. Smart Search with complex criteria
    if (searchQuery.trim()) {
      const parsed = parseSearchQuery(searchQuery);
      result = filterEmailsByQuery(result, parsed);
    }

    return result;
  }, [emails, focusMode, activeFolderId, activeTagId, searchQuery]);

  // Selected Email item
  const selectedEmail = useMemo(() => {
    if (!selectedEmailId) return displayedEmails[0] || null;
    return emails.find((e) => e.id === selectedEmailId) || displayedEmails[0] || null;
  }, [emails, selectedEmailId, displayedEmails]);

  // Real Gmail Auth Handlers
  const handleLoginGmail = async (preferredEmail = USER_EMAIL) => {
    if (isAuthenticatingGmail) {
      return;
    }

    setIsAuthenticatingGmail(true);
    setSyncError(null);
    try {
      const res = await googleSignIn(preferredEmail);
      if (res.success && res.accessToken && res.user) {
        setGmailAccessToken(res.accessToken);
        setIsConnectedGmail(true);
        setActualConnectedEmail(res.user.email);
        setUserGooglePhoto(res.user.photoURL);
        setIsLoginHelpOpen(false);
        await syncGmailInbox(res.accessToken);
      } else if (res.blocked) {
        setSyncError(
          'Pop-up window was blocked by your browser. Please allow pop-ups or click "Open in New Tab" for direct sign-in.'
        );
        setIsLoginHelpOpen(true);
      } else if (res.cancelled) {
        setSyncError(
          'Sign-in was closed before completing. If you saw the verification warning, follow the 4 simple steps to connect.'
        );
        setIsLoginHelpOpen(true);
      } else if (res.error) {
        setSyncError(res.error);
        setIsLoginHelpOpen(true);
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Google sign in failed. Please open in a new tab.');
      setIsLoginHelpOpen(true);
    } finally {
      setIsAuthenticatingGmail(false);
    }
  };

  const handleSwitchAccount = async () => {
    await handleLoginGmail(USER_EMAIL);
  };

  const handleLogoutGmail = async () => {
    try {
      await logout();
      setIsConnectedGmail(false);
      setGmailAccessToken(null);
      setActualConnectedEmail(null);
      setUserGooglePhoto(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleResetAllToZero = useCallback(() => {
    // Save current state into undo backup if there are emails
    if (emails.length > 0) {
      localStorage.setItem(CRM_UNDO_BACKUP_KEY, JSON.stringify(emails));
      setUndoBackup(emails);
    }
    setEmails([]);
    setSelectedEmailId(null);
    setAlerts([]);
    setIsCloudSynced(false);
    localStorage.setItem('akaar_inbox_emails', JSON.stringify([]));
    setShowResetUndoBanner(true);
    setCurrentToastAlert({
      id: `toast-reset-${Date.now()}`,
      emailId: '',
      title: 'All CRM records, pipeline deals & values reset to 0.',
      sender: 'Studio Administration',
      timestamp: new Date().toISOString(),
      category: 'brand_query',
      read: true,
    });
  }, [emails]);

  const handleUndo = useCallback(() => {
    try {
      const backupRaw = localStorage.getItem(CRM_UNDO_BACKUP_KEY);
      const backupToRestore = undoBackup || (backupRaw ? JSON.parse(backupRaw) : null);
      if (Array.isArray(backupToRestore) && backupToRestore.length > 0) {
        const currentToSwap = emails;
        setEmails(backupToRestore);
        setSelectedEmailId(backupToRestore[0]?.id || null);
        localStorage.setItem('akaar_inbox_emails', JSON.stringify(backupToRestore));

        if (currentToSwap.length > 0) {
          localStorage.setItem(CRM_UNDO_BACKUP_KEY, JSON.stringify(currentToSwap));
          setUndoBackup(currentToSwap);
        } else {
          setUndoBackup(null);
          localStorage.removeItem(CRM_UNDO_BACKUP_KEY);
        }
        setShowResetUndoBanner(false);
        setCurrentToastAlert({
          id: `toast-undo-${Date.now()}`,
          emailId: backupToRestore[0]?.id || '',
          title: `Restored ${backupToRestore.length} previous records successfully!`,
          sender: 'Studio Administration',
          timestamp: new Date().toISOString(),
          category: 'brand_query',
          read: true,
        });
      }
    } catch (err) {
      console.error('Failed to undo / restore data:', err);
    }
  }, [emails, undoBackup]);

  const handleResetToStudioData = handleResetAllToZero;

  const handleUpdateEmailStage = useCallback((emailId: string, newStage: 'New Lead' | 'In Discussion' | 'Confirmed' | 'Completed') => {
    setEmails((prev) =>
      prev.map((email) => {
        if (email.id === emailId) {
          return {
            ...email,
            brandMeta: {
              ...(email.brandMeta || { brandName: email.senderName }),
              status: newStage,
            },
          };
        }
        return email;
      })
    );
  }, []);

  const handleAddNewDeal = useCallback((dealData: {
    clientName: string;
    clientEmail: string;
    brandName: string;
    budget: number;
    service: string;
    subject: string;
    deliverables: string;
  }) => {
    const newDealId = `deal-${Date.now()}`;
    const newEmailItem: EmailItem = {
      id: newDealId,
      senderName: dealData.clientName,
      senderEmail: dealData.clientEmail,
      recipientEmail: USER_EMAIL,
      subject: dealData.subject,
      preview: `Commercial proposal & deliverables for ${dealData.clientName}. Scope: ${dealData.deliverables}`,
      bodyHtml: `<p>Dear ${dealData.clientName} Team,</p>
<p>Thank you for connecting with Akaar Entertainment regarding our <strong>${dealData.service}</strong> capabilities.</p>
<p><strong>Deliverables:</strong> ${dealData.deliverables}</p>
<p><strong>Commercial Fee:</strong> ₹${dealData.budget.toLocaleString('en-IN')}</p>
<p>Best regards,<br/><strong>Akaar Entertainment Team</strong><br/>service@akaarentertainment.com</p>`,
      receivedAt: new Date().toISOString(),
      read: true,
      starred: true,
      category: 'brand_query',
      folderId: 'brand_deals',
      tags: dealData.budget >= 50000 ? ['High Value (₹50k+)', 'Sponsorship Pitch'] : ['Sponsorship Pitch'],
      brandMeta: {
        brandName: dealData.brandName,
        budgetOffer: `₹${dealData.budget.toLocaleString('en-IN')}`,
        budgetNumeric: dealData.budget,
        serviceOpted: dealData.service,
        clientEmail: dealData.clientEmail,
        deliverables: dealData.deliverables,
        status: 'New Lead',
        urgency: 'high',
      },
    };

    setEmails((prev) => [newEmailItem, ...prev]);
    setSelectedEmailId(newDealId);
  }, []);

  // Email Actions
  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmailId(email.id);
    if (!email.read) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
      );
      if (isConnectedGmail && gmailAccessToken && email.id.length > 10) {
        markMessageAsRead(gmailAccessToken, email.id, true).catch(console.error);
      }
    }
  };

  const handleToggleStar = async (emailId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const current = emails.find((item) => item.id === emailId);
    const newStarred = current ? !current.starred : true;

    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, starred: newStarred } : item))
    );

    if (isConnectedGmail && gmailAccessToken && emailId.length > 10) {
      try {
        await starGmailMessage(gmailAccessToken, emailId, newStarred);
      } catch (err) {
        console.error('Error starring message:', err);
      }
    }
  };

  const handleToggleRead = async (emailId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const current = emails.find((item) => item.id === emailId);
    const newRead = current ? !current.read : true;

    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, read: newRead } : item))
    );

    if (isConnectedGmail && gmailAccessToken && emailId.length > 10) {
      try {
        await markMessageAsRead(gmailAccessToken, emailId, newRead);
      } catch (err) {
        console.error('Error marking message read:', err);
      }
    }
  };

  const handleDeleteEmail = async (emailId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();

    // Save previous state for undo capability if deleted unintentionally
    if (emails.length > 0) {
      localStorage.setItem(CRM_UNDO_BACKUP_KEY, JSON.stringify(emails));
      setUndoBackup(emails);
      setShowResetUndoBanner(true);
    }

    setEmails((prev) =>
      prev.map((item) => {
        if (item.id === emailId) {
          return item.folderId === 'trash' ? null : { ...item, folderId: 'trash' };
        }
        return item;
      }).filter(Boolean) as EmailItem[]
    );

    if (isConnectedGmail && gmailAccessToken && emailId.length > 10) {
      try {
        await trashGmailMessage(gmailAccessToken, emailId);
      } catch (err) {
        console.error('Error trashing Gmail message:', err);
      }
    }
  };

  // Send real email reply directly from support@akaar.com inside the CRM (no tab redirection)
  const handleSendReply = async (
    to: string,
    subject: string,
    bodyText: string,
    options?: { cc?: string; recipientName?: string }
  ): Promise<boolean> => {
    try {
      // 1. Dispatch directly from support@akaar.com via in-CRM mail dispatcher
      const dispatchResult = await sendDirectCrmEmail({
        to,
        subject,
        bodyText,
        cc: options?.cc,
        inReplyTo: selectedEmail?.id,
        recipientName: options?.recipientName,
      });

      // 2. Create the SentReplyRecord for thread tracking
      const sentRecord: SentReplyRecord = {
        id: dispatchResult.messageId || `reply-${Date.now()}`,
        from: 'support@akaar.com',
        to,
        cc: options?.cc,
        subject,
        bodyText,
        sentAt: dispatchResult.sentAt || new Date().toISOString(),
        method: 'direct_outbox',
      };

      // 3. Create the sent item in the Sent Messages folder
      const sentEmailItem: EmailItem = {
        id: `sent-${Date.now()}`,
        senderName: 'Akaar Support (support@akaar.com)',
        senderEmail: 'support@akaar.com',
        recipientEmail: to,
        subject,
        preview: bodyText.slice(0, 120),
        bodyHtml: `<div style="font-family: sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6;">
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0;"><strong>Sender (From):</strong> Akaar Support &lt;support@akaar.com&gt;</p>
            <p style="margin: 0 0 4px 0;"><strong>Recipient (To):</strong> ${to}${options?.cc ? ` (Cc: ${options.cc})` : ''}</p>
            <p style="margin: 0 0 4px 0;"><strong>Delivery Tool:</strong> FormSubmit.co Tool (Real Inbox Delivery)</p>
            <p style="margin: 0 0 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 0; color: #16a34a; font-size: 12px;"><strong>Status:</strong> ${dispatchResult.status}</p>
          </div>
          <div style="white-space: pre-line;">${bodyText}</div>
        </div>`,
        receivedAt: new Date().toISOString(),
        read: true,
        starred: false,
        category: selectedEmail?.category || 'brand_query',
        folderId: 'sent',
        tags: ['Sent Message', 'FormSubmit', 'support@akaar.com'],
      };

      // 4. Update state and localStorage
      setEmails((prev) => {
        const updated = prev.map((item) => {
          if (item.id === selectedEmail?.id) {
            const existingReplies = item.sentReplies || [];
            return {
              ...item,
              sentReplies: [...existingReplies, sentRecord],
            };
          }
          return item;
        });
        const nextEmails = [sentEmailItem, ...updated];
        localStorage.setItem('akaar_inbox_emails', JSON.stringify(nextEmails));
        return nextEmails;
      });

      // 5. In-CRM Toast Alert
      setCurrentToastAlert({
        id: `sent-toast-${Date.now()}`,
        emailId: selectedEmail?.id || '',
        title: dispatchResult.needsActivation
          ? `Dispatched via FormSubmit! Check ${to} for 1-time activation`
          : `Delivered to ${to} via FormSubmit tool`,
        sender: 'Akaar Support (support@akaar.com)',
        timestamp: new Date().toISOString(),
        category: 'brand_query',
        read: true,
      });

      return true;
    } catch (err: any) {
      console.error('Failed to dispatch reply from support@akaar.com:', err);
      setSyncError(err.message || 'Failed to dispatch reply from support@akaar.com');
      return false;
    }
  };

  // Drag and drop into folder handler
  const handleDropEmailToFolder = (emailId: string, targetFolderId: string) => {
    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, folderId: targetFolderId } : item))
    );
  };

  // 1-Click Isolate Personal Correspondence
  const handleSeparatePersonal = (emailId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailId
          ? {
              ...item,
              category: 'personal',
              folderId: 'personal_vault',
              tags: Array.from(new Set([...item.tags, 'Personal / Family'])),
            }
          : item
      )
    );
  };

  const handleMoveToFolder = (emailId: string, folderId: string) => {
    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, folderId } : item))
    );
  };

  const handleAddTag = (emailId: string, tagName: string) => {
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailId && !item.tags.includes(tagName)
          ? { ...item, tags: [...item.tags, tagName] }
          : item
      )
    );
  };

  const handleRemoveTag = (emailId: string, tagName: string) => {
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailId
          ? { ...item, tags: item.tags.filter((t) => t !== tagName) }
          : item
      )
    );
  };

  // Batch actions
  const handleBatchMove = (emailIds: string[], targetFolderId: string) => {
    setEmails((prev) =>
      prev.map((item) => (emailIds.includes(item.id) ? { ...item, folderId: targetFolderId } : item))
    );
  };

  const handleBatchTag = (emailIds: string[], tagName: string) => {
    setEmails((prev) =>
      prev.map((item) =>
        emailIds.includes(item.id) && !item.tags.includes(tagName)
          ? { ...item, tags: [...item.tags, tagName] }
          : item
      )
    );
  };

  const handleBatchDelete = async (emailIds: string[]) => {
    setEmails((prev) =>
      prev.map((item) => (emailIds.includes(item.id) ? { ...item, folderId: 'trash' } : item))
    );

    if (isConnectedGmail && gmailAccessToken) {
      for (const id of emailIds) {
        if (id.length > 10) {
          trashGmailMessage(gmailAccessToken, id).catch(console.error);
        }
      }
    }
  };

  const handleBatchMarkRead = (emailIds: string[], read: boolean) => {
    setEmails((prev) =>
      prev.map((item) => (emailIds.includes(item.id) ? { ...item, read } : item))
    );

    if (isConnectedGmail && gmailAccessToken) {
      for (const id of emailIds) {
        if (id.length > 10) {
          markMessageAsRead(gmailAccessToken, id, read).catch(console.error);
        }
      }
    }
  };

  // New folder creation
  const handleCreateFolder = (newFolder: Omit<FolderItem, 'id' | 'count'>) => {
    const id = `folder_${Date.now()}`;
    setFolders((prev) => [...prev, { ...newFolder, id }]);
    setActiveFolderId(id);
  };

  // Custom filter rule management
  const handleToggleRule = (ruleId: string) => {
    setFilterRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setFilterRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleAddRule = (rule: Omit<CustomFilterRule, 'id' | 'matchesCount'>) => {
    const id = `rule_${Date.now()}`;
    const newRule: CustomFilterRule = { ...rule, id, matchesCount: 0 };
    setFilterRules((prev) => [...prev, newRule]);
  };

  const handleApplyRulesRetroactively = () => {
    setEmails((prev) => {
      return prev.map((email) => {
        let current = email;
        for (const rule of filterRules) {
          current = applyRuleToEmail(current, rule);
        }
        return current;
      });
    });
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  // View Title Label
  const currentViewTitle = useMemo(() => {
    if (activeTagId) return `Tag: ${activeTagId}`;
    if (searchQuery.trim()) return `Search results for: "${searchQuery}"`;
    const f = folders.find((item) => item.id === activeFolderId);
    if (focusMode === 'clean_work') {
      return `${f?.name || 'Inbox'} (Clean Work View: Brands & Newsletters)`;
    }
    if (focusMode === 'personal_only') {
      return `Personal Vault (Isolated Correspondence)`;
    }
    return f?.name || 'Primary Inbox';
  }, [activeTagId, searchQuery, activeFolderId, folders, focusMode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-slate-900 font-sans antialiased overflow-hidden select-none">
      {/* Top Application Header */}
      <Header
        userEmail={USER_EMAIL}
        actualConnectedEmail={actualConnectedEmail}
        userGooglePhoto={userGooglePhoto}
        isConnectedGmail={isConnectedGmail}
        isSyncingGmail={isSyncingGmail}
        isAuthenticatingGmail={isAuthenticatingGmail}
        onSyncGmail={() => syncGmailInbox()}
        onLoginGmail={() => handleLoginGmail(USER_EMAIL)}
        onLogoutGmail={handleLogoutGmail}
        onSwitchAccount={handleSwitchAccount}
        syncError={syncError}
        onClearSyncError={() => setSyncError(null)}
        onClearDatabaseRecords={handleResetToStudioData}
        activeWorkspaceView={activeWorkspaceView}
        onWorkspaceViewChange={setActiveWorkspaceView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
        alerts={alerts}
        onOpenEmail={(emailId) => {
          setSelectedEmailId(emailId);
          setActiveWorkspaceView('mailbox');
          setEmails((prev) =>
            prev.map((e) => (e.id === emailId ? { ...e, read: true } : e))
          );
        }}
        onClearAlerts={handleClearAlerts}
        onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
        onOpenRealtimeChat={() => setIsRealtimeChatOpen(true)}
        onOpenUploadBill={() => setIsUploadBillOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        brandOffersTotal={brandOffersTotal}
        personalCount={personalCount}
        newslettersCount={newslettersCount}
        brandsCount={brandsCount}
        onOpenFilterRules={() => setIsFilterRulesModalOpen(true)}
        onOpenLoginHelp={() => setIsLoginHelpOpen(true)}
        onOpenInboundGateway={() => setIsInboundGatewayOpen(true)}
        onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {activeWorkspaceView === 'dashboard' ? (
          <ExecutiveDashboard
            emails={emails}
            onSelectEmail={(email) => {
              setSelectedEmailId(email.id);
              setActiveWorkspaceView('mailbox');
            }}
            onOpenMailbox={() => setActiveWorkspaceView('mailbox')}
            onOpenInboundGateway={() => setIsInboundGatewayOpen(true)}
            onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
            onOpenUploadBill={() => setIsUploadBillOpen(true)}
            onOpenRealtimeChat={() => setIsRealtimeChatOpen(true)}
            onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
            onUpdateEmailStage={handleUpdateEmailStage}
            onAddNewDeal={handleAddNewDeal}
            userEmail={USER_EMAIL}
            brandOffersTotal={brandOffersTotal}
          />
        ) : activeWorkspaceView === 'billing' ? (
          <BillingVaultView
            onOpenUploadModal={() => setIsUploadBillOpen(true)}
            onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
            onOpenMailbox={() => setActiveWorkspaceView('mailbox')}
          />
        ) : (
          <>
            {/* Left Sidebar: Folders, Drag Targets, Smart Tags & Separation Focus */}
            <Sidebar
              folders={folders}
              activeFolderId={activeFolderId}
              onSelectFolder={setActiveFolderId}
              smartTags={smartTags}
              activeTagId={activeTagId}
              onSelectTag={setActiveTagId}
              focusMode={focusMode}
              onFocusModeChange={setFocusMode}
              folderCounts={folderCounts}
              tagCounts={tagCounts}
              onDropEmailToFolder={handleDropEmailToFolder}
              onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
              onOpenFilterRules={() => setIsFilterRulesModalOpen(true)}
              onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
              onOpenRealtimeChat={() => setIsRealtimeChatOpen(true)}
              onOpenUploadBill={() => setIsUploadBillOpen(true)}
              onOpenInboundGateway={() => setIsInboundGatewayOpen(true)}
              onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
              activeWorkspaceView={activeWorkspaceView}
              onWorkspaceViewChange={setActiveWorkspaceView}
              isOpenMobile={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
              personalCount={personalCount}
              newslettersCount={newslettersCount}
              brandsCount={brandsCount}
            />

            {/* Center: Draggable Email List (Hide on mobile when email is selected) */}
            <div
              className={`flex-1 sm:w-80 md:w-96 lg:w-[420px] lg:flex-none flex flex-col min-w-0 ${
                selectedEmailId ? 'hidden md:flex' : 'flex'
              }`}
            >
              <EmailList
                emails={displayedEmails}
                selectedEmailId={selectedEmail?.id || null}
                onSelectEmail={handleSelectEmail}
                onToggleStar={handleToggleStar}
                onToggleRead={handleToggleRead}
                onDeleteEmail={handleDeleteEmail}
                onSeparatePersonal={handleSeparatePersonal}
                activeCategoryFilter={activeCategoryFilter}
                onCategoryFilterChange={setActiveCategoryFilter}
                folders={folders}
                smartTags={smartTags}
                onBatchMove={handleBatchMove}
                onBatchTag={handleBatchTag}
                onBatchDelete={handleBatchDelete}
                onBatchMarkRead={handleBatchMarkRead}
                viewTitle={currentViewTitle}
                onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
                onOpenInboundGateway={() => setIsInboundGatewayOpen(true)}
              />
            </div>

            {/* Right: Full Email Detail Reader & Deal Dashboard */}
            <div
              className={`flex-1 flex flex-col min-w-0 ${
                selectedEmailId ? 'flex' : 'hidden md:flex'
              }`}
            >
              {selectedEmail ? (
                <EmailDetail
                  email={selectedEmail}
                  allEmails={emails}
                  userEmail={USER_EMAIL}
                  operatorEmail={actualConnectedEmail || undefined}
                  onBack={() => setSelectedEmailId(null)}
                  onToggleStar={(id) => handleToggleStar(id)}
                  onToggleRead={(id) => handleToggleRead(id)}
                  onDeleteEmail={handleDeleteEmail}
                  onMoveToFolder={handleMoveToFolder}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  onSeparatePersonal={handleSeparatePersonal}
                  onSendReply={handleSendReply}
                  folders={folders}
                  availableTags={smartTags}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      📩
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No message selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Choose an email query from the list to view commercial assessments, newsletter reader mode, or reply templates.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Real-Time Inbound Notification Toast */}
      <RealtimeNotificationToast
        alert={currentToastAlert}
        onView={(emailId) => {
          setSelectedEmailId(emailId);
          setEmails((prev) =>
            prev.map((e) => (e.id === emailId ? { ...e, read: true } : e))
          );
        }}
        onDismiss={() => setCurrentToastAlert(null)}
      />

      {/* Custom Filter Rules & Automations Modal */}
      <CustomFilterModal
        isOpen={isFilterRulesModalOpen}
        onClose={() => setIsFilterRulesModalOpen(false)}
        filterRules={filterRules}
        onToggleRule={handleToggleRule}
        onDeleteRule={handleDeleteRule}
        onAddRule={handleAddRule}
        onApplyRulesRetroactively={handleApplyRulesRetroactively}
        folders={folders}
        smartTags={smartTags}
      />

      {/* New Custom Folder Creation Modal */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* Gmail Step-by-Step Connection & Verification Guide Modal */}
      <LoginHelpModal
        isOpen={isLoginHelpOpen}
        onClose={() => setIsLoginHelpOpen(false)}
        onLogin={(email) => handleLoginGmail(email || USER_EMAIL)}
        isAuthenticating={isAuthenticatingGmail}
        targetEmail={USER_EMAIL}
        developerEmail="abhimorkhade11@gmail.com"
      />

      {/* Smart Email Analysis & CSV / Excel Export Modal */}
      <SmartAnalysisModal
        isOpen={isSmartAnalysisOpen}
        onClose={() => setIsSmartAnalysisOpen(false)}
        emails={emails}
      />

      {/* Real-time Multi-Device Team Chat Modal */}
      <RealtimeChatModal
        isOpen={isRealtimeChatOpen}
        onClose={() => setIsRealtimeChatOpen(false)}
        onOpenUploadBill={() => setIsUploadBillOpen(true)}
        userDisplayName="Akaar Team"
        userEmail={actualConnectedEmail || USER_EMAIL}
      />

      {/* Client Bill & Data Upload Modal */}
      <UploadBillModal
        isOpen={isUploadBillOpen}
        onClose={() => setIsUploadBillOpen(false)}
        onBillUploaded={() => {
          // Switch to chat / bills view to show the newly added ledger item
          setIsRealtimeChatOpen(true);
        }}
        uploaderName="Akaar Team"
      />

      {/* Inbound Mail Gateway for receiving emails sent to support@akaar.com */}
      <InboundGatewayModal
        isOpen={isInboundGatewayOpen}
        onClose={() => setIsInboundGatewayOpen(false)}
        userEmail={actualConnectedEmail || 'abhimorkhade11@gmail.com'}
        onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
        onSyncGmail={() => handleLoginGmail('abhimorkhade11@gmail.com')}
        onEmailReceived={(newEmail) => {
          setEmails((prev) => {
            const exists = prev.some((e) => e.id === newEmail.id);
            if (exists) return prev;
            const updated = [newEmail, ...prev];
            localStorage.setItem('akaar_inbox_emails', JSON.stringify(updated));
            return updated;
          });
          setSelectedEmailId(newEmail.id);
          if (soundEnabled) {
            playNotificationChime();
          }
          setCurrentToastAlert({
            id: `toast-inbound-${Date.now()}`,
            emailId: newEmail.id,
            title: `Received at ${newEmail.recipientEmail || 'service@akaarentertainment.com'}: ${newEmail.subject}`,
            sender: newEmail.senderName,
            timestamp: newEmail.receivedAt,
            category: newEmail.category,
            budget: newEmail.brandMeta?.budgetOffer,
            read: false,
          });
        }}
      />

      {/* Public Client Query Portal for 100% Free Inbound Inquiries */}
      <PublicQueryPortalModal
        isOpen={isPublicPortalOpen}
        onClose={() => setIsPublicPortalOpen(false)}
        userEmail={actualConnectedEmail || 'abhimorkhade11@gmail.com'}
        onQuerySubmitted={(newEmail) => {
          setEmails((prev) => {
            const exists = prev.some((e) => e.id === newEmail.id);
            if (exists) return prev;
            const updated = [newEmail, ...prev];
            localStorage.setItem('akaar_inbox_emails', JSON.stringify(updated));
            return updated;
          });
          setSelectedEmailId(newEmail.id);
          if (soundEnabled) {
            playNotificationChime();
          }
          setCurrentToastAlert({
            id: `toast-public-${Date.now()}`,
            emailId: newEmail.id,
            title: `Public Inquiry Received (${newEmail.recipientEmail || 'service@akaarentertainment.com'}): ${newEmail.subject}`,
            sender: newEmail.senderName,
            timestamp: newEmail.receivedAt,
            category: newEmail.category,
            budget: newEmail.brandMeta?.budgetOffer,
            read: false,
          });
        }}
      />
    </div>
  );
}
