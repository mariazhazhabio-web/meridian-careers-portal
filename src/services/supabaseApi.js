// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION ADAPTER — Supabase (Postgres + Auth + private Storage + Edge Functions)
//
// Security model
// • The browser only holds the public ANON key. All privileges come from
//   Row-Level Security policies (supabase/migrations) bound to the signed-in user.
// • Anonymous visitors can read PUBLISHED jobs only. They cannot read or write
//   the applications table or the resumes bucket directly.
// • Applications are submitted to the `submit-application` Edge Function, which
//   re-validates everything server-side, checks spam signals, stores the resume
//   in the PRIVATE `resumes` bucket and sends emails. The service-role key only
//   exists inside that function's environment.
// • Admin reads/writes succeed only if auth.uid() is listed in public.admin_users.
// • Resumes are downloaded through short-lived (60 s) signed URLs.
// ─────────────────────────────────────────────────────────────────────────────
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config.js';
import { validateJob } from '../lib/validation.js';
import { slugify } from '../lib/utils.js';

let client;
/** Lazily loads supabase-js so the demo bundle never ships it. */
export async function sb() {
  if (!client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or use VITE_APP_MODE=demo.');
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  }
  return client;
}

const fromJobRow = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  department: r.department,
  location: r.location,
  employmentType: r.employment_type,
  salaryMin: r.salary_min,
  salaryMax: r.salary_max,
  summary: r.summary,
  responsibilities: r.responsibilities || [],
  qualifications: r.qualifications || [],
  niceToHave: r.nice_to_have || [],
  status: r.status,
  postedAt: r.posted_at,
  closesAt: r.closes_at,
});
const toJobRow = (j) => ({
  title: j.title.trim(),
  department: j.department,
  location: j.location,
  employment_type: j.employmentType,
  salary_min: j.salaryMin ? Number(j.salaryMin) : null,
  salary_max: j.salaryMax ? Number(j.salaryMax) : null,
  summary: j.summary.trim(),
  responsibilities: j.responsibilities.map((x) => x.trim()).filter(Boolean),
  qualifications: j.qualifications.map((x) => x.trim()).filter(Boolean),
  nice_to_have: (j.niceToHave || []).map((x) => x.trim()).filter(Boolean),
  status: j.status,
  closes_at: j.closesAt || null,
});
const fromAppRow = (r) => ({
  id: r.id,
  reference: r.reference,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  jobId: r.job_id,
  jobTitle: r.jobs?.title ?? 'Unknown role',
  department: r.jobs?.department ?? '—',
  experience: r.experience,
  coverLetter: r.cover_letter,
  status: r.status,
  notes: r.notes || '',
  resumePath: r.resume_path,
  resumeName: r.resume_name,
  resumeSize: r.resume_size,
  resumeType: r.resume_type,
  consent: r.consent,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const must = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const supabaseApi = {
  mode: 'production',

  async listPublishedJobs() {
    // RLS: anon may only select rows where status = 'published'
    const rows = must(await (await sb()).from('jobs').select('*').eq('status', 'published').order('posted_at', { ascending: false }));
    return rows.map(fromJobRow);
  },

  async getJobBySlug(slug) {
    const row = must(await (await sb()).from('jobs').select('*').eq('slug', slug).maybeSingle());
    return row ? fromJobRow(row) : null;
  },

  async submitApplication({ values, file, honeypot = '', startedAt, turnstileToken = '' }) {
    const form = new FormData();
    Object.entries(values).forEach(([k, v]) => form.append(k, String(v)));
    form.append('resume', file);
    form.append('website', honeypot); // honeypot
    form.append('startedAt', String(startedAt || ''));
    form.append('turnstileToken', turnstileToken);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-application`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error || 'Submission failed. Please try again.'), { status: res.status, fieldErrors: body.fieldErrors });
    return body; // { reference, createdAt, jobTitle, email }
  },

  async getEmailsForReference() {
    return []; // Real emails are delivered to inboxes; no public preview in production.
  },

  // ── auth ──
  async signIn(email, password) {
    const data = must(await (await sb()).auth.signInWithPassword({ email, password }));
    const isAdmin = must(await (await sb()).rpc('is_admin'));
    if (!isAdmin) {
      await (await sb()).auth.signOut();
      throw new Error('This account is not authorised to access the HR dashboard.');
    }
    return { user: { email: data.user.email, name: data.user.user_metadata?.full_name || data.user.email, role: 'admin' } };
  },
  async signOut() {
    await (await sb()).auth.signOut();
  },
  async getSession() {
    const { data } = await (await sb()).auth.getSession();
    if (!data.session) return null;
    const { data: isAdmin } = await (await sb()).rpc('is_admin');
    if (!isAdmin) return null;
    const u = data.session.user;
    return { user: { email: u.email, name: u.user_metadata?.full_name || u.email, role: 'admin' } };
  },
  onAuthChange(cb) {
    let sub;
    sb().then((c) => {
      sub = c.auth.onAuthStateChange(async () => cb(await supabaseApi.getSession())).data.subscription;
    });
    return () => sub?.unsubscribe();
  },

  // ── admin (all calls are additionally enforced by RLS) ──
  async listJobs() {
    const rows = must(await (await sb()).from('jobs').select('*, applications(count)').order('created_at', { ascending: false }));
    return rows.map((r) => ({ ...fromJobRow(r), applicationCount: r.applications?.[0]?.count ?? 0 }));
  },
  async saveJob(job) {
    const { valid, errors } = validateJob(job);
    if (!valid) throw Object.assign(new Error('Please correct the highlighted fields.'), { fieldErrors: errors });
    const row = toJobRow(job);
    if (job.id) return fromJobRow(must(await (await sb()).from('jobs').update(row).eq('id', job.id).select().single()));
    const slug = `${slugify(job.title)}-${Math.random().toString(36).slice(2, 6)}`;
    return fromJobRow(must(await (await sb()).from('jobs').insert({ ...row, slug }).select().single()));
  },
  async setJobStatus(id, status) {
    must(await (await sb()).from('jobs').update({ status }).eq('id', id));
  },
  async listApplications() {
    const rows = must(await (await sb()).from('applications').select('*, jobs(title, department)').order('created_at', { ascending: false }));
    return rows.map(fromAppRow);
  },
  async updateApplication(id, patch, { notifyCandidate = false } = {}) {
    const row = {};
    if (patch.status) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    const updated = fromAppRow(must(await (await sb()).from('applications').update(row).eq('id', id).select('*, jobs(title, department)').single()));
    if (notifyCandidate && patch.status) {
      const { error } = await (await sb()).functions.invoke('notify-status', { body: { applicationId: id } });
      if (error) console.warn('Status email failed:', error.message);
    }
    return updated;
  },
  async downloadResume(app) {
    // Storage RLS only allows admins to read the private `resumes` bucket.
    const { signedUrl } = must(await (await sb()).storage.from('resumes').createSignedUrl(app.resumePath, 60, { download: app.resumeName }));
    return { url: signedUrl, filename: app.resumeName };
  },
  async listEmails() {
    const rows = must(await (await sb()).from('email_log').select('*').order('sent_at', { ascending: false }).limit(200));
    return rows.map((r) => ({ id: r.id, to: r.recipient, subject: r.subject, kind: r.kind, reference: r.reference, sentAt: r.sent_at, delivery: r.status, html: r.html_preview, text: '' }));
  },
};
