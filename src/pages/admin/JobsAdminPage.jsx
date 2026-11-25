import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Eye, Globe, Archive, FileEdit, MapPin, Clock, Users, Briefcase, Trash2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { DEPARTMENTS, EMPLOYMENT_TYPES, LOCATIONS, JOB_STATUSES } from '../../lib/constants.js';
import { AdminPageHeader } from '../../components/layout/AdminLayout.jsx';
import { PageLoader, StatusBadge, Modal, Field, Spinner, EmptyState, useToast } from '../../components/ui/index.jsx';
import { cx, formatDate, formatSalary } from '../../lib/utils.js';

const BLANK = {
  title: '', department: '', location: '', employmentType: 'Full-time', salaryMin: '', salaryMax: '', summary: '',
  responsibilities: [''], qualifications: [''], niceToHave: [], status: 'draft', closesAt: '',
};

function ListEditor({ label, items, onChange, error, placeholder }) {
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="space-y-2">
        {items.map((x, i) => (
          <div key={i} className="flex gap-2">
            <input className={cx('input', error && !x && 'input-error')} value={x} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} aria-label={`${label} ${i + 1}`} />
            <button type="button" className="btn-ghost px-2.5" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} disabled={items.length === 1 && label !== 'Nice to have'}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => onChange([...items, ''])}><Plus className="h-3.5 w-3.5" /> Add item</button>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function JobEditor({ job, onClose }) {
  const toast = useToast();
  const [v, setV] = useState(() => ({ ...BLANK, ...job, salaryMin: job?.salaryMin ?? '', salaryMax: job?.salaryMax ?? '', closesAt: job?.closesAt?.slice(0, 10) ?? '', niceToHave: job?.niceToHave ?? [] }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const save = async (status) => {
    setSaving(true);
    setErrors({});
    try {
      await api.saveJob({ ...v, status: status || v.status });
      toast(job?.id ? 'Vacancy updated' : status === 'published' ? 'Vacancy published to the careers site' : 'Draft vacancy saved');
      onClose(true);
    } catch (e) {
      setErrors(e.fieldErrors || {});
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={() => onClose(false)}
      title={job?.id ? `Edit vacancy` : 'Create a new vacancy'}
      size="max-w-3xl"
      footer={
        <>
          <button className="btn-outline" onClick={() => onClose(false)}>Cancel</button>
          {!job?.id && <button className="btn-outline" disabled={saving} onClick={() => save('draft')}>Save as draft</button>}
          <button className="btn-primary" disabled={saving} onClick={() => save(job?.id ? undefined : 'published')}>
            {saving && <Spinner className="h-4 w-4" />} {job?.id ? 'Save changes' : 'Publish vacancy'}
          </button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <Field label="Job title" required error={errors.title}>
          {(p) => <input {...p} className={cx('input', errors.title && 'input-error')} value={v.title} onChange={set('title')} maxLength={120} placeholder="e.g. Senior Data Engineer" />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Department" required error={errors.department}>
            {(p) => <select {...p} className={cx('input', errors.department && 'input-error')} value={v.department} onChange={set('department')}><option value="">Select…</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>}
          </Field>
          <Field label="Location" required error={errors.location}>
            {(p) => <select {...p} className={cx('input', errors.location && 'input-error')} value={v.location} onChange={set('location')}><option value="">Select…</option>{LOCATIONS.map((d) => <option key={d}>{d}</option>)}</select>}
          </Field>
          <Field label="Employment type" required error={errors.employmentType}>
            {(p) => <select {...p} className="input" value={v.employmentType} onChange={set('employmentType')}>{EMPLOYMENT_TYPES.map((d) => <option key={d}>{d}</option>)}</select>}
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Salary min (USD / yr)" error={errors.salaryMin}>
            {(p) => <input {...p} type="number" min="0" step="1000" className="input" value={v.salaryMin} onChange={set('salaryMin')} />}
          </Field>
          <Field label="Salary max (USD / yr)" error={errors.salaryMax}>
            {(p) => <input {...p} type="number" min="0" step="1000" className={cx('input', errors.salaryMax && 'input-error')} value={v.salaryMax} onChange={set('salaryMax')} />}
          </Field>
          <Field label="Application deadline">
            {(p) => <input {...p} type="date" className="input" value={v.closesAt} onChange={set('closesAt')} />}
          </Field>
        </div>
        <Field label="Summary" required error={errors.summary}>
          {(p) => <textarea {...p} rows={3} className={cx('input', errors.summary && 'input-error')} value={v.summary} onChange={set('summary')} maxLength={600} />}
        </Field>
        <ListEditor label="Responsibilities" items={v.responsibilities} onChange={set('responsibilities')} error={errors.responsibilities} placeholder="e.g. Own the quarterly planning process" />
        <ListEditor label="Qualifications" items={v.qualifications} onChange={set('qualifications')} error={errors.qualifications} placeholder="e.g. 3+ years of relevant experience" />
        <ListEditor label="Nice to have" items={v.niceToHave.length ? v.niceToHave : ['']} onChange={set('niceToHave')} placeholder="Optional" />
        {job?.id && (
          <Field label="Status">
            {(p) => <select {...p} className="input" value={v.status} onChange={set('status')}>{Object.entries(JOB_STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>}
          </Field>
        )}
      </form>
    </Modal>
  );
}

export default function JobsAdminPage() {
  useDocumentTitle('Vacancies');
  const toast = useToast();
  const { data: jobs, loading, error, reload } = useAsync(() => api.listJobs(), []);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('');
  if (loading) return <PageLoader />;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const setStatus = async (job, status) => {
    await api.setJobStatus(job.id, status);
    toast(status === 'published' ? `“${job.title}” is now live` : status === 'closed' ? `“${job.title}” closed — no longer accepting applications` : `“${job.title}” moved to drafts`);
    reload();
  };
  const shown = jobs.filter((j) => !tab || j.status === tab);

  return (
    <>
      <AdminPageHeader
        title="Vacancies"
        description="Create, edit, publish and close job openings. Published roles appear on the careers site immediately."
        actions={<button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New vacancy</button>}
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter vacancies">
        {[['', 'All'], ...Object.entries(JOB_STATUSES).map(([k, s]) => [k, s.label])].map(([k, l]) => (
          <button key={k || 'all'} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold', tab === k ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 ring-1 ring-line hover:bg-mist')}>
            {l} <span className="ml-1 opacity-70">{jobs.filter((j) => !k || j.status === k).length}</span>
          </button>
        ))}
      </div>
      {!shown.length ? (
        <EmptyState icon={Briefcase} title="No vacancies here yet" action={<button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New vacancy</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((j) => (
            <article key={j.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-navy-900">{j.title}</h2>
                  <p className="text-sm text-navy-500">{j.department}</p>
                </div>
                <StatusBadge kind="job" status={j.status} />
              </div>
              <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                <li className="chip"><MapPin className="h-3 w-3" />{j.location}</li>
                <li className="chip"><Clock className="h-3 w-3" />{j.employmentType}</li>
                {formatSalary(j) && <li className="chip">{formatSalary(j)}</li>}
                <li className="chip"><Users className="h-3 w-3" />{j.applicationCount} applicants</li>
              </ul>
              <p className="mt-3 text-xs text-navy-400">{j.postedAt ? `Published ${formatDate(j.postedAt)}` : 'Not yet published'}{j.closesAt ? ` · Deadline ${formatDate(j.closesAt)}` : ''}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <button className="btn-outline btn-sm" onClick={() => setEditing(j)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                {j.status !== 'published' && <button className="btn-sm btn bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setStatus(j, 'published')}><Globe className="h-3.5 w-3.5" /> Publish</button>}
                {j.status === 'published' && <button className="btn-outline btn-sm" onClick={() => setStatus(j, 'closed')}><Archive className="h-3.5 w-3.5" /> Close</button>}
                {j.status === 'published' && <Link className="btn-ghost btn-sm" to={`/jobs/${j.slug}`} target="_blank"><Eye className="h-3.5 w-3.5" /> View live</Link>}
                {j.status === 'closed' && <button className="btn-ghost btn-sm" onClick={() => setStatus(j, 'draft')}><FileEdit className="h-3.5 w-3.5" /> Move to draft</button>}
                {j.applicationCount > 0 && <Link className="btn-ghost btn-sm" to={`/admin/applications?job=${j.id}`}><Users className="h-3.5 w-3.5" /> Applicants</Link>}
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && <JobEditor job={editing.id ? editing : null} onClose={(saved) => { setEditing(null); if (saved) reload(); }} />}
    </>
  );
}
