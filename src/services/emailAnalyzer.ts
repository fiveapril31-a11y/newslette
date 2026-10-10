import { EmailItem, EmailCategory, BrandMetadata, NewsletterMetadata } from '../types';

export interface SeparatedMailbox {
  brandQueries: EmailItem[];
  newsletters: EmailItem[];
  personal: EmailItem[];
  totalPipelineRupees: number;
  servicesBreakdown: { [service: string]: number };
  budgetTiersCount: {
    highValue: number; // >= 100000
    midTier: number;   // 50000 - 99999
    entryTier: number; // < 50000
    negotiable: number;
  };
}

export const KNOWN_SERVICES = [
  'Audio & Soundtrack Production',
  'Video Commercial & Ad Production',
  'Brand Sponsorship & Collab',
  'Commercial Sync & Music Licensing',
  'Audio Mixing & Stem Mastering',
  'Voiceover & Sound Design',
  'Creative Campaign Retainer',
] as const;

/**
 * Detect the creative / media service opted for from email content
 */
export function detectServiceOpted(text: string): string {
  const t = text.toLowerCase();

  if (/video|film|commercial ad|tvc|reel|shoot|cinematograph|visual/i.test(t)) {
    return 'Video Commercial & Ad Production';
  }
  if (/sponsor|sponsorship|brand deal|influencer|endorsement|product placement|collab/i.test(t)) {
    return 'Brand Sponsorship & Collab';
  }
  if (/sync|soundtrack license|licensing|game audio|netflix|ott rights/i.test(t)) {
    return 'Commercial Sync & Music Licensing';
  }
  if (/mix|master|stem|dolby atmos|audio mastering|sound cleanup/i.test(t)) {
    return 'Audio Mixing & Stem Mastering';
  }
  if (/voiceover|voice artist|voice-over|narration|dubbing|sfx|sound design|foley/i.test(t)) {
    return 'Voiceover & Sound Design';
  }
  if (/retainer|annual contract|quarterly campaign|monthly retainer/i.test(t)) {
    return 'Creative Campaign Retainer';
  }
  if (/soundtrack|music|score|bgm|beat|composition|composer|song/i.test(t)) {
    return 'Audio & Soundtrack Production';
  }

  return 'Audio & Soundtrack Production';
}

/**
 * Extracts Indian Rupee amounts and numeric integer value
 */
export function extractRupeeDetails(text: string): {
  formatted: string;
  numeric: number;
} {
  // Check for explicit Rupee symbol ₹ or Rs / INR
  // e.g. ₹7,25,000 or Rs. 1,80,000 or INR 50,000 or 7.25 Lakh
  const lakhMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|lakhs|lacs)\b/i);
  if (lakhMatch) {
    const lakhNum = parseFloat(lakhMatch[1]);
    const num = Math.round(lakhNum * 100000);
    return {
      formatted: `₹${num.toLocaleString('en-IN')}`,
      numeric: num,
    };
  }

  const kMatch = text.match(/([0-9]+)\s*k\b/i);
  if (kMatch) {
    const kNum = parseInt(kMatch[1], 10);
    const num = kNum * 1000;
    return {
      formatted: `₹${num.toLocaleString('en-IN')}`,
      numeric: num,
    };
  }

  const rupeeMatch = text.match(/(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]{4,8})/i);
  if (rupeeMatch) {
    const cleanNumStr = rupeeMatch[1].replace(/,/g, '');
    const num = Math.round(parseFloat(cleanNumStr));
    if (!isNaN(num) && num > 0) {
      return {
        formatted: `₹${num.toLocaleString('en-IN')}`,
        numeric: num,
      };
    }
  }

  // Check for $ conversion as fallback
  const usdMatch = text.match(/\$\s*([0-9,]+)/);
  if (usdMatch) {
    const usd = parseInt(usdMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(usd) && usd > 0) {
      const inRupees = Math.round(usd * 86);
      return {
        formatted: `₹${inRupees.toLocaleString('en-IN')} (~$${usd})`,
        numeric: inRupees,
      };
    }
  }

  return {
    formatted: 'Budget on Request',
    numeric: 0,
  };
}

/**
 * Intelligent analyzer that separates emails into Brand Queries, Newsletters, and Personal
 */
