// ─────────────────────────────────────────────────────────────────────────────
// DEMO ADAPTER — simulated backend that runs entirely in the visitor's browser.
// • Jobs, applications and the email outbox live in localStorage.
// • Uploaded resumes live in IndexedDB (falls back to memory if unavailable).
// • "Authentication" is a simulated session with published demo credentials.
// • Emails are NOT sent — they are rendered and stored as previews.
// Nothing leaves the browser. See supabaseApi.js for the production adapter.
// ─────────────────────────────────────────────────────────────────────────────
import { SEED_JOBS, SEED_APPLICATIONS, makeDemoResumePdf } from '../data/seed.js';
import { applicantAcknowledgementEmail, hrNotificationEmail, statusUpdateEmail } from '../../supabase/functions/_shared/emailTemplates.js';
import { validateApplication, validateResumeFile, checkFileSignature, validateJob, MIN_FILL_SECONDS } from '../lib/validation.js';
import { generateReference, slugify } from '../lib/utils.js';
import { HR_EMAIL } from '../lib/config.js';

export const DEMO_CREDENTIALS = { email: 'hr.admin@meridian-demo.test', password: 'MeridianDemo!2026' };

const KEY = 'meridian-careers-demo:v1';
const SESSION_KEY = 'meridian-careers-demo:session';
const latency = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ── localStorage state ──────────────────────────────────────────────────────
function safeStorage() {
  try {
    const k = '__mc_probe';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    const mem = new Map();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  }
}
const store = typeof window !== 'undefined' ? safeStorage() : null;

function seedState() {
  return { jobs: structuredClone(SEED_JOBS), applications: structuredClone(SEED_APPLICATIONS), emails: [], seededAt: new Date().toISOString() };
}
function load() {
  try {
    const raw = store.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted → reseed */ }
  const s = seedState();
  save(s);
  return s;
}
function save(state) {
  store.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('mc-demo-change'));
}

