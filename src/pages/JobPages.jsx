import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Wallet, Building2, CalendarDays, Send, CheckCircle2, Share2, FileQuestion } from 'lucide-react';
import JobBrowser from '../components/careers/JobBrowser.jsx';
import { PageLoader, EmptyState, Badge, useToast } from '../components/ui/index.jsx';
import { api } from '../services/api.js';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { formatDate, formatSalary } from '../lib/utils.js';

export function JobsPage() {
  useDocumentTitle('Open roles');
  const { data: jobs, loading, error } = useAsync(() => api.listPublishedJobs(), []);
  return (
    <>
      <section className="hero-grid bg-navy-900 text-white">
        <div className="container-x py-14 sm:py-16">
          <p className="eyebrow text-emerald-400">Open positions</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">Open roles at Meridian &amp; Co.</h1>
          <p className="mt-4 max-w-2xl text-navy-200">Every listing includes a salary range, the team you'll join and exactly what we're looking for.</p>
        </div>
      </section>
      <section className="container-x -mt-6 pb-20">
        {loading ? <PageLoader /> : error ? <p className="text-red-600">{error.message}</p> : <JobBrowser jobs={jobs} />}
      </section>
    </>
  );
}

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-navy-900">{title}</h2>
      <ul className="prose-job">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

export function JobDetailPage() {
  const { slug } = useParams();
  const toast = useToast();
  const { data: job, loading } = useAsync(() => api.getJobBySlug(slug), [slug]);
  useDocumentTitle(job?.title || 'Role');
  if (loading) return <PageLoader />;
  if (!job)
    return (
      <div className="container-x py-20">
        <EmptyState icon={FileQuestion} title="This role is no longer available" action={<Link to="/jobs" className="btn-primary">See open roles</Link>}>
          The position may have been filled or closed. Browse our current openings instead.
        </EmptyState>
      </div>
    );
  const salary = formatSalary(job);
  const facts = [
    [Building2, 'Department', job.department],
    [MapPin, 'Location', job.location],
    [Clock, 'Employment type', job.employmentType],
    salary && [Wallet, 'Salary range', `${salary} / year`],
    job.closesAt && [CalendarDays, 'Apply by', formatDate(job.closesAt)],
  ].filter(Boolean);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: job.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        toast('Link copied to clipboard');
      }
    } catch { /* cancelled */ }
  };

  return (
    <>
      <section className="hero-grid bg-navy-900 text-white">
        <div className="container-x py-12 sm:py-16">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-200 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All open roles
          </Link>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="emerald">{job.department}</Badge>
            <Badge className="bg-white/10 text-white ring-white/20">{job.employmentType}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{job.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-navy-200">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location}</span>
            {salary && <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4" /> {salary}</span>}
            {job.postedAt && <span>Posted {formatDate(job.postedAt)}</span>}
          </p>
        </div>
      </section>

      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_340px] lg:py-16">
        <article className="min-w-0">
          <section>
            <h2 className="text-xl font-bold text-navy-900">About the role</h2>
            <p className="mt-3 text-lg leading-relaxed text-navy-600">{job.summary}</p>
          </section>
          <List title="What you'll do" items={job.responsibilities} />
          <List title="What we're looking for" items={job.qualifications} />
          <List title="Nice to have" items={job.niceToHave} />
          <section className="mt-10 rounded-2xl bg-mist p-6">
            <h2 className="font-bold text-navy-900">Our commitment</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              Meridian &amp; Co. is an equal opportunity employer. We welcome applicants of every background and will make reasonable adjustments at any stage of the process. If you meet most — not all — of the requirements, we'd still love to hear from you.
            </p>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <dl className="space-y-4">
              {facts.map(([I, l, v]) => (
                <div key={l} className="flex gap-3">
                  <I className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-navy-400">{l}</dt>
                    <dd className="font-semibold text-navy-900">{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <Link to={`/apply/${job.slug}`} className="btn-primary mt-6 w-full py-3 text-base">
              <Send className="h-4 w-4" /> Apply now
            </Link>
            <button onClick={share} className="btn-outline mt-2 w-full">
              <Share2 className="h-4 w-4" /> Share this role
            </button>
            <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-navy-500">
              {['Takes about 10 minutes', 'Instant reference number', 'Reply within 5 business days'].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
        <Link to={`/apply/${job.slug}`} className="btn-primary w-full py-3 text-base"><Send className="h-4 w-4" /> Apply now</Link>
      </div>
    </>
  );
}
