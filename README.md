# Meridian & Co. — Careers & Recruitment Portal

> **Portfolio demonstration by ZC Smart Digital.** Meridian & Co. is a fictional company. All applicant data in the demo is invented.

A complete hiring section designed to slot into an existing company website. Candidates browse vacancies and apply online; HR reviews, categorises and reports on applicants from a secure dashboard.

| | |
|---|---|
| **Frontend** | React 18 · Vite · Tailwind CSS v4 · React Router · lucide icons |
| **Backend (production)** | Supabase Postgres · Auth · private Storage · Edge Functions (Deno) · Resend email |
| **Tests** | 98 automated — 54 unit (Vitest), 18 database/RLS (PGlite), 26 end-to-end (Playwright, desktop + mobile) |

---

## Two modes, one codebase

The UI talks to a single adapter interface (`src/services/api.js`). The build-time variable `VITE_APP_MODE` picks the implementation.

| Capability | `production` — working code, needs your Supabase project | `demo` — simulated, no credentials |
|---|---|---|
| Data | Postgres tables, constraints, triggers | `localStorage` in the visitor's browser |
| Resumes | Private bucket (5 MB, PDF/DOC/DOCX), 60 s signed download links | IndexedDB in the browser |
| Admin login | Supabase Auth + `admin_users` allow-list + RLS | Simulated session, published demo credentials |
| Server-side validation | `submit-application` Edge Function (shared rules + magic-byte check) | Same shared rules, run in the browser adapter |
| Spam protection | Honeypot, min fill time, IP-hash & email rate limits, optional Turnstile | Honeypot, min fill time, duplicate & 3-open limits |
| Emails | Sent through Resend, logged in `email_log` | Rendered with the **same templates** as previews; not sent |
| Reference numbers | Generated in Postgres (`MC-YYYY-XXXXXX`) | Generated in the browser, same format |

**Demo admin credentials** (simulated, shown on the login page):
`hr.admin@meridian-demo.test` / `MeridianDemo!2026`

---

## Quick start (demo mode — no accounts needed)

```bash
npm install
npm run dev          # http://localhost:5173  (uses .env.demo via --mode demo if you prefer: npx vite --mode demo)
```

Build a static demo you can host anywhere (Netlify, Vercel, S3, a sub-folder of an existing site):

```bash
npm run build:demo   # → dist/
npm run preview
```

## Public demo hosting (Cloudflare)

The demo is configured for Cloudflare Workers static assets (`wrangler.jsonc`).

```bash
npx wrangler login     # once, opens the browser
npm run deploy:demo    # builds the demo and deploys it
```

## Production mode

1. Follow **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** to create the Supabase project, run the migrations, deploy the Edge Functions and set secrets.
2. Copy `.env.example` → `.env.production` and set:
   ```env
   VITE_APP_MODE=production
   VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-KEY
   ```
3. `npm run build` and deploy `dist/`.

> 🔐 The **service-role key never appears in the frontend**. It is only available inside Edge Functions, injected by Supabase.

## Embedding in an existing website

See **[docs/INTEGRATION.md](docs/INTEGRATION.md)** — sub-folder deployment, sub-domain, iframe, navigation linking and brand matching.

## Tests

```bash
npm test             # unit + database/RLS tests (Vitest + PGlite)
npm run test:e2e     # Playwright: builds the demo, runs 13 flows on desktop + mobile (uses installed Microsoft Edge)
npm run screenshots  # regenerates public/screenshots/*.jpg from the running build
npm run build:single # one self-contained HTML demo (single-dist/), used for the hosted portfolio preview
```

On CI or machines without Edge: `npx playwright install chromium` and run with `PW_CHANNEL=chromium`.

Full results and scope: **[docs/QA_REPORT.md](docs/QA_REPORT.md)**.

## Project structure

```
src/
  components/          layout (public + admin), careers (job browser), ui primitives, email preview
  pages/               careers, jobs, apply, confirmation, privacy, case study
  pages/admin/         login, overview (stats), applications, vacancies, email log
  services/            api.js (mode switch) · demoApi.js · supabaseApi.js
  lib/                 config, validation, csv, stats, hooks, utils
  data/seed.js         fictional vacancies + applicants (demo)
supabase/
  migrations/          001 schema · 002 security (RLS, storage, grants)
  functions/
    _shared/           rules.js (validation shared with the browser), emailTemplates.js, http.ts, mailer.ts
    submit-application public application endpoint
    notify-status      admin-only status email
  seed.sql             starter vacancies
  config.toml          local CLI config (sign-up disabled)
tests/unit             validation, lib, demo adapter, database RLS
tests/e2e              careers + admin flows
docs/                  deployment, integration, QA report, case study
public/screenshots     captured from the running app
```

## Security summary

- **RLS on every table.** Anonymous visitors can read *published* jobs only. Applications, email logs, drafts and audit events are admin-only.
- **No direct inserts.** Anon has no insert privilege on `applications`; submissions must pass through the Edge Function.
- **Column-level grants.** Admins can update `status` and `notes` only; a trigger also blocks changes to candidate-submitted fields.
- **Private storage.** `resumes` bucket is private, 5 MB, PDF/DOC/DOCX only; read access requires `is_admin()`; downloads use 60-second signed URLs.
- **Server-side validation** with the same rules as the browser (`_shared/rules.js`) plus magic-byte file inspection and server-assigned file paths/content types.
- **Spam & abuse controls:** honeypot, minimum fill time, salted IP-hash rate limit (5/hour), max 3 open applications per email, one application per role, optional Cloudflare Turnstile, origin allow-list, request size cap.
- **Privacy:** explicit consent stored with timestamp; raw IPs are never stored; CSV export neutralises spreadsheet formula injection; email templates HTML-escape all values.
- **Auditing:** every status change is recorded in `application_events` with the admin's user ID.

## Licence

Portfolio sample © ZC Smart Digital. Provided for demonstration; contact ZC Smart Digital for client licensing.
