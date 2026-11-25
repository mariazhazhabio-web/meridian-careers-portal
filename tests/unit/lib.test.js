import { describe, it, expect } from 'vitest';
import { toCSV, csvCell, APPLICATION_CSV_COLUMNS } from '../../src/lib/csv.js';
import { computeStats, filterApplications } from '../../src/lib/stats.js';
import { generateReference, REFERENCE_RE, slugify, formatSalary } from '../../src/lib/utils.js';
import { applicantAcknowledgementEmail, hrNotificationEmail, statusUpdateEmail, escapeHtml } from '../../supabase/functions/_shared/emailTemplates.js';
import { SEED_APPLICATIONS, SEED_JOBS } from '../../src/data/seed.js';
import { filterJobs } from '../../src/components/careers/JobBrowser.jsx';

describe('CSV export', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });
  it('neutralises spreadsheet formula injection', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1 555')).toBe("'+1 555");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });
  it('produces a header and one row per applicant with a UTF-8 BOM', () => {
    const rows = SEED_APPLICATIONS.slice(0, 3).map((a) => ({ ...a, jobTitle: 'Role', department: 'Dept' }));
    const csv = toCSV(rows, APPLICATION_CSV_COLUMNS);
    expect(csv.startsWith('﻿Reference,')).toBe(true);
    expect(csv.split('\r\n')).toHaveLength(4);
  });
});

describe('reference numbers', () => {
  it('match MC-YYYY-XXXXXX with no ambiguous characters', () => {
    for (let i = 0; i < 500; i++) expect(generateReference()).toMatch(REFERENCE_RE);
    expect(generateReference(new Date('2030-01-01'))).toMatch(/^MC-2030-/);
  });
  it('seed references are valid', () => SEED_APPLICATIONS.forEach((a) => expect(a.reference).toMatch(REFERENCE_RE)));
});

describe('utils', () => {
  it('slugifies titles', () => expect(slugify('Product Designer (UX/UI) — Café')).toBe('product-designer-ux-ui-cafe'));
  it('formats salary ranges', () => {
    expect(formatSalary({ salaryMin: 85000, salaryMax: 105000 })).toBe('$85k – $105k');
    expect(formatSalary({ salaryMin: 24000 })).toBe('From $24k');
    expect(formatSalary({})).toBeNull();
  });
});

describe('job search & filters', () => {
  const published = SEED_JOBS.filter((j) => j.status === 'published');
  it('has at least six published vacancies', () => expect(published.length).toBeGreaterThanOrEqual(6));
  it('searches by title (case-insensitive)', () => expect(filterJobs(published, { q: 'DESIGNER' }).map((j) => j.id)).toEqual(['job-002']));
  it('filters by department, type and location together', () => {
    expect(filterJobs(published, { department: 'Engineering' })).toHaveLength(2);
    expect(filterJobs(published, { department: 'Engineering', type: 'Internship' })).toHaveLength(1);
    expect(filterJobs(published, { location: 'Remote' }).every((j) => j.location === 'Remote')).toBe(true);
    expect(filterJobs(published, { q: 'zzz' })).toHaveLength(0);
  });
});

describe('recruitment statistics', () => {
  const apps = SEED_APPLICATIONS.map((a) => ({ ...a, department: SEED_JOBS.find((j) => j.id === a.jobId).department }));
  const s = computeStats(apps, SEED_JOBS);
  it('counts every status category', () => {
    expect(Object.values(s.byStatus).reduce((x, y) => x + y, 0)).toBe(apps.length);
    expect(s.byStatus.hired).toBe(2);
    expect(s.inPipeline).toBe(s.byStatus.new + s.byStatus.shortlisted + s.byStatus.interviewed);
  });
  it('counts job states', () => {
    expect(s.openJobs).toBe(7);
    expect(s.draftJobs).toBe(1);
    expect(s.closedJobs).toBe(1);
  });
  it('produces a 14-day series', () => expect(s.daily).toHaveLength(14));
  it('filters applicants by search text and status', () => {
    expect(filterApplications(apps, { q: 'avery' })).toHaveLength(1);
    expect(filterApplications(apps, { q: apps[3].reference })).toHaveLength(1);
    expect(filterApplications(apps, { status: 'rejected' })).toHaveLength(2);
    expect(filterApplications(apps, { department: 'Finance', status: 'new' })).toHaveLength(1);
  });
});

describe('email templates', () => {
  const ctx = { fullName: 'Alex <b>Morgan</b>', email: 'alex@example.com', phone: '+1 555', reference: 'MC-2026-ABCDEF', jobTitle: 'Designer', department: 'Design', experience: '3–5 years', createdAt: '2026-11-24T10:00:00Z' };
  it('escapes HTML in user-supplied values', () => {
    expect(escapeHtml('<img onerror=x>')).toBe('&lt;img onerror=x&gt;');
    const m = applicantAcknowledgementEmail(ctx);
    expect(m.html).not.toContain('<b>Morgan</b>');
    expect(m.html).toContain('MC-2026-ABCDEF');
    expect(m.to).toBe('alex@example.com');
  });
  it('builds the HR notification with a dashboard link and no attachment', () => {
    const m = hrNotificationEmail({ ...ctx, hrEmail: 'hr@example.com', dashboardUrl: 'https://x.test/#/admin' });
    expect(m.to).toBe('hr@example.com');
    expect(m.subject).toContain('MC-2026-ABCDEF');
    expect(m.html).toContain('https://x.test/#/admin');
  });
  it('only creates status emails for meaningful transitions', () => {
    expect(statusUpdateEmail({ ...ctx, status: 'new' })).toBeNull();
    expect(statusUpdateEmail({ ...ctx, status: 'shortlisted' }).subject).toMatch(/shortlisted/);
  });
});
