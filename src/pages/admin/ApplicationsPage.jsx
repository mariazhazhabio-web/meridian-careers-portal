import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Download, X, FileText, Mail, Phone, Briefcase, CalendarDays, ChevronRight, Users, Save, GraduationCap, Hash } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { filterApplications } from '../../lib/stats.js';
import { toCSV, APPLICATION_CSV_COLUMNS } from '../../lib/csv.js';
import { APPLICATION_STATUSES, APPLICATION_STATUS_KEYS, DEPARTMENTS } from '../../lib/constants.js';
import { AdminPageHeader } from '../../components/layout/AdminLayout.jsx';
import { PageLoader, StatusBadge, Avatar, EmptyState, Spinner, useToast } from '../../components/ui/index.jsx';
import { cx, downloadBlob, formatBytes, formatDate, formatDateTime } from '../../lib/utils.js';
import { IS_DEMO } from '../../lib/config.js';

function ApplicationDrawer({ app, onClose, onSaved }) {
  const toast = useToast();
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.notes || '');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    setStatus(app.status);
    setNotes(app.notes || '');
  }, [app]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dirty = status !== app.status || notes !== (app.notes || '');
  const save = async () => {
    setSaving(true);
    try {
      await api.updateApplication(app.id, { status, notes }, { notifyCandidate: notify && status !== app.status && status !== 'new' });
      toast(`${app.fullName} updated to “${APPLICATION_STATUSES[status].label}”${notify && status !== app.status && status !== 'new' ? ' · candidate emailed' : ''}`);
      onSaved?.();
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };
  const download = async () => {
    setDownloading(true);
    try {
      const r = await api.downloadResume(app);
      if (r.blob) downloadBlob(r.blob, r.filename);
      else window.location.assign(r.url);
    } catch (e) {
      toast(e.message, 'error');
    }
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-lift animate-fade-up">
        <div className="flex items-start gap-4 border-b border-line p-5 sm:p-6">
          <Avatar name={app.fullName} className="h-12 w-12 text-base" />
          <div className="min-w-0 flex-1">
            <h2 id="drawer-title" className="text-xl font-bold text-navy-900">{app.fullName}</h2>
            <p className="text-sm text-navy-500">{app.jobTitle}</p>
            <div className="mt-2"><StatusBadge status={app.status} /></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-navy-400 hover:bg-mist" aria-label="Close applicant details"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              [Hash, 'Reference', app.reference],
              [CalendarDays, 'Submitted', formatDateTime(app.createdAt)],
              [Mail, 'Email', <a key="e" className="text-emerald-700 hover:underline" href={`mailto:${app.email}`}>{app.email}</a>],
              [Phone, 'Phone', <a key="p" className="hover:underline" href={`tel:${app.phone}`}>{app.phone}</a>],
              [Briefcase, 'Department', app.department],
              [GraduationCap, 'Experience', app.experience],
            ].map(([I, l, v]) => (
              <div key={l} className="flex gap-3 rounded-xl bg-mist/70 p-3">
                <I className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                <div className="min-w-0"><dt className="text-xs text-navy-400">{l}</dt><dd className="break-words text-sm font-medium text-navy-900">{v}</dd></div>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="text-sm font-bold text-navy-900">Resume</h3>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-line p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900">{app.resumeName}</p>
                <p className="text-xs text-navy-400">{formatBytes(app.resumeSize)} · {IS_DEMO ? 'stored in browser (demo)' : 'private bucket · 60-second signed link'}</p>
              </div>
              <button className="btn-outline btn-sm" onClick={download} disabled={downloading}>{downloading ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />} Download</button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-navy-900">Cover letter</h3>
            <p className="mt-2 whitespace-pre-line rounded-xl bg-mist/70 p-4 text-sm leading-relaxed text-navy-700">{app.coverLetter}</p>
          </section>

          <section className="space-y-4 rounded-2xl border border-line p-4 sm:p-5">
            <h3 className="text-sm font-bold text-navy-900">Update status</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Application status">
              {APPLICATION_STATUS_KEYS.map((k) => (
                <button
                  key={k}
                  role="radio"
                  aria-checked={status === k}
                  onClick={() => setStatus(k)}
                  className={cx('rounded-xl border px-3 py-2 text-sm font-semibold transition', status === k ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-line text-navy-600 hover:bg-mist')}
                >
                  {APPLICATION_STATUSES[k].label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="label">Internal HR notes</span>
              <textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visible to HR administrators only" maxLength={2000} />
            </label>
            {status !== app.status && status !== 'new' && (
              <label className="flex items-start gap-2.5 text-sm text-navy-600">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
                Email the candidate about this status change {IS_DEMO && <span className="text-navy-400">(preview stored in Email log)</span>}
              </label>
            )}
          </section>
        </div>
        <div className="flex justify-end gap-2 border-t border-line p-4">
          <button className="btn-outline" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={save} disabled={!dirty || saving}>{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  useDocumentTitle('Applications');
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useAsync(async () => {
    const [apps, jobs] = await Promise.all([api.listApplications(), api.listJobs()]);
    return { apps, jobs };
  }, []);
  const filters = { q: params.get('q') || '', status: params.get('status') || '', jobId: params.get('job') || '', department: params.get('dept') || '' };
  const setFilter = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };
  const [sort, setSort] = useState('newest');

  const rows = useMemo(() => {
    if (!data) return [];
    const r = filterApplications(data.apps, filters);
    return r.sort((a, b) => (sort === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : a.fullName.localeCompare(b.fullName)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, params, sort]);

  if (loading) return <PageLoader />;
  if (error) return <p className="text-red-600">{error.message}</p>;
  const counts = Object.fromEntries(APPLICATION_STATUS_KEYS.map((k) => [k, data.apps.filter((a) => a.status === k).length]));
  const selected = id ? data.apps.find((a) => a.id === id) : null;
  const active = Object.values(filters).some(Boolean);
  const exportCsv = () => {
    const csv = toCSV(rows, APPLICATION_CSV_COLUMNS);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `meridian-applicants-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <>
      <AdminPageHeader
        title="Applications"
        description={`${data.apps.length} applicants across ${data.jobs.length} vacancies.`}
        actions={<button className="btn-navy" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export CSV ({rows.length})</button>}
      />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter by status">
        {[['', 'All', data.apps.length], ...APPLICATION_STATUS_KEYS.map((k) => [k, APPLICATION_STATUSES[k].label, counts[k]])].map(([k, label, n]) => (
          <button key={k || 'all'} role="tab" aria-selected={filters.status === k} onClick={() => setFilter('status', k)} className={cx('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition', filters.status === k ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 ring-1 ring-line hover:bg-mist')}>
            {label} <span className={cx('rounded-full px-1.5 text-xs', filters.status === k ? 'bg-white/20' : 'bg-mist')}>{n}</span>
          </button>
        ))}
      </div>

      <div className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_1fr_1fr_auto]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search applicants</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input type="search" className="input pl-10" placeholder="Search name, email, phone or reference…" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
        </label>
        <select className="input" aria-label="Filter by vacancy" value={filters.jobId} onChange={(e) => setFilter('job', e.target.value)}>
          <option value="">All vacancies</option>
          {data.jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="input" aria-label="Filter by department" value={filters.department} onChange={(e) => setFilter('dept', e.target.value)}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="input" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select>
        {active && <button className="btn-ghost" onClick={() => setParams({}, { replace: true })}><X className="h-4 w-4" /> Clear</button>}
      </div>

      <div className="mt-4">
        {!rows.length ? (
          <EmptyState icon={Users} title="No applicants match these filters">Try clearing the search or choosing a different status.</EmptyState>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card hidden overflow-hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wider text-navy-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Applicant</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Position</th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold lg:table-cell">Experience</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Submitted</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((a) => (
                    <tr key={a.id} className="cursor-pointer hover:bg-mist/60" onClick={() => navigate(`/admin/applications/${a.id}?${params}`)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.fullName} className="h-9 w-9 text-xs" />
                          <div className="min-w-0">
                            <Link to={`/admin/applications/${a.id}?${params}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-navy-900 hover:text-emerald-700">{a.fullName}</Link>
                            <p className="truncate text-xs text-navy-400">{a.email} · {a.reference}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5"><p className="font-medium text-navy-800">{a.jobTitle}</p><p className="text-xs text-navy-400">{a.department}</p></td>
                      <td className="hidden px-3 py-3.5 text-navy-600 lg:table-cell">{a.experience}</td>
                      <td className="px-3 py-3.5 text-navy-600">{formatDate(a.createdAt)}</td>
                      <td className="px-3 py-3.5"><StatusBadge status={a.status} /></td>
                      <td className="px-3 py-3.5 text-right"><ChevronRight className="inline h-4 w-4 text-navy-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {rows.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/applications/${a.id}?${params}`} className="card flex items-center gap-3 p-4">
                    <Avatar name={a.fullName} className="h-10 w-10 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-900">{a.fullName}</p>
                      <p className="truncate text-xs text-navy-500">{a.jobTitle} · {formatDate(a.createdAt)}</p>
                      <div className="mt-1.5"><StatusBadge status={a.status} /></div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-navy-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {selected && <ApplicationDrawer app={selected} onSaved={reload} onClose={() => navigate(`/admin/applications?${params}`)} />}
    </>
  );
}
