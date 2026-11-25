import { useState } from 'react';
import { Mail, FlaskConical } from 'lucide-react';
import { cx, formatDateTime } from '../../lib/utils.js';

/** Renders an email in a sandboxed iframe (no scripts, no same-origin access). */
export default function EmailPreview({ email, compact = false }) {
  const [view, setView] = useState('html');
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line bg-mist/60 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-500">
            <Mail className="h-3.5 w-3.5" /> {email.kind === 'hr_notification' ? 'HR notification' : email.kind === 'applicant_acknowledgement' ? 'Applicant acknowledgement' : 'Status update'}
          </p>
          <div className="flex items-center gap-2">
            {email.delivery === 'simulated' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                <FlaskConical className="h-3 w-3" /> Simulated — not sent
              </span>
            )}
            <div className="flex rounded-lg bg-white p-0.5 text-xs ring-1 ring-line" role="group" aria-label="Email format">
              {['html', 'text'].map((v) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={cx('rounded-md px-2 py-1 font-medium', view === v ? 'bg-navy-900 text-white' : 'text-navy-500')}>
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <dl className="mt-2 grid gap-0.5 text-sm">
          <div className="flex gap-2"><dt className="w-14 shrink-0 text-navy-400">To</dt><dd className="truncate font-medium text-navy-800">{email.to}</dd></div>
          <div className="flex gap-2"><dt className="w-14 shrink-0 text-navy-400">Subject</dt><dd className="font-semibold text-navy-900">{email.subject}</dd></div>
          {email.sentAt && <div className="flex gap-2"><dt className="w-14 shrink-0 text-navy-400">Date</dt><dd className="text-navy-600">{formatDateTime(email.sentAt)}</dd></div>}
        </dl>
      </div>
      {view === 'html' ? (
        <iframe title={`Email preview: ${email.subject}`} sandbox="" srcDoc={email.html} className={cx('block w-full bg-mist', compact ? 'h-[460px]' : 'h-[560px]')} />
      ) : (
        <pre className={cx('overflow-auto whitespace-pre-wrap bg-white p-5 font-sans text-sm leading-relaxed text-navy-700', compact ? 'h-[460px]' : 'h-[560px]')}>{email.text || '(plain-text version not stored)'}</pre>
      )}
    </div>
  );
}
