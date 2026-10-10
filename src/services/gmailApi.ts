import { EmailItem, EmailCategory, BrandMetadata, NewsletterMetadata } from '../types';

/**
 * Base64URL decoder for Gmail API message payload bodies
 */
function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Recursively extract text/plain and text/html bodies from Gmail payload parts
 */
function extractBodyParts(payload: any): { html: string; plain: string } {
  let html = '';
  let plain = '';

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') {
      html = decoded;
    } else if (payload.mimeType === 'text/plain') {
      plain = decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const sub = extractBodyParts(part);
      if (sub.html && !html) html = sub.html;
      if (sub.plain && !plain) plain = sub.plain;
    }
  }

  return { html, plain };
}

/**
 * Extract INR / Rupee transactions or amounts from message text
 * Looks for ₹, Rs, INR, Lakhs, Crores, or USD/EUR conversions
 */
export function extractRupeeTransaction(text: string): string | undefined {
  if (!text) return undefined;

  // 1. Explicit ₹ symbol: ₹ 50,000 or ₹50000 or ₹1,50,000
  const rupeeSymbolMatch = text.match(/₹\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i);
  if (rupeeSymbolMatch) {
    return `₹${rupeeSymbolMatch[1]}`;
  }

  // 2. Rs. / Rs / INR: Rs 50,000 or Rs. 1,00,000 or INR 75,000
  const rsMatch = text.match(/(?:Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i);
  if (rsMatch) {
    return `₹${rsMatch[1]}`;
  }

  // 3. Indian numbering Lakhs / Crores: 5 Lakhs, 2.5 Lakh, 1 Crore
  const lakhMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakhs?|lac|lacs)\b/i);
  if (lakhMatch) {
    const lakhVal = parseFloat(lakhMatch[1]);
    const numInRupees = Math.round(lakhVal * 100000);
    return `₹${numInRupees.toLocaleString('en-IN')}`;
  }

  const croreMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:crores?|cr)\b/i);
  if (croreMatch) {
    const crVal = parseFloat(croreMatch[1]);
    const numInRupees = Math.round(crVal * 10000000);
    return `₹${numInRupees.toLocaleString('en-IN')}`;
  }

  // 4. If dollar amount mentioned in global queries, convert to Rs (~85 INR/USD)
  const dollarMatch = text.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*)/);
  if (dollarMatch) {
    const rawVal = parseInt(dollarMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rawVal) && rawVal > 0) {
      const inRupees = Math.round(rawVal * 86);
      return `₹${inRupees.toLocaleString('en-IN')} (approx. Rs)`;
    }
  }

  return undefined;
}

/**
 * Intelligent sorting classifier:
 * Classifies an incoming email into 'brand_query' (Customer / Brand Inquiry), 'newsletter', or 'personal'
 */
