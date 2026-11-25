import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, AlertTriangle, Lightbulb, LayoutGrid, Route as RouteIcon, Workflow, Cpu, TestTube2, Images, Server,
  CheckCircle2, FlaskConical, ArrowRight, X, Search, FileUp, Mail, ShieldCheck, BarChart3, Download, Smartphone,
  Lock, Database, Clock, Users, ChevronRight,
} from 'lucide-react';
import { useDocumentTitle } from '../lib/hooks.js';
import { cx } from '../lib/utils.js';

const TOC = [
  ['objectives', 'Objectives', Target],
  ['problem', 'Business problem', AlertTriangle],
  ['solution', 'Proposed solution', Lightbulb],
  ['features', 'Features', LayoutGrid],
  ['journey', 'Applicant journey', RouteIcon],
  ['workflow', 'Recruitment workflow', Workflow],
  ['tech', 'Technologies', Cpu],
  ['qa', 'Testing & QA', TestTube2],
  ['screens', 'Screenshots', Images],
  ['production', 'Production integration', Server],
];

const SHOTS = [
  ['desktop-home-hero', 'Careers landing page — hero and navigation', 'Desktop'],
  ['desktop-jobs', 'Job listings with search and three filters', 'Desktop'],
  ['desktop-job-detail', 'Vacancy detail with responsibilities, qualifications and Apply Now', 'Desktop'],
  ['desktop-apply-validation', 'Accessible inline validation on the application form', 'Desktop'],
  ['desktop-confirmation', 'Submission confirmation with reference number', 'Desktop'],
  ['desktop-email-previews', 'Applicant acknowledgement and HR notification email previews', 'Desktop'],
  ['desktop-admin-overview', 'HR dashboard — recruitment statistics', 'Desktop'],
  ['desktop-admin-applications', 'Applicant list with status tabs, search, filters and CSV export', 'Desktop'],
  ['desktop-admin-applicant', 'Applicant detail — resume download and status update', 'Desktop'],
  ['desktop-admin-vacancies', 'Vacancy management — publish, edit and close', 'Desktop'],
  ['desktop-admin-new-vacancy', 'Create-vacancy form', 'Desktop'],
  ['desktop-admin-emails', 'Email log of every automated message', 'Desktop'],
  ['tablet-jobs', 'Job listings on tablet', 'Tablet'],
  ['mobile-home', 'Careers home on mobile', 'Mobile'],
  ['mobile-menu', 'Mobile navigation', 'Mobile'],
  ['mobile-job-detail', 'Job detail with sticky Apply button', 'Mobile'],
  ['mobile-apply', 'Application form on mobile', 'Mobile'],
  ['mobile-admin-overview', 'HR dashboard on mobile', 'Mobile'],
  ['mobile-admin-applications', 'Applicant list on mobile', 'Mobile'],
];