export function analyzeAndSeparateEmails(emails: EmailItem[]): SeparatedMailbox {
  const brandQueries: EmailItem[] = [];
  const newsletters: EmailItem[] = [];
  const personal: EmailItem[] = [];

  let totalPipelineRupees = 0;
  const servicesBreakdown: { [service: string]: number } = {};
  const budgetTiersCount = {
    highValue: 0,
    midTier: 0,
    entryTier: 0,
    negotiable: 0,
  };

  emails.forEach((email) => {
    const combined = `${email.senderName} ${email.senderEmail} ${email.subject} ${email.preview} ${email.bodyHtml}`.toLowerCase();

    // 1. Newsletter test
    const isNewsletterPattern =
      /(newsletter|no-reply|noreply|substack|medium|beehiiv|digest|weekly|daily|bulletin|news@|morningbrew|tldr|github|announcements?)/i.test(email.senderEmail) ||
      /(newsletter|weekly digest|monthly recap|edition|issue #|daily brief)/i.test(email.subject) ||
      /(unsubscribe|view in browser|view online|opt out|manage your preferences)/i.test(combined);

    // 2. Brand Query test
    const isBrandQueryPattern =
      /(inquiry|enquiry|query|quote|proposal|rate\s*card|budget|sponsor|sponsorship|collab|collaboration|partnership|project|commercial|sync|license|licensing|soundtrack|production|deal|pricing|deliverable|client|advertis|campaign)/i.test(combined) ||
      email.category === 'brand_query' ||
      !!email.brandMeta?.budgetOffer;

    if (isNewsletterPattern && !isBrandQueryPattern) {
      const readTime = email.newsletterMeta?.readTimeMinutes || Math.max(2, Math.min(10, Math.ceil(email.preview.length / 150) + 2));
      const enhancedNewsletter: EmailItem = {
        ...email,
        category: 'newsletter',
        newsletterMeta: {
          publication: email.newsletterMeta?.publication || email.senderName || 'Industry Publisher',
          readTimeMinutes: readTime,
          editionTopic: email.newsletterMeta?.editionTopic || email.subject,
        },
      };
      newsletters.push(enhancedNewsletter);
    } else if (isBrandQueryPattern) {
      const rupeeDetails = extractRupeeDetails(combined);
      const service = detectServiceOpted(combined);
      const budgetFormatted = email.brandMeta?.budgetOffer || (rupeeDetails.numeric > 0 ? rupeeDetails.formatted : 'Budget on Request');
      const numericVal = email.brandMeta?.budgetNumeric || rupeeDetails.numeric;

      const enhancedBrand: EmailItem = {
        ...email,
        category: 'brand_query',
        brandMeta: {
          brandName: email.brandMeta?.brandName || email.senderName || 'Client Brand',
          budgetOffer: budgetFormatted,
          budgetNumeric: numericVal,
          serviceOpted: email.brandMeta?.serviceOpted || service,
          contactPerson: email.brandMeta?.contactPerson || email.senderName,
          urgency: email.brandMeta?.urgency || (/urgent|asap|immediate|this week/i.test(combined) ? 'high' : 'medium'),
          status: email.brandMeta?.status || (numericVal > 0 ? 'In Discussion' : 'New Lead'),
          deliverables: email.brandMeta?.deliverables || email.subject,
        },
      };

      brandQueries.push(enhancedBrand);

      // Track statistics
      totalPipelineRupees += numericVal;
      servicesBreakdown[service] = (servicesBreakdown[service] || 0) + 1;

      if (numericVal >= 100000) {
        budgetTiersCount.highValue++;
      } else if (numericVal >= 50000) {
        budgetTiersCount.midTier++;
      } else if (numericVal > 0) {
        budgetTiersCount.entryTier++;
      } else {
        budgetTiersCount.negotiable++;
      }
    } else {
      personal.push(email);
    }
  });

  return {
    brandQueries,
    newsletters,
    personal,
    totalPipelineRupees,
    servicesBreakdown,
    budgetTiersCount,
  };
}

/**
 * Escapes CSV field according to standard RFC 4180
 */
function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

/**
 * Generates pristine CSV for Brand Queries separated by Money and Service
 */
export function generateBrandQueriesCsv(brandEmails: EmailItem[]): string {
  const headers = [
    'Client / Brand Name',
    'Contact Person',
    'Contact Email',
    'Date Received',
    'Service Opted For',
    'Budget (Formatted)',
    'Numeric Budget (INR ₹)',
    'Status',
    'Urgency',
    'Deliverables / Subject Scope',
  ];

  const rows = brandEmails.map((email) => {
    const meta = email.brandMeta;
    const dateFormatted = new Date(email.receivedAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return [
      escapeCsvField(meta?.brandName || email.senderName),
      escapeCsvField(meta?.contactPerson || email.senderName),
      escapeCsvField(email.senderEmail),
      escapeCsvField(dateFormatted),
      escapeCsvField(meta?.serviceOpted || 'Audio & Soundtrack Production'),
      escapeCsvField(meta?.budgetOffer || 'Budget on Request'),
      escapeCsvField(meta?.budgetNumeric || 0),
      escapeCsvField(meta?.status || 'New Lead'),
      escapeCsvField((meta?.urgency || 'medium').toUpperCase()),
      escapeCsvField(meta?.deliverables || email.subject),
    ].join(',');
  });

  return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
}

/**
 * Generates pristine CSV for Newsletters
 */
export function generateNewslettersCsv(newsletterEmails: EmailItem[]): string {
  const headers = [
    'Publication / Source',
    'Sender Email',
    'Date Received',
    'Subject',
    'Topic / Edition',
    'Read Time (Mins)',
    'Summary / Preview',
  ];

  const rows = newsletterEmails.map((email) => {
    const meta = email.newsletterMeta;
    const dateFormatted = new Date(email.receivedAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return [
      escapeCsvField(meta?.publication || email.senderName),
      escapeCsvField(email.senderEmail),
      escapeCsvField(dateFormatted),
      escapeCsvField(email.subject),
      escapeCsvField(meta?.editionTopic || email.subject),
      escapeCsvField(meta?.readTimeMinutes || 3),
      escapeCsvField(email.preview),
    ].join(',');
  });

  return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
}

/**
 * Initiates direct browser download of CSV file
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  // UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
