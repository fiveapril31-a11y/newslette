import { EmailItem } from '../types';

export interface InboundSimulationParams {
  from: string;
  senderName?: string;
  to?: string;
  subject: string;
  message: string;
  budget?: string;
  service?: string;
}

/**
 * Fetch inbound emails sent to service@akaarentertainment.com or support@akaar.com from the CRM inbound server queue
 */
export async function fetchInboundEmails(): Promise<EmailItem[]> {
  try {
    const res = await fetch('/api/inbound-email');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.emails) ? data.emails : [];
  } catch (err) {
    console.warn('[Inbound Gateway] Failed to poll inbound emails:', err);
    return [];
  }
}

/**
 * Simulate or ingest an email sent to service@akaarentertainment.com from an external Gmail address
 */
export async function sendInboundSimulation(
  params: InboundSimulationParams
): Promise<{ success: boolean; email?: EmailItem; error?: string }> {
  try {
    const res = await fetch('/api/inbound-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        senderName: params.senderName || params.from.split('@')[0],
        to: params.to || 'service@akaarentertainment.com',
        subject: params.subject,
        bodyText: params.message,
        budget: params.budget,
        service: params.service,
        receivedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to ingest inbound email' };
    }

    const data = await res.json();
    return { success: true, email: data.email };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to inbound gateway' };
  }
}
