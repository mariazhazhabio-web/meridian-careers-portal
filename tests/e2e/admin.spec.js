import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const EMAIL = 'hr.admin@meridian-demo.test';
const PASSWORD = 'MeridianDemo!2026';
const isMobile = (ti) => ti.project.name === 'mobile';

async function login(page) {
  await page.goto('./#/admin/login');
  await page.getByLabel('Work email').fill(EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Recruitment overview' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('admin routes require authentication', async ({ page }) => {
  for (const path of ['admin', 'admin/applications', 'admin/jobs', 'admin/emails']) {
    await page.goto(`./#/${path}`);
    await expect(page.getByRole('heading', { name: 'HR administrator sign in' })).toBeVisible();
  }
  await page.getByLabel('Work email').fill(EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('dashboard shows recruitment statistics', async ({ page }) => {
  await login(page);
  await expect(page.getByText('Total applications')).toBeVisible();
  await expect(page.getByText('Open vacancies')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hiring pipeline' })).toBeVisible();
  for (const s of ['New', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected']) await expect(page.locator('dl').getByText(s, { exact: true }).first()).toBeVisible();
});

test('search, filter, update status, download resume and export CSV', async ({ page }, ti) => {
  await login(page);
  await page.goto('./#/admin/applications');
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();

  await page.getByRole('tab', { name: /^Hired/ }).click();
  const list = isMobile(ti) ? page.locator('ul.space-y-3 > li') : page.locator('tbody tr');
  await expect(list).toHaveCount(2);
  await page.getByRole('tab', { name: /^All/ }).click();
  await page.getByPlaceholder('Search name, email, phone or reference…').fill('priya');
  await expect(list).toHaveCount(1);
  await list.first().getByText('Priya Natarajan').click();

  const drawer = page.getByRole('dialog');
  await expect(drawer.getByRole('heading', { name: 'Priya Natarajan' })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), drawer.getByRole('button', { name: 'Download' }).click()]);
  expect(download.suggestedFilename()).toBe('priya-natarajan-resume.pdf');
  expect(readFileSync(await download.path()).subarray(0, 5).toString()).toBe('%PDF-');

  await drawer.getByRole('radio', { name: 'Shortlisted' }).click();
  await drawer.getByLabel('Internal HR notes').fill('Excellent system design answers.');
  await drawer.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Priya Natarajan updated to “Shortlisted” · candidate emailed/)).toBeVisible();
  await drawer.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByPlaceholder('Search name, email, phone or reference…').fill('');
  await page.getByRole('tab', { name: /^Shortlisted/ }).click();
  await expect(page.getByText('Priya Natarajan').filter({ visible: true }).first()).toBeVisible();

  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export CSV/ }).click()]);
  const text = readFileSync(await csv.path(), 'utf8');
  expect(text).toContain('Reference,Submitted (UTC),Full name,Email,Phone,Position');
  expect(text).toContain('Priya Natarajan');
  expect(text.trim().split('\r\n')).toHaveLength(1 + 4); // header + 4 shortlisted

  await page.goto('./#/admin/emails');
  await expect(page.getByText(/You have been shortlisted — Senior Full-Stack Engineer/).first()).toBeVisible();
});

test('create, publish and close a vacancy; changes appear on the public site', async ({ page }) => {
  await login(page);
  await page.goto('./#/admin/jobs');
  await page.getByRole('button', { name: 'New vacancy' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('button', { name: 'Publish vacancy' }).click();
  await expect(dlg.getByText('This field is required.').first()).toBeVisible();
  await dlg.getByLabel('Job title').fill('Quality Assurance Engineer');
  await dlg.getByLabel('Department').selectOption('Engineering');
  await dlg.getByLabel('Location').selectOption('Remote');
  await dlg.getByLabel('Employment type').selectOption('Contract');
  await dlg.getByLabel('Salary min (USD / yr)').fill('70000');
  await dlg.getByLabel('Salary max (USD / yr)').fill('85000');
  await dlg.getByLabel('Summary').fill('Own automated and exploratory testing for our client platforms.');
  await dlg.getByLabel('Responsibilities 1', { exact: true }).fill('Build Playwright end-to-end suites');
  await dlg.getByLabel('Qualifications 1', { exact: true }).fill('3+ years in software QA');
  await dlg.getByRole('button', { name: 'Publish vacancy' }).click();
  await expect(page.getByText('Vacancy published to the careers site')).toBeVisible();

  await page.goto('./#/jobs');
  await page.getByLabel('Search by job title').fill('quality');
  await expect(page.locator('article')).toHaveCount(1);
  await page.getByRole('link', { name: 'Quality Assurance Engineer' }).click();
  await expect(page.getByText('Build Playwright end-to-end suites')).toBeVisible();

  await page.goto('./#/admin/jobs');
  const card = page.locator('article', { hasText: 'Quality Assurance Engineer' });
  await card.getByRole('button', { name: 'Close' }).click();
  await expect(card.getByText('Closed')).toBeVisible();
  await page.goto('./#/jobs');
  await page.getByLabel('Search by job title').fill('quality');
  await expect(page.getByText('No roles match your search')).toBeVisible();
});

test('sign out ends the session', async ({ page }, ti) => {
  await login(page);
  await page.getByRole('button', { name: 'Sign out' }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'HR administrator sign in' })).toBeVisible();
  await page.goto('./#/admin');
  await expect(page.getByRole('heading', { name: 'HR administrator sign in' })).toBeVisible();
  void ti;
});
