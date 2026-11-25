// Captures the case-study screenshots from the real, running demo build.
// Usage: npm run build:demo && npm run screenshots
// Output: public/screenshots/*.jpg (served by the case-study page)
import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';

const OUT = 'public/screenshots';
mkdirSync(OUT, { recursive: true });

const server = await preview({ preview: { port: 4174, strictPort: true }, logLevel: 'silent' });
const BASE = 'http://localhost:4174/';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' });
const PDF = Buffer.from('%PDF-1.4\n%%EOF');

async function shot(page, name, { full = false, clip } = {}) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82, fullPage: full, clip });
  console.log('✓', name);
}

async function apply(page) {
  await page.goto(`${BASE}#/apply/digital-marketing-specialist`);
  await page.getByLabel('Full name').fill('Jamie Fictional');
  await page.getByLabel('Email address').fill('jamie.fictional@example.com');
  await page.getByLabel('Contact number').fill('+1 555 010 4477');
  await page.getByLabel('Relevant experience').selectOption('3–5 years');
  await page.locator('input[type=file]').setInputFiles({ name: 'jamie-resume.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.getByLabel('Cover letter').fill('I have followed Meridian & Co. for years and would love to bring my B2B campaign experience to your marketing team.');
  await page.getByRole('checkbox').check();
}

async function login(page) {
  await page.goto(`${BASE}#/admin/login`);
  await page.getByRole('button', { name: 'Fill demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Recruitment overview' }).waitFor();
}

try {
  // ── Desktop ──
  const d = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await d.goto(BASE);
  await d.evaluate(() => localStorage.clear());
  await d.reload();
  await shot(d, 'desktop-home-hero');
  await d.locator('#benefits').scrollIntoViewIfNeeded();
  await shot(d, 'desktop-benefits', { clip: { x: 0, y: (await d.locator('#benefits').boundingBox()).y, width: 1440, height: 900 } });
  await d.goto(`${BASE}#/jobs`);
  await shot(d, 'desktop-jobs');
  await d.getByLabel('Department').selectOption('Engineering');
  await shot(d, 'desktop-jobs-filtered');
  await d.goto(`${BASE}#/jobs/senior-full-stack-engineer`);
  await shot(d, 'desktop-job-detail');
  await d.goto(`${BASE}#/apply/digital-marketing-specialist`);
  await d.getByRole('button', { name: 'Submit application' }).click();
  await shot(d, 'desktop-apply-validation');
  await apply(d);
  await shot(d, 'desktop-apply-filled');
  await d.waitForTimeout(4200);
  await d.getByRole('button', { name: 'Submit application' }).click();
  await d.getByRole('heading', { name: 'Application submitted' }).waitFor();
  await shot(d, 'desktop-confirmation');
  await d.waitForTimeout(400);
  await d.locator('section[aria-labelledby="email-previews"]').screenshot({ path: `${OUT}/desktop-email-previews.jpg`, type: 'jpeg', quality: 82 });
  console.log('✓ desktop-email-previews');
  await d.goto(`${BASE}#/admin/login`);
  await shot(d, 'desktop-admin-login');
  await login(d);
  await shot(d, 'desktop-admin-overview');
  await d.goto(`${BASE}#/admin/applications`);
  await shot(d, 'desktop-admin-applications');
  await d.getByText('Avery Thompson').first().click();
  await d.getByRole('dialog').waitFor();
  await shot(d, 'desktop-admin-applicant');
  await d.keyboard.press('Escape');
  await d.goto(`${BASE}#/admin/jobs`);
  await shot(d, 'desktop-admin-vacancies');
  await d.getByRole('button', { name: 'New vacancy' }).click();
  await shot(d, 'desktop-admin-new-vacancy');
  await d.goto(`${BASE}#/admin/emails`);
  await shot(d, 'desktop-admin-emails');

  // ── Tablet ──
  const t = await browser.newPage({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await t.goto(`${BASE}#/jobs`);
  await shot(t, 'tablet-jobs');

  // ── Mobile ──
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await m.goto(BASE);
  await shot(m, 'mobile-home');
  await m.getByRole('button', { name: 'Open menu' }).click();
  await shot(m, 'mobile-menu');
  await m.goto(`${BASE}#/jobs/product-designer`);
  await shot(m, 'mobile-job-detail');
  await apply(m);
  await m.getByLabel('Cover letter').scrollIntoViewIfNeeded();
  await shot(m, 'mobile-apply');
  await login(m);
  await shot(m, 'mobile-admin-overview');
  await m.goto(`${BASE}#/admin/applications`);
  await shot(m, 'mobile-admin-applications');
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
