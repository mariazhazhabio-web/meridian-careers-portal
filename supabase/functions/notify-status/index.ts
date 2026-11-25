// ════════════════════════════════════════════════════════════════════════════
// POST /functions/v1/notify-status   { applicationId }
// Sends the candidate a status-update email. Caller MUST be a signed-in admin:
// the JWT is verified by Supabase (deploy WITHOUT --no-verify-jwt) and we also
// check public.is_admin() as the caller before using the service role.
// ════════════════════════════════════════════════════════════════════════════
import { statusUpdateEmail } from '../_shared/emailTemplates.js';
import { adminClient, callerClient, corsHeaders, json } from '../_shared/http.ts';
import { sendAndLog } from '../_shared/mailer.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  const { data: isAdmin } = await callerClient(req).rpc('is_admin');
  if (!isAdmin) return json(req, { error: 'Forbidden' }, 403);

  const { applicationId } = await req.json().catch(() => ({}));
  if (typeof applicationId !== 'string') return json(req, { error: 'applicationId required' }, 400);

  const db = adminClient();
  const { data: app } = await db
    .from('applications')
    .select('id, reference, full_name, email, status, jobs(title)')
    .eq('id', applicationId)
    .maybeSingle();
  if (!app) return json(req, { error: 'Not found' }, 404);

  const mail = statusUpdateEmail({
    fullName: app.full_name,
    email: app.email,
    reference: app.reference,
    // deno-lint-ignore no-explicit-any
    jobTitle: (app as any).jobs?.title ?? 'your application',
    status: app.status,
  });
  if (!mail) return json(req, { skipped: true });
  const status = await sendAndLog(db, mail, { applicationId: app.id, reference: app.reference });
  return json(req, { status });
});
