import { EmailItem, ClientBill } from '../types';

export interface ClientInBox {
  id: string;
  clientName: string;
  clientEmail: string;
  company?: string;
  service?: string;
  budgetOffer?: string;
  source: 'Email in Box' | 'Client Bills Ledger' | 'Extracted from Message';
}

export interface ResolvedEmailTarget {
  clientName: string;
  clientEmail: string;
  hasDirectClient: boolean;
  myBoxEmail: string;
  inboundSenderEmail: string;
  inboundSenderName: string;
  isInboundIntakeAddress: boolean;
  intakeReason?: string;
}

/**
 * Checks whether an incoming sender email is a form submission, intake bot, or forwarder
 * rather than the actual direct client's personal inbox.
 */
export function isIntakeOrForwarderAddress(emailAddress: string, senderName: string): boolean {
  const lowerAddr = (emailAddress || '').toLowerCase();
  const lowerName = (senderName || '').toLowerCase();

  const intakePatterns = [
    'inquiries@',
    'inquiry@',
    'contact@',
    'forms@',
    'form@',
    'noreply@',
    'no-reply@',
    'support@',
    'notifications@',
    'leads@',
    'submissions@',
    'info@',
    'team@',
    'mailer@',
    'website contact',
    'contact form',
    'typeform',
    'formspree',
    'lead intake',
  ];

  return intakePatterns.some(
    (pattern) => lowerAddr.includes(pattern) || lowerName.includes(pattern)
  );
}

/**
 * Extracts email addresses found inside email body text/HTML, excluding my email & raw sender
 */
export function extractClientEmailFromBody(
  bodyHtml: string,
  excludeEmails: string[]
): { clientName?: string; clientEmail?: string } {
  if (!bodyHtml) return {};

  const cleanBody = bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  // 1. Look for explicit "Email: client@xyz.com" or "Client Email: client@xyz.com"
  const explicitEmailMatch = cleanBody.match(
    /(?:Client\s+Email|Email|Contact\s+Email|E-mail)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  );

  // 2. Look for explicit "Client Name: John Doe" or "Name: John Doe"
  const explicitNameMatch = cleanBody.match(
    /(?:Client\s+Name|Name|Contact\s+Person)\s*:\s*([A-Za-z0-9\s&.,'-]{2,50}?)(?:<|\n|\r|Production|Email|Project|Message|$)/i
  );

  let extractedEmail = explicitEmailMatch ? explicitEmailMatch[1].trim() : '';
  let extractedName = explicitNameMatch ? explicitNameMatch[1].trim() : '';

  // 3. If no explicit label, scan for any email address not in exclude list
  if (!extractedEmail) {
    const allEmails =
      cleanBody.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const lowerExcludes = excludeEmails.map((e) => (e || '').toLowerCase().trim());

    for (const found of allEmails) {
      if (!lowerExcludes.includes(found.toLowerCase().trim())) {
        extractedEmail = found;
        break;
      }
    }
  }

  return {
    clientName: extractedName || undefined,
    clientEmail: extractedEmail || undefined,
  };
}

/**
 * Resolve target email addresses for an incoming email:
 * Returns the client's direct email (from body/brandMeta/box), the user's box email,
 * and highlights if the email was received through a forwarder/intake form.
 */
export function resolveEmailTarget(
  email?: EmailItem | null,
  knownClients?: ClientInBox[]
): ResolvedEmailTarget {
  if (!email) {
    return {
      clientName: 'Client in Box',
      clientEmail: '',
      hasDirectClient: false,
      myBoxEmail: 'support@akaar.com',
      inboundSenderEmail: '',
      inboundSenderName: '',
      isInboundIntakeAddress: false,
    };
  }

  const myBoxEmail = email.recipientEmail || 'support@akaar.com';
  const inboundSenderEmail = email.senderEmail || '';
  const inboundSenderName = email.senderName || '';
  const isIntake = isIntakeOrForwarderAddress(inboundSenderEmail, inboundSenderName);

  // 1. Check brandMeta direct client info
  let clientName = email.brandMeta?.contactPerson || email.brandMeta?.brandName || '';
  let clientEmail = email.brandMeta?.clientEmail || '';

  // 2. Scan email body for direct client details
  const fromBody = extractClientEmailFromBody(email.bodyHtml || '', [
    inboundSenderEmail,
    myBoxEmail,
  ]);

  if (fromBody.clientEmail && !clientEmail) {
    clientEmail = fromBody.clientEmail;
  }
  if (fromBody.clientName && !clientName) {
    clientName = fromBody.clientName;
  }

  // 3. If still missing email, check if client name matches a known client in my box
  if (!clientEmail && knownClients && knownClients.length > 0 && clientName) {
    const matched = knownClients.find(
      (c) =>
        c.clientName.toLowerCase().includes(clientName.toLowerCase()) ||
        (c.company && clientName.toLowerCase().includes(c.company.toLowerCase()))
    );
    if (matched?.clientEmail) {
      clientEmail = matched.clientEmail;
      if (!clientName) clientName = matched.clientName;
    }
  }

  // 4. If no special client email found and inbound is NOT an intake address,
  // the client email is the sender itself
  if (!clientEmail && !isIntake) {
    clientEmail = inboundSenderEmail;
    if (!clientName) {
      clientName = inboundSenderName.replace(/\([^)]*\)/g, '').trim() || 'Client';
    }
  }

  return {
    clientName: clientName || inboundSenderName,
    clientEmail: clientEmail || inboundSenderEmail,
    hasDirectClient: Boolean(clientEmail && clientEmail !== inboundSenderEmail),
    myBoxEmail,
    inboundSenderEmail,
    inboundSenderName,
    isInboundIntakeAddress: isIntake,
    intakeReason: isIntake
      ? `Received via intake address (${inboundSenderEmail}). Direct client is ${clientName || 'named in box'}.`
      : undefined,
  };
}

/**
 * Collect all clients currently present in the user's box (both from emails & client bills)
 */
export function getAllClientsInBox(
  emails: EmailItem[],
  bills: ClientBill[] = []
): ClientInBox[] {
  const map = new Map<string, ClientInBox>();

  // 1. Add clients from bills ledger
  for (const bill of bills) {
    if (bill.clientName) {
      const email = bill.clientEmail || '';
      const key = `${bill.clientName.toLowerCase()}_${email.toLowerCase()}`;
      map.set(key, {
        id: `bill_client_${bill.id}`,
        clientName: bill.clientName,
        clientEmail: email,
        company: bill.clientName,
        service: bill.service,
        budgetOffer: `₹${bill.billAmount.toLocaleString('en-IN')}`,
        source: 'Client Bills Ledger',
      });
    }
  }

  // 2. Add clients from emails in the box
  for (const item of emails) {
    if (item.category === 'brand_query' || item.brandMeta) {
      const target = resolveEmailTarget(item);
      const name = target.clientName || item.brandMeta?.brandName || item.senderName;
      const email = target.clientEmail || item.brandMeta?.clientEmail || item.senderEmail;

      if (name && email) {
        const key = `${name.toLowerCase()}_${email.toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, {
            id: `email_client_${item.id}`,
            clientName: name,
            clientEmail: email,
            company: item.brandMeta?.brandName || name,
            service: item.brandMeta?.serviceOpted || item.brandMeta?.campaignType,
            budgetOffer: item.brandMeta?.budgetOffer,
            source: target.hasDirectClient ? 'Extracted from Message' : 'Email in Box',
          });
        }
      }
    }
  }

  return Array.from(map.values());
}
