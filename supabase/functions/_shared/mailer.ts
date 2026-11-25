// Sends transactional email through Resend (https://resend.com) and records every
// attempt in public.email_log. If RESEND_API_KEY is not set the email is logged
// with status "skipped" so the pipeline still works in staging.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

type Mail = { to: string; subject: string; html: string; text: string; kind: string };

export async function sendAndLog(db: SupabaseClient, mail: Mail, meta: { applicationId?: string; reference?: string }) {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'Meridian & Co. Careers <onboarding@resend.dev>';
  let status: 'sent' | 'failed' | 'skipped' = 'skipped';
  let providerId: string | null = null;
  let error: string | null = null;

  if (key) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        status = 'sent';
        providerId = body.id ?? null;
      } else {
        status = 'failed';
        error = body.message ?? `HTTP ${res.status}`;
      }
    } catch (e) {
      status = 'failed';
      error = String(e);
    }
  }

  await db.from('email_log').insert({
    application_id: meta.applicationId ?? null,
    reference: meta.reference ?? null,
    kind: mail.kind,
    recipient: mail.to,
    subject: mail.subject,
    html_preview: mail.html,
    status,
    provider_id: providerId,
    error,
  });
  return status;
}
