# Deployment Guide

This guide takes the portal from source code to a live production deployment backed by Supabase. Allow about 45 minutes.

## 0. Prerequisites

- Node.js 20+ and npm
- A Supabase account and the [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase` or `scoop install supabase`)
- A [Resend](https://resend.com) account with a verified sending domain (or another provider — see §7)
- Optional: a Cloudflare Turnstile site/secret key pair

## 1. Create the Supabase project

1. Create a new project in the Supabase dashboard. Note the **Project URL**, **anon public key** and **project ref**.
2. **Authentication → Providers → Email:** disable *Allow new users to sign up*. HR accounts are created by an administrator only.
3. **Authentication → URL configuration:** set *Site URL* to your careers URL, e.g. `https://www.meridian-co.example/careers/`.

## 2. Apply the database migrations

```bash
supabase login
supabase link --project-ref YOUR-REF
supabase db push            # runs supabase/migrations/*.sql in order
```

Or paste `20261124000100_init_schema.sql` and then `20261124000200_security.sql` into the SQL editor.

Optionally load the starter vacancies: run `supabase/seed.sql` in the SQL editor.

**Verify:** *Table editor* shows `jobs`, `applications`, `admin_users`, `email_log`, `application_events`, each with the RLS shield enabled. *Storage* shows a private `resumes` bucket.

## 3. Create HR administrators

1. **Authentication → Users → Add user** (email + password, *auto-confirm*).
2. Grant dashboard access:
   ```sql
   insert into public.admin_users (user_id, full_name)
   select id, 'Jane Doe (HR)' from auth.users where email = 'jane@your-company.com';
   ```
A signed-in user who is **not** in `admin_users` is refused by the app *and* by RLS.

## 4. Configure Edge Function secrets

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. Set the rest:

```bash
cp supabase/functions/.env.example supabase/functions/.env   # then edit values
supabase secrets set --env-file supabase/functions/.env
```

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Sends emails. If absent, emails are logged with status `skipped`. |
| `EMAIL_FROM` | e.g. `Meridian & Co. Careers <careers@mail.your-domain.com>` (must be a verified domain) |
| `HR_NOTIFY_EMAIL` | Inbox that receives new-application alerts |
| `ALLOWED_ORIGINS` | Comma-separated list of sites allowed to submit, e.g. `https://www.your-domain.com` |
| `SITE_URL` | Base URL of the deployed careers app (used for dashboard links in HR emails) |
| `IP_HASH_SALT` | Random string used to hash client IPs for rate limiting |
| `TURNSTILE_SECRET_KEY` | Optional. When set, every submission must pass Cloudflare Turnstile. |

## 5. Deploy the Edge Functions

```bash
supabase functions deploy submit-application --no-verify-jwt   # public endpoint (anon key)
supabase functions deploy notify-status                         # requires a signed-in admin JWT
```

**Verify** (should return HTTP 415 — proves the function is live and rejects non-multipart input):

```bash
curl -i -X POST "https://YOUR-REF.supabase.co/functions/v1/submit-application" \
  -H "apikey: YOUR-ANON-KEY" -H "Content-Type: application/json" -d "{}"
```

## 6. Build and host the frontend

```bash
cp .env.example .env.production
# set VITE_APP_MODE=production, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
#     VITE_HR_EMAIL, optional VITE_TURNSTILE_SITE_KEY, VITE_ROUTER (hash|browser)
npm ci
npm run build          # → dist/
```

Upload `dist/` to any static host. Recommended settings:

| Host | Settings |
|---|---|
| **Vercel** | Framework: Vite · Build: `npm run build` · Output: `dist` · env vars in Project Settings |
| **Netlify** | Build: `npm run build` · Publish: `dist` · with `VITE_ROUTER=browser` add `/* /index.html 200` to `public/_redirects` |
| **Existing server / cPanel** | Copy `dist/` into `/careers/` of the web root. Hash routing (default) needs no server rules. |

Security headers to add at the host (recommended):
```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://YOUR-REF.supabase.co; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' https://challenges.cloudflare.com; frame-src blob: https://challenges.cloudflare.com; frame-ancestors 'self'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
```

## 7. Using a different email provider

Replace the `fetch` call in `supabase/functions/_shared/mailer.ts` (≈20 lines) with SendGrid, Postmark, Amazon SES or SMTP. Templates in `_shared/emailTemplates.js` are provider-agnostic.

## 8. Go-live acceptance checklist

- [ ] Public careers page lists only *published* vacancies
- [ ] Submitting an application returns an `MC-YYYY-XXXXXX` reference
- [ ] Applicant receives the acknowledgement email; HR inbox receives the alert
- [ ] Row appears in `applications`; file appears in the private `resumes` bucket
- [ ] Opening the resume's public URL directly returns 400/404 (bucket is private)
- [ ] HR user signs in, changes a status, and the candidate receives the status email
- [ ] A non-admin user signing in is refused
- [ ] Six rapid submissions from one network: the sixth is rate-limited (HTTP 429)
- [ ] CSV export opens correctly in Excel / Google Sheets
- [ ] Privacy notice reviewed by legal counsel; retention job scheduled (see below)

## 9. Data retention (recommended)

Schedule deletion of unsuccessful applications after 12 months with `pg_cron`:

```sql
select cron.schedule('purge-old-applications', '0 3 * * *', $$
  delete from public.applications
  where status in ('rejected') and updated_at < now() - interval '12 months';
$$);
```
Remove matching storage objects with a small scheduled Edge Function, or via the Storage API in the same job.

## 10. Local full-stack development (optional)

```bash
supabase start                      # Docker required; applies migrations + seed.sql
supabase functions serve --env-file supabase/functions/.env
# .env.local → VITE_APP_MODE=production, VITE_SUPABASE_URL=http://127.0.0.1:54321, VITE_SUPABASE_ANON_KEY=<local anon key>
npm run dev
```
