# QA Report

**Build:** demo + production bundles compile with Vite 8 (no errors).
**Result:** 98 / 98 automated tests passing — 54 unit · 18 database/RLS · 26 end-to-end.
**Environment:** Windows 11, Node 26, Microsoft Edge (Chromium) via Playwright, PGlite (PostgreSQL compiled to WASM).

## 1. Unit tests — Vitest (`npm test`)

| Suite | Tests | Covers |
|---|---|---|
| `validation.test.js` | 24 | Required fields, email/phone/name formats, cover-letter limits, closed-job rejection, consent, control-character stripping, resume type/size/empty checks, magic-byte detection of renamed files, vacancy form rules |
| `lib.test.js` | 17 | CSV quoting + formula-injection neutralisation, reference-number format (500 samples), slugify, salary formatting, job search & combined filters, recruitment statistics, email template escaping and content |
| `demoApi.test.js` | 13 | Full submission pipeline, honeypot, minimum fill time, field errors, renamed-file rejection, draft/closed job rejection, duplicate prevention, 3-open-applications limit, admin auth required, wrong password, status update + status email, vacancy create/publish/close, resume download is a real PDF |
| `database.rls.test.js` | 18 | See §2 |

## 2. Database security — real PostgreSQL (`tests/unit/database.rls.test.js`)

The **actual migration files** are executed on PGlite with minimal stubs for Supabase's `auth.uid()` and `storage` schema, then queried as each role.

| Role | Verified |
|---|---|
| Schema | Private 5 MB `resumes` bucket with MIME allow-list; `MC-YYYY-XXXXXX` default reference; `posted_at` stamping; case-insensitive one-application-per-job; DB-level rejection of missing consent, short cover letters, bad emails |
| `anon` | Reads published jobs only; **permission denied** on reading or inserting applications; cannot create/modify jobs; sees no storage objects; `is_admin()` false |
| `authenticated` (non-admin) | Sees no applications, drafts, email log or resumes; updates affect 0 rows |
| admin | Reads all jobs; creates and publishes vacancies; reads applications; updates status/notes (audited with admin's user ID); **cannot** alter candidate-submitted fields; reads resume objects; stats view respects RLS |

## 3. End-to-end — Playwright (`npm run test:e2e`)

13 flows × 2 projects (desktop 1280×720, mobile Pixel 7) = 26 tests, against the production build of the demo.

1. Landing page renders all 7 sections, FAQ accordion, demo banner, 6 featured jobs, mobile menu, no horizontal scroll
2. Search + department + type + location filters, empty state and reset
3. Job detail: responsibilities, qualifications, Apply Now pre-selects role
4. Draft and closed vacancies unreachable publicly
5. Form validation: required errors, focus moves to first error, invalid email, `.exe`, renamed non-PDF, >5 MB file
6. Successful application → reference number → both email previews rendered (checked inside the sandboxed iframe) → duplicate application blocked
7. Honeypot-filled submission rejected
8. Admin routes redirect to sign-in; wrong password refused
9. Dashboard statistics and all five status categories
10. Status tab filter, search, applicant drawer, **resume download is a valid PDF**, status → Shortlisted with notes, status email in log, **CSV export** contents and row count
11. Create vacancy (validation first), publish, visible + searchable on public site, close, disappears
12. Sign-out ends the session
13. Case study page: all sections and 19 screenshots load

## 4. Manual review

- Visual review of 23 captured screenshots across desktop (1440), tablet (820) and mobile (390 @2x)
- Bug found & fixed during QA: the 14-day bar chart rendered with zero-height bars (percentage height inside an auto-height flex child) — fixed and re-verified.

## 5. Accessibility checklist

- Semantic landmarks, skip link, one `h1` per page, labelled form controls (`aria-invalid`, `aria-describedby`, `role="alert"` errors)
- Focus moves to the first invalid field on submit; modals trap Escape and restore focus
- All interactive elements keyboard-reachable; visible focus ring (emerald, 3 px)
- Colour contrast: navy-on-white and white-on-navy text exceed WCAG AA
- `prefers-reduced-motion` disables animations and smooth scrolling
- Charts expose text alternatives via `role="img"` + `aria-label`

## 6. Not covered by automation (requires the client's live Supabase project)

| Item | How to verify at go-live |
|---|---|
| Edge Function execution on Supabase's Deno runtime | `curl` check in DEPLOYMENT.md §5, then a real submission |
| Real email delivery via Resend | Acceptance checklist DEPLOYMENT.md §8 |
| Supabase Storage enforcing bucket limits / signed URLs | Upload + direct-URL check in the checklist |
| Cloudflare Turnstile | Enable keys, submit with and without the widget |

The Edge Function code shares its validation module (`_shared/rules.js`) and email templates with the browser — both are covered by the unit tests above.