// ── IndexedDB for resume blobs ──────────────────────────────────────────────
const memFiles = new Map();
function idb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const req = indexedDB.open('meridian-careers-demo', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('resumes');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
async function putFile(key, blob) {
  const db = await idb();
  if (!db) return void memFiles.set(key, blob);
  await new Promise((res, rej) => {
    const tx = db.transaction('resumes', 'readwrite');
    tx.objectStore('resumes').put(blob, key);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  }).catch(() => memFiles.set(key, blob));
}
async function getFile(key) {
  if (memFiles.has(key)) return memFiles.get(key);
  const db = await idb();
  if (!db) return null;
  return new Promise((res) => {
    const r = db.transaction('resumes').objectStore('resumes').get(key);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => res(null);
  });
}

// ── helpers ────────────────────────────────────────────────────────────────
function decorate(app, jobs) {
  const job = jobs.find((j) => j.id === app.jobId);
  return { ...app, jobTitle: job?.title ?? 'Unknown role', department: job?.department ?? '—' };
}
function requireAdmin() {
  const s = getSessionSync();
  if (!s) {
    const e = new Error('Not authorised. Please sign in as an HR administrator.');
    e.status = 401;
    throw e;
  }
  return s;
}
function getSessionSync() {
  try {
    const s = JSON.parse(store.getItem(SESSION_KEY) || 'null');
    if (s && new Date(s.expiresAt) > new Date()) return s;
  } catch { /* ignore */ }
  return null;
}
const authListeners = new Set();
const emitAuth = () => authListeners.forEach((cb) => cb(getSessionSync()));

// ── public API ─────────────────────────────────────────────────────────────
export const demoApi = {
  mode: 'demo',

  async listPublishedJobs() {
    await latency(150);
    return load().jobs.filter((j) => j.status === 'published').sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  },

  async getJobBySlug(slug, { includeUnpublished = false } = {}) {
    await latency(100);
    const job = load().jobs.find((j) => j.slug === slug);
    if (!job || (!includeUnpublished && job.status !== 'published')) return null;
    return job;
  },

  /**
   * Mirrors the server pipeline of the submit-application Edge Function:
   * spam checks → validation → file checks → duplicate check → store → emails.
   */
  async submitApplication({ values, file, honeypot = '', startedAt }) {
    await latency(700);
    const state = load();
    const openIds = state.jobs.filter((j) => j.status === 'published').map((j) => j.id);

    // Spam protection (same rules as production)
    if (honeypot) throw Object.assign(new Error('Submission rejected.'), { status: 400 });
    if (startedAt && (Date.now() - startedAt) / 1000 < MIN_FILL_SECONDS)
      throw Object.assign(new Error('That was quick! Please review your details and submit again.'), { status: 429 });

    const { valid, errors, values: clean } = validateApplication(values, { jobIds: openIds });
    const fileError = validateResumeFile(file) || (file && (await checkFileSignature(file)));
    if (fileError) errors.resume = fileError;
    if (!valid || fileError) throw Object.assign(new Error('Please correct the highlighted fields.'), { status: 422, fieldErrors: errors });

    const dup = state.applications.find((a) => a.jobId === clean.jobId && a.email === clean.email);
    if (dup)
      throw Object.assign(new Error(`You have already applied for this role (reference ${dup.reference}). Please contact HR to update your application.`), { status: 409 });
    const open = state.applications.filter(
      (a) => a.email === clean.email && ['new', 'shortlisted', 'interviewed'].includes(a.status) && Date.now() - new Date(a.createdAt) < 30 * 86400e3,
    );
    if (open.length >= 3)
      throw Object.assign(new Error('You already have 3 applications in progress. Please wait for an update before applying again.'), { status: 429 });

    let reference;
    do reference = generateReference();
    while (state.applications.some((a) => a.reference === reference));

    const job = state.jobs.find((j) => j.id === clean.jobId);
    const now = new Date().toISOString();
    const app = {
      id: uid('app'),
      reference,
      ...clean,
      status: 'new',
      notes: '',
      resumeName: file.name,
      resumeSize: file.size,
      resumeType: file.type || 'application/octet-stream',
      createdAt: now,
      updatedAt: now,
    };
    await putFile(app.id, file);

    const ctx = { ...app, jobTitle: job.title, department: job.department };
    const emails = [
      applicantAcknowledgementEmail(ctx),
      hrNotificationEmail({ ...ctx, hrEmail: HR_EMAIL, dashboardUrl: `${location.origin}${location.pathname}#/admin/applications/${app.id}` }),
    ].map((e) => ({ ...e, id: uid('mail'), applicationId: app.id, reference, sentAt: now, delivery: 'simulated' }));

    state.applications.unshift(app);
    state.emails.unshift(...emails);
    save(state);
    return { reference, createdAt: now, jobTitle: job.title, email: clean.email, emails };
  },

  async getEmailsForReference(reference) {
    return load().emails.filter((e) => e.reference === reference);
  },

  // ── auth (simulated) ──
  async signIn(email, password) {
    await latency(500);
    if (String(email).trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password)
      throw new Error('Invalid email or password.');
    const session = { user: { email: DEMO_CREDENTIALS.email, name: 'Demo HR Administrator', role: 'admin' }, expiresAt: new Date(Date.now() + 8 * 3600e3).toISOString() };
    store.setItem(SESSION_KEY, JSON.stringify(session));
    emitAuth();
    return session;
  },
  async signOut() {
    store.removeItem(SESSION_KEY);
    emitAuth();
  },
  async getSession() {
    return getSessionSync();
  },
  onAuthChange(cb) {
    authListeners.add(cb);
    return () => authListeners.delete(cb);
  },

  // ── admin ──
  async listJobs() {
    requireAdmin();
    await latency(120);
    const s = load();
    return s.jobs.map((j) => ({ ...j, applicationCount: s.applications.filter((a) => a.jobId === j.id).length }));
  },
  async saveJob(input) {
    requireAdmin();
    const { valid, errors } = validateJob(input);
    if (!valid) throw Object.assign(new Error('Please correct the highlighted fields.'), { fieldErrors: errors });
    await latency(300);
    const s = load();
    const clean = {
      ...input,
      responsibilities: input.responsibilities.map((x) => x.trim()).filter(Boolean),
      qualifications: input.qualifications.map((x) => x.trim()).filter(Boolean),
      niceToHave: (input.niceToHave || []).map((x) => x.trim()).filter(Boolean),
      salaryMin: input.salaryMin ? Number(input.salaryMin) : null,
      salaryMax: input.salaryMax ? Number(input.salaryMax) : null,
    };
    if (clean.id) {
      const i = s.jobs.findIndex((j) => j.id === clean.id);
      if (clean.status === 'published' && !s.jobs[i].postedAt) clean.postedAt = new Date().toISOString();
      s.jobs[i] = { ...s.jobs[i], ...clean };
    } else {
      let slug = slugify(clean.title);
      while (s.jobs.some((j) => j.slug === slug)) slug += '-' + Math.random().toString(36).slice(2, 5);
      s.jobs.unshift({ ...clean, id: uid('job'), slug, postedAt: clean.status === 'published' ? new Date().toISOString() : null });
    }
    save(s);
    return clean;
  },
  async setJobStatus(id, status) {
    requireAdmin();
    const s = load();
    const j = s.jobs.find((x) => x.id === id);
    j.status = status;
    if (status === 'published' && !j.postedAt) j.postedAt = new Date().toISOString();
    save(s);
  },
  async listApplications() {
    requireAdmin();
    await latency(150);
    const s = load();
    return s.applications.map((a) => decorate(a, s.jobs));
  },
  async updateApplication(id, patch, { notifyCandidate = false } = {}) {
    requireAdmin();
    await latency(200);
    const s = load();
    const a = s.applications.find((x) => x.id === id);
    const prevStatus = a.status;
    Object.assign(a, patch, { updatedAt: new Date().toISOString() });
    if (notifyCandidate && patch.status && patch.status !== prevStatus) {
      const mail = statusUpdateEmail(decorate(a, s.jobs));
      if (mail) s.emails.unshift({ ...mail, id: uid('mail'), applicationId: a.id, reference: a.reference, sentAt: new Date().toISOString(), delivery: 'simulated' });
    }
    save(s);
    return decorate(a, s.jobs);
  },
  async downloadResume(app) {
    requireAdmin();
    let blob = await getFile(app.id);
    if (!blob) blob = makeDemoResumePdf(app, app.jobTitle);
    return { blob, filename: app.resumeName };
  },
  async listEmails() {
    requireAdmin();
    return load().emails;
  },
  async resetDemo() {
    save(seedState());
  },
};
