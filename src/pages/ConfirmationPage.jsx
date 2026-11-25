import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Mail, CalendarClock, Users, ArrowRight, FlaskConical, Printer } from 'lucide-react';
import { api } from '../services/api.js';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { useToast } from '../components/ui/index.jsx';
import EmailPreview from '../components/ui/EmailPreview.jsx';
import { IS_DEMO } from '../lib/config.js';
import { formatDateTime } from '../lib/utils.js';

export default function ConfirmationPage() {
  useDocumentTitle('Application submitted');
  const { reference } = useParams();
  const { state } = useLocation();
  const toast = useToast();
  const result = useMemo(() => {
    if (state?.reference === reference) return state;
    try {
      const s = JSON.parse(sessionStorage.getItem('mc-last-application') || 'null');
      if (s?.reference === reference) return s;
    } catch { /* ignore */ }
    return { reference };
  }, [state, reference]);
  const { data: emails } = useAsync(() => (IS_DEMO ? api.getEmailsForReference(reference) : Promise.resolve([])), [reference]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast('Reference number copied');
    } catch {
      toast('Could not copy — please note it down', 'error');
    }
  };

  return (
    <div className="bg-mist">
      <div className="container-x max-w-4xl py-12 sm:py-16">
        <div className="card overflow-hidden text-center">
          <div className="bg-navy-900 px-6 py-10 text-white sm:py-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-navy-950 animate-fade-up">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold sm:text-4xl">Application submitted</h1>
            <p className="mx-auto mt-3 max-w-lg text-navy-200">
              Thank you{result.jobTitle ? <> for applying for <strong className="text-white">{result.jobTitle}</strong></> : null}. We've sent a confirmation to {result.email ? <strong className="text-white">{result.email}</strong> : 'your email address'}.
            </p>
          </div>
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">Your application reference</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <p className="font-display text-3xl font-extrabold tracking-wider text-navy-900 sm:text-4xl" data-testid="reference-number">{reference}</p>
              <button className="btn-outline btn-sm" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</button>
              <button className="btn-outline btn-sm print:hidden" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</button>
            </div>
            {result.createdAt && <p className="mt-2 text-sm text-navy-400">Submitted {formatDateTime(result.createdAt)}</p>}
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              {[
                [Mail, 'Check your inbox', 'A confirmation email with your reference number is on its way.'],
                [CalendarClock, 'Review within 5 days', 'A recruiter personally reviews every application.'],
                [Users, 'First conversation', 'If there is a match, we will invite you to a 30-minute call.'],
              ].map(([I, t, d]) => (
                <div key={t} className="rounded-xl bg-mist p-4">
                  <I className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <p className="mt-2 font-semibold text-navy-900">{t}</p>
                  <p className="mt-1 text-sm text-navy-500">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/jobs" className="btn-outline">Browse more roles</Link>
              <Link to="/" className="btn-primary">Back to careers <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>

        {IS_DEMO && emails?.length > 0 && (
          <section className="mt-10" aria-labelledby="email-previews">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Demo · Email automation preview</p>
                <h2 id="email-previews" className="mt-1 text-2xl font-bold text-navy-900">Emails triggered by this application</h2>
                <p className="mt-1 max-w-2xl text-sm text-navy-500">In production, the Supabase Edge Function sends these through Resend the moment the application is stored. In this demo they are rendered with the exact same templates but not delivered.</p>
              </div>
              <Link to="/admin/emails" className="btn-ghost btn-sm">Open HR outbox <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {emails.map((e) => (
                <EmailPreview key={e.id} email={e} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