export function classifyRealEmail(params: {
  from: string;
  subject: string;
  snippet: string;
  body: string;
  hasUnsubscribeHeader: boolean;
}): {
  category: EmailCategory;
  folderId: string;
  tags: string[];
  brandMeta?: BrandMetadata;
  newsletterMeta?: NewsletterMetadata;
} {
  const { from, subject, snippet, body, hasUnsubscribeHeader } = params;
  const combinedText = `${from} ${subject} ${snippet} ${body}`.toLowerCase();

  // 1. NEWSLETTER DETECTION
  const newsletterSenderPattern = /(newsletter|no-reply|noreply|substack|medium|beehiiv|digest|mailer|notification|updates@|weekly|daily|bulletin|news@|morningbrew|tldr|github|announcements?)/i;
  const newsletterKeywords = /(unsubscribe|view in browser|view online|opt out|manage your preferences|email preferences|privacy policy|forwarded this newsletter)/i;

  const isNewsletter =
    hasUnsubscribeHeader ||
    newsletterSenderPattern.test(from) ||
    newsletterKeywords.test(combinedText);

  if (isNewsletter) {
    const publication = from.replace(/<.*>/, '').replace(/["']/g, '').trim() || 'Industry Publication';
    const readTime = Math.max(2, Math.min(12, Math.ceil(snippet.length / 150) + 2));

    return {
      category: 'newsletter',
      folderId: 'newsletters',
      tags: ['Industry Intel', 'Newsletter Digest'],
      newsletterMeta: {
        publication,
        readTimeMinutes: readTime,
        editionTopic: subject,
      },
    };
  }

  // 2. CUSTOMER / CLIENT / BRAND QUERY DETECTION
  const inquiryKeywords = /(inquiry|enquiry|query|customer|client|quote|proposal|rate\s*card|budget|sponsor|sponsorship|collab|collaboration|partnership|project|hire|booking|commercial|sync|license|licensing|soundtrack|production|deal|pricing|deliverable|scope|retainer|interested in working|would love to feature|advertis|campaign)/i;

  const rupeeAmount = extractRupeeTransaction(combinedText);
  const isCustomerQuery = inquiryKeywords.test(combinedText) || !!rupeeAmount;

  if (isCustomerQuery) {
    const senderName = from.replace(/<.*>/, '').replace(/["']/g, '').trim() || 'Client';
    const tags: string[] = ['Customer Query'];

    if (rupeeAmount) {
      tags.push('Commercial Offer');
      // If greater than Rs 50,000
      const numVal = parseInt(rupeeAmount.replace(/[^0-9]/g, ''), 10);
      if (numVal >= 50000) {
        tags.push('High Value (₹50k+)');
      }
    }

    if (/sponsorship|sponsor|placement|ad\b/i.test(combinedText)) {
      tags.push('Sponsorship Pitch');
    } else if (/sync|soundtrack|license|licensing|audio/i.test(combinedText)) {
      tags.push('Licensing & Sync');
    } else if (/urgent|asap|immediate|this week/i.test(combinedText)) {
      tags.push('Urgent Query');
    }

    // Determine target folder
    const folderId = /website|contact form|form submission/i.test(combinedText)
      ? 'website_leads'
      : 'brand_deals';

    return {
      category: 'brand_query',
      folderId,
      tags,
      brandMeta: {
        brandName: senderName,
        budgetOffer: rupeeAmount,
        campaignType: subject.slice(0, 60),
        contactPerson: senderName,
        urgency: /urgent|asap|deadline/i.test(combinedText) ? 'high' : 'medium',
      },
    };
  }

  // 3. PERSONAL CORRESPONDENCE
  return {
    category: 'personal',
    folderId: 'personal_vault',
    tags: ['Personal / Family'],
  };
}

/**
 * Fetch real-time emails directly from the user's Gmail mailbox using the Gmail REST API
 */
export async function fetchGmailInbox(
  accessToken: string,
  maxResults = 25
): Promise<EmailItem[]> {
  try {
    // 1. List messages from Gmail (including emails delivered to support@akaar.com, aliases, or Akaar inquiries)
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent('in:inbox OR to:support@akaar.com OR deliveredto:support@akaar.com OR support@akaar.com OR akaar OR subject:akaar OR subject:support OR label:UNREAD')}`;
    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listRes.ok) {
      const errJson = await listRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gmail API Error (${listRes.status})`);
    }

    const listData = await listRes.json();
    if (!listData.messages || !Array.isArray(listData.messages) || listData.messages.length === 0) {
      return [];
    }

    // 2. Fetch full message content in parallel chunks (up to 8 concurrent)
    const messageIds = listData.messages.slice(0, maxResults).map((m: any) => m.id);
    const results: EmailItem[] = [];

    const chunkSize = 6;
    for (let i = 0; i < messageIds.length; i += chunkSize) {
      const chunk = messageIds.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (msgId: string) => {
        try {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`;
          const detailRes = await fetch(detailUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!detailRes.ok) return null;
          return await detailRes.json();
        } catch {
          return null;
        }
      });

      const fullMessages = await Promise.all(chunkPromises);

      for (const msg of fullMessages) {
        if (!msg) continue;

        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From') || 'Unknown Sender';
        const to = getHeader('To') || getHeader('Delivered-To') || 'support@akaar.com';
        const deliveredTo = getHeader('Delivered-To');
        const subject = getHeader('Subject') || '(No Subject)';
        const dateStr = getHeader('Date') || new Date().toISOString();
        const listUnsubscribe = getHeader('List-Unsubscribe');

        // Extract sender display name and email address
        const emailMatch = from.match(/<([^>]+)>/);
        const senderEmail = emailMatch ? emailMatch[1] : from;
        const senderName = from.replace(/<[^>]+>/, '').replace(/["']/g, '').trim() || senderEmail;

        const labelIds: string[] = msg.labelIds || [];
        const isRead = !labelIds.includes('UNREAD');
        const isStarred = labelIds.includes('STARRED');

        const { html, plain } = extractBodyParts(msg.payload || {});
        const snippet = msg.snippet || plain.slice(0, 160) || '';
        const bodyContent = html || (plain ? `<p>${plain.replace(/\n/g, '<br/>')}</p>` : `<p>${snippet}</p>`);

        // Run smart classification
        const classification = classifyRealEmail({
          from,
          subject,
          snippet,
          body: plain || snippet,
          hasUnsubscribeHeader: !!listUnsubscribe,
        });

        const isAkaarInbound =
          to.toLowerCase().includes('support@akaar.com') ||
          (deliveredTo && deliveredTo.toLowerCase().includes('support@akaar.com')) ||
          to.toLowerCase().includes('+support') ||
          to.toLowerCase().includes('+akaar') ||
          subject.toLowerCase().includes('akaar') ||
          subject.toLowerCase().includes('support@akaar');

        const emailItem: EmailItem = {
          id: msg.id,
          senderName,
          senderEmail,
          recipientEmail: isAkaarInbound ? 'support@akaar.com' : to,
          subject,
          preview: snippet,
          bodyHtml: bodyContent,
          receivedAt: new Date(dateStr).toISOString(),
          read: isRead,
          starred: isStarred,
          category: isAkaarInbound && classification.category === 'personal' ? 'brand_query' : classification.category,
          folderId: isAkaarInbound && classification.category === 'personal' ? 'brand_deals' : classification.folderId,
          tags: [
            ...classification.tags,
            ...(isAkaarInbound ? ['support@akaar.com', 'Inbound Live'] : []),
          ],
          brandMeta: classification.brandMeta || (isAkaarInbound ? { brandName: senderName, urgency: 'medium' } : undefined),
          newsletterMeta: classification.newsletterMeta,
          priority: classification.brandMeta?.urgency === 'high' ? 'urgent' : 'normal',
        };

        results.push(emailItem);
      }
    }

    return results;
  } catch (error: any) {
    console.error('Failed to fetch real-time Gmail messages:', error);
    throw error;
  }
}

/**
 * Modify Gmail label (Mark as Read / Unread)
 */
export async function markGmailAsRead(
  accessToken: string,
  messageId: string,
  read: boolean
): Promise<void> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
  const body = read
    ? { removeLabelIds: ['UNREAD'] }
    : { addLabelIds: ['UNREAD'] };

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export const markMessageAsRead = markGmailAsRead;

/**
 * Modify Gmail label (Star / Unstar)
 */
export async function starGmailMessage(
  accessToken: string,
  messageId: string,
  starred: boolean
): Promise<void> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
  const body = starred
    ? { addLabelIds: ['STARRED'] }
    : { removeLabelIds: ['STARRED'] };

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Move Gmail message to Trash (Destructive: requires user confirmation before calling)
 */
export async function trashGmailMessage(
  accessToken: string,
  messageId: string
): Promise<void> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Send real email reply via Gmail REST API (Requires user confirmation before calling)
 */
export async function sendGmailReply(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    bodyText: string;
    inReplyTo?: string;
    cc?: string;
  }
): Promise<any> {
  const { to, subject, bodyText, inReplyTo, cc } = params;

  // Build RFC 2822 email message
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  const lines = [
    'From: Akaar Support <support@akaar.com>',
    'Reply-To: support@akaar.com',
    `To: ${to}`,
    `Subject: ${replySubject}`,
    'Content-Type: text/html; charset=utf-8',
  ];

  if (cc) {
    lines.push(`Cc: ${cc}`);
  }

  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
    lines.push(`References: ${inReplyTo}`);
  }

  lines.push('');
  lines.push(bodyText.replace(/\n/g, '<br/>'));

  const emailRaw = lines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Encoded,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || 'Failed to send reply through Gmail API');
  }

  return await response.json();
}
