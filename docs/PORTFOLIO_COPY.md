# Portfolio copy — Meridian & Co. Careers Portal

Live demo: https://meridian-careers-demo.netlify.app
Case study: https://meridian-careers-demo.netlify.app/#/case-study
HR dashboard: https://meridian-careers-demo.netlify.app/#/admin/login
Demo HR login (fictional): hr.admin@meridian-demo.test / MeridianDemo!2026

---

## 1. One-liner (portfolio card / thumbnail caption)

A careers and recruitment portal for a corporate website: job listings, secure online applications with CV upload, and an HR dashboard to manage every candidate.

---

## 2. Short description (portfolio grid, Upwork / OnlineJobs profile, ~70 words)

**Meridian & Co. Careers Portal** is a complete hiring section designed to plug into an existing company website. Candidates browse open roles, read full job descriptions and apply online with their CV, receiving an instant reference number. HR staff sign in to a private dashboard to review applicants, update their status, download CVs and export reports. Fully responsive, privacy-focused and covered by 98 automated tests.

*Portfolio demo for a fictional company.*

---

## 3. Full project page

### Meridian & Co. — Careers & Recruitment Portal

**Type:** Portfolio project (fictional client)
**Brief:** Employee hiring page for an existing company website · Budget band US$500–1,000 · 2–4 week timeline
**Built with:** React, Vite, Tailwind CSS · Supabase (database, file storage, secure login) · Resend (email) · Netlify hosting

#### The problem
The company received job applications as email attachments in a shared inbox. Candidates heard nothing back, CVs were forwarded around with no access control, and hiring status lived in a spreadsheet.

#### What I delivered
- **Careers page** with company introduction, benefits, culture, a 5-step hiring process and FAQ
- **Job listings** with search and filters by department, job type and location
- **Job detail pages** with responsibilities, qualifications and an Apply Now button
- **Online application form** with clear, accessible error messages
- **Secure CV upload** — PDF/Word only, 5 MB limit, and a content check that catches renamed files (e.g. a program disguised as a PDF)
- **Confirmation page** with a unique reference number (e.g. MC-2026-XXXXXX)
- **Email notifications** to HR and an acknowledgement to the applicant
- **HR dashboard** — recruitment statistics, applicant search, status workflow (shortlisted / interviewed / hired / rejected), private notes, CV download and CSV export
- **Vacancy management** — HR can create, publish and close job ads without a developer
- **Responsive design** for desktop, tablet and mobile

#### Security & applicant privacy
- Every rule is checked twice: in the browser for instant feedback, and again on the server, which can't be bypassed
- CVs stored in a private file store with short-lived download links
- Database permissions tested so the public can never read applications
- Privacy consent required before applying; spam protection on the form

#### Quality
- **98 automated tests:** 54 unit, 18 database-security and 26 end-to-end browser tests on desktop and mobile — all passing, including against the live site
- Accessibility: keyboard navigation, labelled form fields, visible focus, colour contrast checked

#### Fits any existing website
The portal is platform-independent: it can sit in a `/careers` folder, on a sub-domain such as `careers.company.com`, or be embedded in an existing page — whether the main site runs on WordPress, a website builder or custom code.

#### Try it
- **Live demo:** https://meridian-careers-demo.netlify.app
- **Case study:** https://meridian-careers-demo.netlify.app/#/case-study
- **HR dashboard:** sign in with `hr.admin@meridian-demo.test` / `MeridianDemo!2026`

> In this public demo, data stays in your own browser and emails are shown as previews rather than sent. The production version connects to a real database and email service.

---

## 4. LinkedIn / social post

New portfolio project: a careers & recruitment portal for a corporate website. 🚀

Candidates can browse jobs, read full descriptions and apply online with their CV. HR gets a private dashboard to review applicants, update their status and export reports.

What I focused on:
✅ Responsive on desktop, tablet and mobile
✅ Applicant privacy — secure CV handling, consent, protected data
✅ Quality — 98 automated tests, all passing on the live site

Try the live demo (including the HR dashboard) 👇
https://meridian-careers-demo.netlify.app

#WebDevelopment #React #Portfolio #Recruitment
