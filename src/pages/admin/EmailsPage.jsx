import { useState } from 'react';
import { Inbox, Mail, FlaskConical } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { AdminPageHeader } from '../../components/layout/AdminLayout.jsx';
import { PageLoader, EmptyState, Badge } from '../../components/ui/index.jsx';
import EmailPreview from '../../components/ui/EmailPreview.jsx';
import { cx, timeAgo } from '../../lib/utils.js';
import { IS_DEMO } from '../../lib/config.js';

const KIND = { applicant_acknowledgement: ['Acknowledgement', 'emerald'], hr_notification: ['HR alert', 'navy'] };

export default function EmailsPage() {
  useDocumentTitle('Email log');
  const { data: emails, loading, error } = useAsync(() => api.listEmails(), []);
  const [sel, setSel] = useState(0);
  if (loading) return <PageLoader />;
  if (error) return <p className="text-red-600">{error.message}</p>;
  const current = emails[sel] || emails[0];
  return (
    <>
      <AdminPageHeader
        title="Email log"
        description={IS_DEMO ? 'Every automated email the system would send. In demo mode they are rendered but not delivered.' : 'Automated emails sent via Resend from Supabase Edge Functions.'}
      />
      {IS_DEMO && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" /> Submit an application on the careers site or change an applicant's status to see new emails appear here.
        </p>
      )}
      {!emails.length ? (
        <EmptyState icon={Inbox} title="No emails yet">Applicant acknowledgements, HR alerts and status updates will appear here.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <ul className="card max-h-[640px] divide-y divide-line overflow-y-auto" aria-label="Emails">
            {emails.map((e, i) => {
              const [label, tone] = KIND[e.kind] || ['Status update', 'violet'];
              return (
                <li key={e.id}>
                  <button onClick={() => setSel(i)} aria-current={current?.id === e.id} className={cx('flex w-full gap-3 p-4 text-left transition', current?.id === e.id ? 'bg-emerald-50/70' : 'hover:bg-mist/60')}>
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><Badge tone={tone}>{label}</Badge><span className="text-xs text-navy-400">{timeAgo(e.sentAt)}</span></div>
                      <p className="mt-1.5 truncate text-sm font-semibold text-navy-900">{e.subject}</p>
                      <p className="truncate text-xs text-navy-500">To: {e.to}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {current && <EmailPreview email={current} />}
        </div>
      )}
    </>
  );
}
