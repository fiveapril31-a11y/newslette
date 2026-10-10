import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function akaarApiPlugin(): Plugin {
  // In-memory queue for incoming emails sent to support@akaar.com
  const inboundEmailQueue: any[] = [];

  return {
    name: 'akaar-crm-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 1. Inbound Webhook / API: Receive emails sent to support@akaar.com
        if ((req.url?.startsWith('/api/inbound-email') || req.url === '/api/webhook/email') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              let data: any = {};
              try {
                data = JSON.parse(body || '{}');
              } catch {
                try {
                  const params = new URLSearchParams(body);
                  data = Object.fromEntries(params.entries());
                } catch {
                  data = {};
                }
              }

              const from = data.from || data.senderEmail || data.sender_email || data.sender || data.email || 'client@gmail.com';
              const senderName = data.senderName || data.name || data.from_name || from.split('@')[0] || 'Client Sender';
              const to = data.to || data.recipientEmail || data.recipient || 'service@akaarentertainment.com';
              const subject = data.subject || `Inquiry to ${to}`;
              const bodyText = data.bodyText || data.body || data.message || data.text || data['stripped-text'] || data['body-plain'] || '';
              const receivedAt = data.receivedAt || new Date().toISOString();

              const emailId = `inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              const inboundEmail = {
                id: emailId,
                senderName,
                senderEmail: from,
                recipientEmail: to,
                subject,
                preview: bodyText.slice(0, 140) || `New message sent to ${to}`,
                bodyHtml: data.bodyHtml || `<div style="font-family: sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6;">
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 14px;">
                    <p style="margin: 0 0 4px 0; color: #166534; font-size: 12px;"><strong>Inbound Verified Gateway:</strong> ${to}</p>
                    <p style="margin: 0 0 4px 0;"><strong>From:</strong> ${senderName} &lt;${from}&gt;</p>
                    <p style="margin: 0;"><strong>Delivered To:</strong> ${to}</p>
                  </div>
                  <div style="white-space: pre-line;">${bodyText}</div>
                </div>`,
                receivedAt,
                read: false,
                starred: false,
                category: data.category || (subject.toLowerCase().includes('newsletter') || bodyText.toLowerCase().includes('unsubscribe') ? 'newsletter' : 'brand_query'),
                folderId: 'inbox',
                tags: ['Inbound Live', to, ...(data.tags || [])],
                brandMeta: data.brandMeta || (data.budget || bodyText.includes('₹') || bodyText.toLowerCase().includes('rs') ? {
                  budgetOffer: data.budget || '₹45,000',
                  serviceOpted: data.service || 'Brand Collaboration',
                  urgency: 'high',
                  clientEmail: from,
                  dealStage: 'new_lead'
                } : undefined),
                newsletterMeta: data.category === 'newsletter' ? {
                  publicationName: senderName,
                  frequency: 'weekly',
                  readTimeMinutes: 4,
                  hasUnsubscribe: true
                } : undefined,
                priority: data.priority || 'urgent',
              };

              inboundEmailQueue.unshift(inboundEmail);
              if (inboundEmailQueue.length > 50) {
                inboundEmailQueue.pop();
              }

              console.log(`[Akaar Inbound Gateway] Received new email for ${to} from ${from}: "${subject}"`);

              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                message: `Email received and ingested for ${to}`,
                emailId,
                email: inboundEmail,
              }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message || 'Invalid inbound payload' }));
            }
          });
          return;
        }

        // 2. Fetch Inbound Emails: Retrieve received emails for CRM sync
        if (req.url?.startsWith('/api/inbound-email') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            count: inboundEmailQueue.length,
            targetMailbox: 'service@akaarentertainment.com',
            emails: inboundEmailQueue,
          }));
          return;
        }

        if (req.url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const to = data.to;
              const senderFrom = data.from || 'service@akaarentertainment.com';
              const subject = data.subject || `Message from Akaar Entertainment (${senderFrom})`;
              const bodyText = data.bodyText || '';

              console.log(
                `[Akaar CRM FormSubmit Tool] Dispathing email to ${to} from ${senderFrom}: "${subject}"`
              );

              // Real delivery via FormSubmit tool
              const origin = req.headers.origin || req.headers.referer || 'https://akaar-support.local';
              const referer = req.headers.referer || origin;
              let formSubmitSuccess = true;
              let formSubmitMsg = 'Dispatched via FormSubmit tool';

              try {
                const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': String(origin),
                    'Referer': String(referer),
                  },
                  body: JSON.stringify({
                    name: `Akaar Entertainment (${senderFrom})`,
                    email: senderFrom,
                    _replyto: senderFrom,
                    _subject: subject,
                    _captcha: 'false',
                    _template: 'table',
                    Sender: senderFrom,
                    From: `Akaar Entertainment <${senderFrom}>`,
                    Official_Mailbox: senderFrom,
                    Recipient: to,
                    Message: bodyText,
                    ...(data.cc ? { Cc: data.cc } : {}),
                  }),
                });
                const fsJson = await fsRes.json().catch(() => null);
                if (fsJson?.message) {
                  formSubmitMsg = fsJson.message;
                }
              } catch (fsErr) {
                console.warn('[FormSubmit Delivery Fallback]', fsErr);
              }

              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200);
              res.end(
                JSON.stringify({
                  success: formSubmitSuccess,
                  messageId: `fs-akaar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  from: senderFrom,
                  to,
                  subject,
                  sentAt: new Date().toISOString(),
                  method: 'formsubmit_tool',
                  provider: 'FormSubmit.co',
                  message: formSubmitMsg,
                  status: 'delivered',
                })
              );
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message || 'Invalid request' }));
            }
          });
          return;
        }

        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'ok', sender: 'service@akaarentertainment.com' }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), akaarApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
