import { describe, it, expect, beforeEach } from 'vitest';
import { demoApi, DEMO_CREDENTIALS } from '../../src/services/demoApi.js';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const pdf = (name = 'cv.pdf') => new File([PDF], name, { type: 'application/pdf' });
const values = (over = {}) => ({
  fullName: 'Test Applicant',
  email: `test.${Math.random().toString(36).slice(2, 7)}@example.com`,
  phone: '+1 555 010 9999',
  jobId: 'job-003',
  experience: '1–2 years',
  coverLetter: 'This is a sufficiently long cover letter for the automated test suite to pass validation.',
  consent: true,
  ...over,
});
const longAgo = Date.now() - 60_000;

beforeEach(async () => {
  localStorage.clear();
  await demoApi.resetDemo();
});

describe('demo application pipeline', () => {
  it('stores a valid application, returns a reference and produces both emails', async () => {
    const v = values();
    const r = await demoApi.submitApplication({ values: v, file: pdf(), startedAt: longAgo });
    expect(r.reference).toMatch(/^MC-\d{4}-[A-HJ-NP-Z2-9]{6}$/);
    expect(r.emails.map((e) => e.kind).sort()).toEqual(['applicant_acknowledgement', 'hr_notification']);
    expect(r.emails.every((e) => e.delivery === 'simulated')).toBe(true);
    await demoApi.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    const apps = await demoApi.listApplications();
    expect(apps.find((a) => a.reference === r.reference)).toMatchObject({ status: 'new', email: v.email, jobTitle: 'Digital Marketing Specialist' });
  });

  it('rejects honeypot submissions (spam bots)', async () => {
    await expect(demoApi.submitApplication({ values: values(), file: pdf(), honeypot: 'http://spam', startedAt: longAgo })).rejects.toThrow(/rejected/);
  });

  it('rejects submissions completed faster than a human could', async () => {
    await expect(demoApi.submitApplication({ values: values(), file: pdf(), startedAt: Date.now() })).rejects.toMatchObject({ status: 429 });
  });

  it('returns field errors for invalid data', async () => {
    const err = await demoApi.submitApplication({ values: values({ email: 'bad' }), file: pdf(), startedAt: longAgo }).catch((e) => e);
    expect(err.fieldErrors.email).toBeTruthy();
  });

  it('rejects a renamed non-PDF file', async () => {
    const fake = new File([new Uint8Array([0x4d, 0x5a, 0, 0])], 'cv.pdf', { type: 'application/pdf' });
    const err = await demoApi.submitApplication({ values: values(), file: fake, startedAt: longAgo }).catch((e) => e);
    expect(err.fieldErrors.resume).toMatch(/genuine/);
  });

  it('rejects applications to closed or draft vacancies', async () => {
    for (const jobId of ['job-008', 'job-009']) {
      const err = await demoApi.submitApplication({ values: values({ jobId }), file: pdf(), startedAt: longAgo }).catch((e) => e);
      expect(err.fieldErrors.jobId).toMatch(/no longer accepting/);
    }
  });

  it('prevents duplicate applications for the same role', async () => {
    const v = values();
    await demoApi.submitApplication({ values: v, file: pdf(), startedAt: longAgo });
    await expect(demoApi.submitApplication({ values: v, file: pdf(), startedAt: longAgo })).rejects.toMatchObject({ status: 409 });
  });

  it('limits a candidate to three open applications', async () => {
    const email = 'busy.candidate@example.com';
    for (const jobId of ['job-001', 'job-002', 'job-003']) await demoApi.submitApplication({ values: values({ email, jobId }), file: pdf(), startedAt: longAgo });
    await expect(demoApi.submitApplication({ values: values({ email, jobId: 'job-004' }), file: pdf(), startedAt: longAgo })).rejects.toMatchObject({ status: 429 });
  });
});

describe('demo admin access', () => {
  it('blocks admin endpoints without a session', async () => {
    await demoApi.signOut();
    await expect(demoApi.listApplications()).rejects.toMatchObject({ status: 401 });
    await expect(demoApi.listJobs()).rejects.toMatchObject({ status: 401 });
  });

  it('rejects wrong credentials', async () => {
    await expect(demoApi.signIn(DEMO_CREDENTIALS.email, 'wrong')).rejects.toThrow(/Invalid/);
  });

  it('updates status, records notes and queues a status email', async () => {
    await demoApi.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    const [app] = (await demoApi.listApplications()).filter((a) => a.status === 'new');
    const updated = await demoApi.updateApplication(app.id, { status: 'shortlisted', notes: 'Great portfolio' }, { notifyCandidate: true });
    expect(updated).toMatchObject({ status: 'shortlisted', notes: 'Great portfolio' });
    const emails = await demoApi.listEmails();
    expect(emails[0]).toMatchObject({ to: app.email, kind: 'status_shortlisted' });
  });

  it('creates, publishes and closes vacancies', async () => {
    await demoApi.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    await demoApi.saveJob({ title: 'QA Engineer', department: 'Engineering', location: 'Remote', employmentType: 'Contract', summary: 'Test things.', responsibilities: ['Write tests'], qualifications: ['2+ years QA'], status: 'draft' });
    let job = (await demoApi.listJobs()).find((j) => j.title === 'QA Engineer');
    expect(job.status).toBe('draft');
    expect((await demoApi.listPublishedJobs()).some((j) => j.id === job.id)).toBe(false);
    await demoApi.setJobStatus(job.id, 'published');
    expect((await demoApi.getJobBySlug(job.slug)).title).toBe('QA Engineer');
    await demoApi.setJobStatus(job.id, 'closed');
    expect(await demoApi.getJobBySlug(job.slug)).toBeNull();
  });

  it('downloads seeded resumes as genuine PDFs', async () => {
    await demoApi.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    const [app] = await demoApi.listApplications();
    const { blob, filename } = await demoApi.downloadResume(app);
    expect(filename).toMatch(/\.pdf$/);
    const head = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(new TextDecoder().decode(r.result).slice(0, 5));
      r.readAsArrayBuffer(blob.slice(0, 5));
    });
    expect(head).toBe('%PDF-');
  });
});
