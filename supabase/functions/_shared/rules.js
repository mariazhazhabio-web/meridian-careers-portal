// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for application validation.
// Imported by the React app (src/lib/validation.js) AND by the Supabase Edge
// Function (submit-application), so client and server enforce identical rules.
// Pure ES module: no Node, Deno or browser APIs.
// ─────────────────────────────────────────────────────────────────────────────

export const EXPERIENCE_LEVELS = ['Less than 1 year', '1–2 years', '3–5 years', '6–9 years', '10+ years'];

export const UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  maxLabel: '5 MB',
  extensions: ['pdf', 'doc', 'docx'],
  mimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const LIMITS = {
  fullName: { min: 2, max: 120 },
  email: { max: 254 },
  phone: { min: 7, max: 20 },
  coverLetter: { min: 50, max: 5000 },
};

// Spam protection: minimum seconds between form render and submit.
export const MIN_FILL_SECONDS = 4;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const NAME_RE = /^[\p{L}\p{M}' .-]+$/u;

export function sanitizeText(value) {
  return String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function validateApplication(input, { jobIds = null } = {}) {
  const errors = {};
  const v = {
    fullName: sanitizeText(input.fullName).replace(/\s+/g, ' '),
    email: sanitizeText(input.email).toLowerCase(),
    phone: sanitizeText(input.phone),
    jobId: sanitizeText(input.jobId),
    experience: sanitizeText(input.experience),
    coverLetter: sanitizeText(input.coverLetter),
    consent: input.consent === true || input.consent === 'true' || input.consent === 'on',
  };

  if (!v.fullName) errors.fullName = 'Please enter your full name.';
  else if (v.fullName.length < LIMITS.fullName.min || v.fullName.length > LIMITS.fullName.max)
    errors.fullName = `Name must be ${LIMITS.fullName.min}–${LIMITS.fullName.max} characters.`;
  else if (!NAME_RE.test(v.fullName))
    errors.fullName = 'Name can only contain letters, spaces, apostrophes, periods and hyphens.';

  if (!v.email) errors.email = 'Please enter your email address.';
  else if (v.email.length > LIMITS.email.max || !EMAIL_RE.test(v.email))
    errors.email = 'Please enter a valid email address (e.g. name@example.com).';

  if (!v.phone) errors.phone = 'Please enter a contact number.';
  else if (!PHONE_RE.test(v.phone) || v.phone.replace(/\D/g, '').length < 7)
    errors.phone = 'Please enter a valid phone number (digits, spaces, +, -, parentheses).';

  if (!v.jobId) errors.jobId = 'Please select the position you are applying for.';
  else if (jobIds && !jobIds.includes(v.jobId)) errors.jobId = 'This position is no longer accepting applications.';

  if (!v.experience) errors.experience = 'Please select your relevant experience.';
  else if (!EXPERIENCE_LEVELS.includes(v.experience)) errors.experience = 'Please choose an option from the list.';

  if (!v.coverLetter) errors.coverLetter = 'Please write a short cover letter.';
  else if (v.coverLetter.length < LIMITS.coverLetter.min)
    errors.coverLetter = `Cover letter must be at least ${LIMITS.coverLetter.min} characters (currently ${v.coverLetter.length}).`;
  else if (v.coverLetter.length > LIMITS.coverLetter.max)
    errors.coverLetter = `Cover letter must be under ${LIMITS.coverLetter.max} characters.`;

  if (!v.consent) errors.consent = 'You must agree to the applicant privacy notice to apply.';

  return { valid: Object.keys(errors).length === 0, errors, values: v };
}

export function fileExtension(name = '') {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

/** Validates file name / declared type / size. Content is checked by signatureMatches. */
export function validateResumeMeta({ name, type, size }) {
  if (!name) return 'Please upload your resume (PDF, DOC or DOCX).';
  const ext = fileExtension(name);
  if (!UPLOAD.extensions.includes(ext)) return 'Resume must be a PDF, DOC or DOCX file.';
  if (type && !UPLOAD.mimeTypes.includes(type)) return 'Resume must be a PDF, DOC or DOCX file.';
  if (!size) return 'The selected file is empty.';
  if (size > UPLOAD.maxBytes)
    return `Resume must be ${UPLOAD.maxLabel} or smaller (selected file is ${(size / 1048576).toFixed(1)} MB).`;
  return null;
}

/** Magic-byte check so a renamed executable cannot pass as a PDF/Word file. */
export function signatureMatches(bytes, ext) {
  const b = Array.from(bytes.slice(0, 8));
  const starts = (sig) => sig.every((x, i) => b[i] === x);
  if (ext === 'pdf') return starts([0x25, 0x50, 0x44, 0x46]); // %PDF
  if (ext === 'docx') return starts([0x50, 0x4b, 0x03, 0x04]); // PK.. (zip container)
  if (ext === 'doc') return starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // OLE2
  return false;
}

export const MIME_BY_EXT = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
