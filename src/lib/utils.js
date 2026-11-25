export const cx = (...c) => c.filter(Boolean).join(' ');

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** MC-YYYY-XXXXXX using an unambiguous alphabet (no 0/O/1/I). Production numbers are generated in Postgres. */
export function generateReference(date = new Date(), rand = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return `MC-${date.getFullYear()}-${s}`;
}
export const REFERENCE_RE = /^MC-\d{4}-[A-HJ-NP-Z2-9]{6}$/;

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', opts);
}
export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [[86400 * 30, 'mo'], [86400, 'd'], [3600, 'h'], [60, 'm']];
  for (const [n, u] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return 'just now';
}
export function formatBytes(b) {
  if (b == null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
export function formatSalary(job) {
  if (!job?.salaryMin) return null;
  const f = (n) => `$${Math.round(n / 1000)}k`;
  return job.salaryMax ? `${f(job.salaryMin)} – ${f(job.salaryMax)}` : `From ${f(job.salaryMin)}`;
}
/**
 * Saves a file. Inside the claude.ai artifact viewer (sandboxed iframe) normal downloads are blocked,
 * so the viewer's `downloads` capability is used there; everywhere else a regular browser download runs.
 */
export async function downloadBlob(blob, filename) {
  if (typeof window !== 'undefined' && window.claude?.use) {
    const downloads = await window.claude.use('downloads').catch(() => null);
    if (downloads) {
      try {
        await downloads.save({ filename, data: blob });
        return;
      } catch (e) {
        if (e?.code === 'declined' || e?.code === 'rate_limited') return;
        // other codes: fall through to a plain download attempt
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