function H2({ id, icon: I, eyebrow, children }) {
  return (
    <div id={id} className="scroll-mt-24">
      <p className="eyebrow flex items-center gap-1.5"><I className="h-3.5 w-3.5" aria-hidden="true" /> {eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">{children}</h2>
    </div>
  );
}

function Lightbox({ shot, onClose }) {
  useEffect(() => {
    if (!shot) return;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [shot, onClose]);
  if (!shot) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4" role="dialog" aria-modal="true" aria-label={shot[1]} onClick={onClose}>
      <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close screenshot"><X className="h-5 w-5" /></button>
      <figure className="max-h-full max-w-6xl overflow-auto" onClick={(e) => e.stopPropagation()}>
        <img src={`./screenshots/${shot[0]}.jpg`} alt={shot[1]} className="mx-auto max-h-[85vh] w-auto rounded-xl" />
        <figcaption className="mt-3 text-center text-sm text-navy-200">{shot[2]} · {shot[1]}</figcaption>
      </figure>
    </div>
  );
}

export default function CaseStudyPage() {
  useDocumentTitle('Case study');
  const [shot, setShot] = useState(null);
  const [device, setDevice] = useState('All');
  const shots = SHOTS.filter((s) => device === 'All' || s[2] === device);

  return (
    <>
      <section className="hero-grid bg-navy-900 text-white">
        <div className="container-x py-16 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-300">
            <FlaskConical className="h-3.5 w-3.5" /> Portfolio case study · ZC Smart Digital
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl">Employee Recruitment &amp; Careers Portal for Meridian &amp; Co.</h1>
          <p className="mt-5 max-w-3xl text-lg text-navy-200">
            A hiring section built to slot into an existing company website: candidates browse roles and apply online; HR reviews, shortlists and reports from a secure dashboard. Designed, built and tested end-to-end by ZC Smart Digital.
          </p>
          <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[['Budget band', '$500 – $1,000'], ['Stack', 'React · Vite · Tailwind · Supabase'], ['Automated tests', '98 passing'], ['Client', 'Meridian & Co. (fictional)']].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <dt className="text-xs text-navy-300">{k}</dt>
                <dd className="mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/" className="btn-primary px-6 py-3">Explore the live demo <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/admin/login" className="btn px-6 py-3 text-white ring-1 ring-white/25 hover:bg-white/10">Open the HR dashboard</Link>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-[220px_1fr] lg:py-20">
        <nav className="hidden lg:block" aria-label="Case study sections">
          <ul className="sticky top-24 space-y-1 text-sm">
            {TOC.map(([id, label, I]) => (
              <li key={id}>
                <Link to={`/case-study#${id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-navy-500 hover:bg-mist hover:text-navy-900">
                  <I className="h-4 w-4" aria-hidden="true" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 space-y-20">
          {/* Objectives */}
          <section className="space-y-6">
            <H2 id="objectives" icon={Target} eyebrow="01 · Project objectives">What the client asked for</H2>
            <p className="max-w-3xl leading-relaxed text-navy-600">Meridian &amp; Co. needed a hiring section inside its existing corporate website where candidates can view open roles and apply, and where HR can manage the whole pipeline without spreadsheets or shared inboxes.</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Present the employer brand: culture, benefits and a transparent hiring process',
                'Publish at least six vacancies that HR can add, edit, publish and close',
                'Capture complete, validated applications with resumes in one step',
                'Acknowledge every candidate instantly with a reference number',
                'Give HR a secure dashboard to review, categorise and export applicants',
                'Protect applicant data: restricted access, private storage, spam control',
              ].map((t) => (
                <li key={t} className="flex gap-3 rounded-xl bg-mist p-4 text-sm text-navy-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t}</li>
              ))}
            </ul>
          </section>

          {/* Problem */}
          <section className="space-y-6">
            <H2 id="problem" icon={AlertTriangle} eyebrow="02 · Business problem">Hiring by email doesn't scale</H2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Lost candidates', 'Resumes arrived in a shared inbox with no acknowledgement. Strong applicants went cold waiting for a reply.'],
                ['No single source of truth', 'Status lived in a spreadsheet maintained by hand, so hiring managers never knew who was shortlisted or interviewed.'],
                ['Privacy risk', 'CVs were forwarded as attachments and stored on personal drives with no retention policy or access control.'],
              ].map(([t, d]) => (
                <div key={t} className="card p-5"><h3 className="font-bold text-navy-900">{t}</h3><p className="mt-2 text-sm leading-relaxed text-navy-500">{d}</p></div>
              ))}
            </div>
          </section>

          {/* Solution */}
          <section className="space-y-6">
            <H2 id="solution" icon={Lightbulb} eyebrow="03 · Proposed solution">A careers front-end plus a lightweight applicant tracking system</H2>
            <p className="max-w-3xl leading-relaxed text-navy-600">
              A React single-page application that can be mounted under <code className="rounded bg-mist px-1.5 py-0.5 text-sm">/careers</code> of any existing website, backed by Supabase for the database, authentication, private file storage and serverless functions. A single adapter interface lets the exact same UI run in two modes:
            </p>
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Production features compared with demo simulations</caption>
                <thead className="bg-navy-900 text-white">
                  <tr><th scope="col" className="px-4 py-3">Capability</th><th scope="col" className="px-4 py-3">Production (Supabase) — working code</th><th scope="col" className="px-4 py-3">Public demo — simulated</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ['Data storage', 'PostgreSQL tables with constraints & triggers', 'localStorage in the visitor’s browser'],
                    ['Resume storage', 'Private Storage bucket, 5 MB limit, signed 60-second download links', 'IndexedDB in the visitor’s browser'],
                    ['Admin sign-in', 'Supabase Auth + admin_users allow-list + RLS', 'Simulated session with published demo credentials'],
                    ['Server-side validation', 'Edge Function re-validates every field and inspects file bytes', 'Same shared rules run in the browser adapter'],
                    ['Spam protection', 'Honeypot, min fill-time, IP-hash + email rate limits, optional Turnstile', 'Honeypot, fill-time, duplicate and 3-open-applications limits'],
                    ['Emails', 'Sent via Resend from the Edge Function and logged', 'Rendered with the same templates as previews — not sent'],
                    ['Reference numbers', 'Generated in Postgres (unique)', 'Generated in the browser (same format)'],
                  ].map(([a, b, c]) => (
                    <tr key={a} className="align-top"><th scope="row" className="px-4 py-3 font-semibold text-navy-900">{a}</th><td className="px-4 py-3 text-navy-600">{b}</td><td className="px-4 py-3 text-navy-500">{c}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-navy-400">Production mode is fully implemented and its database security is tested against real PostgreSQL. It requires the client’s own Supabase project and email provider keys to go live — see “Production integration” below.</p>
          </section>

          {/* Features */}
          <section className="space-y-6">
            <H2 id="features" icon={LayoutGrid} eyebrow="04 · Website features">What was built</H2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [LayoutGrid, 'Careers landing page', 'Navigation, hero, company introduction, benefits, culture & values, open positions, recruitment process, FAQ accordion and HR contact.'],
                [Search, 'Job listings', 'Seven live vacancies (plus a draft and a closed role), title search, department / employment type / location filters, detail pages and Apply Now.'],
                [FileUp, 'Online application', 'Name, email, phone, position, experience, drag-and-drop resume, cover letter with counter, privacy consent, accessible validation and confirmation.'],
                [ShieldCheck, 'HR dashboard', 'Restricted sign-in, applicant search & filters, New → Shortlisted → Interviewed → Hired / Rejected workflow, internal notes and resume downloads.'],
                [BarChart3, 'Recruitment statistics', 'KPIs, pipeline breakdown, 14-day trend, department split, most-applied roles and latest applicants.'],
                [Download, 'Vacancy management & CSV', 'Create, edit, publish and close jobs; export the filtered applicant list to an injection-safe CSV.'],
                [Mail, 'Automation', 'Applicant acknowledgement, HR notification and optional status-update emails, each tied to an MC-YYYY-XXXXXX reference.'],
                [Smartphone, 'Responsive & accessible', 'Mobile-first layouts, keyboard support, focus management, ARIA labelling and reduced-motion support.'],
              ].map(([I, t, d]) => (
                <div key={t} className="card flex gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><I className="h-5 w-5" aria-hidden="true" /></span>
                  <div><h3 className="font-bold text-navy-900">{t}</h3><p className="mt-1 text-sm leading-relaxed text-navy-500">{d}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* Journey */}
          <section className="space-y-6">
            <H2 id="journey" icon={RouteIcon} eyebrow="05 · Applicant journey">From curiosity to confirmation in under 10 minutes</H2>
            <ol className="grid gap-3 md:grid-cols-5">
              {['Discovers the careers page from the main site', 'Searches and filters open roles', 'Reads responsibilities and qualifications', 'Completes the validated form and uploads a resume', 'Gets a reference number and confirmation email'].map((t, i) => (
                <li key={t} className="relative rounded-xl bg-mist p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-emerald-400">{i + 1}</span>
                  <p className="mt-3 text-sm font-medium text-navy-800">{t}</p>
                  {i < 4 && <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-navy-300 md:block" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </section>

          {/* Workflow */}
          <section className="space-y-6">
            <H2 id="workflow" icon={Workflow} eyebrow="06 · Recruitment workflow">How HR moves a candidate through the pipeline</H2>
            <div className="card overflow-x-auto p-5 sm:p-6">
              <svg viewBox="0 0 860 210" className="min-w-[640px]" role="img" aria-labelledby="wf-title">
                <title id="wf-title">Application status flow: Submitted to New, then Shortlisted, Interviewed and Hired, with Rejected possible from New, Shortlisted or Interviewed.</title>
                <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" fill="#7f97c2" /></marker></defs>
                {[[20, 'Submitted', '#0b1a33', '#fff'], [190, 'New', '#e0f2fe', '#0369a1'], [360, 'Shortlisted', '#fef3c7', '#92400e'], [530, 'Interviewed', '#ede9fe', '#6d28d9'], [700, 'Hired', '#d1fae5', '#047857']].map(([x, l, bg, fg]) => (
                  <g key={l}><rect x={x} y="40" width="140" height="52" rx="12" fill={bg} /><text x={x + 70} y="71" textAnchor="middle" fontSize="15" fontWeight="700" fill={fg}>{l}</text></g>
                ))}
                {[160, 330, 500, 670].map((x) => <line key={x} x1={x} y1="66" x2={x + 28} y2="66" stroke="#7f97c2" strokeWidth="2" markerEnd="url(#arr)" />)}
                <rect x="360" y="150" width="140" height="48" rx="12" fill="#fee2e2" /><text x="430" y="179" textAnchor="middle" fontSize="15" fontWeight="700" fill="#b91c1c">Rejected</text>
                {[260, 430, 600].map((x) => <path key={x} d={`M${x} 92 C ${x} 125, 430 120, 430 148`} fill="none" stroke="#fca5a5" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arr)" />)}
                <text x="90" y="118" textAnchor="middle" fontSize="11" fill="#5371a6">Acknowledgement +</text>
                <text x="90" y="133" textAnchor="middle" fontSize="11" fill="#5371a6">HR alert emailed</text>
                <text x="770" y="118" textAnchor="middle" fontSize="11" fill="#5371a6">Optional status email</text>
                <text x="770" y="133" textAnchor="middle" fontSize="11" fill="#5371a6">at every change</text>
              </svg>
            </div>
            <ul className="grid gap-3 text-sm text-navy-600 sm:grid-cols-3">
              <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Every status change is written to an audit table with who and when.</li>
              <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> HR can edit status and notes only — the candidate’s submission is immutable.</li>
              <li className="flex gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Duplicate applications per role are blocked; candidates may hold three open applications.</li>
            </ul>
          </section>

          {/* Tech */}
          <section className="space-y-6">
            <H2 id="tech" icon={Cpu} eyebrow="07 · Technologies used">Lean, modern and easy to hand over</H2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['React 18 + React Router', 'Component UI, hash or clean-URL routing, lazy-loaded admin bundle'],
                ['Vite', 'Fast builds; relative base path so it deploys under any sub-folder'],
                ['Tailwind CSS v4', 'Design tokens for navy, emerald, white and light gray'],
                ['Supabase Postgres', 'Constraints, triggers, reference generator, audit log'],
                ['Supabase Auth + RLS', 'Admin allow-list and row-level security on every table'],
                ['Supabase Storage', 'Private resumes bucket with size and MIME limits'],
                ['Supabase Edge Functions (Deno)', 'Server-side validation, spam control and email sending'],
                ['Resend', 'Transactional email delivery (swappable)'],
                ['Vitest · Playwright · PGlite', 'Unit, end-to-end and real-Postgres security tests'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-line p-4"><p className="flex items-center gap-2 font-semibold text-navy-900"><Database className="h-4 w-4 text-emerald-600" />{t}</p><p className="mt-1 text-sm text-navy-500">{d}</p></div>
              ))}
            </div>
          </section>

          {/* QA */}
          <section className="space-y-6">
            <H2 id="qa" icon={TestTube2} eyebrow="08 · Testing & quality assurance">98 automated tests, all passing</H2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[['54', 'Unit tests', 'Validation, file signatures, CSV escaping, statistics, email templates, demo pipeline & admin rules (Vitest)'], ['18', 'Database security tests', 'The real migration files run on PostgreSQL (PGlite) and RLS is checked as anon, signed-in user and admin'], ['26', 'End-to-end tests', '13 user flows × desktop and mobile viewports in Microsoft Edge (Playwright)']].map(([n, t, d]) => (
                <div key={t} className="card p-5"><p className="font-display text-4xl font-extrabold text-emerald-600">{n}</p><p className="mt-1 font-bold text-navy-900">{t}</p><p className="mt-2 text-sm text-navy-500">{d}</p></div>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-navy-600"><tr><th scope="col" className="px-4 py-3">Scenario verified</th><th scope="col" className="px-4 py-3">Result</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {[
                    'All landing-page sections render; FAQ accordion is keyboard-operable',
                    'Title search and department / type / location filters combine correctly',
                    'Draft and closed vacancies are unreachable publicly',
                    'Required-field errors, invalid email, wrong file type, renamed .exe and >5 MB files are rejected',
                    'Successful application returns a valid reference and both email previews',
                    'Duplicate applications, honeypot bots and too-fast submissions are blocked',
                    'Admin routes redirect to sign-in; wrong password is refused',
                    'Status change + notes persist and generate a status email',
                    'Resume download returns a genuine PDF; CSV export matches the filtered list',
                    'New vacancy publishes to the public site and disappears when closed',
                    'Anonymous users cannot read applications, drafts or resumes (RLS)',
                    'Admins cannot alter candidate-submitted fields; status changes are audited',
                    'No horizontal scrolling on mobile for key pages',
                  ].map((t) => (
                    <tr key={t}><td className="px-4 py-2.5 text-navy-700">{t}</td><td className="px-4 py-2.5"><span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Pass</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-navy-400">Not covered by automation: live delivery through Resend, Turnstile verification and the deployed Edge Functions themselves, which need the client’s Supabase project and keys. These are listed as acceptance checks in the deployment guide.</p>
          </section>

          {/* Screens */}
          <section className="space-y-6">
            <H2 id="screens" icon={Images} eyebrow="09 · Screenshots">Captured from the running application</H2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter screenshots by device">
              {['All', 'Desktop', 'Tablet', 'Mobile'].map((d) => (
                <button key={d} onClick={() => setDevice(d)} aria-pressed={device === d} className={cx('rounded-full px-4 py-1.5 text-sm font-semibold', device === d ? 'bg-navy-900 text-white' : 'bg-mist text-navy-600 hover:bg-navy-50')}>{d}</button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shots.map((s) => (
                <figure key={s[0]} className="group">
                  <button onClick={() => setShot(s)} className="block w-full overflow-hidden rounded-xl border border-line bg-mist shadow-card transition hover:shadow-lift" aria-label={`Enlarge: ${s[1]}`}>
                    <img src={`./screenshots/${s[0]}.jpg`} alt={s[1]} loading="lazy" className={cx('w-full object-cover object-top transition group-hover:scale-[1.02]', s[2] === 'Mobile' ? 'aspect-[3/4]' : 'aspect-[16/10]')} />
                  </button>
                  <figcaption className="mt-2 text-sm text-navy-600"><span className="font-semibold text-navy-900">{s[2]}</span> · {s[1]}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* Production */}
          <section className="space-y-6">
            <H2 id="production" icon={Server} eyebrow="10 · Production integration requirements">What the client provides to go live</H2>
            <ol className="space-y-3">
              {[
                ['Supabase project', 'Run the two SQL migrations (schema + security) and deploy the two Edge Functions.'],
                ['HR accounts', 'Create users in Supabase Auth (sign-up disabled) and add their IDs to admin_users.'],
                ['Email provider', 'A Resend API key and a verified sending domain (or swap the 40-line mailer for SendGrid / SES).'],
                ['Environment variables', 'VITE_APP_MODE=production, Supabase URL and anon key in the host; secrets only in Supabase.'],
                ['Spam protection (optional)', 'Cloudflare Turnstile site + secret keys for an invisible human check.'],
                ['Website integration', 'Deploy the build to /careers on the existing domain, link it from the main navigation and match fonts/colours via the Tailwind tokens.'],
                ['Legal review', 'Have the applicant privacy notice and retention period reviewed for the applicable jurisdiction.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4 rounded-xl border border-line p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">{i + 1}</span>
                  <div><p className="font-semibold text-navy-900">{t}</p><p className="text-sm text-navy-500">{d}</p></div>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl bg-navy-900 p-6 text-white sm:p-8">
              <p className="font-display text-xl font-bold">Want this for your company?</p>
              <p className="mt-2 max-w-2xl text-navy-200">ZC Smart Digital delivers this portal branded to your website, connected to your Supabase project and email domain, with handover documentation and a QA report.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/" className="btn-primary">Try the candidate experience</Link>
                <Link to="/admin/login" className="btn text-white ring-1 ring-white/25 hover:bg-white/10">Try the HR dashboard</Link>
              </div>
            </div>
          </section>
        </article>
      </div>
      <Lightbox shot={shot} onClose={() => setShot(null)} />
    </>
  );
}
