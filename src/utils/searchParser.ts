import { EmailItem } from '../types';

export interface ParsedSearchQuery {
  rawText: string;
  terms: string[];
  types: string[];
  folders: string[];
  senders: string[];
  tags: string[];
  hasBudget: boolean;
  minBudget?: number;
  isStarred?: boolean;
  isUnread?: boolean;
  isUrgent?: boolean;
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    rawText: query,
    terms: [],
    types: [],
    folders: [],
    senders: [],
    tags: [],
    hasBudget: false,
  };

  if (!query.trim()) return result;

  // Regex to match key:value, key:"quoted value", or standalone terms
  const tokenRegex = /(?:(\b[a-zA-Z_-]+):(?:"([^"]+)"|([^\s]+)))|(?:"([^"]+)")|([^\s]+)/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(query)) !== null) {
    const key = match[1]?.toLowerCase();
    const valueWithQuotes = match[2];
    const valueWithoutQuotes = match[3];
    const quotedTerm = match[4];
    const plainTerm = match[5];

    const val = (valueWithQuotes || valueWithoutQuotes || '').toLowerCase();

    if (key) {
      switch (key) {
        case 'type':
        case 'category':
          result.types.push(val);
          break;
        case 'folder':
        case 'in':
          result.folders.push(val);
          break;
        case 'from':
        case 'sender':
          result.senders.push(val);
          break;
        case 'tag':
        case 'label':
          result.tags.push(val);
          break;
        case 'has':
          if (val === 'budget' || val === 'money' || val === 'offer') {
            result.hasBudget = true;
          }
          break;
        case 'is':
          if (val === 'starred' || val === 'star') result.isStarred = true;
          if (val === 'unread') result.isUnread = true;
          if (val === 'urgent' || val === 'priority') result.isUrgent = true;
          break;
        case 'min':
        case 'budget': {
          const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) result.minBudget = num;
          break;
        }
        default:
          result.terms.push(`${key}:${val}`);
      }
    } else if (quotedTerm) {
      result.terms.push(quotedTerm.toLowerCase());
    } else if (plainTerm) {
      result.terms.push(plainTerm.toLowerCase());
    }
  }

  return result;
}

export function filterEmailsByQuery(emails: EmailItem[], parsed: ParsedSearchQuery): EmailItem[] {
  return emails.filter((email) => {
    // Type filter
    if (parsed.types.length > 0) {
      const matchesType = parsed.types.some((t) => {
        if (t === 'brand' || t === 'brand_query' || t === 'deals') return email.category === 'brand_query';
        if (t === 'newsletter' || t === 'digest') return email.category === 'newsletter';
        if (t === 'personal') return email.category === 'personal';
        return email.category === t;
      });
      if (!matchesType) return false;
    }

    // Sender filter
    if (parsed.senders.length > 0) {
      const senderText = `${email.senderName} ${email.senderEmail}`.toLowerCase();
      const matchesSender = parsed.senders.some((s) => senderText.includes(s));
      if (!matchesSender) return false;
    }

    // Folder filter
    if (parsed.folders.length > 0) {
      const matchesFolder = parsed.folders.some((f) => {
        return email.folderId.toLowerCase().includes(f);
      });
      if (!matchesFolder) return false;
    }

    // Tag filter
    if (parsed.tags.length > 0) {
      const emailTagsLower = email.tags.map((t) => t.toLowerCase());
      const matchesTag = parsed.tags.some((reqTag) =>
        emailTagsLower.some((t) => t.includes(reqTag))
      );
      if (!matchesTag) return false;
    }

    // has:budget
    if (parsed.hasBudget) {
      if (!email.brandMeta?.budgetOffer) return false;
    }

    // min budget
    if (parsed.minBudget !== undefined) {
      if (!email.brandMeta?.budgetOffer) return false;
      const budgetNum = parseInt(email.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10);
      if (isNaN(budgetNum) || budgetNum < parsed.minBudget) return false;
    }

    // is:starred
    if (parsed.isStarred !== undefined && parsed.isStarred && !email.starred) return false;

    // is:unread
    if (parsed.isUnread !== undefined && parsed.isUnread && email.read) return false;

    // is:urgent
    if (parsed.isUrgent !== undefined && parsed.isUrgent && email.priority !== 'urgent') return false;

    // Free terms
    if (parsed.terms.length > 0) {
      const searchableBody = `${email.subject} ${email.preview} ${email.senderName} ${email.senderEmail} ${
        email.brandMeta?.brandName || ''
      } ${email.newsletterMeta?.publication || ''} ${email.tags.join(' ')}`.toLowerCase();

      const allTermsMatch = parsed.terms.every((term) => searchableBody.includes(term));
      if (!allTermsMatch) return false;
    }

    return true;
  });
}
