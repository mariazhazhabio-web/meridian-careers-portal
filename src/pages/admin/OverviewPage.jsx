import { Link } from 'react-router-dom';
import { Users, Briefcase, TrendingUp, TrendingDown, UserCheck, Clock, ArrowRight, Download } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { computeStats } from '../../lib/stats.js';
import { APPLICATION_STATUSES } from '../../lib/constants.js';
import { AdminPageHeader } from '../../components/layout/AdminLayout.jsx';
import { PageLoader, StatusBadge, Avatar } from '../../components/ui/index.jsx';
import { timeAgo, cx } from '../../lib/utils.js';

const BAR = { blue: 'bg-sky-500', amber: 'bg-amber-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', red: 'bg-red-400' };

function Kpi({ label, value, icon: I, sub, trend }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-navy-600"><I className="h-4 w-4" aria-hidden="true" /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-navy-900">{value}</p>
      {sub && (
        <p className={cx('mt-1 flex items-center gap-1 text-xs font-medium', trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-navy-400')}>
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
          {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
          {sub}
        </p>
      )}
    </div>
  );
}

export default function OverviewPage() {
  useDocumentTitle('HR dashboard');
  const { data, loading, error } = useAsync(async () => {
    const [apps, jobs] = await Promise.all([api.listApplications(), api.listJobs()]);
    return { apps, jobs, stats: computeStats(apps, jobs) };
  }, []);
  if (loading) return <PageLoader />;
  if (error) return <p className="text-red-600">{error.message}</p>;
  const { apps, stats } = data;
  const diff = stats.last7 - stats.prev7;
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count));
  const maxDept = Math.max(1, ...stats.byDepartment.map((d) => d[1]));

  return (
    <>
      <AdminPageHeader
        title="Recruitment overview"
        description="Live statistics across all vacancies and applicants."
        actions={<Link to="/admin/applications" className="btn-primary"><Users className="h-4 w-4" /> Review applications</Link>}
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Total applications" value={stats.total} icon={Users} sub={`${stats.last7} in the last 7 days`} trend={diff > 0 ? 'up' : diff < 0 ? 'down' : null} />
        <Kpi label="Open vacancies" value={stats.openJobs} icon={Briefcase} sub={`${stats.draftJobs} draft · ${stats.closedJobs} closed`} />
        <Kpi label="In pipeline" value={stats.inPipeline} icon={Clock} sub="New, shortlisted & interviewed" />
        <Kpi label="Hired" value={stats.byStatus.hired} icon={UserCheck} sub={`${stats.hireRate}% hire rate of decided`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="pipeline-h">
          <h2 id="pipeline-h" className="font-bold text-navy-900">Hiring pipeline</h2>
          <p className="text-sm text-navy-500">{stats.progressionRate}% of applicants progressed beyond the first review.</p>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-mist" role="img" aria-label={Object.entries(stats.byStatus).map(([k, v]) => `${APPLICATION_STATUSES[k].label}: ${v}`).join(', ')}>
            {Object.entries(stats.byStatus).map(([k, v]) => v > 0 && <div key={k} className={BAR[APPLICATION_STATUSES[k].tone]} style={{ width: `${(v / stats.total) * 100}%` }} />)}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(stats.byStatus).map(([k, v]) => (
              <Link key={k} to={`/admin/applications?status=${k}`} className="rounded-xl border border-line p-3 hover:border-navy-200 hover:bg-mist">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-navy-500"><span className={cx('h-2 w-2 rounded-full', BAR[APPLICATION_STATUSES[k].tone])} />{APPLICATION_STATUSES[k].label}</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-navy-900">{v}</dd>
              </Link>
            ))}
          </dl>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="daily-h">
          <h2 id="daily-h" className="font-bold text-navy-900">Applications — last 14 days</h2>
          <div className="mt-6 flex h-40 gap-1.5 border-b border-line" role="img" aria-label={`Daily applications, oldest to newest: ${stats.daily.map((d) => d.count).join(', ')}`}>
            {stats.daily.map((d, i) => (
              <div key={d.date} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${d.count}`}>
                <span className="mb-1 text-[10px] font-semibold text-navy-500">{d.count || ''}</span>
                <div className={cx('w-full rounded-t-md', i === 13 ? 'bg-emerald-500' : 'bg-navy-300 group-hover:bg-navy-500')} style={{ height: d.count ? `${(d.count / maxDaily) * 85}%` : '3px' }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-navy-400">
            <span>{new Date(stats.daily[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>Today</span>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 sm:p-6" aria-labelledby="dept-h">
          <h2 id="dept-h" className="font-bold text-navy-900">By department</h2>
          <ul className="mt-4 space-y-3">
            {stats.byDepartment.map(([d, n]) => (
              <li key={d}>
                <div className="flex justify-between text-sm"><span className="text-navy-700">{d}</span><span className="font-semibold text-navy-900">{n}</span></div>
                <div className="mt-1 h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-navy-700" style={{ width: `${(n / maxDept) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="top-h">
          <h2 id="top-h" className="font-bold text-navy-900">Most applied roles</h2>
          <ol className="mt-4 space-y-3">
            {stats.topJobs.map(({ job, count }, i) => (
              <li key={job.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-navy-600">{i + 1}</span>
                <Link to={`/admin/applications?job=${job.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-navy-800 hover:text-emerald-700">{job.title}</Link>
                <span className="text-sm font-semibold text-navy-900">{count}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="recent-h">
          <div className="flex items-center justify-between">
            <h2 id="recent-h" className="font-bold text-navy-900">Latest applicants</h2>
            <Link to="/admin/applications" className="text-xs font-semibold text-emerald-700 hover:underline">View all</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {[...apps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link to={`/admin/applications/${a.id}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-mist">
                  <Avatar name={a.fullName} className="h-9 w-9 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{a.fullName}</p>
                    <p className="truncate text-xs text-navy-500">{a.jobTitle} · {timeAgo(a.createdAt)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-6 flex justify-end">
        <Link to="/admin/applications" className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> Export applicants as CSV <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </>
  );
}
