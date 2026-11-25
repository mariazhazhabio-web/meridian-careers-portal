# Integration Guide — adding the careers portal to an existing company website

The portal is a self-contained static build (`dist/`), so it can be added to almost any existing site — WordPress, Webflow, a custom CMS or a hand-coded site — without touching that site's codebase.

## Option A — Sub-folder (recommended)

`https://www.your-company.com/careers/`

1. `npm run build` (the Vite `base` is `./`, so assets resolve relative to wherever the files live).
2. Upload the contents of `dist/` to `/careers/` on the web server or CDN.
3. Keep `VITE_ROUTER=hash` (default). URLs look like `/careers/#/jobs/product-designer` and need **no server configuration**.
4. Want clean URLs (`/careers/jobs/product-designer`)? Set `VITE_ROUTER=browser`, set Vite `base: '/careers/'`, pass `basename="/careers"` to `BrowserRouter` in `src/App.jsx`, and add a rewrite of `/careers/*` → `/careers/index.html`:
   - **Apache**: `.htaccess` → `FallbackResource /careers/index.html`
   - **Nginx**: `location /careers/ { try_files $uri /careers/index.html; }`
   - **Netlify**: `/careers/* /careers/index.html 200`
   - **Vercel**: `{ "rewrites": [{ "source": "/careers/(.*)", "destination": "/careers/index.html" }] }`

**WordPress:** upload `dist/` to `wp-content/uploads/careers-app/` (or the web root's `/careers/`) and link it from the menu. Avoid embedding the JS inside a WP page — the standalone route is faster and isolated from theme CSS.

## Option B — Sub-domain

`https://careers.your-company.com` — point a CNAME at Vercel/Netlify, deploy `dist/`. Add the sub-domain to `ALLOWED_ORIGINS` and Supabase *Auth → URL configuration*.

## Option C — iframe inside an existing page

```html
<iframe src="https://www.your-company.com/careers/" title="Careers at Your Company"
        style="width:100%;min-height:1600px;border:0" loading="lazy"></iframe>
```
Use only when the CMS cannot host files. Set `frame-ancestors` in the portal's CSP to the parent domain.

## Linking from the main website

- Add **Careers** to the main navigation → `/careers/`
- Deep-link to a role: `/careers/#/jobs/<slug>` · straight to its form: `/careers/#/apply/<slug>`
- HR dashboard: `/careers/#/admin` (consider *not* linking it publicly; the header "HR login" link can be removed in `src/components/layout/PublicLayout.jsx`)

## Matching the parent site's brand

| What | Where |
|---|---|
| Colours | `@theme` tokens in `src/styles/index.css` (`--color-navy-*`, `--color-emerald-*`, `--color-mist`) |
| Fonts | `@fontsource` imports + `--font-sans` / `--font-display` in the same file |
| Logo | `Logo` component in `src/components/layout/PublicLayout.jsx` and `public/favicon.svg` |
| Company name, phone, address | `COMPANY` in `src/lib/config.js`; HR email via `VITE_HR_EMAIL` |
| Page copy (benefits, culture, FAQ) | `src/pages/CareersPage.jsx` |
| Departments, locations, employment types | `src/lib/constants.js` (also update the `employment_type` check in the migration) |
| Email wording | `supabase/functions/_shared/emailTemplates.js` |
| Remove the demo banner / ZC credit | Shown only when `VITE_APP_MODE=demo`; footer credit in `PublicLayout.jsx` |

To reuse the parent site's header/footer instead, replace `SiteHeader`/`SiteFooter` in `PublicLayout.jsx` with your markup (or render nothing and rely on the iframe/sub-folder host's chrome).

## Analytics & tracking

Add your analytics snippet to `index.html`. Suggested events: `view_job` (job detail), `start_application` (form focus), `submit_application` (confirmation page). Do **not** send applicant names or emails to analytics tools.

## Connecting to an existing HR system

Applications are rows in Postgres, so downstream systems can integrate via:
- **CSV export** from the dashboard (built in)
- **Supabase Database Webhooks** on `applications` insert → POST to an HRIS / Slack / Zapier
- **Supabase REST API** with a server-side service key (never in a browser)
