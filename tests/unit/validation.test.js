import { describe, it, expect } from 'vitest';
import { validateApplication, validateResumeFile, checkFileSignature, signatureMatches, sanitizeText, validateJob } from '../../src/lib/validation.js';

const valid = {
  fullName: 'Alex Morgan',
  email: 'Alex.Morgan@Example.com',
  phone: '+1 (555) 010-2030',
  jobId: 'job-001',
  experience: '3–5 years',
  coverLetter: 'I am excited to apply because this role matches my experience in building products.',
  consent: true,
};

describe('validateApplication', () => {
  it('accepts a complete, valid application and normalises values', () => {
    const r = validateApplication(valid, { jobIds: ['job-001'] });
    expect(r.valid).toBe(true);
    expect(r.values.email).toBe('alex.morgan@example.com');
  });

  it('reports every missing required field', () => {
    const r = validateApplication({});
    expect(r.valid).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['consent', 'coverLetter', 'email', 'experience', 'fullName', 'jobId', 'phone'].sort());
  });

  it.each([
    ['not-an-email', false],
    ['a@b', false],
    ['name@domain.co', true],
    ['first.last+tag@sub.example.org', true],
  ])('email %s → valid=%s', (email, ok) => {
    expect(!validateApplication({ ...valid, email }).errors.email).toBe(ok);
  });

  it.each([
    ['12345', false],
    ['abc-def-ghij', false],
    ['+63 917 123 4567', true],
    ['(555) 010-2030', true],
  ])('phone %s → valid=%s', (phone, ok) => {
    expect(!validateApplication({ ...valid, phone }).errors.phone).toBe(ok);
  });

  it('rejects names with digits or symbols but allows accents, apostrophes and hyphens', () => {
    expect(validateApplication({ ...valid, fullName: 'R2D2' }).errors.fullName).toBeTruthy();
    expect(validateApplication({ ...valid, fullName: '<script>' }).errors.fullName).toBeTruthy();
    expect(validateApplication({ ...valid, fullName: "Zoë O'Neill-Peña" }).errors.fullName).toBeUndefined();
  });

  it('enforces cover letter length limits', () => {
    expect(validateApplication({ ...valid, coverLetter: 'Too short' }).errors.coverLetter).toMatch(/at least 50/);
    expect(validateApplication({ ...valid, coverLetter: 'x'.repeat(5001) }).errors.coverLetter).toMatch(/under 5000/);
  });

  it('rejects a job that is not open', () => {
    expect(validateApplication(valid, { jobIds: ['job-002'] }).errors.jobId).toMatch(/no longer accepting/);
  });

  it('rejects an experience value that is not in the list', () => {
    expect(validateApplication({ ...valid, experience: '100 years' }).errors.experience).toBeTruthy();
  });

  it('requires explicit privacy consent', () => {
    expect(validateApplication({ ...valid, consent: false }).errors.consent).toBeTruthy();
    expect(validateApplication({ ...valid, consent: 'on' }).errors.consent).toBeUndefined();
  });

  it('strips control characters', () => {
    expect(sanitizeText('  hi\u0000there\u0007 ')).toBe('hithere');
  });
});

const mkFile = (bytes, name, type) => new File([new Uint8Array(bytes)], name, { type });
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];
const DOCX = [0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0];

describe('resume validation', () => {
  it('requires a file', () => expect(validateResumeFile(null)).toMatch(/upload/));
  it('accepts pdf/doc/docx', () => {
    expect(validateResumeFile(mkFile(PDF, 'cv.pdf', 'application/pdf'))).toBeNull();
    expect(validateResumeFile(mkFile(DOCX, 'cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBeNull();
  });
  it('rejects other extensions and MIME types', () => {
    expect(validateResumeFile(mkFile(PDF, 'cv.exe', 'application/octet-stream'))).toMatch(/PDF, DOC or DOCX/);
    expect(validateResumeFile(mkFile(PDF, 'cv.pdf', 'image/png'))).toMatch(/PDF, DOC or DOCX/);
  });
  it('rejects empty files', () => expect(validateResumeFile(mkFile([], 'cv.pdf', 'application/pdf'))).toMatch(/empty/));
  it('rejects files over 5 MB', () => {
    const big = { name: 'cv.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 + 1 };
    expect(validateResumeFile(big)).toMatch(/5 MB or smaller/);
  });
  it('checks magic bytes so renamed files are caught', async () => {
    expect(await checkFileSignature(mkFile(PDF, 'cv.pdf', 'application/pdf'))).toBeNull();
    expect(await checkFileSignature(mkFile([0x4d, 0x5a, 0x90, 0], 'cv.pdf', 'application/pdf'))).toMatch(/genuine/);
    expect(signatureMatches(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), 'doc')).toBe(true);
  });
});

describe('validateJob', () => {
  it('requires core fields and at least one list item', () => {
    const r = validateJob({ title: '', responsibilities: [''], qualifications: [] });
    expect(r.valid).toBe(false);
    expect(r.errors).toHaveProperty('title');
    expect(r.errors).toHaveProperty('responsibilities');
    expect(r.errors).toHaveProperty('qualifications');
  });
  it('checks salary range order', () => {
    const r = validateJob({ title: 'X role', department: 'Design', location: 'Remote', employmentType: 'Full-time', summary: 's', responsibilities: ['a'], qualifications: ['b'], salaryMin: 90000, salaryMax: 80000 });
    expect(r.errors.salaryMax).toBeTruthy();
  });
});
