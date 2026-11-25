// Browser-side validation helpers. Core rules are shared with the Edge Function
// (supabase/functions/_shared/rules.js) so client and server can never drift.
import { fileExtension, signatureMatches, validateResumeMeta, sanitizeText } from '../../supabase/functions/_shared/rules.js';

export {
  validateApplication,
  sanitizeText,
  fileExtension,
  signatureMatches,
  LIMITS,
  UPLOAD,
  MIN_FILL_SECONDS,
  EXPERIENCE_LEVELS,
} from '../../supabase/functions/_shared/rules.js';

export function validateResumeFile(file) {
  if (!file) return 'Please upload your resume (PDF, DOC or DOCX).';
  return validateResumeMeta({ name: file.name, type: file.type, size: file.size });
}

function readHead(file) {
  const blob = file.slice(0, 8);
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsArrayBuffer(blob);
  });
}

export async function checkFileSignature(file) {
  const buf = new Uint8Array(await readHead(file));
  return signatureMatches(buf, fileExtension(file.name))
    ? null
    : 'This file does not look like a genuine PDF or Word document.';
}

export function validateJob(input) {
  const errors = {};
  for (const k of ['title', 'department', 'location', 'employmentType', 'summary'])
    if (!sanitizeText(input[k])) errors[k] = 'This field is required.';
  if (sanitizeText(input.title).length > 120) errors.title = 'Title must be under 120 characters.';
  if (!input.responsibilities?.filter((x) => sanitizeText(x)).length) errors.responsibilities = 'Add at least one responsibility.';
  if (!input.qualifications?.filter((x) => sanitizeText(x)).length) errors.qualifications = 'Add at least one qualification.';
  if (input.salaryMin && input.salaryMax && Number(input.salaryMax) < Number(input.salaryMin))
    errors.salaryMax = 'Maximum must be greater than minimum.';
  return { valid: Object.keys(errors).length === 0, errors };
}
