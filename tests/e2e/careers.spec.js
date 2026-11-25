import { test, expect } from '@playwright/test';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
const COVER = 'I have followed Meridian & Co. for years and would love to bring my campaign experience to your marketing team.';
const isMobile = (testInfo) => testInfo.project.name === 'mobile';

async function noHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('careers landing page shows every required section', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Do the best work');
  for (const id of ['about', 'benefits', 'culture', 'positions', 'process', 'faq', 'contact']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.getByText('Portfolio demo').first()).toBeVisible();
  await expect(page.locator('#positions article')).toHaveCount(6);
  // FAQ accordion
  const q = page.getByRole('button', { name: 'Do you offer remote or hybrid work?' });
  await q.click();
  await expect(q).toHaveAttribute('aria-expanded', 'true');
  await noHorizontalScroll(page);
  if (isMobile(testInfo)) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
  }
});

test('job search and filters narrow the listings', async ({ page }) => {
  await page.goto('./#/jobs');
  await expect(page.locator('article')).toHaveCount(7);
  await page.getByLabel('Search by job title').fill('analyst');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.locator('article')).toContainText('Financial Analyst');
  await page.getByLabel('Search by job title').fill('');
  await page.getByLabel('Department').selectOption('Engineering');
  await expect(page.locator('article')).toHaveCount(2);
  await page.getByLabel('Employment type').selectOption('Internship');
  await expect(page.locator('article')).toHaveCount(1);
  await page.getByLabel('Location').selectOption('Lakeview City (HQ)');
  await expect(page.getByText('No roles match your search')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('article')).toHaveCount(7);
  await noHorizontalScroll(page);
});

test('job details show responsibilities, qualifications and Apply Now', async ({ page }) => {
  await page.goto('./#/jobs/product-designer');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Product Designer (UX/UI)');
  await expect(page.getByRole('heading', { name: "What you'll do" })).toBeVisible();
  await expect(page.getByRole('heading', { name: "What we're looking for" })).toBeVisible();
  await page.getByRole('link', { name: 'Apply now' }).first().click();
  await expect(page).toHaveURL(/#\/apply\/product-designer/);
  await expect(page.getByLabel('Position applied for')).toHaveValue('job-002');
});

test('closed and draft vacancies are not publicly reachable', async ({ page }) => {
  await page.goto('./#/jobs/it-support-specialist');
  await expect(page.getByText('This role is no longer available')).toBeVisible();
  await page.goto('./#/jobs/account-executive');
  await expect(page.getByText('This role is no longer available')).toBeVisible();
});

test('application form validates fields and files', async ({ page }) => {
  await page.goto('./#/apply/digital-marketing-specialist');
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByText('Please correct the highlighted fields')).toBeVisible();
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await expect(page.getByText('Please upload your resume')).toBeVisible();
  await expect(page.getByText('You must agree to the applicant privacy notice')).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeFocused();

  await page.getByLabel('Email address').fill('not-an-email');
  await page.getByLabel('Email address').blur();
  await expect(page.getByText('Please enter a valid email address')).toBeVisible();

  const resume = page.locator('input[type=file]');
  await resume.setInputFiles({ name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
  await expect(page.getByText('Resume must be a PDF, DOC or DOCX file.')).toBeVisible();
  await page.getByRole('button', { name: 'Remove selected resume' }).click();
  await resume.setInputFiles({ name: 'renamed.pdf', mimeType: 'application/pdf', buffer: Buffer.from('MZ-not-a-pdf') });
  await expect(page.getByText('does not look like a genuine PDF')).toBeVisible();
  await page.getByRole('button', { name: 'Remove selected resume' }).click();
  await resume.setInputFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)]) });
  await expect(page.getByText('5 MB or smaller')).toBeVisible();
});

test('candidate applies end-to-end and receives a reference number and email previews', async ({ page }) => {
  await page.goto('./#/apply/digital-marketing-specialist');
  await page.getByLabel('Full name').fill('Jamie Fictional');
  await page.getByLabel('Email address').fill('jamie.fictional@example.com');
  await page.getByLabel('Contact number').fill('+1 555 010 4477');
  await page.getByLabel('Relevant experience').selectOption('3–5 years');
  await page.locator('input[type=file]').setInputFiles({ name: 'jamie-resume.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(page.getByText('jamie-resume.pdf')).toBeVisible();
  await page.getByLabel('Cover letter').fill(COVER);
  await page.getByRole('checkbox').check();
  await page.waitForTimeout(4200); // spam protection: minimum human fill time
  await page.getByRole('button', { name: 'Submit application' }).click();

  await expect(page.getByRole('heading', { name: 'Application submitted' })).toBeVisible();
  const ref = await page.getByTestId('reference-number').textContent();
  expect(ref).toMatch(/^MC-\d{4}-[A-HJ-NP-Z2-9]{6}$/);
  await expect(page.getByText('Emails triggered by this application')).toBeVisible();
  await expect(page.getByText(`Application received — Digital Marketing Specialist (${ref})`)).toBeVisible();
  await expect(page.getByText(/New application: Jamie Fictional/)).toBeVisible();
  const frame = page.frameLocator('iframe').first();
  await expect(frame.getByText(ref, { exact: true })).toBeVisible();
  await noHorizontalScroll(page);

  // Duplicate application is blocked
  await page.goto('./#/apply/digital-marketing-specialist');
  await page.getByLabel('Full name').fill('Jamie Fictional');
  await page.getByLabel('Email address').fill('jamie.fictional@example.com');
  await page.getByLabel('Contact number').fill('+1 555 010 4477');
  await page.getByLabel('Relevant experience').selectOption('3–5 years');
  await page.locator('input[type=file]').setInputFiles({ name: 'jamie-resume.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.getByLabel('Cover letter').fill(COVER);
  await page.getByRole('checkbox').check();
  await page.waitForTimeout(4200);
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByText(`You have already applied for this role (reference ${ref})`)).toBeVisible();
});

test('spam bots that fill the hidden honeypot field are rejected', async ({ page }) => {
  await page.goto('./#/apply/hr-generalist');
  await page.getByLabel('Full name').fill('Speedy Bot');
  await page.getByLabel('Email address').fill('speedy@example.com');
  await page.getByLabel('Contact number').fill('+1 555 010 1111');
  await page.getByLabel('Relevant experience').selectOption('1–2 years');
  await page.locator('input[type=file]').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.getByLabel('Cover letter').fill(COVER);
  await page.getByRole('checkbox').check();
  await page.locator('#website').fill('http://spam.example', { force: true }); // what a bot would do
  await page.waitForTimeout(4200);
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByText('Submission rejected.')).toBeVisible();
  await expect(page).toHaveURL(/#\/apply\//);
});

test('case study page loads with working screenshots and section links', async ({ page }) => {
  await page.goto('./#/case-study');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Recruitment & Careers Portal');
  for (const h of ['What the client asked for', 'Hiring by email doesn', 'What was built', 'How HR moves a candidate', 'What the client provides to go live'])
    await expect(page.getByRole('heading', { name: new RegExp(h) })).toBeVisible();
  const imgs = page.locator('#screens ~ div img, figure img');
  await imgs.first().scrollIntoViewIfNeeded();
  const broken = await page.evaluate(async () => {
    const list = [...document.querySelectorAll('figure img')];
    await Promise.all(list.map((i) => (i.loading = 'eager', i.decode().catch(() => null))));
    return list.filter((i) => !i.naturalWidth).map((i) => i.src);
  });
  expect(broken).toEqual([]);
  expect(await page.locator('figure img').count()).toBeGreaterThanOrEqual(19);
  await noHorizontalScroll(page);
});
